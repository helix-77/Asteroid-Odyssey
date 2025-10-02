/**
 * Scientific calculations for asteroid impact simulation
 * Based on:
 * - Collins et al. (2005) "Earth Impact Effects Program"
 * - NASA NEO impact risk assessment models
 * - Purdue University Impact Earth calculator
 */

export interface Asteroid {
  id: string;
  name: string;
  diameter: number; // meters
  mass: number; // kg
  velocity: number; // m/s
  composition: 'stony' | 'iron' | 'carbonaceous';
  density: number; // kg/m³
  description: string;
}

export interface ImpactLocation {
  lat: number;
  lon: number;
  terrain: 'land' | 'water';
  populationDensity: number; // people per km²
  elevation: number; // meters
}

export interface ImpactResults {
  // Energy
  kineticEnergy: number; // joules
  megatonsTNT: number;
  
  // Crater
  craterDiameter: number; // km
  craterDepth: number; // km
  craterVolume: number; // km³
  
  // Blast effects
  airblastRadius: {
    overpressure_20psi: number; // km - total destruction
    overpressure_10psi: number; // km - heavy damage
    overpressure_5psi: number; // km - moderate damage
    overpressure_1psi: number; // km - glass breakage
  };
  
  // Thermal effects
  thermalRadiusFirstDegree: number; // km
  thermalRadiusThirdDegree: number; // km
  
  // Seismic
  earthquakeMagnitude: number;
  seismicRadius: number; // km
  
  // Ejecta
  ejectaThickness: {
    distance_10km: number; // meters
    distance_100km: number; // meters
    distance_1000km: number; // meters
  };
  
  // Environmental
  dustEjected: number; // kg
  atmosphericPenetration: boolean;
  tsunamiGenerated: boolean;
  
  // Accuracy indicators
  accuracy: {
    craterSize: 'accurate' | 'estimated' | 'probabilistic';
    casualties: 'accurate' | 'estimated' | 'probabilistic';
    climate: 'accurate' | 'estimated' | 'probabilistic';
  };
}

/**
 * Calculate kinetic energy: KE = 0.5 * m * v²
 */
export function calculateKineticEnergy(mass: number, velocity: number): number {
  return 0.5 * mass * Math.pow(velocity, 2);
}

/**
 * Convert joules to megatons of TNT
 * 1 megaton = 4.184 × 10^15 joules
 */
export function joulesToMegatons(joules: number): number {
  return joules / 4.184e15;
}

/**
 * Calculate crater diameter using scaling laws
 * Based on Holsapple & Housen (2007)
 */
export function calculateCraterDiameter(
  asteroid: Asteroid,
  impactAngle: number = 45, // degrees
  targetDensity: number = 2500 // kg/m³ (typical rock)
): number {
  const velocity = asteroid.velocity;
  const diameter = asteroid.diameter;
  const density = asteroid.density;
  
  // Convert to km for easier handling
  const diameterKm = diameter / 1000;
  
  // Simplified crater scaling law
  // D_crater ≈ 1.8 * D_projectile * (ρ_projectile/ρ_target)^(1/3) * (v/v_escape)^0.44
  const escapeVelocity = 11200; // m/s for Earth
  const densityRatio = Math.pow(density / targetDensity, 1/3);
  const velocityRatio = Math.pow(velocity / escapeVelocity, 0.44);
  
  let craterDiameter = 1.8 * diameterKm * densityRatio * velocityRatio;
  
  // Adjust for impact angle (oblique impacts create larger craters)
  const angleFactor = Math.sin(impactAngle * Math.PI / 180);
  craterDiameter *= (0.5 + 0.5 * angleFactor);
  
  return craterDiameter;
}

/**
 * Calculate crater depth (typically 1/5 to 1/3 of diameter)
 */
export function calculateCraterDepth(craterDiameter: number): number {
  return craterDiameter * 0.25;
}

/**
 * Calculate airblast overpressure radii
 * Based on nuclear weapon effects scaling
 */
