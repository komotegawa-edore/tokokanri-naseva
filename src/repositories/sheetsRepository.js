const { sheets, spreadsheetId, sheetName } = require('../config/googleSheets');
const { formatDate } = require('../utils/dateFormatter');

/**
 * Google Sheetsに登校記録を追加
 * @param {object} record - 登校記録
 * @returns {Promise<void>}
 */
async function appendCheckinRecord(record) {
  const { timestamp, studentName, fullName, grade, lineUserId, classroom, seatNumber } = record;

  const values = [
    [
      formatDate(timestamp, 'yyyy-MM-dd HH:mm:ss'),
      studentName,
      fullName || '',
      grade || '',
      lineUserId,
      classroom,
      seatNumber,
      '', // checkout_time（後で更新）
      '', // duration_minutes（後で計算）
    ],
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:I`,
    valueInputOption: 'USER_ENTERED',
    resource: { values },
  });
}

/**
 * 最新の登校記録を取得（未下校のもの）
 * @param {string} lineUserId - LINE User ID
 * @returns {Promise<object|null>} 登校記録またはnull
 */
async function getLatestCheckinRecord(lineUserId) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:I`,
  });

  const rows = response.data.values;
  if (!rows || rows.length <= 1) {
    return null; // ヘッダーのみ、またはデータなし
  }

  // 最後の行から順に検索（最新のレコードを探す）
  for (let i = rows.length - 1; i >= 1; i--) {
    const row = rows[i];

    // 空の行をスキップ
    if (!row || row.length === 0) {
      continue;
    }

    // フォーマット判定: E列（index 4）にLINE User IDがあれば新フォーマット
    // LINE User IDは"U"で始まる
    let timestamp, studentName, fullName, grade, userId, classroom, seatNumber, checkoutTime;
    const isNewFormat = row[4] && typeof row[4] === 'string' && row[4].startsWith('U');

    if (isNewFormat) {
      // 新フォーマット: A:登校時刻 B:表示名 C:フルネーム D:学年 E:ID F:教室 G:座席 H:下校 I:滞在
      timestamp = row[0];
      studentName = row[1];
      fullName = row[2] || '';
      grade = row[3] || '';
      userId = row[4];
      classroom = row[5];
      seatNumber = row[6];
      checkoutTime = row[7] || '';
    } else {
      // 旧フォーマット: A:登校時刻 B:表示名 C:ID D:教室 E:座席 F:下校 G:滞在
      timestamp = row[0];
      studentName = row[1];
      userId = row[2];
      classroom = row[3];
      seatNumber = row[4];
      checkoutTime = row[5] || '';
      fullName = '';
      grade = '';
    }

    if (userId === lineUserId && !checkoutTime) {
      return {
        rowIndex: i + 1, // Sheetsは1始まり
        timestamp,
        studentName,
        fullName: fullName || '',
        grade: grade || '',
        lineUserId: userId,
        classroom,
        seatNumber: parseInt(seatNumber, 10),
        checkoutTime,
      };
    }
  }

  return null;
}

/**
 * 下校時刻と滞在時間を更新
 * @param {number} rowIndex - 更新する行番号
 * @param {Date} checkoutTime - 下校時刻
 * @param {number} durationMinutes - 滞在時間（分）
 * @returns {Promise<void>}
 */
