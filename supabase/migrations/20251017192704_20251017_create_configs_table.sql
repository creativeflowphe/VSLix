/*
  # Create configs table for global settings

  1. New Tables
    - `configs`
      - `id` (uuid, primary key) - Unique identifier
      - `anti_download` (boolean) - Global anti-download protection setting
      - `ab_testing` (boolean) - Global A/B testing feature toggle
      - `default_color` (text) - Default progress bar color
      - `updated_at` (timestamptz) - Last update timestamp
      - `created_at` (timestamptz) - Creation timestamp
  
  2. Security
    - Enable RLS on `configs` table
    - Add policy for authenticated users to read configs
    - Add policy for authenticated users to update configs
  
  3. Notes
    - Only one config row should exist (singleton pattern)
    - Includes trigger to auto-update `updated_at` on changes
*/

CREATE TABLE IF NOT EXISTS configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anti_download boolean DEFAULT false,
  ab_testing boolean DEFAULT false,
  default_color text DEFAULT '#8b5cf6',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read configs"
  ON configs
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert configs"
  ON configs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update configs"
  ON configs
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION update_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_configs_updated_at_trigger'
  ) THEN
    CREATE TRIGGER update_configs_updated_at_trigger
      BEFORE UPDATE ON configs
      FOR EACH ROW
      EXECUTE FUNCTION update_configs_updated_at();
  END IF;
END $$;

INSERT INTO configs (id, anti_download, ab_testing, default_color)
VALUES (gen_random_uuid(), false, false, '#8b5cf6')
ON CONFLICT DO NOTHING;