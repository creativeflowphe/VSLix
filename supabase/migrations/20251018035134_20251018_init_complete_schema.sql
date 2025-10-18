/*
  # Complete Video Analytics Platform Schema

  1. New Tables
    - videos: Store video metadata and settings
    - views: Track video viewing analytics
    - configs: Global platform configurations

  2. Security
    - Enable RLS on all tables
    - Public read access for videos
    - Public tracking for views
    - Authenticated access for configs

  3. Indexes
    - Performance indexes on foreign keys and timestamp fields
*/

-- Create videos table
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  video_url text NOT NULL,
  autoplay boolean DEFAULT true,
  fake_progress boolean DEFAULT false,
  progress_color text DEFAULT '#10b981',
  anti_download boolean DEFAULT true,
  muted boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create views table
CREATE TABLE IF NOT EXISTS views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  ip_hash text,
  session_id text,
  timestamp timestamptz DEFAULT now(),
  watch_time integer DEFAULT 0,
  progress_percent numeric DEFAULT 0,
  milestone_5 boolean DEFAULT false,
  milestone_25 boolean DEFAULT false,
  milestone_50 boolean DEFAULT false,
  milestone_75 boolean DEFAULT false,
  milestone_90 boolean DEFAULT false,
  milestone_100 boolean DEFAULT false
);

-- Create configs table
CREATE TABLE IF NOT EXISTS configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anti_download boolean DEFAULT true,
  ab_testing boolean DEFAULT false,
  default_color text DEFAULT '#8b5cf6',
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_views_video_id ON views(video_id);
CREATE INDEX IF NOT EXISTS idx_views_session_id ON views(session_id);
CREATE INDEX IF NOT EXISTS idx_views_timestamp ON views(timestamp);

-- Enable RLS
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE views ENABLE ROW LEVEL SECURITY;
ALTER TABLE configs ENABLE ROW LEVEL SECURITY;

-- Videos policies
DROP POLICY IF EXISTS "Public read videos" ON videos;
CREATE POLICY "Public read videos" ON videos FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Auth insert videos" ON videos;
CREATE POLICY "Auth insert videos" ON videos FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Auth update videos" ON videos;
CREATE POLICY "Auth update videos" ON videos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Auth delete videos" ON videos;
CREATE POLICY "Auth delete videos" ON videos FOR DELETE TO authenticated USING (true);

-- Views policies
DROP POLICY IF EXISTS "Public read views" ON views;
CREATE POLICY "Public read views" ON views FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public insert views" ON views;
CREATE POLICY "Public insert views" ON views FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Public update views" ON views;
CREATE POLICY "Public update views" ON views FOR UPDATE TO public USING (true) WITH CHECK (true);

-- Configs policies
DROP POLICY IF EXISTS "Public read configs" ON configs;
CREATE POLICY "Public read configs" ON configs FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Auth insert configs" ON configs;
CREATE POLICY "Auth insert configs" ON configs FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Auth update configs" ON configs;
CREATE POLICY "Auth update configs" ON configs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
