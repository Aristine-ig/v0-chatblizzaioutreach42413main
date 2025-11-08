"use client"

import { useState } from "react"
import { X, BarChart3, Scale, ChefHat, Lightbulb } from "lucide-react"
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Progress</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            aria-label="Close progress section"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Analytics Card */}
            <button
              onClick={() => setActiveSection("analytics")}
              className="w-full bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 hover:shadow-lg transition-all border border-blue-200 text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-8 h-8 text-blue-500" />
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
              className="w-full bg-gradient-to-br from-violet-50 to-violet-100 rounded-2xl p-6 hover:shadow-lg transition-all border border-violet-200 text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                  <Scale className="w-8 h-8 text-violet-500" />
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
              className="w-full bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 hover:shadow-lg transition-all border border-emerald-200 text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                  <ChefHat className="w-8 h-8 text-emerald-600" />
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
              className="w-full bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 hover:shadow-lg transition-all border border-amber-200 text-left group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                  <Lightbulb className="w-8 h-8 text-amber-600" />
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
    </div>
  )
}
