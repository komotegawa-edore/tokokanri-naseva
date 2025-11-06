-- ユーザー登録フィールドの追加
-- フルネームと学年の情報を追加

-- ==========================================
-- 1. usersテーブルにカラム追加
-- ==========================================

-- フルネーム（必須）
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

-- 学年（中学生、高１、高２、高３、既卒生）
ALTER TABLE users ADD COLUMN IF NOT EXISTS grade VARCHAR(50);

-- 登録完了フラグ
ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_completed BOOLEAN DEFAULT FALSE;

-- ==========================================
-- 2. インデックス追加
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_users_registration_completed ON users(registration_completed);
CREATE INDEX IF NOT EXISTS idx_users_grade ON users(grade);

-- ==========================================
-- 3. コメント追加
-- ==========================================

COMMENT ON COLUMN users.full_name IS '生徒のフルネーム（初回登録時に入力）';
COMMENT ON COLUMN users.grade IS '学年（中学生/高１/高２/高３/既卒生）';
COMMENT ON COLUMN users.registration_completed IS '初回登録が完了しているかどうか';

-- ==========================================
-- 完了メッセージ
-- ==========================================
-- マイグレーション完了
-- Supabaseダッシュボードでこのスクリプトを実行してください
