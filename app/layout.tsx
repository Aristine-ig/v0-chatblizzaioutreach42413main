import type React from "react"
import type { Metadata } from "next"
import "../styles/globals.css"

export const metadata: Metadata = {
  title: "NutriTrack",
  description: "Track your nutrition with AI",
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
