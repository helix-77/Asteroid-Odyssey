// Enhanced Impact Calculator - Comprehensive physics-based impact modeling

import type { ImpactParameters, ImpactEffects } from './impact/types';

/**
 * Calculate comprehensive impact effects
 */
export function calculateEnhancedImpactEffects(params: ImpactParameters): ImpactEffects {
  // Calculate kinetic energy: KE = 0.5 * m * v²
  const mass = calculateAsteroidMass(params.asteroidDiameter, params.density);
  const velocityMs = params.velocity * 1000; // Convert km/s to m/s
  const kineticEnergy = 0.5 * mass * Math.pow(velocityMs, 2); // Joules
  
  // Convert to TNT equivalent (1 ton TNT = 4.184 × 10^9 J)
  const tntEquivalent = kineticEnergy / (4.184e9 * 1e6); // Megatons
  
  // Calculate crater dimensions
  const crater = calculateCraterDimensions(
    params.asteroidDiameter,
    params.velocity,
    params.density,
    params.impactAngle,
    params.targetType
  );
  
  // Calculate blast effects
  const blastRadius = calculateBlastRadius(tntEquivalent);
  const thermalRadius = calculateThermalRadius(tntEquivalent);
  
  // Calculate seismic effects
  const seismicMagnitude = calculateSeismicMagnitude(kineticEnergy);
  
  // Estimate casualties and damage
  const casualties = estimateCasualties(blastRadius, thermalRadius, params);
  const economicDamage = estimateEconomicDamage(tntEquivalent, casualties);
  const affectedArea = Math.PI * Math.pow(thermalRadius / 1000, 2); // km²
  
  return {
    kineticEnergy,
    tntEquivalent,
    craterDiameter: crater.diameter,
    craterDepth: crater.depth,
    craterVolume: crater.volume,
    blastRadius,
    thermalRadius,
    seismicMagnitude,
    estimatedCasualties: casualties,
    economicDamage,
    affectedArea
  };
}

/**
 * Calculate asteroid mass from diameter and density
 */
function calculateAsteroidMass(diameter: number, density: number): number {
  const radius = diameter / 2;
  const volume = (4 / 3) * Math.PI * Math.pow(radius, 3);
  return volume * density; // kg
}

/**
 * Calculate crater dimensions using scaling laws
 * Based on Holsapple & Housen (2007) and Collins et al. (2005)
 */
function calculateCraterDimensions(
  diameter: number,
  velocity: number,
  density: number,
  impactAngle: number,
  targetType: string
) {
  const mass = calculateAsteroidMass(diameter, density);
  const velocityMs = velocity * 1000;
  const energy = 0.5 * mass * Math.pow(velocityMs, 2);
  
  // Target properties
  const targetDensity = targetType === 'water' ? 1000 : 2500; // kg/m³
  const targetStrength = targetType === 'water' ? 0 : 1e6; // Pa
  
  // Angle correction factor
  const angleCorrection = Math.pow(Math.sin(impactAngle * Math.PI / 180), 1/3);
  
  // Crater diameter scaling (simplified)
  // D = C * (E / ρ_t)^0.22 * g^-0.22
  const g = 9.81; // m/s²
  const scalingConstant = targetType === 'water' ? 1.5 : 1.2;
  
  const craterDiameter = scalingConstant * 
    Math.pow(energy / targetDensity, 0.22) * 
    Math.pow(g, -0.22) * 
    angleCorrection;
  
  // Crater depth (typically 1/5 to 1/3 of diameter for complex craters)
  const depthRatio = craterDiameter > 4000 ? 0.2 : 0.3; // Complex vs simple craters
  const craterDepth = craterDiameter * depthRatio;
  
  // Crater volume (approximated as a paraboloid)
  const craterVolume = (Math.PI / 2) * Math.pow(craterDiameter / 2, 2) * craterDepth;
  
  return {
    diameter: craterDiameter,
    depth: craterDepth,
    volume: craterVolume
  };
}

/**
 * Calculate blast radius for different overpressure levels
 * Returns radius for 5 psi overpressure (severe structural damage)
 */
