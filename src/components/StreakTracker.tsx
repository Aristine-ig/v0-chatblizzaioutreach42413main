import { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface StreakTrackerProps {
  userId: string;
}

export default function StreakTracker({ userId }: StreakTrackerProps) {
  const [streak, setStreak] = useState(0);
  const [weekDays, setWeekDays] = useState<{ day: string; date: number; isCompleted: boolean; isToday: boolean }[]>([]);

  useEffect(() => {
    loadStreakData();
  }, [userId]);

  const loadStreakData = async () => {
    try {
      // Get the last 7 days
      const days = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = today.getTime();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const isToday = date.getTime() === todayTimestamp;
        
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dayNum = date.getDate(); // Use actual date number instead of 1-7
        
        // Check if there are any logs for this day
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        
        console.log(`Checking day ${dayNum} (${dayName}):`, {
          startDate: date.toISOString(),
          endDate: nextDay.toISOString(),
          dayIndex: i
        });
        
        const { data } = await supabase
          .from('food_logs')
          .select('id')
          .eq('user_id', userId)
          .gte('logged_at', date.toISOString())
          .lt('logged_at', nextDay.toISOString())
          .limit(1);
        
        console.log(`Day ${dayNum} has ${data?.length || 0} logs`);
        
        days.push({
          day: dayName,
          date: dayNum,
          isCompleted: !!(data && data.length > 0),
          isToday
        });
      }
      
      setWeekDays(days);
      
      // Calculate current streak
      let currentStreak = 0;
      for (let i = days.length - 1; i >= 0; i--) {
        if (days[i].isCompleted) {
          currentStreak++;
        } else {
          break;
        }
      }
      
      setStreak(currentStreak);
    } catch (error) {
      console.error('Error loading streak data:', error);
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-6 transition-all hover:shadow-2xl">
      <div className="flex justify-end mb-3">
        <div className="flex items-center gap-2 bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-2 rounded-xl shadow-sm border border-orange-100">
          <Flame className="w-5 h-5 text-orange-500" />
          <span className="text-xl font-bold text-gray-800">{streak}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-2 sm:gap-3">
        {weekDays.map((day, index) => (
          <div key={index} className="flex flex-col items-center gap-2">
            <span className="text-xs sm:text-sm font-medium text-gray-600">{day.day}</span>
            <div className={`${day.isToday ? 'p-1 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 border-2 border-orange-300' : ''}`}>
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm sm:text-base font-semibold transition-all ${
                  day.isCompleted
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-400 border-2 border-dashed border-gray-300'
                }`}
              >
                {String(day.date).padStart(2, '0')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
