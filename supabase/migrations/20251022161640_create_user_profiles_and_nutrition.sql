/*
  # User Profiles and Nutrition Tracking Schema

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `age` (integer) - User's age
      - `height` (decimal) - Height in cm
      - `weight` (decimal) - Weight in kg
      - `goal` (text) - Either 'cut' or 'bulk'
      - `daily_calories` (integer) - Calculated daily calorie target
      - `daily_protein` (integer) - Daily protein target in grams
      - `daily_carbs` (integer) - Daily carbs target in grams
      - `daily_fats` (integer) - Daily fats target in grams
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `food_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `image_url` (text) - URL to the stored food image
      - `food_name` (text) - Identified food item name
      - `description` (text) - Detailed description of the food
      - `serving_size` (text) - Estimated portion size
      - `calories` (integer) - Calories in the food
      - `protein` (decimal) - Protein in grams
      - `carbs` (decimal) - Carbs in grams
      - `fats` (decimal) - Fats in grams
      - `fiber` (decimal) - Fiber in grams
      - `sugar` (decimal) - Sugar in grams
      - `sodium` (decimal) - Sodium in milligrams
      - `logged_at` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Users can only read/write their own profile data
    - Users can only read/write their own food logs

  3. Important Notes
    - User profiles are linked to auth.users via id
    - Nutrition calculations use standard formulas based on user goals
    - Food logs track daily nutrition intake for progress monitoring
    - Includes detailed nutritional information for comprehensive tracking
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  age integer NOT NULL CHECK (age > 0 AND age < 150),
  height decimal(5,2) NOT NULL CHECK (height > 0),
  weight decimal(5,2) NOT NULL CHECK (weight > 0),
  goal text NOT NULL CHECK (goal IN ('cut', 'bulk')),
  daily_calories integer NOT NULL,
  daily_protein integer NOT NULL,
  daily_carbs integer NOT NULL,
  daily_fats integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create food_logs table with enhanced nutrition fields
CREATE TABLE IF NOT EXISTS food_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url text,
  food_name text NOT NULL,
  description text,
  serving_size text,
  calories integer NOT NULL DEFAULT 0,
  protein decimal(6,2) NOT NULL DEFAULT 0,
  carbs decimal(6,2) NOT NULL DEFAULT 0,
  fats decimal(6,2) NOT NULL DEFAULT 0,
  fiber decimal(6,2) DEFAULT 0,
  sugar decimal(6,2) DEFAULT 0,
  sodium decimal(7,2) DEFAULT 0,
  logged_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for food_logs
CREATE POLICY "Users can view own food logs"
  ON food_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own food logs"
  ON food_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own food logs"
  ON food_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own food logs"
  ON food_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster food log queries
CREATE INDEX IF NOT EXISTS food_logs_user_id_logged_at_idx 
  ON food_logs(user_id, logged_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
