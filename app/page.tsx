"use client";

import { Suspense } from "react";
import SolarSystemModel from "@/components/solar-system/solar-system-model";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen space-gradient flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
        // sadh
      }
    >
      <SolarSystemModel />
    </Suspense>
  );
}
