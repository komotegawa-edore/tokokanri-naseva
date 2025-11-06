-- ==========================================
-- パフォーマンス改善: 外部キーにインデックスを追加
-- ==========================================

-- ai_questionsテーブルのuser_id外部キーにインデックスを追加
CREATE INDEX IF NOT EXISTS idx_ai_questions_user_id ON ai_questions(user_id);
