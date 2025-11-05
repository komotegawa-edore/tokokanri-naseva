const sheetsRepository = require('../repositories/sheetsRepository');
const userRepository = require('../repositories/userRepository');
const { getCurrentJSTTime, parseSheetDateString, getDurationInMinutes, formatDuration } = require('../utils/dateFormatter');

/**
 * 登校処理
 * @param {string} lineUserId - LINE User ID
 * @param {string} displayName - 表示名
 * @param {string} classroom - 教室名
 * @param {number} seatNumber - 座席番号
 * @returns {Promise<object>} 登校結果
 */
async function checkin(lineUserId, displayName, classroom, seatNumber) {
  // 既に登校中かチェック
  const existingCheckin = await sheetsRepository.getLatestCheckinRecord(lineUserId);
  if (existingCheckin) {
    return {
      success: false,
      message: 'already_checkedin',
    };
  }

  // ユーザー情報を取得または作成
  await userRepository.getOrCreateUser(lineUserId, displayName);

  // 登校記録を追加
  const timestamp = getCurrentJSTTime();
  await sheetsRepository.appendCheckinRecord({
    timestamp,
    studentName: displayName,
    lineUserId,
    classroom,
    seatNumber,
  });

  return {
    success: true,
    timestamp,
    classroom,
    seatNumber,
  };
}

/**
 * 下校処理
 * @param {string} lineUserId - LINE User ID
 * @returns {Promise<object>} 下校結果
 */
async function checkout(lineUserId) {
  // 最新の登校記録を取得
  const checkinRecord = await sheetsRepository.getLatestCheckinRecord(lineUserId);

  if (!checkinRecord) {
    return {
      success: false,
      message: 'not_checkedin',
    };
  }

  // 下校時刻と滞在時間を計算
  const checkoutTime = getCurrentJSTTime();
  const checkinTime = parseSheetDateString(checkinRecord.timestamp);
  const durationMinutes = getDurationInMinutes(checkinTime, checkoutTime);

  // Google Sheetsを更新
  await sheetsRepository.updateCheckoutRecord(
    checkinRecord.rowIndex,
    checkoutTime,
    durationMinutes
  );

  return {
    success: true,
    checkoutTime,
    durationMinutes,
    durationFormatted: formatDuration(durationMinutes),
  };
}

/**
 * ユーザーの登校履歴を取得
 * @param {string} lineUserId - LINE User ID
 * @param {number} limit - 取得件数
 * @returns {Promise<Array>} 登校履歴
 */
async function getHistory(lineUserId, limit = 10) {
  return await sheetsRepository.getUserHistory(lineUserId, limit);
}

/**
 * 現在登校中かどうかをチェック
 * @param {string} lineUserId - LINE User ID
 * @returns {Promise<boolean>} 登校中ならtrue
 */
async function isCheckedIn(lineUserId) {
  const checkinRecord = await sheetsRepository.getLatestCheckinRecord(lineUserId);
  return !!checkinRecord;
}

module.exports = {
  checkin,
  checkout,
  getHistory,
  isCheckedIn,
};
