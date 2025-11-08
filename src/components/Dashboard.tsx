"use client"

import { useState, useEffect } from "react"
import { supabase, type UserProfile, type FoodLog, calculateNutrition } from "../lib/supabase"
import {
  LogOut,
  TrendingUp,
  Flame,
  Beef,
  Cookie,
  Droplet,
  ArrowLeftRight,
  Settings,
  History,
  Trash2,
  Scale,
  ChefHat,
  Lightbulb,
  Menu,
  Trophy,
  Home,
  BarChart3,
} from "lucide-react"
import CameraCapture from "./CameraCapture"
import HistoryView from "./HistoryView"
import ManualFoodEntry from "./ManualFoodEntry"
import AnalyticsView from "./AnalyticsView"
import WeightTracker from "./WeightTracker"
import MealRecommendations from "./MealRecommendations"
import HealthierAlternatives from "./HealthierAlternatives"
import BarcodeScanner from "./BarcodeScanner"
import SettingsSection from "./SettingsSection"
import NotificationsView from "./NotificationsView"
import SocialView from "./SocialView"
import AchievementsView from "./AchievementsView"
import StreakTracker from "./StreakTracker"
import { achievementService } from "../services/achievementService"
import AchievementNotification from "./AchievementNotification"
import type { UserAchievement } from "../services/achievementService"
import ProgressSection from "./ProgressSection"
import AddFoodMenu from "./AddFoodMenu"

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
  const [showWeightTracker, setShowWeightTracker] = useState(false)
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
  const [currentPage, setCurrentPage] = useState<"home" | "progress" | "settings">("home")
  const [achievementNotifications, setAchievementNotifications] = useState<UserAchievement[]>([])
  const [showProgress, setShowProgress] = useState(false)

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

    try {
      const newAchievements = await achievementService.checkAndAwardAchievements(userId)
      if (newAchievements.length > 0) {
        setAchievementNotifications((prev) => [...prev, ...newAchievements])
      }
    } catch (error) {
      console.error("Error checking achievements:", error)
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

  if (showWeightTracker) {
    return <WeightTracker userId={userId} onClose={() => setShowWeightTracker(false)} />
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

  if (currentPage === "settings") {
    return <SettingsSection userId={userId} onClose={() => setCurrentPage("home")} onLogout={handleLogout} />
  }

  if (currentPage === "progress" && profile) {
    return (
      <ProgressSection
        userId={userId}
        onClose={() => setCurrentPage("home")}
        remainingCalories={profile.daily_calories - todayCalories}
        remainingProtein={profile.daily_protein - todayProtein}
        remainingCarbs={profile.daily_carbs - todayCarbs}
        remainingFats={profile.daily_fats - todayFats}
        goal={profile.goal}
        todayLogs={todayLogs}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-slate-100 glass-bg">
      {achievementNotifications.map((achievement, index) => (
        <AchievementNotification
          key={achievement.id}
          achievement={achievement}
          onClose={() => {
            setAchievementNotifications((prev) => prev.filter((a) => a.id !== achievement.id))
          }}
        />
      ))}

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
              className="sm:hidden p-1.5 glass-effect rounded-xl transition-all shadow-lg hover:shadow-xl"
              title="Open Menu"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="hidden sm:grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
          {/* Removed all quick action buttons - they're now in Progress section */}
        </div>

        <StreakTracker userId={userId} />

        <div className="glass-effect rounded-3xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-6 transition-all hover:shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3 sm:gap-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Daily Goals</h2>
            <div className="hidden sm:flex flex-col xs:flex-row items-stretch xs:items-center gap-2">
              <button
                onClick={handleOpenGoalEditor}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-white/60 hover:bg-white/80 backdrop-blur-sm text-gray-700 rounded-xl transition-all text-xs sm:text-sm font-medium shadow-md hover:shadow-lg"
                title="Edit daily goals"
              >
                <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Edit Goals
              </button>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-5">
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 sm:p-7 shadow-lg border border-white/60">
              <div className="flex items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-bold text-gray-900">{todayCalories}</span>
                    <span className="text-lg sm:text-xl text-gray-400 font-medium">/{profile.daily_calories}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">Calories eaten</p>
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
                      strokeLinecap="butt"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-gray-100 rounded-full p-2">
                      <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-gray-800" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-md border border-white/60">
                <div className="flex flex-col items-start h-full">
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg sm:text-xl font-bold text-gray-900">{Math.round(todayProtein)}</span>
                    <span className="text-[10px] sm:text-xs text-gray-400 font-medium">/{profile.daily_protein}g</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-600 mb-2">Protein eaten</p>
                  <div className="relative w-16 h-16 sm:w-18 sm:h-18 mt-auto self-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="50%"
                        cy="50%"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        className="text-red-100"
                      />
                      <circle
                        cx="50%"
                        cy="50%"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 28}`}
                        strokeDashoffset={`${2 * Math.PI * 28 * (1 - Math.min(todayProtein / profile.daily_protein, 1))}`}
                        className="text-red-500 transition-all duration-500"
                        strokeLinecap="butt"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-gray-100 rounded-full p-1">
                        <Beef className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-md border border-white/60">
                <div className="flex flex-col items-start h-full">
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg sm:text-xl font-bold text-gray-900">{Math.round(todayCarbs)}</span>
                    <span className="text-[10px] sm:text-xs text-gray-400 font-medium">/{profile.daily_carbs}g</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-600 mb-2">Carbs eaten</p>
                  <div className="relative w-16 h-16 sm:w-18 sm:h-18 mt-auto self-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="50%"
                        cy="50%"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        className="text-orange-100"
                      />
                      <circle
                        cx="50%"
                        cy="50%"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 28}`}
                        strokeDashoffset={`${2 * Math.PI * 28 * (1 - Math.min(todayCarbs / profile.daily_carbs, 1))}`}
                        className="text-orange-500 transition-all duration-500"
                        strokeLinecap="butt"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-gray-100 rounded-full p-1">
                        <Cookie className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-md border border-white/60">
                <div className="flex flex-col items-start h-full">
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg sm:text-xl font-bold text-gray-900">{Math.round(todayFats)}</span>
                    <span className="text-[10px] sm:text-xs text-gray-400 font-medium">/{profile.daily_fats}g</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-600 mb-2">Fats eaten</p>
                  <div className="relative w-16 h-16 sm:w-18 sm:h-18 mt-auto self-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="50%"
                        cy="50%"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        className="text-blue-100"
                      />
                      <circle
                        cx="50%"
                        cy="50%"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 28}`}
                        strokeDashoffset={`${2 * Math.PI * 28 * (1 - Math.min(todayFats / profile.daily_fats, 1))}`}
                        className="text-blue-500 transition-all duration-500"
                        strokeLinecap="butt"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-gray-100 rounded-full p-1">
                        <Droplet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleOpenGoalEditor}
              className="flex sm:hidden items-center justify-center gap-2 w-full px-3 py-2 bg-white/60 hover:bg-white/80 backdrop-blur-sm text-gray-700 rounded-xl transition-all text-xs font-medium shadow-md hover:shadow-lg"
              title="Edit daily goals"
            >
              <Settings className="w-3.5 h-3.5" />
              Edit Goals
            </button>
          </div>
        </div>

        {todayLogs.length > 0 && (
          <div className="glass-effect rounded-3xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-6 transition-all hover:shadow-2xl">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Today's Meals</h2>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <div className="space-y-2 sm:space-y-3">
                  {todayLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex justify-between items-center p-3 sm:p-4 bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl group hover:shadow-lg transition-all border border-white/40"
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
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 z-40 shadow-lg backdrop-blur-[20px] border-t border-white/30"
        style={{
          background: "linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(240,244,247,0.7))",
        }}
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          {/* Navigation items container with equal flex */}
          <div className="flex-1 flex items-center">
            <button
              onClick={() => setCurrentPage("home")}
              className={`flex-1 flex flex-col items-center gap-1 transition-all ${
                currentPage === "home" ? "text-gray-700" : "text-gray-400"
              }`}
            >
              <Home className="w-6 h-6" strokeWidth={1.5} />
              <span className={`text-sm ${currentPage === "home" ? "font-semibold" : "font-medium"}`}>Home</span>
            </button>

            <button
              onClick={() => setCurrentPage("progress")}
              className={`flex-1 flex flex-col items-center gap-1 transition-all ${
                currentPage === "progress" ? "text-gray-700" : "text-gray-400"
              }`}
            >
              <BarChart3 className="w-6 h-6" strokeWidth={1.5} />
              <span className={`text-sm ${currentPage === "progress" ? "font-semibold" : "font-medium"}`}>
                Progress
              </span>
            </button>

            <button
              onClick={() => setCurrentPage("settings")}
              className={`flex-1 flex flex-col items-center gap-1 transition-all ${
                currentPage === "settings" ? "text-gray-700" : "text-gray-400"
              }`}
            >
              <Settings className="w-6 h-6" strokeWidth={1.5} />
              <span className={`text-sm ${currentPage === "settings" ? "font-semibold" : "font-medium"}`}>
                Settings
              </span>
            </button>
          </div>

          {/* Spacer for + button */}
          <div className="w-16" />
        </div>
      </div>

      <AddFoodMenu
        onCameraClick={() => setShowCamera(true)}
        onBarcodeClick={() => setShowBarcodeScanner(true)}
        onManualClick={() => setShowManualEntry(true)}
      />

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
                  setCurrentPage("progress")
                  setShowMobileSidebar(false)
                }}
                className="w-full flex items-center gap-3 p-4 bg-gradient-to-br from-emerald-50 to-teal-100 hover:from-emerald-100 hover:to-teal-200 rounded-xl transition-all border-2 border-emerald-200"
              >
                <BarChart3 className="w-6 h-6 text-emerald-600" />
                <span className="font-medium text-emerald-800">Progress</span>
              </button>

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
          <div className="glass-effect rounded-3xl shadow-2xl p-5 sm:p-6 w-full max-w-md">
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
