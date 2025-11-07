import { useState } from 'react';
import { Lightbulb, Loader2, X, ArrowRight, RefreshCw } from 'lucide-react';

interface HealthierAlternativesProps {
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  goal: 'cut' | 'bulk';
  onClose: () => void;
}

interface Alternative {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  benefits: string[];
  swapTips: string;
}

export default function HealthierAlternatives({
  foodName,
  calories,
  protein,
  carbs,
  fats,
  goal,
  onClose,
}: HealthierAlternativesProps) {
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateAlternatives = async () => {
    setLoading(true);
    setError('');

    try {
      const prompt = `Suggest 3 healthier alternatives for "${foodName}" that would be better for someone whose goal is ${goal === 'cut' ? 'weight loss (cutting)' : 'muscle gain (bulking)'}.

IMPORTANT: The alternatives MUST be similar and relatable to "${foodName}". For example:
- If the food is a burger, suggest healthier burger variations (turkey burger, veggie burger, lean beef burger with healthier buns)
- If the food is pizza, suggest healthier pizza options (cauliflower crust, thin crust with lean toppings)
- If the food is pasta, suggest healthier pasta alternatives (whole wheat pasta, chickpea pasta, zucchini noodles)
- If the food is fried chicken, suggest grilled or baked chicken variations
- Keep the same food category and type, just make it healthier

DO NOT suggest completely different foods. The alternatives should feel like a natural swap that maintains the eating experience.

Current food nutrition:
- Calories: ${calories} kcal
- Protein: ${protein}g
- Carbs: ${carbs}g
- Fats: ${fats}g

Return ONLY a JSON array with this exact structure:
[
  {
    "name": "alternative food name",
    "description": "brief description of the food",
    "calories": estimated_calories_number,
    "protein": estimated_protein_grams,
    "carbs": estimated_carbs_grams,
    "fats": estimated_fats_grams,
    "benefits": ["benefit 1", "benefit 2", "benefit 3"],
    "swapTips": "practical tip on how to make this swap"
  }
]

For cutting: suggest similar foods with higher protein but lower calories/fats.
For bulking: suggest similar foods with higher protein and nutrient density.`;

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
        throw new Error('Failed to generate alternatives');
      }

      const data = await response.json();
      const content = data.candidates[0].content.parts[0].text;

      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }

      const suggestions: Alternative[] = JSON.parse(jsonMatch[0]);
      setAlternatives(suggestions);
    } catch (err: any) {
      console.error('Error generating alternatives:', err);
      setError(err.message || 'Failed to generate alternatives. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-amber-500 to-orange-600 p-4 sm:p-6 rounded-t-2xl sm:rounded-t-3xl z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-3">
              <Lightbulb className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-white">Healthier Alternatives</h2>
                <p className="text-xs sm:text-sm text-white/90 mt-1">
                  Better options for your {goal === 'cut' ? 'weight loss' : 'muscle gain'} goals
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
            <h3 className="font-semibold text-gray-800 mb-3">Current Food:</h3>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="font-bold text-gray-800 text-lg mb-3">{foodName}</h4>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center">
                  <div className="text-xs text-gray-600">Calories</div>
                  <div className="text-sm font-bold text-orange-600">{calories}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-600">Protein</div>
                  <div className="text-sm font-bold text-red-600">{Math.round(protein)}g</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-600">Carbs</div>
                  <div className="text-sm font-bold text-amber-600">{Math.round(carbs)}g</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-600">Fats</div>
                  <div className="text-sm font-bold text-yellow-600">{Math.round(fats)}g</div>
                </div>
              </div>
            </div>
          </div>

          {!alternatives.length && !loading && (
            <div className="text-center py-8">
              <Lightbulb className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <p className="text-gray-600 mb-6">
                Get AI-powered suggestions for healthier alternatives
              </p>
              <button
                onClick={generateAlternatives}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-amber-500/50"
              >
                Find Alternatives
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 text-amber-500 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600">Finding healthier alternatives...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-600 p-4 rounded-xl mb-4">
              {error}
            </div>
          )}

          {alternatives.length > 0 && (
            <div className="space-y-4">
              {alternatives.map((alt, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-white to-slate-50 rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all border border-slate-200"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <ArrowRight className="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 mb-1">{alt.name}</h3>
                      <p className="text-sm text-gray-600">{alt.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <div className={`rounded-lg p-2 text-center ${alt.calories < calories ? 'bg-green-50' : 'bg-orange-50'}`}>
                      <div className={`text-xs font-medium ${alt.calories < calories ? 'text-green-600' : 'text-orange-600'}`}>
                        Calories
                      </div>
                      <div className="text-sm font-bold text-gray-800">{alt.calories}</div>
                      {alt.calories < calories && (
                        <div className="text-xs text-green-600">↓ {calories - alt.calories}</div>
                      )}
                    </div>
                    <div className={`rounded-lg p-2 text-center ${alt.protein > protein ? 'bg-green-50' : 'bg-red-50'}`}>
                      <div className={`text-xs font-medium ${alt.protein > protein ? 'text-green-600' : 'text-red-600'}`}>
                        Protein
                      </div>
                      <div className="text-sm font-bold text-gray-800">{Math.round(alt.protein)}g</div>
                      {alt.protein > protein && (
                        <div className="text-xs text-green-600">↑ {Math.round(alt.protein - protein)}g</div>
                      )}
                    </div>
                    <div className={`rounded-lg p-2 text-center ${alt.carbs < carbs ? 'bg-green-50' : 'bg-amber-50'}`}>
                      <div className={`text-xs font-medium ${alt.carbs < carbs ? 'text-green-600' : 'text-amber-600'}`}>
                        Carbs
                      </div>
                      <div className="text-sm font-bold text-gray-800">{Math.round(alt.carbs)}g</div>
                    </div>
                    <div className={`rounded-lg p-2 text-center ${alt.fats < fats ? 'bg-green-50' : 'bg-yellow-50'}`}>
                      <div className={`text-xs font-medium ${alt.fats < fats ? 'text-green-600' : 'text-yellow-600'}`}>
                        Fats
                      </div>
                      <div className="text-sm font-bold text-gray-800">{Math.round(alt.fats)}g</div>
                    </div>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-3">
                    <div className="text-xs font-semibold text-emerald-800 mb-2">Benefits:</div>
                    <ul className="space-y-1">
                      {alt.benefits.map((benefit, i) => (
                        <li key={i} className="text-xs text-emerald-700 flex items-start gap-2">
                          <span className="text-emerald-500 mt-0.5">•</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-amber-800 mb-1">Swap Tip:</div>
                        <p className="text-xs text-amber-700">{alt.swapTips}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={generateAlternatives}
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-500/50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Refreshing...' : 'Refresh Alternatives'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
