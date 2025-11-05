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
  // 既にJSTの時刻が入っているため、そのままフォーマット
  return format(dateObj, formatStr);
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
 * @param {string} dateString - 日時文字列
 * @returns {Date} Dateオブジェクト（JST）
 */
function parseSheetDateString(dateString) {
  // "yyyy-MM-dd HH:mm:ss"形式の文字列をJSTとして解釈
  // この文字列は既にJST時刻で保存されているため、そのまま使用
  const isoString = dateString.replace(' ', 'T') + '+09:00';
  return new Date(isoString);
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
