import { createClient } from '@supabase/supabase-js';
import { ENV } from '../config/env';

const supabaseUrl = ENV.SUPABASE_URL;
const supabaseAnonKey = ENV.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UserProfile {
  id: string;
  age: number;
  height: number;
  weight: number;
  goal: 'cut' | 'bulk';
  daily_calories: number;
  daily_protein: number;
  daily_carbs: number;
  daily_fats: number;
  created_at: string;
  updated_at: string;
}

export interface FoodLog {
  id: string;
  user_id: string;
  image_url?: string;
  food_name: string;
  description?: string;
  serving_size?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  sugar: number;
  sodium: number;
  logged_at: string;
  created_at: string;
}

export function calculateNutrition(
  weight: number,
  height: number,
  age: number,
  goal: 'cut' | 'bulk'
) {
  const bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  const activityMultiplier = 1.55;
  const tdee = bmr * activityMultiplier;

  let dailyCalories: number;
  if (goal === 'bulk') {
    dailyCalories = Math.round(tdee + 300);
  } else {
    dailyCalories = Math.round(tdee - 500);
  }

  const dailyProtein = Math.round(weight * 2.2);
  const dailyFats = Math.round((dailyCalories * 0.25) / 9);
  const dailyCarbs = Math.round((dailyCalories - (dailyProtein * 4 + dailyFats * 9)) / 4);

  return {
    daily_calories: dailyCalories,
    daily_protein: dailyProtein,
    daily_carbs: dailyCarbs,
    daily_fats: dailyFats,
  };
}
