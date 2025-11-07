import { useState, useEffect } from 'react';
import { supabase, FoodLog, UserProfile } from '../lib/supabase';
import { BarChart3, TrendingUp, TrendingDown, X, Calendar, Minus } from 'lucide-react';

interface AnalyticsViewProps {
  userId: string;
  onClose: () => void;
}

interface DailyStats {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  meals: number;
}

interface WeeklyAverage {
  week: string;
  avgCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgFats: number;
}

export default function AnalyticsView({ userId, onClose }: AnalyticsViewProps) {
  const [view, setView] = useState<'week' | 'month'>('week');
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [weeklyAverages, setWeeklyAverages] = useState<WeeklyAverage[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [userId, view]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
      }

      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);

      const startDate = new Date();
      if (view === 'week') {
        startDate.setDate(startDate.getDate() - 6);
      } else {
        startDate.setDate(startDate.getDate() - 29);
      }
      startDate.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from('food_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('logged_at', startDate.toISOString())
        .lte('logged_at', endDate.toISOString())
        .order('logged_at', { ascending: true });

      const dailyStatsMap: { [key: string]: DailyStats } = {};
      const days = view === 'week' ? 7 : 30;

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailyStatsMap[dateStr] = {
          date: dateStr,
          calories: 0,
          protein: 0,
          carbs: 0,
          fats: 0,
          meals: 0,
        };
      }

      data?.forEach((log: FoodLog) => {
        const dateStr = log.logged_at.split('T')[0];
        if (dailyStatsMap[dateStr]) {
          dailyStatsMap[dateStr].calories += log.calories;
          dailyStatsMap[dateStr].protein += log.protein;
          dailyStatsMap[dateStr].carbs += log.carbs;
          dailyStatsMap[dateStr].fats += log.fats;
          dailyStatsMap[dateStr].meals += 1;
        }
      });

      const stats = Object.values(dailyStatsMap);
      setDailyStats(stats);

      if (view === 'month') {
        const weeklies: WeeklyAverage[] = [];
        for (let weekNum = 0; weekNum < 4; weekNum++) {
          const weekStart = weekNum * 7;
          const weekEnd = Math.min(weekStart + 7, stats.length);
          const weekStats = stats.slice(weekStart, weekEnd);

          const daysWithData = weekStats.filter(d => d.meals > 0).length;
          const divisor = daysWithData > 0 ? daysWithData : 1;

          weeklies.push({
            week: `Week ${weekNum + 1}`,
            avgCalories: Math.round(weekStats.reduce((sum, d) => sum + d.calories, 0) / divisor),
            avgProtein: Math.round(weekStats.reduce((sum, d) => sum + d.protein, 0) / divisor),
            avgCarbs: Math.round(weekStats.reduce((sum, d) => sum + d.carbs, 0) / divisor),
            avgFats: Math.round(weekStats.reduce((sum, d) => sum + d.fats, 0) / divisor),
          });
        }
        setWeeklyAverages(weeklies);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTrend = (stats: DailyStats[], metric: 'calories' | 'protein' | 'carbs' | 'fats') => {
    const daysWithData = stats.filter(d => d.meals > 0);
    if (daysWithData.length < 2) return null;

    const midPoint = Math.floor(daysWithData.length / 2);
    const firstHalf = daysWithData.slice(0, midPoint);
    const secondHalf = daysWithData.slice(midPoint);

    const firstAvg = firstHalf.reduce((sum, d) => sum + d[metric], 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d[metric], 0) / secondHalf.length;

    const diff = secondAvg - firstAvg;
    const percentChange = firstAvg > 0 ? (diff / firstAvg) * 100 : 0;

    return {
      direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable',
      value: Math.abs(percentChange).toFixed(1),
    };
  };

  const totalCalories = dailyStats.reduce((sum, d) => sum + d.calories, 0);
  const daysWithData = dailyStats.filter(d => d.meals > 0).length;
  const avgCalories = daysWithData > 0 ? Math.round(totalCalories / daysWithData) : 0;
  const avgProtein = daysWithData > 0 ? Math.round(dailyStats.reduce((sum, d) => sum + d.protein, 0) / daysWithData) : 0;
  const avgCarbs = daysWithData > 0 ? Math.round(dailyStats.reduce((sum, d) => sum + d.carbs, 0) / daysWithData) : 0;
  const avgFats = daysWithData > 0 ? Math.round(dailyStats.reduce((sum, d) => sum + d.fats, 0) / daysWithData) : 0;

  const caloriesTrend = calculateTrend(dailyStats, 'calories');
  const proteinTrend = calculateTrend(dailyStats, 'protein');

  const maxCalories = Math.max(...dailyStats.map(d => d.calories), profile?.daily_calories || 2000);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-cyan-600 p-4 sm:p-6 rounded-t-2xl sm:rounded-t-3xl z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-3">
              <BarChart3 className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              <h2 className="text-lg sm:text-2xl font-bold text-white">Analytics & Trends</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          <div className="flex gap-2 mt-3 sm:mt-4">
            <button
              onClick={() => setView('week')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium transition-all ${
                view === 'week'
                  ? 'bg-white text-blue-600 shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setView('month')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium transition-all ${
                view === 'month'
                  ? 'bg-white text-blue-600 shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              30 Days
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading analytics...</div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 sm:p-4 rounded-xl sm:rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs sm:text-sm text-orange-600 font-medium">Avg. Calories</div>
                    {caloriesTrend && (
                      <div className={`flex items-center text-xs ${
                        caloriesTrend.direction === 'up' ? 'text-red-600' :
                        caloriesTrend.direction === 'down' ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {caloriesTrend.direction === 'up' ? <TrendingUp className="w-3 h-3" /> :
                         caloriesTrend.direction === 'down' ? <TrendingDown className="w-3 h-3" /> :
                         <Minus className="w-3 h-3" />}
                        <span className="ml-1">{caloriesTrend.value}%</span>
                      </div>
                    )}
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-800">{avgCalories}</div>
                  <div className="text-[10px] sm:text-xs text-gray-600">per day</div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 p-3 sm:p-4 rounded-xl sm:rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs sm:text-sm text-red-600 font-medium">Avg. Protein</div>
                    {proteinTrend && (
                      <div className={`flex items-center text-xs ${
                        proteinTrend.direction === 'up' ? 'text-green-600' :
                        proteinTrend.direction === 'down' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {proteinTrend.direction === 'up' ? <TrendingUp className="w-3 h-3" /> :
                         proteinTrend.direction === 'down' ? <TrendingDown className="w-3 h-3" /> :
                         <Minus className="w-3 h-3" />}
                        <span className="ml-1">{proteinTrend.value}%</span>
                      </div>
                    )}
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-800">{avgProtein}g</div>
                  <div className="text-[10px] sm:text-xs text-gray-600">per day</div>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-3 sm:p-4 rounded-xl sm:rounded-2xl">
                  <div className="text-xs sm:text-sm text-amber-600 font-medium mb-2">Avg. Carbs</div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-800">{avgCarbs}g</div>
                  <div className="text-[10px] sm:text-xs text-gray-600">per day</div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-3 sm:p-4 rounded-xl sm:rounded-2xl">
                  <div className="text-xs sm:text-sm text-yellow-600 font-medium mb-2">Avg. Fats</div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-800">{avgFats}g</div>
                  <div className="text-[10px] sm:text-xs text-gray-600">per day</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 rounded-2xl mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                    Daily Calorie Intake
                  </h3>
                </div>

                <div className="space-y-3">
                  {dailyStats.map((day) => {
                    const date = new Date(day.date);
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                    const dayNum = date.getDate();
                    const barHeight = maxCalories > 0 ? (day.calories / maxCalories) * 100 : 0;
                    const isToday = day.date === new Date().toISOString().split('T')[0];
                    const goalPercent = profile ? Math.round((day.calories / profile.daily_calories) * 100) : 0;

                    return (
                      <div key={day.date} className="relative">
                        <div className="flex items-center gap-3">
                          <div className="w-16 sm:w-20 text-right flex-shrink-0">
                            <div className={`text-xs sm:text-sm font-semibold ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                              {dayName} {dayNum}
                            </div>
                          </div>

                          <div className="flex-1">
                            <div className="relative">
                              <div className="w-full bg-gray-200 rounded-full h-8 sm:h-10 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isToday
                                      ? 'bg-gradient-to-r from-blue-400 to-cyan-500'
                                      : 'bg-gradient-to-r from-orange-400 to-orange-500'
                                  }`}
                                  style={{ width: `${barHeight}%` }}
                                />
                              </div>
                              {day.meals > 0 && (
                                <div className="absolute inset-0 flex items-center justify-between px-3">
                                  <span className="text-xs sm:text-sm font-semibold text-gray-800">
                                    {day.calories} kcal
                                  </span>
                                  <span className="text-xs text-gray-600">
                                    {goalPercent}% of goal
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {profile && (
                  <div className="mt-4 pt-4 border-t border-gray-300">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Daily Goal</span>
                      <span className="font-semibold">{profile.daily_calories} kcal</span>
                    </div>
                  </div>
                )}
              </div>

              {view === 'month' && weeklyAverages.length > 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 sm:p-6 rounded-2xl">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Weekly Averages</h3>
                  <div className="space-y-4">
                    {weeklyAverages.map((week, index) => (
                      <div key={index} className="bg-white/70 p-4 rounded-xl">
                        <div className="font-semibold text-gray-800 mb-3">{week.week}</div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <div className="text-xs text-orange-600 font-medium">Calories</div>
                            <div className="text-lg font-bold text-gray-800">{week.avgCalories}</div>
                          </div>
                          <div>
                            <div className="text-xs text-red-600 font-medium">Protein</div>
                            <div className="text-lg font-bold text-gray-800">{week.avgProtein}g</div>
                          </div>
                          <div>
                            <div className="text-xs text-amber-600 font-medium">Carbs</div>
                            <div className="text-lg font-bold text-gray-800">{week.avgCarbs}g</div>
                          </div>
                          <div>
                            <div className="text-xs text-yellow-600 font-medium">Fats</div>
                            <div className="text-lg font-bold text-gray-800">{week.avgFats}g</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
