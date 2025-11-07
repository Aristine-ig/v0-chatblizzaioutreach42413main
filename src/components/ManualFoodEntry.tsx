import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Plus, Flame, Beef, Cookie, Droplet, Wheat, Candy, Sparkles, Search, Loader2 } from 'lucide-react';
import { searchFoodByName, ProductNutrition } from '../utils/openFoodFacts';

interface ManualFoodEntryProps {
  userId: string;
  onClose: () => void;
  onFoodLogged: () => void;
}

export default function ManualFoodEntry({ userId, onClose, onFoodLogged }: ManualFoodEntryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [foodName, setFoodName] = useState('');
  const [description, setDescription] = useState('');
  const [servingSize, setServingSize] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [fiber, setFiber] = useState('');
  const [sugar, setSugar] = useState('');
  const [sodium, setSodium] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ProductNutrition[]>([]);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      setSearchResults([]);
      return;
    }

    if (trimmedQuery.length < 2) {
      setError('Please enter at least 2 characters to search');
      return;
    }

    setSearching(true);
    setError('');
    setSearchResults([]);

    try {
      const results = await searchFoodByName(trimmedQuery);
      setSearchResults(results);

      if (results.length === 0) {
        setError('No results found. Try different keywords or enter nutritional values manually below.');
      }
    } catch (err: any) {
      console.error('Error searching food:', err);
      setError('Search failed. Please try again or enter values manually below.');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectFood = (food: ProductNutrition) => {
    setFoodName(food.foodName);
    setDescription(food.description);
    setServingSize(food.servingSize);
    setCalories(food.calories.toString());
    setProtein(food.protein.toString());
    setCarbs(food.carbs.toString());
    setFats(food.fats.toString());
    setFiber(food.fiber.toString());
    setSugar(food.sugar.toString());
    setSodium(food.sodium.toString());
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: insertError } = await supabase.from('food_logs').insert({
        user_id: userId,
        food_name: foodName,
        description: description || null,
        serving_size: servingSize || null,
        calories: parseInt(calories) || 0,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fats: parseFloat(fats) || 0,
        fiber: parseFloat(fiber) || 0,
        sugar: parseFloat(sugar) || 0,
        sodium: parseFloat(sodium) || 0,
      });

      if (insertError) throw insertError;

      onFoodLogged();
    } catch (err: any) {
      console.error('Error logging food:', err);
      setError(err.message || 'Failed to log food. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 sm:p-6 rounded-t-2xl sm:rounded-t-3xl sticky top-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-3">
              <Plus className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              <h2 className="text-lg sm:text-2xl font-bold text-white">Add Food Manually</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Food Database
            </label>
            <p className="text-xs text-gray-500 mb-2">Search for common foods or branded products</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                placeholder="e.g., grilled chicken, banana, white rice"
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
                className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {searching ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="hidden sm:inline text-sm">Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span className="hidden sm:inline text-sm">Search</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2 bg-emerald-50 p-3 rounded-xl border-2 border-emerald-200">
              <p className="text-sm font-semibold text-emerald-800">
                Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} - Select one:
              </p>
              <div className="max-h-80 overflow-y-auto space-y-2">
                {searchResults.map((food, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectFood(food)}
                    className="w-full text-left p-3 bg-white hover:bg-emerald-100 border-2 border-emerald-200 hover:border-emerald-400 rounded-xl transition-all shadow-sm hover:shadow-md"
                  >
                    <div className="font-semibold text-gray-900">{food.foodName}</div>
                    {food.description !== food.foodName && (
                      <div className="text-xs text-gray-600 mt-1">{food.description}</div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">Serving: {food.servingSize}</div>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs font-medium">
                      <span className="flex items-center gap-1 bg-orange-100 px-2 py-1 rounded-lg">
                        <Flame className="w-3 h-3 text-orange-600" />
                        {food.calories} cal
                      </span>
                      <span className="flex items-center gap-1 bg-red-100 px-2 py-1 rounded-lg">
                        <Beef className="w-3 h-3 text-red-600" />
                        P: {food.protein}g
                      </span>
                      <span className="flex items-center gap-1 bg-amber-100 px-2 py-1 rounded-lg">
                        <Cookie className="w-3 h-3 text-amber-600" />
                        C: {food.carbs}g
                      </span>
                      <span className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded-lg">
                        <Droplet className="w-3 h-3 text-yellow-600" />
                        F: {food.fats}g
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="border-t-2 border-gray-200 pt-3">
            <p className="text-sm font-medium text-gray-700 mb-3">Or Enter Manually</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Food Name
            </label>
            <input
              type="text"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              placeholder="e.g., Grilled Chicken Breast"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none"
              placeholder="e.g., Marinated and grilled, served with vegetables"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Serving Size (Optional)
            </label>
            <input
              type="text"
              value={servingSize}
              onChange={(e) => setServingSize(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              placeholder="e.g., 200g, 1 cup, 1 piece"
            />
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Flame className="w-4 h-4 mr-2 text-orange-500" />
              Calories (kcal)
            </label>
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              placeholder="0"
              min="0"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div>
              <label className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm font-medium text-gray-700 mb-2">
                <Beef className="w-3 h-3 mr-1 text-red-500" />
                <span>Protein (g)</span>
              </label>
              <input
                type="number"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                className="w-full px-2 sm:px-3 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm"
                placeholder="0"
                min="0"
                step="0.1"
                required
              />
            </div>

            <div>
              <label className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm font-medium text-gray-700 mb-2">
                <Cookie className="w-3 h-3 mr-1 text-amber-500" />
                <span>Carbs (g)</span>
              </label>
              <input
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                className="w-full px-2 sm:px-3 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm"
                placeholder="0"
                min="0"
                step="0.1"
                required
              />
            </div>

            <div>
              <label className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm font-medium text-gray-700 mb-2">
                <Droplet className="w-3 h-3 mr-1 text-yellow-500" />
                <span>Fats (g)</span>
              </label>
              <input
                type="number"
                value={fats}
                onChange={(e) => setFats(e.target.value)}
                className="w-full px-2 sm:px-3 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm"
                placeholder="0"
                min="0"
                step="0.1"
                required
              />
            </div>
          </div>

          <div className="border-t-2 border-gray-100 pt-3">
            <p className="text-xs font-medium text-gray-600 mb-3">Additional Details (Optional)</p>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div>
                <label className="flex flex-col sm:flex-row sm:items-center text-xs font-medium text-gray-600 mb-2">
                  <Wheat className="w-3 h-3 mr-1 text-amber-600" />
                  <span>Fiber (g)</span>
                </label>
                <input
                  type="number"
                  value={fiber}
                  onChange={(e) => setFiber(e.target.value)}
                  className="w-full px-2 sm:px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm"
                  placeholder="0"
                  min="0"
                  step="0.1"
                />
              </div>

              <div>
                <label className="flex flex-col sm:flex-row sm:items-center text-xs font-medium text-gray-600 mb-2">
                  <Candy className="w-3 h-3 mr-1 text-pink-500" />
                  <span>Sugar (g)</span>
                </label>
                <input
                  type="number"
                  value={sugar}
                  onChange={(e) => setSugar(e.target.value)}
                  className="w-full px-2 sm:px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm"
                  placeholder="0"
                  min="0"
                  step="0.1"
                />
              </div>

              <div>
                <label className="flex flex-col sm:flex-row sm:items-center text-xs font-medium text-gray-600 mb-2">
                  <Sparkles className="w-3 h-3 mr-1 text-blue-500" />
                  <span>Sodium (mg)</span>
                </label>
                <input
                  type="number"
                  value={sodium}
                  onChange={(e) => setSodium(e.target.value)}
                  className="w-full px-2 sm:px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm"
                  placeholder="0"
                  min="0"
                  step="0.1"
                />
              </div>
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
              className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Food'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
