import { useState, useEffect } from 'react';
import { X, Trophy, Lock } from 'lucide-react';
import { achievementService, type Achievement, type UserAchievement } from '../services/achievementService';
import { supabase } from '../lib/supabase';

interface AchievementsViewProps {
  userId: string;
  onClose: () => void;
}

export default function AchievementsView({ userId, onClose }: AchievementsViewProps) {
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, [userId]);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      
      const [earned, all] = await Promise.all([
        achievementService.getUserAchievements(userId),
        supabase.from('achievements').select('*').order('criteria_value', { ascending: true })
      ]);

      setUserAchievements(earned);
      setAllAchievements(all.data || []);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const earnedIds = new Set(userAchievements.map(ua => ua.achievement_id));

  const getAchievementProgress = (achievement: Achievement): string => {
    const isEarned = earnedIds.has(achievement.id);
    if (isEarned) return 'Completed';

    switch (achievement.criteria_type) {
      case 'first_entry':
        return 'Log your first meal';
      case 'streak':
        return `Reach ${achievement.criteria_value} day streak`;
      case 'total_entries':
        return `Log ${achievement.criteria_value} meals`;
      case 'monthly_entries':
        return `Log meals for ${achievement.criteria_value} month${achievement.criteria_value > 1 ? 's' : ''}`;
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-white" />
            <div>
              <h2 className="text-2xl font-bold text-white">Achievements</h2>
              <p className="text-amber-50 text-sm">
                {userAchievements.length} of {allAchievements.length} unlocked
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading achievements...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allAchievements.map((achievement) => {
                const isEarned = earnedIds.has(achievement.id);
                const userAchievement = userAchievements.find(
                  ua => ua.achievement_id === achievement.id
                );

                return (
                  <div
                    key={achievement.id}
                    className={`p-6 rounded-2xl border-2 transition-all ${
                      isEarned
                        ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300 shadow-lg'
                        : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`text-4xl p-3 rounded-xl ${
                          isEarned
                            ? 'bg-white shadow-md'
                            : 'bg-gray-200'
                        }`}
                      >
                        {isEarned ? achievement.icon : <Lock className="w-8 h-8 text-gray-400" />}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-bold text-lg mb-1 ${
                          isEarned ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {achievement.name}
                        </h3>
                        <p className={`text-sm mb-2 ${
                          isEarned ? 'text-gray-700' : 'text-gray-500'
                        }`}>
                          {achievement.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-medium ${
                            isEarned ? 'text-amber-600' : 'text-gray-400'
                          }`}>
                            {getAchievementProgress(achievement)}
                          </span>
                          {isEarned && userAchievement && (
                            <span className="text-xs text-gray-500">
                              {new Date(userAchievement.earned_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
