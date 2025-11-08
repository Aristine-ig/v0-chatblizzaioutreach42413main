"use client"

import { useEffect, useState } from "react"
import { Trophy, X } from "lucide-react"
import type { UserAchievement } from "../services/achievementService"

interface AchievementNotificationProps {
  achievement: UserAchievement
  onClose: () => void
}

export default function AchievementNotification({ achievement, onClose }: AchievementNotificationProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setShow(true), 100)

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      setShow(false)
      setTimeout(onClose, 300)
    }, 5000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={`fixed top-4 right-4 z-[100] transition-all duration-300 ${
        show ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl shadow-2xl p-4 pr-12 max-w-sm relative">
        <button
          onClick={() => {
            setShow(false)
            setTimeout(onClose, 300)
          }}
          className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="text-4xl bg-white rounded-xl p-2 shadow-lg">{achievement.achievement?.icon}</div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Achievement Unlocked!</span>
            </div>
            <h3 className="font-bold text-lg">{achievement.achievement?.name}</h3>
            <p className="text-sm text-amber-50">{achievement.achievement?.description}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
