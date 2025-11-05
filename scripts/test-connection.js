require('dotenv').config();
const { client } = require('../src/config/line');
const supabase = require('../src/config/supabase');
const { sheets, spreadsheetId, sheetName } = require('../src/config/googleSheets');

/**
 * 各種サービスの接続テスト
 */
async function testConnections() {
  console.log('🔍 接続テストを開始します...\n');

  let allPassed = true;

  // 1. LINE Bot API テスト
  console.log('1️⃣  LINE Bot API');
  try {
    const botInfo = await client.getBotInfo();
    console.log(`   ✅ 接続成功`);
    console.log(`   Bot名: ${botInfo.displayName}`);
  } catch (error) {
    console.log(`   ❌ 接続失敗: ${error.message}`);
    allPassed = false;
  }

  console.log('');

  // 2. Supabase テスト
  console.log('2️⃣  Supabase');
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) throw error;
    console.log(`   ✅ 接続成功`);
  } catch (error) {
    console.log(`   ❌ 接続失敗: ${error.message}`);
    allPassed = false;
  }

  console.log('');

  // 3. Google Sheets API テスト
  console.log('3️⃣  Google Sheets API');
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:G1`,
    });
    console.log(`   ✅ 接続成功`);
    console.log(`   ヘッダー: ${response.data.values?.[0]?.join(', ') || '(空)'}`);
  } catch (error) {
    console.log(`   ❌ 接続失敗: ${error.message}`);
    allPassed = false;
  }

  console.log('');

  // 4. 環境変数チェック
  console.log('4️⃣  環境変数チェック');
  const requiredEnvVars = [
    'LINE_CHANNEL_ACCESS_TOKEN',
    'LINE_CHANNEL_SECRET',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GOOGLE_SHEETS_CREDENTIALS',
    'GOOGLE_SHEETS_SPREADSHEET_ID',
  ];

  let envVarsOK = true;
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.log(`   ❌ ${envVar} が設定されていません`);
      envVarsOK = false;
      allPassed = false;
    }
  }

  if (envVarsOK) {
    console.log(`   ✅ 必須の環境変数がすべて設定されています`);
  }

  console.log('');
  console.log('='.repeat(50));
  if (allPassed) {
    console.log('✅ すべての接続テストに成功しました！');
  } else {
    console.log('❌ 一部のテストに失敗しました。上記のエラーを確認してください。');
    process.exit(1);
  }
}

testConnections();
