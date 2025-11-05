require('dotenv').config();
const express = require('express');
const lineSignatureMiddleware = require('./middleware/lineSignature');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./middleware/logger');
const webhookController = require('./controllers/webhookController');
const sessionRepository = require('./repositories/sessionRepository');

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア設定
app.use(logger);
app.use(express.json());

// ヘルスチェックエンドポイント
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: '学習塾登校管理システム',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// LINE Webhook エンドポイント
app.post(
  '/webhook',
  lineSignatureMiddleware,
  webhookController.handleWebhook
);

// エラーハンドリングミドルウェア
app.use(errorHandler);

// ローカル開発時のみサーバー起動
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`✅ サーバーが起動しました: http://localhost:${PORT}`);
    console.log(`環境: ${process.env.NODE_ENV || 'development'}`);

    // 期限切れセッション削除を定期実行（1時間ごと）
    setInterval(() => {
      sessionRepository.cleanupExpiredSessions()
        .then(() => console.log('期限切れセッションを削除しました'))
        .catch((err) => console.error('セッション削除エラー:', err));
    }, 60 * 60 * 1000);
  });

  // プロセス終了時の処理
  process.on('SIGINT', () => {
    console.log('\nサーバーを終了します...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\nサーバーを終了します...');
    process.exit(0);
  });
}

// Vercel用にアプリをエクスポート
module.exports = app;
