import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface LayerControlsProps {
  activeLayer: string;
  onLayerChange: (layer: string) => void;
}

const layers = [
  {
    id: "population",
    label: "Population Density",
    icon: "👥",
    color: "bg-blue-500",
  },
  { id: "terrain", label: "Terrain", icon: "⛰️", color: "bg-green-500" },
  {
    id: "infrastructure",
    label: "Infrastructure",
    icon: "🏗️",
    color: "bg-yellow-500",
  },
];

export function LayerControls({
  activeLayer,
  onLayerChange,
}: LayerControlsProps) {
  return (
    <Card className="absolute top-4 left-4 p-2 shadow-lg">
      <div className="space-y-1">
        <div className="text-xs font-semibold text-muted-foreground px-2 mb-2">
          Map Layers
        </div>
        {layers.map((layer) => (
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
