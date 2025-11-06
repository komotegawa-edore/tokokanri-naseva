const supabase = require('../config/supabase');

/**
 * Webhook重複処理を防ぐためのリポジトリ
 * LINEのWebhook再送により同じイベントが複数回処理されるのを防ぐ
 */

/**
 * Webhookイベントが既に処理済みかチェック
 * @param {string} webhookEventId - LINEのWebhookイベントID
 * @returns {Promise<boolean>} - 処理済みならtrue
 */
async function isProcessed(webhookEventId) {
  try {
    // webhook_logsテーブルでwebhook_event_idカラムを検索
    // インデックスが効くため高速
    const { data, error } = await supabase
      .from('webhook_logs')
      .select('id')
      .eq('webhook_event_id', webhookEventId)
      .limit(1);

    if (error) {
      console.error('webhook_logs チェックエラー:', error);
      return false; // エラー時は処理を続行（安全側に倒す）
    }

    return data && data.length > 0; // データが存在すれば処理済み
  } catch (error) {
    console.error('isProcessed エラー:', error);
    return false; // エラー時は処理を続行
  }
}

/**
 * Webhookイベントを処理済みとして記録
 * 注: webhook_logsテーブルはwebhookLogRepositoryで既に記録されているため、
 * この関数は実際には何もしない（既存のログ記録で重複チェックが可能）
 * @returns {Promise<void>}
 */
async function markAsProcessed() {
  // webhook_logsは既にwebhookLogRepository.logWebhookEventで記録されているため、
  // ここでは追加の処理は不要
  // isProcessed()関数がpayload内のwebhookEventIdで重複をチェックする
}

/**
 * 古い処理済みWebhookレコードをクリーンアップ
 * 7日以上前のレコードを削除
 * @returns {Promise<number>} - 削除された件数
 */
async function cleanupOldRecords() {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('webhook_logs')
      .delete()
      .lt('created_at', sevenDaysAgo.toISOString())
      .select();

    if (error) {
      console.error('cleanupOldRecords エラー:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('cleanupOldRecords 例外:', error);
    return 0;
  }
}

module.exports = {
  isProcessed,
  markAsProcessed,
  cleanupOldRecords,
};