export function calculateAirblastRadii(megatonsTNT: number): {
  overpressure_20psi: number;
  overpressure_10psi: number;
  overpressure_5psi: number;
  overpressure_1psi: number;
} {
  // Scaling factor: radius ∝ yield^(1/3)
  const yieldFactor = Math.pow(megatonsTNT, 1/3);
  
  return {
    overpressure_20psi: 1.5 * yieldFactor,
    overpressure_10psi: 2.2 * yieldFactor,
    overpressure_5psi: 3.5 * yieldFactor,
    overpressure_1psi: 9.0 * yieldFactor,
  };
}

/**
 * Calculate thermal radiation effects
 */
export function calculateThermalRadii(megatonsTNT: number): {
  firstDegree: number;
  thirdDegree: number;
} {
  const yieldFactor = Math.pow(megatonsTNT, 1/2);
  
  return {
    firstDegree: 12 * yieldFactor, // 1st degree burns
    thirdDegree: 6 * yieldFactor, // 3rd degree burns
  };
}

/**
 * Estimate earthquake magnitude
 * Based on Richter scale correlation with energy
 */
export function calculateEarthquakeMagnitude(kineticEnergy: number): number {
  // M = (2/3) * log10(E) - 2.9 (where E is in joules)
  const magnitude = (2/3) * Math.log10(kineticEnergy) - 2.9;
  return Math.max(0, Math.min(magnitude, 12)); // Cap between 0 and 12
}

/**
 * Calculate seismic effects radius
 */
export function calculateSeismicRadius(magnitude: number): number {
  // Approximate felt radius in km
  return Math.pow(10, 0.8 * magnitude - 1.5);
}

/**
 * Estimate casualties based on population density and blast effects
 */
export function estimateCasualties(
  location: ImpactLocation,
  airblastRadii: any,
  thermalRadii: any
): number {
  const { populationDensity } = location;
  
  // Calculate affected area and estimate casualties
  const totalDestructionArea = Math.PI * Math.pow(airblastRadii.overpressure_20psi, 2);
  const heavyDamageArea = Math.PI * Math.pow(airblastRadii.overpressure_10psi, 2) - totalDestructionArea;
  const moderateDamageArea = Math.PI * Math.pow(airblastRadii.overpressure_5psi, 2) - heavyDamageArea - totalDestructionArea;
  
  // Fatality rates by damage zone
  const totalDestructionCasualties = totalDestructionArea * populationDensity * 0.9; // 90% fatality
  const heavyDamageCasualties = heavyDamageArea * populationDensity * 0.5; // 50% fatality
  const moderateDamageCasualties = moderateDamageArea * populationDensity * 0.15; // 15% fatality
  
  return Math.floor(totalDestructionCasualties + heavyDamageCasualties + moderateDamageCasualties);
}

/**
 * Estimate infrastructure damage by category
 */
export function estimateInfrastructureDamage(
  airblastRadii: any,
  affectedArea: number // km²
): {
  military: number;
  civilian: number;
  cultural: number;
  energy: number;
} {
  // Based on blast radius vs global infrastructure distribution
  const destructionRadius = airblastRadii.overpressure_5psi;
  const damageFactor = Math.min(destructionRadius / 500, 1); // Normalize to 500km max
  
  return {
    military: Math.floor(damageFactor * 25),
    civilian: Math.floor(damageFactor * 60),
    cultural: Math.floor(damageFactor * 20),
    energy: Math.floor(damageFactor * 45),
  };
}

/**
 * Estimate economic damage in trillion USD
 */
export function estimateEconomicDamage(
  casualties: number,
  airblastRadii: any,
  location: ImpactLocation
): number {
  const affectedArea = Math.PI * Math.pow(airblastRadii.overpressure_5psi, 2);
  
  // Rough estimate: $1M per casualty + $10B per 1000 km² destroyed
  const casualtyCost = casualties * 1e6;
  const infrastructureCost = affectedArea * 1e10;
  
  return (casualtyCost + infrastructureCost) / 1e12; // Convert to trillions
}

/**
 * Estimate climate effects
 */
