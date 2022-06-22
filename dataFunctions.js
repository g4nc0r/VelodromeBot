const axios = require('axios');
const Discord = require('discord.js');

const { veloUsdcPoolAddress, tokenColors, helpList, stables } = require('./constants.js');
const onChainFunctions = require('./onChainFunctions.js');

const dexscreenerUrl = 'http://api.dexscreener.com/latest/dex/pairs/optimism/';
const velodromeApiUrl = 'https://api.velodrome.finance/api/v1/pairs'

// array containing pool info pulled from Velodrome API
let poolsArray = [];

const getVelodromeApiData = async () => {
  let veloData = await axios.get(velodromeApiUrl);
  let vd = veloData.data.data;
  return vd;
}

const getVeloThumbnail = async (arg) => {

  const geckoUrl = 'http://api.coingecko.com/api/v3/coins/';

  for (let i=0; i < tokenColors.length; i++) {
    if (tokenColors[i].arg === arg) {
      let tokenUrl = geckoUrl + tokenColors[i].id;
      let tokenInfo = await axios.get(tokenUrl);
      return tokenInfo.data.image.small;
    }
  }

  let tokenInfo = await axios.get(geckoUrl + 'velodrome-finance');
  return tokenInfo.data.image.small;
}

const getTokenColor = async (arg) => {

  let tokenColor = null;

  for (let i=0; i < tokenColors.length; i++) {
    if (tokenColors[i].arg === arg) {
      tokenColor = tokenColors[i].color;
      return tokenColor;
    }
  }
}

// reset poolsArray and repopulate with latest pool info
const getPools = async () => {
  
  let vd = await getVelodromeApiData();
  // reset poolsArray
  poolsArray = [];
  
  // iterate through all the pairs 
  for (let i=0; i < vd.length; i++) {
    // if the pair is a stable pool and both of the tokens are stables, add to array
    if (vd[i].symbol.charAt(0) === 's') {
      
      if ((stables.includes(vd[i].token0.symbol)) && stables.includes(vd[i].token1.symbol)) {
        
        poolsArray.push({ 
              arg: vd[i].token0.symbol.toLowerCase() + '/' + vd[i].token1.symbol.toLowerCase(),
              name: vd[i].symbol,
              addr: vd[i].address
        });
      }
    }
    
    // if the pair is a volatile pool, and the tokens are either a stable and a non-stable, and do not include one of the filters then add to array
    if (vd[i].symbol.charAt(0) === 'v') {

      if ((stables.includes(vd[i].token0.symbol)) && !(stables.includes(vd[i].token1.symbol)) && 
        !((vd[i].token0.symbol.toLowerCase()).includes('vamm-' || 'samm-')) && !((vd[i].token1.symbol.toLowerCase()).includes('vamm-' || 'samm-')) || 
        (stables.includes(vd[i].token1.symbol)) && !(stables.includes(vd[i].token0.symbol)) && 
        !((vd[i].token0.symbol.toLowerCase()).includes('vamm-' || 'samm-')) && !((vd[i].token1.symbol.toLowerCase()).includes('vamm-' || 'samm-'))) 
        {

          poolsArray.push({ 
              arg: vd[i].token0.symbol.toLowerCase() + '/' + vd[i].token1.symbol.toLowerCase(),
              name: vd[i].symbol,
              addr: vd[i].address
          });
        }
    }
  }
  // log the entries of poolsArray to console
  /*for (let i=0; i < poolsArray.length; i++) {
    console.log(
      `${poolsArray[i].arg}` + ", name: " + `${poolsArray[i].name}`
    );
  }*/
}

