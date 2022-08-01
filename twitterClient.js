const { TwitterApi } = require('twitter-api-v2');
require('dotenv').config();

const velodromeAlerts = new TwitterApi({
  appKey: process.env.TWITTER_APP_KEY,
  appSecret: process.env.TWITTER_APP_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET
});

const client = velodromeAlerts.readWrite;

module.exports = client;