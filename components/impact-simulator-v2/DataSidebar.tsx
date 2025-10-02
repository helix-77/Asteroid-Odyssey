"use client";

import type { Asteroid } from '@/lib/types';
import type { TemporalEffects } from '@/lib/calculations/impact/types';

interface DataSidebarProps {
  timeStep: number;
  selectedAsteroid: Asteroid | null;
  impactData: TemporalEffects | null;
  impactLocation: { lat: number; lng: number } | null;
}

export function DataSidebar({ 
  timeStep, 
  selectedAsteroid, 
  impactData,
  impactLocation 
}: DataSidebarProps) {
  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(0);
  };

  const formatCurrency = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(1)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    return `$${num.toFixed(0)}`;
  };

  return (
    <div className="w-64 bg-white border-l border-slate-200 p-3 space-y-3 overflow-y-auto h-full">
      <div className="pb-2 border-b border-slate-200">
        <h3 className="text-xs text-slate-600 uppercase tracking-wide mb-1">Impact Data</h3>
        {!impactLocation && (
          <p className="text-[10px] text-slate-400 italic">Select impact location on map</p>
        )}
      </div>

      {impactData && impactLocation ? (
        <>
          {/* Casualties */}
          <div className="bg-red-50 rounded p-2">
            <div className="text-[10px] text-slate-500 uppercase mb-0.5">Casualties</div>
            <div className="text-lg text-red-600 font-semibold">
              {formatNumber(impactData.cumulativeCasualties || 0)}
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">
              Immediate: {formatNumber(impactData.immediateCasualties || 0)}
            </div>
          </div>

          {/* Economic Damage */}
          <div className="bg-orange-50 rounded p-2">
            <div className="text-[10px] text-slate-500 uppercase mb-0.5">Economic Damage</div>
            <div className="text-lg text-orange-600 font-semibold">
              {formatCurrency(impactData.economicImpact || 0)}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200">
            <h3 className="text-xs text-slate-600 uppercase tracking-wide mb-2">Climate Impact</h3>
          </div>

          {/* Temperature */}
          <div className="flex justify-between items-center py-1">
            <span className="text-xs text-slate-600">Temperature Change</span>
            <span className={`text-sm font-medium ${impactData.globalTemperature < 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {impactData.globalTemperature > 0 ? '+' : ''}{impactData.globalTemperature.toFixed(1)}°C
            </span>
          </div>

          {/* Sunlight */}
          <div className="flex justify-between items-center py-1">
            <span className="text-xs text-slate-600">Sunlight Reduction</span>
            <span className="text-sm font-medium">
              {impactData.atmosphericDust.toFixed(0)}%
            </span>
          </div>

          {/* CO2 */}
          <div className="flex justify-between items-center py-1">
            <span className="text-xs text-slate-600">CO₂ Increase</span>
            <span className="text-sm font-medium">
              +{impactData.co2Level.toFixed(0)} ppm
            </span>
          </div>

          {/* Ozone Depletion */}
          <div className="flex justify-between items-center py-1">
            <span className="text-xs text-slate-600">Ozone Depletion</span>
            <span className="text-sm font-medium text-purple-600">
              {impactData.ozoneDepletion.toFixed(1)}%
            </span>
          </div>

          <div className="pt-2 border-t border-slate-200">
            <h3 className="text-xs text-slate-600 uppercase tracking-wide mb-2">Resource Impact</h3>
          </div>

          {/* Habitability */}
          <div className="bg-yellow-50 rounded p-2">
            <div className="text-[10px] text-slate-500 uppercase mb-0.5">Habitability Index</div>
            <div className="text-lg text-yellow-700 font-semibold">
              {impactData.habitabilityIndex.toFixed(0)}%
            </div>
          </div>

          {/* Agricultural Capacity */}
          <div className="bg-green-50 rounded p-2">
            <div className="text-[10px] text-slate-500 uppercase mb-0.5">Agricultural Capacity</div>
            <div className="text-lg text-green-700 font-semibold">
              {impactData.agriculturalCapacity.toFixed(0)}%
            </div>
          </div>

          {/* Water Quality */}
          <div className="flex justify-between items-center py-1">
            <span className="text-xs text-slate-600">Water Quality</span>
            <span className="text-sm font-medium">
              {impactData.waterQuality.toFixed(0)}%
            </span>
          </div>

          <div className="pt-2 border-t border-slate-200">
            <h3 className="text-xs text-slate-600 uppercase tracking-wide mb-2">Asteroid Details</h3>
          </div>

          {selectedAsteroid && (
            <>
              {/* Asteroid Size */}
              <div className="flex justify-between items-center py-1">
                <span className="text-xs text-slate-600">Diameter</span>
                <span className="text-sm font-medium">
                  {(selectedAsteroid.size || selectedAsteroid.diameter || 0)} m
                </span>
              </div>

              {/* Velocity */}
              <div className="flex justify-between items-center py-1">
                <span className="text-xs text-slate-600">Velocity</span>
                <span className="text-sm font-medium">
                  {selectedAsteroid.velocity.toFixed(1)} km/s
                </span>
              </div>

              {/* Composition */}
              <div className="flex justify-between items-center py-1">
                <span className="text-xs text-slate-600">Composition</span>
                <span className="text-sm font-medium capitalize">
                  {selectedAsteroid.composition}
                </span>
              </div>
            </>
          )}

          <div className="pt-2 border-t border-slate-200">
            <h3 className="text-xs text-slate-600 uppercase tracking-wide mb-2">Infrastructure</h3>
          </div>

          {/* Infrastructure Status */}
          {impactData.infrastructureDamage && (
            <div className="space-y-1">
              {Array.from(impactData.infrastructureDamage.values()).slice(0, 5).map((infra, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 truncate">{infra.facilityName}</span>
                  <span className={`font-medium ${
                    infra.damageLevel > 0.8 ? 'text-red-600' :
                    infra.damageLevel > 0.5 ? 'text-orange-600' :
                    infra.damageLevel > 0.2 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {infra.damageLevel > 0.8 ? 'Destroyed' :
                     infra.damageLevel > 0.5 ? 'Critical' :
                     infra.damageLevel > 0.2 ? 'Damaged' :
                     'Operational'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-xs text-slate-400 italic text-center py-8">
          Select an asteroid and impact location to see detailed impact data
        </div>
      )}
    </div>
  );
}
