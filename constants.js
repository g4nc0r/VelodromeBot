const pools = [
  {arg: 'velo/usdc', name: 'vAMM-VELO/USDC', addr: '0xe8537b6FF1039CB9eD0B71713f697DDbaDBb717d', gauge: '0x6b8EDC43de878Fd5Cd5113C42747d32500Db3873', token0id: 'velodrome-finance', token1id: 'usd-coin', color:'#016962'},
  {arg: 'op/usdc', name: 'vAMM-OP/USDC', addr: '0x47029bc8f5cbe3b464004e87ef9c9419a48018cd', gauge: '0x47029bc8f5CBe3b464004E87eF9c9419a48018cd',token0id: 'optimism', token1id: 'usd-coin', color:'#e70101'},
  {arg: 'velo/op', name: 'vAMM-VELO/OP', addr: '0xFFD74EF185989BFF8752c818A53a47FC45388F08', gauge: '0x1F36f95a02C744f2B3cD196b5e44E749c153D3B9',token0id: 'velodrome-finance', token1id: 'optimism', color:'#016962'},
  {arg: 'weth/usdc', name: 'vAMM-WETH/USDC', addr: '0x79c912fef520be002c2b6e57ec4324e260f38e50', gauge: '0xE2CEc8aB811B648bA7B1691Ce08d5E800Dd0a60a',token0id: 'weth', token1id: 'usd-coin', color:'#787e9d'},
  {arg: 'usdc/lusd', name: 'sAMM-USDC/LUSD', addr: '0x207AddB05C548F262219f6bFC6e11c02d0f7fDbe', gauge: '0x631dce3a422e1af1ad9d3952b06f9320e2f2ed72',token0id: 'usd-coin', token1id: 'liquity-usd', color:'#2775c9'},
  {arg: 'thales/usdc', name: 'vAMM-THALES/USDC', addr: '0x9355292f66552ea5717b274d27eefc8254011d83', gauge: '0x055ee7ddc298dca46172a7a9a43e28b76c17ad26',token0id: 'thales', token1id: 'usd-coin', color:'#0c1f3f'},
  {arg: 'lyra/usdc', name: 'vAMM-LYRA/USDC', addr: '0xdee1856d7b75abf4c1bdf986da4e1c6c7864d640', gauge: '0x1bda63dab1743089af8c0c94ed0b75772a9b9858',token0id: 'lyra-finance', token1id: 'usd-coin', color:'#4be29d'},
  {arg: 'op/dai', name: 'vAMM-OP/DAI', addr: '0x43c3f2d0aa0ebc433d654bb6ebf67f0c03f8d8d9', gauge: '0x05ef41da0b0c76b6e17be79bdaacf66306cbebb5',token0id: 'optimism', token1id: 'dai', color:'#e70101'},
  {arg: 'weth/op', name: 'vAMM-WETH/OP', addr: '0xcdd41009e74bd1ae4f7b2eecf892e4bc718b9302', gauge: '0x2f733b00127449fcf8b5a195bc51abb73b7f7a75',token0id: 'weth', token1id: 'optimism', color:'#787e9d'},
  {arg: 'hnd/usdc', name: 'vAMM-HND/USDC', addr: '0x588443c932b45f47e936b969eb5aa6b5fd4f3369', gauge: '0x883c6d437d45b7ce61c07606fb390e6c28be27b8',token0id: 'hundred-finance', token1id: 'usd-coin', color:'#000000'},
  {arg: 'frax/fxs', name: 'vAMM-FRAX/FXS', addr: '0xe2ea57fdf87624f4384ef6da5f3844e8e9e5d878', gauge: '0x3a8883381e4416488db94a8e0469394ecfa8a024',token0id: 'frax', token1id: 'frax-share', color:'#000000'},
  {arg: 'usdc/dai', name: 'sAMM-USDC/DAI', addr: '0x4f7ebc19844259386dbddb7b2eb759eefc6f8353', gauge: '0xc4ff55a961bc04b880e60219ccbbdd139c6451a4',token0id: 'usd-coin', token1id: 'dai', color:'#2775c9'},
  {arg: 'usdc/susd', name: 'sAMM-USDC/sUSD', addr: '0xd16232ad60188b68076a235c65d692090caba155', gauge: '0xb03f52d2db3e758dd49982defd6aeefea9454e80',token0id: 'usd-coin', token1id: 'nusd', color:'#2775c9'},
  {arg: 'snx/susd', name: 'vAMM-SNX/sUSD', addr: '0x85ff5b70de43fee34f3fa632addd9f76a0f6baa9', gauge: '0xfc4b6dea9276d906ad36828dc2e7dbacfc01b47f',token0id: 'havven', token1id: 'nusd', color:'#0f0c20'},
  {arg: 'weth/dola', name: 'vAMM-WETH/DOLA', addr: '0x43ce87a1ad20277b78cae52c7bcd5fc82a297551', gauge: '0x49ab32dc8c870ab033ca87df2b954c4c24405e64',token0id: 'weth', token1id: 'dola-usd', color:'#787e9d'},
  {arg: 'usdc/dola', name: 'sAMM-USDC/DOLA', addr: '0x6c5019d345ec05004a7e7b0623a91a0d9b8d590d', gauge: '0xafd2c84b9d1cd50e7e18a55e419749a6c9055e1f',token0id: 'usd-coin', token1id: 'dola-usd', color:'#2775c9'},
  {arg: 'usdc/alusd', name: 'sAMM-USDC/alUSD', addr: '0xe75a3f4bf99882ad9f8aebab2115873315425d00', gauge: '0x1d87cee5c2f88b60588dd97e24d4b7c3d4f74935',token0id: 'usd-coin', token1id: 'alchemix-usd', color:'#2775c9'},
  {arg: 'frax/usdc', name: 'sAMM-FRAX/USDC', addr: '0xadf902b11e4ad36b227b84d856b229258b0b0465', gauge: '0x14d60f07924e3a7226ddd368409243edf87e6205',token0id: 'frax', token1id: 'usd-coin', color:'#000000'},
  {arg: 'frax/op', name: 'vAMM-FRAX/OP', addr: '0x986d353a3700530be4e75794830f57e657bc68cb', gauge: '0x77b9a432b23ff5fc798c92a1435b0e51772bc538',token0id: 'frax', token1id: 'optimism', color:'#000000'},
  {arg: 'frax/susd', name: 'sAMM-FRAX/sUSD', addr: '0xac49498b97312a6716ef312f389b7e4d183a2a7c', gauge: '0xbf6c935a2b6ec453704ea72c8e14592f2fb27130',token0id: 'frax', token1id: 'nusd', color:'#000000'},
  {arg: 'lyra/susd', name: 'vAMM-LYRA/sUSD', addr: '0xe47d437252fe9cb5e74396eee63360d8647df25d', gauge: '0x3324539a66203eddbe8da4e45dfa8d8fd8985ebb',token0id: 'lyra-finance', token1id: 'nusd', color:'#4be29d'},
  {arg: 'velo/weth', name: 'vAMM-VELO/WETH', addr: '0x06141423dcf1a5a4c137039063ac873cdc1e363a', gauge: '0x0aaf1de71910d9f2be10e6c75b3eb6eca377cbf2',token0id: 'velodrome-finance', token1id: 'weth', color:'#016962'},
  {arg: 'op/lyra', name: 'vAMM-OP/LYRA', addr: '0xd3650ab80545c31088f89fb6d16930796758f3c1', gauge: '0x99347c4c68de5f661194e9854ef8399cd57ca0e5',token0id: 'optimism', token1id: 'lyra-finance', color:'#e70101'},
  {arg: 's-velo/op', name: 'sAMM-VELO/OP', addr: '0x557949dde71e88cc2f41d33d341ff42417a35a2d', gauge: '0x68398f950ADF50687C872b2b668895561aEBd798',token0id: 'velodrome-finance', token1id: 'optimism' , color:'#016962'},
  {arg: 's-velop/usdc', name: 'sAMM-VELO/USDC', addr: '0x335bd4ffa921160fc86ce3843f80a9941e7456c6', gauge: '0x0f1e2ACeC0Af7e8f77C8F0c6DF213FF7e7511A10',token0id: 'velodrome-finance', token1id: 'usd-coin', color:'#016962'},
  {arg: 'velo/susd', name: 'vAMM-VELO/sUSD', addr: '0x46b8a98d72820e28465a172687af920cc167e587', gauge: '0x8B57098ee6EafbE85fC3977Cb974B5ab929e63f2',token0id: 'velodrome-finance', token1id: 'nusd', color:'#016962'},
  {arg: 'velo/dai', name: 'vAMM-VELO/DAI', addr: '0xd04f675127d37bf7b009453116c17b7ef088cceb', gauge: '0x90C80b2A2F32B4f5646a79364fafd5099246eb88',token0id: 'velodrome-finance', token1id: 'dai', color:'#016962'},
  {arg: 's-velo/weth', name: 'sAMM-VELO/WETH', addr: '0xcfcf4bb472aa2ad6c82ebef2377a20829b6356ad', gauge: '0x58D90052EE670cD78fd07cfAF58be054f6DFF445',token0id: 'velodrome-finance', token1id: 'weth', color:'#016962'},
  {arg: 'velo/alusd', name: 'vAMM-VELO/alUSD', addr: '0x3e2882ef90fafab1894bec08f57745a0dd63950a', gauge: '0x6FA6fC9ecDbB0917731cb90d596210d7D5e6CD7b',token0id: 'velodrome-finance', token1id: 'alchemix-usd', color:'#016962'}
];

const commands = [
  { command: '!price', description: 'Latest VELO price' },
  { command: '!marketcap', description: 'Latest VELO marketcap'},
  { command: '!apr <pool>', descriotion: 'Fetches pool APR info - pool name format: \'velo usdc\''}
]

module.exports = {
  pools: pools,
  commands: commands
};
