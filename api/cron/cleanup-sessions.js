// Vercel Cron Job: 期限切れセッションのクリーンアップ
const sessionRepository = require('../../src/repositories/sessionRepository');

module.exports = async (req, res) => {
  try {
    // Cron jobからのリクエストか確認（セキュリティ）
    const authHeader = req.headers.authorization;

    // Vercel Cronの場合は自動的に認証されるが、念のためチェック
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('期限切れセッションのクリーンアップを開始...');

    await sessionRepository.cleanupExpiredSessions();

    console.log('期限切れセッションのクリーンアップ完了');

    res.status(200).json({
      success: true,
      message: 'Sessions cleaned up successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('セッションクリーンアップエラー:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
