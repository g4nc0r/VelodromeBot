const Discord = require('discord.js');
require('log-timestamp');
require('dotenv').config();

const discordCommands = require('./discordCommands.js');

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
  testingChannel.send('🚴‍♂️ VelodromeBribeBot has booted up');
});

client.on('messageCreate', msg => {
  // prevent bot from replying to own messages
  if (msg.author.bot === client.user) return;

  // ignore any non-prefixed statements
  const prefix = '!';
  if (!msg.content.startsWith(prefix)) return;

  // removes ! prefix, trims any extra spaces, splits the string by one or many spaces
  const arg = msg.content.slice(prefix.length).trim().split(/ +/g);
  // remove one element from the array and return it. Command is returned, and args separated
  const command = arg.shift().toLowerCase();

  // test message
  if (command === 'test') {
    console.log('\x1b[31m%s\x1b[0m', '[!] !test - test message received');
    msg.channel.send('Test message received');
  }

  // return list of commands
  if (command === 'help') {
    discordCommands.help(msg);
  }

  // return epoch info
  if (command === 'epoch') {
    discordCommands.getEpoch(msg);
  }

  // return current VELO USD price
  if (command === 'price') {
    discordCommands.getVeloUsdPrice(msg);
  }

  // return current VELO market cap from Coingecko
  if (command === 'marketcap') {
    discordCommands.getMarketCap(msg);
  }

  // get total VELO, veVELO supply and return % locked
  if (command === 'supply') {
    discordCommands.getTotalSupply(msg);
  }

  // return pools filtered by TVL or pool containing a specified token
  if (command === 'pools') {

    if (arg.length === 0) {
      discordCommands.getPoolList(msg);
    }

    if (arg.length > 1) {
      msg.reply('Please only select one token.');
      console.log('\x1b[31m%s\x1b[0m', '[*] !pools - User tried to search for more than one token');
      return;
    }

    if (arg.length === 1) {
      let selectedToken = arg[0];
      discordCommands.getTokenPoolList(msg, selectedToken);
    }
  }

  // return unfiltered list of pools
  if (command === 'allpools') {
    discordCommands.getAllPoolList(msg);
  }

  // return list of sAMM stable pools
  if (command === 'spools') {
    discordCommands.getStablePoolList(msg);
  }

  // return list of vAMM volatile pools
  if (command === 'vpools') {
    discordCommands.getVolatilePoolList(msg);
  }

  // return pool daily, weekly and yearly APR
  if (command === 'apr') {

    if (arg.length > 1) {
      msg.reply('Please only provide one argument. Type \`!pools\` to see pools with >$2,000 TVL, or \`!allpools\` for all.');
      console.log('\x1b[31m%s\x1b[0m', '[*] !apr - User requested pool APR but used more than one argument');
      return;
    }
  
    let selectedPool = arg[0];
    discordCommands.getPoolApr(msg, selectedPool);
  }

  // return top 5 pools by APR or TVL
  if (command === 'top5') {

    if (arg.length === 0) {
      discordCommands.getTopFive(msg);
      return;
    }

    if ((arg[0].toLowerCase() === 'apr') || (arg[0].toLowerCase() === 'apy')) {

      if (arg.length > 1) {
        if (arg[1].toLowerCase() === 'stable') {
          discordCommands.getTopApr(5, msg, false, 'stable');
          return;
        }

        if (arg[1].toLowerCase() === 'volatile') {
          discordCommands.getTopApr(5, msg, false, 'volatile');
          return;
        }
      }
      
      discordCommands.getTopApr(5, msg, false, null);
      return;
    }

    if ((arg[0].toLowerCase() === 'unapr') || (arg[0].toLowerCase() === 'unapy')) {
      discordCommands.getTopApr(5, msg, true);
      return;
    }

    if (arg[0].toLowerCase() === 'tvl') {

      if (arg.length > 1) {
        if (arg[1].toLowerCase() === 'stable') {

          discordCommands.getTopTvl(5, msg, 'stable')
          return;

        } else if (arg[1].toLowerCase() === 'volatile') {

          discordCommands.getTopTvl(5, msg, 'volatile')
          return;

        }
      }

      discordCommands.getTopTvl(5, msg, null);
      return;
    }
    
    if (arg.length > 3) {
      msg.reply('Too many arguments.');
      console.log('\x1b[31m%s\x1b[0m', '[*] !top5 - User provided more than one arg')
      return;
    }
  }

  // return top 10 pools by TVL
  if (command === 'top10') {

    if (arg.length === 0) {
      discordCommands.getTopTen(msg);
      return;
    }

    if ((arg[0].toLowerCase() === 'apr') || (arg[0].toLowerCase() === 'apy')) {

      if (arg.length > 1) {
        if (arg[1].toLowerCase() === 'stable') {
          discordCommands.getTopApr(10, msg, false, 'stable');
          return;
        }

        if (arg[1].toLowerCase() === 'volatile') {
          discordCommands.getTopApr(10, msg, false, 'volatile');
          return;
        }
      }

      discordCommands.getTopApr(10, msg, false);
      return;
    }

    if ((arg[0].toLowerCase() === 'unapr') || (arg[0].toLowerCase() === 'unapy')) {
      discordCommands.getTopApr(10, msg, true);
      return;
    }

    if (arg[0].toLowerCase() === 'tvl') {

      if (arg.length > 1) {
        if (arg[1].toLowerCase() === 'stable') {

          discordCommands.getTopTvl(10, msg, 'stable');
          return;

        } else if (arg[1].toLowerCase() === 'volatile') {

          discordCommands.getTopTvl(10, msg, 'volatile');
          return;

        }
      }
      
      discordCommands.getTopTvl(10, msg, null);
      return;
    }

    if (arg.length > 3) {
      msg.reply('Too many arguments.');
      console.log('\x1b[31m%s\x1b[0m', '[*] !top10 - User provided more than one arg');
      return;
    }
  }

  // return top 25 pools by TVL
  if (command === 'top25') {

    if (arg.length === 0) {
      msg.reply('With the `\!top25`\ command please specify apr or tvl.');
      return;
    }

    if ((arg[0].toLowerCase() === 'apr') || (arg[0].toLowerCase() === 'apy')) {

      if (arg.length > 1) {
        if (arg[1].toLowerCase() === 'stable') {
          discordCommands.getTopApr(25, msg, false, 'stable');
          return;
        }

        if (arg[1].toLowerCase() === 'volatile') {
          discordCommands.getTopApr(25, msg, false, 'volatile');
          return;
        }
      }

      discordCommands.getTopApr(25, msg, false);
      return;
    }

    if ((arg[0].toLowerCase() === 'unapr') || (arg[0].toLowerCase() === 'unapy')) {
      discordCommands.getTopApr(25, msg, true);
      return;
    }

    if (arg[0].toLowerCase() === 'tvl') {

      if (arg.length > 1) {
        if (arg[1].toLowerCase() === 'stable') {

          discordCommands.getTopTvl(25, msg, 'stable');
          return;

        } else if (arg[1].toLowerCase() === 'volatile') {

          discordCommands.getTopTvl(25, msg, 'volatile');
          return;

        }
      }
      
      discordCommands.getTopTvl(25, msg, null);
      return;
    }

    if (arg.length > 3) {
      msg.reply('Too many arguments.');
      console.log('\x1b[31m%s\x1b[0m', '[*] !top25 - User provided more than one arg');
      return;
    }
  }

  // return total tokens and USD TVL value
  if (command === 'tvl') {

    if (arg.length === 0) {
      discordCommands.getProtocolTvl(msg);
      return;
    }

    if (arg.length > 1) {
      msg.reply('Please only provide one argument. Type \`!pools\` to see pools with >$2,000 TVL, or \`!allpools\` for all.');
      console.log('\x1b[31m%s\x1b[0m', '[*] !poolsize - User requested pool APR but used more than one argument');
      return;
    }

    let selectedPool = arg[0];
    discordCommands.getPoolUsdTvl(msg, selectedPool);
  }

  // get pool APR and TVL
  if (command === 'pool') {

    if (arg.length > 1) {
      msg.reply('Please only provide one argument. Type \`!pools\` to see pools with >$2,000 TVL, or \`!allpools\` for all.');
      console.log('\x1b[31m%s\x1b[0m', '[*] !poolinfo - User requested pool APR but used more than one argument');
      return;
    }

    let selectedPool = arg[0];
    discordCommands.getPoolInfo(msg, selectedPool);
  }

  // get velo stats - price, marketcap, supply
  if (command === 'velo') {
    discordCommands.getVeloInfo(msg);
  }

  // to implement
  if (command === 'volume') {
    discordCommands.getDailyVolume();
  }

  // return specified veNFT info
  if (command === 'venft') {
    if (arg.length === 0) {
      msg.reply('Please specify the veNFT number.');
      return;
    }

    if (arg.length > 1) {
      msg.reply('Please specify one veNFT number.');
    }

    let selectedVeNft = arg[0];
    discordCommands.getVeNftInfo(msg, selectedVeNft);
  }

  // Easter egg
  if (command === 'weve') {
    msg.channel.send('https://gfycat.com/courteousagilearachnid');
  }

});

// login to Discord
client.login(process.env.TOKEN)

// enable GET requests to ping for uptime
const express = require('express')
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('VelodromeBot Online')
  console.log('\x1b[2m%s\x1b[0m', '[*] GET request received')
});
app.listen(port, () => {
  console.log('\x1b[2m%s\x1b[0m', `Listening on port ${port}`)
});

// cron jobs for daily tweets
const cron = require('node-cron');

cron.schedule('0 0 * * * ', function() {
  console.log('\x1b[31m%s\x1b[0m', '[*] cron job initiated');
  discordCommands.tweetTopFiveTvl();
  discordCommands.tweetTopFiveApr();
  discordCommands.tweetTopFiveApr('stable');
  discordCommands.tweetProtocolTvl();
});