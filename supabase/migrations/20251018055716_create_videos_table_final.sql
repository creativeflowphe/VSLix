/*
  # Create Videos Table and Configuration
  
  1. New Tables
    - `videos`
      - `id` (uuid, primary key) - Unique identifier for each video
      - `title` (text, required) - Video title
      - `description` (text, optional) - Video description
      - `url` (text, required) - Cloudinary video URL
      - `thumbnail_url` (text, optional) - Video thumbnail URL
      - `duration` (integer, optional) - Video duration in seconds
      - `file_size` (bigint, optional) - File size in bytes
      - `format` (text, optional) - Video format (e.g., mp4)
      - `width` (integer, optional) - Video width in pixels
      - `height` (integer, optional) - Video height in pixels
      - `views` (integer, default 0) - Number of views
      - `likes` (integer, default 0) - Number of likes
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
      - `cloudinary_public_id` (text, optional) - Cloudinary public ID for management
      
  2. Security
    - Enable RLS on `videos` table
    - Add policy for public read access (anyone can view videos)
    - Add policy for authenticated insert (only authenticated users can add videos)
    - Add policy for authenticated update (only authenticated users can update videos)
    - Add policy for authenticated delete (only authenticated users can delete videos)
    
  3. Indexes
    - Index on `created_at` for sorting by date
    - Index on `views` for sorting by popularity
*/

-- Create videos table
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  url text NOT NULL,
  thumbnail_url text,
  duration integer,
  file_size bigint,
  format text DEFAULT 'mp4',
  width integer,
  height integer,
  views integer DEFAULT 0,
  likes integer DEFAULT 0,
  cloudinary_public_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Policies for public read access
CREATE POLICY "Anyone can view videos"
  ON videos
  FOR SELECT
  USING (true);

-- Policies for authenticated users to insert
CREATE POLICY "Authenticated users can insert videos"
  ON videos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policies for authenticated users to update
CREATE POLICY "Authenticated users can update videos"
  ON videos
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for authenticated users to delete
CREATE POLICY "Authenticated users can delete videos"
  ON videos
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_views ON videos(views DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_videos_updated_at
  BEFORE UPDATE ON videos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();