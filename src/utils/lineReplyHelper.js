const { client } = require('../config/line');

const TOKEN_TTL_MS = 5 * 60 * 1000; // 5 minutes
const usedReplyTokens = new Map();

function rememberToken(token) {
  if (usedReplyTokens.has(token)) {
    return;
  }

  const timeoutId = setTimeout(() => {
    usedReplyTokens.delete(token);
  }, TOKEN_TTL_MS);

  usedReplyTokens.set(token, timeoutId);
}

function releaseToken(token) {
  const timeoutId = usedReplyTokens.get(token);
  if (timeoutId) {
    clearTimeout(timeoutId);
    usedReplyTokens.delete(token);
  }
}

function isReplyTokenError(error) {
  const statusCode = error?.statusCode ?? error?.originalError?.response?.status;

  if (statusCode !== 400) {
    return false;
  }

  const data = error?.originalError?.response?.data;
  const message = (data?.message || '').toLowerCase();

  if (message.includes('reply token')) {
    return true;
  }

  const details = Array.isArray(data?.details) ? data.details : [];
  return details.some((detail) => {
    const detailMessage = (detail?.message || '').toLowerCase();
    return detailMessage.includes('reply token');
  });
}

/**
 * replyMessageのラッパー。既に使用済みのreplyToken検知時は重複送信を避ける。
 * @param {object} event - LINEイベントオブジェクト
 * @param {object|object[]} messages - 送信メッセージ
 * @returns {Promise<void>}
 */
async function replySafely(event, messages) {
  const replyToken = event?.replyToken;
  if (!replyToken) {
    console.warn('replySafely: replyTokenが存在しません。送信をスキップします。');
    return;
  }

  if (usedReplyTokens.has(replyToken)) {
    console.warn(`replySafely: 既に処理済みのreplyTokenを検知したため送信をスキップします。replyToken=${replyToken}`);
    return;
  }

  const messageArray = Array.isArray(messages) ? messages : [messages];

  try {
    await client.replyMessage(replyToken, messageArray);
    rememberToken(replyToken);
  } catch (error) {
    if (isReplyTokenError(error)) {
      console.warn('replySafely: replyTokenエラーを検知しました。送信をスキップします。', error?.originalError?.response?.data || error.message);
      rememberToken(replyToken);
      return;
    }

    releaseToken(replyToken);
    throw error;
  }
}

module.exports = {
  replySafely,
};
