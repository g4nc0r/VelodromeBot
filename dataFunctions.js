const axios = require('axios');
const Discord = require('discord.js');
const { Canvas, Image } = require('canvas');
const mergeImages = require ('merge-images');

const { veloUsdcPoolAddress, tokenColors, stables, peggedExceptions, helpList, staticIcons, urls } = require('./constants.js');
const onChainFunctions = require('./onChainFunctions.js');

// arrays containing pools info pulled from Velodrome API
let poolsArray = [];
let stablePoolsArray = [];
let volatilePoolsArray = [];

// velodrome API call
const getVelodromeApiData = async () => {
  let veloData = await axios.get(urls.velodromeApiUrl);
  let vd = veloData.data.data;
  return vd;
};

// retrieve thumbnail - defaults to Velodrome icon
const getVeloThumbnail = async (arg) => {

  if (arg === 'velo') {
    return staticIcons.velodromeIcon;
  }
  // current Coingecko OP icon is low res, using this temp 
  if (arg === 'op') {
    return staticIcons.optimismIcon;
  }

  for (let i=0; i < tokenColors.length; i++) {
    if (tokenColors[i].arg === arg) {
      let tokenUrl = urls.coingeckoUrl + tokenColors[i].id;
      let tokenInfo = await axios.get(tokenUrl);
      return tokenInfo.data.image.small;
    }
  }
  return staticIcons.velodromeIcon;
};

// return merged pool tokens icon thumbnail
const getMergedThumbnail = async (arg0, arg1) => {
  let token0Img;
  let token1Img;

  for (let i=0; i < tokenColors.length; i++) {
    if (tokenColors[i].arg === arg0) {
      let token0Url = urls.coingeckoUrl + tokenColors[i].id;
      let token0Info = await axios.get(token0Url);
      token0Img = token0Info.data.image.small;
    }

    if (tokenColors[i].arg === arg1) {
      let token1Url = urls.coingeckoUrl + tokenColors[i].id;
      let token1Info = await axios.get(token1Url);
      token1Img = token1Info.data.image.small;
    }
  }

  if (arg0 === 'velo') {
    token0Img = staticIcons.velodromeIcon;
  }

  if (arg1 === 'velo') {
    token1Img = staticIcons.velodromeIcon;
  }

  if (arg0 === 'op') {
    token0Img = staticIcons.optimismIcon;
  }

  if (arg1 === 'op') {
    token1Img = staticIcons.optimismIcon;
  }

  let b64 = await mergeImages([ {src: token1Img, x: 40, y: 0}, {src: token0Img, x:0, y:0}], { width: 100, height: 55, Canvas: Canvas, Image: Image });
  let b64StrippedHeader = b64.split(';base64,').pop();
  return b64StrippedHeader;
};

// get token color for embed
const getTokenColor = async (arg) => {

  let tokenColor = null;

  for (let i=0; i < tokenColors.length; i++) {
    if (tokenColors[i].arg === arg) {
      tokenColor = tokenColors[i].color;
      return tokenColor;
    }
  }
};

// reset poolsArray and repopulate with latest pool info
const getPools = async (filter) => {
  
  let vd = await getVelodromeApiData();
  poolsArray = [];

  await getStablePools(vd, filter);
  await getVolatilePools(vd, filter);

  poolsArray = stablePoolsArray.concat(volatilePoolsArray);

  return vd;
};

// get sAMM pools only
const getStablePools = async (velodromeApiCall, filter) => {
  let vd = velodromeApiCall;

  stablePoolsArray = [];
  
  for (let i=0; i < vd.length; i++) {

    if (vd[i].isStable === true) {

      if (vd[i].tvl > filter) { 

        let token0 = vd[i].token0.symbol.toLowerCase();
        let token1 = vd[i].token1.symbol.toLowerCase();

        if ((stables.includes(token0) && stables.includes(token1) ||
          (peggedExceptions.includes(token0) && peggedExceptions.includes(token1)))
        ) {
          stablePoolsArray.push({
            type: 'stable',
            arg0: token0 + '/' + token1,
            arg1: token1 + '/' + token0,
            name: vd[i].symbol,
            addr: vd[i].address,
            tvl: vd[i].tvl,
            apr: vd[i].apr
          });
        }
      }
    }
  }
};

