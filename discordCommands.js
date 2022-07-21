const axios = require('axios');
const Discord = require('discord.js');
const { typeOf } = require('mathjs');
const Math = require('mathjs')

const { veloUsdcPoolAddress, tokenColors, helpList, staticIcons, urls } = require('./constants.js');

const { getVelodromeApiData, getVeloThumbnail, getMergedThumbnail, getTokenColor, getPools, getStablePools, 
  getVolatilePools, getAllPoolsLists, getTotalTvl, topTvl, topApr, readFileData, writeFileData } = require('./dataFunctions.js');

const onChainFunctions = require('./onChainFunctions.js');
const twitterClient = require('./twitterClient.js');

module.exports = {
  // return list of commands
  help: function(msg) {
    console.log('\x1b[31m%s\x1b[0m', '[?] !help - user requested list of commands');
    return msg.channel.send(helpList);
  },
  // return epoch info
  getEpoch: async function(msg) {

    const options = { timeZone: 'UTC', timeZoneName: 'short'}

    const epochZero = new Date(1654124400000 - 604800000);
    const epochOne = new Date(1654124400000);

    const weeksPassed = (Date.now() - epochOne) / 604800000;

    const currentEpoch = Math.ceil(weeksPassed);

    const currentEpochStart = new Date(((currentEpoch - 1) * 604800000) + 1654124400000);
    const currentEpochEnd = new Date(((currentEpoch) * 604800000) + 1654124400000);

    console.log(currentEpoch);
    console.log(`Current epoch began on: ${currentEpochStart}`);
    console.log(`Current epoch ends: ${currentEpochEnd.toLocaleString('en-GB', options)}`);

    try {
      const embed = new Discord.MessageEmbed()
        .setTitle(`Epoch ${currentEpoch}`)
        .setThumbnail(await getVeloThumbnail())
        .setDescription(
          `> **Epoch began:** ${currentEpochStart.toLocaleString('en', options)}\n` +
          `> **Epoch ${currentEpoch+1} begins: **${currentEpochEnd.toLocaleString('en-GB', options)}`
        )
        .setTimestamp();

      return msg.channel.send({ embeds: [embed] });
    } catch (e) {
      console.log(e);
    }
  },
  // return current VELO USD price
  getVeloUsdPrice: async function(msg) {

    let poolInfo = await axios.get(urls.dexscreenerUrl + veloUsdcPoolAddress);
    let tokenPrice = poolInfo.data.pairs[0].priceNative;

    console.log('\x1b[32m%s\x1b[0m', `[$] !price - user requested price of VELO: $${tokenPrice}`);

    try {
      const embed = new Discord.MessageEmbed()
        .setTitle('🚴‍♂️ VELO Price')
        .setColor('#007fff')
        .setThumbnail(await getVeloThumbnail())
        .setDescription(`> **$${tokenPrice}**`)
        .setTimestamp()
        .setFooter({ text: 'Dexscreener', iconURL: staticIcons.dexscreenerFooterIcon });

      return msg.channel.send({ embeds: [embed] });
    } catch (e) {
      console.log(e);
    }
  },
  // return current VELO market cap from Coingecko
  getMarketCap: async function(msg) {

    let tokenInfo = await axios.get(urls.veloCoingeckoUrl);
    let fdv = (tokenInfo.data.market_data.fully_diluted_valuation.usd).toLocaleString('en-US', {}); 

    console.log('\x1b[32m%s\x1b[0m', `[$] !marketcap - user requested marketcap of VELO: $${fdv}`);
    
    try {
      const embed = new Discord.MessageEmbed()
        .setTitle('📈 VELO Marketcap')
        .setColor('#8bc63f')
        .setThumbnail(await getVeloThumbnail())
        .setDescription(`> **$${fdv}**`)
        .setTimestamp()
        .setFooter({ text: 'Coingecko', iconURL: staticIcons.coingeckoFooterIcon })

      return msg.channel.send({ embeds: [embed] });
    } catch (e) {
      console.log(e);
    }
  },
  // return total supply of VELO, veVELO and % locked
  getTotalSupply: async function(msg) {

    let { totalSupply, veTotalSupply, percentageLocked } = await onChainFunctions.getTotalSupply();

    totalSupply = totalSupply.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0});
    veTotalSupply = veTotalSupply.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    console.log('\x1b[32m%s\x1b[0m', `[$] !supply - user requested total supply - VELO: ${totalSupply} - veVELO: ${veTotalSupply} - LOCKED: ${percentageLocked}%`);

    try {
      const embed = new Discord.MessageEmbed()
        .setTitle('📊 VELO Supply')
        .setColor('#fa051d')
        .setThumbnail(await getVeloThumbnail())
        .setDescription(          
          `> 🚴🏻‍♂️ **VELO :**  ${totalSupply}\n` +
          `> 🔒 **VELO:**  ${veTotalSupply}\n` +
          `> 🚴🏻‍♂️ **% Locked :** ${percentageLocked}%`)
        .setFooter({ text: 'Optimism', iconURL: staticIcons.opFooterIcon })
        .setTimestamp();

      return msg.channel.send({ embeds: [embed] });
    } catch (e) {
      console.log(e);
    }
  },
  // return list of pools with TVL > 5000
  getPoolList: async function(msg) {

    console.log('\x1b[34m%s\x1b[0m', '[?] !pools - user called getPoolsList');    

    let { poolsArray, stablePoolsArray, volatilePoolsArray } = await getAllPoolsLists(2000);
    let stablePoolList = [];
    let volatilePoolList = [];

    for (let i=0; i < stablePoolsArray.length; i++) {
      stablePoolList.push(stablePoolsArray[i].arg0);
    }

    for (let i=0; i < volatilePoolsArray.length; i++) {
      volatilePoolList.push(volatilePoolsArray[i].arg0);
    }
    
    let stablePoolListString = String(stablePoolList.map((i) => `${stablePoolList.indexOf(i)+1}. ${i}`).join('\n'));
    let volatilePoolListString = String(volatilePoolList.map((i) => `${volatilePoolList.indexOf(i)+1}. ${i}`).join('\n'));
    
    try {
      const embed = new Discord.MessageEmbed()
        .setTitle('🚵 Pools List')
        .setColor('#000000')
        .addField('🚴 vAMM - Volatile Pools', '\`\`\`' + volatilePoolListString + '\`\`\`', true)
        .addField('🚴‍♂️ sAMM - Stable Pools', '\`\`\`' + stablePoolListString + '\`\`\`', true);
        
      return msg.channel.send({ embeds: [embed] });
    } catch (e) {
      console.log(e);
    }
  },
  // return unfiltered list of pools
  getAllPoolList: async function(msg) {

    console.log('\x1b[34m%s\x1b[0m', '[?] !allpools - user called getAllPoolsList');      

    let { poolsArray, stablePoolsArray, volatilePoolsArray } = await getAllPoolsLists(0);
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
    
    try {
      const embed = new Discord.MessageEmbed()
        .setTitle('🚵 Pools List')
        .setColor('#000000')
        .addField('🚴 vAMM - Volatile Pools', '\`\`\`' + volatilePoolListString + '\`\`\`', true)
        .addField('🚴‍♂️ sAMM - Stable Pools', '\`\`\`' + stablePoolListString + '\`\`\`', true);
        
      return msg.channel.send({ embeds: [embed] });
    } catch (e) {
      console.log(e);
    }
  },
  // return list of sAMM stable pools
  getStablePoolList: async function(msg) {

    console.log('\x1b[34m%s\x1b[0m', `[?] !spools - user called getStablePoolList`);

    let vd = await getVelodromeApiData();
    let stablePoolList = [];

    let stablePoolsArray = await getStablePools(vd, 0);

    for (i=0; i < stablePoolsArray.length; i++) {
      stablePoolList.push(stablePoolsArray[i].arg0);
    }

    let stablePoolListString = String(stablePoolList.map((i) => `${stablePoolList.indexOf(i)+1}. ${i}`).join('\n'));

    try {
      const embed = new Discord.MessageEmbed()
        .setColor('#4289c1')
        .addField('🚴‍♂️ sAMM - Stable Pools', '\`\`\`' + stablePoolListString + '\`\`\`', true);

      return msg.channel.send({ embeds: [embed] });
    } catch (e) {
      console.log(e);
    }
  },
  // return list of vAMM volatile pools
  getVolatilePoolList: async function(msg) {

    console.log('\x1b[34m%s\x1b[0m', `[?] !vpools - user called getVolatilePoolList`);

    let vd = await getVelodromeApiData();
    let volatilePoolList = [];

    let volatilePoolsArray = await getVolatilePools(vd, 0);

    for (i=0; i < volatilePoolsArray.length; i++) {
      volatilePoolList.push(volatilePoolsArray[i].arg0);
    }

    let volatilePoolsListString = String(volatilePoolList.map((i) => `${volatilePoolList.indexOf(i)+1}. ${i}`).join('\n'));

    try {
      const embed = new Discord.MessageEmbed()
        .setColor('#fa743e')
        .addField('🚴 vAMM - Volatile Pools', '\`\`\`' + volatilePoolsListString + '\`\`\`', true);

      return msg.channel.send({ embeds: [embed] });
    } catch (e) {
      console.log(e);
    }
  },
  // return list of pools containing a specified token
  getTokenPoolList: async function(msg, arg) {

    arg = arg.toLowerCase();

    let stablePoolList = [];
    let volatilePoolList = [];
    let { poolsArray, stablePoolsArray, volatilePoolsArray } = await getAllPoolsLists(0);
    
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

        try {
          const embed = new Discord.MessageEmbed()
            //.setTitle(`🚴‍♂️ ${arg.toUpperCase()} Pools`)
            .setColor(await getTokenColor(arg))
            .setThumbnail(await getVeloThumbnail(arg))
            .addField(`🚴‍♂️ ${arg.toUpperCase()} Pools`, '\`\`\`' + stablePoolListString + `\n` + volatilePoolListString + '\`\`\`', true)

          return msg.channel.send({ embeds: [embed] });
        } catch (e) {
          console.log(e);
        }
      }
    }
    msg.reply('Could not find token, please try again');
    return;
  },
  // return pool daily, weekly and yearly APR
  getPoolApr: async function (msg, arg) {

    arg = arg.toLowerCase();

    let vd = await getVelodromeApiData();

    let poolsArray = await getPools(0);

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

            try {
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
                .setFooter({ text: 'Velodrome API', iconURL: staticIcons.veloFooterIcon });

                return msg.channel.send({ embeds: [embed], files: [att] });
            } catch (e) {
              console.log(e);
            }
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

    let vd = await getVelodromeApiData();
    let poolsArray = await getPools(2000);

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

    try {
      embed = new Discord.MessageEmbed()
      .setTitle('🚵🏻‍♂️ Top 5')
      .setColor('#000000')
      .addField('☄️ Pools by APR', topFiveAprString, false)
      .addField('🪙 Pools by TVL', topFiveTvlString, false)
      .setThumbnail(await getVeloThumbnail())
      .setFooter({ text: 'Velodrome API', iconURL: staticIcons.veloFooterIcon });

      return msg.channel.send({ embeds: [embed] });
    } catch (e) {
      console.log(e);
    }
  },
  // return top 10 pools by APR and TVL
  getTopTen: async function(msg) {

    console.log('\x1b[35m%s\x1b[0m', '[*] !top10 - user called getTopTen');
  
    let vd = await getVelodromeApiData();
    let poolsArray = await getPools(2000);
  
    let poolAprs = [];
    let topTenListApr = [];
    let topTenAprString = '';
  
    for (let i=0; i < poolsArray.length; i++) {
      poolAprs.push(poolsArray[i].apr);
    }
  
    let topTenApr = poolAprs.sort(function(a, b){return b-a}).slice(0,10);
  
    for (let i=0; i < poolsArray.length; i++) {
      if (topTenApr.includes(poolsArray[i].apr)) {
        topTenListApr.push({
          name: poolsArray[i].name,
          aprDaily: poolsArray[i].apr / 365,
          aprWeekly: poolsArray[i].apr / 52,
          aprYearly: poolsArray[i].apr
        });
      }
    }
  
    topTenListApr.sort((a, b) => parseFloat(b.aprYearly) - parseFloat(a.aprYearly));
  
    for (aprs in topTenListApr) {
      topTenAprString += `> 🔹 *` + (topTenListApr[aprs].name + ':* \t **' + 
        topTenListApr[aprs].aprYearly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2}) + '%**\n'
      );
    }
  
    let poolTvls = [];
    let topTenListTvl = [];
    let topTenTvlString = '';
  
    for (let i=0; i < poolsArray.length; i++) {
      poolTvls.push(poolsArray[i].tvl);
    }
  
    let topTenTvl = poolTvls.sort(function(a, b){return b-a}).slice(0,10);
  
    for (let i=0; i < poolsArray.length; i++) {
      if (topTenTvl.includes(poolsArray[i].tvl)) {
        topTenListTvl.push({
          name: poolsArray[i].name,
          tvl: poolsArray[i].tvl
        })
      }
    }
  
    topTenListTvl.sort((a, b) => parseFloat(b.tvl) - parseFloat(a.tvl));
  
    for (tvls in topTenListTvl) {
      topTenTvlString += `> 🔸 *` + (topTenListTvl[tvls].name + ':* \t **$' + topTenListTvl[tvls].tvl.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0}) + '**\n');
    }
  
    try {
      embed = new Discord.MessageEmbed()
      .setTitle('🚵🏻‍♂️ Top 10')
      .setColor('#000000')
      .addField('☄️ Pools by APR', topTenAprString, false)
      .addField('🪙 Pools by TVL', topTenTvlString, false)
      .setThumbnail(await getVeloThumbnail())
      .setFooter({ text: 'Velodrome API', iconURL: staticIcons.veloFooterIcon });
  
      return msg.channel.send({ embeds: [embed] });
    } catch (e) {
      console.log(e);
    }
  },
  // return top 5 pools by APR
  getTopApr: async function(top, msg, filter, poolType) {

    if (filter) {
      console.log('\x1b[35m%s\x1b[0m', `[%] !top${top} apr - UNFILTERED - user called getTopApr`);
    } else {
      console.log('\x1b[35m%s\x1b[0m', `[%] !top${top} - user called getTopApr`);
    }

    let topList = await topApr(top, filter, poolType);
    let topAprString = '';

    for (aprs in topList) {
      topAprString += `> 🔹 *` + (topList[aprs].name + ':* \t **' + 
        topList[aprs].aprYearly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2}) + '%**\n'
      );
    }

    try {
      embed = new Discord.MessageEmbed()
        .setTitle(`☄️ Top ${top}`)
        .setColor('#55acee')
        .addField('Pools by APR', topAprString, true)
        .setThumbnail(await getVeloThumbnail())
        .setTimestamp()
        .setFooter({ text: 'Velodrome API', iconURL: staticIcons.veloFooterIcon });

      return msg.channel.send({ embeds: [embed] });
    } catch (e) {
      console.log(e);
    }
  },
  // return top5 pools by TVL
  getTopTvl: async function(top, msg, poolType) {

    console.log('\x1b[35m%s\x1b[0m',`[$] !top${top} tvl - user called getTopTvl`);

    let topList = await topTvl(top, poolType);
    let topTvlString = '';

    for (tvls in topList) {
      topTvlString += `> 🔸 *` + (topList[tvls].name + ':* \t **$' + topList[tvls].tvl.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0}) + '**\n');
    }

    try {
      embed = new Discord.MessageEmbed()
      .setTitle(`🪙 Top ${top}`)
      .setColor('#f4900c')
      .addField('Pools by TVL', topTvlString, true)
      .setThumbnail(await getVeloThumbnail())
      .setTimestamp()
      .setFooter({ text: 'Velodrome API', iconURL: staticIcons.veloFooterIcon });

      return msg.channel.send({ embeds: [embed] });
    } catch (e) {
      console.log(e);
    }
  },
  // return total protocol TVL
  getProtocolTvl: async function(msg) {
    
    let totalTvl = await getTotalTvl();

    totalTvl = totalTvl.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0});

    console.log('\x1b[32m%s\x1b[0m', `[$] !tvl - user requested total protocol TVL: $${totalTvl}`);

    try {
      embed = new Discord.MessageEmbed()
      .setTitle('🪙 Total TVL')
      .setColor('#f4900c')
      .setDescription(`> **$${totalTvl}**`)
      .setThumbnail(await getVeloThumbnail())
      .setTimestamp()
      .setFooter({ text: 'Velodrome API', iconURL: staticIcons.veloFooterIcon });

      return msg.channel.send({ embeds: [embed] });
    } catch (e) {
      console.log(e);
    }
  },
  // return total tokens and USD TVL value
  getPoolUsdTvl: async function(msg, arg) {

    arg = arg.toLowerCase();

    let vd = await getVelodromeApiData();

    let poolsArray = await getPools(0);

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

        try {
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
            .setFooter({ text: 'Velodrome API', iconURL: staticIcons.veloFooterIcon });

            return msg.channel.send({ embeds: [embed], files: [att] });
        } catch (e) {
          console.log(e);
        }
      }
    }
  },
  // get pool size and APR
  getPoolInfo: async function(msg, arg) {
    arg = arg.toLowerCase();

    let vd = await getVelodromeApiData();

    let poolsArray = await getPools(0);

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

            if (['wbtc', 'renbtc'].includes(token0_symbol)) {
              reserve0 = reserve0.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
            } else {
              reserve0 = reserve0.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
            }

            if (['wbtc', 'renbtc'].includes(token1_symbol)) {
              reserve1 = reserve1.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
            } else {
              reserve1 = reserve1.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
            }

            console.log('\x1b[36m%s\x1b[0m', `[%] !pool - arg: ${arg.toUpperCase()} - user called getPoolInfo - APR: ${apr.toFixed(2)}% - ` +
              `${token0_symbol.toUpperCase()}: ${reserve0} ${token1_symbol.toUpperCase()}: ${reserve1} - VALUE: $${poolUsdValue}`);

            const img64 = await getMergedThumbnail(token0_symbol, token1_symbol);
            const buffer = Buffer.from(img64, 'base64');
            const att = new Discord.MessageAttachment(buffer, 'buffer.png');

            try {
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
                .setFooter({ text: 'Velodrome API', iconURL: staticIcons.veloFooterIcon });

                return msg.channel.send({ embeds: [embed], files: [att] });
            } catch (e) {
                console.log(e);
            }
          }
        } 
      } 
    }
    msg.reply(`Could not find ${arg}, for a list of pools type \`!pools\` to see pools with >$2,000 TVL, or \`!allpools\` for all.`);
    return;
  },
  // get velo stats - price, marketcap, supply
  getVeloInfo: async function(msg) {
    // token price
    let poolInfo = await axios.get(urls.dexscreenerUrl + veloUsdcPoolAddress);
    let tokenPrice = poolInfo.data.pairs[0].priceNative;

    // marketcap
    let tokenInfo = await axios.get(urls.veloCoingeckoUrl);
    let fdv = tokenInfo.data.market_data.fully_diluted_valuation.usd; 

    // onchain supply info
    let { totalSupply, veTotalSupply, percentageLocked } = await onChainFunctions.getTotalSupply();
    let totalVotes = await onChainFunctions.getTotalVotes();

    let avgLockTime = (totalVotes / veTotalSupply) * 4;

    let totalTvl = await getTotalTvl();
    let marketCapTvlRatio = fdv / totalTvl;
    marketCapTvlRatio = marketCapTvlRatio.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    fdv = fdv.toLocaleString('en-US', {});

    totalSupply = totalSupply.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    veTotalSupply = veTotalSupply.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    totalVotes = totalVotes.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    avgLockTime = avgLockTime.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    

    console.log('\x1b[36m%s\x1b[0m', `[*] !velo - user requested VELO info - PRCE: $${tokenPrice} - MARKETCAP: $${fdv} - SUPPLY: ${totalSupply})} 
      LOCKED VELO: ${veTotalSupply} LOCKED: ${percentageLocked}% VOTES: ${totalVotes} AVG LOCK TIME: ${avgLockTime}`);

    try {
      const embed = new Discord.MessageEmbed()
        .setTitle('VELO Stats')
        .setColor('#007fff')
        .setThumbnail(await getVeloThumbnail())
        .addField('💵 Price', `> $${tokenPrice}`)
        .addField('📈 Marketcap', `> $${fdv}`)
        .addField('⚗️ Marketcap / TVL', `> ${marketCapTvlRatio}`)
        .addFields(              
          { name: '📊 Total Supply', value: 
            `> 🚴🏻‍♂️ **VELO:**  ${totalSupply}\n` +
            `> 🔒 **VELO:**  ${veTotalSupply}\n` +
            `> 🚴 **% Locked:** ${percentageLocked}%`
          })
        .addField('🗳️ Votes', `> ${totalVotes}`)
        .addField('⌛ Avg. Lock Time', `> ${avgLockTime} years`)
        .setTimestamp()
        .setFooter({ text: 'Velodrome API', iconURL: staticIcons.veloFooterIcon });

      return msg.channel.send({ embeds: [embed] });
    } catch (e) {
      console.log(e);
    }
  },
  // get volume for pair
  getDailyVolume: async function(msg) {
    // to implement
    onChainFunctions.getDailyVolume();
  },
  // tweet total protocol TVL
  tweetProtocolTvl: async function() {

    let previousDayTvl = await readFileData('tvl.txt');
    
    let vd = await getVelodromeApiData();
    let totalTvl = 0;
    
    for (let i=0; i < vd.length; i++) {
      totalTvl += vd[i].tvl;
    }

    let dailyPercentageChange = ((totalTvl - previousDayTvl) / previousDayTvl) * 100;
    dailyPercentageChange = dailyPercentageChange.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});

    let sign; 

    if (dailyPercentageChange > 0) {
      sign = '+';
    } else {
      sign = '';
    }

    await writeFileData('tvl.txt', (totalTvl.toFixed(0)).toString());

    totalTvl = totalTvl.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0});
    previousDayTvl = previousDayTvl.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0});

    console.log('\x1b[31m%s\x1b[0m', `[*] tweeted - @VelodromeAlerts - protcol TVL: $${totalTvl} - previousDayTvl: $${previousDayTvl}- daily change ${sign+dailyPercentageChange}%`);

    try {
      await twitterClient.v2.tweet(`🚴 $VELO Total TVL:  $${totalTvl}  (${sign+dailyPercentageChange})`)
    } catch (e) {
      console.error(e);
    }

    console.log(`🚴 $VELO Total TVL:  $${totalTvl}  (${sign+dailyPercentageChange}%)`);
  },
  // tweet top five TVL pools
  tweetTopFiveTvl: async function() {

    console.log('\x1b[31m%s\x1b[0m','[*] tweeted - @VelodromeAlerts - tweetTopFiveTvl');

    let topFiveList = await topTvl(5, null);
    let topFiveTvlString = '';

    console.log('\x1b[31m%s\x1b[0m', '[*] Tweeted - @VelodromeAlerts - tweetTopFiveTvl');

    for (tvls in topFiveList) {
      topFiveTvlString += `🔸 ` + (topFiveList[tvls].name + ': \t $' + topFiveList[tvls].tvl.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0}) + '\n');
    }

    console.log('🪙 Top 5 TVL\n' + topFiveTvlString)
    
    try {
      await twitterClient.v2.tweet('🪙 Top 5 TVL\n' + topFiveTvlString)
    } catch (e) {
      console.error(e);
    }
  },
  // tweet top five APR pools
  tweetTopFiveApr: async function(poolType) {

    let topFiveList;
    let topFiveHeader = '☄️ Top 5 APR';
    
    if (poolType === 'stable') {
      topFiveList = await topApr(5, true, 'stable');

      topFiveHeader = topFiveHeader + ' Stable';

      console.log('\x1b[31m%s\x1b[0m', '[*] Tweeted - @VelodromeAlerts - tweetTopFiveApr - STABLE');
    } else {
      topFiveList = await topApr(5, true, null);

      topFiveHeader = topFiveHeader + ' Volatile';

      console.log('\x1b[31m%s\x1b[0m', '[*] Tweeted - @VelodromeAlerts - tweetTopFiveApr - VOLATILE');
    }

    let topFiveAprString = '';

    for (aprs in topFiveList) {
      topFiveAprString += `🔹 ` + (topFiveList[aprs].name + ':\t ' + 
        topFiveList[aprs].aprYearly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2}) + '%\n'
      );
    }

    console.log(topFiveHeader + '\n' + topFiveAprString)
    
    try {
      await twitterClient.v2.tweet(topFiveHeader + '\n' + topFiveAprString)
    } catch (e) {
      console.error(e);
    }
  }
};

