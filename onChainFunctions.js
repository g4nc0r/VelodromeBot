const ethers = require('ethers');
const customHttpProvider = new ethers.providers.JsonRpcProvider('https://mainnet.optimism.io');

const veloAddress = '0x3c8B650257cFb5f272f799F5e2b4e65093a11a05';
const veNFTAddress = '0x9c7305eb78a432ced5C4D14Cac27E8Ed569A2e26'

const veloAbi = require('./abi/veloAbi.js').veloAbi;

const veloContract = new ethers.Contract(veloAddress, veloAbi, customHttpProvider);

const trim = (x) => {
  return x / 10 **18;
}

module.exports = {
  getTotalSupply: async function (msg) {
    
    let totalSupply = await veloContract.totalSupply();
    let veTotalSupply = await veloContract.balanceOf(veNFTAddress);

    let percentageLocked = ((veTotalSupply / totalSupply) * 100).toFixed(2);

    totalSupply = trim(totalSupply);
    veTotalSupply = trim(veTotalSupply);

    return { totalSupply, veTotalSupply, percentageLocked };
  }
}

