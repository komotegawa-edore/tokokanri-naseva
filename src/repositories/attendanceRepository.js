const supabase = require('../config/supabase');

/**
 * 登校記録を作成
 * @param {string} userId - ユーザーID (UUID)
 * @param {string} lineUserId - LINE User ID
 * @param {string} classroomId - 教室ID
 * @param {string} classroomName - 教室名
 * @param {number} seatNumber - 座席番号
 * @returns {Promise<object>} 作成された登校記録
 */
async function createCheckin(userId, lineUserId, classroomId, classroomName, seatNumber) {
  const { data, error } = await supabase
    .from('attendances')
    .insert([
      {
        user_id: userId,
        line_user_id: lineUserId,
        classroom_id: classroomId,
        classroom_name: classroomName,
        seat_number: seatNumber,
        checkin_time: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('登校記録作成エラー:', error);
    throw error;
  }

  console.log('✅ 登校記録作成:', userId, classroomName, seatNumber);
  return data;
}

/**
 * 最新の未下校記録を取得
 * @param {string} lineUserId - LINE User ID
 * @returns {Promise<object|null>} 未下校記録またはnull
 */
async function getActiveCheckin(lineUserId) {
  const { data, error } = await supabase
    .from('attendances')
    .select('*')
    .eq('line_user_id', lineUserId)
    .is('checkout_time', null)
    .order('checkin_time', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('未下校記録取得エラー:', error);
    throw error;
  }

  return data;
}

/**
 * 下校記録を更新
 * @param {string} attendanceId - 登校記録ID
 * @returns {Promise<object>} 更新された記録
 */
async function updateCheckout(attendanceId) {
  const checkoutTime = new Date();

  // 既存の記録を取得して滞在時間を計算
  const { data: attendance, error: fetchError } = await supabase
    .from('attendances')
    .select('checkin_time')
    .eq('id', attendanceId)
    .single();

  if (fetchError) {
    console.error('登校記録取得エラー:', fetchError);
    throw fetchError;
  }

  const checkinTime = new Date(attendance.checkin_time);
  const durationMinutes = Math.floor((checkoutTime - checkinTime) / 60000);

  // 下校時刻と滞在時間を更新
  const { data, error } = await supabase
    .from('attendances')
    .update({
      checkout_time: checkoutTime.toISOString(),
      duration_minutes: durationMinutes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', attendanceId)
    .select()
    .single();

  if (error) {
    console.error('下校記録更新エラー:', error);
    throw error;
  }

  console.log('✅ 下校記録更新:', attendanceId, `${durationMinutes}分`);
  return data;
}

/**
 * ユーザーの登校履歴を取得
 * @param {string} lineUserId - LINE User ID
 * @param {number} limit - 取得件数（デフォルト: 10）
 * @returns {Promise<Array>} 登校履歴
 */
async function getAttendanceHistory(lineUserId, limit = 10) {
  const { data, error } = await supabase
    .from('attendances')
    .select('*')
    .eq('line_user_id', lineUserId)
    .order('checkin_time', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('登校履歴取得エラー:', error);
    throw error;
  }

  return data || [];
}

/**
 * 期間内の登校履歴を取得
 * @param {string} lineUserId - LINE User ID
 * @param {Date} startDate - 開始日
 * @param {Date} endDate - 終了日
 * @returns {Promise<Array>} 登校履歴
 */
async function getAttendanceByDateRange(lineUserId, startDate, endDate) {
  const { data, error } = await supabase
    .from('attendances')
    .select('*')
    .eq('line_user_id', lineUserId)
    .gte('checkin_time', startDate.toISOString())
    .lte('checkin_time', endDate.toISOString())
    .order('checkin_time', { ascending: false });

  if (error) {
    console.error('期間内登校履歴取得エラー:', error);
    throw error;
  }

  return data || [];
}

module.exports = {
  createCheckin,
  getActiveCheckin,
  updateCheckout,
  getAttendanceHistory,
  getAttendanceByDateRange,
};
