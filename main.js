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

  if (command === 'help') {
    dataFunctions.help(msg);
  }

  // VELO price check
  if (command === 'price') {
    dataFunctions.getUSDPrice(msg);
  }

  // VELO market cap check
  if (command === 'marketcap') {
    dataFunctions.getMarketCap(msg);
  }

  // get total VELO, veVELO supply and return % locked
  if (command === 'supply') {
    dataFunctions.getTotalSupply(msg);
  }

  // check pool APR
  if (command === 'apr') {

    if (arg.length > 1) {
      msg.reply('Please only provide one argument. Type !poollist to see options');
      console.log('[*] !apr - User requested pool APR but used more than one argument');
      return;
    }

    let selectedPool = arg[0];
    dataFunctions.getPoolApr(msg, selectedPool);
  }
  
  // retrieve list of pools that can be used with !apr 
  if (command === 'poollist') {
    dataFunctions.getPoolList(msg);
  }

  // retrieve list of pools that contain a specified token
  if (command === 'pools') {

    if (arg.length > 1) {
      msg.reply('Please only select one token.');
      console.log('[*] !pools - User tried to search for more than one token');
      return;
    }

    let selectedToken = arg[0];
    dataFunctions.getTokenPoolList(msg, selectedToken);
  }

  // get pool size info inc token amounts in a specified pool
  if (command === 'poolsize') {

    if (arg.length > 1) {
      msg.reply('Please only select one pool. Type !poollist to see options.');
      console.log('[*] !poolsize - User requested pool APR but used more than one argument');
      return;
    }

    let selectedPool = arg[0];
    dataFunctions.getPoolSize(msg, selectedPool);
  }

  // get pool apr and token sizes
  if (command === 'pool') {

    if (arg.length > 1) {
      msg.reply('Please only select one pool. Type !poollist to see options.');
      console.log('[*] !poolinfo - User requested pool APR but used more than one argument');
      return;
    }

    let selectedPool = arg[0];
    dataFunctions.getPoolInfo(msg, selectedPool);
  }
});

// login to Discord
client.login(process.env.TOKEN)