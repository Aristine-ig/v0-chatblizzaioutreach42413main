/*
  # Initial Nutrition and Social Features Schema

  1. New Tables
    - `user_profiles` - User nutrition goals and settings
    - `food_logs` - Daily food intake tracking
    - `weight_logs` - Weight tracking history
    - `user_follow` - Social follow relationships
    - `shared_meals` - Shared meal posts
    - `meal_reactions` - Reactions to shared meals
    - `notifications` - User notifications
    - `notification_preferences` - Notification settings
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

-- Create food_logs table
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

-- Create weight_logs table
CREATE TABLE IF NOT EXISTS weight_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight decimal(5,2) NOT NULL CHECK (weight > 0 AND weight < 500),
  logged_at timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create user_follow table for social connections
CREATE TABLE IF NOT EXISTS user_follow (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Create shared_meals table
CREATE TABLE IF NOT EXISTS shared_meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_log_id uuid NOT NULL REFERENCES food_logs(id) ON DELETE CASCADE,
  caption text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create meal_reactions table
CREATE TABLE IF NOT EXISTS meal_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_meal_id uuid NOT NULL REFERENCES shared_meals(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'love', 'wow')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, shared_meal_id, reaction_type)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('follow', 'meal_shared', 'reaction', 'meal_reminder', 'hydration_reminder')),
  title text NOT NULL,
  message text NOT NULL,
  data jsonb,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_reminders_enabled boolean DEFAULT true,
  hydration_reminders_enabled boolean DEFAULT true,
  meal_reminders_time time DEFAULT '12:00',
  follow_notifications_enabled boolean DEFAULT true,
  reaction_notifications_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follow ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

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

-- RLS Policies for weight_logs
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

-- RLS Policies for user_follow
CREATE POLICY "Users can view follow relationships"
  ON user_follow FOR SELECT
  TO authenticated
  USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can create follow relationships"
  ON user_follow FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows"
  ON user_follow FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

-- RLS Policies for shared_meals
CREATE POLICY "Users can view shared meals from followers"
  ON shared_meals FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM user_follow
      WHERE user_follow.follower_id = auth.uid()
      AND user_follow.following_id = shared_meals.user_id
    )
  );

CREATE POLICY "Users can create shared meals for own food logs"
  ON shared_meals FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM food_logs
      WHERE food_logs.id = food_log_id
      AND food_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own shared meals"
  ON shared_meals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own shared meals"
  ON shared_meals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for meal_reactions
CREATE POLICY "Users can view reactions on accessible meals"
  ON meal_reactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shared_meals
      WHERE shared_meals.id = meal_reactions.shared_meal_id
      AND (
        shared_meals.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM user_follow
          WHERE user_follow.follower_id = auth.uid()
          AND user_follow.following_id = shared_meals.user_id
        )
      )
    )
  );

CREATE POLICY "Users can create reactions on accessible meals"
  ON meal_reactions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM shared_meals
      WHERE shared_meals.id = shared_meal_id
      AND (
        shared_meals.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM user_follow
          WHERE user_follow.follower_id = auth.uid()
          AND user_follow.following_id = shared_meals.user_id
        )
      )
    )
  );

CREATE POLICY "Users can delete own reactions"
  ON meal_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for notification_preferences
CREATE POLICY "Users can view own preferences"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON notification_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS food_logs_user_id_logged_at_idx ON food_logs(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS weight_logs_user_id_logged_at_idx ON weight_logs(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS user_follow_follower_id_idx ON user_follow(follower_id);
CREATE INDEX IF NOT EXISTS user_follow_following_id_idx ON user_follow(following_id);
CREATE INDEX IF NOT EXISTS shared_meals_user_id_idx ON shared_meals(user_id);
CREATE INDEX IF NOT EXISTS shared_meals_food_log_id_idx ON shared_meals(food_log_id);
CREATE INDEX IF NOT EXISTS meal_reactions_shared_meal_id_idx ON meal_reactions(shared_meal_id);
CREATE INDEX IF NOT EXISTS notifications_user_id_created_at_idx ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON notifications(user_id, read);

-- Create trigger function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shared_meals_updated_at
  BEFORE UPDATE ON shared_meals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
