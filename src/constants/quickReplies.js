// クイックリプライ定義

// 教室選択のクイックリプライ
const classroomQuickReply = {
  items: [
    {
      type: 'action',
      action: {
        type: 'postback',
        label: 'A教室',
        data: 'action=select_classroom&classroom=A教室&range=1-20',
        displayText: 'A教室',
      },
    },
    {
      type: 'action',
      action: {
        type: 'postback',
        label: 'B教室',
        data: 'action=select_classroom&classroom=B教室&range=21-40',
        displayText: 'B教室',
      },
    },
    {
      type: 'action',
      action: {
        type: 'postback',
        label: 'C教室',
        data: 'action=select_classroom&classroom=C教室&range=41-60',
        displayText: 'C教室',
      },
    },
  ],
};

// 座席番号選択のクイックリプライを動的に生成
const generateSeatQuickReply = (startSeat, endSeat) => {
  const items = [];

  // 最大13個まで表示（LINEの制限）
  const maxSeats = Math.min(endSeat - startSeat + 1, 13);

  for (let i = 0; i < maxSeats; i++) {
    const seatNum = startSeat + i;
    items.push({
      type: 'action',
      action: {
        type: 'postback',
        label: `${seatNum}番`,
        data: `action=select_seat&seat=${seatNum}`,
        displayText: `${seatNum}番`,
      },
    });
  }

  // 13個以上ある場合は「もっと見る」を追加
  if (endSeat - startSeat + 1 > 13) {
    items[12] = {
      type: 'action',
      action: {
        type: 'postback',
        label: 'もっと見る',
        data: `action=show_more_seats&start=${startSeat + 13}&end=${endSeat}`,
        displayText: 'もっと見る',
      },
    };
  }

  return { items };
};

// 下校確認のクイックリプライ
const checkoutConfirmQuickReply = {
  items: [
    {
      type: 'action',
      action: {
        type: 'postback',
        label: 'はい、下校します',
        data: 'action=checkout_confirm&answer=yes',
        displayText: 'はい、下校します',
      },
    },
    {
      type: 'action',
      action: {
        type: 'postback',
        label: 'キャンセル',
        data: 'action=checkout_confirm&answer=no',
        displayText: 'キャンセル',
      },
    },
  ],
};

module.exports = {
  classroomQuickReply,
  generateSeatQuickReply,
  checkoutConfirmQuickReply,
};
