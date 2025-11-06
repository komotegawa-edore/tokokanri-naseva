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
    const { data, error } = await supabase
      .from('processed_webhooks')
      .select('id')
      .eq('id', webhookEventId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = Not Found以外のエラーは記録
      console.error('processed_webhooks チェックエラー:', error);
      return false; // エラー時は処理を続行（安全側に倒す）
    }

    return !!data; // データが存在すれば処理済み
  } catch (error) {
    console.error('isProcessed エラー:', error);
    return false; // エラー時は処理を続行
  }
}

/**
 * Webhookイベントを処理済みとして記録
 * @param {string} webhookEventId - LINEのWebhookイベントID
 * @returns {Promise<void>}
 */
async function markAsProcessed(webhookEventId) {
  try {
    const { error } = await supabase
      .from('processed_webhooks')
      .insert([
        {
          id: webhookEventId,
          created_at: new Date().toISOString(),
        },
      ]);

    if (error) {
      // 重複キーエラー（23505）は無視
      if (error.code !== '23505') {
        console.error('markAsProcessed エラー:', error);
      }
    }
  } catch (error) {
    console.error('markAsProcessed 例外:', error);
    // エラーでも処理は続行（記録失敗してもWebhook処理は完了させる）
  }
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
      .from('processed_webhooks')
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
