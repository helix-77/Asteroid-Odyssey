import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"
import { MainNav } from "@/components/navigation/main-nav"

export const metadata: Metadata = {
  title: "NASA Asteroid Defense System | Earth's Digital Shield",
  description:
    "Interactive asteroid impact simulation and deflection strategy platform. Track real asteroids, simulate impacts, and test Earth's defenses.",
  generator: "v0.app",
  keywords: "NASA, asteroid, impact, simulation, space, defense, Earth, deflection",
  authors: [{ name: "NASA Space Apps 2025" }],
  openGraph: {
    title: "NASA Asteroid Defense System",
    description: "When the sky falls, will you be ready?",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <Suspense fallback={<div>Loading...</div>}>
          <MainNav />
          <main className="pt-16">{children}</main>
          <Analytics />
        </Suspense>
      </body>
    </html>
  )
}
