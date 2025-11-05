const classroomRepository = require('../repositories/classroomRepository');
const sheetsRepository = require('../repositories/sheetsRepository');

/**
 * アクティブな教室一覧を取得（スプレッドシートから）
 * @returns {Promise<Array>} 教室一覧
 */
async function getActiveClassrooms() {
  return await classroomRepository.getClassroomSettings();
}

/**
 * 教室名から座席範囲を取得
 * @param {string} classroomName - 教室名
 * @returns {Promise<object|null>} 座席範囲情報
 */
async function getSeatRangeByClassroom(classroomName) {
  return await classroomRepository.getClassroomByName(classroomName);
}

/**
 * 利用可能な座席一覧を取得（使用中の座席を除く）
 * @param {string} classroom - 教室名
 * @param {number} startSeat - 開始座席番号
 * @param {number} endSeat - 終了座席番号
 * @returns {Promise<Array<number>>} 利用可能な座席番号の配列
 */
async function getAvailableSeats(classroom, startSeat, endSeat) {
  // 使用中の座席を取得
  const occupiedSeats = await sheetsRepository.getOccupiedSeats(classroom);

  // 全座席から使用中の座席を除外
  const availableSeats = [];
  for (let seat = startSeat; seat <= endSeat; seat++) {
    if (!occupiedSeats.includes(seat)) {
      availableSeats.push(seat);
    }
  }

  return availableSeats;
}

/**
 * 教室選択用のQuick Replyを生成
 * @returns {Promise<object>} Quick Reply オブジェクト
 */
async function generateClassroomQuickReply() {
  const classrooms = await getActiveClassrooms();

  const quickReply = {
    items: classrooms.map(classroom => ({
      type: 'action',
      action: {
        type: 'postback',
        label: classroom.name,
        data: `action=select_classroom&classroom=${encodeURIComponent(classroom.name)}&range=${classroom.startSeat}-${classroom.endSeat}`,
        displayText: classroom.name,
      },
    })),
  };

  console.log('📝 Generated Quick Reply:', JSON.stringify(quickReply, null, 2));
  console.log('📊 Item count:', quickReply.items.length);

  // データサイズをチェック
  quickReply.items.forEach((item, index) => {
    const dataSize = Buffer.byteLength(item.action.data, 'utf8');
    console.log(`  Item ${index}: "${item.action.label}" - data size: ${dataSize} bytes`);
    if (dataSize > 300) {
      console.warn(`⚠️  警告: Item ${index} のデータサイズが300バイトを超えています`);
    }
  });

  return quickReply;
}

/**
 * 座席範囲を分割
 * @param {number} startSeat - 開始座席番号
 * @param {number} endSeat - 終了座席番号
 * @param {number} maxItems - 最大アイテム数（デフォルト: 13）
 * @returns {Array} 分割された範囲の配列 [{start, end, label}, ...]
 */
function divideSeatRange(startSeat, endSeat, maxItems = 13) {
  const totalSeats = endSeat - startSeat + 1;

  // 13席以下なら分割不要
  if (totalSeats <= maxItems) {
    return [{
      start: startSeat,
      end: endSeat,
      label: `${startSeat}〜${endSeat}番`,
      isFinal: true,
    }];
  }

  // 分割数を決定（2分割、3分割）
  const divisions = totalSeats > maxItems * 2 ? 3 : 2;
  const seatsPerDivision = Math.ceil(totalSeats / divisions);

  const ranges = [];
  for (let i = 0; i < divisions; i++) {
    const start = startSeat + (i * seatsPerDivision);
    const end = Math.min(start + seatsPerDivision - 1, endSeat);

    if (start <= endSeat) {
      const rangeSize = end - start + 1;
      ranges.push({
        start,
        end,
        label: `${start}〜${end}番`,
        isFinal: rangeSize <= maxItems,
      });
    }
  }

  return ranges;
}

/**
 * 座席範囲選択用のQuick Replyを生成
 * @param {string} classroom - 教室名
 * @param {number} startSeat - 開始座席番号
 * @param {number} endSeat - 終了座席番号
 * @returns {Promise<object>} Quick Reply オブジェクト
 */
async function generateSeatRangeQuickReply(classroom, startSeat, endSeat) {
  const ranges = divideSeatRange(startSeat, endSeat);

  const items = ranges.map(range => ({
    type: 'action',
    action: {
      type: 'postback',
      label: range.label,
      data: `action=select_seat_range&classroom=${encodeURIComponent(classroom)}&start=${range.start}&end=${range.end}&isFinal=${range.isFinal}`,
      displayText: range.label,
    },
  }));

  return { items };
}

/**
 * 座席選択用のQuick Replyを生成（使用中の座席を除外）
 * @param {string} classroom - 教室名
 * @param {number} startSeat - 開始座席番号
 * @param {number} endSeat - 終了座席番号
 * @returns {Promise<object>} Quick Reply オブジェクト
 */
async function generateSeatQuickReply(classroom, startSeat, endSeat, offset = 0) {
  // 利用可能な座席を取得
  const availableSeats = await getAvailableSeats(classroom, startSeat, endSeat);

  if (availableSeats.length === 0) {
    return {
      items: [{
        type: 'action',
        action: {
          type: 'postback',
          label: '空席なし',
          data: 'action=no_seats',
          displayText: '空席なし',
        },
      }],
    };
  }

  const normalizedOffset = Math.max(0, Math.min(offset, Math.max(availableSeats.length - 1, 0)));
  const seatsToShow = availableSeats.slice(normalizedOffset, normalizedOffset + 12);

  const items = seatsToShow.map(seat => ({
    type: 'action',
    action: {
      type: 'postback',
      label: `${seat}番`,
      data: `action=select_seat&seat=${seat}`,
      displayText: `${seat}番`,
    },
  }));

  const hasMore = availableSeats.length > normalizedOffset + seatsToShow.length;

  if (hasMore) {
    items.push({
      type: 'action',
      action: {
        type: 'postback',
        label: 'もっと見る',
        data: `action=show_more_seats&classroom=${encodeURIComponent(classroom)}&start=${startSeat}&end=${endSeat}&offset=${normalizedOffset + seatsToShow.length}`,
        displayText: 'もっと見る',
      },
    });
  }

  return { items };
}

module.exports = {
  getActiveClassrooms,
  getSeatRangeByClassroom,
  getAvailableSeats,
  generateClassroomQuickReply,
  generateSeatRangeQuickReply,
  generateSeatQuickReply,
};
