import { Card } from './ui/card';

interface MapLegendProps {
  showImpactEffects: boolean;
}

export function MapLegend({ showImpactEffects }: MapLegendProps) {
  return (
    <Card className="absolute bottom-4 left-4 p-3 shadow-lg">
      <div className="space-y-2">
        <div className="text-xs font-semibold mb-2">Legend</div>
        
        {!showImpactEffects && (
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#94d82d] border border-[#2b8a3e]" />
              <span>Land</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#a5d8ff] border border-[#339af0]" />
              <span>Water</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-400/40 border border-blue-500" />
              <span>Population Centers</span>
            </div>
          </div>
        )}

        {showImpactEffects && (
          <div className="space-y-1 text-xs">
            <div className="font-medium mb-1">Blast Effects</div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>20 psi - Total Destruction</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span>10 psi - Heavy Damage</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>5 psi - Moderate Damage</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-300" />
              <span>1 psi - Glass Breakage</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-3 h-3 rounded-full bg-black" />
              <span>Impact Crater</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-red-400 border-dashed" />
              <span>Thermal Radiation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-yellow-400" />
              <span>Seismic Effects</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}