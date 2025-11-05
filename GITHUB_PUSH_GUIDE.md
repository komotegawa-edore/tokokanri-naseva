# GitHubへのプッシュ手順

コードは既にコミットされていますが、GitHubへのプッシュには認証が必要です。

## 現在の状態

✅ Gitリポジトリの初期化完了
✅ 初回コミット完了 (517b2e7)
✅ リモートリポジトリ設定完了
❌ プッシュ待ち

## プッシュ方法

### 方法1: GitHub CLIを使う（推奨）

GitHub CLIがインストールされている場合、最も簡単です。

```bash
# GitHub CLIで認証
gh auth login

# プッシュ
git push -u origin main
```

### 方法2: Personal Access Token (PAT) を使う

1. **Personal Access Tokenを作成**
   - [GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)](https://github.com/settings/tokens)
   - 「Generate new token」→「Generate new token (classic)」
   - Note: `tokokanri-naseva`
   - Expiration: 90 days（お好みで）
   - Select scopes: `repo`（すべてにチェック）
   - 「Generate token」をクリック
   - トークンをコピー（画面を閉じると再表示できません）

2. **認証情報を保存してプッシュ**

```bash
# 認証情報マネージャーを設定
git config credential.helper osxkeychain

# プッシュ（ユーザー名とトークンの入力を求められます）
git push -u origin main

# ユーザー名: komotegawa-edore
# パスワード: （Personal Access Tokenを貼り付け）
```

### 方法3: macOSキーチェーンをクリアしてから認証

```bash
# macOSキーチェーンから古い認証情報を削除
git credential-osxkeychain erase
host=github.com
protocol=https
^D  # Ctrl+D を押す

# プッシュ（ユーザー名とパスワードの入力を求められます）
git push -u origin main

# ユーザー名: komotegawa-edore
# パスワード: （Personal Access Tokenまたはパスワード）
```

### 方法4: SSH鍵を再設定する

1. **新しいSSH鍵を生成**

```bash
# SSH鍵を生成（komotegawa-edoreアカウント用）
ssh-keygen -t ed25519 -C "k.omotegawa@edore-edu.com" -f ~/.ssh/id_ed25519_komotegawa

# SSH configを設定
cat >> ~/.ssh/config << EOF

Host github.com-komotegawa
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_komotegawa
EOF
```

2. **公開鍵をGitHubに登録**

```bash
# 公開鍵をクリップボードにコピー
pbcopy < ~/.ssh/id_ed25519_komotegawa.pub

# GitHubの設定ページで登録
# https://github.com/settings/keys
# 「New SSH key」→ タイトルと公開鍵を貼り付け
```

3. **リモートURLを変更してプッシュ**

```bash
git remote set-url origin git@github.com-komotegawa:komotegawa-edore/tokokanri-naseva.git
git push -u origin main
```

## トラブルシューティング

### エラー: 403 Permission denied

別のGitHubアカウントの認証情報がキャッシュされています。

**解決策:**
- macOSキーチェーンアプリを開く
- 「github.com」を検索
- 該当の項目を削除
- 再度プッシュを試す

### エラー: SSH permission denied

SSH鍵が別のアカウントに関連付けられています。

**解決策:**
- 方法4のSSH鍵再設定を実行
- または方法2のPersonal Access Tokenを使用

## 確認方法

プッシュが成功したら、以下のURLでリポジトリを確認できます：

https://github.com/komotegawa-edore/tokokanri-naseva

## 次のステップ

プッシュが完了したら：
1. GitHubリポジトリでコードを確認
2. README.mdが正しく表示されているか確認
3. .envファイルが含まれていないことを確認
4. セットアップガイドに従って外部サービスの設定を開始

## コミット情報

```
コミットハッシュ: 517b2e7
メッセージ: Initial commit: 学習塾登校管理アプリMVP実装
ファイル数: 37 files
挿入行数: 3763 insertions(+)
```
