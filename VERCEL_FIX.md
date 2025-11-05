# Vercelデプロイエラーの修正

## 修正内容

以下の変更を行いました：

### 1. ビルド時の環境変数チェックを緩和

**修正ファイル:**
- `src/config/googleSheets.js`
- `src/config/supabase.js`

**内容:**
- ビルド時に環境変数が無くてもエラーで終了しないように変更
- ダミー値を使用してビルドを通過させる
- 実行時には正しい環境変数が必要

### 2. vercel.jsonの最適化

**変更内容:**
- `builds`と`routes`を`rewrites`に変更（推奨設定）
- よりシンプルで堅牢な設定に変更

### 3. api/index.jsの改善

**追加機能:**
- デバッグログの追加
- エラーハンドリングの改善
- 環境変数の読み込み最適化

### 4. package.jsonの修正

**変更内容:**
- `main`フィールドを`api/index.js`に変更

## デプロイ手順

### ステップ1: 変更をコミット

```bash
git add .
git commit -m "Fix Vercel deployment issues"
git push -u origin main
```

### ステップ2: Vercelで環境変数を設定

**重要**: デプロイ前に以下の環境変数を必ず設定してください。

Vercelダッシュボード → Settings → Environment Variables

| 変数名 | 値 | 必須 |
|-------|-----|------|
| `NODE_ENV` | `production` | ✅ |
| `LINE_CHANNEL_ACCESS_TOKEN` | （LINEで取得） | ✅ |
| `LINE_CHANNEL_SECRET` | （LINEで取得） | ✅ |
| `SUPABASE_URL` | （Supabaseで取得） | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | （Supabaseで取得） | ✅ |
| `GOOGLE_SHEETS_CREDENTIALS` | （JSONを1行に） | ✅ |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | （スプレッドシートID） | ✅ |
| `ATTENDANCE_SHEET_NAME` | `出席記録` | ✅ |
| `TZ` | `Asia/Tokyo` | 推奨 |

**GOOGLE_SHEETS_CREDENTIALSの設定方法:**

1. サービスアカウントのJSONファイルをコピー
2. 改行を削除して1行にする
3. Vercelに貼り付け

例:
```
{"type":"service_account","project_id":"your-project",...}
```

### ステップ3: 再デプロイ

環境変数を設定したら、Vercelで再デプロイします。

**方法1: 自動デプロイ（推奨）**
- GitHubにプッシュすると自動的に再デプロイされます

**方法2: 手動デプロイ**
1. Vercelダッシュボード → Deployments
2. 最新のデプロイの「...」メニュー → Redeploy

### ステップ4: デプロイログの確認

1. Vercelダッシュボード → Deployments
2. 最新のデプロイをクリック
3. 「Building」または「Runtime Logs」でログを確認

**成功の確認:**
```
✓ Vercel Function starting...
✓ NODE_ENV: production
✓ Express app loaded successfully
```

## トラブルシューティング

### エラー: Build failed

**原因:** 依存関係のインストールエラー

**解決策:**
```bash
# ローカルで依存関係を確認
npm install

# package-lock.jsonをコミット
git add package-lock.json
git commit -m "Add package-lock.json"
git push
```

### エラー: Function invocation failed

**原因:** 環境変数が設定されていない

**解決策:**
1. Vercelダッシュボード → Settings → Environment Variables
2. すべての必須環境変数を設定
3. 再デプロイ

### エラー: GOOGLE_SHEETS_CREDENTIALS parse error

**原因:** JSONが正しくフォーマットされていない

**解決策:**
1. JSONファイルを開く
2. すべての改行を削除
3. 1行の文字列にする
4. Vercelで再設定

### ログの確認方法

**Vercelダッシュボード:**
1. Deployments → 該当のデプロイ
2. Runtime Logs タブ

**Vercel CLI:**
```bash
npm i -g vercel
vercel login
vercel logs
```

## よくある質問

### Q: 環境変数を設定したのにエラーが出る

**A:** 環境変数を設定した後、必ず再デプロイしてください。
- Vercelダッシュボード → Deployments → Redeploy

### Q: ビルドは成功するが、実行時にエラーが出る

**A:** Runtime Logsでエラーメッセージを確認してください。
- 環境変数の値が正しいか確認
- Google Sheetsのサービスアカウントがスプレッドシートに共有されているか確認

### Q: Cron Jobが動作しない

**A:** Vercel Cronは有料プラン（Pro以上）で利用可能です。
- 無料プランでは使用できません
- 代替案: 外部のcronサービス（cron-job.orgなど）を使用

## 次のステップ

デプロイが成功したら:

1. **ヘルスチェック**
   ```
   https://your-app.vercel.app/
   ```
   → `{"status":"OK",...}`が返ればOK

2. **LINE Webhook URL更新**
   - LINE Developers → Webhook URL
   - `https://your-app.vercel.app/webhook`

3. **動作テスト**
   - LINEで「登校」をタップ
   - 正常に動作するか確認

## 参考リンク

- [Vercel公式ドキュメント](https://vercel.com/docs)
- [Vercelトラブルシューティング](https://vercel.com/docs/errors)
- [Vercel環境変数](https://vercel.com/docs/concepts/projects/environment-variables)
