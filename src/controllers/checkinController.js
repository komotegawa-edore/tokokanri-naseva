const { client } = require('../config/line');
const attendanceService = require('../services/attendanceService');
const classroomService = require('../services/classroomService');
const sessionRepository = require('../repositories/sessionRepository');
const messages = require('../constants/messages');
const { buildTextMessage, parsePostbackData } = require('../utils/messageBuilder');
const { formatDate } = require('../utils/dateFormatter');

/**
 * 登校フロー開始
 */
async function startCheckin(event) {
  const lineUserId = event.source.userId;

  // 既に登校中かチェック
  const isCheckedIn = await attendanceService.isCheckedIn(lineUserId);
  if (isCheckedIn) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: messages.CHECKIN_ALREADY,
    });
    return;
  }

  // セッション作成（教室選択ステップ）
  await sessionRepository.createOrUpdateSession(
    lineUserId,
    'checkin',
    'select_classroom'
  );

  // 教室選択メッセージを送信（スプレッドシートから動的に生成）
  const classroomQuickReply = await classroomService.generateClassroomQuickReply();

  try {
    console.log(`🔄 replyMessage呼び出し: replyToken=${event.replyToken}`);
    const message = buildTextMessage(messages.CHECKIN_SELECT_CLASSROOM, classroomQuickReply);
    console.log(`📤 送信メッセージ:`, JSON.stringify(message, null, 2));

    await client.replyMessage(event.replyToken, message);
    console.log(`✅ replyMessage成功`);
  } catch (error) {
    console.error('❌ replyMessage失敗:', error);
    if (error.originalError?.response?.data) {
      console.error('LINE API Error Details:', JSON.stringify(error.originalError.response.data, null, 2));
    }
    throw error;
  }
}

/**
 * 教室選択処理
 */
async function selectClassroom(event, postbackData) {
  const lineUserId = event.source.userId;
  const { classroom, range } = postbackData;

  // 座席範囲を解析
  const [startSeat, endSeat] = range.split('-').map(Number);

  // セッション更新（座席範囲選択ステップ）
  await sessionRepository.createOrUpdateSession(
    lineUserId,
    'checkin',
    'select_seat_range',
    { classroom, startSeat, endSeat }
  );

  // 座席範囲選択メッセージを送信
  const seatRangeQuickReply = await classroomService.generateSeatRangeQuickReply(
    classroom,
    startSeat,
    endSeat
  );

  await client.replyMessage(event.replyToken, buildTextMessage(
    `${classroom}の座席範囲を選択してください`,
    seatRangeQuickReply
  ));
}

/**
 * 座席範囲選択処理
 */
async function selectSeatRange(event, postbackData) {
  const lineUserId = event.source.userId;
  const { classroom, start, end, isFinal } = postbackData;
  const startSeat = parseInt(start);
  const endSeat = parseInt(end);

  // isFinalがtrueなら直接座席選択、falseなら再度範囲分割
  if (isFinal === 'true') {
    // セッション更新（座席選択ステップ）
    await sessionRepository.createOrUpdateSession(
      lineUserId,
      'checkin',
      'select_seat',
      { classroom, startSeat, endSeat }
    );

    // 座席番号選択メッセージを送信
    const seatQuickReply = await classroomService.generateSeatQuickReply(
      classroom,
      startSeat,
      endSeat
    );

    await client.replyMessage(event.replyToken, buildTextMessage(
      messages.CHECKIN_SELECT_SEAT(classroom),
      seatQuickReply
    ));
  } else {
    // まだ13席を超える場合、再度範囲選択
    await sessionRepository.createOrUpdateSession(
      lineUserId,
      'checkin',
      'select_seat_range',
      { classroom, startSeat, endSeat }
    );

    const seatRangeQuickReply = await classroomService.generateSeatRangeQuickReply(
      classroom,
      startSeat,
      endSeat
    );

    await client.replyMessage(event.replyToken, buildTextMessage(
      `${classroom}の座席範囲を選択してください`,
      seatRangeQuickReply
    ));
  }
}

/**
 * 座席番号選択処理（登校完了）
 */
async function selectSeat(event, postbackData) {
  const lineUserId = event.source.userId;
  const displayName = event.source.type === 'user'
    ? (await client.getProfile(lineUserId)).displayName
    : 'ゲスト';
  const { seat } = postbackData;
  const seatNumber = parseInt(seat);

  // セッション取得
  const session = await sessionRepository.getSession(lineUserId, 'checkin');
  if (!session || !session.session_data.classroom) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: messages.ERROR_SESSION_EXPIRED,
    });
    return;
  }

  const { classroom } = session.session_data;

  try {
    // 登校処理実行
    const result = await attendanceService.checkin(
      lineUserId,
      displayName,
      classroom,
      seatNumber
    );

    if (!result.success) {
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: messages.CHECKIN_ALREADY,
      });
      return;
    }

    // セッション削除
    await sessionRepository.deleteSession(lineUserId, 'checkin');

    // 成功メッセージ送信
    const timeStr = formatDate(result.timestamp, 'yyyy/MM/dd HH:mm');
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: messages.CHECKIN_SUCCESS(classroom, seatNumber, timeStr),
    });

  } catch (error) {
    console.error('登校処理エラー:', error);
    // エラー時はreplyTokenが既に使用されている可能性があるため、何もしない
    throw error;
  }
}

/**
 * 「もっと見る」処理
 */
async function showMoreSeats(event, postbackData) {
  const { classroom, start, end, page } = postbackData;
  const startSeat = parseInt(start);
  const endSeat = parseInt(end);
  const currentPage = parseInt(page) || 0;

  // 次のページの座席番号を生成（使用中の座席を除外）
  const seatQuickReply = await classroomService.generateSeatQuickReply(
    classroom,
    startSeat,
    endSeat,
    currentPage
  );

  await client.replyMessage(event.replyToken, buildTextMessage(
    '座席番号を選択してください',
    seatQuickReply
  ));
}

module.exports = {
  startCheckin,
  selectClassroom,
  selectSeatRange,
  selectSeat,
  showMoreSeats,
};
