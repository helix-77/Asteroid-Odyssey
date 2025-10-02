"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface LayerControlsProps {
  activeLayer: string;
  onLayerChange: (layer: string) => void;
}

const LAYERS = [
  {
    id: "population",
    label: "Population Density",
    icon: "👥",
    color: "bg-blue-500",
  },
  {
    id: "habitability",
    label: "Habitability",
    icon: "⛰️",
    color: "bg-green-500",
  },
  { id: "tsunami", label: "Tsunami Risk", icon: "🌊", color: "bg-blue-600" },
  {
    id: "tectonic",
    label: "Tectonic Activity",
    icon: "⚡",
    color: "bg-orange-500",
  },
];

export function LayerControls({
  activeLayer,
  onLayerChange,
}: LayerControlsProps) {
  return (
    <Card className="p-2 bg-background/95 backdrop-blur-sm shadow-lg">
      <div className="space-y-1">
        <div className="text-xs font-semibold text-muted-foreground px-2 mb-2">
          Map Layers
        </div>
        {LAYERS.map((layer) => (
          <Button
            key={layer.id}
            size="sm"
            variant={activeLayer === layer.id ? "default" : "ghost"}
            onClick={() => onLayerChange(layer.id)}
            className="w-full justify-start text-sm"
          >
            <span className="mr-2">{layer.icon}</span>
            {layer.label}
          </Button>
        ))}
      </div>
    </Card>
  );
}
