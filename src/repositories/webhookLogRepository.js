const supabase = require('../config/supabase');

/**
 * Webhookログを記録
 * @param {string} eventType - イベントタイプ
 * @param {string} lineUserId - LINE User ID
 * @param {object} payload - ペイロード
 * @param {string} status - ステータス（'received', 'success', 'error'）
 * @param {string} errorMessage - エラーメッセージ（オプション）
 * @returns {Promise<void>}
 */
async function logWebhookEvent(eventType, lineUserId, payload, status = 'received', errorMessage = null) {
  try {
    await supabase.from('webhook_logs').insert([
      {
        event_type: eventType,
        line_user_id: lineUserId,
        payload,
        status,
        error_message: errorMessage,
      },
    ]);
  } catch (error) {
    // ログ記録のエラーはシステムを止めない
    console.error('Webhookログ記録エラー:', error);
  }
}

module.exports = {
  logWebhookEvent,
};
