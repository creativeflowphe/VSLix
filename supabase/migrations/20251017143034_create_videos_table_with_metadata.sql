/*
  # Create videos table with complete schema

  1. New Tables
    - `videos`
      - `id` (uuid, primary key) - Unique identifier for each video, auto-generated
      - `name` (text, not null) - Name/title of the video
      - `video_url` (text, not null) - URL where the video is hosted (Cloudinary)
      - `autoplay` (boolean) - Controls whether the video should autoplay, defaults to true
      - `fake_progress` (boolean) - Controls whether to show a fake progress bar, defaults to false
      - `progress_color` (text) - Hex color code for the progress bar, defaults to '#8b5cf6' (purple)
      - `created_at` (timestamptz) - Timestamp of when the video was created, defaults to current time
  
  2. Security
    - Enable RLS on `videos` table
    - Add policy for authenticated users to read all videos
    - Add policy for authenticated users to insert new videos
    - Add policy for authenticated users to update videos
    - Add policy for authenticated users to delete videos
  
  3. Important Notes
    - All authenticated admin users can perform CRUD operations on videos
    - The table uses UUID for primary keys with automatic generation
    - Created timestamp is automatically set on insertion
    - All boolean flags have sensible defaults
    - Progress color defaults to purple theme color
*/

CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  video_url text NOT NULL,
  autoplay boolean DEFAULT true,
  fake_progress boolean DEFAULT false,
  progress_color text DEFAULT '#8b5cf6',
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