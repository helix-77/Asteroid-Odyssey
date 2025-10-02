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
    label: "Population",
    icon: "👥",
    color: "bg-blue-500",
  },
  {
    id: "habitability",
    label: "Habitability",
    icon: "⛰️",
    color: "bg-green-500",
  },
  { id: "tsunami", label: "Tsunami", icon: "🌊", color: "bg-blue-600" },
  {
    id: "tectonic",
    label: "Tectonic",
    icon: "⚡",
    color: "bg-orange-500",
  },
];

export function LayerControls({
  activeLayer,
  onLayerChange,
}: LayerControlsProps) {
  return (
    <Card className="p-1 bg-background/95 backdrop-blur-sm shadow-lg">
      <div className="flex gap-1">
        {LAYERS.map((layer) => (
          <Button
            key={layer.id}
            size="sm"
            variant={activeLayer === layer.id ? "default" : "ghost"}
            onClick={() => onLayerChange(layer.id)}
            className="px-2 py-1 text-xs h-auto"
            title={layer.label}
          >
            <span className="mr-1">{layer.icon}</span>
            {layer.label}
          </Button>
        ))}
      </div>
    </Card>
  );
}
