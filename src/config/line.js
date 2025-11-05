require('dotenv').config();
const { Client } = require('@line/bot-sdk');

// LINE Bot設定
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

// LINEクライアント作成
const client = new Client(config);

module.exports = {
  config,
  client,
};
