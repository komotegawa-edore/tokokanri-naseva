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

  return {
    items: classrooms.map(classroom => ({
      type: 'action',
      action: {
        type: 'postback',
        label: classroom.name,
        data: `action=select_classroom&classroom=${classroom.name}&range=${classroom.startSeat}-${classroom.endSeat}`,
        displayText: classroom.name,
      },
    })),
  };
}

/**
 * 座席選択用のQuick Replyを生成（使用中の座席を除外）
 * @param {string} classroom - 教室名
 * @param {number} startSeat - 開始座席番号
 * @param {number} endSeat - 終了座席番号
 * @param {number} currentPage - 現在のページ（0始まり）
 * @param {number} itemsPerPage - 1ページあたりの座席数（デフォルト: 12）
 * @returns {Promise<object>} Quick Reply オブジェクト
 */
async function generateSeatQuickReply(classroom, startSeat, endSeat, currentPage = 0, itemsPerPage = 12) {
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

  // ページネーション
  const start = currentPage * itemsPerPage;
  const end = start + itemsPerPage;
  const seatsToShow = availableSeats.slice(start, end);
  const hasMore = availableSeats.length > end;

  const items = seatsToShow.map(seat => ({
    type: 'action',
    action: {
      type: 'postback',
      label: `${seat}番`,
      data: `action=select_seat&seat=${seat}`,
      displayText: `${seat}番`,
    },
  }));

  // 「もっと見る」ボタンを追加
  if (hasMore && items.length < 13) {
    items.push({
      type: 'action',
      action: {
        type: 'postback',
        label: 'もっと見る',
        data: `action=show_more_seats&classroom=${classroom}&start=${availableSeats[end]}&end=${endSeat}&page=${currentPage + 1}`,
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
  generateSeatQuickReply,
};
