# Vercelデプロイガイド

このガイドに従って、学習塾登校管理アプリをVercelにデプロイします。

## 前提条件

- GitHubアカウント
- Vercelアカウント（無料）
- コードがGitHubにプッシュされていること

---

## ステップ1: GitHubにコードをプッシュ

まだプッシュしていない場合は、`GITHUB_PUSH_GUIDE.md`を参照してください。

```bash
git add .
git commit -m "Vercel deployment setup"
git push -u origin main
```

---

## ステップ2: Vercelアカウントの作成

### 2.1 Vercelにサインアップ

1. [Vercel](https://vercel.com/)にアクセス
2. 「Sign Up」をクリック
3. GitHubアカウントで認証

### 2.2 GitHubの権限を付与

1. Vercelに必要な権限を付与
2. リポジトリへのアクセスを許可

---

## ステップ3: プロジェクトをインポート

### 3.1 新規プロジェクト作成

1. Vercelダッシュボードで「Add New...」→「Project」をクリック
2. GitHubリポジトリから「komotegawa-edore/tokokanri-naseva」を選択
3. 「Import」をクリック

### 3.2 プロジェクト設定

**Project Name:**
- `tokokanri-naseva`（デフォルトのまま）

**Framework Preset:**
- `Other`（自動検出されない場合）

**Root Directory:**
- `./`（デフォルトのまま）

**Build and Output Settings:**
- Build Command: （空欄のまま）
- Output Directory: （空欄のまま）
- Install Command: `npm install`

---

## ステップ4: 環境変数の設定

### 4.1 環境変数を追加

「Environment Variables」セクションで、以下の環境変数を追加します。

#### 必須の環境変数

| 変数名 | 値 | 備考 |
|-------|-----|------|
| `NODE_ENV` | `production` | 本番環境 |
| `LINE_CHANNEL_ACCESS_TOKEN` | （LINEで取得したトークン） | LINE Bot設定 |
| `LINE_CHANNEL_SECRET` | （LINEで取得したシークレット） | LINE Bot設定 |
| `SUPABASE_URL` | （SupabaseのURL） | Supabase設定 |
| `SUPABASE_SERVICE_ROLE_KEY` | （Supabaseのキー） | Supabase設定 |
| `GOOGLE_SHEETS_CREDENTIALS` | （JSONを1行にしたもの） | Google Sheets設定 |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | （スプレッドシートID） | Google Sheets設定 |
| `ATTENDANCE_SHEET_NAME` | `出席記録` | シート名 |
| `TZ` | `Asia/Tokyo` | タイムゾーン |

#### オプションの環境変数

| 変数名 | 値 | 備考 |
|-------|-----|------|
| `OPENAI_API_KEY` | （OpenAI APIキー） | AI先生機能（Phase 4） |
| `ANTHROPIC_API_KEY` | （AnthropicのAPIキー） | AI先生機能（Phase 4） |

### 4.2 環境変数の入力方法

1. 「Name」に変数名を入力
2. 「Value」に値を入力
3. Environment: `Production`, `Preview`, `Development` すべてにチェック
4. 「Add」をクリック
5. すべての環境変数を追加

**重要**: `GOOGLE_SHEETS_CREDENTIALS`は、JSONファイルの中身を**改行なしの1行**にして貼り付けてください。

---

## ステップ5: デプロイ

### 5.1 初回デプロイ

1. すべての設定を確認
2. 「Deploy」をクリック
3. デプロイが開始されます（1-3分）

### 5.2 デプロイ完了

デプロイが成功すると、以下のようなURLが発行されます：

```
https://tokokanri-naseva.vercel.app
```

または

```
https://tokokanri-naseva-xxxxx.vercel.app
```

このURLをメモしてください。

---

## ステップ6: LINE Bot Webhook URLの更新

### 6.1 Webhook URLを設定

1. [LINE Developers](https://developers.line.biz/)にアクセス
2. 該当のチャネルを選択
3. 「Messaging API設定」タブ
4. 「Webhook URL」を更新:
   ```
   https://tokokanri-naseva.vercel.app/webhook
   ```
   （実際のURLに置き換えてください）

5. 「検証」をクリック → 成功すればOK
6. 「Webhookの利用」を **オン** にする

---

## ステップ7: 動作確認

### 7.1 ヘルスチェック

ブラウザで以下のURLにアクセス：

```
https://tokokanri-naseva.vercel.app/
```

以下のようなレスポンスが返ればOK:

```json
{
  "status": "OK",
  "message": "学習塾登校管理システム",
  "timestamp": "2025-11-06T12:00:00.000Z"
}
```

### 7.2 LINE Botのテスト

1. LINEで友だち追加（まだの場合）
2. 「登校」をタップ
3. 教室を選択
4. 座席番号を選択
5. 成功メッセージが表示されるか確認
6. Google Sheetsにデータが記録されているか確認

---

## ステップ8: 自動デプロイの設定（完了）

GitHubにプッシュすると、自動的にVercelにデプロイされます。

```bash
# コードを修正
git add .
git commit -m "Update feature"
git push

# Vercelが自動的にデプロイ開始
```

---

## Vercelの制限事項

### 無料プランの制限

- **実行時間**: 最大10秒/リクエスト
- **デプロイ数**: 100回/日
- **帯域幅**: 100GB/月
- **サーバーレス関数**: 最大12個

### 注意点

1. **セッションクリーンアップ**
   - ローカルのsetInterval()は動作しません
   - 期限切れセッションのクリーンアップは、cron jobやVercel Cronを使用してください

2. **コールドスタート**
   - 初回リクエスト時に起動時間がかかる場合があります（1-2秒）
   - 頻繁にアクセスがあれば影響は少ないです

3. **環境変数の変更**
   - 環境変数を変更した場合、再デプロイが必要です
   - Vercelダッシュボード → Settings → Environment Variables

---

## トラブルシューティング

### Q: デプロイに失敗する

**A:** Vercelのログを確認してください。

1. Vercelダッシュボード → Deployments
2. 失敗したデプロイをクリック
3. Build Logsを確認

よくあるエラー:
- 環境変数が設定されていない
- package.jsonの依存関係が不足

### Q: Webhookが動作しない

**A:** 以下を確認:

1. Webhook URLが正しく設定されているか
2. LINE Developersで「Webhookの利用」が **オン** か
3. Vercelのログでエラーが出ていないか確認:
   - Vercelダッシュボード → Deployments → Runtime Logs

### Q: Google Sheetsに書き込めない

**A:**

1. 環境変数 `GOOGLE_SHEETS_CREDENTIALS` が正しく設定されているか確認
2. サービスアカウントのメールアドレスをスプレッドシートに共有しているか確認
3. Vercelのログでエラーメッセージを確認

### Q: Supabaseに接続できない

**A:**

1. `SUPABASE_SERVICE_ROLE_KEY` が設定されているか確認（anonキーではない）
2. Supabaseのテーブルが作成されているか確認
3. Vercelのログでエラーメッセージを確認

---

## カスタムドメインの設定（オプション）

### カスタムドメインを追加

1. Vercelダッシュボード → Settings → Domains
2. 「Add Domain」をクリック
3. ドメイン名を入力（例: `tokokanri.your-domain.com`）
4. DNSレコードを設定（Vercelが指示を表示）

DNS設定例:
```
Type: CNAME
Name: tokokanri
Value: cname.vercel-dns.com
```

---

## ログの確認方法

### リアルタイムログ

1. Vercelダッシュボード → Deployments
2. 該当のデプロイをクリック
3. 「Runtime Logs」タブ

### Vercel CLIでログ確認

```bash
# Vercel CLIをインストール
npm i -g vercel

# ログインorcelログインログイン
vercel login

# ログを表示
vercel logs
```

---

## Vercel Cronの設定（オプション）

期限切れセッションの削除を定期実行する場合:

### vercel.json に追加

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-sessions",
      "schedule": "0 * * * *"
    }
  ]
}
```

### api/cron/cleanup-sessions.js を作成

```javascript
const sessionRepository = require('../../src/repositories/sessionRepository');

module.exports = async (req, res) => {
  try {
    await sessionRepository.cleanupExpiredSessions();
    res.status(200).json({ message: 'Sessions cleaned up' });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: error.message });
  }
};
```

---

## 次のステップ

✅ Vercelへのデプロイ完了
✅ LINE Bot Webhook URL更新完了
✅ 動作確認完了

次は:
1. リッチメニュー画像の作成（`assets/richmenu/README.md`参照）
2. リッチメニューの登録（ローカルから実行）
3. 生徒に友だち追加してもらう
4. Phase 2の機能追加（ランキング表示など）

---

## 参考リンク

- [Vercel公式ドキュメント](https://vercel.com/docs)
- [Vercel Node.js Runtime](https://vercel.com/docs/runtimes#official-runtimes/node-js)
- [Vercel環境変数](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
