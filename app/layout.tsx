import type React from "react"
import "../styles/globals.css"

export const metadata = {
  title: "NutriTrack - AI-Powered Food Nutrition Tracker",
  description: "Track your nutrition effortlessly with AI-powered food scanning",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
