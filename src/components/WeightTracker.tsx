import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Scale, X, Plus, TrendingUp, TrendingDown, Minus, Trash2, Calendar } from 'lucide-react';

interface WeightTrackerProps {
  userId: string;
  onClose: () => void;
}

interface WeightLog {
  id: string;
  weight: number;
  logged_at: string;
  notes: string | null;
}

export default function WeightTracker({ userId, onClose }: WeightTrackerProps) {
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadWeightLogs();
  }, [userId]);

  const loadWeightLogs = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('weight_logs')
        .select('*')
        .eq('user_id', userId)
        .order('logged_at', { ascending: false });

      if (data) {
        setWeightLogs(data);
      }
    } catch (error) {
      console.error('Error loading weight logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWeight = async () => {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0) {
      alert('Please enter a valid weight');
      return;
    }

    try {
      const loggedAtDate = new Date(selectedDate);
      loggedAtDate.setHours(12, 0, 0, 0);

      const { error } = await supabase
        .from('weight_logs')
        .insert({
          user_id: userId,
          weight: weight,
          notes: newNotes.trim() || null,
          logged_at: loggedAtDate.toISOString(),
        });

      if (error) throw error;

      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ weight: weight })
        .eq('id', userId);

      if (profileError) console.error('Error updating profile weight:', profileError);

      setNewWeight('');
      setNewNotes('');
      setSelectedDate(new Date().toISOString().split('T')[0]);
      setShowAddForm(false);
      loadWeightLogs();
    } catch (error) {
      console.error('Error adding weight:', error);
      alert('Failed to add weight log');
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!confirm('Are you sure you want to delete this weight entry?')) return;

    try {
      const { error } = await supabase
        .from('weight_logs')
        .delete()
        .eq('id', logId);

      if (error) throw error;
      loadWeightLogs();
    } catch (error) {
      console.error('Error deleting weight log:', error);
    }
  };

  const calculateTrend = () => {
    if (weightLogs.length < 2) return null;

    const latestWeight = weightLogs[0].weight;
    const oldestWeight = weightLogs[weightLogs.length - 1].weight;
    const diff = latestWeight - oldestWeight;

    return {
      direction: diff < 0 ? 'down' : diff > 0 ? 'up' : 'stable',
      value: Math.abs(diff).toFixed(1),
    };
  };

  const currentWeight = weightLogs.length > 0 ? weightLogs[0].weight : null;
  const trend = calculateTrend();
  const avgWeight = weightLogs.length > 0
    ? (weightLogs.reduce((sum, log) => sum + log.weight, 0) / weightLogs.length).toFixed(1)
    : null;

  const maxWeight = Math.max(...weightLogs.map(log => log.weight), 100);
  const minWeight = Math.min(...weightLogs.map(log => log.weight), 50);
  const range = maxWeight - minWeight;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-violet-500 to-purple-600 p-4 sm:p-6 rounded-t-2xl sm:rounded-t-3xl z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-3">
              <Scale className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              <h2 className="text-lg sm:text-2xl font-bold text-white">Weight Tracker</h2>
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
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading weight data...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
                {currentWeight && (
                  <div className="bg-gradient-to-br from-violet-50 to-violet-100 p-4 rounded-2xl">
                    <div className="text-sm text-violet-600 font-medium mb-1">Current Weight</div>
                    <div className="text-3xl font-bold text-gray-800">{currentWeight} kg</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {new Date(weightLogs[0].logged_at).toLocaleDateString()}
                    </div>
                  </div>
                )}

                {trend && (
                  <div className={`bg-gradient-to-br p-4 rounded-2xl ${
                    trend.direction === 'down' ? 'from-green-50 to-green-100' :
                    trend.direction === 'up' ? 'from-red-50 to-red-100' :
                    'from-gray-50 to-gray-100'
                  }`}>
                    <div className={`text-sm font-medium mb-1 ${
                      trend.direction === 'down' ? 'text-green-600' :
                      trend.direction === 'up' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      Trend
                    </div>
                    <div className="flex items-center gap-2">
                      {trend.direction === 'down' ? <TrendingDown className="w-6 h-6 text-green-600" /> :
                       trend.direction === 'up' ? <TrendingUp className="w-6 h-6 text-red-600" /> :
                       <Minus className="w-6 h-6 text-gray-600" />}
                      <span className="text-3xl font-bold text-gray-800">{trend.value} kg</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {trend.direction === 'down' ? 'Lost' : trend.direction === 'up' ? 'Gained' : 'No change'}
                    </div>
                  </div>
                )}

                {avgWeight && (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-2xl">
                    <div className="text-sm text-blue-600 font-medium mb-1">Average</div>
                    <div className="text-3xl font-bold text-gray-800">{avgWeight} kg</div>
                    <div className="text-xs text-gray-600 mt-1">Across {weightLogs.length} entries</div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowAddForm(true)}
                className="w-full mb-6 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Add Weight Entry
              </button>

              {weightLogs.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Weight History
                  </h3>

                  <div className="space-y-3">
                    {weightLogs.map((log) => {
                      const normalizedWeight = range > 0 ? ((log.weight - minWeight) / range) * 100 : 50;

                      return (
                        <div
                          key={log.id}
                          className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl hover:shadow-md transition-all group"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-baseline gap-3">
                                <span className="text-2xl font-bold text-gray-800">{log.weight} kg</span>
                                <span className="text-sm text-gray-600">
                                  {new Date(log.logged_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </span>
                              </div>
                              {log.notes && (
                                <p className="text-sm text-gray-600 mt-2">{log.notes}</p>
                              )}
                            </div>
                            <button
                              onClick={() => handleDeleteLog(log.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mt-3">
                            <div
                              className="bg-gradient-to-r from-violet-400 to-purple-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${normalizedWeight}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Scale className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No weight entries yet</p>
                  <p className="text-sm text-gray-400 mt-2">Start tracking your weight to see trends over time</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Add Weight Entry</h3>

            <div className="space-y-4">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Scale className="w-4 h-4 mr-2 text-violet-500" />
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="70.5"
                  autoFocus
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 mr-2 text-violet-500" />
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Notes (optional)
                </label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Add notes about this entry..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewWeight('');
                  setNewNotes('');
                  setSelectedDate(new Date().toISOString().split('T')[0]);
                }}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddWeight}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all"
              >
                Add Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
