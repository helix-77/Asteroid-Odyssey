"use client";

import dynamic from "next/dynamic";

// Dynamically import the map component with SSR disabled
const ImpactMap = dynamic(() => import("./ImpactMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-muted/50 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    </div>
  ),
});

export default ImpactMap;
