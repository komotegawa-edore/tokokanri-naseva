# Google Sheets セットアップ手順

## 1. Google Cloud Console設定

### 1.1 プロジェクト作成
1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成
   - プロジェクト名: `tokokanri-naseva`（任意）
   - 組織: なし（個人の場合）

### 1.2 Google Sheets API有効化
1. 左メニュー → 「APIとサービス」 → 「ライブラリ」
2. 「Google Sheets API」を検索
3. 「有効にする」をクリック

### 1.3 Google Drive API有効化（推奨）
1. 同様に「Google Drive API」を検索
2. 「有効にする」をクリック

### 1.4 サービスアカウント作成
1. 左メニュー → 「APIとサービス」 → 「認証情報」
2. 「認証情報を作成」 → 「サービスアカウント」
3. サービスアカウント情報を入力
   - 名前: `tokokanri-bot`
   - ID: 自動生成（そのまま）
   - 説明: `LINE Bot用のサービスアカウント`
4. 「作成して続行」をクリック
5. ロールは設定不要（スキップ）
6. 「完了」をクリック

### 1.5 サービスアカウントキーの作成
1. 作成したサービスアカウントをクリック
2. 「キー」タブ → 「鍵を追加」 → 「新しい鍵を作成」
3. キーのタイプ: **JSON**
4. 「作成」をクリック
5. JSONファイルがダウンロードされる

### 1.6 JSONキーの保存
ダウンロードしたJSONファイルの中身を確認:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "tokokanri-bot@your-project-id.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

このJSONの内容を**1行**にして、`.env`ファイルの`GOOGLE_SHEETS_CREDENTIALS`に設定します。

**重要**: 改行を削除して1行にする
```bash
GOOGLE_SHEETS_CREDENTIALS='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
```

---

## 2. Google Spreadsheet作成

### 2.1 新しいスプレッドシート作成
1. [Google Sheets](https://sheets.google.com/)にアクセス
2. 「空白」から新しいスプレッドシートを作成
3. ファイル名を「学習塾登校管理」などに変更

### 2.2 シート設定
1. デフォルトのシート名を「出席記録」に変更
2. A1セルから以下のヘッダーを入力:

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| time_stamp | student_name | line_user_id | classroom | seat_number | checkout_time | duration_minutes |

### 2.3 スプレッドシートIDの取得
スプレッドシートのURLから取得:
```
https://docs.google.com/spreadsheets/d/【この部分がスプレッドシートID】/edit
```

例:
```
https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
                                      ↑ここがID ↑
```

このIDを`.env`の`GOOGLE_SHEETS_SPREADSHEET_ID`に設定:
```bash
GOOGLE_SHEETS_SPREADSHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
```

### 2.4 スプレッドシートの共有
1. 右上の「共有」ボタンをクリック
2. サービスアカウントのメールアドレスを入力
   - 例: `tokokanri-bot@your-project-id.iam.gserviceaccount.com`
3. 権限: **編集者**
4. 「送信」をクリック
   - 「通知を送信」のチェックは外してOK

---

## 3. 動作確認スクリプト

### 3.1 テストスクリプト作成
`scripts/test-sheets-connection.js`を作成:

```javascript
require('dotenv').config();
const { google } = require('googleapis');

async function testConnection() {
  try {
    // 環境変数から認証情報を取得
    const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    const sheetName = process.env.ATTENDANCE_SHEET_NAME;

    // データ読み取りテスト
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:G1`,
    });

    console.log('✅ Google Sheets接続成功！');
    console.log('ヘッダー:', response.data.values);

    // データ書き込みテスト
    const now = new Date().toISOString();
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:G`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[now, 'テスト太郎', 'U1234567890', 'A教室', 5, '', '']],
      },
    });

    console.log('✅ データ書き込み成功！');
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
  }
}

testConnection();
```

### 3.2 実行
```bash
node scripts/test-sheets-connection.js
```

成功すれば:
```
✅ Google Sheets接続成功！
ヘッダー: [ [Array] ]
✅ データ書き込み成功！
```

---

## 4. .envファイルの設定例

```bash
# Google Sheets設定
GOOGLE_SHEETS_CREDENTIALS='{"type":"service_account","project_id":"tokokanri-123456",...}'
GOOGLE_SHEETS_SPREADSHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
ATTENDANCE_SHEET_NAME=出席記録
```

---

## 5. トラブルシューティング

### エラー: "The caller does not have permission"
**原因**: サービスアカウントがスプレッドシートにアクセスできない

**解決策**:
1. スプレッドシートの共有設定を確認
2. サービスアカウントのメールアドレスが正しいか確認
3. 権限が「編集者」になっているか確認

### エラー: "Requested entity was not found"
**原因**: スプレッドシートIDまたはシート名が間違っている

**解決策**:
1. `.env`の`GOOGLE_SHEETS_SPREADSHEET_ID`を確認
2. `.env`の`ATTENDANCE_SHEET_NAME`がスプレッドシートのシート名と一致しているか確認

### エラー: "Unable to parse range"
**原因**: シート名に特殊文字が含まれている

**解決策**:
- シート名をシンプルな名前に変更（日本語OK、スペースや記号は避ける）
- または、シート名を`'`で囲む: `'出席 記録'!A1:G1`

---

## 6. セキュリティ注意事項

- ❌ JSONキーをGitにコミットしない
- ❌ JSONキーを公開リポジトリに置かない
- ✅ `.gitignore`に`.env`を追加済み
- ✅ サービスアカウントは必要最小限の権限のみ付与
- ✅ 定期的にキーをローテーション

---

## 7. 次のステップ

✅ Google Sheets APIの設定完了
✅ サービスアカウント作成完了
✅ スプレッドシート作成完了
✅ 動作確認完了

次は:
1. Supabaseのセットアップ
2. LINE Botのセットアップ
3. アプリケーションコードの実装開始
