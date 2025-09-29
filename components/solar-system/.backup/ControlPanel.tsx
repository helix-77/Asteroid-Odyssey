"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Search, Filter, X, AlertTriangle, Shield } from "lucide-react";
import { ControlPanelProps, FilterOptions } from "../types";

const ControlPanel: React.FC<ControlPanelProps> = ({
  onSearch,
  onFilter,
  onSort,
  onReset,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({
    sizeRange: [0, 2000],
    hazardousOnly: false,
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilter(updatedFilters);
  };

  return (
    <Card className="p-4 bg-black/50 backdrop-blur-md border-white/10">
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-white/50" />
          <Input
            type="text"
            placeholder="Search asteroids..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-8 bg-white/5 border-white/10"
          />
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">Size Range (meters)</span>
          </div>
          <Slider
            defaultValue={[0, 2000]}
            max={2000}
            step={10}
            onValueChange={(values) =>
              handleFilterChange({ sizeRange: values as [number, number] })
            }
          />
        </div>

        {/* Hazardous Filter */}
        <Button
          variant={filters.hazardousOnly ? "destructive" : "outline"}
          className="w-full"
          onClick={() =>
            handleFilterChange({ hazardousOnly: !filters.hazardousOnly })
          }
        >
          {filters.hazardousOnly ? (
            <AlertTriangle className="mr-2" />
          ) : (
            <Shield className="mr-2" />
          )}
          {filters.hazardousOnly ? "Hazardous Only" : "All Asteroids"}
        </Button>

        {/* Sort Options */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onSort("size")}>
            Size
          </Button>
          <Button variant="outline" size="sm" onClick={() => onSort("date")}>
            Date
          </Button>
          <Button variant="outline" size="sm" onClick={() => onSort("threat")}>
            Threat
          </Button>
        </div>

        {/* Reset Button */}
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => {
            setSearchQuery("");
            setFilters({ sizeRange: [0, 2000], hazardousOnly: false });
            onReset();
          }}
        >
          <X className="mr-2" />
          Reset All
        </Button>
      </div>
    </Card>
  );
};

export default ControlPanel;
