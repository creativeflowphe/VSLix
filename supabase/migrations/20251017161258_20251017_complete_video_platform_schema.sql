/*
  # Complete Video Platform Schema

  1. New Tables
    - `videos`
      - `id` (uuid, primary key, auto-generated)
      - `name` (text, not null) - Video display name
      - `video_url` (text, not null) - URL to video resource
      - `views` (integer, default 0) - Total view count
      - `created_at` (timestamptz, default now()) - Creation timestamp
      - `updated_at` (timestamptz, default now()) - Last update timestamp

  2. Security
    - Enable RLS on `videos` table
    - Add policy for authenticated users to read all videos
    - Add policy for authenticated users to insert videos
    - Add policy for authenticated users to update videos
    - Add policy for authenticated users to delete videos

  3. Functions
    - Create trigger to auto-update `updated_at` on row changes
*/

CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  video_url text NOT NULL,
  views integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all videos"
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

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_videos_updated_at'
  ) THEN
    CREATE TRIGGER update_videos_updated_at
      BEFORE UPDATE ON videos
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

INSERT INTO videos (name, video_url, views) 
VALUES ('Demo Video', 'https://example.com/demo.mp4', 1234)
ON CONFLICT DO NOTHING;