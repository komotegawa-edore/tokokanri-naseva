const { format, parseISO } = require('date-fns');
const { utcToZonedTime } = require('date-fns-tz');

const TIMEZONE = 'Asia/Tokyo';

/**
 * 現在時刻をJST形式で取得
 * @returns {Date} JST時刻
 */
function getCurrentJSTTime() {
  return utcToZonedTime(new Date(), TIMEZONE);
}

/**
 * 日時を指定フォーマットで文字列化
 * @param {Date} date - 日時
 * @param {string} formatStr - フォーマット文字列（デフォルト: 'yyyy/MM/dd HH:mm'）
 * @returns {string} フォーマットされた日時文字列
 */
function formatDate(date, formatStr = 'yyyy/MM/dd HH:mm') {
  const jstDate = utcToZonedTime(date, TIMEZONE);
  return format(jstDate, formatStr);
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
  getDurationInMinutes,
  formatDuration,
};
