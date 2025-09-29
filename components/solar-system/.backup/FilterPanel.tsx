"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { AlertTriangle, Shield } from "lucide-react";
import { FilterOptions } from "../types";

interface FilterPanelProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
}) => {
  const handleSizeRangeChange = (values: number[]) => {
    onFilterChange({
      ...filters,
      sizeRange: values as [number, number],
    });
  };

  const toggleHazardousOnly = () => {
    onFilterChange({
      ...filters,
      hazardousOnly: !filters.hazardousOnly,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/70">Size Range (meters)</span>
          <span className="text-sm text-white/50">
            {filters.sizeRange[0]} - {filters.sizeRange[1]}m
          </span>
        </div>
        <Slider
          value={filters.sizeRange}
          max={2000}
          step={10}
          onValueChange={handleSizeRangeChange}
        />
      </div>

      <Button
        variant={filters.hazardousOnly ? "destructive" : "outline"}
        className="w-full"
        onClick={toggleHazardousOnly}
      >
        {filters.hazardousOnly ? (
          <AlertTriangle className="mr-2" />
        ) : (
          <Shield className="mr-2" />
        )}
        {filters.hazardousOnly ? "Hazardous Only" : "All Asteroids"}
      </Button>
    </div>
  );
};

export default FilterPanel;
