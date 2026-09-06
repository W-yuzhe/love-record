-- 恋爱记录网站 Supabase Schema（幂等版本）
-- 可以重复执行，不会报 "relation already exists" 等错误

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 用户资料表
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nickname TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 情侣配对表
CREATE TABLE IF NOT EXISTS couples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_a_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  partner_b_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  couple_name TEXT,
  invite_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(partner_a_id),
  UNIQUE(partner_b_id)
);

-- 3. 记忆主表
CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  mood TEXT,
  weather TEXT,
  visibility TEXT NOT NULL DEFAULT 'couple' CHECK (visibility IN ('private','couple','public')),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 记忆地点表
CREATE TABLE IF NOT EXISTS memory_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  district TEXT,
  city TEXT,
  sort_order INTEGER DEFAULT 0
);

-- 5. 记忆媒体表
CREATE TABLE IF NOT EXISTS memory_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'image' CHECK (type IN ('image','video','audio')),
  sort_order INTEGER DEFAULT 0,
  note TEXT,
  likes INTEGER DEFAULT 0,
  is_cover BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 为已存在的 memory_media 表追加新字段（幂等）
ALTER TABLE memory_media
ADD COLUMN IF NOT EXISTS note TEXT,
ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_cover BOOLEAN DEFAULT FALSE;

-- 6. 记忆标签/分类表
CREATE TABLE IF NOT EXISTS memory_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  UNIQUE(memory_id, tag)
);

-- 7. 记忆协作表（双人视角）
CREATE TABLE IF NOT EXISTS memory_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  is_finished BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(memory_id, user_id)
);

-- 8. 心愿清单表
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('travel','food','life','growth','other')),
  description TEXT,
  is_achieved BOOLEAN DEFAULT FALSE,
  achieved_date DATE,
  related_memory_id UUID REFERENCES memories(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. 足迹城市表
CREATE TABLE IF NOT EXISTS footprint_cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  visit_count INTEGER DEFAULT 0,
  memory_count INTEGER DEFAULT 0,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  UNIQUE(couple_id, name)
);

-- 为已存在的 footprint_cities 表追加 Trip memory 字段（幂等）
ALTER TABLE footprint_cities
ADD COLUMN IF NOT EXISTS has_memory BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS memory_note TEXT,
ADD COLUMN IF NOT EXISTS memory_media JSONB DEFAULT '[]'::jsonb;

-- 10. 每日问答表
CREATE TABLE IF NOT EXISTS daily_qa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  partner_a_answer TEXT,
  partner_b_answer TEXT,
  date DATE NOT NULL,
  UNIQUE(couple_id, date)
);

-- 11. 星空便签表
CREATE TABLE IF NOT EXISTS stardust_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author TEXT,
  x DOUBLE PRECISION NOT NULL DEFAULT 50,
  y DOUBLE PRECISION NOT NULL DEFAULT 50,
  color TEXT DEFAULT '#FFB8D0',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 策略（先删除再重建，保证幂等）
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE footprint_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_qa ENABLE ROW LEVEL SECURITY;
ALTER TABLE stardust_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_profile" ON profiles;
CREATE POLICY "own_profile" ON profiles
  FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "own_couple" ON couples;
CREATE POLICY "own_couple" ON couples
  FOR ALL USING (auth.uid() = partner_a_id OR auth.uid() = partner_b_id);

DROP POLICY IF EXISTS "own_memories" ON memories;
CREATE POLICY "own_memories" ON memories
  FOR ALL USING (
    created_by = auth.uid() OR
    couple_id IN (SELECT id FROM couples WHERE partner_a_id = auth.uid() OR partner_b_id = auth.uid())
  );

DROP POLICY IF EXISTS "own_memory_locations" ON memory_locations;
CREATE POLICY "own_memory_locations" ON memory_locations
  FOR ALL USING (memory_id IN (SELECT id FROM memories WHERE created_by = auth.uid()));

DROP POLICY IF EXISTS "own_memory_media" ON memory_media;
CREATE POLICY "own_memory_media" ON memory_media
  FOR ALL USING (memory_id IN (SELECT id FROM memories WHERE created_by = auth.uid()));

DROP POLICY IF EXISTS "own_memory_tags" ON memory_tags;
CREATE POLICY "own_memory_tags" ON memory_tags
  FOR ALL USING (memory_id IN (SELECT id FROM memories WHERE created_by = auth.uid()));

DROP POLICY IF EXISTS "own_memory_collaborators" ON memory_collaborators;
CREATE POLICY "own_memory_collaborators" ON memory_collaborators
  FOR ALL USING (
    user_id = auth.uid() OR
    memory_id IN (SELECT id FROM memories WHERE couple_id IN (
      SELECT id FROM couples WHERE partner_a_id = auth.uid() OR partner_b_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS "own_wishlists" ON wishlists;
CREATE POLICY "own_wishlists" ON wishlists
  FOR ALL USING (
    couple_id IN (SELECT id FROM couples WHERE partner_a_id = auth.uid() OR partner_b_id = auth.uid())
  );

DROP POLICY IF EXISTS "own_footprint_cities" ON footprint_cities;
CREATE POLICY "own_footprint_cities" ON footprint_cities
  FOR ALL USING (
    couple_id IN (SELECT id FROM couples WHERE partner_a_id = auth.uid() OR partner_b_id = auth.uid())
  );

DROP POLICY IF EXISTS "own_daily_qa" ON daily_qa;
CREATE POLICY "own_daily_qa" ON daily_qa
  FOR ALL USING (
    couple_id IN (SELECT id FROM couples WHERE partner_a_id = auth.uid() OR partner_b_id = auth.uid())
  );

DROP POLICY IF EXISTS "own_stardust_notes" ON stardust_notes;
CREATE POLICY "own_stardust_notes" ON stardust_notes
  FOR ALL USING (
    couple_id IN (SELECT id FROM couples WHERE partner_a_id = auth.uid() OR partner_b_id = auth.uid())
  );

-- 触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_memories_updated_at ON memories;
CREATE TRIGGER update_memories_updated_at
BEFORE UPDATE ON memories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. 存储桶：记忆照片
INSERT INTO storage.buckets (id, name, public) VALUES ('memory-photos', 'memory-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "authenticated_upload" ON storage.objects;
CREATE POLICY "authenticated_upload" ON storage.objects
  FOR ALL USING (bucket_id = 'memory-photos' AND auth.role() = 'authenticated')
  WITH CHECK (bucket_id = 'memory-photos' AND auth.role() = 'authenticated');