// get vAMM pools only
const getVolatilePools = async (velodromeApiCall, filter) => {
  let vd = velodromeApiCall;

  volatilePoolsArray = [];
  
  for (let i=0; i < vd.length; i++) {

    if (vd[i].isStable === false) {

      if (vd[i].tvl > filter) {

        let token0 = vd[i].token0.symbol.toLowerCase();
        let token1 = vd[i].token1.symbol.toLowerCase();

        if (!(stables.includes(token0) && stables.includes(token1)) &&
        !((token0).includes('vamm-') || (token0).includes('samm-')) &&
        !((token1).includes('vamm-') || (token1).includes('samm-')) &&
        !(peggedExceptions.includes(token0) && peggedExceptions.includes(token1))
        ) 
        {
          volatilePoolsArray.push({ 
              type: 'volatile',
              arg0: token0 + '/' + token1,
              arg1: token1 + '/' + token0,
              name: vd[i].symbol,
              addr: vd[i].address,
              tvl: vd[i].tvl,
              apr: vd[i].apr
          });
        }
      }
    }
  }
};

module.exports = {
  // return list of commands
  help: function(msg) {
    console.log('\x1b[31m%s\x1b[0m', '[?] !help - user requested list of commands');
    return msg.channel.send(helpList);
  },
  // return current VELO USD price
  getVeloUsdPrice: async function(msg) {

    let poolInfo = await axios.get(urls.dexscreenerUrl + veloUsdcPoolAddress);
    let tokenPrice = poolInfo.data.pairs[0].priceNative;

    console.log('\x1b[32m%s\x1b[0m', `[$] !price - user requested price of VELO: $${tokenPrice}`);

    const embed = new Discord.MessageEmbed()
      .setTitle('🚴‍♂️ VELO Price')
      .setColor('#007fff')
      .setThumbnail(await getVeloThumbnail())
      .setDescription(`> **$${tokenPrice}**`)
      .setTimestamp()
      .setFooter({ text: 'Source: Dexscreener', iconURL: staticIcons.dexscreenerFooterIcon });

    return msg.channel.send({ embeds: [embed] });
  },
  // return current VELO market cap from Coingecko
  getMarketCap: async function(msg) {

    let tokenInfo = await axios.get(urls.veloCoingeckoUrl);
    let fdv = (tokenInfo.data.market_data.fully_diluted_valuation.usd).toLocaleString('en-US', {}); 

    console.log('\x1b[32m%s\x1b[0m', `[$] !marketcap - user requested marketcap of VELO: $${fdv}`);
    
    const embed = new Discord.MessageEmbed()
      .setTitle('📈 VELO Marketcap')
      .setColor('#8bc63f')
      .setThumbnail(await getVeloThumbnail())
      .setDescription(`> **$${fdv}**`)
      .setTimestamp()
      .setFooter({ text: 'Source: Coingecko', iconURL: staticIcons.coingeckoFooterIcon })

    return msg.channel.send({ embeds: [embed] });
  },
  // return total supply of VELO, veVELO and % locked
  getTotalSupply: async function(msg) {

    let { totalSupply, veTotalSupply, percentageLocked } = await onChainFunctions.getTotalSupply();

    totalSupply = totalSupply.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0});
    veTotalSupply = veTotalSupply.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    console.log('\x1b[32m%s\x1b[0m', `[$] !supply - user requested total supply - VELO: ${totalSupply} - veVELO: ${veTotalSupply} - LOCKED: ${percentageLocked}%`);

    const embed = new Discord.MessageEmbed()
      .setTitle('📊 VELO Supply')
      .setColor('#fa051d')
      .setThumbnail(await getVeloThumbnail())
      .setDescription(          
        `> 🚴🏻‍♂️ **VELO :**  ${totalSupply}\n` +
        `> 🚴 **veVELO :**  ${veTotalSupply}\n` +
        `> 🚴🏻‍♂️ **% Locked :** ${percentageLocked}%`)
      .setFooter({ text: 'Source: Optimism', iconURL: staticIcons.opFooterIcon })
      .setTimestamp();

    return msg.channel.send({ embeds: [embed] })
  },
  // return list of pools with TVL > 5000
  getPoolList: async function(msg) {

    console.log('\x1b[34m%s\x1b[0m', '[?] !pools - user called getPoolsList');    

    await getPools(2000);
    let stablePoolList = [];
    let volatilePoolList = [];
    
    for (i=0; i < stablePoolsArray.length; i++) {
      stablePoolList.push(stablePoolsArray[i].arg0);
    }

    for (i=0; i < volatilePoolsArray.length; i++) {
      volatilePoolList.push(volatilePoolsArray[i].arg0);
    }
    
    let stablePoolListString = String(stablePoolList.map((i) => `${stablePoolList.indexOf(i)+1}. ${i}`).join('\n'));
    let volatilePoolListString = String(volatilePoolList.map((i) => `${volatilePoolList.indexOf(i)+1}. ${i}`).join('\n'));
    
    const embed = new Discord.MessageEmbed()
      .setTitle('🚵 Pools List')
      .setColor('#000000')
      .addField('🚴 vAMM - Volatile Pools', '\`\`\`' + volatilePoolListString + '\`\`\`', true)
      .addField('🚴‍♂️ sAMM - Stable Pools', '\`\`\`' + stablePoolListString + '\`\`\`', true);
      
    return msg.channel.send({ embeds: [embed] });
  },
  // return unfiltered list of pools
  getAllPoolList: async function(msg) {

    console.log('\x1b[34m%s\x1b[0m', '[?] !allpools - user called getAllPoolsList');      

    await getPools(0);
    let stablePoolList = [];
    let volatilePoolList = [];
   
    for (i=0; i < stablePoolsArray.length; i++) {
      stablePoolList.push(stablePoolsArray[i].arg0);
    }

    for (i=0; i < volatilePoolsArray.length; i++) {
      volatilePoolList.push(volatilePoolsArray[i].arg0);
    }
    
    let stablePoolListString = String(stablePoolList.map((i) => `${stablePoolList.indexOf(i)+1}. ${i}`).join('\n'));
    let volatilePoolListString = String(volatilePoolList.map((i) => `${volatilePoolList.indexOf(i)+1}. ${i}`).join('\n'));
    
    const embed = new Discord.MessageEmbed()
      .setTitle('🚵 Pools List')
      .setColor('#4862d8')
      .addField('🚴 vAMM - Volatile Pools', '\`\`\`' + volatilePoolListString + '\`\`\`', true)
      .addField('🚴‍♂️ sAMM - Stable Pools', '\`\`\`' + stablePoolListString + '\`\`\`', true);
      
    return msg.channel.send({ embeds: [embed] });
  },
  // return list of sAMM stable pools
  getStablePoolList: async function(msg) {

    console.log('\x1b[34m%s\x1b[0m', `[?] !spools - user called getStablePoolList`);

    let vd = await getVelodromeApiData();
    let stablePoolList = [];

    await getStablePools(vd, 0);

    for (i=0; i < stablePoolsArray.length; i++) {
      stablePoolList.push(stablePoolsArray[i].arg0);
    }

    let stablePoolListString = String(stablePoolList.map((i) => `${stablePoolList.indexOf(i)+1}. ${i}`).join('\n'));

    const embed = new Discord.MessageEmbed()
      .setColor('#4289c1')
      .addField('🚴‍♂️ sAMM - Stable Pools', '\`\`\`' + stablePoolListString + '\`\`\`', true);

    return msg.channel.send({ embeds: [embed] });
  },
  // return list of vAMM volatile pools
  getVolatilePoolList: async function(msg) {

    console.log('\x1b[34m%s\x1b[0m', `[?] !vpools - user called getVolatilePoolList`);

    let vd = await getVelodromeApiData();
    let volatilePoolList = [];

    await getVolatilePools(vd, 0);

    for (i=0; i < volatilePoolsArray.length; i++) {
      volatilePoolList.push(volatilePoolsArray[i].arg0);
    }

    let volatilePoolsListString = String(volatilePoolList.map((i) => `${volatilePoolList.indexOf(i)+1}. ${i}`).join('\n'));

    const embed = new Discord.MessageEmbed()
      .setColor('#fa743e')
      .addField('🚴 vAMM - Volatile Pools', '\`\`\`' + volatilePoolsListString + '\`\`\`', true);

    return msg.channel.send({ embeds: [embed] });
  },
  // return list of pools containing a specified token
  getTokenPoolList: async function(msg, arg) {

    arg = arg.toLowerCase();

    let stablePoolList = [];
    let volatilePoolList = [];
    await getPools(0);
    
    console.log('\x1b[34m%s\x1b[0m', `[?] !pools - arg: ${arg.toUpperCase()} - user called getTokenPoolList}`);

    for (let i = 0; i < poolsArray.length; i++) {
      if (poolsArray[i].arg0.includes(arg) || poolsArray[i].arg1.includes(arg)) {
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
          stablePoolListString = `sAMM - Stable Pools\n----------------------\n` + String(stablePoolList.map((i) => `${stablePoolList.indexOf(i)+1}. ${i}`).join('\n'));
        }

        if (volatilePoolList.length !== 0) { 
          volatilePoolListString = `\nvAMM - Volatile Pools\n----------------------\n` + String(volatilePoolList.map((i) => `${volatilePoolList.indexOf(i)+1}. ${i}`).join('\n'));
        }

        const embed = new Discord.MessageEmbed()
          //.setTitle(`🚴‍♂️ ${arg.toUpperCase()} Pools`)
          .setColor(await getTokenColor(arg))
          .setThumbnail(await getVeloThumbnail(arg))
          .addField(`🚴‍♂️ ${arg.toUpperCase()} Pools`, '\`\`\`' + stablePoolListString + `\n` + volatilePoolListString + '\`\`\`', true)

        return msg.channel.send({ embeds: [embed] });
      }
    }
    msg.reply('Could not find token, please try again');
    return;
  },
  // return pool daily, weekly and yearly APR
  getPoolApr: async function (msg, arg) {

    arg = arg.toLowerCase();

    let vd = await getPools(0);

    let poolAddress;
   
    // check if pool requested is valid
    for (let i=0; i < poolsArray.length; i++) {
      if ((poolsArray[i].arg0 === arg) || (poolsArray[i].arg1 === arg)) {
        poolAddress = poolsArray[i].addr;
        
        for (let i=0; i < vd.length; i++) {
          if((vd[i].address).toLowerCase() === (poolAddress).toLowerCase()) {  

            let apr = vd[i].apr;
            let aprDaily = (apr / 365).toFixed(2);
            let aprWeekly = (apr / 52).toFixed(2)
            let aprYearly = apr.toFixed(2);

            console.log('\x1b[35m%s\x1b[0m', `[%] !apr - arg: ${arg.toUpperCase()} - user called getPoolApr - ${apr.toFixed(2)}%`)

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
              .setFooter({ text: 'Source: Velodrome API', iconURL: staticIcons.veloFooterIcon });

              return msg.channel.send({ embeds: [embed], files: [att] });
          }
        }
      }
    } 
    msg.reply(`Could not find ${arg}, for a list of pools type \`!pools\` to see pools with >$2,000 TVL, or \`!allpools\` for all.`);
    return;
  },
  // return top 5 pools by APR and TVL
  getTopFive: async function(msg) {

    console.log('\x1b[35m%s\x1b[0m', '[*] !top5 - user called getTopFive');

    await getPools(2000);

    let poolAprs = [];
    let topFiveListApr = [];
    let topFiveAprString = '';

    for (let i=0; i < poolsArray.length; i++) {
      poolAprs.push(poolsArray[i].apr);
    }

    let topFiveApr = poolAprs.sort(function(a, b){return b-a}).slice(0,5);

    for (let i=0; i < poolsArray.length; i++) {
      if (topFiveApr.includes(poolsArray[i].apr)) {
        topFiveListApr.push({
          name: poolsArray[i].name,
          aprDaily: poolsArray[i].apr / 365,
          aprWeekly: poolsArray[i].apr / 52,
          aprYearly: poolsArray[i].apr
        });
      }
    }

    topFiveListApr.sort((a, b) => parseFloat(b.aprYearly) - parseFloat(a.aprYearly));

    for (aprs in topFiveListApr) {
      topFiveAprString += `> 🔹 *` + (topFiveListApr[aprs].name + ':* \t **' + 
        topFiveListApr[aprs].aprYearly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2}) + '%**\n'
      );
    }

    let poolTvls = [];
    let topFiveListTvl = [];
    let topFiveTvlString = '';

    for (let i=0; i < poolsArray.length; i++) {
      poolTvls.push(poolsArray[i].tvl);
    }

    let topFiveTvl = poolTvls.sort(function(a, b){return b-a}).slice(0,5);

    for (let i=0; i < poolsArray.length; i++) {
      if (topFiveTvl.includes(poolsArray[i].tvl)) {
        topFiveListTvl.push({
          name: poolsArray[i].name,
          tvl: poolsArray[i].tvl
        })
      }
    }

    topFiveListTvl.sort((a, b) => parseFloat(b.tvl) - parseFloat(a.tvl));

    for (tvls in topFiveListTvl) {
      topFiveTvlString += `> 🔸 *` + (topFiveListTvl[tvls].name + ':* \t **$' + topFiveListTvl[tvls].tvl.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0}) + '**\n');
    }

    embed = new Discord.MessageEmbed()
    .setTitle('🚵🏻‍♂️ Top 5')
    .setColor('#000000')
    .addField('☄️ Pools by APR', topFiveAprString, false)
    .addField('🪙 Pools by TVL', topFiveTvlString, false)
    .setThumbnail(await getVeloThumbnail())
    .setFooter({ text: 'Source: Velodrome API', iconURL: staticIcons.veloFooterIcon });

    return msg.channel.send({ embeds: [embed] });

  },
  // return top 5 pools by APR
  getTopFiveApr: async function (msg) {

    console.log('\x1b[35m%s\x1b[0m', '[%] !top5 apr - user called getTopFiveApr');

    await getPools(2000);

    let poolAprs = [];
    let topFiveList = [];
    let topFiveAprString = '';

    for (let i=0; i < poolsArray.length; i++) {
      poolAprs.push(poolsArray[i].apr);
    }

    let topFiveApr = poolAprs.sort(function(a, b){return b-a}).slice(0,5);

    for (let i=0; i < poolsArray.length; i++) {
      if (topFiveApr.includes(poolsArray[i].apr)) {
        topFiveList.push({
          name: poolsArray[i].name,
          aprDaily: poolsArray[i].apr / 365,
          aprWeekly: poolsArray[i].apr / 52,
          aprYearly: poolsArray[i].apr
        });
      }
    }

    topFiveList.sort((a, b) => parseFloat(b.aprYearly) - parseFloat(a.aprYearly));

    for (aprs in topFiveList) {
      topFiveAprString += `> 🔹 *` + (topFiveList[aprs].name + ':* \t **' + 
        topFiveList[aprs].aprYearly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2}) + '%**\n'
      );
    }

    embed = new Discord.MessageEmbed()
      .setTitle('☄️ Top 5')
      .setColor('#55acee')
      .addField('Pools by APR', topFiveAprString, true)
      .setThumbnail(await getVeloThumbnail())
      .setTimestamp()
      .setFooter({ text: 'Source: Velodrome API', iconURL: staticIcons.veloFooterIcon });

    return msg.channel.send({ embeds: [embed] });
  },
  // return top5 pools by TVL
  getTopFiveTvl: async function (msg) {

    console.log('\x1b[35m%s\x1b[0m','[$] !top5 tvl - user called getTopFiveTvl');

    await getPools(2000);

    let poolTvls = [];
    let topFiveList = [];
    let topFiveTvlString = '';

    for (let i=0; i < poolsArray.length; i++) {
      poolTvls.push(poolsArray[i].tvl);
    }

    let topFiveTvl = poolTvls.sort(function(a, b){return b-a}).slice(0,5);

    for (let i=0; i < poolsArray.length; i++) {
      if (topFiveTvl.includes(poolsArray[i].tvl)) {
        topFiveList.push({
          name: poolsArray[i].name,
          tvl: poolsArray[i].tvl
        })
      }
    }

    topFiveList.sort((a, b) => parseFloat(b.tvl) - parseFloat(a.tvl));

    for (tvls in topFiveList) {
      topFiveTvlString += `> 🔸 *` + (topFiveList[tvls].name + ':* \t **$' + topFiveList[tvls].tvl.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0}) + '**\n');
    }

    embed = new Discord.MessageEmbed()
    .setTitle('🪙 Top 5')
    .setColor('#f4900c')
    .addField('Pools by TVL', topFiveTvlString, true)
    .setThumbnail(await getVeloThumbnail())
    .setTimestamp()
    .setFooter({ text: 'Source: Velodrome API', iconURL: staticIcons.veloFooterIcon });

    return msg.channel.send({ embeds: [embed] });
  },
  // return total protocol TVL
  getProtocolTvl: async function (msg) {
    
    let vd = await getVelodromeApiData();
    let totalTvl = 0;
    
    for (let i=0; i < vd.length; i++) {
      totalTvl += vd[i].tvl;
    }

    totalTvl = totalTvl.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0});

    console.log('\x1b[32m%s\x1b[0m', `[$] !tvl - user requested total protocol TVL: $${totalTvl}`);

    embed = new Discord.MessageEmbed()
    .setTitle('🪙 Total TVL')
    .setColor('#f4900c')
    .setDescription(`> **$${totalTvl}**`)
    .setThumbnail(await getVeloThumbnail())
    .setTimestamp()
    .setFooter({ text: 'Source: Velodrome API', iconURL: staticIcons.veloFooterIcon });

    return msg.channel.send({ embeds: [embed] });
  },
  // return total tokens and USD TVL value
  getPoolUsdTvl: async function (msg, arg) {

    arg = arg.toLowerCase();

    let vd = await getPools(0);

        // get pool address
        for (let i=0; i < poolsArray.length; i++) {
          if ((poolsArray[i].arg0 === arg) || (poolsArray[i].arg1 === arg)) {
    
            let reserve0;
            let reserve1;
            let token0_symbol;
            let token1_symbol;
            let poolTitle;
            let poolAddress = poolsArray[i].addr;
    
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

            let token0id;
            let token1id;

            for (l=0; l < tokenColors.length; l++) {
              if (token0_symbol === tokenColors[l].arg) {
                token0id = tokenColors[l].id;
              }

              if (token1_symbol === tokenColors[l].arg) {
                token1id = tokenColors[l].id;
              }
            }

            let token0info = await axios.get(urls.coingeckoUrl + token0id);
            let token1info = await axios.get(urls.coingeckoUrl + token1id);

            let token0price = token0info.data.market_data.current_price.usd;
            let token1price = token1info.data.market_data.current_price.usd;
            
            let poolUsdValue = ((reserve0 * token0price) + (reserve1 * token1price)).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0});


            console.log('\x1b[35m%s\x1b[0m', `[*] !tvl - arg: ${arg.toUpperCase()} - user called getPoolUsdTvl - TVL: $${poolUsdValue}`);

            const img64 = await getMergedThumbnail(token0_symbol, token1_symbol);
            const buffer = Buffer.from(img64, 'base64');
            const att = new Discord.MessageAttachment(buffer, 'buffer.png');

            const embed = new Discord.MessageEmbed()
            .setTitle(`${poolTitle} Pool Size`)
            .setColor(await getTokenColor(token0_symbol.toLowerCase()))
            .setThumbnail('attachment://buffer.png')
            .addFields(
              { name: '🪙 TVL', value: 
              `> 🚴🏻‍♂️ **${token0_symbol.toUpperCase()} :**  ` + `${reserve0.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0})}\n` +
              `> 🚴 **${token1_symbol.toUpperCase()} :**  ` + `${reserve1.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0})}`
              })
            .addField('💵 USD Value', `> $${poolUsdValue}`)
            .setTimestamp()
            .setFooter({ text: 'Source: Velodrome API', iconURL: staticIcons.veloFooterIcon });

            return msg.channel.send({ embeds: [embed], files: [att] });
            }
          }
  },
  // get pool size and APR
  getPoolInfo: async function (msg, arg) {
    arg = arg.toLowerCase();

    let vd = await getPools(0);

    // check if pool requested is valid
    for (let i=0; i < poolsArray.length; i++) {
      if ((poolsArray[i].arg0 === arg) || (poolsArray[i].arg1 === arg)) {

        let poolAddress = poolsArray[i].addr;
        
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

            let token0id;
            let token1id;

            for (l=0; l < tokenColors.length; l++) {
              if (token0_symbol === tokenColors[l].arg) {
                token0id = tokenColors[l].id;
              }

              if (token1_symbol === tokenColors[l].arg) {
                token1id = tokenColors[l].id;
              }
            }

            let token0info = await axios.get(urls.coingeckoUrl + token0id);
            let token1info = await axios.get(urls.coingeckoUrl + token1id);

            let token0price = token0info.data.market_data.current_price.usd;
            let token1price = token1info.data.market_data.current_price.usd;
            
            let poolUsdValue = ((reserve0 * token0price) + (reserve1 * token1price)).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

            reserve0 = reserve0.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
            reserve1 = reserve1.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

            console.log('\x1b[36m%s\x1b[0m', `[%] !pool - arg: ${arg.toUpperCase()} - user called getPoolInfo - APR: ${apr.toFixed(2)}% - ` +
              `${token0_symbol.toUpperCase()}: ${reserve0} ${token1_symbol.toUpperCase()}: ${reserve1} - VALUE: $${poolUsdValue}`);

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
                  `> 🚴🏻‍♂️ **${token0_symbol.toUpperCase()} :**  ` + `${reserve0}\n` +
                  `> 🚴 **${token1_symbol.toUpperCase()} :**  ` + `${reserve1}`
                },
                { name: '💵 USD Value', value: `> $${poolUsdValue}`})
              .setThumbnail('attachment://buffer.png')
              .setTimestamp()
              .setFooter({ text: 'Source: Velodrome API', iconURL: staticIcons.veloFooterIcon });

              return msg.channel.send({ embeds: [embed], files: [att] });
          }
        } 
      } 
    }
    msg.reply(`Could not find ${arg}, for a list of pools type \`!pools\` to see pools with >$2,000 TVL, or \`!allpools\` for all.`);
    return;
  },
  // get velo stats - price, marketcap, supply
  getVeloInfo: async function (msg) {
    // token price
    let poolInfo = await axios.get(urls.dexscreenerUrl + veloUsdcPoolAddress);
    let tokenPrice = poolInfo.data.pairs[0].priceNative;

    // marketcap
    let tokenInfo = await axios.get(urls.veloCoingeckoUrl);
    let fdv = (tokenInfo.data.market_data.fully_diluted_valuation.usd).toLocaleString('en-US', {}); 

    // onchain supply info
    let { totalSupply, veTotalSupply, percentageLocked } = await onChainFunctions.getTotalSupply();

    totalSupply = totalSupply.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    veTotalSupply = veTotalSupply.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    console.log('\x1b[36m%s\x1b[0m', `[*] !velo - user requested VELO info - PRCE: $${tokenPrice} - MARKETCAP: $${fdv} - SUPPLY: ${totalSupply})} veVELO: ${veTotalSupply} LOCKED: ${percentageLocked}%`);

    const embed = new Discord.MessageEmbed()
      .setTitle('VELO Stats')
      .setColor('#007fff')
      .setThumbnail(await getVeloThumbnail())
      .addField('💵 Price', `> $${tokenPrice}`)
      .addField('📈 Marketcap', `> $${fdv}`)
      .addFields(              
        { name: '📊 Total Supply', value: 
          `> 🚴🏻‍♂️ **VELO :**  ${totalSupply}\n` +
          `> 🚴 **veVELO :**  ${veTotalSupply}\n` +
          `> 🚴🏻‍♂️ **% Locked :** ${percentageLocked}%`
        })
      .setTimestamp()
      .setFooter({ text: 'Source: Velodrome API', iconURL: staticIcons.veloFooterIcon });

    return msg.channel.send({ embeds: [embed] });
  }
};
