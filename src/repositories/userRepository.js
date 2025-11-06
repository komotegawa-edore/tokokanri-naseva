const supabase = require('../config/supabase');

/**
 * ユーザーを取得または作成
 * @param {string} lineUserId - LINE User ID
 * @param {string} displayName - 表示名
 * @returns {Promise<object>} ユーザー情報
 */
async function getOrCreateUser(lineUserId, displayName) {
  // まずユーザーを検索
  const { data: existingUser, error: selectError } = await supabase
    .from('users')
    .select('*')
    .eq('line_user_id', lineUserId)
    .single();

  if (existingUser) {
    // 表示名が変更されている場合は更新
    if (existingUser.display_name !== displayName) {
      await supabase
        .from('users')
        .update({ display_name: displayName, updated_at: new Date() })
        .eq('line_user_id', lineUserId);

      return { ...existingUser, display_name: displayName };
    }
    return existingUser;
  }

  // 新規ユーザー作成
  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert([
      {
        line_user_id: lineUserId,
        display_name: displayName,
      },
    ])
    .select()
    .single();

  if (insertError) {
    console.error('ユーザー作成エラー:', insertError);
    throw insertError;
  }

  return newUser;
}

/**
 * ユーザー情報を取得
 * @param {string} lineUserId - LINE User ID
 * @returns {Promise<object|null>} ユーザー情報またはnull
 */
async function getUserByLineId(lineUserId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('line_user_id', lineUserId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = レコードが見つからない（これは正常）
    console.error('ユーザー取得エラー:', error);
    throw error;
  }

  return data;
}

/**
 * ユーザーの登録を完了（フルネームと学年を登録）
 * @param {string} lineUserId - LINE User ID
 * @param {string} fullName - フルネーム
 * @param {string} grade - 学年
 * @returns {Promise<object>} 更新されたユーザー情報
 */
async function completeRegistration(lineUserId, fullName, grade) {
  const { data, error } = await supabase
    .from('users')
    .update({
      full_name: fullName,
      grade: grade,
      registration_completed: true,
      updated_at: new Date(),
    })
    .eq('line_user_id', lineUserId)
    .select()
    .single();

  if (error) {
    console.error('ユーザー登録完了エラー:', error);
    throw error;
  }

  console.log('✅ ユーザー登録完了:', lineUserId, fullName, grade);
  return data;
}

module.exports = {
  getOrCreateUser,
  getUserByLineId,
  completeRegistration,
};
