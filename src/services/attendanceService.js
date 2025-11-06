const sheetsRepository = require('../repositories/sheetsRepository');
const userRepository = require('../repositories/userRepository');
const attendanceRepository = require('../repositories/attendanceRepository');
const classroomRepository = require('../repositories/classroomRepository');
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
  // Supabaseで既に登校中かチェック
  const existingCheckin = await attendanceRepository.getActiveCheckin(lineUserId);
  if (existingCheckin) {
    return {
      success: false,
      message: 'already_checkedin',
    };
  }

  // 座席の重複利用を防止（Google Sheets）
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

  if (!user) {
    console.error('❌ ユーザー情報が取得できませんでした:', lineUserId);
    return {
      success: false,
      message: 'user_not_found',
    };
  }

  // 教室情報をSupabaseから取得
  const classroomInfo = await classroomRepository.getSupabaseClassroomByName(classroom);

  // 登校記録をSupabaseに保存
  const timestamp = getCurrentJSTTime();
  const supabaseRecord = await attendanceRepository.createCheckin(
    user.id,
    lineUserId,
    classroomInfo?.id || null,
    classroom,
    seatNumber
  );
  console.log('✅ Supabase登校記録作成:', supabaseRecord.id);

  // Google Sheetsにも記録（既存の仕組みを維持）
  try {
    await sheetsRepository.appendCheckinRecord({
      timestamp,
      studentName: displayName,
      fullName: user?.full_name || '',
      grade: user?.grade || '',
      lineUserId,
      classroom,
      seatNumber,
    });
    console.log('✅ Google Sheets登校記録作成');
  } catch (error) {
    console.error('❌ Google Sheets登校記録作成エラー:', error);
    // Google Sheetsの追加に失敗してもSupabaseは保存済みなので続行
  }

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
  // Supabaseから最新の未下校記録を取得
  const activeCheckin = await attendanceRepository.getActiveCheckin(lineUserId);

  if (!activeCheckin) {
    return {
      success: false,
      message: 'not_checkedin',
    };
  }

  // Supabaseの記録を更新
  const updatedRecord = await attendanceRepository.updateCheckout(activeCheckin.id);
  console.log('✅ Supabase下校記録更新完了:', updatedRecord.id, `${updatedRecord.duration_minutes}分`);

  // Google Sheetsも更新（既存の仕組みを維持）
  try {
    const sheetsCheckinRecord = await sheetsRepository.getLatestCheckinRecord(lineUserId);
    console.log('📊 Google Sheets未下校記録:', sheetsCheckinRecord);

    if (sheetsCheckinRecord) {
      const checkoutTime = getCurrentJSTTime();
      const checkinTime = parseSheetDateString(sheetsCheckinRecord.timestamp);

      if (!checkinTime) {
        console.error('❌ Google Sheets登校時刻のパースに失敗:', sheetsCheckinRecord.timestamp);
      } else {
        const durationMinutes = getDurationInMinutes(checkinTime, checkoutTime);
        console.log(`⏱️  滞在時間計算: ${durationMinutes}分`);

        if (isNaN(durationMinutes) || durationMinutes < 0) {
          console.error('❌ 滞在時間が不正:', { checkinTime, checkoutTime, durationMinutes });
        } else {
          await sheetsRepository.updateCheckoutRecord(
            sheetsCheckinRecord.rowIndex,
            checkoutTime,
            durationMinutes
          );
          console.log('✅ Google Sheets下校記録更新完了:', sheetsCheckinRecord.rowIndex);
        }
      }
    } else {
      console.warn('⚠️  Google Sheetsに未下校記録が見つかりません');
    }
  } catch (error) {
    console.error('❌ Google Sheets更新エラー:', error);
    // Google Sheetsの更新に失敗してもSupabaseは更新済みなので続行
  }

  return {
    success: true,
    checkoutTime: updatedRecord.checkout_time,
    durationMinutes: updatedRecord.duration_minutes,
    durationFormatted: formatDuration(updatedRecord.duration_minutes),
  };
}

/**
 * ユーザーの登校履歴を取得
 * @param {string} lineUserId - LINE User ID
 * @param {number} limit - 取得件数
 * @returns {Promise<Array>} 登校履歴
 */
async function getHistory(lineUserId, limit = 10) {
  // Supabaseから履歴を取得
  const supabaseHistory = await attendanceRepository.getAttendanceHistory(lineUserId, limit);

  // Supabaseに履歴がある場合はそれを使用、なければGoogle Sheetsから取得
  if (supabaseHistory && supabaseHistory.length > 0) {
    return supabaseHistory;
  }

  return await sheetsRepository.getUserHistory(lineUserId, limit);
}

/**
 * 現在登校中かどうかをチェック
 * @param {string} lineUserId - LINE User ID
 * @returns {Promise<boolean>} 登校中ならtrue
 */
async function isCheckedIn(lineUserId) {
  // Supabaseで未下校記録をチェック
  const activeCheckin = await attendanceRepository.getActiveCheckin(lineUserId);
  return !!activeCheckin;
}

module.exports = {
  checkin,
  checkout,
  getHistory,
  isCheckedIn,
};
