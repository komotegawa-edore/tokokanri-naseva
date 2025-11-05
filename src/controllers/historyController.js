const { client } = require('../config/line');
const attendanceService = require('../services/attendanceService');
const messages = require('../constants/messages');
const { buildHistoryFlexMessage } = require('../utils/messageBuilder');
const { formatDuration } = require('../utils/dateFormatter');

/**
 * 登校履歴表示
 */
async function showHistory(event) {
  const lineUserId = event.source.userId;

  try {
    // 履歴を取得
    const history = await attendanceService.getHistory(lineUserId, 10);

    if (history.length === 0) {
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: messages.HISTORY_NO_DATA,
      });
      return;
    }

    // Flex Message用にデータ整形
    const records = history.map((record) => ({
      date: record.timestamp.split(' ')[0], // 日付部分のみ
      duration: record.durationMinutes
        ? formatDuration(record.durationMinutes)
        : '登校中',
    }));

    // Flex Messageを送信
    const flexMessage = buildHistoryFlexMessage(records);
    await client.replyMessage(event.replyToken, flexMessage);

  } catch (error) {
    console.error('履歴取得エラー:', error);
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: messages.ERROR_GENERAL,
    });
  }
}

module.exports = {
  showHistory,
};
