// メッセージテンプレート

module.exports = {
  // 登校フロー
  CHECKIN_SELECT_CLASSROOM: 'どの教室を使いますか？',
  CHECKIN_SELECT_SEAT: (classroom) => `${classroom}の座席番号を選択してください`,
  CHECKIN_SUCCESS: (classroom, seatNumber, time) =>
    `✅ 登校を記録しました！\n\n教室: ${classroom}\n座席: ${seatNumber}番\n時刻: ${time}\n\n今日も頑張りましょう！`,
  CHECKIN_ALREADY: '既に登校記録があります。下校してから再度登校してください。',

  // 下校フロー
  CHECKOUT_CONFIRM: '下校しますか？',
  CHECKOUT_SUCCESS: (duration) =>
    `✅ 下校を記録しました！\n\n勉強時間: ${duration}\n\nお疲れ様でした！`,
  CHECKOUT_NOT_CHECKEDIN: '登校記録がありません。先に登校してください。',

  // エラーメッセージ
  ERROR_GENERAL: '申し訳ございません。エラーが発生しました。\nもう一度お試しください。',
  ERROR_SESSION_EXPIRED: 'セッションが期限切れです。もう一度最初からお試しください。',

  // 履歴表示
  HISTORY_HEADER: '📊 登校履歴',
  HISTORY_NO_DATA: 'まだ登校記録がありません。',

  // ウェルカムメッセージ
  WELCOME: '学習塾登校管理システムへようこそ！\n\nリッチメニューから操作してください。\n・登校: 教室に着いたら押してください\n・下校: 帰るときに押してください\n・登校履歴: あなたの記録を確認できます',
};
