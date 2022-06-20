const axios = require('axios');
const Discord = require('discord.js');

const dexscreenerUrl = 'http://api.dexscreener.com/latest/dex/pairs/optimism/';
const velodromeApiUrl = 'https://api.velodrome.finance/api/v1/pairs'

const { pools, helpList, optimisticTokenAddresses } = require('./constants.js');
const onChainFunctions = require('./onChainFunctions.js');

const getVeloThumbnail = async () => {
  const geckoUrl = 'http://api.coingecko.com/api/v3/coins/velodrome-finance';
  let tokenInfo = await axios.get(geckoUrl);
  let tokenImg = tokenInfo.data.image.small;
  return tokenImg;
}

module.exports = {
  // return list of commands
  help: function(msg) {
    console.log('[*] List of commands requested');

    return msg.channel.send(helpList);
  },
  // return current VELO USD price
  getUSDPrice: async function(msg) {

    let poolInfo = await axios.get(dexscreenerUrl + pools[0].addr);
    let tokenPrice = poolInfo.data.pairs[0].priceNative;

    console.log(`[*] Price of VELO requested: $${tokenPrice}`);

    const embed = new Discord.MessageEmbed()
      .setTitle('VELO Price')
      .setColor('#016962')
      .setDescription(`**$${tokenPrice}**`)
      .setThumbnail(await getVeloThumbnail())
      .setTimestamp()
      .setFooter({ text: 'Source: Dexscreener'});

    return msg.channel.send({ embeds: [embed] });
  },
  // return current VELO market cap from Coingecko
  getMarketCap: async function(msg) {

    const geckoURL = 'http://api.coingecko.com/api/v3/coins/velodrome-finance';
    let tokenInfo = await axios.get(geckoURL);
    let fdv = (tokenInfo.data.market_data.fully_diluted_valuation.usd).toLocaleString("en", {}); 
    
    console.log(`[*] Marketcap of VELO Requested: $${fdv}`);

    const embed = new Discord.MessageEmbed()
      .setTitle('VELO Marketcap')
      .setColor('#016962')
      .setDescription(`**$${fdv}**`)
      .setThumbnail(await getVeloThumbnail())
      .setTimestamp()
      .setFooter({ text: 'Source: Coingecko' })

    return msg.channel.send({ embeds: [embed] });

  },
  // return total supply of VELO, veVELO and % locked
  getTotalSupply: async function(msg) {
    
    let { totalSupply, veTotalSupply, percentageLocked } = await onChainFunctions.getTotalSupply();
    
    const embed = new Discord.MessageEmbed()
      .setTitle('VELO Supply')
      .setColor('#016962')
      .addField('Total Supply', `${totalSupply.toLocaleString('en', {})}`, true)
      .addField('Total veVELO', `${veTotalSupply.toLocaleString('en', {})}`, true)
      .addField('Percentage Locked', `${percentageLocked}%`, true)
      .setThumbnail(await getVeloThumbnail())
      .setTimestamp();

    return msg.channel.send({ embeds: [embed] })
  },
  // return list of pools
  getPoolList: function(msg) {
    
    let poolList = [];
    
    for (i=0; i < pools.length; i++) {
      poolList.push(pools[i].arg);
    }
    
    let poolListString = String(poolList.map((i) => `${poolList.indexOf(i)+1}. ${i}`).join("\n"));
    
    console.log('[*] List of pools requested');
    
    const embed = new Discord.MessageEmbed()
      .addField('Pools', '\`\`\`' + poolListString + '\`\`\`', true);

    return msg.channel.send({ embeds: [embed] });
  },
  // return pool daily, weekly and yearly APR
  getPoolApr: async function (msg, arg) {

    // get Velodrome API
    let veloData = await axios.get(velodromeApiUrl);
    let poolRequested = arg;

    // check if pool requested is valid
    for (let i=0; i < pools.length; i++) {
      if (pools[i].arg === arg) {

        let poolColorRef = i;

        console.log(`[!] Found ${poolRequested}`);
        let poolAddress = pools[i].addr;
        console.log(poolAddress);

        for(let i=0; i < veloData.data.data.length; i++) {

          if((veloData.data.data[i].address).toLowerCase() === (poolAddress).toLowerCase()) {  

            let apr = veloData.data.data[i].apr;
            let aprDaily = (apr / 365).toFixed(4);
            let aprWeekly = (apr / 52).toFixed(4)
            let aprYearly = apr.toFixed(2);

            console.log(`[!] APR for pool ${poolRequested} is ${apr}%`)

            const embed = new Discord.MessageEmbed()
              .setTitle(`${veloData.data.data[i].symbol} APR`)
              .setColor(pools[poolColorRef].color)
              .addFields(
                { name: 'Daily', value: aprDaily + '%', inline: true },
                { name: 'Weekly', value: aprWeekly + '%', inline: true },
                { name: 'Yearly', value: aprYearly + '%', inline: true }
              )
              .setTimestamp()
              .setFooter({ text: 'Source: Velodrome API' });

              return msg.channel.send({ embeds: [embed] });
          }
        } 
      } 
    }
        msg.reply(`Could not find ${poolRequested}, for a list of pools type !poollist`);
        return;
  },
  // retrieve the amount of tokens within a pool
  getPoolSize: async function (msg, arg) {

    let veloData = await axios.get(velodromeApiUrl);
    let poolAddress;
    let token0_address;
    let token1_address;
    let reserve0;
    let reserve1;
    let reserve0_symbol;
    let poolTitle;

    // get pool address
    for (let i=0; i < pools.length; i++) {
      if (pools[i].arg === arg) {
        poolAddress = pools[i].addr;
        break;
      }
    }

    // get pool token addresses and reserve sizes
    for (let i=0; i < veloData.data.data.length; i++) {

      if ((veloData.data.data[i].address.toLowerCase() === (poolAddress).toLowerCase())) {
        token0_address = veloData.data.data[i].token0_address;
        token1_address = veloData.data.data[i].token1_address;

        reserve0 = veloData.data.data[i].reserve0;
        reserve1 = veloData.data.data[i].reserve1;

        poolTitle = veloData.data.data[i].symbol;
        break;
      }
    }

    // get token names
    for (let i=0; i < optimisticTokenAddresses.length; i++) {

      if (optimisticTokenAddresses[i].contract.toLowerCase() === token0_address.toLowerCase()){
        reserve0_symbol = optimisticTokenAddresses[i].symbol;
      } else if (optimisticTokenAddresses[i].contract.toLowerCase() === token1_address.toLowerCase()) {
        reserve1_symbol = optimisticTokenAddresses[i].symbol;
      }
    }

    // return info to Discord
    const embed = new Discord.MessageEmbed()
      .setTitle(`${poolTitle}`)
      .addFields(
        { name: `${reserve0_symbol}`, value: `${reserve0}`, inline: true},
        { name: `${reserve1_symbol}`, value: `${reserve1}`, inline: true}
      )
      .setTimestamp()
      .setFooter({ text: 'Source: Velodrome API' });

    return msg.channel.send({ embeds: [embed] });
  },
  getPoolInfo: async function (msg, arg) {
    
    // get Velodrome API
    let veloData = await axios.get(velodromeApiUrl);
    let poolRequested = arg;

    // check if pool requested is valid
    for (let i=0; i < pools.length; i++) {
      if (pools[i].arg === arg) {

        let poolColorRef = i;

        console.log(`[!] Found ${poolRequested}`);
        let poolAddress = pools[i].addr;
        console.log(poolAddress);

        for(let i=0; i < veloData.data.data.length; i++) {

          if((veloData.data.data[i].address).toLowerCase() === (poolAddress).toLowerCase()) {  

            let apr = veloData.data.data[i].apr;
            let aprDaily = (apr / 365).toFixed(4);
            let aprWeekly = (apr / 52).toFixed(4)
            let aprYearly = apr.toFixed(2);

            let token0_address = veloData.data.data[i].token0_address;
            let token1_address = veloData.data.data[i].token1_address;
    
            let reserve0 = veloData.data.data[i].reserve0;
            let reserve1 = veloData.data.data[i].reserve1;
    
            let poolTitle = veloData.data.data[i].symbol;

            let reserve0_symbol;
            let reserve1_symbol;

            for (let i=0; i < optimisticTokenAddresses.length; i++) {

              if (optimisticTokenAddresses[i].contract.toLowerCase() === token0_address.toLowerCase()){
                reserve0_symbol = optimisticTokenAddresses[i].symbol;
              } else if (optimisticTokenAddresses[i].contract.toLowerCase() === token1_address.toLowerCase()) {
                reserve1_symbol = optimisticTokenAddresses[i].symbol;
              }
            }

            console.log(`[!] APR for pool ${poolRequested} is ${apr}%`)

            const embed = new Discord.MessageEmbed()
              .setTitle(`${veloData.data.data[i].symbol} Pool Info`)
              .setColor(pools[poolColorRef].color)
              .addFields(
                { name: 'Daily', value: aprDaily + '%', inline: true },
                { name: 'Weekly', value: aprWeekly + '%', inline: true },
                { name: 'Yearly', value: aprYearly + '%', inline: true },
                { name: `${reserve0_symbol}`, value: `${reserve0}`, inline: true},
                { name: `${reserve1_symbol}`, value: `${reserve1}`, inline: true}
              )
              .setTimestamp()
              .setFooter({ text: 'Source: Velodrome API' });

              return msg.channel.send({ embeds: [embed] });
          }
        } 
      } 
    }
  },
  getEpoch: async function(msg) {
    // to implement
  }
}
