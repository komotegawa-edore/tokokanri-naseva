# 初回登録機能デプロイチェックリスト

初回登録機能（フルネーム・学年登録）を本番環境にデプロイする前の確認事項です。

## 1. データベースのマイグレーション

### Supabase

- [ ] Supabaseダッシュボードにログイン
- [ ] SQL Editorを開く
- [ ] `database/migrations/02_add_user_registration_fields.sql`の内容を実行
- [ ] 実行結果を確認:
  ```sql
  -- 確認クエリ
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'users'
  ORDER BY ordinal_position;
  ```
- [ ] `full_name`, `grade`, `registration_completed`列が追加されていることを確認

### Google Sheets

- [ ] `database/google_sheets_update_guide.md`を参照
- [ ] スプレッドシートのヘッダー行を更新:
  ```
  A: 登校時刻
  B: LINE表示名
  C: フルネーム
  D: 学年
  E: LINE ID
  F: 教室
  G: 座席番号
  H: 下校時刻
  I: 滞在時間（分）
  ```
- [ ] 既存データが残っているか確認

## 2. コードのデプロイ

### ローカルでの動作確認

- [ ] 構文チェック:
  ```bash
  node -c src/controllers/registrationController.js
  node -c src/repositories/userRepository.js
  node -c src/repositories/sessionRepository.js
  node -c src/controllers/webhookController.js
  ```

- [ ] ローカルサーバーを起動:
  ```bash
  npm run dev
  ```

- [ ] エラーがないことを確認

### Gitへのコミット

- [ ] 変更をステージング:
  ```bash
  git add .
  ```

- [ ] コミット:
  ```bash
  git commit -m "Add initial registration flow with full name and grade"
  ```

- [ ] プッシュ:
  ```bash
  git push origin main
  ```

### Vercelへのデプロイ

- [ ] Vercelが自動デプロイを開始したことを確認
- [ ] デプロイが成功したことを確認
- [ ] デプロイログにエラーがないか確認

## 3. 動作確認

### 新規ユーザーの登録フロー

1. [ ] 新しいLINEアカウントでBotを友だち追加
2. [ ] 初回登録メッセージが表示されることを確認
3. [ ] フルネームを入力
4. [ ] 学年選択のクイックリプライが表示されることを確認
5. [ ] 学年を選択
6. [ ] 登録完了メッセージが表示されることを確認
7. [ ] Supabaseの`users`テーブルを確認:
   - `full_name`が正しく記録されている
   - `grade`が正しく記録されている
   - `registration_completed`が`true`になっている

### 登校・下校フロー

1. [ ] 登校処理を実行
2. [ ] Google Sheetsを確認:
   - フルネームが記録されている（C列）
   - 学年が記録されている（D列）
3. [ ] 下校処理を実行
4. [ ] 下校時刻と滞在時間が正しい列（H列、I列）に記録されている

### 既存ユーザーの動作確認

1. [ ] 既存ユーザーでBotを操作
2. [ ] 登録フローが表示されないことを確認
3. [ ] 通常通り登校・下校ができることを確認

## 4. エラーハンドリングの確認

### 入力バリデーション

- [ ] フルネームに空白のみを入力→エラーメッセージが表示される
- [ ] フルネームに1文字のみを入力→エラーメッセージが表示される

### セッション管理

- [ ] 登録フロー中に別のアクションを実行→正しく処理される
- [ ] セッションが10分経過→期限切れメッセージが表示される

## 5. ロールバック手順（問題が発生した場合）

### コードのロールバック

```bash
# 前のコミットに戻す
git revert HEAD
git push origin main
```

### データベースのロールバック

Supabaseで以下を実行:

```sql
-- カラムを削除（データは失われます）
ALTER TABLE users DROP COLUMN IF EXISTS full_name;
ALTER TABLE users DROP COLUMN IF EXISTS grade;
ALTER TABLE users DROP COLUMN IF EXISTS registration_completed;
```

### Google Sheetsのロールバック

1. ファイル > 変更履歴 > 変更履歴を表示
2. 変更前のバージョンを選択
3. 「このバージョンを復元」をクリック

## 6. モニタリング

### 初日の確認事項

- [ ] Supabaseのログを確認
- [ ] Vercelのログを確認
- [ ] LINE Developersの統計を確認
- [ ] Google Sheetsのデータが正しく記録されているか確認

### 1週間後の確認事項

- [ ] 新規ユーザーの登録完了率を確認
- [ ] エラー率を確認
- [ ] ユーザーからのフィードバックを確認

## トラブルシューティング

### "registration_completed column does not exist"エラー

→ Supabaseのマイグレーションが実行されていません。手順1を確認してください。

### スプレッドシートに正しく記録されない

→ ヘッダー行が新フォーマットに更新されていません。手順1を確認してください。

### 既存ユーザーに登録フローが表示される

→ 既存ユーザーの`registration_completed`が`false`または`NULL`になっています。Supabaseで手動で`true`に設定してください。

## 完了

全ての項目にチェックを入れたら、デプロイ完了です！
