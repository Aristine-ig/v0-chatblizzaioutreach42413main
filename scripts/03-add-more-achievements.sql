-- Add more diverse achievements beyond the basic ones

INSERT INTO achievements (name, description, icon, criteria_type, criteria_value) VALUES
  -- Milestone achievements
  ('Legendary Tracker', 'Log 200 meals', '⭐', 'total_entries', 200),
  ('Elite Status', 'Log 500 meals', '💎', 'total_entries', 500),
  ('Ultimate Champion', 'Log 1000 meals', '👑', 'total_entries', 1000),
  
  -- Extended streak achievements
  ('60 Day Hero', 'Log meals for 60 consecutive days', '🦸', 'streak', 60),
  ('Quarter Year Champion', 'Log meals for 90 consecutive days', '🏅', 'streak', 90),
  ('Half Year Legend', 'Log meals for 180 consecutive days', '🌟', 'streak', 180),
  ('Year Long Warrior', 'Log meals for 365 consecutive days', '🔥', 'streak', 365),
  
  -- Long term tracking
  ('Annual Champion', 'Log meals for 12 months', '🎊', 'monthly_entries', 12),
  ('Lifestyle Master', 'Log meals for 18 months', '💪', 'monthly_entries', 18),
  ('Two Year Legend', 'Log meals for 24 months', '🏆', 'monthly_entries', 24)
ON CONFLICT DO NOTHING;