export function estimateClimateEffects(
  megatonsTNT: number,
  dustEjected: number
): {
  temperatureChange: number; // °C
  sunlightReduction: number; // %
  duration: number; // years
} {
  // Large impacts (>1000 MT) cause nuclear winter effects
  if (megatonsTNT > 1000) {
    const severityFactor = Math.log10(megatonsTNT / 1000);
    return {
      temperatureChange: -3 - severityFactor * 5,
      sunlightReduction: Math.min(30 + severityFactor * 20, 90),
      duration: Math.min(5 + severityFactor * 2, 20),
    };
  } else if (megatonsTNT > 100) {
    return {
      temperatureChange: -1 - Math.log10(megatonsTNT / 100) * 2,
      sunlightReduction: 10 + Math.log10(megatonsTNT / 100) * 10,
      duration: 1 + Math.log10(megatonsTNT / 100),
    };
  } else {
    return {
      temperatureChange: 0.5,
      sunlightReduction: 2,
      duration: 0.1,
    };
  }
}

/**
 * Check if tsunami will be generated (water impact with sufficient energy)
 */
export function willGenerateTsunami(
  location: ImpactLocation,
  megatonsTNT: number
): boolean {
  return location.terrain === 'water' && megatonsTNT > 1;
}

/**
 * Calculate tsunami wave height and reach
 */
export function calculateTsunamiEffects(
  megatonsTNT: number,
  location: ImpactLocation
): {
  initialWaveHeight: number; // meters
  coastalReach: number; // km inland
  affectedCoastlineLength: number; // km
} | null {
  if (location.terrain !== 'water') return null;
  
  const energyFactor = Math.pow(megatonsTNT, 0.5);
  
  return {
    initialWaveHeight: Math.min(10 + energyFactor * 50, 1000),
    coastalReach: Math.min(1 + energyFactor * 2, 50),
    affectedCoastlineLength: Math.min(100 + energyFactor * 500, 10000),
  };
}

/**
 * Main impact calculation function
 */
export function calculateImpact(
  asteroid: Asteroid,
  location: ImpactLocation
): ImpactResults {
  // Energy calculations
  const kineticEnergy = calculateKineticEnergy(asteroid.mass, asteroid.velocity);
  const megatonsTNT = joulesToMegatons(kineticEnergy);
  
  // Crater calculations
  const craterDiameter = calculateCraterDiameter(asteroid);
  const craterDepth = calculateCraterDepth(craterDiameter);
  const craterVolume = Math.PI * Math.pow(craterDiameter / 2, 2) * craterDepth / 3; // Cone approximation
  
  // Blast effects
  const airblastRadii = calculateAirblastRadii(megatonsTNT);
  
  // Thermal effects
  const thermalRadii = calculateThermalRadii(megatonsTNT);
  
  // Seismic effects
  const earthquakeMagnitude = calculateEarthquakeMagnitude(kineticEnergy);
  const seismicRadius = calculateSeismicRadius(earthquakeMagnitude);
  
  // Ejecta
  const ejectaVolume = craterVolume * 2; // Rough estimate
  const dustEjected = ejectaVolume * 2.5e12; // kg (assuming 2500 kg/m³ density)
  
  // Environmental checks
  const atmosphericPenetration = asteroid.diameter > 25; // Objects > 25m typically reach ground
  const tsunamiGenerated = willGenerateTsunami(location, megatonsTNT);
  
  // Determine accuracy levels
  const accuracy = {
    craterSize: asteroid.diameter > 50 ? 'accurate' : 'estimated',
    casualties: location.populationDensity > 0 ? 'estimated' : 'probabilistic',
    climate: megatonsTNT > 1000 ? 'estimated' : 'probabilistic',
  } as const;
  
  return {
    kineticEnergy,
    megatonsTNT,
    craterDiameter,
    craterDepth,
    craterVolume,
    airblastRadius: airblastRadii,
    thermalRadiusFirstDegree: thermalRadii.firstDegree,
    thermalRadiusThirdDegree: thermalRadii.thirdDegree,
    earthquakeMagnitude,
    seismicRadius,
    ejectaThickness: {
      distance_10km: Math.max(10 - (10 / craterDiameter), 0),
      distance_100km: Math.max(1 - (100 / (craterDiameter * 100)), 0),
      distance_1000km: Math.max(0.1 - (1000 / (craterDiameter * 1000)), 0),
    },
    dustEjected,
    atmosphericPenetration,
    tsunamiGenerated,
    accuracy,
  };
}