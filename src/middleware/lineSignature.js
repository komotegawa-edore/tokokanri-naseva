const { validateSignature } = require('@line/bot-sdk');
const { config } = require('../config/line');

// Vercel環境用のLINE署名検証ミドルウェア
const lineSignatureMiddleware = (req, res, next) => {
  // Vercel環境では、リクエストボディが既にパースされているため
  // 生のボディテキストを再構築する必要がある
  const body = JSON.stringify(req.body);
  const signature = req.headers['x-line-signature'];

  if (!signature) {
    console.error('❌ LINE署名ヘッダーが見つかりません');
    return res.status(401).json({ error: 'Unauthorized: No signature' });
  }

  try {
    // 署名を検証
    const isValid = validateSignature(body, config.channelSecret, signature);

    if (!isValid) {
      console.error('❌ LINE署名検証に失敗しました');
      return res.status(401).json({ error: 'Unauthorized: Invalid signature' });
    }

    console.log('✅ LINE署名検証成功');
    // eventsを設定（LINE SDKミドルウェアの動作を模倣）
    req.body.events = req.body.events || [];
    next();
  } catch (error) {
    console.error('❌ 署名検証中にエラー:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = lineSignatureMiddleware;
