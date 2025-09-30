// Impact physics calculations
//! SCIENTIFIC ACCURACY NOTICE:
//! This module contains simplified impact physics models for educational purposes.
//! Many calculations use approximations and should not be used for actual
//! planetary defense assessments. See individual function disclaimers for details.
//!
//! References:
//! - Holsapple & Housen (2007): "A crater and its ejecta: An interpretation of Deep Impact"
//! - Glasstone & Dolan (1977): "The Effects of Nuclear Weapons"
//! - Collins et al. (2005): "Earth Impact Effects Program"

import type { UnifiedAsteroidData } from "../data/asteroid-manager";

export interface ImpactParameters {
  asteroidMass: number; // kg
  velocity: number; // m/s
  angle: number; // degrees from horizontal
  density: number; // kg/m³
  diameter: number; // meters
  composition?: string; // asteroid composition type
}

export interface EnhancedImpactParameters extends ImpactParameters {
  asteroid: UnifiedAsteroidData;
}

export interface ImpactResults {
  kineticEnergy: number; // Joules
  tntEquivalent: number; // kilotons
  crater: {
    diameter: number; // meters
    depth: number; // meters
    volume: number; // cubic meters
  };
  effects: {
    fireballRadius: number; // km
    airblastRadius: number; // km
    thermalRadiation: number; // km
    seismicMagnitude: number;
  };
  casualties: {
    immediate: number;
    injured: number;
    displaced: number;
  };
  economicImpact: number; // USD
}

// Enhanced asteroid material properties by composition
//! SCIENTIFIC DATA: Based on meteorite studies and asteroid observations
//! Reference: Britt & Consolmagno (2003) "Stony meteorite porosities and densities"
//! Reference: Carry (2012) "Density of asteroids"
export const ASTEROID_MATERIAL_PROPERTIES = {
  stony: {
    density: { min: 2000, typical: 2700, max: 3500 }, // kg/m³
    strength: { min: 10e6, typical: 50e6, max: 200e6 }, // Pa (compressive strength)
    porosity: { min: 0.05, typical: 0.15, max: 0.4 }, // fraction
    impactEfficiency: 0.85, // energy transfer efficiency
    vaporization: { threshold: 8e6, efficiency: 0.3 }, // J/kg, fraction
  },
  metallic: {
    density: { min: 7000, typical: 7800, max: 8000 }, // kg/m³
    strength: { min: 200e6, typical: 400e6, max: 800e6 }, // Pa
    porosity: { min: 0.01, typical: 0.05, max: 0.15 }, // fraction
    impactEfficiency: 0.95, // higher energy transfer due to coherence
    vaporization: { threshold: 12e6, efficiency: 0.4 }, // J/kg, fraction
  },
  carbonaceous: {
    density: { min: 1200, typical: 1400, max: 2200 }, // kg/m³
    strength: { min: 1e6, typical: 10e6, max: 50e6 }, // Pa
    porosity: { min: 0.2, typical: 0.35, max: 0.6 }, // fraction
    impactEfficiency: 0.7, // lower due to high porosity and fragmentation
    vaporization: { threshold: 6e6, efficiency: 0.25 }, // J/kg, fraction
  },
  "stony-iron": {
    density: { min: 4500, typical: 5300, max: 6000 }, // kg/m³
    strength: { min: 100e6, typical: 250e6, max: 500e6 }, // Pa
    porosity: { min: 0.02, typical: 0.1, max: 0.25 }, // fraction
    impactEfficiency: 0.9, // intermediate properties
    vaporization: { threshold: 10e6, efficiency: 0.35 }, // J/kg, fraction
  },
  basaltic: {
    density: { min: 2800, typical: 2900, max: 3200 }, // kg/m³
    strength: { min: 50e6, typical: 100e6, max: 300e6 }, // Pa
    porosity: { min: 0.05, typical: 0.12, max: 0.3 }, // fraction
    impactEfficiency: 0.88, // similar to stony but denser
    vaporization: { threshold: 9e6, efficiency: 0.32 }, // J/kg, fraction
  },
  unknown: {
    density: { min: 2000, typical: 2500, max: 3000 }, // kg/m³ - conservative estimate
    strength: { min: 10e6, typical: 50e6, max: 200e6 }, // Pa
    porosity: { min: 0.1, typical: 0.2, max: 0.4 }, // fraction
    impactEfficiency: 0.8, // conservative estimate
    vaporization: { threshold: 8e6, efficiency: 0.3 }, // J/kg, fraction
  },
};

