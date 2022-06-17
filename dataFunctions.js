const axios = require('axios');
const Discord = require('discord.js');

const dexscreenerUrl = 'http://api.dexscreener.com/latest/dex/pairs/optimism/';
const velodromeApiUrl = 'https://api.velodrome.finance/api/v1/pairs'

const { pools, commands } = require('./constants.js');

const onChainFunctions = require('./onChainFunctions.js');


module.exports = {
  // return live VELO price from CoinGecko
  help: function(msg) {

  },
  getUSDPrice: async function(msg) {

    let poolInfo = await axios.get(dexscreenerUrl + pools[0].addr);
    let tokenPrice = poolInfo.data.pairs[0].priceNative;

    const geckoURL = 'http://api.coingecko.com/api/v3/coins/velodrome-finance';
    let tokenInfo2 = await axios.get(geckoURL);
    // Coingecko uses Uniswap pools rather than VELO/USDC on VELO to price is off
    //let tokenPrice = tokenInfo.data.market_data.current_price.usd;
    let tokenImg = tokenInfo2.data.image.small;
    
    console.log(`[*] Price of VELO requested: $${tokenPrice}`);

    const embed = new Discord.MessageEmbed()
      .setTitle('VELO Price')
      .setColor('#016962')
      .setDescription(`**$${tokenPrice}**`)
      .setThumbnail(tokenImg)
      .setTimestamp()
      .setFooter({ text: 'Source: Dexscreener'});

    return msg.channel.send({ embeds: [embed] });
  },
  getMarketCap: async function(msg) {

    const geckoURL = 'http://api.coingecko.com/api/v3/coins/velodrome-finance';
    let tokenInfo = await axios.get(geckoURL);
    let tokenImg = tokenInfo.data.image.small;
    let fdv = (tokenInfo.data.market_data.fully_diluted_valuation.usd).toLocaleString("en", {}); 
    
    console.log(`[*] Marketcap of VELO Requested: $${fdv}`);

    const embed = new Discord.MessageEmbed()
      .setTitle('VELO Marketcap')
      .setColor('#016962')
      .setDescription(`**$${fdv}**`)
      .setThumbnail(tokenImg)
      .setTimestamp()
      .setFooter({ text: 'Source: Coingecko' })

    return msg.channel.send({ embeds: [embed] });

  },
  getTotalSupply: async function(msg) {
    
    let { totalSupply, veTotalSupply, percentageLocked } = await onChainFunctions.getTotalSupply();
  
    const geckoURL = 'http://api.coingecko.com/api/v3/coins/velodrome-finance';
    let tokenInfo = await axios.get(geckoURL);
    let tokenImg = tokenInfo.data.image.small;

    const embed = new Discord.MessageEmbed()
      .setTitle('VELO Supply')
      .setColor('#016962')
      .addField('Total Supply', `${totalSupply.toLocaleString('en', {})}`, true)
      .addField('Total veVELO', `${veTotalSupply.toLocaleString('en', {})}`, true)
      .addField('Percentage Locked', `${percentageLocked}%`, true)
      .setThumbnail(tokenImg)
      .setTimestamp();

    return msg.channel.send({ embeds: [embed] })
  },
  getPoolList: function(msg) {
    
    let poolList = [];
    
    for (i=0; i < pools.length; i++) {
      poolList.push(pools[i].arg);
    }
    
    let poolListFull = String(poolList.map((i) => `${poolList.indexOf(i)+1}. ${i}`).join("\n"));
    
    console.log('[*] List of pools requested');
    
    const embed = new Discord.MessageEmbed()
      //.setTitle('🏊')
      .addField('Pools', '\`\`\`' + poolListFull + '\`\`\`', true);

    return msg.channel.send({ embeds: [embed] });
  },
  getPoolInfo: async function (msg, arg) {
    // return info for selected pool

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
  }
}
