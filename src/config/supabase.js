require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Supabase設定
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn('⚠️  Supabase環境変数が設定されていません');
  // Vercelビルド時はエラーにしない
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    console.error('❌ Supabase環境変数が必要です');
    process.exit(1);
  }
}

// Supabaseクライアント作成（サービスロールキーを使用）
const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceRoleKey || 'placeholder-key'
);

module.exports = supabase;
