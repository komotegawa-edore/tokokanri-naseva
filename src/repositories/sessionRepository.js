const supabase = require('../config/supabase');

const SESSION_TIMEOUT_MINUTES = 10; // セッション有効期限（10分）

/**
 * セッションを作成または更新
 * @param {string} lineUserId - LINE User ID
 * @param {string} sessionType - セッションタイプ（'checkin', 'checkout'など）
 * @param {string} currentStep - 現在のステップ
 * @param {object} sessionData - セッションデータ
 * @returns {Promise<object>} セッション情報
 */
async function createOrUpdateSession(lineUserId, sessionType, currentStep, sessionData = {}) {
  const expiresAt = new Date(Date.now() + SESSION_TIMEOUT_MINUTES * 60 * 1000);

  // 既存のセッションを削除
  await supabase
    .from('user_sessions')
    .delete()
    .eq('line_user_id', lineUserId)
    .eq('session_type', sessionType);

  // 新しいセッションを作成
  const { data, error } = await supabase
    .from('user_sessions')
    .insert([
      {
        line_user_id: lineUserId,
        session_type: sessionType,
        current_step: currentStep,
        session_data: sessionData,
        expires_at: expiresAt,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('セッション作成エラー:', error);
    throw error;
  }

  return data;
}

/**
 * セッションを取得
 * @param {string} lineUserId - LINE User ID
 * @param {string} sessionType - セッションタイプ
 * @returns {Promise<object|null>} セッション情報またはnull
 */
async function getSession(lineUserId, sessionType) {
  const { data, error } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('line_user_id', lineUserId)
    .eq('session_type', sessionType)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('セッション取得エラー:', error);
    return null;
  }

  return data;
}

/**
 * セッションを削除
 * @param {string} lineUserId - LINE User ID
 * @param {string} sessionType - セッションタイプ（オプション）
 * @returns {Promise<void>}
 */
async function deleteSession(lineUserId, sessionType = null) {
  const query = supabase
    .from('user_sessions')
    .delete()
    .eq('line_user_id', lineUserId);

  if (sessionType) {
    query.eq('session_type', sessionType);
  }

  await query;
}

/**
 * セッションを更新
 * @param {string} lineUserId - LINE User ID
 * @param {string} sessionType - セッションタイプ
 * @param {string} currentStep - 現在のステップ
 * @param {object} sessionData - セッションデータ
 * @returns {Promise<object>} セッション情報
 */
async function updateSession(lineUserId, sessionType, currentStep, sessionData = {}) {
  const expiresAt = new Date(Date.now() + SESSION_TIMEOUT_MINUTES * 60 * 1000);

  const { data, error } = await supabase
    .from('user_sessions')
    .update({
      current_step: currentStep,
      session_data: sessionData,
      expires_at: expiresAt,
      updated_at: new Date(),
    })
    .eq('line_user_id', lineUserId)
    .eq('session_type', sessionType)
    .select()
    .single();

  if (error) {
    console.error('セッション更新エラー:', error);
    throw error;
  }

  return data;
}

/**
 * セッションを作成
 * @param {string} lineUserId - LINE User ID
 * @param {string} sessionType - セッションタイプ
 * @param {string} currentStep - 現在のステップ
 * @param {object} sessionData - セッションデータ
 * @returns {Promise<object>} セッション情報
 */
async function createSession(lineUserId, sessionType, currentStep, sessionData = {}) {
  return createOrUpdateSession(lineUserId, sessionType, currentStep, sessionData);
}

/**
 * 期限切れセッションを削除
 * @returns {Promise<void>}
 */
async function cleanupExpiredSessions() {
  await supabase
    .from('user_sessions')
    .delete()
    .lt('expires_at', new Date().toISOString());
}

module.exports = {
  createOrUpdateSession,
  createSession,
  updateSession,
  getSession,
  deleteSession,
  cleanupExpiredSessions,
};
