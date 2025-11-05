-- 学習塾登校管理アプリ - Supabaseテーブル定義

-- ==========================================
-- 1. ユーザーテーブル
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    line_user_id VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    parent_email VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックス
CREATE INDEX idx_users_line_user_id ON users(line_user_id);
CREATE INDEX idx_users_parent_email ON users(parent_email);

-- RLS (Row Level Security) 設定
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- サービスロールのみ全権限
CREATE POLICY "Service role can do everything on users"
ON users FOR ALL
TO service_role
USING (true);

-- ==========================================
-- 2. 教室マスタテーブル
-- ==========================================
CREATE TABLE IF NOT EXISTS classrooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_order INTEGER NOT NULL,
    seat_range_start INTEGER NOT NULL,
    seat_range_end INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックス
CREATE INDEX idx_classrooms_display_order ON classrooms(display_order);

-- 初期データ投入
INSERT INTO classrooms (name, display_order, seat_range_start, seat_range_end) VALUES
('A教室', 1, 1, 20),
('B教室', 2, 21, 40),
('C教室', 3, 41, 60)
ON CONFLICT (name) DO NOTHING;

-- RLS設定
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read classrooms"
ON classrooms FOR SELECT
USING (is_active = TRUE);

CREATE POLICY "Service role can do everything on classrooms"
ON classrooms FOR ALL
TO service_role
USING (true);

-- ==========================================
-- 3. Webhookログテーブル
-- ==========================================
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    line_user_id VARCHAR(255),
    payload JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'received',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックス
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
CREATE INDEX idx_webhook_logs_line_user_id ON webhook_logs(line_user_id);
CREATE INDEX idx_webhook_logs_event_type ON webhook_logs(event_type);

-- RLS設定
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can do everything on webhook_logs"
ON webhook_logs FOR ALL
TO service_role
USING (true);

-- ==========================================
-- 4. ユーザーセッションテーブル（状態管理用）
-- ==========================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    line_user_id VARCHAR(255) NOT NULL,
    session_type VARCHAR(50) NOT NULL, -- 'checkin', 'checkout', 'view_history'
    current_step VARCHAR(50), -- 'select_classroom', 'select_seat'
    session_data JSONB, -- 選択中のデータを保存（教室など）
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックス
CREATE INDEX idx_user_sessions_line_user_id ON user_sessions(line_user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- 期限切れセッション削除用関数
CREATE OR REPLACE FUNCTION delete_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM user_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- RLS設定
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can do everything on user_sessions"
ON user_sessions FOR ALL
TO service_role
USING (true);

-- ==========================================
-- 5. AI質問履歴テーブル（オプション）
-- ==========================================
CREATE TABLE IF NOT EXISTS ai_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    line_user_id VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    ai_response TEXT,
    model_used VARCHAR(50), -- 'gpt-4', 'claude-3-opus'など
    token_usage INTEGER,
    notified_to_teacher BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックス
CREATE INDEX idx_ai_questions_line_user_id ON ai_questions(line_user_id);
CREATE INDEX idx_ai_questions_created_at ON ai_questions(created_at DESC);
CREATE INDEX idx_ai_questions_notified ON ai_questions(notified_to_teacher);

-- RLS設定
ALTER TABLE ai_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can do everything on ai_questions"
ON ai_questions FOR ALL
TO service_role
USING (true);

-- ==========================================
-- 6. 更新日時自動更新トリガー
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- usersテーブルにトリガー適用
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- user_sessionsテーブルにトリガー適用
CREATE TRIGGER update_user_sessions_updated_at
BEFORE UPDATE ON user_sessions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 7. ビュー作成（便利な集計用）
-- ==========================================

-- アクティブユーザー一覧ビュー
CREATE OR REPLACE VIEW active_users_view AS
SELECT
    u.id,
    u.line_user_id,
    u.display_name,
    u.parent_email,
    u.created_at
FROM users u
WHERE u.is_active = TRUE
ORDER BY u.created_at DESC;

-- ==========================================
-- 完了メッセージ
-- ==========================================
-- スキーマ作成完了
-- 次のステップ: Supabaseダッシュボードでこのスクリプトを実行してください
