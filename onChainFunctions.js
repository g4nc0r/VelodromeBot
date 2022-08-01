const ethers = require('ethers');
const customHttpProvider = new ethers.providers.JsonRpcProvider('https://mainnet.optimism.io');

const { veloAddress, veNftAddress } = require('./constants.js');

const veloAbi = require('./abi/veloAbi.js').veloAbi;
const veNftAbi = require('./abi/veNftAbi.js').veNftAbi;

const trim = (x) => {
  return x / 10 **18;
};

module.exports = {
  // get total VELO, veVELO supply and return % locked
  getTotalSupply: async function (msg) {

    const veloContract = new ethers.Contract(veloAddress, veloAbi, customHttpProvider);
    
    let totalSupply = await veloContract.totalSupply();
    let veTotalSupply = await veloContract.balanceOf(veNftAddress);

    const percentageLocked = ((veTotalSupply / totalSupply) * 100).toFixed(2);

    totalSupply = trim(totalSupply);
    veTotalSupply = trim(veTotalSupply);

    return { totalSupply, veTotalSupply, percentageLocked };
  },
  // get total protocol votes
  getTotalVotes: async function (msg) {

    const veNftContract = new ethers.Contract(veNftAddress, veNftAbi, customHttpProvider);

    let totalVotes = await veNftContract.totalSupply();

    totalVotes = trim(totalVotes);

    return totalVotes;   
  },
  // get veNFT info
  getVeNft: async function(veNftId) {

    const veNftContract = new ethers.Contract(veNftAddress, veNftAbi, customHttpProvider);
    const owner = await veNftContract.ownerOf(veNftId);

    if (owner === '0x0000000000000000000000000000000000000000') {
      return;
    } else {

      const lockedData = await veNftContract.locked(veNftId);
      let balanceOfNft = await veNftContract.balanceOfNFT(veNftId);
      const voted = await veNftContract.voted(veNftId);

      const votePowerPecentage = (balanceOfNft / (await veNftContract.totalSupply()) * 100);

      balanceOfNft = trim(balanceOfNft);
      
      const lockEnd = ethers.utils.formatUnits(lockedData.end, 0);
      const lockEndDate = new Date(Number(lockEnd)*1000);
      let lockedAmount = ethers.utils.formatEther(lockedData.amount);

      let isAttached;
      const veNftAttachments = await veNftContract.attachments(veNftId);

      if (veNftAttachments > 0) {
        isAttached = true;
      } else {
        isAttached = false;
      }

      return { owner, lockedAmount, balanceOfNft, lockEndDate, voted, votePowerPecentage, isAttached }
    }
  },
};

