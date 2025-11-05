# Vercelデプロイのデバッグガイド

ログに何も表示されない場合の確認手順です。

## 状況確認

ログに何も表示されないということは、以下のいずれかの問題があります：

1. ビルドが開始されていない
2. GitHubとVercelの連携に問題がある
3. Vercelのプロジェクト設定が間違っている

---

## ステップ1: Vercelダッシュボードで確認

### 1.1 プロジェクトの状態を確認

1. [Vercel Dashboard](https://vercel.com/dashboard)にアクセス
2. `tokokanri-naseva`プロジェクトを開く
3. 「Deployments」タブを確認

**確認ポイント:**
- デプロイが一覧に表示されているか？
- 最新のデプロイの状態は？
  - Building（ビルド中）
  - Ready（成功）
  - Error（エラー）
  - Canceled（キャンセル）

### 1.2 デプロイの詳細を確認

最新のデプロイをクリックして、以下を確認：

1. **Building タブ**
   - ビルドログが表示されているか？
   - どこでエラーになっているか？

2. **Runtime Logs タブ**
   - 実行時のログが表示されているか？

3. **Source タブ**
   - どのコミットからデプロイされたか？
   - ブランチは正しいか？（main）

---

## ステップ2: GitHubとVercelの連携を確認

### 2.1 Vercel GitHub App の確認

1. Vercelダッシュボード → Settings → Git
2. 「GitHub」セクションを確認
3. リポジトリ `komotegawa-edore/tokokanri-naseva`が接続されているか？

### 2.2 GitHubでWebhookを確認

1. GitHubリポジトリ → Settings → Webhooks
2. Vercelのwebhookがあるか？
3. Recent Deliveriesでエラーがないか？

---

## ステップ3: プロジェクト設定を確認

### 3.1 Root Directoryの確認

Vercelダッシュボード → Settings → General → Root Directory

- **正しい設定**: `./`（空白またはルート）
- **間違い**: `api/`や`src/`になっていないか？

### 3.2 Framework Presetの確認

- **推奨**: `Other`
- **避ける**: `Next.js`など自動検出されたフレームワーク

### 3.3 Build & Development Settingsの確認

- **Build Command**: 空白のまま（または`npm run vercel-build`）
- **Output Directory**: 空白のまま
- **Install Command**: `npm install`（デフォルト）

---

## ステップ4: 手動デプロイを試す

### 4.1 Vercel CLIをインストール

```bash
npm install -g vercel
```

### 4.2 ログイン

```bash
vercel login
```

### 4.3 ローカルからデプロイ

```bash
cd /Users/kazu/Downloads/tokokanri_naseva
vercel
```

プロンプトに従って設定：
- Set up and deploy? **Y**
- Which scope? **あなたのアカウント**
- Link to existing project? **Y**
- What's the name of your existing project? **tokokanri-naseva**

### 4.4 本番デプロイ

```bash
vercel --prod
```

---

## ステップ5: 環境変数の確認

Vercelダッシュボード → Settings → Environment Variables

**必須の環境変数が設定されているか確認:**

- [ ] `NODE_ENV` = `production`
- [ ] `LINE_CHANNEL_ACCESS_TOKEN`
- [ ] `LINE_CHANNEL_SECRET`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `GOOGLE_SHEETS_CREDENTIALS`
- [ ] `GOOGLE_SHEETS_SPREADSHEET_ID`
- [ ] `ATTENDANCE_SHEET_NAME`

**重要**: 環境変数を追加・変更した場合は、**必ず再デプロイ**してください。

---

## ステップ6: プロジェクトを再作成（最終手段）

もしどうしてもうまくいかない場合：

### 6.1 既存のプロジェクトを削除

1. Vercelダッシュボード → Settings → Advanced
2. 「Delete Project」

### 6.2 新規プロジェクトを作成

1. Vercelダッシュボード → Add New → Project
2. GitHub リポジトリから `komotegawa-edore/tokokanri-naseva`を選択
3. 設定を確認:
   - Framework Preset: **Other**
   - Root Directory: **./（空白）**
   - Build Command: **空白**
   - Output Directory: **空白**
4. 環境変数を設定
5. Deploy

---

## トラブルシューティング

### Q: "No Output Directory" エラー

**A:** Build Settingsで Output Directoryを空白にしてください。

### Q: "Module not found" エラー

**A:**
1. `package.json`の依存関係を確認
2. ローカルで`npm install`を実行
3. `package-lock.json`をコミット

```bash
npm install
git add package-lock.json
git commit -m "Add package-lock.json"
git push
```

### Q: デプロイは成功するが、アクセスするとエラー

**A:** Runtime Logsを確認してください。
- 環境変数が正しく設定されているか
- Google Sheetsのサービスアカウントがスプレッドシートに共有されているか

---

## デバッグコマンド

### ローカルで動作確認

```bash
# 依存関係のインストール
npm install

# ローカルで起動
npm run dev

# ブラウザで確認
open http://localhost:3000
```

### Vercel CLIでログ確認

```bash
# リアルタイムログ
vercel logs

# 特定のデプロイのログ
vercel logs [deployment-url]
```

---

## 次のアクション

1. **Vercelダッシュボードでデプロイを確認**
   - Deploymentsタブを開く
   - 最新のデプロイをクリック
   - Building/Runtime Logsを確認

2. **エラーメッセージをコピー**
   - ログに表示されているエラーメッセージをすべてコピー

3. **エラーメッセージを共有**
   - エラーメッセージがあれば、それを元に修正します

4. **Vercel CLIで手動デプロイを試す**
   - 上記の「ステップ4」を実行

---

## よくあるエラーと解決策

### エラー: "Cannot find module 'dotenv'"

**解決策:**
```bash
npm install dotenv
git add package.json package-lock.json
git commit -m "Ensure dotenv is installed"
git push
```

### エラー: "process.env.XXX is undefined"

**解決策:** 環境変数を設定して再デプロイ

### エラー: "PORT is not defined"

**解決策:** PORTはVercelが自動的に設定するため、エラーにはなりません。無視してOK。

---

## サポート

まだ解決しない場合：

1. Vercelのデプロイログ全体をコピー
2. エラーメッセージを確認
3. Vercel公式ドキュメントを参照: https://vercel.com/docs

具体的なエラーメッセージがあれば、それを元に対処できます。
