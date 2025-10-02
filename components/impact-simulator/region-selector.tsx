"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe, Map } from "lucide-react";

interface RegionSelectorProps {
  selectedRegion: string;
  onRegionChange: (region: string) => void;
}

const REGIONS = [
  { id: "global", name: "Global View", icon: Globe },
  { id: "asia", name: "Asia", icon: Map },
  { id: "europe", name: "Europe", icon: Map },
  { id: "americas", name: "Americas", icon: Map },
  { id: "africa", name: "Africa", icon: Map },
  { id: "australia", name: "Australia", icon: Map },
];

export function RegionSelector({
  selectedRegion,
  onRegionChange,
}: RegionSelectorProps) {
  const selectedRegionData = REGIONS.find((r) => r.id === selectedRegion);

  return (
    <div className="w-40">
      <Select value={selectedRegion} onValueChange={onRegionChange}>
        <SelectTrigger>
          <SelectValue>
            {selectedRegionData && (
              <div className="flex items-center gap-2">
                <selectedRegionData.icon className="h-4 w-4" />
                <span>{selectedRegionData.name}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {REGIONS.map((region) => {
            const Icon = region.icon;
            return (
              <SelectItem key={region.id} value={region.id}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{region.name}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
