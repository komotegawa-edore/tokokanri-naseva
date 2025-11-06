-- ==========================================
-- セキュリティアドバイザーの問題を修正
-- ==========================================

-- 1. active_users_viewを再作成（SECURITY DEFINERを削除）
DROP VIEW IF EXISTS active_users_view;

CREATE VIEW active_users_view AS
SELECT
    u.id,
    u.line_user_id,
    u.display_name,
    u.parent_email,
    u.created_at
FROM users u
WHERE u.is_active = TRUE
ORDER BY u.created_at DESC;

-- 2. delete_expired_sessions関数を修正（search_pathを設定）
CREATE OR REPLACE FUNCTION delete_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM user_sessions WHERE expires_at < NOW();
END;
$$;

-- 3. update_updated_at_column関数を修正（search_pathを設定）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;
