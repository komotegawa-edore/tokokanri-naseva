const checkinController = require('./checkinController');
const checkoutController = require('./checkoutController');
const historyController = require('./historyController');
const registrationController = require('./registrationController');
const webhookLogRepository = require('../repositories/webhookLogRepository');
const processedWebhooksRepository = require('../repositories/processedWebhooksRepository');
const sessionRepository = require('../repositories/sessionRepository');
const { parsePostbackData } = require('../utils/messageBuilder');
const messages = require('../constants/messages');
const { replySafely } = require('../utils/lineReplyHelper');

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
  const webhookEventId = event.webhookEventId;

  // 重複チェック: 既に処理済みのイベントは無視
  if (webhookEventId) {
    const alreadyProcessed = await processedWebhooksRepository.isProcessed(webhookEventId);
    if (alreadyProcessed) {
      console.log(`⏭️  既に処理済みのWebhookイベント: ${webhookEventId}`);
      return;
    }
  }

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

    // 処理済みとして記録（webhook_logsテーブルに既に記録されているため不要）
    // await processedWebhooksRepository.markAsProcessed();

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

  // 登録フロー中の場合は、セッションに基づいて処理
  const registrationSession = await sessionRepository.getSession(lineUserId, 'registration');
  if (registrationSession) {
    // 登録フロー中
    if (registrationSession.current_step === 'input_full_name') {
      await registrationController.handleFullNameInput(event, registrationSession);
      return;
    }
  }

  // テキストコマンド処理（リッチメニューを使わない場合のフォールバック）
  if (text === '登校' || text === 'checkin') {
    // 登録済みチェック
    const isRegistered = await registrationController.checkAndStartRegistration(event);
    if (isRegistered) {
      await checkinController.startCheckin(event);
    }
  } else if (text === '下校' || text === 'checkout') {
    // 登録済みチェック
    const isRegistered = await registrationController.checkAndStartRegistration(event);
    if (isRegistered) {
      await checkoutController.startCheckout(event);
    }
  } else if (text === '履歴' || text === '登校履歴' || text === 'history') {
    // 登録済みチェック
    const isRegistered = await registrationController.checkAndStartRegistration(event);
    if (isRegistered) {
      await historyController.showHistory(event);
    }
  } else {
    // デフォルトメッセージ
    await replySafely(event, {
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

  // 登録フロー中の場合
  const lineUserId = event.source.userId;
  const registrationSession = await sessionRepository.getSession(lineUserId, 'registration');
  if (registrationSession && action === 'select_grade') {
    await registrationController.handleGradeSelection(event, postbackData, registrationSession);
    return;
  }

  // 登録済みチェックが必要なアクション
  const requiresRegistration = ['checkin', 'checkout', 'history'];
  if (requiresRegistration.includes(action)) {
    const isRegistered = await registrationController.checkAndStartRegistration(event);
    if (!isRegistered) {
      return;
    }
  }

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

  // 登録済みチェック（未登録なら登録フローを開始）
  // 公式LINE側でウェルカムメッセージを設定しているため、こちらでは送信しない
  await registrationController.checkAndStartRegistration(event);
}

module.exports = {
  handleWebhook,
};
