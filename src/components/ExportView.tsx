import { useState } from 'react';
import { supabase, FoodLog, UserProfile } from '../lib/supabase';
import { X, Download, FileText, FileSpreadsheet, Calendar } from 'lucide-react';
import { exportToCSV, exportToPDF } from '../utils/exportData';

interface ExportViewProps {
  userId: string;
  onClose: () => void;
}

export default function ExportView({ userId, onClose }: ExportViewProps) {
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const handleExport = async (format: 'csv' | 'pdf') => {
    setLoading(true);
    try {
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const { data: logsData } = await supabase
        .from('food_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('logged_at', start.toISOString())
        .lte('logged_at', end.toISOString())
        .order('logged_at', { ascending: false });

      if (!logsData || logsData.length === 0) {
        alert('No data found for the selected date range');
        return;
      }

      const options = {
        startDate: start,
        endDate: end,
      };

      if (format === 'csv') {
        exportToCSV(logsData as FoodLog[], profileData as UserProfile | null);
      } else {
        exportToPDF(logsData as FoodLog[], profileData as UserProfile | null, options);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 sm:p-6 rounded-t-2xl sm:rounded-t-3xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-3">
              <Download className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              <h2 className="text-lg sm:text-2xl font-bold text-white">Export Data</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">Select Date Range</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Export Format</h3>

            <button
              onClick={() => handleExport('csv')}
              disabled={loading}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500 rounded-lg group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-800">Export as CSV</div>
                  <div className="text-sm text-gray-600">Compatible with Excel and Google Sheets</div>
                </div>
              </div>
              <Download className="w-5 h-5 text-blue-600" />
            </button>

            <button
              onClick={() => handleExport('pdf')}
              disabled={loading}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 rounded-xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-500 rounded-lg group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-800">Export as PDF</div>
                  <div className="text-sm text-gray-600">Formatted report ready to print</div>
                </div>
              </div>
              <Download className="w-5 h-5 text-red-600" />
            </button>
          </div>

          {loading && (
            <div className="mt-4 text-center text-gray-600">
              Preparing export...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
