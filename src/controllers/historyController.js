const attendanceService = require('../services/attendanceService');
const messages = require('../constants/messages');
const { buildHistoryFlexMessage } = require('../utils/messageBuilder');
const { formatDuration } = require('../utils/dateFormatter');
const { replySafely } = require('../utils/lineReplyHelper');

/**
 * 登校履歴表示
 */
async function showHistory(event) {
  const lineUserId = event.source.userId;

  try {
    // 履歴を取得
    const history = await attendanceService.getHistory(lineUserId, 10);

    if (history.length === 0) {
      await replySafely(event, {
        type: 'text',
        text: messages.HISTORY_NO_DATA,
      });
      return;
    }

    // Flex Message用にデータ整形
    const records = history.map((record) => {
      // Supabaseデータ（checkin_time）とGoogle Sheetsデータ（timestamp）の両方に対応
      const dateTimeStr = record.checkin_time || record.timestamp;
      const date = dateTimeStr ? dateTimeStr.split('T')[0].split(' ')[0] : '日付不明';
      const durationMinutes = record.duration_minutes ?? record.durationMinutes;

      return {
        date,
        duration: durationMinutes
          ? formatDuration(durationMinutes)
          : '登校中',
      };
    });

    // Flex Messageを送信
    const flexMessage = buildHistoryFlexMessage(records);
    await replySafely(event, flexMessage);

  } catch (error) {
    console.error('履歴取得エラー:', error);
    await replySafely(event, {
      type: 'text',
      text: messages.ERROR_GENERAL,
    });
  }
}

module.exports = {
  showHistory,
};
