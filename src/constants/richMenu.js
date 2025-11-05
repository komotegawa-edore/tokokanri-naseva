// リッチメニュー設定

const richMenuConfig = {
  size: {
    width: 2500,
    height: 843, // 下段なしの場合
  },
  selected: true,
  name: '学習塾登校管理メニュー',
  chatBarText: 'メニュー',
  areas: [
    {
      bounds: {
        x: 0,
        y: 0,
        width: 833,
        height: 843,
      },
      action: {
        type: 'postback',
        data: 'action=checkin',
        displayText: '登校',
      },
    },
    {
      bounds: {
        x: 834,
        y: 0,
        width: 833,
        height: 843,
      },
      action: {
        type: 'postback',
        data: 'action=checkout',
        displayText: '下校',
      },
    },
    {
      bounds: {
        x: 1668,
        y: 0,
        width: 832,
        height: 843,
      },
      action: {
        type: 'postback',
        data: 'action=history',
        displayText: '登校履歴',
      },
    },
  ],
};

module.exports = richMenuConfig;