module.exports = {
  // return list of commands
  help: function(msg) {
    console.log('[!] !help - user requested list of commands');
    return msg.channel.send(helpList);
  },
  // return current VELO USD price
  getUSDPrice: async function(msg) {

    let poolInfo = await axios.get(dexscreenerUrl + veloUsdcPoolAddress);
    let tokenPrice = poolInfo.data.pairs[0].priceNative;

    console.log(`[$] !price - user requested price of VELO: $${tokenPrice}`);

    const embed = new Discord.MessageEmbed()
      .setTitle('🚴‍♂️ VELO Price')
      .setColor(tokenColors[0].color)
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
    
    console.log(`[*] !marketcap - User requested marketcap of VELO: $${fdv}`);

    const embed = new Discord.MessageEmbed()
      .setTitle('🚵 VELO Marketcap')
      .setColor(tokenColors[0].color)
      .setDescription(`**$${fdv}**`)
      .setThumbnail(await getVeloThumbnail())
      .setTimestamp()
      .setFooter({ text: 'Source: Coingecko' })

    return msg.channel.send({ embeds: [embed] });

  },
  // return total supply of VELO, veVELO and % locked
  getTotalSupply: async function(msg) {
    
    let { totalSupply, veTotalSupply, percentageLocked } = await onChainFunctions.getTotalSupply();

    console.log(`[*] !supply - user requested total supply.VELO: ${totalSupply.toFixed(2)} veVELO: ${veTotalSupply.toFixed(2)} %locked: ${percentageLocked}`);
    
    const embed = new Discord.MessageEmbed()
      .setTitle('🚵 VELO Supply')
      .setColor(tokenColors[0].color)
      .addField('Total Supply', `${totalSupply.toLocaleString('en', {})}`, true)
      .addField('Total veVELO', `${veTotalSupply.toLocaleString('en', {})}`, true)
      .addField('Percentage Locked', `${percentageLocked}%`, true)
      .setThumbnail(await getVeloThumbnail())
      .setTimestamp();

    return msg.channel.send({ embeds: [embed] })
  },
  // return list of pools
  getPoolList: async function(msg) {

    await getPools();
    let poolList = [];

    console.log('[*] getPoolsList called');      
    
    for (i=0; i < poolsArray.length; i++) {
      poolList.push(poolsArray[i].arg);
    }
    
    let poolListString = String(poolList.map((i) => `${poolList.indexOf(i)+1}. ${i}`).join("\n"));
        
    const embed = new Discord.MessageEmbed()
      .setColor('#4862d8')
      .addField('🚴‍♂️ Pools', '\`\`\`' + poolListString + '\`\`\`', true);

    return msg.channel.send({ embeds: [embed] });
  },
  // return list of pools containing a specified token
  getTokenPoolList: async function(msg, arg) {

    arg = arg.toLowerCase();

    await getPools();
    let poolList = [];

    console.log(`[*] getTokenPoolList called - arg: ${arg}`);

    for (i=0; i < poolsArray.length; i++) {
      if (poolsArray[i].arg.includes(arg)) {
        poolList.push(poolsArray[i].arg);
      }
    }

    if (poolList.length === 0) {
      msg.reply('Could not find token, please try again');
      return;
    }

    let poolListString = String(poolList.map((i) => `${poolList.indexOf(i)+1}. ${i}`).join("\n"));

    const embed = new Discord.MessageEmbed()
      .setColor(await getTokenColor(arg))
      .setThumbnail(await getVeloThumbnail(arg))
      .addField(`🚴‍♂️ ${arg.toUpperCase()} Pools`, '\`\`\`' + poolListString + '\`\`\`', true);

    return msg.channel.send({ embeds: [embed] });
  },
  // return pool daily, weekly and yearly APR
  getPoolApr: async function (msg, arg) {

    arg = arg.toLowerCase();

    await getPools();

    // get Velodrome API
    let vd = await getVelodromeApiData();

    // check if pool requested is valid
    for (let i=0; i < poolsArray.length; i++) {
      if (poolsArray[i].arg === arg) {

        let poolAddress = poolsArray[i].addr;

        for(let i=0; i < vd.length; i++) {

          if((vd[i].address).toLowerCase() === (poolAddress).toLowerCase()) {  

            let apr = vd[i].apr;
            let aprDaily = (apr / 365).toFixed(2);
            let aprWeekly = (apr / 52).toFixed(2)
            let aprYearly = apr.toFixed(2);

            console.log(`[%] !apr ${arg} - user requested pool APR:  ${apr.toFixed(2)}%`)

            const embed = new Discord.MessageEmbed()
              .setTitle(`🚴‍♂️ ${vd[i].symbol} APR`)
              .setColor(await getTokenColor(vd[i].token0.symbol.toLowerCase()))
              .addFields(
                { name: 'Daily', value: aprDaily + '%', inline: true },
                { name: 'Weekly', value: aprWeekly + '%', inline: true },
                { name: 'Yearly', value: aprYearly + '%', inline: true }
              )
              .setThumbnail(await getVeloThumbnail(vd[i].token0.symbol.toLowerCase()))
              .setTimestamp()
              .setFooter({ text: 'Source: Velodrome API' });

              return msg.channel.send({ embeds: [embed] });
          }
        } 
      } 
    }
        msg.reply(`Could not find ${arg}, for a list of pools type \`!poollist\``);
        return;
  },
  // retrieve the amount of tokens within a pool
  getPoolSize: async function (msg, arg) {

    arg = arg.toLowerCase();

    await getPools();

    // get pool address
    for (let i=0; i < poolsArray.length; i++) {
      if (poolsArray[i].arg === arg) {

        let reserve0;
        let reserve1;
        let token0_symbol;
        let token1_symbol;
        let poolTitle;
        let poolAddress = poolsArray[i].addr;

        let vd = await getVelodromeApiData();

        // get pool token addresses and reserve sizes
        for (let i=0; i < vd.length; i++) {

          if ((vd[i].address.toLowerCase() === (poolAddress).toLowerCase())) {

            token0_symbol = vd[i].token0.symbol;
            token1_symbol = vd[i].token1.symbol;

            reserve0 = vd[i].reserve0;
            reserve1 = vd[i].reserve1;

            poolTitle = vd[i].symbol;
            break;
          }
        }

        console.log(`[%] !poolsize ${arg} - user requested poolsize: ${token0_symbol}: ${reserve0.toFixed(2)} ${token1_symbol}: ${reserve1.toFixed(2)}`);

        // return info to Discord
        const embed = new Discord.MessageEmbed()
          .setTitle(`🚴‍♂️ ${poolTitle} Pool Size`)
          .setColor(await getTokenColor(token0_symbol.toLowerCase()))
          .addFields(
            { name: `${token0_symbol}`, value: `${reserve0.toLocaleString("en", {})}`, inline: true},
            { name: `${token1_symbol}`, value: `${reserve1.toLocaleString("en", {})}`, inline: true}
          )
          .setThumbnail(await getVeloThumbnail(token0_symbol.toLowerCase()))
          .setTimestamp()
          .setFooter({ text: 'Source: Velodrome API' });

        return msg.channel.send({ embeds: [embed] });
      }
    } 
    msg.reply(`Could not find ${arg}, for a list of pools type \`!poollist\``);
    return;
  },
  // get pool apr and size
  getPoolInfo: async function (msg, arg) {
    
    arg = arg.toLowerCase();

    await getPools();

    // check if pool requested is valid
    for (let i=0; i < poolsArray.length; i++) {
      if (poolsArray[i].arg === arg) {

        let poolAddress = poolsArray[i].addr;
        let vd = await getVelodromeApiData();
        
        for(let i=0; i < vd.length; i++) {

          if((vd[i].address).toLowerCase() === (poolAddress).toLowerCase()) {  

            let poolTitle = vd[i].symbol;

            let reserve0 = vd[i].reserve0;
            let token0_symbol = vd[i].token0.symbol;
            let reserve1 = vd[i].reserve1;
            let token1_symbol = vd[i].token1.symbol;

            let apr = vd[i].apr;
            let aprDaily = (apr / 365).toFixed(2);
            let aprWeekly = (apr / 52).toFixed(2)
            let aprYearly = apr.toFixed(2);

            console.log(`[%] !apr ${arg} - user requested poolinfo - APR: ${apr.toFixed(2)}% ${token0_symbol}: ${reserve0.toFixed(2)} ${token1_symbol}: ${reserve1.toFixed(2)}`);

            const embed = new Discord.MessageEmbed()
              .setTitle(`🚵 ${poolTitle} Pool Info`)
              .setColor(await getTokenColor(token0_symbol.toLowerCase()))
              .addFields(
                { name: 'Daily', value: aprDaily + '%', inline: true },
                { name: 'Weekly', value: aprWeekly + '%', inline: true },
                { name: 'Yearly', value: aprYearly + '%', inline: true },
                { name: `${token0_symbol}`, value: `${reserve0.toLocaleString("en", {})}`, inline: true},
                { name: `${token1_symbol}`, value: `${reserve1.toLocaleString("en", {})}`, inline: true}
              )
              .setThumbnail(await getVeloThumbnail(token0_symbol.toLowerCase()))
              .setTimestamp()
              .setFooter({ text: 'Source: Velodrome API' });

              return msg.channel.send({ embeds: [embed] });
          }
        } 
      } 
    } 
    msg.reply(`Could not find ${arg}, for a list of pools type \`!poollist\``);
    return;
  },
  getEpoch: async function(msg) {
    // to implement
  }
}
