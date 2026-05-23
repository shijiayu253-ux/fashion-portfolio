-- ============================================
-- 澧為噺杩佺Щ锛氱粰宸叉湁 projects 琛ㄥ姞 type + tags
-- 鍦?Supabase SQL Editor 鎵ц锛堜笉浼氬奖鍝嶅凡鏈夋暟鎹級
-- ============================================
ALTER TABLE projects ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'project' CHECK (type IN ('project','sketch'));
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tags TEXT DEFAULT '';
