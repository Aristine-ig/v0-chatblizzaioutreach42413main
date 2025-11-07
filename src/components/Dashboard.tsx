"use client"

import { useState, useEffect } from "react"
import { supabase, type UserProfile, type FoodLog, calculateNutrition } from "../lib/supabase"
import {
  Camera,
  LogOut,
  TrendingUp,
  Flame,
  Beef,
  Cookie,
  Droplet,
  ArrowLeftRight,
  Settings,
  History,
  Plus,
  Trash2,
  BarChart3,
  ImageIcon,
  Scale,
  Download,
  ChefHat,
  Lightbulb,
  ScanLine,
  Menu,
  Bell,
  Users,
  Trophy,
} from "lucide-react"
import CameraCapture from "./CameraCapture"
import HistoryView from "./HistoryView"
import ManualFoodEntry from "./ManualFoodEntry"
import AnalyticsView from "./AnalyticsView"
import MealGallery from "./MealGallery"
import WeightTracker from "./WeightTracker"
import ExportView from "./ExportView"
import MealRecommendations from "./MealRecommendations"
import HealthierAlternatives from "./HealthierAlternatives"
import BarcodeScanner from "./BarcodeScanner"
import NotificationsView from "./NotificationsView"
import SocialView from "./SocialView"
import StreakTracker from "./StreakTracker"
import AchievementsView from "./AchievementsView"
import { achievementService } from "../services/achievementService"

interface DashboardProps {
  userId: string
  onLogout: () => void
}

