const ethers = require('ethers');
const customHttpProvider = new ethers.providers.JsonRpcProvider('https://mainnet.optimism.io');

const { veloAddress, veNftAddress } = require('./constants.js');

const veloAbi = require('./abi/veloAbi.js').veloAbi;

const veloContract = new ethers.Contract(veloAddress, veloAbi, customHttpProvider);

const trim = (x) => {
  return x / 10 **18;
};

module.exports = {
  // get total VELO, veVELO supply and return % locked
  getTotalSupply: async function (msg) {
    
    let totalSupply = await veloContract.totalSupply();
    let veTotalSupply = await veloContract.balanceOf(veNftAddress);

    let percentageLocked = ((veTotalSupply / totalSupply) * 100).toFixed(2);

    totalSupply = trim(totalSupply);
    veTotalSupply = trim(veTotalSupply);

    return { totalSupply, veTotalSupply, percentageLocked };
  }
};

