const supabase = require('../config/supabase');

/**
 * アクティブな教室一覧を取得
 * @returns {Promise<Array>} 教室一覧
 */
async function getActiveClassrooms() {
  const { data, error } = await supabase
    .from('classrooms')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('教室取得エラー:', error);
    throw error;
  }

  return data;
}

/**
 * 教室名から座席範囲を取得
 * @param {string} classroomName - 教室名
 * @returns {Promise<object|null>} 座席範囲情報
 */
async function getSeatRangeByClassroom(classroomName) {
  const { data, error } = await supabase
    .from('classrooms')
    .select('*')
    .eq('name', classroomName)
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('座席範囲取得エラー:', error);
    throw error;
  }

  return data;
}

module.exports = {
  getActiveClassrooms,
  getSeatRangeByClassroom,
};
