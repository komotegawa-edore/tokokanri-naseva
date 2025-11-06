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

  // 座席の重複利用を防止
  const occupiedSeats = await sheetsRepository.getOccupiedSeats(classroom);
  if (occupiedSeats.includes(seatNumber)) {
    return {
      success: false,
      message: 'seat_taken',
    };
  }

  // ユーザー情報を取得または作成
  await userRepository.getOrCreateUser(lineUserId, displayName);

  // ユーザーの詳細情報を取得（フルネームと学年を含む）
  const user = await userRepository.getUserByLineId(lineUserId);

  // 登校記録を追加
  const timestamp = getCurrentJSTTime();
  await sheetsRepository.appendCheckinRecord({
    timestamp,
    studentName: displayName,
    fullName: user?.full_name || '',
    grade: user?.grade || '',
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

  // パースエラーのチェック
  if (!checkinTime) {
    console.error('❌ 登校時刻のパースに失敗:', checkinRecord.timestamp);
    return {
      success: false,
      message: 'invalid_checkin_time',
    };
  }

  const durationMinutes = getDurationInMinutes(checkinTime, checkoutTime);

  // 計算結果のチェック
  if (isNaN(durationMinutes) || durationMinutes < 0) {
    console.error('❌ 滞在時間の計算に失敗:', {
      checkinTime,
      checkoutTime,
      durationMinutes,
    });
    return {
      success: false,
      message: 'invalid_duration',
    };
  }

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
