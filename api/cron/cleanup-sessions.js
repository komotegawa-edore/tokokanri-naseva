// Vercel Cron Job: 期限切れセッションと処理済みWebhookのクリーンアップ
const sessionRepository = require('../../src/repositories/sessionRepository');
const processedWebhooksRepository = require('../../src/repositories/processedWebhooksRepository');

module.exports = async (req, res) => {
  try {
    // Cron jobからのリクエストか確認（セキュリティ）
    const authHeader = req.headers.authorization;

    // Vercel Cronの場合は自動的に認証されるが、念のためチェック
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('クリーンアップを開始...');

    // 期限切れセッションのクリーンアップ
    await sessionRepository.cleanupExpiredSessions();
    console.log('✅ 期限切れセッションのクリーンアップ完了');

    // 古い処理済みWebhookレコードのクリーンアップ（7日以上前）
    const deletedCount = await processedWebhooksRepository.cleanupOldRecords();
    console.log(`✅ 処理済みWebhookレコードのクリーンアップ完了: ${deletedCount}件削除`);

    res.status(200).json({
      success: true,
      message: 'Cleanup completed successfully',
      deleted_webhooks: deletedCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('クリーンアップエラー:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