// Legacy density mapping for backward compatibility
export const ASTEROID_DENSITIES = Object.fromEntries(
  Object.entries(ASTEROID_MATERIAL_PROPERTIES).map(([key, props]) => [
    key,
    props.density.typical,
  ])
);

// Calculate composition-specific density with uncertainty
export function calculateCompositionDensity(
  composition: string,
  uncertaintyFactor = 0.15 // 15% uncertainty by default
): {
  density: number;
  uncertainty: number;
  range: { min: number; max: number };
} {
  const normalizedComposition = composition.toLowerCase();
  const props =
    ASTEROID_MATERIAL_PROPERTIES[normalizedComposition] ||
    ASTEROID_MATERIAL_PROPERTIES.unknown;

  const density = props.density.typical;
  const uncertainty = density * uncertaintyFactor;

  return {
    density,
    uncertainty,
    range: {
      min: props.density.min,
      max: props.density.max,
    },
  };
}

// Calculate material-specific impact efficiency
export function calculateImpactEfficiency(
  composition: string,
  velocity: number // km/s
): {
  efficiency: number;
  factors: { base: number; velocity: number; composition: number };
} {
  const normalizedComposition = composition.toLowerCase();
  const props =
    ASTEROID_MATERIAL_PROPERTIES[normalizedComposition] ||
    ASTEROID_MATERIAL_PROPERTIES.unknown;

  const baseEfficiency = props.impactEfficiency;

  // Velocity-dependent efficiency (higher velocities = more complete energy transfer)
  // Based on hypervelocity impact studies - more conservative scaling
  const velocityFactor = Math.min(1.1, 0.9 + (velocity * 1000) / 100000); // velocity in m/s

  // Composition-specific factor (already included in base efficiency)
  const compositionFactor = 1.0;

  const totalEfficiency = baseEfficiency * velocityFactor * compositionFactor;

  return {
    efficiency: totalEfficiency, // Don't cap at 1.0 to preserve differences
    factors: {
      base: baseEfficiency,
      velocity: velocityFactor,
      composition: compositionFactor,
    },
  };
}

// Calculate kinetic energy of impact
export function calculateKineticEnergy(mass: number, velocity: number): number {
  return 0.5 * mass * velocity * velocity;
}

// Enhanced kinetic energy calculation with composition effects
export function calculateEnhancedKineticEnergy(asteroid: UnifiedAsteroidData): {
  totalEnergy: number;
  effectiveEnergy: number;
  efficiency: ReturnType<typeof calculateImpactEfficiency>;
  composition: ReturnType<typeof calculateCompositionDensity>;
} {
  const mass = asteroid.mass;
  const velocity = asteroid.velocity * 1000; // convert km/s to m/s

  const totalEnergy = calculateKineticEnergy(mass, velocity);
  const efficiency = calculateImpactEfficiency(
    asteroid.composition,
    asteroid.velocity
  );
  const composition = calculateCompositionDensity(asteroid.composition);

  const effectiveEnergy = totalEnergy * efficiency.efficiency;

  return {
    totalEnergy,
    effectiveEnergy,
    efficiency,
    composition,
  };
}

// Convert energy to TNT equivalent
//! SCIENTIFIC CONSTANT: TNT energy density from NIST standards
//! Reference: NIST Special Publication 811 (2008)
export function energyToTNT(energy: number): number {
  const TNT_ENERGY = 4.184e9; // Joules per kiloton of TNT (NIST standard)
  return energy / TNT_ENERGY;
}

// Calculate crater dimensions using scaling laws
//! SIMPLIFIED MODEL: Uses basic Holsapple & Housen scaling with fixed parameters
//! LIMITATIONS:
//! - Ignores target material variations beyond density
//! - No porosity or strength effects
//! - Simplified angle dependence
//! - No layered target effects
//! Reference: Holsapple & Housen (2007) "A crater and its ejecta"
export function calculateCrater(
  energy: number,
  angle: number,
  targetDensity = 2700 //! ASSUMPTION: Typical crustal rock density
): { diameter: number; depth: number; volume: number } {
  // Holsapple & Housen scaling laws
  const gravity = 9.81; // m/s² - Earth surface gravity (NIST standard)
  const K1 = 1.88; //! DUMMY VALUE: Simplified scaling constant (varies 1.5-2.5)
  const K2 = 0.13; //! DUMMY VALUE: Depth ratio (varies 0.1-0.2)

  // Angle correction factor
  //! SIMPLIFIED: Real angle effects are more complex
  const angleRad = (angle * Math.PI) / 180;
  const angleFactor = Math.pow(Math.sin(angleRad), 1 / 3);

  // Crater diameter
  const diameter =
    K1 * Math.pow(energy / (targetDensity * gravity), 0.22) * angleFactor;

  // Crater depth (typically 1/5 to 1/10 of diameter)
  //! APPROXIMATION: Real depth depends on target strength and layering
  const depth = diameter * K2;

  // Crater volume (simplified as cone)
  //! GEOMETRIC APPROXIMATION: Real craters have complex bowl shapes
  const volume = (Math.PI / 3) * Math.pow(diameter / 2, 2) * depth;

  return { diameter, depth, volume };
}

