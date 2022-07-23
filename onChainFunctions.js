const ethers = require('ethers');
const customHttpProvider = new ethers.providers.JsonRpcProvider('https://mainnet.optimism.io');

const { veloAddress, veNftAddress } = require('./constants.js');

const veloAbi = require('./abi/veloAbi.js').veloAbi;
// require pair Abi
const veloUsdcAbi = require('./abi/veloUsdcAbi.js').veloUsdcAbi;
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

    let percentageLocked = ((veTotalSupply / totalSupply) * 100).toFixed(2);

    totalSupply = trim(totalSupply);
    veTotalSupply = trim(veTotalSupply);

    return { totalSupply, veTotalSupply, percentageLocked };
  },
  getTotalVotes: async function (msg) {

    let veNftContract = new ethers.Contract(veNftAddress, veNftAbi, customHttpProvider);

    let totalVotes = await veNftContract.totalSupply();

    totalVotes = trim(totalVotes);

    return totalVotes;   
  },
  getVeNft: async function(veNftId) {

    let veNftContract = new ethers.Contract(veNftAddress, veNftAbi, customHttpProvider);

    console.log(await veNftContract.locked(veNftId));

    const owner = await veNftContract.ownerOf(veNftId);

    if (owner === '0x0000000000000000000000000000000000000000') {
      return;
    } else {

      let lockedData = await veNftContract.locked(veNftId);
      let balanceOfNft = await veNftContract.balanceOfNFT(veNftId);
      const voted = await veNftContract.voted(veNftId);

      const votePowerPecentage = (balanceOfNft / (await veNftContract.totalSupply()) * 100);

      balanceOfNft = trim(balanceOfNft);
      
      const lockEnd = ethers.utils.formatUnits(lockedData.end, 0);
      const lockEndDate = new Date(Number(lockEnd)*1000);
      let lockedAmount = ethers.utils.formatEther(lockedData.amount);

      console.log('Owner: ' + owner);
      console.log('Lock Amount: ' + lockedAmount);
      console.log('Balance: ' + balanceOfNft);
      console.log('Lock End: ' + lockEndDate);
      console.log('Voted: ' + voted);
      console.log('Vote Power %: ' + votePowerPecentage);

      return { owner, lockedAmount, balanceOfNft, lockEndDate, voted, votePowerPecentage }

    }
  },
  /*getDailyVolume: async function (msg) {
    
    // require pair address
    const veloUsdcAddress = '0xe8537b6ff1039cb9ed0b71713f697ddbadbb717d';

    // instantiate web3 with pair abi, address
    const veloUsdcPairContract = new ethers.Contract(veloUsdcAddress, veloUsdcAbi, customHttpProvider);

    const rangeNumberOfblocks = 10000;
    const latestBlockNumber = await customHttpProvider.getBlockNumber();

    console.log(`Latest Block: ${latestBlockNumber}`);
    
    const blockRange = {
      fromBlock: latestBlockNumber - rangeNumberOfblocks,
      toBlock: latestBlockNumber
    };

    //console.log(veloUsdcPairContract.interface.events);

    const swapEvent = veloUsdcPairContract.interface.events.Swap;

    const logs = await customHttpProvider.getLogs({
      fromBlock: latestBlockNumber - rangeNumberOfblocks,
      toblock: "latest",
      address: veloUsdcAddress,
      topics: swapEvent
    });
     
  //  const events = [];
  //  for (let i in logs) {
  //    events.push(veloUsdcPairContract.interface.parseLog(logs[i]))
  //  }
    let abi = [
      "event newConnect (string indexed hashedName, string name, bytes32 connectId, string encrypted, address owner)"
    ];

    let iface = new ethers.utils.Interface(abi);

    logs.forEach((log) => {
      console.log(iface.parseLog(log))
    })


    /*const parseEtherjsLog = (parsed) => {
      let parsedEvent = {};
      for (let i=0; i < parsed.args.length; i++) {
        const input = parsed.eventFragment.inputs[i];
        const arg = parsed.args[i];
        const newObj = {...input, ...{"value": arg}};
        parsedEvent[input["name"]] = newObj
      }
      console.log(parsedEvent);
    }

    parseEtherjsLog(events);

    console.log(swaps);
  }*/
};

