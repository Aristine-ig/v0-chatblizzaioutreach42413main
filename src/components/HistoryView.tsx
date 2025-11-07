import { useState, useEffect } from 'react';
import { supabase, FoodLog } from '../lib/supabase';
import { Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface HistoryViewProps {
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

export default function HistoryView({ userId, onClose }: HistoryViewProps) {
  const [view, setView] = useState<'week' | 'month'>('week');
  const [history, setHistory] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    loadHistory();
  }, [userId, view, currentDate]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const endDate = new Date(currentDate);
      endDate.setHours(23, 59, 59, 999);

      const startDate = new Date(currentDate);
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

      const dailyStats: { [key: string]: DailyStats } = {};

      const days = view === 'week' ? 7 : 30;
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(currentDate);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailyStats[dateStr] = {
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
        if (dailyStats[dateStr]) {
          dailyStats[dateStr].calories += log.calories;
          dailyStats[dateStr].protein += log.protein;
          dailyStats[dateStr].carbs += log.carbs;
          dailyStats[dateStr].fats += log.fats;
          dailyStats[dateStr].meals += 1;
        }
      });

      setHistory(Object.values(dailyStats));
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 30);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    const today = new Date();

    if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 30);
    }

    if (newDate <= today) {
      setCurrentDate(newDate);
    }
  };

  const totalCalories = history.reduce((sum, day) => sum + day.calories, 0);
  const avgCalories = history.length > 0 ? Math.round(totalCalories / history.length) : 0;
  const totalMeals = history.reduce((sum, day) => sum + day.meals, 0);

  const maxCalories = Math.max(...history.map(d => d.calories), 1);

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  const canGoNext = () => {
    const nextDate = new Date(currentDate);
    if (view === 'week') {
      nextDate.setDate(nextDate.getDate() + 7);
    } else {
      nextDate.setDate(nextDate.getDate() + 30);
    }
    return nextDate <= new Date();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-emerald-500 to-teal-600 p-4 sm:p-6 rounded-t-2xl sm:rounded-t-3xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-3">
              <Calendar className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              <h2 className="text-lg sm:text-2xl font-bold text-white">Nutrition History</h2>
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
                  ? 'bg-white text-emerald-600 shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setView('month')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium transition-all ${
                view === 'month'
                  ? 'bg-white text-emerald-600 shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Month
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={goToPrevious}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div className="text-center">
              <div className="text-sm text-gray-600">
                {view === 'week' ? 'Last 7 Days' : 'Last 30 Days'}
              </div>
            </div>
            <button
              onClick={goToNext}
              disabled={!canGoNext()}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 sm:p-4 rounded-xl sm:rounded-2xl">
              <div className="text-xs sm:text-sm text-orange-600 font-medium mb-1">Avg. Calories</div>
              <div className="text-lg sm:text-2xl font-bold text-gray-800">{avgCalories}</div>
              <div className="text-[10px] sm:text-xs text-gray-600">per day</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-4 rounded-xl sm:rounded-2xl">
              <div className="text-xs sm:text-sm text-blue-600 font-medium mb-1">Total Meals</div>
              <div className="text-lg sm:text-2xl font-bold text-gray-800">{totalMeals}</div>
              <div className="text-[10px] sm:text-xs text-gray-600">logged</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-3 sm:p-4 rounded-xl sm:rounded-2xl">
              <div className="text-xs sm:text-sm text-emerald-600 font-medium mb-1">Total Calories</div>
              <div className="text-lg sm:text-2xl font-bold text-gray-800">{totalCalories}</div>
              <div className="text-[10px] sm:text-xs text-gray-600">consumed</div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : (
            <div className="space-y-2">
              {history.map((day) => {
                const barHeight = maxCalories > 0 ? (day.calories / maxCalories) * 100 : 0;
                const date = new Date(day.date);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                const dayNum = date.getDate();

                return (
                  <div
                    key={day.date}
                    className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all hover:shadow-md ${
                      isToday(day.date)
                        ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <div className="min-w-0">
                        <div className="text-sm sm:text-base font-semibold text-gray-800">
                          {dayName}, {dayNum}
                          {isToday(day.date) && (
                            <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs bg-emerald-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                              Today
                            </span>
                          )}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">{day.meals} meals</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-base sm:text-xl font-bold text-gray-800">{day.calories} kcal</div>
                        <div className="text-[10px] sm:text-xs text-gray-600">
                          P: {Math.round(day.protein)}g | C: {Math.round(day.carbs)}g | F: {Math.round(day.fats)}g
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${barHeight}%` }}
                      />
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