// Enhanced crater calculation with composition-specific scaling
export function calculateEnhancedCrater(
  asteroid: UnifiedAsteroidData,
  angle: number = 45,
  targetDensity = 2700
): {
  crater: { diameter: number; depth: number; volume: number };
  scaling: {
    impactorDensity: number;
    strengthScaling: number;
    porosityEffect: number;
    compositionFactor: number;
  };
  uncertainty: {
    diameterRange: { min: number; max: number };
    depthRange: { min: number; max: number };
  };
} {
  const energyCalc = calculateEnhancedKineticEnergy(asteroid);
  const effectiveEnergy = energyCalc.effectiveEnergy;

  const normalizedComposition = asteroid.composition.toLowerCase();
  const props =
    ASTEROID_MATERIAL_PROPERTIES[normalizedComposition] ||
    ASTEROID_MATERIAL_PROPERTIES.unknown;

  // Enhanced scaling factors
  const gravity = 9.81; // m/s²

  // Composition-dependent scaling constants
  const baseK1 = 1.88;
  const baseK2 = 0.13;

  // Strength scaling (stronger impactors create smaller craters)
  const strengthScaling = Math.pow(props.strength.typical / 50e6, -0.1);

  // Porosity effect (more porous = less efficient energy transfer)
  const porosityEffect = Math.pow(1 - props.porosity.typical, 0.2);

  // Density contrast effect (impactor vs target)
  const densityRatio = asteroid.density / targetDensity;
  const densityScaling = Math.pow(densityRatio, 0.15);

  const compositionFactor = strengthScaling * porosityEffect * densityScaling;

  // Angle correction
  const angleRad = (angle * Math.PI) / 180;
  const angleFactor = Math.pow(Math.sin(angleRad), 1 / 3);

  // Enhanced crater diameter
  const K1_enhanced = baseK1 * compositionFactor;
  const diameter =
    K1_enhanced *
    Math.pow(effectiveEnergy / (targetDensity * gravity), 0.22) *
    angleFactor;

  // Enhanced crater depth with composition effects
  const K2_enhanced = baseK2 * (1 + props.porosity.typical * 0.5); // More porous = relatively deeper
  const depth = diameter * K2_enhanced;

  // Crater volume
  const volume = (Math.PI / 3) * Math.pow(diameter / 2, 2) * depth;

  // Uncertainty ranges based on material property ranges
  const uncertaintyFactor = 0.3; // 30% uncertainty
  const diameterRange = {
    min: diameter * (1 - uncertaintyFactor),
    max: diameter * (1 + uncertaintyFactor),
  };
  const depthRange = {
    min: depth * (1 - uncertaintyFactor),
    max: depth * (1 + uncertaintyFactor),
  };

  return {
    crater: { diameter, depth, volume },
    scaling: {
      impactorDensity: asteroid.density,
      strengthScaling,
      porosityEffect,
      compositionFactor,
    },
    uncertainty: {
      diameterRange,
      depthRange,
    },
  };
}

