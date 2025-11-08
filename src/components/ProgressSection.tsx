"use client"

import { useState } from "react"
import { BarChart3, Scale, ChefHat, Lightbulb, ArrowLeft } from "lucide-react"
import AnalyticsView from "./AnalyticsView"
import WeightTracker from "./WeightTracker"
import MealRecommendations from "./MealRecommendations"
import HealthierAlternatives from "./HealthierAlternatives"
import type { FoodLog } from "../lib/supabase"

interface ProgressSectionProps {
  userId: string
  onClose: () => void
  remainingCalories: number
  remainingProtein: number
  remainingCarbs: number
  remainingFats: number
  goal: "bulk" | "cut"
  todayLogs: FoodLog[]
}

export default function ProgressSection({
  userId,
  onClose,
  remainingCalories,
  remainingProtein,
  remainingCarbs,
  remainingFats,
  goal,
  todayLogs,
}: ProgressSectionProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null)

  if (activeSection === "analytics") {
    return <AnalyticsView userId={userId} onClose={() => setActiveSection(null)} />
  }

  if (activeSection === "weight") {
    return <WeightTracker userId={userId} onClose={() => setActiveSection(null)} />
  }

  if (activeSection === "meals") {
    return (
      <MealRecommendations
        remainingCalories={remainingCalories}
        remainingProtein={remainingProtein}
        remainingCarbs={remainingCarbs}
        remainingFats={remainingFats}
        goal={goal}
        onClose={() => setActiveSection(null)}
      />
    )
  }

  if (activeSection === "alternatives") {
    const latestLog = todayLogs[0]
    if (!latestLog) {
      setActiveSection(null)
      return null
    }
    return (
      <HealthierAlternatives
        foodName={latestLog.food_name}
        calories={latestLog.calories}
        protein={latestLog.protein}
        carbs={latestLog.carbs}
        fats={latestLog.fats}
        goal={goal}
        onClose={() => setActiveSection(null)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-slate-100 glass-bg pb-24">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 pt-4">
          <button
            onClick={onClose}
            className="p-2 glass-effect rounded-xl hover:shadow-lg transition-all"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Progress
          </h2>
        </div>

        {/* Progress Cards */}
        <div className="space-y-4">
          {/* Analytics Card */}
          <button
            onClick={() => setActiveSection("analytics")}
            className="w-full glass-effect rounded-3xl p-6 hover:shadow-xl transition-all text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-1">Analytics</h3>
                <p className="text-sm text-gray-600">View your nutrition trends and progress over time</p>
              </div>
            </div>
          </button>

          {/* Weight Tracker Card */}
          <button
            onClick={() => setActiveSection("weight")}
            className="w-full glass-effect rounded-3xl p-6 hover:shadow-xl transition-all text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                <Scale className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-1">Weight Tracker</h3>
                <p className="text-sm text-gray-600">Track your weight changes and body composition</p>
              </div>
            </div>
          </button>

          {/* AI Meal Recommendations Card */}
          <button
            onClick={() => setActiveSection("meals")}
            className="w-full glass-effect rounded-3xl p-6 hover:shadow-xl transition-all text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                <ChefHat className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-1">AI Meal Suggestions</h3>
                <p className="text-sm text-gray-600">Get personalized meal recommendations based on your goals</p>
              </div>
            </div>
          </button>

          {/* Healthier Alternatives Card */}
          <button
            onClick={() => setActiveSection("alternatives")}
            disabled={todayLogs.length === 0}
            className="w-full glass-effect rounded-3xl p-6 hover:shadow-xl transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                <Lightbulb className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-1">Healthier Alternatives</h3>
                <p className="text-sm text-gray-600">
                  {todayLogs.length > 0
                    ? "Discover better food options for your logged meals"
                    : "Log a meal to see alternatives"}
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
