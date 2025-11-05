const { formatDate, getCurrentJSTTime } = require('../utils/dateFormatter');

/**
 * リクエストログミドルウェア
 */
function logger(req, res, next) {
  const timestamp = formatDate(getCurrentJSTTime(), 'yyyy-MM-dd HH:mm:ss');
  console.log(`[${timestamp}] ${req.method} ${req.path}`);

  // リクエストボディをログ（開発環境のみ）
  if (process.env.NODE_ENV === 'development' && req.body) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }

  next();
}

module.exports = logger;
