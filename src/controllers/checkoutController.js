const { client } = require('../config/line');
const attendanceService = require('../services/attendanceService');
const messages = require('../constants/messages');
const { checkoutConfirmQuickReply } = require('../constants/quickReplies');
const { buildTextMessage } = require('../utils/messageBuilder');

/**
 * 下校フロー開始（確認メッセージ表示）
 */
async function startCheckout(event) {
  const lineUserId = event.source.userId;

  // 登校中かチェック
  const isCheckedIn = await attendanceService.isCheckedIn(lineUserId);
  if (!isCheckedIn) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: messages.CHECKOUT_NOT_CHECKEDIN,
    });
    return;
  }

  // 下校確認メッセージ送信
  await client.replyMessage(event.replyToken, buildTextMessage(
    messages.CHECKOUT_CONFIRM,
    checkoutConfirmQuickReply
  ));
}

/**
 * 下校確認処理
 */
async function confirmCheckout(event, postbackData) {
  const lineUserId = event.source.userId;
  const { answer } = postbackData;

  if (answer !== 'yes') {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'キャンセルしました。',
    });
    return;
  }

  try {
    // 下校処理実行
    const result = await attendanceService.checkout(lineUserId);

    if (!result.success) {
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: messages.CHECKOUT_NOT_CHECKEDIN,
      });
      return;
    }

    // 成功メッセージ送信
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: messages.CHECKOUT_SUCCESS(result.durationFormatted),
    });

  } catch (error) {
    console.error('下校処理エラー:', error);
    // エラー時はreplyTokenが既に使用されている可能性があるため、何もしない
    throw error;
  }
}

module.exports = {
  startCheckout,
  confirmCheckout,
};