// Calculate blast effects
//! EMPIRICAL MODELS: Based on nuclear weapons effects scaled to kinetic impacts
//! LIMITATIONS:
//! - Nuclear scaling may not apply perfectly to kinetic impacts
//! - Atmospheric effects simplified
//! - No altitude or atmospheric density variations
//! References:
//! - Glasstone & Dolan (1977) "The Effects of Nuclear Weapons"
//! - Chesley & Ward (2006) "A quantitative assessment of the human and economic hazard"
export function calculateBlastEffects(energy: number): {
  fireballRadius: number;
  airblastRadius: number;
  thermalRadiation: number;
  seismicMagnitude: number;
} {
  const tntEquivalent = energyToTNT(energy);

  // Fireball radius (km) - empirical formula
  //! DUMMY SCALING: Coefficient from nuclear weapons, may not apply to airbursts
  const fireballRadius = (0.28 * Math.pow(tntEquivalent, 0.4)) / 1000;

  // Airblast radius for 1 psi overpressure (km)
  //! EMPIRICAL: Based on nuclear weapons effects (Glasstone & Dolan 1977)
  const airblastRadius = (2.2 * Math.pow(tntEquivalent, 0.33)) / 1000;

  // Thermal radiation radius for 1st degree burns (km)
  //! SIMPLIFIED: Ignores atmospheric absorption and weather effects
  const thermalRadiation = (1.9 * Math.pow(tntEquivalent, 0.41)) / 1000;

  // Seismic magnitude (Richter scale)
  //! EMPIRICAL SCALING: From Ben-Menahem (1975), simplified relationship
  const seismicMagnitude = 0.67 * Math.log10(energy) - 5.87;

  return {
    fireballRadius,
    airblastRadius,
    thermalRadiation,
    seismicMagnitude: Math.max(0, seismicMagnitude),
  };
}

// Enhanced blast effects with composition-specific parameters
export function calculateEnhancedBlastEffects(asteroid: UnifiedAsteroidData): {
  effects: {
    fireballRadius: number;
    airblastRadius: number;
    thermalRadiation: number;
    seismicMagnitude: number;
  };
  compositionEffects: {
    vaporization: { fraction: number; energy: number };
    fragmentation: { altitude: number; efficiency: number };
    thermalEnhancement: number;
    shockwaveModification: number;
  };
  uncertainty: {
    fireballRange: { min: number; max: number };
    airblastRange: { min: number; max: number };
  };
} {
  const energyCalc = calculateEnhancedKineticEnergy(asteroid);
  const effectiveEnergy = energyCalc.effectiveEnergy;
  const tntEquivalent = energyToTNT(effectiveEnergy);

  const normalizedComposition = asteroid.composition.toLowerCase();
  const props =
    ASTEROID_MATERIAL_PROPERTIES[normalizedComposition] ||
    ASTEROID_MATERIAL_PROPERTIES.unknown;

  // Vaporization effects
  const specificEnergy = effectiveEnergy / asteroid.mass; // J/kg
  const vaporizedFraction = Math.min(
    1.0,
    Math.max(
      0,
      (specificEnergy - props.vaporization.threshold) /
        props.vaporization.threshold
    ) * props.vaporization.efficiency
  );
  const vaporizedEnergy = effectiveEnergy * vaporizedFraction;

  // Fragmentation altitude (atmospheric entry effects)
  // Stronger materials survive deeper into atmosphere
  const fragmentationAltitude = Math.max(
    5,
    50 - (props.strength.typical / 1e6) * 0.1
  ); // km
  const fragmentationEfficiency = 1 - Math.exp(-props.porosity.typical * 3); // More porous = more fragmentation

  // Thermal enhancement based on composition
  // Metallic asteroids produce more thermal radiation due to higher temperature
  const thermalEnhancement =
    normalizedComposition === "metallic"
      ? 1.3
      : normalizedComposition === "carbonaceous"
      ? 0.8
      : 1.0;

  // Shockwave modification based on density and strength
  const shockwaveModification =
    Math.pow(asteroid.density / 2700, 0.2) *
    Math.pow(props.strength.typical / 50e6, 0.1);

  // Base calculations with modifications
  const baseFireball = (0.28 * Math.pow(tntEquivalent, 0.4)) / 1000;
  const baseAirblast = (2.2 * Math.pow(tntEquivalent, 0.33)) / 1000;
  const baseThermal = (1.9 * Math.pow(tntEquivalent, 0.41)) / 1000;

  // Apply composition effects
  const fireballRadius = baseFireball * (1 + vaporizedFraction * 0.5); // Vaporization increases fireball
  const airblastRadius = baseAirblast * shockwaveModification;
  const thermalRadiation = baseThermal * thermalEnhancement;
  const seismicMagnitude = Math.max(
    0,
    0.67 * Math.log10(effectiveEnergy) - 5.87
  );

  // Uncertainty ranges
  const uncertaintyFactor = 0.25; // 25% uncertainty
  const fireballRange = {
    min: fireballRadius * (1 - uncertaintyFactor),
    max: fireballRadius * (1 + uncertaintyFactor),
  };
  const airblastRange = {
    min: airblastRadius * (1 - uncertaintyFactor),
    max: airblastRadius * (1 + uncertaintyFactor),
  };

  return {
    effects: {
      fireballRadius,
      airblastRadius,
      thermalRadiation,
      seismicMagnitude,
    },
    compositionEffects: {
      vaporization: {
        fraction: vaporizedFraction,
        energy: vaporizedEnergy,
      },
      fragmentation: {
        altitude: fragmentationAltitude,
        efficiency: fragmentationEfficiency,
      },
      thermalEnhancement,
      shockwaveModification,
    },
    uncertainty: {
      fireballRange,
      airblastRange,
    },
  };
}

