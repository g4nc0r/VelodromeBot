const axios = require('axios');
const Discord = require('discord.js');
const { Canvas, Image } = require('canvas');
const mergeImages = require ('merge-images');

const { veloUsdcPoolAddress, tokenColors, helpList, stables, peggedExceptions, dexscreenerUrl, velodromeApiUrl, veloFooterIcon, opFooterIcon, coingeckoFooterIcon, dexscreenerFooterIcon } = require('./constants.js');
const onChainFunctions = require('./onChainFunctions.js');

// array containing pool info pulled from Velodrome API
let poolsArray = [];
let stablePoolsArray = [];
let volatilePoolsArray = [];

// velodrome API call
const getVelodromeApiData = async () => {
  let veloData = await axios.get(velodromeApiUrl);
  let vd = veloData.data.data;
  return vd;
}

// retrieve Velodrome thumbnail
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

// return merged pool tokens icon thumbnail
const getMergedThumbnail = async (arg0, arg1) => {
  let token0Img;
  let token1Img;

  const geckoUrl = 'http://api.coingecko.com/api/v3/coins/';

  for (let i=0; i < tokenColors.length; i++) {
    if (tokenColors[i].arg === arg0) {
      let token0Url = geckoUrl + tokenColors[i].id;
      let token0Info = await axios.get(token0Url);
      token0Img = token0Info.data.image.small;
    }

    if (tokenColors[i].arg === arg1) {
      let token1Url = geckoUrl + tokenColors[i].id;
      let token1Info = await axios.get(token1Url);
      token1Img = token1Info.data.image.small;
    }
  }

  let b64 = await mergeImages([ {src: token1Img, x: 40, y: 0}, {src: token0Img, x:0, y:0}], { width: 100, height: 55, Canvas: Canvas, Image: Image });
  let b64StrippedHeader = b64.split(';base64,').pop();
  return b64StrippedHeader;
}

// get token color for embed
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

  await getStablePools(vd);
  await getVolatilePools(vd);

}

// get sAMM pools only
const getStablePools = async(velodromeApiCall) => {
  let vd = velodromeApiCall;

  stablePoolsArray = [];
  
  for (let i=0; i < vd.length; i++) {
    if (vd[i].symbol.charAt(0) === 's') {

      if ((stables.includes(vd[i].token0.symbol.toLowerCase()) && stables.includes(vd[i].token1.symbol.toLowerCase())) ||
        (peggedExceptions.includes(vd[i].token0.symbol.toLowerCase()) && peggedExceptions.includes(vd[i].token1.symbol.toLowerCase()))
      ) {
        stablePoolsArray.push({
          type: 'stable',
          arg0: vd[i].token0.symbol.toLowerCase() + '/' + vd[i].token1.symbol.toLowerCase(),
          arg1: vd[i].token1.symbol.toLowerCase() + '/' + vd[i].token0.symbol.toLowerCase(),
          name: vd[i].symbol,
          addr: vd[i].address
        });
      }
    }
  }
}

// get vAMM pools only
const getVolatilePools = async(velodromeApiCall) => {
  let vd = velodromeApiCall;

  volatilePoolsArray = [];
  
  for (let i=0; i < vd.length; i++) {
    if (vd[i].symbol.charAt(0) === 'v') {

      if (!(stables.includes(vd[i].token0.symbol.toLowerCase()) && stables.includes(vd[i].token1.symbol.toLowerCase())) &&
      !((vd[i].token0.symbol.toLowerCase()).includes('vamm-') || (vd[i].token0.symbol.toLowerCase()).includes('samm-')) &&
      !((vd[i].token1.symbol.toLowerCase()).includes('vamm-') || (vd[i].token1.symbol.toLowerCase()).includes('samm-')) &&
      !(peggedExceptions.includes(vd[i].token0.symbol.toLowerCase()) && peggedExceptions.includes(vd[i].token1.symbol.toLowerCase()))
      ) 
      {

        volatilePoolsArray.push({ 
            type: 'volatile',
            arg0: vd[i].token0.symbol.toLowerCase() + '/' + vd[i].token1.symbol.toLowerCase(),
            arg1: vd[i].token1.symbol.toLowerCase() + '/' + vd[i].token0.symbol.toLowerCase(),
            name: vd[i].symbol,
            addr: vd[i].address
        });
      }
    }
  }
}

