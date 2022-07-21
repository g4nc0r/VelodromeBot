const axios = require('axios');
const { Canvas, Image } = require('canvas');
const mergeImages = require ('merge-images');
const { tokenColors, stables, peggedExceptions, staticIcons, urls } = require('./constants.js');

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

  let stablePoolsArray = await getStablePools(vd, filter);
  let volatilePoolsArray = await getVolatilePools(vd, filter);

  let poolsArray = stablePoolsArray.concat(volatilePoolsArray);

  return poolsArray;
};

// get sAMM pools only
const getStablePools = async (velodromeApiCall, filter) => {
  let vd = velodromeApiCall;

  let stablePoolsArray = [];
  
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
  return stablePoolsArray;
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
  return volatilePoolsArray;
};

// get lists of all types of pools
const getAllPoolsLists = async (filter) => {

  let vd = await getVelodromeApiData();

  let stablePoolsArray = await getStablePools(vd, filter);
  let volatilePoolsArray = await getVolatilePools(vd, filter);

  let poolsArray = stablePoolsArray.concat(volatilePoolsArray);

  return { poolsArray, stablePoolsArray, volatilePoolsArray };
}

// return total protocol TVL
const getTotalTvl = async () => {

  let vd = await getVelodromeApiData();
  let totalTvl = 0;

  for (let i=0; i < vd.length; i++) {
    totalTvl += vd[i].tvl;
  }

  return totalTvl;
};

// return top five TVL sorted descending
const topTvl = async (top, poolType) => {

  let poolsArray;

  if (poolType === 'stable') {
  
    let vd = await getVelodromeApiData();
    poolsArray = await getStablePools(vd, 0)
  
  } else if (poolType === 'volatile') {
    
    let vd = await getVelodromeApiData();
    poolsArray = await getVolatilePools(vd, 0)
  
  } else {
   poolsArray = await getPools(2000)
  }

  let poolTvls = [];
  let topList = [];

  for (let i=0; i < poolsArray.length; i++) {
    poolTvls.push(poolsArray[i].tvl);
  }

  let topTvl = poolTvls.sort(function(a, b){return b-a}).slice(0, top);

  for (let i=0; i < poolsArray.length; i++) {
    if (topTvl.includes(poolsArray[i].tvl)) {
      topList.push({
        name: poolsArray[i].name,
        tvl: poolsArray[i].tvl
      });
    }
  }

  return topList.sort((a, b) => parseFloat(b.tvl) - parseFloat(a.tvl));
};

// return top five APR sorted descending
const topApr = async (top, filter, poolType) => {

    let poolsArray;
    let filterThreshold;

    if (filter) {
      filterThreshold = 0;
    } else {
      filterThreshold = 2000;
    }

    if (poolType === 'stable') {
      
      let vd = await getVelodromeApiData();
      poolsArray = await getStablePools(vd, filterThreshold);

    } else if (poolType === 'volatile') {
    
      let vd = await getVelodromeApiData();
      poolsArray = await getVolatilePools(vd, filterThreshold);
    
    } else {

      const getPoolsReturn = await getPools(filterThreshold);
      poolsArray = getPoolsReturn;
    
    }

    let poolAprs = [];
    let topFiveList = [];

    for (let i=0; i < poolsArray.length; i++) {
      poolAprs.push(poolsArray[i].apr);
    }

    let topFiveApr = poolAprs.sort(function(a, b){return b-a}).slice(0, top);

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

    return topFiveList.sort((a, b) => parseFloat(b.aprYearly) - parseFloat(a.aprYearly));
};

const readFileData = async (fileName) => {

  const fs = require('fs');

  let data = fs.readFileSync(`./static/${fileName}`).toString();
  data = Number(data);

  console.log(`[!] tvl.txt read with value: ${data}`);

  return data;
};

const writeFileData = async (fileName, content) => {

  const fs = require('fs');

  fs.writeFileSync(`./static/${fileName}`, content);
  console.log(`[!] tvl.txt updated with value: ${content}`);
}

module.exports = { getVelodromeApiData, getVeloThumbnail, getMergedThumbnail, getTokenColor, getPools, 
  getStablePools, getVolatilePools, getAllPoolsLists, getTotalTvl, topTvl, topApr, readFileData, writeFileData };