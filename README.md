# 学習塾登校管理アプリ

LINE Bot上で動作する学習塾の登校・下校管理システムです。

## 機能

- ✅ 登校記録（教室選択→座席番号選択）
- ✅ 下校記録（滞在時間の自動計算）
- ✅ 登校履歴表示
- ✅ Google Sheetsへのデータ保存
- ✅ Supabaseでのユーザー管理

## 技術スタック

- **バックエンド**: Node.js + Express
- **LINE**: Messaging API
- **データベース**: Google Sheets + Supabase
- **その他**: date-fns, dotenv

## セットアップ手順

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example`を`.env`にコピーして、各項目を設定してください。

```bash
cp .env.example .env
```

設定が必要な環境変数:
- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_SHEETS_CREDENTIALS`
- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `ATTENDANCE_SHEET_NAME`

詳細は`database/google_sheets_setup.md`を参照してください。

### 3. Supabaseのセットアップ

`database/supabase_schema.sql`をSupabaseのSQL Editorで実行してください。

```sql
-- Supabaseダッシュボード → SQL Editor → New query
-- supabase_schema.sqlの内容をコピー&ペースト
```

### 4. Google Sheetsのセットアップ

`database/google_sheets_setup.md`の手順に従って、Google Sheets APIを有効化してください。

### 5. 接続テスト

```bash
node scripts/test-connection.js
```

すべてのテストが成功することを確認してください。

### 6. サーバー起動

**開発環境:**
```bash
npm run dev
```

**本番環境:**
```bash
npm start
```

### 7. ngrokでトンネル作成（開発時）

ローカル開発時は、ngrokを使ってLINEからアクセスできるようにします。

```bash
ngrok http 3000
```

ngrokのURLをLINE DevelopersのWebhook URLに設定:
```
https://your-ngrok-url.ngrok.io/webhook
```

### 8. リッチメニューの設定

リッチメニュー画像を作成してから実行してください。

```bash
node scripts/setup-richmenu.js
```

## ディレクトリ構造

```
tokokanri_naseva/
├── src/
│   ├── config/          # 設定ファイル
│   ├── controllers/     # コントローラー
│   ├── services/        # ビジネスロジック
│   ├── repositories/    # データアクセス
│   ├── middleware/      # ミドルウェア
│   ├── utils/           # ユーティリティ
│   ├── constants/       # 定数定義
│   └── index.js         # エントリーポイント
├── scripts/             # ユーティリティスクリプト
├── database/            # データベース関連
├── assets/              # 静的ファイル
└── .env                 # 環境変数
```

## 使い方

### 登校の流れ

1. LINEのリッチメニューから「登校」をタップ
2. 教室を選択（A教室、B教室、C教室）
3. 座席番号を選択
4. 登校完了メッセージが表示されます

### 下校の流れ

1. リッチメニューから「下校」をタップ
2. 確認メッセージで「はい、下校します」をタップ
3. 滞在時間が計算され、下校完了メッセージが表示されます

### 履歴の確認

1. リッチメニューから「登校履歴」をタップ
2. 直近10件の登校記録が表示されます

## スクリプト

### 接続テスト
```bash
node scripts/test-connection.js
```

### リッチメニュー設定
```bash
node scripts/setup-richmenu.js
```

### リッチメニュー削除
```bash
node scripts/delete-richmenu.js <richMenuId>
```

## トラブルシューティング

### LINE Webhookが動作しない

1. Webhook URLが正しく設定されているか確認
2. サーバーが起動しているか確認
3. ngrok（開発時）が起動しているか確認
4. LINE Developersの「Webhook送信」が「利用する」になっているか確認

### Google Sheetsに書き込めない

1. サービスアカウントのメールアドレスをスプレッドシートに共有しているか確認
2. `GOOGLE_SHEETS_CREDENTIALS`が正しく設定されているか確認
3. スプレッドシートIDが正しいか確認

### Supabaseに接続できない

1. Supabaseのプロジェクトが作成されているか確認
2. `supabase_schema.sql`を実行したか確認
3. APIキーが正しく設定されているか確認

## 開発

### 開発サーバー起動
```bash
npm run dev
```

nodemonが自動的にファイル変更を検知して再起動します。

### ログ確認

ターミナルにリアルタイムでログが出力されます。

## ライセンス

MIT

## サポート

質問や問題がある場合は、GitHubのIssuesに投稿してください。
