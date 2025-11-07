import { supabase } from '../lib/supabase';

export interface UserFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface SharedMeal {
  id: string;
  user_id: string;
  food_log_id: string;
  caption: string | null;
  created_at: string;
  updated_at: string;
  food_logs?: any;
  user_profiles?: any;
  reaction_count?: number;
  user_reactions?: string[];
}

export interface MealReaction {
  id: string;
  user_id: string;
  shared_meal_id: string;
  reaction_type: 'like' | 'love' | 'wow';
  created_at: string;
}

export interface UserStats {
  followers_count: number;
  following_count: number;
  shared_meals_count: number;
  total_calories: number;
  avg_daily_calories: number;
  current_streak: number;
}

export const socialService = {
  async follow(followerId: string, followingId: string) {
    const { data, error } = await supabase
      .from('user_follow')
      .insert({
        follower_id: followerId,
        following_id: followingId,
      })
      .select()
      .single();
    if (error) throw error;
    return data as UserFollow;
  },

  async unfollow(followerId: string, followingId: string) {
    const { error } = await supabase
      .from('user_follow')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);
    if (error) throw error;
  },

  async getFollowers(userId: string) {
    const { data, error } = await supabase
      .from('user_follow')
      .select('follower_id')
      .eq('following_id', userId);
    if (error) throw error;
    return data?.map(f => f.follower_id) || [];
  },

  async getFollowing(userId: string) {
    const { data, error } = await supabase
      .from('user_follow')
      .select('following_id')
      .eq('follower_id', userId);
    if (error) throw error;
    return data?.map(f => f.following_id) || [];
  },

  async isFollowing(followerId: string, followingId: string) {
    const { data, error } = await supabase
      .from('user_follow')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  },

  async shareMeal(userId: string, foodLogId: string, caption?: string) {
    const { data, error } = await supabase
      .from('shared_meals')
      .insert({
        user_id: userId,
        food_log_id: foodLogId,
        caption: caption || null,
      })
      .select()
      .single();
    if (error) throw error;
    return data as SharedMeal;
  },

  async getSharedMeals(userId: string, limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from('shared_meals')
      .select(`
        *,
        food_logs (
          food_name,
          calories,
          protein,
          carbs,
          fats,
          image_url
        ),
        user_profiles (
          id
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return data as SharedMeal[];
  },

  async getFeed(userId: string, limit = 20, offset = 0) {
    const { data: following, error: followError } = await supabase
      .from('user_follow')
      .select('following_id')
      .eq('follower_id', userId);
    if (followError) throw followError;

    const followingIds = following?.map(f => f.following_id) || [];
    if (followingIds.length === 0) followingIds.push(userId);

    const { data, error } = await supabase
      .from('shared_meals')
      .select(`
        *,
        food_logs (
          food_name,
          calories,
          protein,
          carbs,
          fats,
          image_url
        ),
        user_profiles (
          id
        )
      `)
      .in('user_id', followingIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return data as SharedMeal[];
  },

  async deleteSharedMeal(sharedMealId: string) {
    const { error } = await supabase
      .from('shared_meals')
      .delete()
      .eq('id', sharedMealId);
    if (error) throw error;
  },

  async addReaction(userId: string, sharedMealId: string, reactionType: 'like' | 'love' | 'wow') {
    const { data, error } = await supabase
      .from('meal_reactions')
      .insert({
        user_id: userId,
        shared_meal_id: sharedMealId,
        reaction_type: reactionType,
      })
      .select()
      .single();
    if (error && error.code !== '23505') throw error;
    return data as MealReaction | null;
  },

  async removeReaction(userId: string, sharedMealId: string, reactionType: 'like' | 'love' | 'wow') {
    const { error } = await supabase
      .from('meal_reactions')
      .delete()
      .eq('user_id', userId)
      .eq('shared_meal_id', sharedMealId)
      .eq('reaction_type', reactionType);
    if (error) throw error;
  },

  async getReactions(sharedMealId: string) {
    const { data, error } = await supabase
      .from('meal_reactions')
      .select('*')
      .eq('shared_meal_id', sharedMealId);
    if (error) throw error;
    return data as MealReaction[];
  },

  async getUserReactions(userId: string, sharedMealId: string) {
    const { data, error } = await supabase
      .from('meal_reactions')
      .select('reaction_type')
      .eq('user_id', userId)
      .eq('shared_meal_id', sharedMealId);
    if (error) throw error;
    return data?.map(r => r.reaction_type) || [];
  },

  async getUserStats(userId: string): Promise<UserStats> {
    const [
      { data: followers },
      { data: following },
      { data: sharedMeals },
      { data: foodLogs },
    ] = await Promise.all([
      supabase.from('user_follow').select('id').eq('following_id', userId),
      supabase.from('user_follow').select('id').eq('follower_id', userId),
      supabase.from('shared_meals').select('id').eq('user_id', userId),
      supabase.from('food_logs').select('calories').eq('user_id', userId),
    ]);

    const totalCalories = foodLogs?.reduce((sum, log) => sum + (log.calories || 0), 0) || 0;
    const avgDailyCalories = foodLogs && foodLogs.length > 0 ? Math.round(totalCalories / foodLogs.length) : 0;

    return {
      followers_count: followers?.length || 0,
      following_count: following?.length || 0,
      shared_meals_count: sharedMeals?.length || 0,
      total_calories: totalCalories,
      avg_daily_calories: avgDailyCalories,
      current_streak: 0,
    };
  },
};
