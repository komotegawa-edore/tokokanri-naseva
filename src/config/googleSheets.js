require('dotenv').config();
const { google } = require('googleapis');

// Google Sheets API設定
const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}');
const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const sheetName = process.env.ATTENDANCE_SHEET_NAME || '出席記録';

if (!credentials.client_email || !spreadsheetId) {
  console.error('❌ Google Sheets環境変数が設定されていません');
  process.exit(1);
}

// Google Auth設定
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Sheets API クライアント作成
const sheets = google.sheets({ version: 'v4', auth });

module.exports = {
  sheets,
  spreadsheetId,
  sheetName,
};
