/**
 * Impact effects calculator based on asteroid parameters
 */

export interface ImpactParameters {
  asteroidDiameter: number; // meters
  velocity: number; // km/s
  density: number; // kg/m³
  impactAngle: number; // degrees
  targetType: 'land' | 'water';
}

export interface ImpactEffects {
  kineticEnergy: number; // Joules
  tntEquivalent: number; // megatons
  craterDiameter: number; // meters
  craterDepth: number; // meters
  fireballRadius: number; // km
  thermalRadius: number; // km
  blastRadius: number; // km
  seismicMagnitude: number;
  ejectaVolume: number; // cubic meters
  estimatedCasualties: number;
  affectedArea: number; // km²
  economicDamage: number; // USD
}

export function calculateImpactEffects(params: ImpactParameters): ImpactEffects {
  const { asteroidDiameter, velocity, density, impactAngle, targetType } = params;
  
  // Convert units
  const velocityMs = velocity * 1000; // km/s to m/s
  const radius = asteroidDiameter / 2;
  const volume = (4/3) * Math.PI * Math.pow(radius, 3);
  const mass = density * volume;
  
  // Kinetic energy: E = 0.5 * m * v²
  const kineticEnergy = 0.5 * mass * Math.pow(velocityMs, 2);
  
  // TNT equivalent (1 megaton = 4.184 × 10^15 J)
  const tntEquivalent = kineticEnergy / (4.184e15);
  
  // Crater size (simplified scaling laws)
  const effectiveEnergy = kineticEnergy * Math.sin(impactAngle * Math.PI / 180);
  const craterDiameter = 2 * Math.pow(effectiveEnergy / 1e12, 0.3) * (targetType === 'water' ? 0.7 : 1);
  const craterDepth = craterDiameter / 4;
  
  // Thermal effects
  const fireballRadius = Math.pow(tntEquivalent, 0.4) * 2;
  const thermalRadius = fireballRadius * 3;
  
  // Blast effects
  const blastRadius = Math.pow(tntEquivalent, 0.33) * 5;
  
  // Seismic effects (Richter scale approximation)
  const seismicMagnitude = Math.min(9.5, 0.67 * Math.log10(kineticEnergy) - 5.87);
  
  // Ejecta volume
  const ejectaVolume = Math.PI * Math.pow(craterDiameter/2, 2) * craterDepth * 0.5;
  
  // Casualties estimation (very simplified - depends heavily on impact location)
  // Assuming average population density
  const affectedArea = Math.PI * Math.pow(blastRadius, 2);
  const avgPopulationDensity = 50; // people per km²
  const estimatedCasualties = Math.floor(affectedArea * avgPopulationDensity * 0.1);
  
  // Economic damage (rough estimate)
  const economicDamage = estimatedCasualties * 1000000 + affectedArea * 10000000;
  
  return {
    kineticEnergy,
    tntEquivalent,
    craterDiameter,
    craterDepth,
    fireballRadius,
    thermalRadius,
    blastRadius,
    seismicMagnitude,
    ejectaVolume,
    estimatedCasualties,
    affectedArea,
    economicDamage
  };
}

export function calculateTimeBasedEffects(
  initialEffects: ImpactEffects,
  timeYears: number
): {
  temperature: number;
  co2Level: number;
  sunlightReduction: number;
  habitability: number;
} {
  // Climate effects over time
  const initialTempDrop = Math.min(10, initialEffects.tntEquivalent / 1000);
  const temperature = 15 - initialTempDrop * Math.exp(-timeYears / 5);
  
  // CO2 increase from fires and disruption
  const co2Increase = Math.min(100, initialEffects.tntEquivalent / 10);
  const co2Level = 410 + co2Increase * (1 - Math.exp(-timeYears / 10));
  
  // Sunlight reduction from dust and ash
  const initialReduction = Math.min(90, initialEffects.tntEquivalent / 100);
  const sunlightReduction = initialReduction * Math.exp(-timeYears / 2);
  
  // Overall habitability score (0-100)
  const habitability = Math.max(0, 100 - initialTempDrop * 5 - sunlightReduction);
  
  return {
    temperature,
    co2Level,
    sunlightReduction,
    habitability
  };
}
