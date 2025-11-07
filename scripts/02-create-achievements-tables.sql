-- Create enum for achievement criteria types
CREATE TYPE achievement_criteria_type AS ENUM ('first_entry', 'streak', 'total_entries', 'monthly_entries');

-- Create achievements table
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  criteria_type achievement_criteria_type NOT NULL,
  criteria_value INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_achievements table
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Enable Row Level Security
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements (read-only for all authenticated users)
CREATE POLICY "Anyone can view achievements"
  ON achievements
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements"
  ON user_achievements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON user_achievements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_earned_at ON user_achievements(earned_at DESC);

-- Seed initial achievements
INSERT INTO achievements (name, description, icon, criteria_type, criteria_value) VALUES
  ('First Meal', 'Log your first meal', '🎉', 'first_entry', 1),
  ('Getting Started', 'Log 5 meals', '🌟', 'total_entries', 5),
  ('Committed', 'Log 10 meals', '💪', 'total_entries', 10),
  ('Dedicated', 'Log 25 meals', '🔥', 'total_entries', 25),
  ('Master Tracker', 'Log 50 meals', '👑', 'total_entries', 50),
  ('Century Club', 'Log 100 meals', '💯', 'total_entries', 100),
  ('3 Day Streak', 'Log meals for 3 consecutive days', '📅', 'streak', 3),
  ('Week Warrior', 'Log meals for 7 consecutive days', '⚡', 'streak', 7),
  ('Two Week Champion', 'Log meals for 14 consecutive days', '🏆', 'streak', 14),
  ('Monthly Master', 'Log meals for 30 consecutive days', '🎯', 'streak', 30),
  ('Active Month', 'Log at least one meal this month', '📆', 'monthly_entries', 1),
  ('Consistent Tracker', 'Log meals for 3 months', '🗓️', 'monthly_entries', 3),
  ('Long Term Success', 'Log meals for 6 months', '🌈', 'monthly_entries', 6);
