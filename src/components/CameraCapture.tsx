import { useState, useRef } from 'react';
import { Camera, X, Upload, Loader2, Flame, Beef, Cookie, Droplet, Lightbulb, ArrowRight, RefreshCw, Plus, Edit3 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ENV } from '../config/env';

interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface AnalysisResult {
  is_food: boolean;
  item_name?: string;
  description?: string;
  food_name?: string;
  serving_size?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  items?: FoodItem[];
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

interface CameraCaptureProps {
  userId: string;
  onClose: () => void;
  onFoodLogged: () => void;
  userGoal?: 'cut' | 'bulk';
}

export default function CameraCapture({ userId, onClose, onFoodLogged, userGoal = 'cut' }: CameraCaptureProps) {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualItemName, setManualItemName] = useState('');
  const [manualItemQuantity, setManualItemQuantity] = useState('');
  const [analyzingManualItem, setAnalyzingManualItem] = useState(false);
  const [useManualNutrition, setUseManualNutrition] = useState(false);
  const [manualCalories, setManualCalories] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualFats, setManualFats] = useState('');
  const [itemsAddedCount, setItemsAddedCount] = useState(0);

  const [editMode, setEditMode] = useState(false);
  const [editableData, setEditableData] = useState<AnalysisResult | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editableItem, setEditableItem] = useState<FoodItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeFood = async () => {
    if (!image) return;

    setAnalyzing(true);
    setError('');

    try {
      const base64Image = image.split(',')[1];

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${ENV.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: 'Analyze this image carefully. If it is NOT food or a beverage (e.g., a person, object, animal, scenery, etc.), return ONLY a JSON object with this structure: {"is_food": false, "item_name": "name of the item", "description": "brief description"}. If it IS food or a beverage, identify ALL individual food items visible and provide nutritional analysis FOR A STANDARD SERVING SIZE ONLY (not the entire plate or package). A standard serving is: 1 cup of food, 1 medium piece of fruit, 1 slice of bread, 100g of meat, 1 typical restaurant portion, etc. Return ONLY a JSON object with this exact structure: {"is_food": true, "food_name": "name of the meal/dish", "description": "detailed description including preparation method", "calories": total_calories_number, "protein": total_protein_number, "carbs": total_carbs_number, "fats": total_fats_number, "fiber": total_fiber_number, "sugar": total_sugar_number, "sodium": total_sodium_number, "serving_size": "standard serving size description", "items": [{"name": "individual item name", "calories": number, "protein": number, "carbs": number, "fats": number}, ...]}. CRITICAL: Estimate nutrition for standard/typical serving sizes, NOT the entire visible amount. The items array should list each food with its individual values for one standard serving. Top-level totals should be the SUM of all individual item standard servings. Protein, carbs, fats, fiber, sugar are in grams. Sodium is in milligrams. Use realistic, conservative estimates based on standard USDA serving sizes.',
                  },
                  {
                    inline_data: {
                      mime_type: 'image/jpeg',
                      data: base64Image,
                    },
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const data = await response.json();
      const content = data.candidates[0].content.parts[0].text;

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }

      const analysisData: AnalysisResult = JSON.parse(jsonMatch[0]);

      if (!analysisData.is_food) {
        setError(`This is ${analysisData.item_name} (${analysisData.description}). This is not a food item. Please take a photo of food to track your nutrition.`);
        return;
      }

      setAnalysisResult(analysisData);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze image. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirmLog = async () => {
    if (!analysisResult) return;

    const dataToLog = editableData || analysisResult;

    try {
      const { error: insertError } = await supabase.from('food_logs').insert({
        user_id: userId,
        food_name: dataToLog.food_name || 'Unknown Food',
        description: dataToLog.description || null,
        serving_size: dataToLog.serving_size || null,
        calories: dataToLog.calories,
        protein: dataToLog.protein,
        carbs: dataToLog.carbs,
        fats: dataToLog.fats,
        fiber: dataToLog.fiber || 0,
        sugar: dataToLog.sugar || 0,
        sodium: dataToLog.sodium || 0,
        image_url: image,
      });

      if (insertError) throw insertError;

      onFoodLogged();
    } catch (err: any) {
      console.error('Error logging food:', err);
      setError(err.message || 'Failed to log food. Please try again.');
    }
  };

  const handleRetake = () => {
    setImage(null);
    setAnalysisResult(null);
    setShowAlternatives(false);
    setAlternatives([]);
    setShowManualInput(false);
    setManualItemName('');
    setManualItemQuantity('');
    setManualCalories('');
    setManualProtein('');
    setManualCarbs('');
    setManualFats('');
    setUseManualNutrition(false);
    setItemsAddedCount(0);
    setEditMode(false);
    setEditableData(null);
    setError('');
  };

  const toggleEditMode = () => {
    if (!editMode) {
      setEditableData(analysisResult);
    }
    setEditMode(!editMode);
  };

  const startEditingItem = (index: number, item: FoodItem) => {
    setEditingItemIndex(index);
    setEditableItem({ ...item });
  };

  const saveEditedItem = () => {
    if (editingItemIndex === null || !editableItem || !analysisResult) return;

    const updatedItems = [...(analysisResult.items || [])];
    const oldItem = updatedItems[editingItemIndex];
    updatedItems[editingItemIndex] = editableItem;

    // Recalculate totals
    const newTotals = {
      calories: analysisResult.calories - oldItem.calories + editableItem.calories,
      protein: analysisResult.protein - oldItem.protein + editableItem.protein,
      carbs: analysisResult.carbs - oldItem.carbs + editableItem.carbs,
      fats: analysisResult.fats - oldItem.fats + editableItem.fats,
    };

    setAnalysisResult({
      ...analysisResult,
      items: updatedItems,
      ...newTotals,
    });

    setEditingItemIndex(null);
    setEditableItem(null);
  };

  const cancelEditingItem = () => {
    setEditingItemIndex(null);
    setEditableItem(null);
  };

  const deleteItem = (index: number) => {
    if (!analysisResult) return;

    const updatedItems = [...(analysisResult.items || [])];
    const deletedItem = updatedItems[index];
    updatedItems.splice(index, 1);

    // Recalculate totals
    const newTotals = {
      calories: analysisResult.calories - deletedItem.calories,
      protein: analysisResult.protein - deletedItem.protein,
      carbs: analysisResult.carbs - deletedItem.carbs,
      fats: analysisResult.fats - deletedItem.fats,
    };

    setAnalysisResult({
      ...analysisResult,
      items: updatedItems,
      ...newTotals,
    });

    // If we were editing this item, cancel the edit
    if (editingItemIndex === index) {
      setEditingItemIndex(null);
      setEditableItem(null);
    }
  };

  const analyzeManualItem = async (keepModalOpen = false) => {
    if (!manualItemName.trim() || !manualItemQuantity.trim()) {
      setError('Please provide both item name and quantity');
      return;
    }

    // If using manual nutrition entry, add directly without AI analysis
    if (useManualNutrition) {
      if (!manualCalories || !manualProtein || !manualCarbs || !manualFats) {
        setError('Please provide all nutrition values (calories, protein, carbs, fats)');
        return;
      }

      const newItem: FoodItem = {
        name: manualItemName.trim(),
        calories: parseFloat(manualCalories),
        protein: parseFloat(manualProtein),
        carbs: parseFloat(manualCarbs),
        fats: parseFloat(manualFats),
      };

      if (analysisResult) {
        const updatedItems = [...(analysisResult.items || []), newItem];

        setAnalysisResult({
          ...analysisResult,
          items: updatedItems,
          calories: analysisResult.calories + newItem.calories,
          protein: analysisResult.protein + newItem.protein,
          carbs: analysisResult.carbs + newItem.carbs,
          fats: analysisResult.fats + newItem.fats,
        });
      }

      setItemsAddedCount(itemsAddedCount + 1);

      // Reset manual input form fields
      setManualItemName('');
      setManualItemQuantity('');
      setManualCalories('');
      setManualProtein('');
      setManualCarbs('');
      setManualFats('');
      
      // Close modal if not keeping it open
      if (!keepModalOpen) {
        setShowManualInput(false);
        setUseManualNutrition(false);
        setItemsAddedCount(0);
      }
      return;
    }

    setAnalyzingManualItem(true);
    setError('');

    try {
      const prompt = `Analyze the nutritional content for: "${manualItemName}" with quantity/serving: "${manualItemQuantity}".

Provide nutritional information for exactly this quantity/serving size specified. If the quantity is not specific (like "1 piece", "a bowl"), use standard serving sizes.

Return ONLY a JSON object with this exact structure:
{
  "name": "food item name",
  "serving_size": "the serving size/quantity specified",
  "calories": estimated_calories_number,
  "protein": estimated_protein_grams,
  "carbs": estimated_carbs_grams,
  "fats": estimated_fats_grams,
  "fiber": estimated_fiber_grams,
  "sugar": estimated_sugar_grams,
  "sodium": estimated_sodium_milligrams
}

Use realistic estimates based on standard USDA nutritional data. All macros are in grams except sodium which is in milligrams.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${ENV.GEMINI_API_KEY}`,
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
        throw new Error('Failed to analyze manual item');
      }

      const data = await response.json();
      const content = data.candidates[0].content.parts[0].text;

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }

      const itemData = JSON.parse(jsonMatch[0]);

      // Add the manual item to the analysis result
      if (analysisResult) {
        const newItem: FoodItem = {
          name: itemData.name,
          calories: itemData.calories,
          protein: itemData.protein,
          carbs: itemData.carbs,
          fats: itemData.fats,
        };

        const updatedItems = [...(analysisResult.items || []), newItem];

        setAnalysisResult({
          ...analysisResult,
          items: updatedItems,
          calories: analysisResult.calories + itemData.calories,
          protein: analysisResult.protein + itemData.protein,
          carbs: analysisResult.carbs + itemData.carbs,
          fats: analysisResult.fats + itemData.fats,
          fiber: (analysisResult.fiber || 0) + (itemData.fiber || 0),
          sugar: (analysisResult.sugar || 0) + (itemData.sugar || 0),
          sodium: (analysisResult.sodium || 0) + (itemData.sodium || 0),
        });
      }

      setItemsAddedCount(itemsAddedCount + 1);

      // Reset manual input form fields
      setManualItemName('');
      setManualItemQuantity('');
      
      // Close modal if not keeping it open
      if (!keepModalOpen) {
        setShowManualInput(false);
        setItemsAddedCount(0);
      }
    } catch (err: any) {
      console.error('Manual item analysis error:', err);
      setError(err.message || 'Failed to analyze item. Please try again.');
    } finally {
      setAnalyzingManualItem(false);
    }
  };

  const generateAlternatives = async () => {
    if (!analysisResult) return;

    setLoadingAlternatives(true);
    setShowAlternatives(true);

    try {
      const prompt = `Suggest 3 healthier alternatives for "${analysisResult.food_name}" that would be better for someone whose goal is ${userGoal === 'cut' ? 'weight loss (cutting)' : 'muscle gain (bulking)'}.

IMPORTANT: The alternatives MUST be similar and relatable to "${analysisResult.food_name}". For example:
- If the food is a burger, suggest healthier burger variations (turkey burger, veggie burger, lean beef burger with healthier buns)
- If the food is pizza, suggest healthier pizza options (cauliflower crust, thin crust with lean toppings)
- If the food is pasta, suggest healthier pasta alternatives (whole wheat pasta, chickpea pasta, zucchini noodles)
- If the food is fried chicken, suggest grilled or baked chicken variations
- Keep the same food category and type, just make it healthier

DO NOT suggest completely different foods. The alternatives should feel like a natural swap that maintains the eating experience.

Current food nutrition:
- Calories: ${analysisResult.calories} kcal
- Protein: ${analysisResult.protein}g
- Carbs: ${analysisResult.carbs}g
- Fats: ${analysisResult.fats}g

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
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${ENV.GEMINI_API_KEY}`,
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
      setLoadingAlternatives(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <div className="flex justify-between items-center p-3 sm:p-4 bg-black/50">
        <h2 className="text-white font-semibold text-base sm:text-lg">Scan Food</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-3 sm:p-4">
        {!image ? (
          <div className="text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 sm:p-12 mb-6">
              <Camera className="w-16 h-16 sm:w-24 sm:h-24 text-white mx-auto mb-3 sm:mb-4" />
              <p className="text-white text-base sm:text-lg mb-2">Take a photo of your food</p>
              <p className="text-gray-300 text-xs sm:text-sm">We'll analyze the nutrition for you</p>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-xl transition-colors flex items-center gap-2 sm:gap-3 mx-auto text-sm sm:text-base"
            >
              <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
              Upload Photo
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div className="w-full max-w-4xl">
            <img
              src={image}
              alt="Food"
              className="w-full rounded-xl sm:rounded-2xl shadow-2xl mb-4 sm:mb-6"
            />

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-white p-3 sm:p-4 rounded-xl mb-3 sm:mb-4 text-xs sm:text-sm">
                {error}
              </div>
            )}

            {analysisResult && (
              <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 max-h-[50vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-bold text-lg sm:text-xl">
                    {editMode && editableData ? (
                      <input
                        type="text"
                        value={editableData.food_name || ''}
                        onChange={(e) => setEditableData({ ...editableData, food_name: e.target.value })}
                        className="bg-white/10 border border-white/30 rounded-lg px-3 py-1 text-white w-full"
                      />
                    ) : (
                      analysisResult.food_name
                    )}
                  </h3>
                  <button
                    onClick={toggleEditMode}
                    className="ml-2 p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-5 h-5 text-white" />
                  </button>
                </div>

                {analysisResult.serving_size && (
                  <p className="text-white/80 text-xs sm:text-sm mb-3">
                    Serving: {analysisResult.serving_size}
                  </p>
                )}

                {analysisResult.description && (
                  <p className="text-white/90 text-xs sm:text-sm mb-4 leading-relaxed">
                    {analysisResult.description}
                  </p>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
                  <div className="bg-orange-500/20 backdrop-blur-sm rounded-lg p-3 border border-orange-500/30">
                    <Flame className="w-4 h-4 text-orange-300 mb-1" />
                    <div className="text-xs text-orange-200">Calories</div>
                    {editMode && editableData ? (
                      <input
                        type="number"
                        value={editableData.calories}
                        onChange={(e) => setEditableData({ ...editableData, calories: Number(e.target.value) })}
                        className="w-full bg-white/10 border border-white/30 rounded px-2 py-1 text-lg sm:text-xl font-bold text-white"
                      />
                    ) : (
                      <div className="text-lg sm:text-xl font-bold text-white">{analysisResult.calories}</div>
                    )}
                    <div className="text-xs text-orange-200">kcal</div>
                  </div>
                  <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-3 border border-red-500/30">
                    <Beef className="w-4 h-4 text-red-300 mb-1" />
                    <div className="text-xs text-red-200">Protein</div>
                    {editMode && editableData ? (
                      <input
                        type="number"
                        value={Math.round(editableData.protein)}
                        onChange={(e) => setEditableData({ ...editableData, protein: Number(e.target.value) })}
                        className="w-full bg-white/10 border border-white/30 rounded px-2 py-1 text-lg sm:text-xl font-bold text-white"
                      />
                    ) : (
                      <div className="text-lg sm:text-xl font-bold text-white">{Math.round(analysisResult.protein)}g</div>
                    )}
                  </div>
                  <div className="bg-amber-500/20 backdrop-blur-sm rounded-lg p-3 border border-amber-500/30">
                    <Cookie className="w-4 h-4 text-amber-300 mb-1" />
                    <div className="text-xs text-amber-200">Carbs</div>
                    {editMode && editableData ? (
                      <input
                        type="number"
                        value={Math.round(editableData.carbs)}
                        onChange={(e) => setEditableData({ ...editableData, carbs: Number(e.target.value) })}
                        className="w-full bg-white/10 border border-white/30 rounded px-2 py-1 text-lg sm:text-xl font-bold text-white"
                      />
                    ) : (
                      <div className="text-lg sm:text-xl font-bold text-white">{Math.round(analysisResult.carbs)}g</div>
                    )}
                  </div>
                  <div className="bg-yellow-500/20 backdrop-blur-sm rounded-lg p-3 border border-yellow-500/30">
                    <Droplet className="w-4 h-4 text-yellow-300 mb-1" />
                    <div className="text-xs text-yellow-200">Fats</div>
                    {editMode && editableData ? (
                      <input
                        type="number"
                        value={Math.round(editableData.fats)}
                        onChange={(e) => setEditableData({ ...editableData, fats: Number(e.target.value) })}
                        className="w-full bg-white/10 border border-white/30 rounded px-2 py-1 text-lg sm:text-xl font-bold text-white"
                      />
                    ) : (
                      <div className="text-lg sm:text-xl font-bold text-white">{Math.round(analysisResult.fats)}g</div>
                    )}
                  </div>
                </div>

                {analysisResult.items && analysisResult.items.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-white font-semibold text-sm sm:text-base mb-3">Individual Items:</h4>
                    <div className="space-y-2">
                      {analysisResult.items.map((item, index) => (
                        <div
                          key={index}
                          className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10"
                        >
                          {editingItemIndex === index && editableItem ? (
                            <div className="space-y-3">
                              <input
                                type="text"
                                value={editableItem.name}
                                onChange={(e) => setEditableItem({ ...editableItem, name: e.target.value })}
                                className="w-full bg-white/10 border border-white/30 rounded-lg px-3 py-2 text-white text-sm"
                                placeholder="Item name"
                              />
                              <div className="grid grid-cols-4 gap-2">
                                <div>
                                  <label className="text-xs text-orange-300 block mb-1">Calories</label>
                                  <input
                                    type="number"
                                    value={editableItem.calories}
                                    onChange={(e) => setEditableItem({ ...editableItem, calories: Number(e.target.value) })}
                                    className="w-full bg-white/10 border border-white/30 rounded px-2 py-1 text-white text-sm"
                                    min="0"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-red-300 block mb-1">Protein (g)</label>
                                  <input
                                    type="number"
                                    value={editableItem.protein}
                                    onChange={(e) => setEditableItem({ ...editableItem, protein: Number(e.target.value) })}
                                    className="w-full bg-white/10 border border-white/30 rounded px-2 py-1 text-white text-sm"
                                    min="0"
                                    step="0.1"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-amber-300 block mb-1">Carbs (g)</label>
                                  <input
                                    type="number"
                                    value={editableItem.carbs}
                                    onChange={(e) => setEditableItem({ ...editableItem, carbs: Number(e.target.value) })}
                                    className="w-full bg-white/10 border border-white/30 rounded px-2 py-1 text-white text-sm"
                                    min="0"
                                    step="0.1"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-yellow-300 block mb-1">Fats (g)</label>
                                  <input
                                    type="number"
                                    value={editableItem.fats}
                                    onChange={(e) => setEditableItem({ ...editableItem, fats: Number(e.target.value) })}
                                    className="w-full bg-white/10 border border-white/30 rounded px-2 py-1 text-white text-sm"
                                    min="0"
                                    step="0.1"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={cancelEditingItem}
                                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={saveEditedItem}
                                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition-colors"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start justify-between mb-2">
                                <div className="text-white font-medium text-sm">{item.name}</div>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => startEditingItem(index, item)}
                                    className="p-1 hover:bg-white/10 rounded transition-colors"
                                    title="Edit item"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-white/70" />
                                  </button>
                                  <button
                                    onClick={() => deleteItem(index)}
                                    className="p-1 hover:bg-red-500/20 rounded transition-colors"
                                    title="Delete item"
                                  >
                                    <X className="w-3.5 h-3.5 text-red-400" />
                                  </button>
                                </div>
                              </div>
                              <div className="grid grid-cols-4 gap-2 text-xs">
                                <div>
                                  <span className="text-orange-300">{item.calories}</span>
                                  <span className="text-white/60"> kcal</span>
                                </div>
                                <div>
                                  <span className="text-red-300">{Math.round(item.protein)}g</span>
                                  <span className="text-white/60"> protein</span>
                                </div>
                                <div>
                                  <span className="text-amber-300">{Math.round(item.carbs)}g</span>
                                  <span className="text-white/60"> carbs</span>
                                </div>
                                <div>
                                  <span className="text-yellow-300">{Math.round(item.fats)}g</span>
                                  <span className="text-white/60"> fats</span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {showAlternatives && analysisResult && (
              <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 border border-amber-500/30">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-amber-300" />
                  <h3 className="text-white font-bold text-base sm:text-lg">Healthier Alternatives</h3>
                </div>

                {loadingAlternatives ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-10 h-10 text-amber-300 mx-auto mb-3 animate-spin" />
                    <p className="text-white/80 text-sm">Finding healthier alternatives...</p>
                  </div>
                ) : alternatives.length > 0 ? (
                  <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                    {alternatives.map((alt, index) => (
                      <div
                        key={index}
                        className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/20"
                      >
                        <div className="flex items-start gap-2 mb-3">
                          <ArrowRight className="w-4 h-4 text-emerald-300 mt-1 flex-shrink-0" />
                          <div>
                            <h4 className="text-white font-bold text-sm sm:text-base mb-1">{alt.name}</h4>
                            <p className="text-white/70 text-xs sm:text-sm">{alt.description}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2 mb-3">
                          <div className={`rounded-lg p-2 text-center ${alt.calories < analysisResult.calories ? 'bg-green-500/20 border border-green-500/30' : 'bg-white/5 border border-white/10'}`}>
                            <div className="text-xs text-white/70">Cal</div>
                            <div className="text-sm font-bold text-white">{alt.calories}</div>
                            {alt.calories < analysisResult.calories && (
                              <div className="text-xs text-green-300">-{analysisResult.calories - alt.calories}</div>
                            )}
                          </div>
                          <div className={`rounded-lg p-2 text-center ${alt.protein > analysisResult.protein ? 'bg-green-500/20 border border-green-500/30' : 'bg-white/5 border border-white/10'}`}>
                            <div className="text-xs text-white/70">Pro</div>
                            <div className="text-sm font-bold text-white">{Math.round(alt.protein)}g</div>
                            {alt.protein > analysisResult.protein && (
                              <div className="text-xs text-green-300">+{Math.round(alt.protein - analysisResult.protein)}g</div>
                            )}
                          </div>
                          <div className={`rounded-lg p-2 text-center ${alt.carbs < analysisResult.carbs ? 'bg-green-500/20 border border-green-500/30' : 'bg-white/5 border border-white/10'}`}>
                            <div className="text-xs text-white/70">Carbs</div>
                            <div className="text-sm font-bold text-white">{Math.round(alt.carbs)}g</div>
                          </div>
                          <div className={`rounded-lg p-2 text-center ${alt.fats < analysisResult.fats ? 'bg-green-500/20 border border-green-500/30' : 'bg-white/5 border border-white/10'}`}>
                            <div className="text-xs text-white/70">Fats</div>
                            <div className="text-sm font-bold text-white">{Math.round(alt.fats)}g</div>
                          </div>
                        </div>

                        <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-2 sm:p-3 mb-2">
                          <div className="text-xs font-semibold text-emerald-200 mb-1">Benefits:</div>
                          <ul className="space-y-1">
                            {alt.benefits.map((benefit, i) => (
                              <li key={i} className="text-xs text-emerald-100 flex items-start gap-1">
                                <span className="text-emerald-300">•</span>
                                <span>{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-2 sm:p-3">
                          <div className="flex items-start gap-1">
                            <Lightbulb className="w-3 h-3 text-amber-300 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="text-xs font-semibold text-amber-200 mb-1">Swap Tip:</div>
                              <p className="text-xs text-amber-100">{alt.swapTips}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={generateAlternatives}
                      disabled={loadingAlternatives}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-500/50"
                    >
                      <RefreshCw className={`w-4 h-4 ${loadingAlternatives ? 'animate-spin' : ''}`} />
                      {loadingAlternatives ? 'Refreshing...' : 'Refresh Alternatives'}
                    </button>
                  </div>
                ) : null}
              </div>
            )}

            <div className="space-y-3 sm:space-y-4">
              {analysisResult && !showAlternatives && (
                <button
                  onClick={generateAlternatives}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold py-3 sm:py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base shadow-lg hover:shadow-amber-500/50"
                >
                  <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5" />
                  Get Healthier Alternatives
                </button>
              )}

              {analysisResult && (
                <button
                  onClick={() => setShowManualInput(true)}
                  className="w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-white font-semibold px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Missed/Misidentified Item
                </button>
              )}

              <div className="flex gap-3 sm:gap-4">
                <button
                  onClick={handleRetake}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 sm:py-4 rounded-xl transition-colors text-sm sm:text-base"
                  disabled={analyzing}
                >
                  Retake
                </button>
                {!analysisResult ? (
                  <button
                    onClick={analyzeFood}
                    disabled={analyzing}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 sm:py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      'Analyze Food'
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleConfirmLog}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 sm:py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    Confirm & Log
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Manual Item Input Modal */}
      {showManualInput && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold text-lg">Add Item Manually</h3>
              <button
                onClick={() => {
                  setShowManualInput(false);
                  setManualItemName('');
                  setManualItemQuantity('');
                  setManualCalories('');
                  setManualProtein('');
                  setManualCarbs('');
                  setManualFats('');
                  setUseManualNutrition(false);
                  setError('');
                }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="flex items-center justify-between mb-4">
              <p className="text-white/70 text-sm">
                Describe the item that was missed or misidentified in the photo
              </p>
              {itemsAddedCount > 0 && (
                <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-lg px-3 py-1">
                  <span className="text-emerald-300 text-xs font-semibold">
                    {itemsAddedCount} item{itemsAddedCount !== 1 ? 's' : ''} added
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-white text-sm font-medium block mb-2">
                  What is it?
                </label>
                <input
                  type="text"
                  value={manualItemName}
                  onChange={(e) => setManualItemName(e.target.value)}
                  placeholder="e.g., Grilled chicken breast, Apple, Rice"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-white text-sm font-medium block mb-2">
                  Quantity/Serving Size
                </label>
                <input
                  type="text"
                  value={manualItemQuantity}
                  onChange={(e) => setManualItemQuantity(e.target.value)}
                  placeholder="e.g., 150g, 1 medium, 2 cups, 1 piece"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="border-t border-white/10 pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useManualNutrition}
                    onChange={(e) => setUseManualNutrition(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
                  />
                  <span className="text-white text-sm font-medium">
                    Enter nutrition values manually
                  </span>
                </label>
                <p className="text-white/50 text-xs mt-1 ml-7">
                  Skip AI analysis and add exact nutrition data
                </p>
              </div>

              {useManualNutrition && (
                <div className="space-y-3 bg-white/5 p-4 rounded-lg border border-white/10">
                  <div>
                    <label className="flex items-center text-white text-sm font-medium mb-2">
                      <Flame className="w-4 h-4 mr-2 text-orange-400" />
                      Calories (kcal)
                    </label>
                    <input
                      type="number"
                      value={manualCalories}
                      onChange={(e) => setManualCalories(e.target.value)}
                      placeholder="0"
                      min="0"
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="flex flex-col text-white text-xs font-medium mb-2">
                        <Beef className="w-3 h-3 mb-1 text-red-400" />
                        Protein (g)
                      </label>
                      <input
                        type="number"
                        value={manualProtein}
                        onChange={(e) => setManualProtein(e.target.value)}
                        placeholder="0"
                        min="0"
                        step="0.1"
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-2 py-2 text-white placeholder-white/50 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                      />
                    </div>

                    <div>
                      <label className="flex flex-col text-white text-xs font-medium mb-2">
                        <Cookie className="w-3 h-3 mb-1 text-amber-400" />
                        Carbs (g)
                      </label>
                      <input
                        type="number"
                        value={manualCarbs}
                        onChange={(e) => setManualCarbs(e.target.value)}
                        placeholder="0"
                        min="0"
                        step="0.1"
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-2 py-2 text-white placeholder-white/50 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                      />
                    </div>

                    <div>
                      <label className="flex flex-col text-white text-xs font-medium mb-2">
                        <Droplet className="w-3 h-3 mb-1 text-yellow-400" />
                        Fats (g)
                      </label>
                      <input
                        type="number"
                        value={manualFats}
                        onChange={(e) => setManualFats(e.target.value)}
                        placeholder="0"
                        min="0"
                        step="0.1"
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-2 py-2 text-white placeholder-white/50 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-500/20 border border-red-500 text-white p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2 pt-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowManualInput(false);
                      setManualItemName('');
                      setManualItemQuantity('');
                      setManualCalories('');
                      setManualProtein('');
                      setManualCarbs('');
                      setManualFats('');
                      setUseManualNutrition(false);
                      setItemsAddedCount(0);
                      setError('');
                    }}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-3 rounded-xl transition-colors"
                  >
                    {itemsAddedCount > 0 ? 'Done' : 'Cancel'}
                  </button>
                  <button
                    onClick={() => analyzeManualItem(false)}
                    disabled={
                      analyzingManualItem ||
                      !manualItemName.trim() ||
                      !manualItemQuantity.trim() ||
                      (useManualNutrition &&
                        (!manualCalories || !manualProtein || !manualCarbs || !manualFats))
                    }
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {analyzingManualItem ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      'Add & Close'
                    )}
                  </button>
                </div>

                <button
                  onClick={() => analyzeManualItem(true)}
                  disabled={
                    analyzingManualItem ||
                    !manualItemName.trim() ||
                    !manualItemQuantity.trim() ||
                    (useManualNutrition &&
                      (!manualCalories || !manualProtein || !manualCarbs || !manualFats))
                  }
                  className="w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add & Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