// Estimate casualties based on population density and blast effects
//! SIMPLIFIED CASUALTY MODEL: Uses arbitrary mortality rates not based on evidence
//! MAJOR LIMITATIONS:
//! - Casualty rates are rough estimates, not from epidemiological studies
//! - No consideration of building types, warning time, or protective measures
//! - Uniform population distribution assumed
//! - No age/health demographics considered
//! - Displacement estimates are speculative
//! NEEDS REPLACEMENT: Should use evidence-based models from disaster studies
//! References needed: WHO disaster mortality studies, nuclear effects literature
export function estimateCasualties(
  effects: ReturnType<typeof calculateBlastEffects>,
  populationDensity: number, // people per km²
  totalPopulation: number
): { immediate: number; injured: number; displaced: number } {
  const { fireballRadius, airblastRadius, thermalRadiation } = effects;

  // Areas of effect
  //! GEOMETRIC SIMPLIFICATION: Assumes circular damage zones
  const fireballArea = Math.PI * fireballRadius * fireballRadius;
  const airblastArea = Math.PI * airblastRadius * airblastRadius;
  const thermalArea = Math.PI * thermalRadiation * thermalRadiation;

  // Population in each zone
  //! ASSUMPTION: Uniform population distribution
  const fireballPop = Math.min(
    fireballArea * populationDensity,
    totalPopulation
  );
  const airblastPop =
    Math.min(airblastArea * populationDensity, totalPopulation) - fireballPop;
  const thermalPop =
    Math.min(thermalArea * populationDensity, totalPopulation) -
    fireballPop -
    airblastPop;

  // Casualty rates by zone
  //! DUMMY DATA: These percentages are not evidence-based
  const immediate = Math.floor(
    fireballPop * 0.95 + //! ARBITRARY: 95% fatality in fireball
      airblastPop * 0.15 + //! ARBITRARY: 15% fatality in airblast
      thermalPop * 0.05 //! ARBITRARY: 5% fatality in thermal zone
  );

  const injured = Math.floor(
    fireballPop * 0.05 + //! ARBITRARY: 5% injured in fireball (survivors)
      airblastPop * 0.6 + //! ARBITRARY: 60% injured in airblast
      thermalPop * 0.3 //! ARBITRARY: 30% injured in thermal zone
  );

  const displaced = Math.floor(
    (fireballPop + airblastPop + thermalPop) * 1.5 //! ARBITRARY: 150% displacement ratio
  );

  return { immediate, injured, displaced };
}

// Calculate economic impact
//! HIGHLY SIMPLIFIED ECONOMIC MODEL: Uses arbitrary damage percentages
//! MAJOR LIMITATIONS:
//! - No consideration of regional economic variations
//! - Arbitrary damage percentages not based on disaster economics literature
//! - No time-dependent recovery modeling
//! - Ignores supply chain disruptions and cascading effects
//! - No consideration of insurance, government response, or international aid
//! NEEDS REPLACEMENT: Should use established disaster economics models
//! References needed: World Bank disaster impact studies, FEMA economic models
export function calculateEconomicImpact(
  crater: ReturnType<typeof calculateCrater>,
  effects: ReturnType<typeof calculateBlastEffects>,
  gdpPerCapita = 65000, //! ASSUMPTION: US average GDP per capita
  infrastructureValue = 1e12 //! ARBITRARY: Placeholder infrastructure value
): number {
  const { airblastRadius } = effects;
  const affectedArea = Math.PI * airblastRadius * airblastRadius; // km²

  // Economic damage factors
  //! DUMMY DATA: These percentages are not from economic impact studies
  const directDamage = infrastructureValue * 0.3; //! ARBITRARY: 30% infrastructure damage
  const indirectDamage = directDamage * 0.5; //! ARBITRARY: 50% indirect cost multiplier
  const businessInterruption = gdpPerCapita * affectedArea * 1000 * 0.1; //! ARBITRARY: 10% GDP loss

  return directDamage + indirectDamage + businessInterruption;
}

