/**
 * LINEメッセージ構築ユーティリティ
 */

/**
 * テキストメッセージを構築
 * @param {string} text - メッセージテキスト
 * @param {object} quickReply - クイックリプライ（オプション）
 * @returns {object} LINEメッセージオブジェクト
 */
function buildTextMessage(text, quickReply = null) {
  const message = {
    type: 'text',
    text,
  };

  if (quickReply) {
    message.quickReply = quickReply;
  }

  return message;
}

/**
 * Flex Messageを構築（履歴表示用）
 * @param {Array} records - 登校記録の配列
 * @returns {object} Flex Message
 */
function buildHistoryFlexMessage(records) {
  const contents = records.map((record) => ({
    type: 'box',
    layout: 'horizontal',
    contents: [
      {
        type: 'text',
        text: record.date,
        size: 'sm',
        color: '#555555',
        flex: 2,
      },
      {
        type: 'text',
        text: record.duration,
        size: 'sm',
        color: '#111111',
        align: 'end',
        flex: 1,
      },
    ],
    margin: 'md',
  }));

  return {
    type: 'flex',
    altText: '登校履歴',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '📊 登校履歴',
            weight: 'bold',
            size: 'xl',
            margin: 'md',
          },
          {
            type: 'separator',
            margin: 'lg',
          },
          ...contents,
        ],
      },
    },
  };
}

/**
 * Postbackデータをパース
 * @param {string} data - Postbackデータ文字列
 * @returns {object} パースされたオブジェクト
 */
function parsePostbackData(data) {
  const params = {};
  data.split('&').forEach((pair) => {
    const [key, value] = pair.split('=');
    params[key] = decodeURIComponent(value);
  });
  return params;
}

module.exports = {
  buildTextMessage,
  buildHistoryFlexMessage,
  parsePostbackData,
};
