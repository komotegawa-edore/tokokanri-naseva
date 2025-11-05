/**
 * エラーハンドリングミドルウェア
 */
function errorHandler(err, req, res, next) {
  console.error('エラー発生:', err);

  // LINEからのリクエストの場合は200を返す（再送防止）
  if (req.path === '/webhook') {
    return res.status(200).json({ message: 'Error handled' });
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'エラーが発生しました',
  });
}

module.exports = errorHandler;