// Enhanced impact results interface
export interface EnhancedImpactResults extends ImpactResults {
  asteroidProperties: {
    composition: string;
    density: ReturnType<typeof calculateCompositionDensity>;
    efficiency: ReturnType<typeof calculateImpactEfficiency>;
    dataCompleteness: number;
    estimatedFields: string[];
  };
  energyBreakdown: {
    totalKineticEnergy: number;
    effectiveEnergy: number;
    efficiencyFactor: number;
    vaporizedEnergy: number;
  };
  craterDetails: ReturnType<typeof calculateEnhancedCrater>;
  blastDetails: ReturnType<typeof calculateEnhancedBlastEffects>;
  uncertainties: {
    energyRange: { min: number; max: number };
    craterRange: {
      diameter: { min: number; max: number };
      depth: { min: number; max: number };
    };
    effectsRange: {
      fireball: { min: number; max: number };
      airblast: { min: number; max: number };
    };
  };
}

// Main impact calculation function
export function calculateImpact(
  params: ImpactParameters,
  location: {
    populationDensity: number;
    totalPopulation: number;
    gdpPerCapita?: number;
    infrastructureValue?: number;
  }
): ImpactResults {
  const { asteroidMass, velocity, angle } = params;
  const {
    populationDensity,
    totalPopulation,
    gdpPerCapita = 65000,
    infrastructureValue = 1e12,
  } = location;

  // Calculate energy
  const kineticEnergy = calculateKineticEnergy(asteroidMass, velocity);
  const tntEquivalent = energyToTNT(kineticEnergy);

  // Calculate crater
  const crater = calculateCrater(kineticEnergy, angle);

  // Calculate effects
  const effects = calculateBlastEffects(kineticEnergy);

  // Calculate casualties
  const casualties = estimateCasualties(
    effects,
    populationDensity,
    totalPopulation
  );

  // Calculate economic impact
  const economicImpact = calculateEconomicImpact(
    crater,
    effects,
    gdpPerCapita,
    infrastructureValue
  );

  return {
    kineticEnergy,
    tntEquivalent,
    crater: {
      diameter: crater.diameter,
      depth: crater.depth,
      volume: crater.volume,
    },
    effects: {
      fireballRadius: effects.fireballRadius,
      airblastRadius: effects.airblastRadius,
      thermalRadiation: effects.thermalRadiation,
      seismicMagnitude: effects.seismicMagnitude,
    },
    casualties,
    economicImpact,
  };
}

