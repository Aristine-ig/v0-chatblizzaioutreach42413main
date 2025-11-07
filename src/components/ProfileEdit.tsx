import { useState, useEffect } from 'react';
import { supabase, UserProfile } from '../lib/supabase';
import { User, Scale, Ruler, Target, X, TrendingUp, Save } from 'lucide-react';

interface ProfileEditProps {
  userId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ProfileEdit({ userId, onClose, onUpdate }: ProfileEditProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState<'cut' | 'bulk'>('cut');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [weightHistory, setWeightHistory] = useState<Array<{ date: string; weight: number }>>([]);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        setProfile(data);
        setAge(data.age.toString());
        setHeight(data.height.toString());
        setWeight(data.weight.toString());
        setGoal(data.goal);

        const mockHistory = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return {
            date: date.toISOString().split('T')[0],
            weight: data.weight + (Math.random() - 0.5) * 2,
          };
        });
        setWeightHistory(mockHistory);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const ageNum = parseInt(age);
      const heightNum = parseFloat(height);
      const weightNum = parseFloat(weight);

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          age: ageNum,
          height: heightNum,
          weight: weightNum,
          goal,
        })
        .eq('id', userId);

      if (updateError) throw updateError;
      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  const weightChange = weightHistory.length >= 2
    ? weightHistory[weightHistory.length - 1].weight - weightHistory[0].weight
    : 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-emerald-500 to-teal-600 p-4 sm:p-6 rounded-t-2xl sm:rounded-t-3xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-3">
              <User className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              <h2 className="text-lg sm:text-2xl font-bold text-white">Edit Profile</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-6 rounded-xl sm:rounded-2xl mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              Weight Progress
            </h3>
            <div className="flex items-end justify-between gap-2 mb-4">
              {weightHistory.map((entry, index) => {
                const maxWeight = Math.max(...weightHistory.map(e => e.weight));
                const minWeight = Math.min(...weightHistory.map(e => e.weight));
                const range = maxWeight - minWeight || 1;
                const height = ((entry.weight - minWeight) / range) * 100 || 50;

                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-blue-200 rounded-t-lg" style={{ height: `${height}px`, minHeight: '20px' }}>
                      <div className="w-full h-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg"></div>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {new Date(entry.date).getDate()}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs sm:text-sm text-gray-600">Current Weight</div>
                <div className="text-xl sm:text-2xl font-bold text-gray-800">{profile.weight} kg</div>
              </div>
              <div className="text-right">
                <div className="text-xs sm:text-sm text-gray-600">7-Day Change</div>
                <div className={`text-lg sm:text-xl font-bold ${weightChange >= 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {weightChange >= 0 ? '+' : ''}{weightChange.toFixed(1)} kg
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 mr-2 text-gray-600" />
                Age (years)
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                placeholder="25"
                min="13"
                max="120"
                required
              />
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Ruler className="w-4 h-4 mr-2 text-gray-600" />
                Height (cm)
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                placeholder="170"
                min="100"
                max="250"
                step="0.1"
                required
              />
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Scale className="w-4 h-4 mr-2 text-gray-600" />
                Weight (kg)
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                placeholder="70"
                min="30"
                max="300"
                step="0.1"
                required
              />
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                <Target className="w-4 h-4 mr-2 text-gray-600" />
                Your Goal
              </label>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => setGoal('cut')}
                  className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all ${
                    goal === 'cut'
                      ? 'border-emerald-500 bg-emerald-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-sm sm:text-base font-semibold text-gray-800">Cut</div>
                  <div className="text-xs sm:text-sm text-gray-600">Lose weight</div>
                </button>
                <button
                  type="button"
                  onClick={() => setGoal('bulk')}
                  className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all ${
                    goal === 'bulk'
                      ? 'border-emerald-500 bg-emerald-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-sm sm:text-base font-semibold text-gray-800">Bulk</div>
                  <div className="text-xs sm:text-sm text-gray-600">Gain muscle</div>
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-600 p-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
