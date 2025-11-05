if (process.env.VERCEL !== '1') {
  require('dotenv').config();
}
const { google } = require('googleapis');

// Google Sheets API設定
let credentials = {};
try {
  credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}');
} catch (error) {
  console.error('❌ GOOGLE_SHEETS_CREDENTIALS のパースに失敗しました:', error.message);
}

const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const sheetName = process.env.ATTENDANCE_SHEET_NAME || '出席記録';

if (!credentials.client_email || !spreadsheetId) {
  console.warn('⚠️  Google Sheets環境変数が設定されていません');
  // Vercelビルド時はエラーにしない
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    console.error('❌ Google Sheets環境変数が必要です');
    process.exit(1);
  }
}

// Google Auth設定
const auth = credentials.client_email ? new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
}) : null;

// Sheets API クライアント作成
const sheets = auth ? google.sheets({ version: 'v4', auth }) : null;

module.exports = {
  sheets,
  spreadsheetId,
  sheetName,
};
