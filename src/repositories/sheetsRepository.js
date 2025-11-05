const { sheets, spreadsheetId, sheetName } = require('../config/googleSheets');
const { formatDate } = require('../utils/dateFormatter');

/**
 * Google Sheetsに登校記録を追加
 * @param {object} record - 登校記録
 * @returns {Promise<void>}
 */
async function appendCheckinRecord(record) {
  const { timestamp, studentName, lineUserId, classroom, seatNumber } = record;

  const values = [
    [
      formatDate(timestamp, 'yyyy-MM-dd HH:mm:ss'),
      studentName,
      lineUserId,
      classroom,
      seatNumber,
      '', // checkout_time（後で更新）
      '', // duration_minutes（後で計算）
    ],
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:G`,
    valueInputOption: 'USER_ENTERED',
    resource: { values },
  });
}

/**
 * 最新の登校記録を取得（未下校のもの）
 * @param {string} lineUserId - LINE User ID
 * @returns {Promise<object|null>} 登校記録またはnull
 */
async function getLatestCheckinRecord(lineUserId) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:G`,
  });

  const rows = response.data.values;
  if (!rows || rows.length <= 1) {
    return null; // ヘッダーのみ、またはデータなし
  }

  // 最後の行から順に検索（最新のレコードを探す）
  for (let i = rows.length - 1; i >= 1; i--) {
    const row = rows[i];
    const [timestamp, studentName, userId, classroom, seatNumber, checkoutTime] = row;

    if (userId === lineUserId && !checkoutTime) {
      return {
        rowIndex: i + 1, // Sheetsは1始まり
        timestamp,
        studentName,
        lineUserId: userId,
        classroom,
        seatNumber: parseInt(seatNumber),
        checkoutTime,
      };
    }
  }

  return null;
}

/**
 * 下校時刻と滞在時間を更新
 * @param {number} rowIndex - 更新する行番号
 * @param {Date} checkoutTime - 下校時刻
 * @param {number} durationMinutes - 滞在時間（分）
 * @returns {Promise<void>}
 */
async function updateCheckoutRecord(rowIndex, checkoutTime, durationMinutes) {
  const values = [
    [formatDate(checkoutTime, 'yyyy-MM-dd HH:mm:ss'), durationMinutes],
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!F${rowIndex}:G${rowIndex}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values },
  });
}

/**
 * ユーザーの登校履歴を取得
 * @param {string} lineUserId - LINE User ID
 * @param {number} limit - 取得件数（デフォルト: 10）
 * @returns {Promise<Array>} 登校記録の配列
 */
async function getUserHistory(lineUserId, limit = 10) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:G`,
  });

  const rows = response.data.values;
  if (!rows || rows.length <= 1) {
    return [];
  }

  const userRecords = [];
  for (let i = rows.length - 1; i >= 1 && userRecords.length < limit; i--) {
    const row = rows[i];
    const [timestamp, studentName, userId, classroom, seatNumber, checkoutTime, duration] = row;

    if (userId === lineUserId) {
      userRecords.push({
        timestamp,
        studentName,
        classroom,
        seatNumber: parseInt(seatNumber),
        checkoutTime,
        durationMinutes: duration ? parseInt(duration) : null,
      });
    }
  }

  return userRecords;
}

module.exports = {
  appendCheckinRecord,
  getLatestCheckinRecord,
  updateCheckoutRecord,
  getUserHistory,
};
