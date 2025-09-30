"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Rocket, Shield, Target, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import Earth3D from "@/components/3d/earth-3d";

// Dynamically import SolarSystemModel with no SSR to avoid Three.js/Canvas errors
const SolarSystemModel = dynamic(
  () => import("@/components/solar-system/solar-system-model"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen space-gradient flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="relative">
            <div className="animate-spin rounded-full h-32 w-32 border-4 border-transparent border-t-orange-500 border-r-orange-500 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Rocket className="h-12 w-12 text-orange-500 animate-pulse" />
            </div>
          </div>
          <p className="mt-6 text-white text-lg font-medium">
            Initializing Solar System...
          </p>
          <p className="mt-2 text-gray-400 text-sm">
            Loading asteroid tracking data
          </p>
        </motion.div>
      </div>
    ),
  }
);

export default function HomePage() {
  const [showHero, setShowHero] = useState(true);
  const [isEntering, setIsEntering] = useState(false);

  const handleEnterExperience = () => {
    setIsEntering(true);
    setTimeout(() => setShowHero(false), 800);
  };

  // Auto-hide hero after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (showHero) handleEnterExperience();
    }, 5000);
    return () => clearTimeout(timer);
  }, [showHero]);

  return (
    <>
      {/* Main Solar System Experience */}
      <SolarSystemModel />
    </>
  );
}
