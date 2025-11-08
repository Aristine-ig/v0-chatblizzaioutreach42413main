"use client"

import { useState, useEffect } from "react"
import { X, User, Users, Bell, Trophy, LogOut, SettingsIcon, Edit2, Download, ImageIcon } from "lucide-react"
import NotificationsView from "./NotificationsView"
import SocialView from "./SocialView"
import AchievementsView from "./AchievementsView"
import MealGallery from "./MealGallery"
import ProfileEdit from "./ProfileEdit"
import ExportView from "./ExportView"
import { supabase, type UserProfile } from "../lib/supabase"

interface SettingsSectionProps {
  userId: string
  onClose: () => void
  onLogout: () => void
}

type SettingsTab = "profile" | "social" | "notifications" | "achievements" | "mealHistory" | "export"

export default function SettingsSection({ userId, onClose, onLogout }: SettingsSectionProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile")
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [showProfileEdit, setShowProfileEdit] = useState(false)

  useEffect(() => {
    loadUserProfile()
  }, [userId])

  const loadUserProfile = async () => {
    try {
      const { data } = await supabase.from("user_profiles").select("*").eq("id", userId).maybeSingle()

      if (data) {
        setUserProfile(data)
      }
    } catch (error) {
      console.error("Error loading profile:", error)
    }
  }

  const handleProfileUpdate = () => {
    loadUserProfile()
  }

  const menuItems = [
    { id: "profile", label: "Personal Details", icon: User, color: "text-gray-600" },
    { id: "social", label: "Social", icon: Users, color: "text-blue-600" },
    { id: "notifications", label: "Notifications", icon: Bell, color: "text-amber-600" },
    { id: "achievements", label: "Achievements", icon: Trophy, color: "text-amber-500" },
    { id: "mealHistory", label: "Meal History", icon: ImageIcon, color: "text-pink-500" },
    { id: "export", label: "Export Data", icon: Download, color: "text-green-600" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-slate-100 glass-bg pb-24">
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 flex justify-between items-center p-4 sm:p-6 rounded-2xl sm:rounded-3xl mb-4 sm:mb-6 z-10">
          <div className="flex items-center gap-2 sm:gap-3">
            <SettingsIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Settings</h1>
          </div>
          <button onClick={onClose} className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Profile Card */}
          {activeTab === "profile" && (
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 md:p-8 hover:shadow-xl transition-shadow space-y-4 sm:space-y-6">
              <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
                  <User className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">User Profile</h2>
                  <p className="text-sm sm:text-base text-gray-600 mt-0.5 sm:mt-1">Manage your account settings</p>
                </div>
              </div>

              {userProfile && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800">Personal Details</h3>
                    <button
                      onClick={() => setShowProfileEdit(true)}
                      className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors text-xs sm:text-sm font-medium"
                    >
                      <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Edit
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-gray-600 text-xs sm:text-sm font-medium">Age</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{userProfile.age}</p>
                      <p className="text-xs text-gray-500">years</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs sm:text-sm font-medium">Height</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{userProfile.height}</p>
                      <p className="text-xs text-gray-500">cm</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs sm:text-sm font-medium">Weight</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{userProfile.weight}</p>
                      <p className="text-xs text-gray-500">kg</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs sm:text-sm font-medium">Goal</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 capitalize">{userProfile.goal}</p>
                      <p className="text-xs text-gray-500">
                        {userProfile.goal === "bulk" ? "Muscle Gain" : "Weight Loss"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-0">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as SettingsTab)}
                    className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-b-0 group"
                  >
                    <item.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${item.color} flex-shrink-0`} />
                    <span className="text-base sm:text-lg font-medium text-gray-800 group-hover:text-gray-900">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>

              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
              >
                <LogOut className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                <span className="text-base sm:text-lg">Logout</span>
              </button>
            </div>
          )}

          {activeTab === "social" && (
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 overflow-hidden">
              <button
                onClick={() => setActiveTab("profile")}
                className="mb-3 sm:mb-4 flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium text-sm sm:text-base"
              >
                ← Back to Settings
              </button>
              <SocialView userId={userId} inline={true} />
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 overflow-hidden">
              <button
                onClick={() => setActiveTab("profile")}
                className="mb-3 sm:mb-4 flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium text-sm sm:text-base"
              >
                ← Back to Settings
              </button>
              <NotificationsView userId={userId} inline={true} />
            </div>
          )}

          {activeTab === "achievements" && (
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 overflow-hidden">
              <button
                onClick={() => setActiveTab("profile")}
                className="mb-3 sm:mb-4 flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium text-sm sm:text-base"
              >
                ← Back to Settings
              </button>
              <AchievementsView userId={userId} inline={true} />
            </div>
          )}

          {activeTab === "mealHistory" && (
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 overflow-hidden">
              <button
                onClick={() => setActiveTab("profile")}
                className="mb-3 sm:mb-4 flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium text-sm sm:text-base"
              >
                ← Back to Settings
              </button>
              <MealGallery userId={userId} onClose={() => setActiveTab("profile")} inline={true} />
            </div>
          )}

          {activeTab === "export" && (
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg overflow-hidden">
              <button
                onClick={() => setActiveTab("profile")}
                className="m-4 sm:m-6 mb-0 flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium text-sm sm:text-base"
              >
                ← Back to Settings
              </button>
              <div className="p-4 sm:p-6">
                <ExportView userId={userId} onClose={() => setActiveTab("profile")} />
              </div>
            </div>
          )}
        </div>
      </div>

      {showProfileEdit && (
        <ProfileEdit userId={userId} onClose={() => setShowProfileEdit(false)} onUpdate={handleProfileUpdate} />
      )}
    </div>
  )
}
