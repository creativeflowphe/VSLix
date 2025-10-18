/*
  # Initialize Complete Video Analytics Schema

  1. New Tables
    - `videos` - Store video metadata and configuration
      - `id` (uuid, primary key) - Unique identifier for each video
      - `name` (text, not null) - Video title/name
      - `video_url` (text, not null) - Cloudinary URL where video is hosted
      - `autoplay` (boolean) - Auto-play video on load, defaults to true
      - `fake_progress` (boolean) - Show animated fake progress bar, defaults to false
      - `progress_color` (text) - Hex color for progress bar, defaults to '#10b981' (emerald)
      - `anti_download` (boolean) - Enable anti-download protections, defaults to true
      - `muted` (boolean) - Start video muted, defaults to true
      - `created_at` (timestamptz) - Creation timestamp

    - `views` - Track video view analytics and engagement
      - `id` (uuid, primary key) - Unique identifier for each view event
      - `video_id` (uuid, foreign key) - Reference to watched video
      - `ip_hash` (text) - Privacy-compliant hashed IP address
      - `session_id` (text) - Session identifier for grouping events
      - `timestamp` (timestamptz) - Event timestamp
      - `watch_time` (interval) - Total watch duration
      - `progress_percent` (numeric(5,2)) - Completion percentage
      - `milestone_5/25/50/75/90/100` (boolean) - Engagement milestones

  2. Security
    - Enable RLS on both tables
    - Authenticated users: full CRUD on videos, read on views
    - Anonymous users: insert on views (for public tracking)

  3. Performance
    - Indexes on foreign keys and frequently queried columns

  4. Important Notes
    - CASCADE delete views when video is deleted
    - Public insert for embedded video tracking
    - Milestone flags for efficient drop-off analysis
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

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all videos"
  ON videos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert videos"
  ON videos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update videos"
  ON videos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete videos"
  ON videos FOR DELETE
  TO authenticated
  USING (true);

-- Create views tracking table
CREATE TABLE IF NOT EXISTS views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  ip_hash text,
  session_id text,
  timestamp timestamptz DEFAULT now(),
  watch_time interval,
  progress_percent numeric(5,2) DEFAULT 0,
  milestone_5 boolean DEFAULT false,
  milestone_25 boolean DEFAULT false,
  milestone_50 boolean DEFAULT false,
  milestone_75 boolean DEFAULT false,
  milestone_90 boolean DEFAULT false,
  milestone_100 boolean DEFAULT false
);

ALTER TABLE views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all analytics"
  ON views FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public can insert view events"
  ON views FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated users can insert view events"
  ON views FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_views_video_id ON views(video_id);
CREATE INDEX IF NOT EXISTS idx_views_timestamp ON views(timestamp);
CREATE INDEX IF NOT EXISTS idx_views_session_id ON views(session_id);
