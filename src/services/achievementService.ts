import { supabase } from '../lib/supabase';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria_type: 'first_entry' | 'streak' | 'total_entries' | 'monthly_entries';
  criteria_value: number;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievement?: Achievement;
}

export const achievementService = {
  // Check and award achievements for a user
  async checkAndAwardAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      const newAchievements: UserAchievement[] = [];

      // Get all achievements
      const { data: achievements } = await supabase
        .from('achievements')
        .select('*')
        .order('criteria_value', { ascending: true });

      if (!achievements) return [];

      // Get user's current achievements
      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', userId);

      const earnedAchievementIds = new Set(
        userAchievements?.map(ua => ua.achievement_id) || []
      );

      // Check each achievement
      for (const achievement of achievements) {
        if (earnedAchievementIds.has(achievement.id)) continue;

        let earned = false;

        switch (achievement.criteria_type) {
          case 'first_entry':
            earned = await this.checkFirstEntry(userId);
            break;
          case 'streak':
            earned = await this.checkStreak(userId, achievement.criteria_value);
            break;
          case 'total_entries':
            earned = await this.checkTotalEntries(userId, achievement.criteria_value);
            break;
          case 'monthly_entries':
            earned = await this.checkMonthlyEntries(userId, achievement.criteria_value);
            break;
        }

        if (earned) {
          const { data: newAchievement } = await supabase
            .from('user_achievements')
            .insert({
              user_id: userId,
              achievement_id: achievement.id,
            })
            .select('*, achievement:achievements(*)')
            .single();

          if (newAchievement) {
            newAchievements.push(newAchievement);
          }
        }
      }

      return newAchievements;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  },

  async checkFirstEntry(userId: string): Promise<boolean> {
    const { count } = await supabase
      .from('food_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    return (count || 0) >= 1;
  },

  async checkStreak(userId: string, days: number): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let consecutiveDays = 0;
    
    for (let i = 0; i < days; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const nextDay = new Date(checkDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const { data } = await supabase
        .from('food_logs')
        .select('id')
        .eq('user_id', userId)
        .gte('logged_at', checkDate.toISOString())
        .lt('logged_at', nextDay.toISOString())
        .limit(1);
      
      if (data && data.length > 0) {
        consecutiveDays++;
      } else {
        break;
      }
    }
    
    return consecutiveDays >= days;
  },

  async checkTotalEntries(userId: string, target: number): Promise<boolean> {
    const { count } = await supabase
      .from('food_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    return (count || 0) >= target;
  },

  async checkMonthlyEntries(userId: string, months: number): Promise<boolean> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('food_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('logged_at', startDate.toISOString());

    return (count || 0) >= 1;
  },

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    const { data } = await supabase
      .from('user_achievements')
      .select('*, achievement:achievements(*)')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    return data || [];
  },
};
