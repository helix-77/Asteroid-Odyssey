interface DataSidebarProps {
  timeStep: number;
  selectedAsteroid: any;
  impactData: any;
}

export function DataSidebar({ timeStep, selectedAsteroid, impactData }: DataSidebarProps) {
  // Calculate values based on time step
  const baseCasualties = selectedAsteroid?.baseCasualties || 0;
  const casualties = Math.floor(baseCasualties * (1 + timeStep * 0.15));
  
  const baseEconomicDamage = selectedAsteroid?.economicDamage || 0;
  const economicDamage = (baseEconomicDamage * (1 + timeStep * 0.2)).toFixed(1);
  
  const temperature = (15 - timeStep * 0.8).toFixed(1);
  const sunlight = Math.max(20, 100 - timeStep * 8).toFixed(0);
  const co2Density = (410 + timeStep * 25).toFixed(0);
  const habitableLoss = Math.min(95, timeStep * 8).toFixed(0);
  const resourceLoss = Math.min(90, timeStep * 6).toFixed(0);

  return (
    <div className="w-64 bg-white border-l border-slate-200 p-3 space-y-3 overflow-y-auto">
      <div className="pb-2 border-b border-slate-200">
        <h3 className="text-xs text-slate-600 uppercase tracking-wide mb-1">Impact Data</h3>
      </div>

      {/* Casualties */}
      <div className="bg-slate-50 rounded p-2">
        <div className="text-[10px] text-slate-500 uppercase mb-0.5">Casualties</div>
        <div className="text-lg text-red-600">{casualties.toLocaleString()}</div>
      </div>

      {/* Economic Damage */}
      <div className="bg-slate-50 rounded p-2">
        <div className="text-[10px] text-slate-500 uppercase mb-0.5">Economic Damage</div>
        <div className="text-lg text-orange-600">${economicDamage}T</div>
      </div>

      <div className="pt-2 border-t border-slate-200">
        <h3 className="text-xs text-slate-600 uppercase tracking-wide mb-2">Climate Impact</h3>
      </div>

      {/* Temperature */}
      <div className="flex justify-between items-center py-1">
        <span className="text-xs text-slate-600">Avg Temperature</span>
        <span className="text-sm">{temperature}°C</span>
      </div>

      {/* Sunlight */}
      <div className="flex justify-between items-center py-1">
        <span className="text-xs text-slate-600">Sunlight Access</span>
        <span className="text-sm">{sunlight}%</span>
      </div>

      {/* CO2 */}
      <div className="flex justify-between items-center py-1">
        <span className="text-xs text-slate-600">CO₂ Density</span>
        <span className="text-sm">{co2Density} ppm</span>
      </div>

      <div className="pt-2 border-t border-slate-200">
        <h3 className="text-xs text-slate-600 uppercase tracking-wide mb-2">Resource Impact</h3>
      </div>

      {/* Habitable Area Loss */}
      <div className="bg-red-50 rounded p-2">
        <div className="text-[10px] text-slate-500 uppercase mb-0.5">Habitable Area Loss</div>
        <div className="text-lg text-red-600">{habitableLoss}%</div>
      </div>

      {/* Natural Resources Loss */}
      <div className="bg-orange-50 rounded p-2">
        <div className="text-[10px] text-slate-500 uppercase mb-0.5">Natural Resources Loss</div>
        <div className="text-lg text-orange-600">{resourceLoss}%</div>
      </div>

      <div className="pt-2 border-t border-slate-200">
        <h3 className="text-xs text-slate-600 uppercase tracking-wide mb-2">Crater Details</h3>
      </div>

      {/* Crater Size */}
      <div className="flex justify-between items-center py-1">
        <span className="text-xs text-slate-600">Crater Diameter</span>
        <span className="text-sm">{selectedAsteroid?.craterSize || 0} km</span>
      </div>

      {/* Impact Energy */}
      <div className="flex justify-between items-center py-1">
        <span className="text-xs text-slate-600">Impact Energy</span>
        <span className="text-sm">{selectedAsteroid?.energy || 0} MT</span>
      </div>

      <div className="pt-2 border-t border-slate-200">
        <h3 className="text-xs text-slate-600 uppercase tracking-wide mb-2">Infrastructure</h3>
      </div>

      {/* Infrastructure Status */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-600">Energy Grid</span>
          <span className={timeStep > 2 ? 'text-red-600' : 'text-green-600'}>
            {timeStep > 2 ? 'Critical' : 'Operational'}
          </span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-600">Military Bases</span>
          <span className={timeStep > 3 ? 'text-red-600' : 'text-green-600'}>
            {timeStep > 3 ? 'Damaged' : 'Operational'}
          </span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-600">Cultural Sites</span>
          <span className={timeStep > 4 ? 'text-red-600' : 'text-green-600'}>
            {timeStep > 4 ? 'Destroyed' : 'Intact'}
          </span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-600">Civilian Centers</span>
          <span className={timeStep > 1 ? 'text-red-600' : 'text-green-600'}>
            {timeStep > 1 ? 'Severe' : 'Stable'}
          </span>
        </div>
      </div>
    </div>
  );
}