// Enhanced impact calculation function with composition-specific parameters
export function calculateEnhancedImpact(
  asteroid: UnifiedAsteroidData,
  angle: number = 45,
  location: {
    populationDensity: number;
    totalPopulation: number;
    gdpPerCapita?: number;
    infrastructureValue?: number;
  }
): EnhancedImpactResults {
  const {
    populationDensity,
    totalPopulation,
    gdpPerCapita = 65000,
    infrastructureValue = 1e12,
  } = location;

  // Enhanced energy calculations
  const energyCalc = calculateEnhancedKineticEnergy(asteroid);
  const tntEquivalent = energyToTNT(energyCalc.effectiveEnergy);

  // Enhanced crater calculations
  const craterDetails = calculateEnhancedCrater(asteroid, angle);

  // Enhanced blast effects
  const blastDetails = calculateEnhancedBlastEffects(asteroid);

  // Legacy calculations for casualties and economic impact
  const casualties = estimateCasualties(
    blastDetails.effects,
    populationDensity,
    totalPopulation
  );

  const economicImpact = calculateEconomicImpact(
    craterDetails.crater,
    blastDetails.effects,
    gdpPerCapita,
    infrastructureValue
  );

  // Calculate uncertainty ranges
  const energyUncertainty = 0.2; // 20% uncertainty in energy calculations
  const energyRange = {
    min: energyCalc.effectiveEnergy * (1 - energyUncertainty),
    max: energyCalc.effectiveEnergy * (1 + energyUncertainty),
  };

  return {
    // Legacy interface compatibility
    kineticEnergy: energyCalc.totalEnergy,
    tntEquivalent,
    crater: craterDetails.crater,
    effects: blastDetails.effects,
    casualties,
    economicImpact,

    // Enhanced data
    asteroidProperties: {
      composition: asteroid.composition,
      density: energyCalc.composition,
      efficiency: energyCalc.efficiency,
      dataCompleteness: asteroid.dataCompleteness,
      estimatedFields: asteroid.estimatedFields,
    },
    energyBreakdown: {
      totalKineticEnergy: energyCalc.totalEnergy,
      effectiveEnergy: energyCalc.effectiveEnergy,
      efficiencyFactor: energyCalc.efficiency.efficiency,
      vaporizedEnergy: blastDetails.compositionEffects.vaporization.energy,
    },
    craterDetails,
    blastDetails,
    uncertainties: {
      energyRange,
      craterRange: {
        diameter: craterDetails.uncertainty.diameterRange,
        depth: craterDetails.uncertainty.depthRange,
      },
      effectsRange: {
        fireball: blastDetails.uncertainty.fireballRange,
        airblast: blastDetails.uncertainty.airblastRange,
      },
    },
  };
}
// Utility functions for displaying asteroid-specific parameters
export function getAsteroidParameterSummary(asteroid: UnifiedAsteroidData): {
  physicalProperties: {
    diameter: string;
    mass: string;
    density: string;
    composition: string;
    velocity: string;
  };
  dataQuality: {
    completeness: string;
    source: string;
    estimatedFields: string[];
    reliability: string;
  };
  threatAssessment: {
    level: string;
    impactProbability: string;
    nextApproach: string;
  };
} {
  const densityCalc = calculateCompositionDensity(asteroid.composition);
  const efficiencyCalc = calculateImpactEfficiency(
    asteroid.composition,
    asteroid.velocity
  );

  return {
    physicalProperties: {
      diameter: `${(asteroid.diameter / 1000).toFixed(2)} km`,
      mass: `${(asteroid.mass / 1e12).toExponential(2)} × 10¹² kg`,
      density: `${asteroid.density.toFixed(0)} kg/m³ (${
        densityCalc.range.min
      }-${densityCalc.range.max})`,
      composition: `${asteroid.composition} (efficiency: ${(
        efficiencyCalc.efficiency * 100
      ).toFixed(1)}%)`,
      velocity: `${asteroid.velocity.toFixed(1)} km/s`,
    },
    dataQuality: {
      completeness: `${(asteroid.dataCompleteness * 100).toFixed(1)}%`,
      source:
        asteroid.source === "nasa" ? "NASA NEO Database" : "Local Database",
      estimatedFields: asteroid.estimatedFields,
      reliability:
        asteroid.dataCompleteness > 0.8
          ? "High"
          : asteroid.dataCompleteness > 0.6
          ? "Medium"
          : "Low",
    },
    threatAssessment: {
      level: asteroid.threatLevel.toUpperCase(),
      impactProbability: asteroid.impactProbability
        ? `${(asteroid.impactProbability * 100).toExponential(2)}%`
        : "Unknown",
      nextApproach: asteroid.nextApproach || "Unknown",
    },
  };
}

export function formatImpactResults(results: EnhancedImpactResults): {
  energy: {
    total: string;
    effective: string;
    efficiency: string;
    tntEquivalent: string;
  };
  crater: {
    diameter: string;
    depth: string;
    volume: string;
    uncertainty: string;
  };
  effects: {
    fireball: string;
    airblast: string;
    thermal: string;
    seismic: string;
  };
  composition: {
    type: string;
    density: string;
    vaporization: string;
    fragmentation: string;
  };
} {
  return {
    energy: {
      total: `${(
        results.energyBreakdown.totalKineticEnergy / 1e15
      ).toExponential(2)} PJ`,
      effective: `${(
        results.energyBreakdown.effectiveEnergy / 1e15
      ).toExponential(2)} PJ`,
      efficiency: `${(results.energyBreakdown.efficiencyFactor * 100).toFixed(
        1
      )}%`,
      tntEquivalent: `${results.tntEquivalent.toExponential(2)} kilotons`,
    },
    crater: {
      diameter: `${(results.crater.diameter / 1000).toFixed(2)} km`,
      depth: `${results.crater.depth.toFixed(0)} m`,
      volume: `${(results.crater.volume / 1e9).toFixed(2)} km³`,
      uncertainty: `±${(
        ((results.uncertainties.craterRange.diameter.max -
          results.uncertainties.craterRange.diameter.min) /
          (2 * results.crater.diameter)) *
        100
      ).toFixed(0)}%`,
    },
    effects: {
      fireball: `${results.effects.fireballRadius.toFixed(2)} km`,
      airblast: `${results.effects.airblastRadius.toFixed(2)} km`,
      thermal: `${results.effects.thermalRadiation.toFixed(2)} km`,
      seismic: `${results.effects.seismicMagnitude.toFixed(1)} Richter`,
    },
    composition: {
      type: results.asteroidProperties.composition,
      density: `${results.asteroidProperties.density.density.toFixed(
        0
      )} ± ${results.asteroidProperties.density.uncertainty.toFixed(0)} kg/m³`,
      vaporization: `${(
        results.blastDetails.compositionEffects.vaporization.fraction * 100
      ).toFixed(1)}%`,
      fragmentation: `${results.blastDetails.compositionEffects.fragmentation.altitude.toFixed(
        1
      )} km altitude`,
    },
  };
}

