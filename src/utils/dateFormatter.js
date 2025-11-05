const { format, parseISO } = require('date-fns');
const { utcToZonedTime } = require('date-fns-tz');

const TIMEZONE = 'Asia/Tokyo';

/**
 * 現在時刻をJST形式で取得
 * @returns {Date} JST時刻
 */
function getCurrentJSTTime() {
  // new Date()は既にシステムのローカル時刻
  // Vercelはデフォルトでタイムゾーンを持たないため、明示的にJSTで取得
  const now = new Date();
  const jstOffset = 9 * 60; // JSTはUTC+9
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utcTime + (jstOffset * 60000));
}

/**
 * 日時を指定フォーマットで文字列化
 * @param {Date} date - 日時
 * @param {string} formatStr - フォーマット文字列（デフォルト: 'yyyy/MM/dd HH:mm'）
 * @returns {string} フォーマットされた日時文字列
 */
function formatDate(date, formatStr = 'yyyy/MM/dd HH:mm') {
  // dateが文字列の場合はDateオブジェクトに変換
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // 無効な日付のチェック
  if (!dateObj || isNaN(dateObj.getTime())) {
    console.error('❌ formatDate: 無効な日付オブジェクト', date);
    return '';
  }

  // 既にJSTの時刻が入っているため、そのままフォーマット
  const formatted = format(dateObj, formatStr);
  console.log(`🕐 formatDate: ${date.toISOString()} -> "${formatted}"`);
  return formatted;
}

/**
 * ISO文字列からJST日時を取得
 * @param {string} isoString - ISO文字列
 * @returns {Date} JST日時
 */
function parseISOToJST(isoString) {
  return utcToZonedTime(parseISO(isoString), TIMEZONE);
}

/**
 * Google Sheetsの日時文字列（yyyy-MM-dd HH:mm:ss）をDateオブジェクトに変換
 * @param {string|Date} dateString - 日時文字列またはDateオブジェクト
 * @returns {Date} Dateオブジェクト（JST）
 */
function parseSheetDateString(dateString) {
  // 既にDateオブジェクトの場合はそのまま返す
  if (dateString instanceof Date) {
    return dateString;
  }

  // 空文字列やundefinedの場合
  if (!dateString) {
    console.error('❌ parseSheetDateString: 空の日時文字列です');
    return null;
  }

  // "yyyy-MM-dd HH:mm:ss"形式の文字列をJSTとして解釈
  // "yyyy-MM-dd H:mm:ss"（1桁の時刻）にも対応
  try {
    // 日時文字列を正規化（1桁の時刻を2桁に）
    let normalized = dateString.trim();

    // "2025-11-06 3:03:12" -> "2025-11-06 03:03:12"
    const match = normalized.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}):(\d{2}):(\d{2})$/);
    if (match) {
      const [, datePart, hour, minute, second] = match;
      normalized = `${datePart} ${hour.padStart(2, '0')}:${minute}:${second}`;
      console.log(`🔄 Normalized time: "${dateString}" -> "${normalized}"`);
    }

    const isoString = normalized.replace(' ', 'T') + '+09:00';
    const date = new Date(isoString);

    // 無効な日付かチェック
    if (isNaN(date.getTime())) {
      console.error(`❌ parseSheetDateString: 無効な日時文字列 "${dateString}"`);
      return null;
    }

    return date;
  } catch (error) {
    console.error(`❌ parseSheetDateString: パースエラー "${dateString}"`, error);
    return null;
  }
}

/**
 * 2つの日時の差分を分単位で計算
 * @param {Date} start - 開始日時
 * @param {Date} end - 終了日時
 * @returns {number} 差分（分）
 */
function getDurationInMinutes(start, end) {
  return Math.floor((end - start) / 1000 / 60);
}

/**
 * 分を「X時間Y分」形式に変換
 * @param {number} minutes - 分
 * @returns {string} フォーマットされた文字列
 */
function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0) {
    return `${hours}時間${mins}分`;
  }
  return `${mins}分`;
}

module.exports = {
  getCurrentJSTTime,
  formatDate,
  parseISOToJST,
  parseSheetDateString,
  getDurationInMinutes,
  formatDuration,
};
