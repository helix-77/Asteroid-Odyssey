"use client";

import dynamic from "next/dynamic";

// Dynamically import SolarSystemModel with no SSR to avoid Three.js/Canvas errors
const SolarSystemModel = dynamic(
  () => import("@/components/solar-system/solar-system-model"),
  { 
    ssr: false, 
    loading: () => (
      <div className="min-h-screen space-gradient flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }
);

export default function HomePage() {
  return <SolarSystemModel />;
}