module.exports = {
  // return list of commands
  help: function(msg) {
    console.log('\x1b[31m%s\x1b[0m', '[?] !help - user requested list of commands');
    return msg.channel.send(helpList);
  },
  // return current VELO USD price
  getVeloUsdPrice: async function(msg) {

    let poolInfo = await axios.get(dexscreenerUrl + veloUsdcPoolAddress);
    let tokenPrice = poolInfo.data.pairs[0].priceNative;

    console.log('\x1b[32m%s\x1b[0m', `[$] !price - user requested price of VELO: $${tokenPrice}`);

    const embed = new Discord.MessageEmbed()
      .setTitle('🚴‍♂️ VELO Price')
      .setColor(tokenColors[0].color)
      .setDescription(`> **$${tokenPrice}**`)
      .setThumbnail(await getVeloThumbnail())
      .setTimestamp()
      .setFooter({ text: 'Source: Dexscreener', iconURL: dexscreenerFooterIcon });

    return msg.channel.send({ embeds: [embed] });
  },
  // return current VELO market cap from Coingecko
  getMarketCap: async function(msg) {

    const geckoURL = 'http://api.coingecko.com/api/v3/coins/velodrome-finance';
    let tokenInfo = await axios.get(geckoURL);
    let fdv = (tokenInfo.data.market_data.fully_diluted_valuation.usd).toLocaleString("en", {}); 
    
    console.log('\x1b[32m%s\x1b[0m', `[$] !marketcap - User requested marketcap of VELO: $${fdv}`);

    const embed = new Discord.MessageEmbed()
      .setTitle('🚵 VELO Marketcap')
      .setColor(tokenColors[0].color)
      .setDescription(`> **$${fdv}**`)
      .setThumbnail(await getVeloThumbnail())
      .setTimestamp()
      .setFooter({ text: 'Source: Coingecko', iconURL: coingeckoFooterIcon })

    return msg.channel.send({ embeds: [embed] });

  },
  // return total supply of VELO, veVELO and % locked
  getTotalSupply: async function(msg) {
    
    let { totalSupply, veTotalSupply, percentageLocked } = await onChainFunctions.getTotalSupply();

    console.log('\x1b[34m%s\x1b[0m', `[*] !supply - user requested total supply.VELO: ${totalSupply.toFixed(2)} veVELO: ${veTotalSupply.toFixed(2)} %locked: ${percentageLocked}`);
    
    const embed = new Discord.MessageEmbed()
      .setTitle('🚵 VELO Supply')
      .setColor(tokenColors[0].color)
      .addFields(              
        { name: 'Total Supply', value: 
          `> 🚴🏻‍♂️ **VELO :**  ${totalSupply.toLocaleString('en', {})}\n` +
          `> 🚴 **veVELO :**  ${totalSupply.toLocaleString('en', {})}\n` +
          `> 🚴🏻‍♂️ **% Locked :** ${percentageLocked}%`
        })
      .setThumbnail(await getVeloThumbnail())
      .setFooter({ text: 'Source: Optimism', iconURL: opFooterIcon })
      .setTimestamp();

    return msg.channel.send({ embeds: [embed] })
  },
  // return list of pools
  getPoolList: async function(msg) {

    await getPools();
    let stablePoolList = [];
    let volatilePoolList = [];

    console.log('\x1b[34m%s\x1b[0m', '[?] getPoolsList called');      
    
    for (i=0; i < stablePoolsArray.length; i++) {
      stablePoolList.push(stablePoolsArray[i].arg0);
    }

    for (i=0; i < volatilePoolsArray.length; i++) {
      volatilePoolList.push(volatilePoolsArray[i].arg0);
    }
    
    let stablePoolListString = String(stablePoolList.map((i) => `${stablePoolList.indexOf(i)+1}. ${i}`).join("\n"));
    let volatilePoolListString = String(volatilePoolList.map((i) => `${volatilePoolList.indexOf(i)+1}. ${i}`).join("\n"));
    
    const embed = new Discord.MessageEmbed()
      .setTitle('🚵 Pools List')
      .setColor('#4862d8')
      .addField('🚴‍♂️ sAMM - Stable Pools', '\`\`\`' + stablePoolListString + '\`\`\`', true)
      .addField('🚴‍♂️ vAMM - Volatile Pools', '\`\`\`' + volatilePoolListString + '\`\`\`', true);
      
    return msg.channel.send({ embeds: [embed] });
  },
  // return list of sAMM stable pools
  getStablePoolList: async function(msg) {
    let vd = await getVelodromeApiData();
    let stablePoolList = [];

    await getStablePools(vd);

    for (i=0; i < stablePoolsArray.length; i++) {
      stablePoolList.push(stablePoolsArray[i].arg0);
    }

    let stablePoolListString = String(stablePoolList.map((i) => `${stablePoolList.indexOf(i)+1}. ${i}`).join("\n"));

    const embed = new Discord.MessageEmbed()
      .setColor('#4862d8')
      .addField('🚴‍♂️ sAMM - Stable Pools', '\`\`\`' + stablePoolListString + '\`\`\`', true);

    return msg.channel.send({ embeds: [embed] });
  },
  // return list of vAMM volatile pools
  getVolatilePoolList: async function(msg) {
    let vd = await getVelodromeApiData();
    let volatilePoolList = [];

    await getVolatilePools(vd);

    for (i=0; i < volatilePoolsArray.length; i++) {
      volatilePoolList.push(volatilePoolsArray[i].arg0);
    }

    let volatilePoolsListString = String(volatilePoolList.map((i) => `${volatilePoolList.indexOf(i)+1}. ${i}`).join("\n"));

    const embed = new Discord.MessageEmbed()
      .setColor('#4862d8')
      .addField('🚴‍♂️ vAMM - Volatile Pools', '\`\`\`' + volatilePoolsListString + '\`\`\`', true);

    return msg.channel.send({ embeds: [embed] });
  },
  // return list of pools containing a specified token
  getTokenPoolList: async function(msg, arg) {

    arg = arg.toLowerCase();

    let stablePoolList = [];
    let volatilePoolList = [];
    await getPools();

    let allPoolsArray = stablePoolsArray.concat(volatilePoolsArray);
    
    console.log('\x1b[34m%s\x1b[0m', `[?] getTokenPoolList called - arg: ${arg}`);

    for (let i = 0; i < allPoolsArray.length; i++) {
      if (allPoolsArray[i].arg0.includes(arg) || allPoolsArray[i].arg1.includes(arg)) {
        // retrieve stable pools containing token
        for (i=0; i < stablePoolsArray.length; i++) {
          if ((stablePoolsArray[i].arg0.includes(arg)) || (stablePoolsArray[i].arg1.includes(arg))) {
            stablePoolList.push(stablePoolsArray[i].arg0);
          }
        }
      
        // retrieve volatile pools containing token
        for (i=0; i < volatilePoolsArray.length; i++) {
          if ((volatilePoolsArray[i].arg0.includes(arg)) || (volatilePoolsArray[i].arg1.includes(arg))) {
            volatilePoolList.push(volatilePoolsArray[i].arg0);
          }
        }

        let volatilePoolListString = '';
        let stablePoolListString = '';

        if (stablePoolList.length !== 0) {
          stablePoolListString = `sAMM - Stable Pools\n----------------------\n` + String(stablePoolList.map((i) => `${stablePoolList.indexOf(i)+1}. ${i}`).join("\n"));
        }

        if (volatilePoolList.length !== 0) { 
          volatilePoolListString = `\nvAMM - Volatile Pools\n----------------------\n` + String(volatilePoolList.map((i) => `${volatilePoolList.indexOf(i)+1}. ${i}`).join("\n"));
        }



        const embed = new Discord.MessageEmbed()
          //.setTitle(`🚴‍♂️ ${arg.toUpperCase()} Pools`)
          .setColor(await getTokenColor(arg))
          .setThumbnail(await getVeloThumbnail(arg))
          .addField(`🚴‍♂️ ${arg.toUpperCase()} Pools`, '\`\`\`' + stablePoolListString + `\n` + volatilePoolListString + '\`\`\`', true)
          //.addField(`🚴‍♂️ ${arg.toUpperCase()} Stable Pools`, '\`\`\`' + volatilePoolListString + '\`\`\`', true);

        return msg.channel.send({ embeds: [embed] });
      }
    }
    msg.reply('Could not find token, please try again');
    return;
  },
  // return pool daily, weekly and yearly APR
  getPoolApr: async function (msg, arg) {

    arg = arg.toLowerCase();

    await getPools();

    let poolAddress;

    // get Velodrome API
    let vd = await getVelodromeApiData();
    
    let allPoolsArray = stablePoolsArray.concat(volatilePoolsArray);
    // check if pool requested is valid

    for (let i=0; i < allPoolsArray.length; i++) {
      if ((allPoolsArray[i].arg0 === arg) || (allPoolsArray[i].arg1 === arg)) {
        poolAddress = allPoolsArray[i].addr;
        
        for (let i=0; i < vd.length; i++) {
          if((vd[i].address).toLowerCase() === (poolAddress).toLowerCase()) {  

            let apr = vd[i].apr;
            let aprDaily = (apr / 365).toFixed(2);
            let aprWeekly = (apr / 52).toFixed(2)
            let aprYearly = apr.toFixed(2);

            console.log('\x1b[35m%s\x1b[0m', `[%] !apr ${arg} - user requested pool APR:  ${apr.toFixed(2)}%`)

            const img64 = await getMergedThumbnail(vd[i].token0.symbol.toLowerCase(), vd[i].token1.symbol.toLowerCase());
            const buffer = Buffer.from(img64, 'base64');
            const att = new Discord.MessageAttachment(buffer, 'buffer.png');

            const embed = new Discord.MessageEmbed()
              .setTitle(`${vd[i].symbol} APR`)
              .setColor(await getTokenColor(vd[i].token0.symbol.toLowerCase()))
              .addFields(
                { name: '☄️ APR', value:
                  '> 🔹 **' + aprDaily + '%**' + ' *daily*\n' +
                  '> 🔹 **' + aprWeekly + '%**' + ' *weekly*\n' +
                  '> 🔹 **' + aprYearly + '%**' + ' *yearly*'
                })
              .setThumbnail('attachment://buffer.png')
              .setTimestamp()
              .setFooter({ text: 'Source: Velodrome API', iconURL: veloFooterIcon });

              return msg.channel.send({ embeds: [embed], files: [att] });
          }
        }
      }
    } 
    msg.reply(`Could not find ${arg}, for a list of pools type \`!poollist\``);
    return;
  },
  // return top 5 pools by APR
  getTopFiveApr: async function (msg) {

    let vd = await getVelodromeApiData();
 
    let aprArray = [];
    let returnObjectArray = [];

    for (let i=0; i < vd.length; i++) {
      aprArray.push(vd[i].apr); 
    }

    let topFive = aprArray.sort(function(a, b){return b-a}).slice(0,5);

    console.log(topFive);

    for (let l=0; l < topFive.length; l++) {
      for (let i=0; i < vd.length; i++) {
        if (topFive[l] === vd[i].apr) {
          returnObjectArray.push({
            symbol: vd[i].symbol,
            daily: vd[i].apr / 365,
            weekly: vd[i].apr / 52,
            yearly: vd[i].apr
          })
        }
      }
    }

    console.log(returnObjectArray)

    let top5AprString = '';

    for (key in returnObjectArray) {
      top5AprString += '*' + (String(returnObjectArray[key].symbol) + '*\n**' + String(returnObjectArray[key].yearly.toFixed(2)) + '%**\n'/* + '\n----------------\n'*/);
    }

    console.log(top5AprString);

    //let top5AprString = String(returnObjectArray.map((i) => `${returnObjectArray.indexOf(i)+1}. ${returnObjectArray[i]}`).join("\n"));

    embed = new Discord.MessageEmbed()
      .setTitle('🚵🏻‍♂️ Top 5')
      .addField('Pools by APR', /*'\`\`\`' +*/ top5AprString /*+ '\`\`\`'*/, true)
      .setThumbnail(await getVeloThumbnail())
      .setFooter({ text: 'Source: Velodrome API' });

    return msg.channel.send({ embeds: [embed ]});
  },
  // retrieve the amount of tokens within a pool
  getPoolSize: async function (msg, arg) {

    arg = arg.toLowerCase();

    await getPools();

    let allPoolsArray = stablePoolsArray.concat(volatilePoolsArray);

    // get pool address
    for (let i=0; i < allPoolsArray.length; i++) {
      if ((allPoolsArray[i].arg0 === arg) || (allPoolsArray[i].arg1 === arg)) {

        let reserve0;
        let reserve1;
        let token0_symbol;
        let token1_symbol;
        let poolTitle;
        let poolAddress = allPoolsArray[i].addr;

        let vd = await getVelodromeApiData();

        // get pool token addresses and reserve sizes
        for (let i=0; i < vd.length; i++) {

          if ((vd[i].address.toLowerCase() === (poolAddress).toLowerCase())) {

            token0_symbol = vd[i].token0.symbol.toLowerCase();
            token1_symbol = vd[i].token1.symbol.toLowerCase();

            reserve0 = vd[i].reserve0;
            reserve1 = vd[i].reserve1;

            poolTitle = vd[i].symbol;
            break;
          }
        }

        console.log('\x1b[35m%s\x1b[0m', `[%] !poolsize ${arg} - user requested poolsize: ${token0_symbol}: ${reserve0.toFixed(2)} ${token1_symbol}: ${reserve1.toFixed(2)}`);

        const img64 = await getMergedThumbnail(token0_symbol, token1_symbol);
        const buffer = Buffer.from(img64, 'base64');
        const att = new Discord.MessageAttachment(buffer, 'buffer.png');

        // return info to Discord
        const embed = new Discord.MessageEmbed()
          .setTitle(`${poolTitle} Pool Size`)
          .setColor(await getTokenColor(token0_symbol.toLowerCase()))
          .addFields(
            { name: '🪙 TVL', value: 
            `> 🚴🏻‍♂️ **${token0_symbol.toUpperCase()} :**  ` + `${reserve0.toLocaleString("en", {})}\n` +
            `> 🚴 **${token1_symbol.toUpperCase()} :**  ` + `${reserve1.toLocaleString("en", {})}`
            })
          .setThumbnail('attachment://buffer.png')
          .setTimestamp()
          .setFooter({ text: 'Source: Velodrome API', iconURL: veloFooterIcon });

        return msg.channel.send({ embeds: [embed], files: [att] });
      }
    } 
    msg.reply(`Could not find ${arg}, for a list of pools type \`!poollist\``);
    return;
  },
  // get pool size and APR
  getPoolInfo: async function (msg, arg) {
    arg = arg.toLowerCase();

    await getPools();

    let allPoolsArray = stablePoolsArray.concat(volatilePoolsArray);

    // check if pool requested is valid
    for (let i=0; i < allPoolsArray.length; i++) {
      if ((allPoolsArray[i].arg0 === arg) || (allPoolsArray[i].arg1 === arg)) {

        let poolAddress = allPoolsArray[i].addr;
        let vd = await getVelodromeApiData();
        
        for(let i=0; i < vd.length; i++) {

          if((vd[i].address).toLowerCase() === (poolAddress).toLowerCase()) {  

            let poolTitle = vd[i].symbol;

            let reserve0 = vd[i].reserve0;
            let token0_symbol = vd[i].token0.symbol.toLowerCase();
            let reserve1 = vd[i].reserve1;
            let token1_symbol = vd[i].token1.symbol.toLowerCase();

            let apr = vd[i].apr;
            let aprDaily = (apr / 365).toFixed(2);
            let aprWeekly = (apr / 52).toFixed(2)
            let aprYearly = apr.toFixed(2);

            console.log('\x1b[36m%s\x1b[0m', `[%] !apr ${arg} - user requested poolinfo - APR: ${apr.toFixed(2)}% ${token0_symbol}: ${reserve0.toFixed(2)} ${token1_symbol}: ${reserve1.toFixed(2)}`);

            const img64 = await getMergedThumbnail(token0_symbol, token1_symbol);
            const buffer = Buffer.from(img64, 'base64');
            const att = new Discord.MessageAttachment(buffer, 'buffer.png');

            const embed = new Discord.MessageEmbed()
              .setTitle(`${poolTitle} Pool Info`)
              .setColor(await getTokenColor(token0_symbol))
              .addFields(
                { name: '☄️ APR', value:
                  '> 🔹 **' + aprDaily + '%**' + ' *daily*\n' +
                  '> 🔹 **' + aprWeekly + '%**' + ' *weekly*\n' +
                  '> 🔹 **' + aprYearly + '%**' + ' *yearly*'
                },
                { name: '🪙 TVL', value: 
                  `> 🚴🏻‍♂️ **${token0_symbol.toUpperCase()} :**  ` + `${reserve0.toLocaleString("en", {})}\n` +
                  `> 🚴 **${token1_symbol.toUpperCase()} :**  ` + `${reserve1.toLocaleString("en", {})}`
                })
              .setThumbnail('attachment://buffer.png')
              .setTimestamp()
              .setFooter({ text: 'Source: Velodrome API', iconURL: veloFooterIcon });

              return msg.channel.send({ embeds: [embed], files: [att] });
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
