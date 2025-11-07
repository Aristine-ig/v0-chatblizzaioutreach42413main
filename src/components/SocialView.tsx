import { useState, useEffect } from 'react';
import { Users, Heart, Share2, Trash2, TrendingUp } from 'lucide-react';
import { socialService, SharedMeal, UserStats } from '../services/socialService';

interface SocialViewProps {
  userId: string;
}

export default function SocialView({ userId }: SocialViewProps) {
  const [tab, setTab] = useState<'feed' | 'shared' | 'stats'>('feed');
  const [feed, setFeed] = useState<SharedMeal[]>([]);
  const [sharedMeals, setSharedMeals] = useState<SharedMeal[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userReactions, setUserReactions] = useState<Record<string, string[]>>({});

  useEffect(() => {
    loadData();
  }, [userId, tab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (tab === 'feed') {
        await loadFeed();
      } else if (tab === 'shared') {
        await loadSharedMeals();
      } else if (tab === 'stats') {
        await loadStats();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeed = async () => {
    const meals = await socialService.getFeed(userId, 20, 0);
    setFeed(meals);
    await enrichMealData(meals);
  };

  const loadSharedMeals = async () => {
    const meals = await socialService.getSharedMeals(userId, 20, 0);
    setSharedMeals(meals);
    await enrichMealData(meals);
  };

  const loadStats = async () => {
    const userStats = await socialService.getUserStats(userId);
    setStats(userStats);
  };

  const enrichMealData = async (meals: SharedMeal[]) => {
    const reactions: Record<string, string[]> = {};

    for (const meal of meals) {
      const mealReactions = await socialService.getReactions(meal.id);
      reactions[meal.id] = mealReactions.map(r => r.reaction_type);

      const userRxns = await socialService.getUserReactions(userId, meal.id);
      if (userRxns.length > 0) {
        reactions[`user-${meal.id}`] = userRxns;
      }
    }

    setUserReactions(prev => ({ ...prev, ...reactions }));
  };

  const handleAddReaction = async (sharedMealId: string, reactionType: 'like' | 'love' | 'wow') => {
    try {
      await socialService.addReaction(userId, sharedMealId, reactionType);
      const newReactions = await socialService.getUserReactions(userId, sharedMealId);
      setUserReactions(prev => ({
        ...prev,
        [`user-${sharedMealId}`]: newReactions
      }));
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleDeleteSharedMeal = async (sharedMealId: string) => {
    try {
      await socialService.deleteSharedMeal(sharedMealId);
      setSharedMeals(sharedMeals.filter(m => m.id !== sharedMealId));
    } catch (error) {
      console.error('Error deleting meal:', error);
    }
  };

  const renderMealCard = (meal: SharedMeal, showDelete = false) => (
    <div key={meal.id} className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-800">
            {meal.food_logs?.food_name || 'Unknown Food'}
          </h3>
          <p className="text-sm text-gray-600">
            {meal.food_logs?.calories || 0} calories
          </p>
        </div>
        {showDelete && (
          <button
            onClick={() => handleDeleteSharedMeal(meal.id)}
            className="p-2 hover:bg-red-100 rounded-lg transition"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        )}
      </div>

      {meal.caption && (
        <p className="text-gray-700 text-sm mb-3">{meal.caption}</p>
      )}

      {meal.food_logs?.image_url && (
        <img
          src={meal.food_logs.image_url}
          alt="Meal"
          className="w-full h-40 object-cover rounded-lg mb-3"
        />
      )}

      <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
        <div className="bg-emerald-50 p-2 rounded">
          <p className="text-gray-600">Protein</p>
          <p className="font-semibold text-emerald-600">{meal.food_logs?.protein || 0}g</p>
        </div>
        <div className="bg-blue-50 p-2 rounded">
          <p className="text-gray-600">Carbs</p>
          <p className="font-semibold text-blue-600">{meal.food_logs?.carbs || 0}g</p>
        </div>
        <div className="bg-orange-50 p-2 rounded">
          <p className="text-gray-600">Fats</p>
          <p className="font-semibold text-orange-600">{meal.food_logs?.fats || 0}g</p>
        </div>
      </div>

      <div className="flex gap-2">
        {['like', 'love', 'wow'].map(type => (
          <button
            key={type}
            onClick={() => handleAddReaction(meal.id, type as any)}
            className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-2 ${
              userReactions[`user-${meal.id}`]?.includes(type)
                ? 'bg-red-100 text-red-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span className="text-sm capitalize">{type}</span>
            {userReactions[meal.id]?.filter((r: string) => r === type).length > 0 && (
              <span className="text-xs">({userReactions[meal.id]?.filter((r: string) => r === type).length})</span>
            )}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-3">
        {new Date(meal.created_at).toLocaleDateString()} {new Date(meal.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-emerald-600 p-3 rounded-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Social</h1>
            <p className="text-gray-600 text-sm">Connect with friends and share meals</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 bg-white p-1 rounded-lg shadow-sm">
          <button
            onClick={() => setTab('feed')}
            className={`flex-1 py-2 rounded-lg transition font-medium ${
              tab === 'feed'
                ? 'bg-emerald-600 text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Feed
          </button>
          <button
            onClick={() => setTab('shared')}
            className={`flex-1 py-2 rounded-lg transition font-medium ${
              tab === 'shared'
                ? 'bg-emerald-600 text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            My Meals
          </button>
          <button
            onClick={() => setTab('stats')}
            className={`flex-1 py-2 rounded-lg transition font-medium ${
              tab === 'stats'
                ? 'bg-emerald-600 text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Stats
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : tab === 'feed' ? (
          <div className="space-y-4">
            {feed.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl">
                <Share2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No meals to show</p>
                <p className="text-gray-500 text-sm mt-1">Follow friends to see their shared meals</p>
              </div>
            ) : (
              feed.map(meal => renderMealCard(meal))
            )}
          </div>
        ) : tab === 'shared' ? (
          <div className="space-y-4">
            {sharedMeals.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl">
                <Share2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">You haven't shared any meals yet</p>
              </div>
            ) : (
              sharedMeals.map(meal => renderMealCard(meal, true))
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-md p-6 border border-emerald-200">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <p className="text-gray-600 text-sm">Followers</p>
              </div>
              <p className="text-3xl font-bold text-emerald-600">{stats?.followers_count || 0}</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-emerald-200">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <p className="text-gray-600 text-sm">Following</p>
              </div>
              <p className="text-3xl font-bold text-blue-600">{stats?.following_count || 0}</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-orange-200">
              <div className="flex items-center gap-3 mb-2">
                <Share2 className="w-5 h-5 text-orange-600" />
                <p className="text-gray-600 text-sm">Shared Meals</p>
              </div>
              <p className="text-3xl font-bold text-orange-600">{stats?.shared_meals_count || 0}</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-purple-200">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <p className="text-gray-600 text-sm">Avg Daily Calories</p>
              </div>
              <p className="text-3xl font-bold text-purple-600">{stats?.avg_daily_calories || 0}</p>
            </div>

            <div className="col-span-2 bg-white rounded-xl shadow-md p-6 border border-yellow-200">
              <div className="flex items-center gap-3 mb-2">
                <Heart className="w-5 h-5 text-yellow-600" />
                <p className="text-gray-600 text-sm">Total Calories Logged</p>
              </div>
              <p className="text-3xl font-bold text-yellow-600">{stats?.total_calories || 0}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
