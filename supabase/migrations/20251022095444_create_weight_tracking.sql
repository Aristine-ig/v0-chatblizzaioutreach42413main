/*
  # Weight Tracking Feature

  1. New Tables
    - `weight_logs`
      - `id` (uuid, primary key) - Unique identifier for each weight entry
      - `user_id` (uuid, references auth.users) - Links to the user who owns this entry
      - `weight` (decimal) - Weight measurement in kg
      - `logged_at` (timestamptz) - Date and time when weight was recorded
      - `created_at` (timestamptz) - Record creation timestamp
      - `notes` (text, optional) - Optional notes about the weight entry

  2. Security
    - Enable RLS on weight_logs table
    - Users can only read their own weight entries
    - Users can create, update, and delete their own weight entries

  3. Important Notes
    - Weight logs track weight changes over time for trend analysis
    - Indexed on user_id and logged_at for efficient querying
    - Separate from user_profiles.weight which represents current weight
*/

CREATE TABLE IF NOT EXISTS weight_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight decimal(5,2) NOT NULL CHECK (weight > 0 AND weight < 500),
  logged_at timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weight logs"
  ON weight_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weight logs"
  ON weight_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weight logs"
  ON weight_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own weight logs"
  ON weight_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS weight_logs_user_id_logged_at_idx 
  ON weight_logs(user_id, logged_at DESC);