async function updateCheckoutRecord(rowIndex, checkoutTime, durationMinutes) {
  // まず、その行のデータを取得してフォーマットを判定
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!${rowIndex}:${rowIndex}`,
  });

  const row = response.data.values?.[0] || [];

  // 滞在時間を分として明示的に記録（数値のみ、時刻フォーマットではない）
  const values = [
    [formatDate(checkoutTime, 'yyyy-MM-dd HH:mm:ss'), `${durationMinutes}`],
  ];

  // フォーマット判定: E列（index 4）にLINE User IDがあれば新フォーマット
  let range;
  const isNewFormat = row[4] && typeof row[4] === 'string' && row[4].startsWith('U');

  if (isNewFormat) {
    // 新フォーマット: H列とI列
    range = `${sheetName}!H${rowIndex}:I${rowIndex}`;
  } else {
    // 旧フォーマット: F列とG列
    range = `${sheetName}!F${rowIndex}:G${rowIndex}`;
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    resource: { values },
  });
}

/**
 * ユーザーの登校履歴を取得
 * @param {string} lineUserId - LINE User ID
 * @param {number} limit - 取得件数（デフォルト: 10）
 * @returns {Promise<Array>} 登校記録の配列
 */
async function getUserHistory(lineUserId, limit = 10) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:I`,
    valueRenderOption: 'UNFORMATTED_VALUE', // 実際の値を取得（フォーマットされた表示ではなく）
  });

  const rows = response.data.values;
  if (!rows || rows.length <= 1) {
    return [];
  }

  const userRecords = [];
  for (let i = rows.length - 1; i >= 1 && userRecords.length < limit; i--) {
    const row = rows[i];

    // 空の行をスキップ
    if (!row || row.length === 0) {
      continue;
    }

    // フォーマット判定: E列（index 4）にLINE User IDがあれば新フォーマット
    let timestamp, studentName, fullName, grade, userId, classroom, seatNumber, checkoutTime, duration;
    const isNewFormat = row[4] && typeof row[4] === 'string' && row[4].startsWith('U');

    if (isNewFormat) {
      // 新フォーマット: A:登校時刻 B:表示名 C:フルネーム D:学年 E:ID F:教室 G:座席 H:下校 I:滞在
      timestamp = row[0];
      studentName = row[1];
      fullName = row[2] || '';
      grade = row[3] || '';
      userId = row[4];
      classroom = row[5];
      seatNumber = row[6];
      checkoutTime = row[7] || '';
      duration = row[8] || '';
    } else {
      // 旧フォーマット: A:登校時刻 B:表示名 C:ID D:教室 E:座席 F:下校 G:滞在
      timestamp = row[0];
      studentName = row[1];
      userId = row[2];
      classroom = row[3];
      seatNumber = row[4];
      checkoutTime = row[5] || '';
      duration = row[6] || '';
      fullName = '';
      grade = '';
    }

    if (userId === lineUserId) {
      const hasDurationValue = duration !== undefined && duration !== null && duration !== '';

      // durationMinutesの計算
      let durationMinutes = null;
      if (hasDurationValue) {
        const parsedValue = parseFloat(duration);

        // Google Sheetsのシリアル値（日時形式）かどうかを判定
        // シリアル値の場合: 0.05 = 1時間12分（0.05日 = 1.2時間 = 72分）
        // 通常の分の場合: 60, 120など大きな整数
        if (!isNaN(parsedValue)) {
          if (parsedValue < 1) {
            // 1未満の小数値 → Google Sheetsの日付シリアル値（日の端数）
            // 1日 = 1440分なので、値に1440を掛ける
            durationMinutes = Math.round(parsedValue * 1440);
            console.log(`🔄 時刻シリアル値→分変換: ${parsedValue} → ${durationMinutes}分`);
          } else if (parsedValue < 100 && parsedValue !== Math.floor(parsedValue)) {
            // 小数を含む100未満の値 → 時間単位の可能性
            durationMinutes = Math.round(parsedValue * 60);
            console.log(`🔄 時間→分変換: ${parsedValue}時間 → ${durationMinutes}分`);
          } else {
            // それ以外 → すでに分単位
            durationMinutes = Math.round(parsedValue);
          }
        }
      }

      userRecords.push({
        timestamp,
        studentName,
        fullName: fullName || '',
        grade: grade || '',
        classroom,
        seatNumber: parseInt(seatNumber, 10),
        checkoutTime,
        durationMinutes,
      });
    }
  }

  return userRecords;
}

/**
 * 現在使用中の座席一覧を取得
 * @param {string} classroom - 教室名
 * @returns {Promise<Array<number>>} 使用中の座席番号の配列
 */
async function getOccupiedSeats(classroom) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:I`,
  });

  const rows = response.data.values;
  if (!rows || rows.length <= 1) {
    return [];
  }

  const occupiedSeats = [];

  // 全行をチェック（ヘッダーをスキップ）
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    // 空の行をスキップ
    if (!row || row.length === 0) {
      continue;
    }

    // フォーマット判定: E列（index 4）にLINE User IDがあれば新フォーマット
    let roomName, seatNumber, checkoutTime;
    const isNewFormat = row[4] && typeof row[4] === 'string' && row[4].startsWith('U');

    if (isNewFormat) {
      // 新フォーマット: A:登校時刻 B:表示名 C:フルネーム D:学年 E:ID F:教室 G:座席 H:下校 I:滞在
      roomName = row[5]; // F列
      seatNumber = row[6]; // G列
      checkoutTime = row[7] || ''; // H列
    } else {
      // 旧フォーマット: A:登校時刻 B:表示名 C:ID D:教室 E:座席 F:下校 G:滞在
      roomName = row[3]; // D列
      seatNumber = row[4]; // E列
      checkoutTime = row[5] || ''; // F列
    }

    // 同じ教室で、まだ下校していない座席を記録
    if (roomName === classroom && !checkoutTime && seatNumber) {
      occupiedSeats.push(parseInt(seatNumber, 10));
    }
  }

  return occupiedSeats;
}

module.exports = {
  appendCheckinRecord,
  getLatestCheckinRecord,
  updateCheckoutRecord,
  getUserHistory,
  getOccupiedSeats,
};
