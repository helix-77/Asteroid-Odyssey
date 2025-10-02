"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

export function HelpButton() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <HelpCircle className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-md">
          <div className="space-y-2">
            <h3 className="font-semibold">How to Use</h3>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>Select an asteroid from the dropdown</li>
              <li>Choose a region or use global view</li>
              <li>Click anywhere on the map to simulate an impact</li>
              <li>Use play/reset controls to see effects over time</li>
              <li>Toggle layers to view different data overlays</li>
            </ol>
            <div className="mt-3 p-2 bg-muted/50 rounded text-xs">
              <p className="font-medium mb-1">⚠️ Scientific Accuracy</p>
              <p className="text-muted-foreground">
                Calculations based on established impact models with clear
                provenance indicators
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
