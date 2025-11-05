// Vercel Serverless Function エントリーポイント

// 環境変数を読み込む（Vercelでは環境変数が自動設定されるため、.envは不要）
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '.env' });
}

// デバッグ情報
console.log('Vercel Function starting...');
console.log('NODE_ENV:', process.env.NODE_ENV);

try {
  // Expressアプリをインポート
  const app = require('../src/index');

  console.log('Express app loaded successfully');

  // Vercelサーバーレス関数としてエクスポート
  module.exports = app;
} catch (error) {
  console.error('Failed to load Express app:', error);
  throw error;
}
