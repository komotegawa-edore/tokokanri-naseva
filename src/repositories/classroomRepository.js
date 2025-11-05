const { sheets, spreadsheetId } = require('../config/googleSheets');

const CLASSROOM_SHEET_NAME = 'Settings';

/**
 * スプレッドシートから教室設定を取得
 * @returns {Promise<Array>} 教室設定の配列
 *
 * スプレッドシートのフォーマット:
 * | 教室名 | 座席開始番号 | 座席終了番号 |
 * | A教室 | 1 | 20 |
 * | B教室 | 21 | 40 |
 */
async function getClassroomSettings() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${CLASSROOM_SHEET_NAME}!A2:C`, // ヘッダーをスキップ
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.warn('⚠️  教室設定が見つかりません。デフォルト設定を使用します。');
      return getDefaultClassrooms();
    }

    const classrooms = rows
      .filter(row => row.length >= 3 && row[0]) // 空行をスキップ
      .map(row => ({
        name: row[0].trim(),
        startSeat: parseInt(row[1]),
        endSeat: parseInt(row[2]),
      }))
      .filter(classroom => {
        // バリデーション
        if (isNaN(classroom.startSeat) || isNaN(classroom.endSeat)) {
          console.warn(`⚠️  不正な座席番号: ${classroom.name}`);
          return false;
        }
        if (classroom.startSeat >= classroom.endSeat) {
          console.warn(`⚠️  座席範囲が不正: ${classroom.name}`);
          return false;
        }
        return true;
      });

    console.log(`✅ ${classrooms.length}件の教室設定を読み込みました`);
    return classrooms;

  } catch (error) {
    if (error.message?.includes('Unable to parse range')) {
      console.warn('⚠️  Settingsシートが見つかりません。デフォルト設定を使用します。');
      return getDefaultClassrooms();
    }
    throw error;
  }
}

/**
 * デフォルトの教室設定を返す
 */
function getDefaultClassrooms() {
  return [
    { name: 'A教室', startSeat: 1, endSeat: 20 },
    { name: 'B教室', startSeat: 21, endSeat: 40 },
    { name: 'C教室', startSeat: 41, endSeat: 60 },
  ];
}

/**
 * 特定の教室の情報を取得
 * @param {string} classroomName - 教室名
 * @returns {Promise<object|null>}
 */
async function getClassroomByName(classroomName) {
  const classrooms = await getClassroomSettings();
  return classrooms.find(c => c.name === classroomName) || null;
}

module.exports = {
  getClassroomSettings,
  getClassroomByName,
  getDefaultClassrooms,
};
