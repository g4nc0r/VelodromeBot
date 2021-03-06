const axios = require('axios');
const Discord = require('discord.js');
const Math = require('mathjs')

const { veloUsdcPoolAddress, tokenColors, helpList, staticIcons, urls, veNftAddress } = require('./constants.js');

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

    const options = { month: 'short', day: '2-digit', hour: '2-digit', year: 'numeric', timeZone: 'UTC', timeZoneName: 'short'}

    let currentEmissions = 15000000;

    const epochZero = new Date(1654128000000- 604800000);
    const epochOne = new Date(1654128000000);

    const weeksPassed = (Date.now() - epochOne) / 604800000;

    const currentEpoch = Math.ceil(weeksPassed);

    for (i=0; i < currentEpoch; i++) {
      currentEmissions = currentEmissions * 0.99;
    }

    const currentEpochStart = new Date(((currentEpoch - 1) * 604800000) + 1654128000000);
    const currentEpochEnd = new Date(((currentEpoch) * 604800000) + 1654128000000);

    // to add Epoch bribes when new bribe contracts deployed

    console.log('\x1b[31m%s\x1b[0m', `[?] !epoch - user called getEpoch - current epoch: ${currentEpoch}`)

    try {
      const embed = new Discord.MessageEmbed()
        .setTitle(`🌌 Epoch ${currentEpoch}`)
        .setColor('#4B0082')
        .setDescription(
          `> **🌇 From:** ${currentEpochStart.toLocaleString('en-GB', options)}\n` +
          `> **🌃 Ends:** ${currentEpochEnd.toLocaleString('en-GB', options)}\n`
        )
        .addFields({ 
          name: '🚴 VELO Emissions',
          value: 
          `> 🔸 **Epoch ${currentEpoch}:** ${(currentEmissions).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0})}\n` +
          `> 🔸 **Epoch ${currentEpoch+1}:** ${(currentEmissions*0.99).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0})}`
        })
        .setTimestamp();

      return msg.channel.send({ embeds: [embed] });
    } catch (e) {
      console.log(e);
    }
  },
  // return current VELO USD price from Dexscreener VELO/USDC pool
  getVeloUsdPrice: async function(msg) {

    const poolInfo = await axios.get(urls.dexscreenerUrl + veloUsdcPoolAddress);
    const tokenPrice = poolInfo.data.pairs[0].priceNative;

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

    const tokenInfo = await axios.get(urls.veloCoingeckoUrl);
    const fdv = (tokenInfo.data.market_data.fully_diluted_valuation.usd).toLocaleString('en-US', {}); 

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

    let circulatingSupply = totalSupply - veTotalSupply;

    totalSupply = totalSupply.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0});
    veTotalSupply = veTotalSupply.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    circulatingSupply = circulatingSupply.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    console.log('\x1b[32m%s\x1b[0m', `[$] !supply - user requested total supply - VELO: ${totalSupply} - veVelo: ${veTotalSupply} - locked: ${percentageLocked}%`);

    try {
      const embed = new Discord.MessageEmbed()
        .setTitle('📊 VELO Supply')
        .setColor('#fa051d')
        .setThumbnail(await getVeloThumbnail())
        .setDescription(          
          `> 🚴🏻‍♂️ **VELO :**  ${totalSupply}\n` +
          `> 🔒 **VELO:**  ${veTotalSupply}\n` +
          `> 🟢 **Circ. Supply:** ${circulatingSupply}\n` +
          `> 🚴🏻‍♂️ **% Locked :** ${percentageLocked}%`
          )
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

    const { poolsArray, stablePoolsArray, volatilePoolsArray } = await getAllPoolsLists(2000);
    let stablePoolList = [];
    let volatilePoolList = [];

    for (let i=0; i < stablePoolsArray.length; i++) {
      stablePoolList.push(stablePoolsArray[i].arg0);
    }

    for (let i=0; i < volatilePoolsArray.length; i++) {
      volatilePoolList.push(volatilePoolsArray[i].arg0);
    }
    
    const stablePoolListString = String(stablePoolList.map((i) => `${stablePoolList.indexOf(i)+1}. ${i}`).join('\n'));
    const volatilePoolListString = String(volatilePoolList.map((i) => `${volatilePoolList.indexOf(i)+1}. ${i}`).join('\n'));
    
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

    const { poolsArray, stablePoolsArray, volatilePoolsArray } = await getAllPoolsLists(0);
    let stablePoolList = [];
    let volatilePoolList = [];
   
    for (i=0; i < stablePoolsArray.length; i++) {
      stablePoolList.push(stablePoolsArray[i].arg0);
    }

    for (i=0; i < volatilePoolsArray.length; i++) {
      volatilePoolList.push(volatilePoolsArray[i].arg0);
    }
    
    const stablePoolListString = String(stablePoolList.map((i) => `${stablePoolList.indexOf(i)+1}. ${i}`).join('\n'));
    const volatilePoolListString = String(volatilePoolList.map((i) => `${volatilePoolList.indexOf(i)+1}. ${i}`).join('\n'));
    
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

    const vd = await getVelodromeApiData();
    let stablePoolList = [];

    const stablePoolsArray = await getStablePools(vd, 0);

    for (i=0; i < stablePoolsArray.length; i++) {
      stablePoolList.push(stablePoolsArray[i].arg0);
    }

    const stablePoolListString = String(stablePoolList.map((i) => `${stablePoolList.indexOf(i)+1}. ${i}`).join('\n'));

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

    const vd = await getVelodromeApiData();
    let volatilePoolList = [];

    const volatilePoolsArray = await getVolatilePools(vd, 0);

    for (i=0; i < volatilePoolsArray.length; i++) {
      volatilePoolList.push(volatilePoolsArray[i].arg0);
    }

    const volatilePoolsListString = String(volatilePoolList.map((i) => `${volatilePoolList.indexOf(i)+1}. ${i}`).join('\n'));

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
    const { poolsArray, stablePoolsArray, volatilePoolsArray } = await getAllPoolsLists(0);
    
    console.log('\x1b[34m%s\x1b[0m', `[?] !pools - arg: ${arg.toUpperCase()} - user called getTokenPoolList`);

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

    const vd = await getVelodromeApiData();
    const poolsArray = await getPools(0);

    let poolAddress;
   
    // check if pool requested is valid
    for (let i=0; i < poolsArray.length; i++) {
      if ((poolsArray[i].arg0 === arg) || (poolsArray[i].arg1 === arg)) {
        poolAddress = poolsArray[i].addr;
        
        for (let i=0; i < vd.length; i++) {
          if((vd[i].address).toLowerCase() === (poolAddress).toLowerCase()) {  

            const apr = vd[i].apr;
            const aprDaily = (apr / 365).toFixed(2);
            const aprWeekly = (apr / 52).toFixed(2)
            const aprYearly = apr.toFixed(2);

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

    const poolsArray = await getPools(2000);

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
  
    const poolsArray = await getPools(2000);
  
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
  
    const topTenTvl = poolTvls.sort(function(a, b){return b-a}).slice(0,10);
  
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
      console.log('\x1b[35m%s\x1b[0m', `[%] !top${top} unapr - UNFILTERED - user called getTopApr`);
    } else {
      console.log('\x1b[35m%s\x1b[0m', `[%] !top${top} apr - user called getTopApr`);
    }

    const topList = await topApr(top, filter, poolType);
    let topAprString = '';

    for (aprs in topList) {
      topAprString += `> 🔹 *` + (topList[aprs].name + ':* \t **' + 
        topList[aprs].aprYearly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2}) + '%**\n'
      );
    }

    let poolTypeTitle = '';

    if (poolType === 'stable') {
      if (filter) {
        poolTypeTitle = 'Unfiltered Stable';
      } else {
        poolTypeTitle = 'Stable'
      }
    } else if (poolType === 'volatile') {
      if (filter) {
        poolTypeTitle = 'Unfiltered Volatile';
      } else {
        poolTypeTitle = 'Volatile'
      }
    }

    try {
      embed = new Discord.MessageEmbed()
        .setTitle(`☄️ Top ${top}`)
        .setColor('#55acee')
        .addField(`${poolTypeTitle} Pools by APR`, topAprString, true)
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

    const topList = await topTvl(top, poolType);
    let topTvlString = '';

    for (tvls in topList) {
      topTvlString += `> 🔸 *` + (topList[tvls].name + ':* \t **$' + topList[tvls].tvl.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0}) + '**\n');
    }

    let poolTypeTitle = '';

    if (poolType === 'stable') {
      poolTypeTitle = 'Stable'
    } else if (poolType === 'volatile') {
      poolTypeTitle = 'Volatile'
    }

    try {
      embed = new Discord.MessageEmbed()
      .setTitle(`🪙 Top ${top}`)
      .setColor('#f4900c')
      .addField(`${poolTypeTitle} Pools by TVL`, topTvlString, true)
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

    const vd = await getVelodromeApiData();
    const poolsArray = await getPools(0);

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
    let tokenPrice;

    try {
      poolInfo = await axios.get(urls.dexscreenerUrl + veloUsdcPoolAddress);
      tokenPrice = poolInfo.data.pairs[0].priceNative;
    } catch (e) {
      console.log(e);
    }

    // onchain supply info
    let { totalSupply, veTotalSupply, percentageLocked } = await onChainFunctions.getTotalSupply();
    let totalVotes = await onChainFunctions.getTotalVotes();

    let avgLockTime = (totalVotes / veTotalSupply) * 4;

    const totalTvl = await getTotalTvl();
    let circulatingSupply = totalSupply - veTotalSupply;

    // market cap
    let fdv = tokenPrice * totalSupply;
    let marketCapTvlRatio = fdv / totalTvl;

    fdv = fdv.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    marketCapTvlRatio = marketCapTvlRatio.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    totalSupply = totalSupply.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    veTotalSupply = veTotalSupply.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    totalVotes = totalVotes.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    avgLockTime = avgLockTime.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    circulatingSupply = circulatingSupply.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    console.log('\x1b[36m%s\x1b[0m', `[*] !velo - user requested VELO info - price: $${tokenPrice} - marketcap: $${fdv} - supply: ${totalSupply} - locked: ${veTotalSupply} - %locked: ${percentageLocked}% - votes: ${totalVotes} - avg lock time: ${avgLockTime}`);

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
            `> 🟢 **Circ. Supply:** ${circulatingSupply}\n` +
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
  // return info for specified veNFT
  getVeNftInfo: async function(msg, selectedVeNft) {
    
    try {
      let { owner, lockedAmount, balanceOfNft, lockEndDate, voted, votePowerPecentage, isAttached } = await onChainFunctions.getVeNft(selectedVeNft);

      const poolInfo = await axios.get(urls.dexscreenerUrl + veloUsdcPoolAddress);
      const tokenPrice = poolInfo.data.pairs[0].priceNative;
  
      const estimatedVeNftValue = (lockedAmount * tokenPrice).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}); 
  
      lockedAmount = Number(lockedAmount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
      balanceOfNft = balanceOfNft.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
      votePowerPecentage = votePowerPecentage.toLocaleString('en-US', {minimumFractionDigits: 5, maximumFractionDigits: 5})
  
      const options = { month: 'short', day: 'numeric', year: 'numeric'}

      let votedSymbol = '';
      let attachedSymbol = '';

      if (voted) {
        votedSymbol = '✅';
      } else {
        votedSymbol = '❌';
      }

      if (isAttached) {
        attachedSymbol = '❌';
      } else {
        attachedSymbol = '✅';
      }

      console.log('\x1b[37m%s\x1b[0m', `[*] !venft ${selectedVeNft} - user called getVeNftInfo - locked: ${lockedAmount} - value: $${estimatedVeNftValue}`);
  
      try {
        const embed = new Discord.MessageEmbed()
        .setTitle(`veNFT ${selectedVeNft}`)
        .setColor('#002e76')
        .addFields(
          { name: '🚵 veNFT', value:
            '> **🔒 VELO:** ' + lockedAmount + '\n' +
            '> **💫 veVELO:** ' + balanceOfNft
          },
          { name: '💵 Est. USD Value', value: `> $${estimatedVeNftValue}`},
          { name: '⌛ Lock', value: 
            `> **End:** ` + lockEndDate.toLocaleDateString('en-GB', options)
          },
          { name: '🗳️ Vote' , value: 
            `> **% Vote:** ` + votePowerPecentage + '%' + '\n' + 
            `> **Voted Last Epoch:** ` + votedSymbol + '\n' +
            `> **Been Reset:** ` + attachedSymbol
          },
          { name: '**🌐 Links**', value: 
            `> **Owner: ** [${owner.substring(0, 4) + '...' + owner.substring(38)}](https://optimistic.etherscan.io/${owner}) \n` +
            `> **Offer: **[Quixotic](https://quixotic.io/asset/${veNftAddress}/${selectedVeNft})`
          })
        .setThumbnail(await getVeloThumbnail('veNft'))
        .setTimestamp()
        .setFooter({ text: 'Optimism', iconURL: staticIcons.opFooterIcon })
  
        return msg.channel.send({ embeds: [embed] });
  
      } catch (e) {
        console.log(e);
      }

    } catch (e) {
      console.log('Could not find veNFT');
      msg.reply('Could not find veNFT.');
      return;
    }
  },
  // tweet total protocol TVL
  tweetProtocolTvl: async function() {

    let previousDayTvl = await readFileData('tvl.txt');
    
    const vd = await getVelodromeApiData();
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
      await twitterClient.v2.tweet(`🚴 $VELO Total TVL:  $${totalTvl}  (${sign+dailyPercentageChange}%)`)
    } catch (e) {
      console.error(e);
    }

    console.log(`🚴 $VELO Total TVL:  $${totalTvl}  (${sign+dailyPercentageChange}%)`);
  },
  // tweet top five TVL pools
  tweetTopFiveTvl: async function() {

    console.log('\x1b[31m%s\x1b[0m','[*] tweeted - @VelodromeAlerts - tweetTopFiveTvl');

    const topFiveList = await topTvl(5, null);
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
      topFiveList = await topApr(5, false, 'stable');

      topFiveHeader = topFiveHeader + ' Stable';

      console.log('\x1b[31m%s\x1b[0m', '[*] Tweeted - @VelodromeAlerts - tweetTopFiveApr - STABLE');
    } else if (poolType === 'volatile') {
      topFiveList = await topApr(5, false, 'volatile');

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
  },
  // tweet VELO info
  tweetVeloInfo: async function() {
    // token price from Dexscreener VELO/USDC pool
    const poolInfo = await axios.get(urls.dexscreenerUrl + veloUsdcPoolAddress);
    const tokenPrice = poolInfo.data.pairs[0].priceNative;

    // marketcap from Coingecko
    const tokenInfo = await axios.get(urls.veloCoingeckoUrl);
    let fdv = tokenInfo.data.market_data.fully_diluted_valuation.usd; 

    // onchain supply info
    let { totalSupply, veTotalSupply, percentageLocked } = await onChainFunctions.getTotalSupply();
    let totalVotes = await onChainFunctions.getTotalVotes();

    let avgLockTime = (totalVotes / veTotalSupply) * 4;

    const totalTvl = await getTotalTvl();
    let marketCapTvlRatio = fdv / totalTvl;
    marketCapTvlRatio = marketCapTvlRatio.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    fdv = fdv.toLocaleString('en-US', {});

    let circulatingSupply = totalSupply - veTotalSupply;

    totalSupply = totalSupply.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    veTotalSupply = veTotalSupply.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    totalVotes = totalVotes.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    avgLockTime = avgLockTime.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    circulatingSupply = circulatingSupply.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

   let tweetText = 
      `💵 Price: $${tokenPrice}\n` + 
      `📈 Marketcap: $${fdv}\n` +
      `⚗️ Marketcap / TVL: ${marketCapTvlRatio}\n\n` +
      `📊 Total Supply\n` +
      `- 🚴🏻‍♂️ $VELO:  ${totalSupply}\n` +
      `- 🔒 VELO:  ${veTotalSupply}\n` +
      `- 🟢 Circ. Supply: ${circulatingSupply}\n` +
      `- 🚴 % Locked: ${percentageLocked}%\n\n` +
      `🗳️ Votes: ${totalVotes}\n` +
      `⌛ Avg. Lock Time: ${avgLockTime} years`;

    try {
      await twitterClient.v2.tweet(tweetText)
    } catch (e) {
      console.log(e);
    }

    console.log('\x1b[36m%s\x1b[0m', `[*] tweeted - @VelodromeAlerts - VELO info - PRICE: $${tokenPrice} - MARKETCAP: $${fdv} - SUPPLY: ${totalSupply} LOCKED VELO: ${veTotalSupply} LOCKED: ${percentageLocked}% VOTES: ${totalVotes} AVG LOCK TIME: ${avgLockTime}`);
  }
};