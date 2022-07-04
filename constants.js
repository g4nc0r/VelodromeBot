const veloAddress = '0x3c8B650257cFb5f272f799F5e2b4e65093a11a05';
const veNftAddress = '0x9c7305eb78a432ced5C4D14Cac27E8Ed569A2e26';
const veloUsdcPoolAddress = '0xe8537b6ff1039cb9ed0b71713f697ddbadbb717d';

const tokenColors = [
  {arg: 'velo', color: '#f1ece2', id: 'velodrome-finance'},
  {arg: 'thales', color: '#0c1f3f', id:'thales'}, 
  {arg: 'frax', color: '#000000', id: 'frax'},
  {arg: 'snx', color: '#0f0c20', id: 'havven'},
  {arg: 'weth', color: '#787e9d', id: 'weth'},
  {arg: 'usdc', color: '#2775c9', id: 'usd-coin'},
  {arg: 'lyra', color: '#4be29d', id: 'lyra-finance'},
  {arg: 'op', color: '#e70101', id: 'optimism'},
  {arg: 'bitant', color: '#7a5f3d', id: 'bitant'},
  {arg: 'link', color: '#335dd2', id: 'chainlink'},
  {arg: 'crv', color: '#ebff0c', id: 'curve-dao-token'},
  {arg: 'hnd', color: '#000000', id: 'hundred-finance'},
  {arg: 'perp', color: '#1c5c75', id: 'perpetual-protocol'},
  {arg: 'dai', color: '#fab324', id: 'dai'},
  {arg: 'fxs', color: '#000000', id: 'frax-share'},
  {arg: 'uni', color: '#fe007a', id: 'uniswap'},
  {arg: 'susd', color: '#0f0c20', id: 'nusd'},
  {arg: 'slink', color: '#335dd2', id: 'slink'},
  {arg: 'seth', color: '#787e9d', id: 'seth'},
  {arg: 'usdt', color: '#26a17b', id: 'tether'},
  {arg: 'mai', color: '#db3737', id: 'mimatic'},
  {arg: 'aleth', color: '#f5c09a', id: 'alchemix'},
  {arg: 'alusd', color: '#f5c09a', id: 'alchemix-usd'},
  {arg: 'lusd', color: '#2eb6ea', id: 'liquity-usd'},
  {arg: 'dola', color: '#6135db', id: 'dola-usd'}
];

const stables = ['usdc', 'usdt', 'frax', 'susd', 'alusd', 'dai', 'dola', 'lusd', 'mai'];
const peggedExceptions = ['aleth', 'weth', 'seth'];

const helpList = '```' +
  `============================================\n` +
  `COMMAND           | DESCRIPTION\n` +
  `============================================\n` +
  `!velo             | VELO info\n` +
  `!price            | VELO price\n` +
  `!marketcap        | VELO marketcap\n` +
  `!supply           | VELO, veVELO, %locked\n` +
  `!pools            | Filtered list of pools\n` +
  `!pools <token>    | Pools containing <token>\n` +
  `!allpools         | List of all pools\n` +
  `!spools           | List all sAMM pools\n` +
  `!vpools           | List all vAMM pools\n` +
  `!pool <pool>      | Pool APR and size\n` +
  `!apr <pool>       | Pool APR\n` +
  `!tvl              | Total protocol TVL\n` +
  `!tvl <pool>       | Pool TVL info\n` +
  `!top5             | Top 5 pools APR & TVL\n` +
  `!top5 apr         | Top 5 pools APR\n` +
  `!top5 tvl         | Top 5 pools TVL\n` +
  '```';

const staticIcons = {
  veloFooterIcon: 'https://assets.coingecko.com/coins/images/25783/small/velo.png',
  opFooterIcon: 'https://assets.coingecko.com/coins/images/25244/small/OP.jpeg',
  coingeckoFooterIcon: 'https://static.coingecko.com/s/thumbnail-007177f3eca19695592f0b8b0eabbdae282b54154e1be912285c9034ea6cbaf2.png',
  dexscreenerFooterIcon: 'https://cdn-1.webcatalog.io/catalog/dex-screener/dex-screener-icon-filled.png',
  velodromeIcon: 'https://raw.githubusercontent.com/g4nc0r/VelodromeBot/main/static/velodrome.png',
  velodromeIconSmall: 'https://raw.githubusercontent.com/g4nc0r/VelodromeBot/main/static/velodrome-sm.png',
  optimismIcon: 'https://raw.githubusercontent.com/g4nc0r/VelodromeBot/main/static/optimism.png'
};

const urls = {
  coingeckoUrl: 'http://api.coingecko.com/api/v3/coins/',
  veloCoingeckoUrl: 'http://api.coingecko.com/api/v3/coins/velodrome-finance',
  dexscreenerUrl: 'http://api.dexscreener.com/latest/dex/pairs/optimism/',
  velodromeApiUrl: 'https://api.velodrome.finance/api/v1/pairs'
};

module.exports = {
  veloAddress: veloAddress,
  veNftAddress: veNftAddress,
  veloUsdcPoolAddress: veloUsdcPoolAddress,
  tokenColors: tokenColors,
  stables: stables,
  peggedExceptions: peggedExceptions,
  helpList: helpList,
  urls: urls,
  staticIcons: staticIcons
};
