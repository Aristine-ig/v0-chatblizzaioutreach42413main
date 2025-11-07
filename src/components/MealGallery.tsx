import { useState, useEffect } from 'react';
import { supabase, FoodLog } from '../lib/supabase';
import { X, Image as ImageIcon, Calendar, ChevronLeft, ChevronRight, Trash2, Wheat, Candy, Sparkles, Share2, Facebook, Copy } from 'lucide-react';
import { socialService } from '../services/socialService';
import { platformShareService } from '../services/platformShareService';

interface MealGalleryProps {
  userId: string;
  onClose: () => void;
  inline?: boolean;
}

export default function MealGallery({ userId, onClose, inline = false }: MealGalleryProps) {
  const [meals, setMeals] = useState<FoodLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState<FoodLog | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [sharing, setSharing] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState('');
  const [shareMode, setShareMode] = useState<'platform' | 'internal'>('internal');
  const mealsPerPage = 12;

  useEffect(() => {
    loadMeals();
  }, [userId]);

  const loadMeals = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('food_logs')
        .select('*')
        .eq('user_id', userId)
        .not('image_url', 'is', null)
        .order('logged_at', { ascending: false });

      if (data) {
        setMeals(data);
      }
    } catch (error) {
      console.error('Error loading meals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    if (!confirm('Are you sure you want to delete this meal?')) return;

    try {
      const { error } = await supabase
        .from('food_logs')
        .delete()
        .eq('id', mealId);

      if (error) throw error;

      setMeals(meals.filter(m => m.id !== mealId));
      setSelectedMeal(null);
    } catch (error) {
      console.error('Error deleting meal:', error);
    }
  };

  const handleShareMeal = async (meal: FoodLog) => {
    try {
      await socialService.shareMeal(userId, meal.id, shareMessage);
      setSharing(null);
      setShareMessage('');
      alert('Meal shared successfully! Check the Social tab to see your shared meals.');
    } catch (error) {
      console.error('Error sharing meal:', error);
      if (error instanceof Error && error.message.includes('duplicate')) {
        alert('This meal has already been shared!');
      } else {
        alert('Failed to share meal. Please try again.');
      }
    }
  };

  const totalPages = Math.ceil(meals.length / mealsPerPage);
  const displayedMeals = meals.slice(currentPage * mealsPerPage, (currentPage + 1) * mealsPerPage);

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (inline) {
    return (
      <div>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading meals...</div>
        ) : meals.length === 0 ? (
          <div className="text-center py-8">
            <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No meals with photos yet</p>
          </div>
        ) : (
          <>
            <div className="space-y-2 sm:space-y-3">
              {meals.slice(0, 10).map((meal) => (
                <div
                  key={meal.id}
                  className="flex justify-between items-center p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl group hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedMeal(meal)}>
                    {meal.image_url && (
                      <img
                        src={meal.image_url}
                        alt={meal.food_name}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-800 truncate">{meal.food_name}</h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {new Date(meal.logged_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 mr-2 sm:mr-3">
                    <div className="text-sm sm:text-base font-semibold text-gray-800">{meal.calories} kcal</div>
                    <div className="text-[10px] sm:text-xs text-gray-600">
                      P: {Math.round(meal.protein)}g | C: {Math.round(meal.carbs)}g | F: {Math.round(meal.fats)}g
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => setSharing(meal.id)}
                      className="p-1.5 sm:p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                      title="Share on social"
                    >
                      <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMeal(meal.id)}
                      className="p-1.5 sm:p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {selectedMeal && (
          <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4">
            <button
              onClick={() => setSelectedMeal(null)}
              className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            <div className="max-w-4xl w-full bg-white rounded-2xl overflow-hidden">
              <div className="grid lg:grid-cols-2 gap-0">
                <div className="relative aspect-square lg:aspect-auto">
                  <img
                    src={selectedMeal.image_url || ''}
                    alt={selectedMeal.food_name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-6 flex flex-col">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{selectedMeal.food_name}</h3>

                    {selectedMeal.serving_size && (
                      <div className="text-sm text-gray-600 mb-2">
                        Serving: {selectedMeal.serving_size}
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(selectedMeal.logged_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {selectedMeal.description && (
                      <div className="bg-gray-50 p-3 rounded-xl mb-4">
                        <p className="text-sm text-gray-700">{selectedMeal.description}</p>
                      </div>
                    )}

                    <div className="space-y-3 mb-4">
                      <h4 className="font-semibold text-gray-700 text-sm">Main Macros</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-xl">
                          <div className="text-xs text-orange-600 font-medium mb-1">Calories</div>
                          <div className="text-xl font-bold text-gray-800">{selectedMeal.calories}</div>
                          <div className="text-xs text-gray-600">kcal</div>
                        </div>

                        <div className="bg-gradient-to-br from-red-50 to-red-100 p-3 rounded-xl">
                          <div className="text-xs text-red-600 font-medium mb-1">Protein</div>
                          <div className="text-xl font-bold text-gray-800">{Math.round(selectedMeal.protein)}</div>
                          <div className="text-xs text-gray-600">grams</div>
                        </div>

                        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-3 rounded-xl">
                          <div className="text-xs text-amber-600 font-medium mb-1">Carbs</div>
                          <div className="text-xl font-bold text-gray-800">{Math.round(selectedMeal.carbs)}</div>
                          <div className="text-xs text-gray-600">grams</div>
                        </div>

                        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-3 rounded-xl">
                          <div className="text-xs text-yellow-600 font-medium mb-1">Fats</div>
                          <div className="text-xl font-bold text-gray-800">{Math.round(selectedMeal.fats)}</div>
                          <div className="text-xs text-gray-600">grams</div>
                        </div>
                      </div>
                    </div>

                    {(selectedMeal.fiber > 0 || selectedMeal.sugar > 0 || selectedMeal.sodium > 0) && (
                      <div className="space-y-3 mb-4">
                        <h4 className="font-semibold text-gray-700 text-sm">Additional Details</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {selectedMeal.fiber > 0 && (
                            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-2 rounded-lg">
                              <Wheat className="w-3 h-3 text-amber-600 mb-1" />
                              <div className="text-xs text-amber-600 font-medium">Fiber</div>
                              <div className="text-sm font-bold text-gray-800">{Math.round(selectedMeal.fiber)}g</div>
                            </div>
                          )}

                          {selectedMeal.sugar > 0 && (
                            <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-2 rounded-lg">
                              <Candy className="w-3 h-3 text-pink-600 mb-1" />
                              <div className="text-xs text-pink-600 font-medium">Sugar</div>
                              <div className="text-sm font-bold text-gray-800">{Math.round(selectedMeal.sugar)}g</div>
                            </div>
                          )}

                          {selectedMeal.sodium > 0 && (
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-2 rounded-lg">
                              <Sparkles className="w-3 h-3 text-blue-600 mb-1" />
                              <div className="text-xs text-blue-600 font-medium">Sodium</div>
                              <div className="text-sm font-bold text-gray-800">{Math.round(selectedMeal.sodium)}mg</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setSharing(selectedMeal.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      Share on Social
                    </button>
                    <button
                      onClick={() => handleDeleteMeal(selectedMeal.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Meal
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {sharing && (
          <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Share Meal</h3>

              <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setShareMode('internal')}
                  className={`flex-1 px-3 py-2 rounded-lg transition font-medium text-sm ${
                    shareMode === 'internal'
                      ? 'bg-emerald-500 text-white'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  App Community
                </button>
                <button
                  onClick={() => setShareMode('platform')}
                  className={`flex-1 px-3 py-2 rounded-lg transition font-medium text-sm ${
                    shareMode === 'platform'
                      ? 'bg-emerald-500 text-white'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Social Media
                </button>
              </div>

              {shareMode === 'internal' ? (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Add a caption (optional)</label>
                    <textarea
                      value={shareMessage}
                      onChange={(e) => setShareMessage(e.target.value)}
                      placeholder="Add a caption to your meal..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-sm"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSharing(null);
                        setShareMessage('');
                      }}
                      className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        const meal = meals.find(m => m.id === sharing);
                        if (meal) handleShareMeal(meal);
                      }}
                      className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Share to platform:</label>
                    <div className="space-y-2">
                      {sharing && (() => {
                        const meal = meals.find(m => m.id === sharing);
                        if (!meal) return null;

                        return (
                          <>
                            <button
                              onClick={() => {
                                platformShareService.shareToInstagram({
                                  mealName: meal.food_name,
                                  caption: shareMessage || 'Just logged this meal!',
                                  imageUrl: meal.image_url || undefined,
                                  calories: meal.calories,
                                  protein: meal.protein,
                                  carbs: meal.carbs,
                                  fats: meal.fats,
                                });
                                setSharing(null);
                                setShareMessage('');
                              }}
                              className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                              <span>📸</span>
                              Share to Instagram
                            </button>

                            <button
                              onClick={() => {
                                platformShareService.shareToFacebook({
                                  mealName: meal.food_name,
                                  caption: shareMessage || 'Just logged this meal!',
                                  imageUrl: meal.image_url || undefined,
                                  calories: meal.calories,
                                  protein: meal.protein,
                                  carbs: meal.carbs,
                                  fats: meal.fats,
                                });
                                setSharing(null);
                                setShareMessage('');
                              }}
                              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                              <Facebook className="w-4 h-4" />
                              Share to Facebook
                            </button>

                            <button
                              onClick={() => {
                                platformShareService.shareToSnapchat({
                                  mealName: meal.food_name,
                                  caption: shareMessage || 'Just logged this meal!',
                                  imageUrl: meal.image_url || undefined,
                                  calories: meal.calories,
                                  protein: meal.protein,
                                  carbs: meal.carbs,
                                  fats: meal.fats,
                                });
                                setSharing(null);
                                setShareMessage('');
                              }}
                              className="w-full px-4 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                              <span>👻</span>
                              Share to Snapchat
                            </button>

                            <button
                              onClick={() => {
                                platformShareService.shareToTwitter({
                                  mealName: meal.food_name,
                                  caption: shareMessage || 'Just logged this meal!',
                                  imageUrl: meal.image_url || undefined,
                                  calories: meal.calories,
                                  protein: meal.protein,
                                  carbs: meal.carbs,
                                  fats: meal.fats,
                                });
                                setSharing(null);
                                setShareMessage('');
                              }}
                              className="w-full px-4 py-3 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                              <span>𝕏</span>
                              Share to Twitter/X
                            </button>

                            <button
                              onClick={async () => {
                                const copied = await platformShareService.copyToClipboard({
                                  mealName: meal.food_name,
                                  caption: shareMessage || 'Just logged this meal!',
                                  imageUrl: meal.image_url || undefined,
                                  calories: meal.calories,
                                  protein: meal.protein,
                                  carbs: meal.carbs,
                                  fats: meal.fats,
                                });
                                if (copied) {
                                  alert('Meal info copied to clipboard!');
                                  setSharing(null);
                                  setShareMessage('');
                                }
                              }}
                              className="w-full px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                              <Copy className="w-4 h-4" />
                              Copy to Clipboard
                            </button>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSharing(null);
                      setShareMessage('');
                      setShareMode('internal');
                    }}
                    className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-pink-500 to-rose-600 p-4 sm:p-6 rounded-t-2xl sm:rounded-t-3xl z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-3">
              <ImageIcon className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-white">Meal Gallery</h2>
                <p className="text-xs sm:text-sm text-white/90 mt-1">{meals.length} meals with photos</p>
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
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading meals...</div>
          ) : meals.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No meals with photos yet</p>
              <p className="text-sm text-gray-400 mt-2">Start logging meals with the camera to see them here</p>
            </div>
          ) : (
            <>
              <div className="space-y-2 sm:space-y-3 mb-6">
                {displayedMeals.map((meal) => (
                  <div
                    key={meal.id}
                    className="flex justify-between items-center p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl group hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedMeal(meal)}>
                      {meal.image_url && (
                        <img
                          src={meal.image_url}
                          alt={meal.food_name}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-800 truncate">{meal.food_name}</h3>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {new Date(meal.logged_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 mr-2 sm:mr-3">
                      <div className="text-sm sm:text-base font-semibold text-gray-800">{meal.calories} kcal</div>
                      <div className="text-[10px] sm:text-xs text-gray-600">
                        P: {Math.round(meal.protein)}g | C: {Math.round(meal.carbs)}g | F: {Math.round(meal.fats)}g
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => setSharing(meal.id)}
                        className="p-1.5 sm:p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                        title="Share on social"
                      >
                        <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMeal(meal.id)}
                        className="p-1.5 sm:p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={goToPrevPage}
                    disabled={currentPage === 0}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-6 h-6 text-gray-600" />
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages - 1}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-6 h-6 text-gray-600" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedMeal && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4">
          <button
            onClick={() => setSelectedMeal(null)}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <div className="max-w-4xl w-full bg-white rounded-2xl overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-0">
              <div className="relative aspect-square lg:aspect-auto">
                <img
                  src={selectedMeal.image_url || ''}
                  alt={selectedMeal.food_name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-6 flex flex-col">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{selectedMeal.food_name}</h3>

                  {selectedMeal.serving_size && (
                    <div className="text-sm text-gray-600 mb-2">
                      Serving: {selectedMeal.serving_size}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(selectedMeal.logged_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {selectedMeal.description && (
                    <div className="bg-gray-50 p-3 rounded-xl mb-4">
                      <p className="text-sm text-gray-700">{selectedMeal.description}</p>
                    </div>
                  )}

                  <div className="space-y-3 mb-4">
                    <h4 className="font-semibold text-gray-700 text-sm">Main Macros</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-xl">
                        <div className="text-xs text-orange-600 font-medium mb-1">Calories</div>
                        <div className="text-xl font-bold text-gray-800">{selectedMeal.calories}</div>
                        <div className="text-xs text-gray-600">kcal</div>
                      </div>

                      <div className="bg-gradient-to-br from-red-50 to-red-100 p-3 rounded-xl">
                        <div className="text-xs text-red-600 font-medium mb-1">Protein</div>
                        <div className="text-xl font-bold text-gray-800">{Math.round(selectedMeal.protein)}</div>
                        <div className="text-xs text-gray-600">grams</div>
                      </div>

                      <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-3 rounded-xl">
                        <div className="text-xs text-amber-600 font-medium mb-1">Carbs</div>
                        <div className="text-xl font-bold text-gray-800">{Math.round(selectedMeal.carbs)}</div>
                        <div className="text-xs text-gray-600">grams</div>
                      </div>

                      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-3 rounded-xl">
                        <div className="text-xs text-yellow-600 font-medium mb-1">Fats</div>
                        <div className="text-xl font-bold text-gray-800">{Math.round(selectedMeal.fats)}</div>
                        <div className="text-xs text-gray-600">grams</div>
                      </div>
                    </div>
                  </div>

                  {(selectedMeal.fiber > 0 || selectedMeal.sugar > 0 || selectedMeal.sodium > 0) && (
                    <div className="space-y-3 mb-4">
                      <h4 className="font-semibold text-gray-700 text-sm">Additional Details</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedMeal.fiber > 0 && (
                          <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-2 rounded-lg">
                            <Wheat className="w-3 h-3 text-amber-600 mb-1" />
                            <div className="text-xs text-amber-600 font-medium">Fiber</div>
                            <div className="text-sm font-bold text-gray-800">{Math.round(selectedMeal.fiber)}g</div>
                          </div>
                        )}

                        {selectedMeal.sugar > 0 && (
                          <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-2 rounded-lg">
                            <Candy className="w-3 h-3 text-pink-600 mb-1" />
                            <div className="text-xs text-pink-600 font-medium">Sugar</div>
                            <div className="text-sm font-bold text-gray-800">{Math.round(selectedMeal.sugar)}g</div>
                          </div>
                        )}

                        {selectedMeal.sodium > 0 && (
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-2 rounded-lg">
                            <Sparkles className="w-3 h-3 text-blue-600 mb-1" />
                            <div className="text-xs text-blue-600 font-medium">Sodium</div>
                            <div className="text-sm font-bold text-gray-800">{Math.round(selectedMeal.sodium)}mg</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setSharing(selectedMeal.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    Share on Social
                  </button>
                  <button
                    onClick={() => handleDeleteMeal(selectedMeal.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Meal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {sharing && !inline && (
        <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Share Meal</h3>

            <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setShareMode('internal')}
                className={`flex-1 px-3 py-2 rounded-lg transition font-medium text-sm ${
                  shareMode === 'internal'
                    ? 'bg-emerald-500 text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                App Community
              </button>
              <button
                onClick={() => setShareMode('platform')}
                className={`flex-1 px-3 py-2 rounded-lg transition font-medium text-sm ${
                  shareMode === 'platform'
                    ? 'bg-emerald-500 text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Social Media
              </button>
            </div>

            {shareMode === 'internal' ? (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Add a caption (optional)</label>
                  <textarea
                    value={shareMessage}
                    onChange={(e) => setShareMessage(e.target.value)}
                    placeholder="Add a caption to your meal..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-sm"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSharing(null);
                      setShareMessage('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const meal = meals.find(m => m.id === sharing);
                      if (meal) handleShareMeal(meal);
                    }}
                    className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Share to platform:</label>
                  <div className="space-y-2">
                    {sharing && (() => {
                      const meal = meals.find(m => m.id === sharing);
                      if (!meal) return null;

                      return (
                        <>
                          <button
                            onClick={() => {
                              platformShareService.shareToInstagram({
                                mealName: meal.food_name,
                                caption: shareMessage || 'Just logged this meal!',
                                imageUrl: meal.image_url || undefined,
                                calories: meal.calories,
                                protein: meal.protein,
                                carbs: meal.carbs,
                                fats: meal.fats,
                              });
                              setSharing(null);
                              setShareMessage('');
                            }}
                            className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <span>📸</span>
                            Share to Instagram
                          </button>

                          <button
                            onClick={() => {
                              platformShareService.shareToFacebook({
                                mealName: meal.food_name,
                                caption: shareMessage || 'Just logged this meal!',
                                imageUrl: meal.image_url || undefined,
                                calories: meal.calories,
                                protein: meal.protein,
                                carbs: meal.carbs,
                                fats: meal.fats,
                              });
                              setSharing(null);
                              setShareMessage('');
                            }}
                            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <Facebook className="w-4 h-4" />
                            Share to Facebook
                          </button>

                          <button
                            onClick={() => {
                              platformShareService.shareToSnapchat({
                                mealName: meal.food_name,
                                caption: shareMessage || 'Just logged this meal!',
                                imageUrl: meal.image_url || undefined,
                                calories: meal.calories,
                                protein: meal.protein,
                                carbs: meal.carbs,
                                fats: meal.fats,
                              });
                              setSharing(null);
                              setShareMessage('');
                            }}
                            className="w-full px-4 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <span>👻</span>
                            Share to Snapchat
                          </button>

                          <button
                            onClick={() => {
                              platformShareService.shareToTwitter({
                                mealName: meal.food_name,
                                caption: shareMessage || 'Just logged this meal!',
                                imageUrl: meal.image_url || undefined,
                                calories: meal.calories,
                                protein: meal.protein,
                                carbs: meal.carbs,
                                fats: meal.fats,
                              });
                              setSharing(null);
                              setShareMessage('');
                            }}
                            className="w-full px-4 py-3 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <span>𝕏</span>
                            Share to Twitter/X
                          </button>

                          <button
                            onClick={async () => {
                              const copied = await platformShareService.copyToClipboard({
                                mealName: meal.food_name,
                                caption: shareMessage || 'Just logged this meal!',
                                imageUrl: meal.image_url || undefined,
                                calories: meal.calories,
                                protein: meal.protein,
                                carbs: meal.carbs,
                                fats: meal.fats,
                              });
                              if (copied) {
                                alert('Meal info copied to clipboard!');
                                setSharing(null);
                                setShareMessage('');
                              }
                            }}
                            className="w-full px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <Copy className="w-4 h-4" />
                            Copy to Clipboard
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSharing(null);
                    setShareMessage('');
                    setShareMode('internal');
                  }}
                  className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
