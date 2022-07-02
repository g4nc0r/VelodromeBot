const Discord = require('discord.js');
require('log-timestamp');
require('dotenv').config();

const dataFunctions = require('./dataFunctions.js');

// Discord client instance
const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES] });

client.on('ready', () => {
  console.log('\x1b[41m%s\x1b[0m', `##### Logged in as ${client.user.tag}! #####`);
  // lists current active servers 
  console.log('\x1b[33m%s\x1b[0m', 'Servers: ')
  client.guilds.cache.forEach((guild) => {
    console.log('\x1b[33m%s\x1b[0m', '[~] ' + guild.name)
  });

  const testingChannel = client.channels.cache.get(process.env.TESTING_CHANNEL_ID);
  testingChannel.send("🚴‍♂️ VelodromeBribeBot has booted up 🚴‍♂️");
})

// prevent bot from replying to own messages
client.on('messageCreate', msg => {
  if (msg.author.bot === client.user) return;

  const prefix = "!";
  // removes ! prefix, trims any extra spaces, splits the string by one or many spaces
  const arg = msg.content.slice(prefix.length).trim().split(/ +/g);
  // remove one element from the array and return it. Command is returned, and args separated
  const command = arg.shift().toLowerCase();

  // test message
  if (command === 'test') {
    console.log('[*] Test message received');
    msg.channel.send("Test message received");
  }

  // return list of commands
  if (command === 'help') {
    dataFunctions.help(msg);
  }

  // return current VELO USD price
  if (command === 'price') {
    dataFunctions.getVeloUsdPrice(msg);
  }

  // return current VELO market cap from Coingecko
  if (command === 'marketcap') {
    dataFunctions.getMarketCap(msg);
  }

  // get total VELO, veVELO supply and return % locked
  if (command === 'supply') {
    dataFunctions.getTotalSupply(msg);
  }

  // return list of pools or pool containing a specified token
  if (command === 'pools') {

    if (arg.length === 0) {
      dataFunctions.getPoolList(msg);
    }

    if (arg.length > 1) {
      msg.reply('Please only select one token.');
      console.log('[*] !pools - User tried to search for more than one token');
      return;
    }

    if (arg.length === 1) {
      let selectedToken = arg[0];
      dataFunctions.getTokenPoolList(msg, selectedToken);

    }
  }

  // return list of sAMM stable pools
  if (command === 'spools') {
    dataFunctions.getStablePoolList(msg);
  }

  // return list of vAMM volatile pools
  if (command === 'vpools') {
    dataFunctions.getVolatilePoolList(msg);
  }

  // return pool daily, weekly and yearly APR
  if (command === 'apr') {

    if (arg.length > 1) {
      msg.reply('Please only provide one argument. Type \`!poollist\` to see options');
      console.log('[*] !apr - User requested pool APR but used more than one argument');
      return;
    }
  
    let selectedPool = arg[0];
    dataFunctions.getPoolApr(msg, selectedPool);
  }

  /*// return top 5 pools by APR
  if (command === 'top5') {
    dataFunctions.getTopFiveApr(msg);
  }*/
  
  // return total tokens and USD TVL value
  if (command === 'tvl') {

    if (arg.length > 1) {
      msg.reply('Please only select one pool. Type \`!poollist\` to see options.');
      console.log('[*] !poolsize - User requested pool APR but used more than one argument');
      return;
    }

    let selectedPool = arg[0];
    dataFunctions.getPoolUsdTvl(msg, selectedPool);
  }

  // get pool APR and TVL
  if (command === 'pool') {

    if (arg.length > 1) {
      msg.reply('Please only select one pool. Type \`!poollist\` to see options.');
      console.log('[*] !poolinfo - User requested pool APR but used more than one argument');
      return;
    }

    let selectedPool = arg[0];
    dataFunctions.getPoolInfo(msg, selectedPool);
  }

  // get velo stats - price, marketcap, supply
  if (command === 'velo') {
    dataFunctions.getVeloInfo(msg);
  }
});

// login to Discord
client.login(process.env.TOKEN)

// enable GET requests to ensure uptime
const express = require('express')
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('VelodromeBot Online')
  console.log('\x1b[2m%s\x1b[0m', '[*] GET request received')
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
});