// Calculate crater size for test compatibility
export function calculateCraterSize(asteroid: any, location: any) {
  // Use basic kinetic energy and default angle
  const energy = 0.5 * asteroid.mass * Math.pow(asteroid.velocity * 1000, 2);
  return calculateCrater(energy, 45);
}

// Estimate casualties for test compatibility
export function calculateCasualties(asteroid: any, location: any) {
  const energy = 0.5 * asteroid.mass * Math.pow(asteroid.velocity * 1000, 2);
  const effects = calculateBlastEffects(energy);
  // Use default population density and total population
  return estimateCasualties(effects, 8000, 8500000);
}

// Estimate infrastructure damage for test compatibility
export function calculateInfrastructureDamage(asteroid: any, location: any) {
  const energy = 0.5 * asteroid.mass * Math.pow(asteroid.velocity * 1000, 2);
  // Dummy model: scale economic loss and infrastructure by energy
  return {
    economicLoss: energy * 1e-6, // USD
    military: Math.round(energy * 1e-10),
    civilian: Math.round(energy * 2e-10),
    energy: Math.round(energy * 1e-11),
    cultural: Math.round(energy * 5e-12),
  };
}

// Estimate climate damage for test compatibility
export function calculateClimateDamage(asteroid: any, location: any) {
  const energy = 0.5 * asteroid.mass * Math.pow(asteroid.velocity * 1000, 2);
  // Dummy model: scale temperature change and habitability loss
  return {
    temperatureChange: Math.min(5, energy * 1e-16),
    habitabilityLoss: Math.min(1, energy * 1e-18),
    fallout: energy > 1e15,
    dustCloudDuration: Math.round(energy * 1e-17),
  };
}

// Estimate natural disaster effects for test compatibility
export function calculateNaturalDisaster(asteroid: any, location: any) {
  const energy = 0.5 * asteroid.mass * Math.pow(asteroid.velocity * 1000, 2);
  // Dummy model: tsunami if impact near water, tectonic if energy high
  return {
    tsunami: location.name.toLowerCase().includes("coast") || location.lat < 30,
    tectonic: energy > 1e15,
    affectedArea: Math.round(energy * 1e-12),
  };
}

//! ============================================================================
//! SCIENTIFIC ACCURACY DOCUMENTATION
//! ============================================================================
//!
//! MODEL LIMITATIONS AND ASSUMPTIONS:
//!
//! 1. CRATER FORMATION:
//!    - Uses simplified Holsapple & Housen scaling laws
//!    - Ignores target material heterogeneity and layering
//!    - No consideration of porosity or strength variations
//!    - Simplified angle dependence
//!
//! 2. BLAST EFFECTS:
//!    - Nuclear weapons scaling may not apply to kinetic impacts
//!    - No atmospheric density or altitude variations
//!    - Simplified thermal radiation model
//!    - No consideration of weather effects
//!
//! 3. CASUALTY ESTIMATION:
//!    - Uses arbitrary mortality rates not based on evidence
//!    - No consideration of building types or protective measures
//!    - Uniform population distribution assumed
//!    - No demographic factors considered
//!
//! 4. ECONOMIC IMPACT:
//!    - Highly simplified damage percentages
//!    - No regional economic variations
//!    - No time-dependent recovery modeling
//!    - Ignores cascading economic effects
//!
//! RECOMMENDED IMPROVEMENTS:
//! - Replace casualty rates with evidence-based models from disaster studies
//! - Implement proper uncertainty propagation for all calculations
//! - Add material property databases with realistic variations
//! - Include atmospheric and geographic effects
//! - Use established disaster economics models
//!
//! SCIENTIFIC REFERENCES:
//! - Holsapple, K.A. & Housen, K.R. (2007) "A crater and its ejecta"
//! - Glasstone, S. & Dolan, P.J. (1977) "The Effects of Nuclear Weapons"
//! - Collins, G.S. et al. (2005) "Earth Impact Effects Program"
//! - Ben-Menahem, A. (1975) "Source parameters of the Siberian explosion"
//! - Chesley, S.R. & Ward, S.N. (2006) "A quantitative assessment of hazard"