export default function Dashboard({ userId, onLogout }: DashboardProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [todayLogs, setTodayLogs] = useState<FoodLog[]>([])
  const [showCamera, setShowCamera] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showGoalEditor, setShowGoalEditor] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  const [showWeightTracker, setShowWeightTracker] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showMealRecommendations, setShowMealRecommendations] = useState(false)
  const [showAlternatives, setShowAlternatives] = useState(false)
  const [selectedFoodForAlternatives, setSelectedFoodForAlternatives] = useState<FoodLog | null>(null)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSocial, setShowSocial] = useState(false)
  const [showAchievements, setShowAchievements] = useState(false)
  const [editGoals, setEditGoals] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
  })

  useEffect(() => {
    loadData()
  }, [userId])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: profileData } = await supabase.from("user_profiles").select("*").eq("id", userId).maybeSingle()

      if (profileData) {
        setProfile(profileData)
      }

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data: logsData } = await supabase
        .from("food_logs")
        .select("*")
        .eq("user_id", userId)
        .gte("logged_at", today.toISOString())
        .order("logged_at", { ascending: false })

      if (logsData) {
        setTodayLogs(logsData)
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    onLogout()
  }

  const handleFoodLogged = async () => {
    setShowCamera(false)
    setShowManualEntry(false)
    setShowBarcodeScanner(false)
    loadData()

    // Check for new achievements
    const newAchievements = await achievementService.checkAndAwardAchievements(userId)
    if (newAchievements.length > 0) {
      // Show a toast or notification for new achievements
      console.log("New achievements earned:", newAchievements)
    }
  }

  const handleDeleteLog = async (logId: string) => {
    if (!confirm("Are you sure you want to delete this food log?")) return

    try {
      const { error } = await supabase.from("food_logs").delete().eq("id", logId)

      if (error) throw error
      loadData()
    } catch (error) {
      console.error("Error deleting log:", error)
    }
  }

  const handleToggleGoal = async () => {
    if (!profile) return

    const newGoal = profile.goal === "bulk" ? "cut" : "bulk"
    const newNutrition = calculateNutrition(profile.weight, profile.height, profile.age, newGoal)

    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          goal: newGoal,
          ...newNutrition,
        })
        .eq("id", userId)

      if (error) throw error

      setProfile({
        ...profile,
        goal: newGoal,
        ...newNutrition,
      })
    } catch (error) {
      console.error("Error updating goal:", error)
    }
  }

  const handleOpenGoalEditor = () => {
    if (!profile) return
    if (editGoals.calories === 0 && editGoals.protein === 0 && editGoals.carbs === 0 && editGoals.fats === 0) {
      setEditGoals({
        calories: profile.daily_calories,
        protein: profile.daily_protein,
        carbs: profile.daily_carbs,
        fats: profile.daily_fats,
      })
    }
    setShowGoalEditor(true)
  }

  const handleSaveGoals = async () => {
    if (!profile) return

    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          daily_calories: editGoals.calories,
          daily_protein: editGoals.protein,
          daily_carbs: editGoals.carbs,
          daily_fats: editGoals.fats,
        })
        .eq("id", userId)

      if (error) throw error

      setProfile({
        ...profile,
        daily_calories: editGoals.calories,
        daily_protein: editGoals.protein,
        daily_carbs: editGoals.carbs,
        daily_fats: editGoals.fats,
      })
      setEditGoals({
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
      })
      setShowGoalEditor(false)
    } catch (error) {
      console.error("Error updating goals:", error)
    }
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    )
  }

  const todayCalories = todayLogs.reduce((sum, log) => sum + log.calories, 0)
  const todayProtein = todayLogs.reduce((sum, log) => sum + log.protein, 0)
  const todayCarbs = todayLogs.reduce((sum, log) => sum + log.carbs, 0)
  const todayFats = todayLogs.reduce((sum, log) => sum + log.fats, 0)

  if (showCamera) {
    return (
      <CameraCapture
        userId={userId}
        onClose={() => setShowCamera(false)}
        onFoodLogged={handleFoodLogged}
        userGoal={profile.goal}
      />
    )
  }

  if (showBarcodeScanner) {
    return (
      <BarcodeScanner userId={userId} onClose={() => setShowBarcodeScanner(false)} onFoodLogged={handleFoodLogged} />
    )
  }

  if (showHistory) {
    return <HistoryView userId={userId} onClose={() => setShowHistory(false)} />
  }

  if (showAnalytics) {
    return <AnalyticsView userId={userId} onClose={() => setShowAnalytics(false)} />
  }

  if (showGallery) {
    return <MealGallery userId={userId} onClose={() => setShowGallery(false)} />
  }

  if (showWeightTracker) {
    return <WeightTracker userId={userId} onClose={() => setShowWeightTracker(false)} />
  }

  if (showExport) {
    return <ExportView userId={userId} onClose={() => setShowExport(false)} />
  }

  if (showMealRecommendations && profile) {
    return (
      <MealRecommendations
        remainingCalories={profile.daily_calories - todayCalories}
        remainingProtein={profile.daily_protein - todayProtein}
        remainingCarbs={profile.daily_carbs - todayCarbs}
        remainingFats={profile.daily_fats - todayFats}
        goal={profile.goal}
        onClose={() => setShowMealRecommendations(false)}
      />
    )
  }

  if (showAlternatives && selectedFoodForAlternatives && profile) {
    return (
      <HealthierAlternatives
        foodName={selectedFoodForAlternatives.food_name}
        calories={selectedFoodForAlternatives.calories}
        protein={selectedFoodForAlternatives.protein}
        carbs={selectedFoodForAlternatives.carbs}
        fats={selectedFoodForAlternatives.fats}
        goal={profile.goal}
        onClose={() => {
          setShowAlternatives(false)
          setSelectedFoodForAlternatives(null)
        }}
      />
    )
  }

  if (showNotifications) {
    return <NotificationsView userId={userId} />
  }

  if (showSocial) {
    return <SocialView userId={userId} />
  }

  if (showAchievements) {
    return <AchievementsView userId={userId} onClose={() => setShowAchievements(false)} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
      <div className="max-w-4xl mx-auto p-3 sm:p-4 pb-28 sm:pb-24">
        <div className="flex justify-between items-center mb-4 sm:mb-6 pt-2 sm:pt-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              NutriTrack
            </h1>
            <p className="text-xs sm:text-base text-gray-600 flex items-center gap-1 sm:gap-2 mt-1">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
              Goal: {profile.goal === "cut" ? "Weight Loss" : "Muscle Gain"}
            </p>
          </div>
          <div className="flex gap-1 sm:gap-2">
            <button
              onClick={() => setShowMobileSidebar(true)}
              className="sm:hidden p-1.5 hover:bg-white/80 rounded-xl transition-all shadow-sm hover:shadow-md"
              title="Open Menu"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => setShowAchievements(true)}
              className="p-1.5 sm:p-2 hover:bg-white/80 rounded-xl transition-all shadow-sm hover:shadow-md"
              title="Achievements"
            >
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
            </button>
            <button
              onClick={() => setShowNotifications(true)}
              className="p-1.5 sm:p-2 hover:bg-white/80 rounded-xl transition-all shadow-sm hover:shadow-md"
              title="Notifications"
            >
              <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
            </button>
            <button
              onClick={() => setShowSocial(true)}
              className="p-1.5 sm:p-2 hover:bg-white/80 rounded-xl transition-all shadow-sm hover:shadow-md"
              title="Social"
            >
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className="hidden sm:block p-1.5 sm:p-2 hover:bg-white/80 rounded-xl transition-all shadow-sm hover:shadow-md"
              title="View History"
            >
              <History className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
            </button>
            <button
              onClick={handleLogout}
              className="p-1.5 sm:p-2 hover:bg-white/80 rounded-xl transition-all shadow-sm hover:shadow-md"
              title="Logout"
            >
              <LogOut className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="hidden sm:grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-4 sm:mb-6">
          <button
            onClick={() => setShowAnalytics(true)}
            className="bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 hover:shadow-xl transition-all group"
          >
            <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 mb-2 mx-auto group-hover:scale-110 transition-transform" />
            <div className="text-xs sm:text-sm font-semibold text-gray-800">Analytics</div>
          </button>

          <button
            onClick={() => setShowGallery(true)}
            className="bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 hover:shadow-xl transition-all group"
          >
            <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-pink-500 mb-2 mx-auto group-hover:scale-110 transition-transform" />
            <div className="text-xs sm:text-sm font-semibold text-gray-800">Gallery</div>
          </button>

          <button
            onClick={() => setShowWeightTracker(true)}
            className="bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 hover:shadow-xl transition-all group"
          >
            <Scale className="w-6 h-6 sm:w-8 sm:h-8 text-violet-500 mb-2 mx-auto group-hover:scale-110 transition-transform" />
            <div className="text-xs sm:text-sm font-semibold text-gray-800">Weight</div>
          </button>

          <button
            onClick={() => setShowExport(true)}
            className="bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 hover:shadow-xl transition-all group"
          >
            <Download className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 mb-2 mx-auto group-hover:scale-110 transition-transform" />
            <div className="text-xs sm:text-sm font-semibold text-gray-800">Export</div>
          </button>

          <button
            onClick={() => setShowMealRecommendations(true)}
            className="bg-gradient-to-br from-emerald-50 to-teal-100 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 hover:shadow-xl transition-all group border-2 border-emerald-200"
          >
            <ChefHat className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600 mb-2 mx-auto group-hover:scale-110 transition-transform" />
            <div className="text-xs sm:text-sm font-semibold text-emerald-800">AI Meals</div>
          </button>

          <button
            onClick={() => {
              if (todayLogs.length > 0) {
                setSelectedFoodForAlternatives(todayLogs[0])
                setShowAlternatives(true)
              }
            }}
            className="bg-gradient-to-br from-amber-50 to-orange-100 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 hover:shadow-xl transition-all group border-2 border-amber-200"
          >
            <Lightbulb className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600 mb-2 mx-auto group-hover:scale-110 transition-transform" />
            <div className="text-xs sm:text-sm font-semibold text-amber-800">Alternatives</div>
          </button>
        </div>

        <StreakTracker userId={userId} />

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-6 transition-all hover:shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3 sm:gap-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Daily Goals</h2>
            <div className="hidden sm:flex flex-col xs:flex-row items-stretch xs:items-center gap-2">
              <button
                onClick={handleOpenGoalEditor}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all text-xs sm:text-sm font-medium shadow-sm hover:shadow-md"
                title="Edit daily goals"
              >
                <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Edit Goals
              </button>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-5">
            <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-5xl sm:text-6xl font-bold text-gray-900">{todayCalories}</span>
                    <span className="text-2xl sm:text-3xl text-gray-400 font-medium">/{profile.daily_calories}</span>
                  </div>
                  <p className="text-sm sm:text-base text-gray-600 mt-3">Calories eaten</p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    {profile.daily_calories - todayCalories > 0
                      ? `+${profile.daily_calories - todayCalories}`
                      : `${todayCalories - profile.daily_calories}`}{" "}
                    remaining
                  </p>
                </div>
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="5"
                      fill="none"
                      className="text-gray-200"
                    />
                    <circle
                      cx="50%"
                      cy="50%"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="5"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - Math.min(todayCalories / profile.daily_calories, 1))}`}
                      className="text-gray-900 transition-all duration-500"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Flame className="w-8 h-8 sm:w-10 sm:h-10 text-gray-800" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-md border border-gray-100">
                <div className="flex flex-col items-start h-full">
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-2xl sm:text-3xl font-bold text-gray-900">{Math.round(todayProtein)}</span>
                    <span className="text-xs sm:text-sm text-gray-400 font-medium">/{profile.daily_protein}g</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2">Protein eaten</p>
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 mt-auto self-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="50%"
                        cy="50%"
                        r="24"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        className="text-red-100"
                      />
                      <circle
                        cx="50%"
                        cy="50%"
                        r="24"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 24}`}
                        strokeDashoffset={`${2 * Math.PI * 24 * (1 - Math.min(todayProtein / profile.daily_protein, 1))}`}
                        className="text-red-500 transition-all duration-500"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Beef className="w-6 h-6 sm:w-7 sm:h-7 text-red-600" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-md border border-gray-100">
                <div className="flex flex-col items-start h-full">
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-2xl sm:text-3xl font-bold text-gray-900">{Math.round(todayCarbs)}</span>
                    <span className="text-xs sm:text-sm text-gray-400 font-medium">/{profile.daily_carbs}g</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2">Carbs eaten</p>
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 mt-auto self-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="50%"
                        cy="50%"
                        r="24"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        className="text-orange-100"
                      />
                      <circle
                        cx="50%"
                        cy="50%"
                        r="24"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 24}`}
                        strokeDashoffset={`${2 * Math.PI * 24 * (1 - Math.min(todayCarbs / profile.daily_carbs, 1))}`}
                        className="text-orange-500 transition-all duration-500"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Cookie className="w-6 h-6 sm:w-7 sm:h-7 text-orange-600" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-md border border-gray-100">
                <div className="flex flex-col items-start h-full">
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-2xl sm:text-3xl font-bold text-gray-900">{Math.round(todayFats)}</span>
                    <span className="text-xs sm:text-sm text-gray-400 font-medium">/{profile.daily_fats}g</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2">Fats eaten</p>
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 mt-auto self-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="50%"
                        cy="50%"
                        r="24"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        className="text-blue-100"
                      />
                      <circle
                        cx="50%"
                        cy="50%"
                        r="24"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 24}`}
                        strokeDashoffset={`${2 * Math.PI * 24 * (1 - Math.min(todayFats / profile.daily_fats, 1))}`}
                        className="text-blue-500 transition-all duration-500"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Droplet className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleOpenGoalEditor}
              className="flex sm:hidden items-center justify-center gap-2 w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all text-xs font-medium shadow-sm hover:shadow-md"
              title="Edit daily goals"
            >
              <Settings className="w-3.5 h-3.5" />
              Edit Goals
            </button>
          </div>
        </div>

        {todayLogs.length > 0 && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-6 transition-all hover:shadow-2xl">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Today's Meals</h2>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <div className="space-y-2 sm:space-y-3">
                  {todayLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex justify-between items-center p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl group hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                        {log.image_url && (
                          <img
                            src={log.image_url || "/placeholder.svg"}
                            alt={log.food_name}
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm sm:text-base font-semibold text-gray-800 truncate">{log.food_name}</h3>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {new Date(log.logged_at).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right mr-2 sm:mr-3 flex-shrink-0">
                        <div className="text-sm sm:text-base font-semibold text-gray-800">{log.calories} kcal</div>
                        <div className="text-[10px] sm:text-xs text-gray-600">
                          P: {Math.round(log.protein)}g | C: {Math.round(log.carbs)}g | F: {Math.round(log.fats)}g
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => {
                            setSelectedFoodForAlternatives(log)
                            setShowAlternatives(true)
                          }}
                          className="p-1.5 sm:p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                          title="Find alternatives"
                        >
                          <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          className="p-1.5 sm:p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {showGallery && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 transition-all hover:shadow-2xl">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Meal Gallery</h2>
              <button onClick={() => setShowGallery(false)} className="text-gray-500 hover:text-gray-700">
                Hide
              </button>
            </div>
            <MealGallery userId={userId} onClose={() => setShowGallery(false)} inline />
          </div>
        )}
      </div>

      <div className="fixed bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3 sm:gap-4 z-40">
        <button
          onClick={() => setShowManualEntry(true)}
          className="bg-white hover:bg-gray-50 text-emerald-600 rounded-full p-4 sm:p-5 shadow-2xl transition-all hover:scale-110 active:scale-95"
          title="Add manually"
        >
          <Plus className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>
        <button
          onClick={() => setShowBarcodeScanner(true)}
          className="bg-white hover:bg-gray-50 text-teal-600 rounded-full p-4 sm:p-5 shadow-2xl transition-all hover:scale-110 active:scale-95"
          title="Scan barcode"
        >
          <ScanLine className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>
        <button
          onClick={() => setShowCamera(true)}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-full p-5 sm:p-6 shadow-2xl transition-all hover:scale-110 active:scale-95"
          title="Scan with camera"
        >
          <Camera className="w-7 h-7 sm:w-8 sm:h-8" />
        </button>
      </div>

      {showManualEntry && (
        <ManualFoodEntry userId={userId} onClose={() => setShowManualEntry(false)} onFoodLogged={handleFoodLogged} />
      )}

      {showMobileSidebar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 sm:hidden">
          <div className="fixed top-0 left-0 h-full w-4/5 max-w-sm bg-white shadow-2xl overflow-y-auto">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Menu</h2>
                <button
                  onClick={() => setShowMobileSidebar(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <LogOut className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <button
                onClick={() => {
                  setShowHistory(true)
                  setShowMobileSidebar(false)
                }}
                className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all"
              >
                <History className="w-6 h-6 text-gray-600" />
                <span className="font-medium text-gray-800">History</span>
              </button>

              <button
                onClick={() => {
                  setShowAnalytics(true)
                  setShowMobileSidebar(false)
                }}
                className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all"
              >
                <BarChart3 className="w-6 h-6 text-blue-500" />
                <span className="font-medium text-gray-800">Analytics</span>
              </button>

              <button
                onClick={() => {
                  setShowAchievements(true)
                  setShowMobileSidebar(false)
                }}
                className="w-full flex items-center gap-3 p-4 bg-gradient-to-br from-amber-50 to-orange-100 hover:from-amber-100 hover:to-orange-200 rounded-xl transition-all border-2 border-amber-200"
              >
                <Trophy className="w-6 h-6 text-amber-600" />
                <span className="font-medium text-amber-800">Achievements</span>
              </button>

              <button
                onClick={() => {
                  setShowGallery(true)
                  setShowMobileSidebar(false)
                }}
                className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all"
              >
                <ImageIcon className="w-6 h-6 text-pink-500" />
                <span className="font-medium text-gray-800">Gallery</span>
              </button>

              <button
                onClick={() => {
                  setShowWeightTracker(true)
                  setShowMobileSidebar(false)
                }}
                className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all"
              >
                <Scale className="w-6 h-6 text-violet-500" />
                <span className="font-medium text-gray-800">Weight Tracker</span>
              </button>

              <button
                onClick={() => {
                  setShowExport(true)
                  setShowMobileSidebar(false)
                }}
                className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all"
              >
                <Download className="w-6 h-6 text-green-500" />
                <span className="font-medium text-gray-800">Export Data</span>
              </button>

              <button
                onClick={() => {
                  setShowMealRecommendations(true)
                  setShowMobileSidebar(false)
                }}
                className="w-full flex items-center gap-3 p-4 bg-gradient-to-br from-emerald-50 to-teal-100 hover:from-emerald-100 hover:to-teal-200 rounded-xl transition-all border-2 border-emerald-200"
              >
                <ChefHat className="w-6 h-6 text-emerald-600" />
                <span className="font-medium text-emerald-800">AI Meal Suggestions</span>
              </button>

              <button
                onClick={() => {
                  if (todayLogs.length > 0) {
                    setSelectedFoodForAlternatives(todayLogs[0])
                    setShowAlternatives(true)
                    setShowMobileSidebar(false)
                  }
                }}
                className="w-full flex items-center gap-3 p-4 bg-gradient-to-br from-amber-50 to-orange-100 hover:from-amber-100 hover:to-orange-200 rounded-xl transition-all border-2 border-amber-200"
              >
                <Lightbulb className="w-6 h-6 text-amber-600" />
                <span className="font-medium text-amber-800">Healthier Alternatives</span>
              </button>

              <div className="border-t border-gray-200 my-4 pt-4">
                <button
                  onClick={() => {
                    handleToggleGoal()
                    setShowMobileSidebar(false)
                  }}
                  className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl transition-all text-white font-medium"
                >
                  <ArrowLeftRight className="w-6 h-6" />
                  <span>{profile.goal === "bulk" ? "Switch to Cut" : "Switch to Bulk"}</span>
                </button>

                <button
                  onClick={() => {
                    handleLogout()
                    setShowMobileSidebar(false)
                  }}
                  className="w-full flex items-center gap-3 p-4 bg-red-50 hover:bg-red-100 rounded-xl transition-all mt-3"
                >
                  <LogOut className="w-6 h-6 text-red-500" />
                  <span className="font-medium text-red-700">Logout</span>
                </button>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 -z-10" onClick={() => setShowMobileSidebar(false)} />
        </div>
      )}

      {showGoalEditor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 w-full max-w-md">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Edit Daily Goals</h3>

            <div className="space-y-4">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Flame className="w-4 h-4 mr-2 text-orange-500" />
                  Daily Calories (kcal)
                </label>
                <input
                  type="number"
                  value={editGoals.calories}
                  onChange={(e) => setEditGoals({ ...editGoals, calories: Number.parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  min="0"
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Beef className="w-4 h-4 mr-2 text-red-500" />
                  Daily Protein (g)
                </label>
                <input
                  type="number"
                  value={editGoals.protein}
                  onChange={(e) => setEditGoals({ ...editGoals, protein: Number.parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  min="0"
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Cookie className="w-4 h-4 mr-2 text-amber-500" />
                  Daily Carbs (g)
                </label>
                <input
                  type="number"
                  value={editGoals.carbs}
                  onChange={(e) => setEditGoals({ ...editGoals, carbs: Number.parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  min="0"
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Droplet className="w-4 h-4 mr-2 text-yellow-500" />
                  Daily Fats (g)
                </label>
                <input
                  type="number"
                  value={editGoals.fats}
                  onChange={(e) => setEditGoals({ ...editGoals, fats: Number.parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  min="0"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowGoalEditor(false)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGoals}
                className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors"
              >
                Save Goals
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
