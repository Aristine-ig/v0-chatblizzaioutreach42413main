import { useState } from 'react';
import { Sparkles, Loader2, ChefHat, X } from 'lucide-react';

interface MealRecommendationsProps {
  remainingCalories: number;
  remainingProtein: number;
  remainingCarbs: number;
  remainingFats: number;
  goal: 'cut' | 'bulk';
  onClose: () => void;
}

interface MealSuggestion {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  reason: string;
}

export default function MealRecommendations({
  remainingCalories,
  remainingProtein,
  remainingCarbs,
  remainingFats,
  goal,
  onClose,
}: MealRecommendationsProps) {
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateRecommendations = async () => {
    setLoading(true);
    setError('');

    try {
      const prompt = `Based on the following remaining daily nutrition targets, suggest 3 specific meal ideas that would help meet these goals. Current goal: ${goal === 'cut' ? 'weight loss' : 'muscle gain'}.

Remaining targets:
- Calories: ${remainingCalories} kcal
- Protein: ${remainingProtein}g
- Carbs: ${remainingCarbs}g
- Fats: ${remainingFats}g

Return ONLY a JSON array with this exact structure:
[
  {
    "name": "specific meal name",
    "description": "brief description with main ingredients",
    "calories": estimated_calories_number,
    "protein": estimated_protein_grams,
    "carbs": estimated_carbs_grams,
    "fats": estimated_fats_grams,
    "reason": "why this meal fits the remaining targets"
  }
]

Make sure each meal's nutrition values fit within or get close to the remaining targets. Prioritize ${goal === 'cut' ? 'high protein, lower calorie options' : 'high protein, nutrient-dense options'}.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate recommendations');
      }

      const data = await response.json();
      const content = data.candidates[0].content.parts[0].text;

      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }

      const recommendations: MealSuggestion[] = JSON.parse(jsonMatch[0]);
      setSuggestions(recommendations);
    } catch (err: any) {
      console.error('Error generating recommendations:', err);
      setError(err.message || 'Failed to generate recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-emerald-500 to-teal-600 p-4 sm:p-6 rounded-t-2xl sm:rounded-t-3xl z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-3">
              <ChefHat className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-white">Meal Recommendations</h2>
                <p className="text-xs sm:text-sm text-white/90 mt-1">
                  AI-powered suggestions for your remaining targets
                </p>
              </div>
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
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Remaining Daily Targets:</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="text-xs text-gray-600 mb-1">Calories</div>
                <div className="text-lg font-bold text-orange-600">{remainingCalories}</div>
                <div className="text-xs text-gray-500">kcal left</div>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="text-xs text-gray-600 mb-1">Protein</div>
                <div className="text-lg font-bold text-red-600">{Math.round(remainingProtein)}g</div>
                <div className="text-xs text-gray-500">left</div>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="text-xs text-gray-600 mb-1">Carbs</div>
                <div className="text-lg font-bold text-amber-600">{Math.round(remainingCarbs)}g</div>
                <div className="text-xs text-gray-500">left</div>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="text-xs text-gray-600 mb-1">Fats</div>
                <div className="text-lg font-bold text-yellow-600">{Math.round(remainingFats)}g</div>
                <div className="text-xs text-gray-500">left</div>
              </div>
            </div>
          </div>

          {!suggestions.length && !loading && (
            <div className="text-center py-8">
              <Sparkles className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <p className="text-gray-600 mb-6">
                Get personalized meal suggestions based on your remaining targets
              </p>
              <button
                onClick={generateRecommendations}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/50"
              >
                Generate Recommendations
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 text-emerald-500 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600">Generating personalized meal suggestions...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-600 p-4 rounded-xl mb-4">
              {error}
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="space-y-4">
              {suggestions.map((meal, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-white to-slate-50 rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all border border-slate-200"
                >
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{meal.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{meal.description}</p>

                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <div className="bg-orange-50 rounded-lg p-2 text-center">
                      <div className="text-xs text-orange-600 font-medium">Calories</div>
                      <div className="text-sm font-bold text-gray-800">{meal.calories}</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-2 text-center">
                      <div className="text-xs text-red-600 font-medium">Protein</div>
                      <div className="text-sm font-bold text-gray-800">{Math.round(meal.protein)}g</div>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-2 text-center">
                      <div className="text-xs text-amber-600 font-medium">Carbs</div>
                      <div className="text-sm font-bold text-gray-800">{Math.round(meal.carbs)}g</div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-2 text-center">
                      <div className="text-xs text-yellow-600 font-medium">Fats</div>
                      <div className="text-sm font-bold text-gray-800">{Math.round(meal.fats)}g</div>
                    </div>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-emerald-800 mb-1">Why this meal:</div>
                        <p className="text-xs text-emerald-700">{meal.reason}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={generateRecommendations}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Generate New Suggestions
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