function calculateBlastRadius(tntMegatons: number): number {
  // Scaling law: R = C * W^(1/3)
  // Where R is radius in meters, W is yield in megatons
  // For 5 psi overpressure: C ≈ 2800
  const scalingFactor = 2800;
  const radius = scalingFactor * Math.pow(tntMegatons, 1/3);
  return radius; // meters
}

/**
 * Calculate thermal radiation radius
 * Returns radius for 3rd degree burns
 */
function calculateThermalRadius(tntMegatons: number): number {
  // Thermal radiation scales as W^0.41
  // For 3rd degree burns: approximately 3500 * W^0.41 meters
  const scalingFactor = 3500;
  const radius = scalingFactor * Math.pow(tntMegatons, 0.41);
  return radius; // meters
}

/**
 * Calculate seismic magnitude
 * Based on energy-magnitude relationship
 */
function calculateSeismicMagnitude(energy: number): number {
  // Gutenberg-Richter relation: log10(E) = 1.5M + 4.8
  // Solving for M: M = (log10(E) - 4.8) / 1.5
  const logEnergy = Math.log10(energy);
  const magnitude = (logEnergy - 4.8) / 1.5;
  return Math.max(0, Math.min(10, magnitude)); // Clamp between 0 and 10
}

/**
 * Estimate immediate casualties
 * Realistic model based on affected area and population density
 */
function estimateCasualties(
  blastRadius: number,
  thermalRadius: number,
  params: ImpactParameters
): number {
  // Use thermal radius as primary casualty zone
  const affectedAreaKm2 = Math.PI * Math.pow(thermalRadius / 1000, 2);
  
  // Estimate average population density in affected area (more realistic)
  const avgPopDensity = estimatePopulationDensity(params.latitude, params.longitude);
  
  // Casualty rate decreases with distance from impact (realistic rates)
  const blastAreaKm2 = Math.PI * Math.pow(blastRadius / 1000, 2);
  const blastCasualties = blastAreaKm2 * avgPopDensity * 0.8; // 80% fatality in blast zone
  
  const thermalOnlyCasualties = (affectedAreaKm2 - blastAreaKm2) * avgPopDensity * 0.2; // 20% in thermal zone
  
  return Math.max(0, blastCasualties + thermalOnlyCasualties);
}

/**
 * Estimate population density at location
 * More realistic estimates based on geographic location
 */
function estimatePopulationDensity(lat: number, lng: number): number {
  // More realistic population density estimates
  const absLat = Math.abs(lat);
  
  // Polar regions: very low density
  if (absLat > 70) return 0.1;
  if (absLat > 60) return 2;
  
  // Check for major population centers (simplified)
  // Europe, East Asia, India - high density regions
  if ((lat > 35 && lat < 70 && lng > -10 && lng < 50) || // Europe
      (lat > 20 && lat < 50 && lng > 100 && lng < 150) || // East Asia
      (lat > 5 && lat < 35 && lng > 65 && lng < 95)) { // India/South Asia
    return 150;
  }
  
  // Eastern US, Eastern China - moderate-high density
  if ((lat > 25 && lat < 50 && lng > -100 && lng < -65) || // Eastern US
      (lat > 20 && lat < 40 && lng > 110 && lng < 125)) { // Eastern China
    return 100;
  }
  
  // Temperate regions: moderate density
  if (absLat > 30) return 25;
  
  // Tropical/subtropical: moderate density
  return 50;
}

/**
 * Estimate economic damage
 */
function estimateEconomicDamage(tntMegatons: number, casualties: number): number {
  // Direct damage: infrastructure, buildings, etc. (more realistic)
  // Scale based on actual impact energy
  const directDamage = tntMegatons * 1e9 * 100; // $100B per megaton (more realistic)
  
  // Human capital loss: $5 million per casualty (more realistic statistical value)
  const humanCapitalLoss = casualties * 5e6;
  
  // Indirect economic losses (supply chain, productivity, etc.) - reduced
  const indirectLoss = directDamage * 0.3;
  
  return directDamage + humanCapitalLoss + indirectLoss;
}

/**
 * Calculate distance between two points (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
