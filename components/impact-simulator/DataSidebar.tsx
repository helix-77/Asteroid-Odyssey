import React from "react";
import type { Asteroid } from "@/lib/types";

interface DataSidebarProps {
  asteroid: Asteroid | null;
  impactLocation: { lat: number; lng: number } | null;
  currentTime: number;
  impactData: any;
}

export const DataSidebar: React.FC<DataSidebarProps> = ({
  asteroid,
  impactLocation,
  currentTime,
  impactData,
}) => {
  const formatNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(0);
  };

  const formatCurrency = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(1)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    return `$${formatNumber(num)}`;
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Asteroid Info */}
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Asteroid Information</h3>
          {asteroid ? (
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium text-gray-900">{asteroid.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Size:</span>
                <span className="font-medium text-gray-900">{asteroid.size || asteroid.diameter}m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Velocity:</span>
                <span className="font-medium text-gray-900">{asteroid.velocity} km/s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Composition:</span>
                <span className="font-medium text-gray-900">{asteroid.composition}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mass:</span>
                <span className="font-medium text-gray-900">{formatNumber(asteroid.mass)} kg</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500">No asteroid selected</p>
          )}
        </div>

        {/* Impact Location */}
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Impact Location</h3>
          {impactLocation ? (
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Latitude:</span>
                <span className="font-medium text-gray-900">{impactLocation.lat.toFixed(2)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Longitude:</span>
                <span className="font-medium text-gray-900">{impactLocation.lng.toFixed(2)}°</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500">Click on map to select</p>
          )}
        </div>

        {/* Impact Data */}
        {impactData && currentTime > 0 && (
          <>
            {/* Geological Impact */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Geological Impact</h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Crater Size:</span>
                  <span className="font-medium text-gray-900">{(impactData.craterSize / 1000).toFixed(1)} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Affected Area:</span>
                  <span className="font-medium text-gray-900">{formatNumber(impactData.affectedArea)} km²</span>
                </div>
              </div>
            </div>

            {/* Population Impact */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Population Impact</h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Casualties:</span>
                  <span className="font-medium text-red-600">{formatNumber(impactData.casualties)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Displaced:</span>
                  <span className="font-medium text-orange-600">{formatNumber(impactData.casualties * 3)}</span>
                </div>
              </div>
            </div>

            {/* Economic Impact */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Economic Impact</h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Direct Damage:</span>
                  <span className="font-medium text-red-600">{formatCurrency(impactData.economicDamage)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Lost Production:</span>
                  <span className="font-medium text-orange-600">{formatCurrency(impactData.economicDamage * 0.5)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Recovery Cost:</span>
                  <span className="font-medium text-yellow-600">{formatCurrency(impactData.economicDamage * 2)}</span>
                </div>
              </div>
            </div>

            {/* Climate Impact */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Climate Impact</h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Global Temperature:</span>
                  <span className="font-medium text-gray-900">{impactData.temperature?.toFixed(1) || "15.0"}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">CO₂ Level:</span>
                  <span className="font-medium text-gray-900">{impactData.co2Level?.toFixed(0) || "410"} ppm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sunlight Reduction:</span>
                  <span className="font-medium text-gray-900">{impactData.sunlightReduction?.toFixed(0) || "0"}%</span>
                </div>
              </div>
            </div>

            {/* Infrastructure Damage */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Infrastructure Damage</h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Military:</span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-red-600 h-2 rounded-full" style={{ width: `${Math.min(currentTime, 100)}%` }}></div>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Energy:</span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-600 h-2 rounded-full" style={{ width: `${Math.min(currentTime * 0.8, 100)}%` }}></div>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cultural:</span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${Math.min(currentTime * 0.6, 100)}%` }}></div>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Civilian:</span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min(currentTime * 0.9, 100)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Natural Disasters */}
            <div className="pb-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Natural Disasters</h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tsunami Risk:</span>
                  <span className={`font-medium ${impactLocation && Math.abs(impactLocation.lat) < 30 ? 'text-red-600' : 'text-green-600'}`}>
                    {impactLocation && Math.abs(impactLocation.lat) < 30 ? 'HIGH' : 'LOW'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tectonic Activity:</span>
                  <span className="font-medium text-orange-600">MODERATE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Volcanic Activity:</span>
                  <span className="font-medium text-yellow-600">ELEVATED</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
