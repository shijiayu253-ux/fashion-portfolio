-- ============================================
-- Fashion Portfolio 路 Supabase 鏁版嵁搴撳垵濮嬪寲
-- 鏀寔锛氱郴鍒?project) + 鍗曞紶璁捐绋?sketch)
-- 鍦?Supabase SQL Editor 閲岀矘璐存墽琛?-- ============================================

-- 1. 浣滃搧琛紙閫氱敤锛岀敤 type 鍖哄垎绯诲垪鍜屽崟绋匡級
CREATE TABLE projects (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'project' CHECK (type IN ('project','sketch')),
  category TEXT DEFAULT '',
  description TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  thumbnail_url TEXT DEFAULT '',
  tags TEXT DEFAULT '',      -- 閫楀彿鍒嗛殧锛屽 "鎵嬬粯,鏄ュ瀛?绀兼湇"
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 涓汉璧勬枡琛紙鍙瓨涓€琛岋級
CREATE TABLE profile (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name TEXT NOT NULL DEFAULT '浣犵殑鍚嶅瓧',
  name_en TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  bio_en TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  contact_email TEXT DEFAULT '',
  contact_wechat TEXT DEFAULT '',
  contact_xiaohongshu TEXT DEFAULT '',
  contact_instagram TEXT DEFAULT '',
  hero_title TEXT DEFAULT 'FASHION PORTFOLIO',
  hero_subtitle TEXT DEFAULT ''
);

INSERT INTO profile (id) VALUES (1) ON CONFLICT DO NOTHING;

-- 3. 瀛樺偍妗讹紙鍥剧墖锛?INSERT INTO storage.buckets (id, name, public) 
VALUES ('portfolio', 'portfolio', true)
ON CONFLICT (id) DO NOTHING;

-- 4. 鏉冮檺锛氫换浣曚汉閮借兘鐪?CREATE POLICY "public_read" ON projects FOR SELECT USING (true);
CREATE POLICY "public_read_profile" ON profile FOR SELECT USING (true);
CREATE POLICY "public_read_storage" ON storage.objects FOR SELECT 
  USING (bucket_id = 'portfolio');

-- 5. 鏉冮檺锛氬彧鏈夌櫥褰曠敤鎴疯兘鏀?CREATE POLICY "auth_all_projects" ON projects FOR ALL 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "auth_all_profile" ON profile FOR ALL 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "auth_insert_storage" ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'portfolio' AND auth.role() = 'authenticated');

CREATE POLICY "auth_update_storage" ON storage.objects FOR UPDATE
  USING (bucket_id = 'portfolio' AND auth.role() = 'authenticated');

CREATE POLICY "auth_delete_storage" ON storage.objects FOR DELETE
  USING (bucket_id = 'portfolio' AND auth.role() = 'authenticated');

-- 6. 鍚敤 RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile ENABLE ROW LEVEL SECURITY;
