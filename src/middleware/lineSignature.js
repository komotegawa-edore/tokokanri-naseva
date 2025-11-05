const { middleware } = require('@line/bot-sdk');
const { config } = require('../config/line');

// LINE署名検証ミドルウェア
const lineSignatureMiddleware = middleware(config);

module.exports = lineSignatureMiddleware;
