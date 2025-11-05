const { client } = require('../config/line');
const checkinController = require('./checkinController');
const checkoutController = require('./checkoutController');
const historyController = require('./historyController');
const webhookLogRepository = require('../repositories/webhookLogRepository');
const { parsePostbackData } = require('../utils/messageBuilder');
const messages = require('../constants/messages');

/**
 * Webhookイベント処理のメインハンドラー
 */
async function handleWebhook(req, res) {
  try {
    const events = req.body.events;

    console.log(`📨 受信イベント数: ${events.length}`);
    events.forEach((event, index) => {
      console.log(`  Event ${index}: type=${event.type}, replyToken=${event.replyToken}`);
    });

    // イベントを並行処理
    await Promise.all(events.map((event) => handleEvent(event)));

    res.status(200).json({ message: 'OK' });
  } catch (error) {
    console.error('Webhook処理エラー:', error);
    res.status(200).json({ message: 'Error handled' });
  }
}

/**
 * 個別イベント処理
 */
async function handleEvent(event) {
  const eventType = event.type;
  const lineUserId = event.source?.userId;

  // Webhookログ記録
  await webhookLogRepository.logWebhookEvent(
    eventType,
    lineUserId,
    event,
    'received'
  );

  try {
    switch (eventType) {
      case 'message':
        await handleMessage(event);
        break;

      case 'postback':
        await handlePostback(event);
        break;

      case 'follow':
        await handleFollow(event);
        break;

      case 'unfollow':
        console.log('ユーザーがブロックしました:', lineUserId);
        break;

      default:
        console.log('未対応のイベントタイプ:', eventType);
    }

    // 成功ログ
    await webhookLogRepository.logWebhookEvent(
      eventType,
      lineUserId,
      event,
      'success'
    );

  } catch (error) {
    console.error('イベント処理エラー:', error);

    // エラーログ
    await webhookLogRepository.logWebhookEvent(
      eventType,
      lineUserId,
      event,
      'error',
      error.message
    );

    // エラーメッセージは送信しない（無限ループを防ぐため）
    // ユーザーには各コントローラーから適切なメッセージが送信される
  }
}

/**
 * メッセージイベント処理
 */
async function handleMessage(event) {
  if (event.message.type !== 'text') {
    return;
  }

  const text = event.message.text.trim();
  const lineUserId = event.source.userId;

  // テキストコマンド処理（リッチメニューを使わない場合のフォールバック）
  if (text === '登校' || text === 'checkin') {
    await checkinController.startCheckin(event);
  } else if (text === '下校' || text === 'checkout') {
    await checkoutController.startCheckout(event);
  } else if (text === '履歴' || text === '登校履歴' || text === 'history') {
    await historyController.showHistory(event);
  } else {
    // デフォルトメッセージ
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'リッチメニューから操作してください。\n\n・登校\n・下校\n・登校履歴',
    });
  }
}

/**
 * Postbackイベント処理
 */
async function handlePostback(event) {
  const postbackData = parsePostbackData(event.postback.data);
  const action = postbackData.action;

  console.log('Postback受信:', action, postbackData);

  switch (action) {
    // 登校フロー
    case 'checkin':
      await checkinController.startCheckin(event);
      break;

    case 'select_classroom':
      await checkinController.selectClassroom(event, postbackData);
      break;

    case 'select_seat_range':
      await checkinController.selectSeatRange(event, postbackData);
      break;

    case 'select_seat':
      await checkinController.selectSeat(event, postbackData);
      break;

    case 'show_more_seats':
      await checkinController.showMoreSeats(event, postbackData);
      break;

    // 下校フロー
    case 'checkout':
      await checkoutController.startCheckout(event);
      break;

    case 'checkout_confirm':
      await checkoutController.confirmCheckout(event, postbackData);
      break;

    // 履歴表示
    case 'history':
      await historyController.showHistory(event);
      break;

    default:
      console.log('未対応のアクション:', action);
  }
}

/**
 * フォローイベント処理（友だち追加時）
 */
async function handleFollow(event) {
  const lineUserId = event.source.userId;
  console.log('新しいユーザーが友だち追加しました:', lineUserId);

  // ウェルカムメッセージ送信
  await client.replyMessage(event.replyToken, {
    type: 'text',
    text: messages.WELCOME,
  });
}

module.exports = {
  handleWebhook,
};
