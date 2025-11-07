"use client"

import { useState } from "react"
import { X, User, Users, Bell, Trophy, History, LogOut, SettingsIcon } from "lucide-react"
import NotificationsView from "./NotificationsView"
import SocialView from "./SocialView"
import AchievementsView from "./AchievementsView"
import HistoryView from "./HistoryView"

interface SettingsSectionProps {
  userId: string
  onClose: () => void
  onLogout: () => void
}

type SettingsTab = "profile" | "social" | "notifications" | "achievements" | "history"

export default function SettingsSection({ userId, onClose, onLogout }: SettingsSectionProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile")

  const menuItems = [
    { id: "profile", label: "Personal Details", icon: User, color: "text-gray-600" },
    { id: "social", label: "Social", icon: Users, color: "text-blue-600" },
    { id: "notifications", label: "Notifications", icon: Bell, color: "text-amber-600" },
    { id: "achievements", label: "Achievements", icon: Trophy, color: "text-amber-500" },
    { id: "history", label: "View History", icon: History, color: "text-gray-600" },
  ]

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 flex justify-between items-center p-6 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-6 h-6 text-gray-600" />
            <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Card */}
          {activeTab === "profile" && (
            <div className="bg-white rounded-3xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white">
                  <User className="w-12 h-12" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">User Profile</h2>
                  <p className="text-gray-600 mt-1">Manage your account settings</p>
                </div>
              </div>

              {/* Invite Friends Card */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl overflow-hidden shadow-xl mb-8">
                <div className="relative h-48 flex items-center justify-center text-center p-8">
                  <div className="absolute inset-0 bg-black/30" />
                  <div className="relative z-10">
                    <Users className="w-12 h-12 text-white mx-auto mb-4" />
                    <h3 className="text-3xl font-bold text-white mb-4">Invite friends</h3>
                    <p className="text-lg text-white/90 mb-6">The journey is easier together.</p>
                    <button className="bg-white hover:bg-gray-100 text-gray-900 px-8 py-3 rounded-full font-semibold transition-all hover:shadow-lg">
                      Refer a friend to earn $10
                    </button>
                  </div>
                </div>
              </div>

              {/* Settings Menu */}
              <div className="space-y-0">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as SettingsTab)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-b-0 group"
                  >
                    <item.icon className={`w-6 h-6 ${item.color}`} />
                    <span className="text-lg font-medium text-gray-800 group-hover:text-gray-900">{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-4 p-4 text-red-600 hover:bg-red-50 rounded-xl transition-colors mt-6 font-medium"
              >
                <LogOut className="w-6 h-6" />
                <span className="text-lg">Logout</span>
              </button>
            </div>
          )}

          {/* Social View */}
          {activeTab === "social" && (
            <div className="bg-white rounded-3xl shadow-lg p-6 overflow-hidden">
              <button
                onClick={() => setActiveTab("profile")}
                className="mb-4 flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
              >
                ← Back to Settings
              </button>
              <SocialView userId={userId} inline={true} />
            </div>
          )}

          {/* Notifications View */}
          {activeTab === "notifications" && (
            <div className="bg-white rounded-3xl shadow-lg p-6 overflow-hidden">
              <button
                onClick={() => setActiveTab("profile")}
                className="mb-4 flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
              >
                ← Back to Settings
              </button>
              <NotificationsView userId={userId} inline={true} />
            </div>
          )}

          {/* Achievements View */}
          {activeTab === "achievements" && (
            <div className="bg-white rounded-3xl shadow-lg p-6 overflow-hidden">
              <button
                onClick={() => setActiveTab("profile")}
                className="mb-4 flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
              >
                ← Back to Settings
              </button>
              <AchievementsView userId={userId} inline={true} />
            </div>
          )}

          {/* History View */}
          {activeTab === "history" && (
            <div className="bg-white rounded-3xl shadow-lg p-6 overflow-hidden">
              <button
                onClick={() => setActiveTab("profile")}
                className="mb-4 flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
              >
                ← Back to Settings
              </button>
              <HistoryView userId={userId} inline={true} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
