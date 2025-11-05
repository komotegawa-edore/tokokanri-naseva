# デプロイ方法

学習塾登校管理アプリをデプロイする方法を説明します。

## デプロイ先の選択

以下のプラットフォームにデプロイできます：

| プラットフォーム | 難易度 | コスト | 推奨度 | ガイド |
|---------------|-------|--------|--------|--------|
| **Vercel** | 簡単 | 無料 | ⭐⭐⭐⭐⭐ | `VERCEL_DEPLOY_GUIDE.md` |
| Heroku | 中級 | $7/月〜 | ⭐⭐⭐ | （別途作成） |
| Google Cloud Run | 中級 | 従量課金 | ⭐⭐⭐⭐ | （別途作成） |
| AWS | 上級 | 従量課金 | ⭐⭐ | （別途作成） |
| VPS | 上級 | $5/月〜 | ⭐⭐ | （別途作成） |

## 推奨: Vercel（無料）

Vercelは以下の理由で最も推奨されます：

✅ **完全無料**（無料プランで十分）
✅ **セットアップが簡単**（5分で完了）
✅ **GitHubと自動連携**（プッシュで自動デプロイ）
✅ **HTTPS対応**（自動でSSL証明書発行）
✅ **高速**（世界中にCDN配信）
✅ **スケーラブル**（自動スケーリング）

### Vercelへのデプロイ手順

詳細は `VERCEL_DEPLOY_GUIDE.md` を参照してください。

**クイックスタート:**

1. **GitHubにプッシュ**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push -u origin main
   ```

2. **Vercelにサインアップ**
   - [Vercel](https://vercel.com/)にアクセス
   - GitHubアカウントで認証

3. **プロジェクトをインポート**
   - 「Add New Project」をクリック
   - `komotegawa-edore/tokokanri-naseva`を選択
   - 「Import」をクリック

4. **環境変数を設定**
   - LINE Bot設定
   - Supabase設定
   - Google Sheets設定

5. **デプロイ**
   - 「Deploy」をクリック
   - 完了！

6. **Webhook URLを更新**
   - LINE Developers → Webhook URL
   - `https://your-app.vercel.app/webhook`

---

## 他のプラットフォーム

### Heroku

**特徴:**
- 老舗のPaaS
- Dyno（コンテナ）単位で課金
- アドオンが豊富

**コスト:**
- Eco Dyno: $5/月
- Basic Dyno: $7/月

**手順:**
1. Heroku CLIをインストール
2. `heroku create`
3. 環境変数を設定
4. `git push heroku main`

### Google Cloud Run

**特徴:**
- Googleが提供するサーバーレス
- コンテナベース
- 従量課金

**コスト:**
- 無料枠: 月2百万リクエスト
- 超過分: リクエスト数に応じて課金

**手順:**
1. Dockerfileを作成
2. Google Cloud Buildでビルド
3. Cloud Runにデプロイ

### AWS (Elastic Beanstalk)

**特徴:**
- AWSの自動スケーリング環境
- 柔軟な設定
- 複雑

**コスト:**
- EC2 t2.micro: 月$10程度
- 従量課金

### VPS (DigitalOcean, Linode等)

**特徴:**
- フルコントロール
- サーバー管理が必要
- 上級者向け

**コスト:**
- 月$5〜$10

---

## デプロイ後の確認事項

### ✅ 必須チェックリスト

- [ ] ヘルスチェックが通る（`https://your-app/`にアクセス）
- [ ] Webhook URLが更新されている
- [ ] 環境変数がすべて設定されている
- [ ] LINE Botからのテストメッセージが届く
- [ ] 登校・下校記録が正常に動作する
- [ ] Google Sheetsにデータが記録される
- [ ] Supabaseに接続できる

### ✅ セキュリティチェック

- [ ] `.env`ファイルがGitにコミットされていない
- [ ] 環境変数がデプロイ先で設定されている
- [ ] Google SheetsのサービスアカウントJSONが安全に管理されている
- [ ] LINE署名検証が有効になっている

### ✅ パフォーマンスチェック

- [ ] レスポンス時間が5秒以内
- [ ] 同時アクセスに耐えられる

---

## トラブルシューティング

### デプロイに失敗する

**原因:**
- ビルドエラー
- 依存関係の不足

**解決策:**
- ログを確認
- `package.json`の依存関係を確認
- Node.jsバージョンを確認（18以上）

### Webhookが動作しない

**原因:**
- Webhook URLが間違っている
- 環境変数が設定されていない
- LINE署名検証エラー

**解決策:**
- Webhook URLを確認
- 環境変数を確認
- ログでエラーメッセージを確認

### Google Sheetsに書き込めない

**原因:**
- サービスアカウントが共有されていない
- 環境変数が間違っている

**解決策:**
- スプレッドシートの共有設定を確認
- `GOOGLE_SHEETS_CREDENTIALS`を確認（1行になっているか）

---

## 監視とログ

### Vercel

- Vercelダッシュボード → Deployments → Runtime Logs

### Heroku

```bash
heroku logs --tail
```

### Google Cloud Run

```bash
gcloud logging read
```

---

## 自動デプロイ（CI/CD）

### GitHub Actions（オプション）

`.github/workflows/deploy.yml`を作成して、自動デプロイを設定できます。

Vercelの場合は、GitHubと自動連携されているため、不要です。

---

## スケーリング

### 想定トラフィック

- 生徒数: 100人
- 1日あたりのアクセス: 200-400リクエスト
- ピーク時: 同時10-20リクエスト

### 推奨構成

**100人以下:**
- Vercel無料プラン

**100-500人:**
- Vercel Pro（$20/月）
- または Google Cloud Run

**500人以上:**
- Google Cloud Run
- または AWS Elastic Beanstalk

---

## バックアップ

### Google Sheets

- 自動的にバージョン履歴が保存されます
- 定期的にエクスポート推奨

### Supabase

- Supabaseの自動バックアップ機能を使用
- 手動バックアップも推奨

---

## 次のステップ

デプロイ完了後：

1. リッチメニュー画像の作成
2. リッチメニューの登録
3. 生徒への周知
4. 運用開始

---

## 参考リンク

- [Vercelデプロイガイド](./VERCEL_DEPLOY_GUIDE.md)
- [セットアップガイド](./SETUP_GUIDE.md)
- [README](./README.md)
