# セットアップガイド

このガイドに従って、学習塾登校管理アプリをゼロからセットアップします。

## 前提条件

- Node.js v18以上がインストールされていること
- Googleアカウント
- LINEアカウント
- Supabaseアカウント（無料）

---

## ステップ1: プロジェクトのセットアップ

### 1.1 依存パッケージのインストール

```bash
cd /Users/kazu/Downloads/tokokanri_naseva
npm install
```

---

## ステップ2: LINE Bot のセットアップ

### 2.1 LINE Developersコンソールにアクセス

1. [LINE Developers](https://developers.line.biz/)にアクセス
2. LINEアカウントでログイン

### 2.2 プロバイダーを作成

1. 「プロバイダー」タブ → 「作成」
2. プロバイダー名を入力（例: 学習塾）

### 2.3 Messaging APIチャネルを作成

1. 「新規チャネル作成」をクリック
2. 「Messaging API」を選択
3. 以下を入力:
   - チャネル名: `学習塾登校管理`
   - チャネル説明: `登校・下校記録用Bot`
   - カテゴリ: 教育
   - サブカテゴリ: その他
4. 利用規約に同意して「作成」

### 2.4 必要な情報を取得

**チャネルシークレット:**
1. 「チャネル基本設定」タブ
2. 「チャネルシークレット」をコピー

**チャネルアクセストークン:**
1. 「Messaging API設定」タブ
2. 「チャネルアクセストークン」→ 「発行」
3. トークンをコピー

### 2.5 Webhook設定

1. 「Messaging API設定」タブ
2. 「Webhook URL」を後で設定するためにメモ
   - 形式: `https://your-domain.com/webhook`
3. 「Webhookの利用」を **オン** にする
4. 「応答メッセージ」を **オフ** にする（重要！）

---

## ステップ3: Supabase のセットアップ

### 3.1 プロジェクト作成

1. [Supabase](https://supabase.com/)にアクセス
2. 「Start your project」→ サインアップ
3. 「New Project」をクリック
4. プロジェクト情報を入力:
   - Name: `tokokanri-naseva`
   - Database Password: 安全なパスワード（メモしておく）
   - Region: 東京（Northeast Asia）

### 3.2 テーブル作成

1. 左メニュー「SQL Editor」をクリック
2. 「New query」をクリック
3. `database/supabase_schema.sql`の内容をコピー&ペースト
4. 「Run」をクリック

### 3.3 APIキーを取得

1. 左メニュー「Settings」→ 「API」
2. 以下をコピー:
   - **Project URL**: `SUPABASE_URL`
   - **anon public key**: 使用しない
   - **service_role key**: `SUPABASE_SERVICE_ROLE_KEY`（重要！）

---

## ステップ4: Google Sheets のセットアップ

詳細は`database/google_sheets_setup.md`を参照してください。

### 4.1 Google Cloud Consoleでプロジェクト作成

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成

### 4.2 Google Sheets API有効化

1. 「APIとサービス」→ 「ライブラリ」
2. 「Google Sheets API」を検索して有効化
3. 「Google Drive API」も有効化（推奨）

### 4.3 サービスアカウント作成

1. 「APIとサービス」→ 「認証情報」
2. 「認証情報を作成」→ 「サービスアカウント」
3. 名前: `tokokanri-bot`
4. 「鍵を追加」→ 「JSON」を選択
5. JSONファイルがダウンロードされる

### 4.4 スプレッドシート作成

1. [Google Sheets](https://sheets.google.com/)で新規作成
2. ファイル名: 「学習塾登校管理」
3. シート名を「出席記録」に変更
4. A1セルから以下を入力:
   ```
   time_stamp | student_name | line_user_id | classroom | seat_number | checkout_time | duration_minutes
   ```

5. スプレッドシートを共有:
   - 右上「共有」をクリック
   - サービスアカウントのメールアドレスを追加
     （例: `tokokanri-bot@xxx.iam.gserviceaccount.com`）
   - 権限: **編集者**

6. スプレッドシートIDを取得:
   - URLから取得: `https://docs.google.com/spreadsheets/d/【ここがID】/edit`

---

## ステップ5: 環境変数の設定

### 5.1 .envファイルを作成

```bash
cp .env.example .env
```

### 5.2 環境変数を設定

`.env`ファイルを開いて以下を設定:

```bash
# LINE Bot設定
LINE_CHANNEL_ACCESS_TOKEN=（ステップ2.4で取得したトークン）
LINE_CHANNEL_SECRET=（ステップ2.4で取得したシークレット）

# Supabase設定
SUPABASE_URL=（ステップ3.3で取得したURL）
SUPABASE_SERVICE_ROLE_KEY=（ステップ3.3で取得したキー）

# Google Sheets設定
GOOGLE_SHEETS_CREDENTIALS='{"type":"service_account",...}'  # JSONを1行にして貼り付け
GOOGLE_SHEETS_SPREADSHEET_ID=（ステップ4.4で取得したID）
ATTENDANCE_SHEET_NAME=出席記録

# サーバー設定
PORT=3000
NODE_ENV=development
TZ=Asia/Tokyo
```

**重要**: `GOOGLE_SHEETS_CREDENTIALS`は、ダウンロードしたJSONファイルの中身を**改行なしの1行**にして貼り付けてください。

---

## ステップ6: 接続テスト

```bash
node scripts/test-connection.js
```

すべてのテストが成功することを確認してください。

---

## ステップ7: ローカルでサーバー起動

### 7.1 開発サーバーを起動

```bash
npm run dev
```

以下のようなメッセージが表示されればOK:
```
✅ サーバーが起動しました: http://localhost:3000
環境: development
```

### 7.2 ngrokでトンネル作成

別のターミナルウィンドウで:

```bash
# ngrokをインストール（初回のみ）
# https://ngrok.com/download

# トンネル作成
ngrok http 3000
```

以下のようなURLが表示されます:
```
Forwarding  https://xxxx-xx-xx-xxx-xxx.ngrok-free.app -> http://localhost:3000
```

このURL（`https://xxxx-xx-xx-xxx-xxx.ngrok-free.app`）をメモ。

### 7.3 LINE DevelopersにWebhook URLを設定

1. LINE Developersコンソールに戻る
2. 「Messaging API設定」タブ
3. 「Webhook URL」に以下を入力:
   ```
   https://xxxx-xx-xx-xxx-xxx.ngrok-free.app/webhook
   ```
4. 「検証」をクリック → 成功すればOK

---

## ステップ8: リッチメニューの設定

### 8.1 リッチメニュー画像を作成

`assets/richmenu/README.md`を参照して、リッチメニュー画像を作成してください。

- サイズ: 2500 x 843 px
- ファイル名: `richmenu.png`
- 配置場所: `assets/richmenu/richmenu.png`

### 8.2 リッチメニューを登録

```bash
node scripts/setup-richmenu.js
```

成功すれば以下のようなメッセージが表示されます:
```
✅ リッチメニューのセットアップが完了しました！
```

---

## ステップ9: テスト

### 9.1 LINEで友だち追加

1. LINE Developersコンソール
2. 「Messaging API設定」タブ
3. QRコードをスキャンして友だち追加

### 9.2 動作確認

1. **ウェルカムメッセージが届くか確認**
2. **リッチメニューが表示されるか確認**
3. **登校フローのテスト**:
   - 「登校」をタップ
   - 教室を選択
   - 座席番号を選択
   - 成功メッセージが表示されるか確認
4. **Google Sheetsにデータが記録されているか確認**
5. **下校フローのテスト**:
   - 「下校」をタップ
   - 「はい、下校します」をタップ
   - 滞在時間が表示されるか確認
6. **履歴表示のテスト**:
   - 「登校履歴」をタップ
   - 履歴が表示されるか確認

---

## ステップ10: 本番環境デプロイ（オプション）

### Herokuへのデプロイ例

```bash
# Heroku CLIをインストール
# https://devcenter.heroku.com/articles/heroku-cli

# Herokuにログイン
heroku login

# アプリを作成
heroku create your-app-name

# 環境変数を設定
heroku config:set LINE_CHANNEL_ACCESS_TOKEN=xxx
heroku config:set LINE_CHANNEL_SECRET=xxx
# ... 他の環境変数も設定

# デプロイ
git init
git add .
git commit -m "Initial commit"
git push heroku main

# Webhook URLを更新
# https://your-app-name.herokuapp.com/webhook
```

---

## トラブルシューティング

### Q: Webhookが動作しない

**A:**
- サーバーが起動しているか確認
- ngrokが起動しているか確認
- Webhook URLが正しく設定されているか確認
- LINE Developersで「Webhookの利用」が**オン**になっているか確認
- 「応答メッセージ」が**オフ**になっているか確認

### Q: Google Sheetsに書き込めない

**A:**
- サービスアカウントのメールアドレスをスプレッドシートに共有したか確認
- 権限が「編集者」になっているか確認
- スプレッドシートIDが正しいか確認

### Q: Supabaseに接続できない

**A:**
- `supabase_schema.sql`を実行したか確認
- APIキーが正しいか確認（`service_role`キーを使用）

---

## 完了！

これで学習塾登校管理アプリが動作するようになりました。

次のステップ:
- 生徒に友だち追加してもらう
- 実際の運用を開始
- Phase 2の機能（ランキング表示など）を追加

質問があれば、GitHubのIssuesに投稿してください。
