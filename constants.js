
const veloAddress = '0x3c8B650257cFb5f272f799F5e2b4e65093a11a05';
const veNftAddress = '0x9c7305eb78a432ced5C4D14Cac27E8Ed569A2e26';
const veloUsdcPoolAddress = '0xe8537b6ff1039cb9ed0b71713f697ddbadbb717d';

const tokenColors = [
  {arg: 'velo', color: '#016962', id: 'velodrome-finance'},
  {arg: 'thales', color: '#0c1f3f', id:'thales'}, 
  {arg: 'frax', color: '#000000', id: 'frax'},
  {arg: 'snx', color: '#0f0c20', id: 'synthetix-network-token'},
  {arg: 'weth', color: '#787e9d', id: 'weth'},
  {arg: 'usdc', color: '#2775c9', id: 'usd-coin'},
  {arg: 'lyra', color: '#4be29d', id: 'lyra'},
  {arg: 'op', color: '#e70101', id: 'optimism'},
  {arg: 'bitant', color: '#7a5f3d', id: 'bitant'},
  {arg: 'link', color: '#335dd2', id: 'chainlink'},
  {arg: 'crv', color: '#ebff0c', id: 'curve-dao-token'},
  {arg: 'hnd', color: '#000000', id: 'hundred-finance'},
  {arg: 'perp', color: '#1c5c75', id: 'perpetual-protocol'},
  {arg: 'dola', color: '#6e47d8', id: 'dola'},
  {arg: 'dai', color: '#fab324', id: 'dai'},
  {arg: 'fxs', color: '#000000', id: 'frax-share'},
  {arg: 'uni', color: '#fe007a', id: 'uniswap'},
  {arg: 'susd', color: '#0f0c20', id: 'susd'},
  {arg: 'slink', color: '#335dd2', id: 'slink'},
  {arg: 'seth', color: '#787e9d', id: 'seth'},
  {arg: 'usdt', color: '#26a17b', id: 'tether'}

];

const stables = ['usdc', 'usdt', 'frax', 'susd', 'alusd', 'dai', 'dola', 'lusd'];

const helpList = '```' +
  `============================================\n` +
  `COMMAND           | DESCRIPTION\n` +
  `============================================\n` +
  `!price            | VELO price\n` +
  `!marketcap        | VELO marketcap\n` +
  `!supply           | VVELO, veVELO, %locked\n` +
  `!apr <pool>       | Pool APR\n` +
  `!poollist         | List of all pools\n` +
  `!pools <token>    | Pools contining <token>\n` +
  `!poolsize <pool>  | Pool size\n` +
  `!pool <pool>      | Pool APR and size` + 
  '```';

module.exports = {
  veloAddress: veloAddress,
  veNftAddress: veNftAddress,
  veloUsdcPoolAddress: veloUsdcPoolAddress,
  tokenColors: tokenColors,
  stables: stables,
  helpList: helpList,
};
