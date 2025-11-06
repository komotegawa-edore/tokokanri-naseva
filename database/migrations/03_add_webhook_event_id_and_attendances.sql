-- ==========================================
-- 1. webhook_logsテーブルにwebhook_event_idカラムを追加
-- ==========================================

-- webhook_event_idカラムを追加（重複検出用）
ALTER TABLE webhook_logs ADD COLUMN IF NOT EXISTS webhook_event_id VARCHAR(255);

-- ユニーク制約とインデックスを追加
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_logs_event_id ON webhook_logs(webhook_event_id) WHERE webhook_event_id IS NOT NULL;

-- ==========================================
-- 2. 登校・下校記録テーブル（attendances）を作成
-- ==========================================

CREATE TABLE IF NOT EXISTS attendances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    line_user_id VARCHAR(255) NOT NULL,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL,
    classroom_name VARCHAR(50),
    seat_number INTEGER,
    checkin_time TIMESTAMP WITH TIME ZONE NOT NULL,
    checkout_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックスの追加
CREATE INDEX IF NOT EXISTS idx_attendances_user_id ON attendances(user_id);
CREATE INDEX IF NOT EXISTS idx_attendances_line_user_id ON attendances(line_user_id);
CREATE INDEX IF NOT EXISTS idx_attendances_checkin_time ON attendances(checkin_time DESC);
CREATE INDEX IF NOT EXISTS idx_attendances_checkout_time ON attendances(checkout_time DESC);
CREATE INDEX IF NOT EXISTS idx_attendances_classroom_id ON attendances(classroom_id);

-- RLS設定
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can do everything on attendances"
ON attendances FOR ALL
TO service_role
USING (true);

-- 更新日時自動更新トリガー
CREATE TRIGGER update_attendances_updated_at
BEFORE UPDATE ON attendances
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 3. user_sessionsテーブルのインデックス最適化
-- ==========================================

-- 複合インデックスを追加（line_user_id + session_type）
CREATE INDEX IF NOT EXISTS idx_user_sessions_line_user_session_type
ON user_sessions(line_user_id, session_type);

-- ==========================================
-- 4. コメント追加
-- ==========================================

COMMENT ON COLUMN webhook_logs.webhook_event_id IS 'LINE Webhookイベントの一意ID（重複検出用）';
COMMENT ON TABLE attendances IS '登校・下校記録テーブル';
COMMENT ON COLUMN attendances.user_id IS 'ユーザーID（外部キー）';
COMMENT ON COLUMN attendances.line_user_id IS 'LINE User ID';
COMMENT ON COLUMN attendances.classroom_id IS '教室ID（外部キー、削除されたらNULL）';
COMMENT ON COLUMN attendances.classroom_name IS '教室名（スナップショット）';
COMMENT ON COLUMN attendances.seat_number IS '座席番号';
COMMENT ON COLUMN attendances.checkin_time IS '登校時刻（JST）';
COMMENT ON COLUMN attendances.checkout_time IS '下校時刻（JST、未下校ならNULL）';
COMMENT ON COLUMN attendances.duration_minutes IS '滞在時間（分）';
