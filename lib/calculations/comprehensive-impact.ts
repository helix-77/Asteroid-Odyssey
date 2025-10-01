// Comprehensive impact calculations for asteroid simulator
// Includes geological, population, infrastructure, climate, and natural disaster calculations

import type { UnifiedAsteroidData } from "../data/asteroid-manager";
import {
  calculateEnhancedKineticEnergy,
  calculateEnhancedCrater,
  calculateEnhancedBlastEffects,
  type EnhancedImpactResults,
} from "./impact";

// Geographic location interface
export interface ImpactLocation {
  lat: number;
  lng: number;
  populationDensity: number; // people per km²
  totalPopulation: number;
  gdpPerCapita: number;
  infrastructureValue: number;
  isOcean: boolean;
  oceanDepth?: number; // meters
  coastalProximity?: number; // km to nearest coast
}

// Comprehensive impact results
export interface ComprehensiveImpactResults {
  // Basic impact data
  asteroid: {
    id: string;
    name: string;
    diameter: number;
    mass: number;
    velocity: number;
    composition: string;
  };
  
  // Energy calculations
  energy: {
    kineticEnergy: number; // Joules
    tntEquivalent: number; // kilotons
    effectiveEnergy: number; // Joules (after efficiency)
    accuracy: "measured" | "estimated" | "calculated";
  };

  // 1. Geological Destruction
  geological: {
    crater: {
      diameter: number; // meters
      depth: number; // meters
      volume: number; // cubic meters
      accuracy: "calculated" | "estimated";
    };
    explosionStrength: {
      tntEquivalent: number; // kilotons
      richterScale: number;
      accuracy: "calculated";
    };
    impactRegion: {
      totalDestructionRadius: number; // km
      severeDestructionRadius: number; // km
      moderateDestructionRadius: number; // km
      affectedArea: number; // km²
      accuracy: "calculated";
    };
  };

  // 2. Population Casualties
  casualties: {
    immediate: {
      deaths: number;
      vaporized: number;
      crushed: number;
      accuracy: "estimated" | "probability";
    };
    shortTerm: {
      deaths: number; // within 24 hours
      injuries: number;
      accuracy: "estimated";
    };
    longTerm: {
      deaths: number; // radiation, starvation, disease
      displaced: number;
      refugees: number;
      accuracy: "probability";
    };
    total: {
      estimatedDeaths: number;
      estimatedInjured: number;
      estimatedDisplaced: number;
    };
  };

  // 3. Infrastructure Damage
  infrastructure: {
    military: {
      basesDestroyed: number;
      equipmentLoss: number; // USD
      personnelLoss: number;
      accuracy: "estimated";
    };
    civilian: {
      buildingsDestroyed: number;
      homesDestroyed: number;
      hospitalsDamaged: number;
      schoolsDamaged: number;
      accuracy: "estimated";
    };
    energy: {
      powerPlantsDestroyed: number;
      gridDamage: number; // percentage
      nuclearFalloutRisk: number; // 0-1 scale
      oilRefineryDamage: number;
      accuracy: "estimated";
    };
    cultural: {
      heritagesSitesDestroyed: number;
      museumsDestroyed: number;
      culturalLoss: string;
      accuracy: "estimated";
    };
    economic: {
      directDamage: number; // USD
      indirectDamage: number; // USD
      lostProduction: number; // USD per year
      recoveryTime: number; // years
      accuracy: "estimated";
    };
    survival: {
      foodProductionLoss: number; // percentage
      waterSupplyDamage: number; // percentage
      medicalCapacityLoss: number; // percentage
      shelterAvailability: number; // percentage remaining
      accuracy: "estimated";
    };
  };

  // 4. Climate Damage
  climate: {
    temperature: {
      immediateChange: number; // degrees Celsius
      shortTermChange: number; // 1 year
      longTermChange: number; // 10 years
      accuracy: "estimated" | "probability";
    };
    atmosphere: {
      dustInjection: number; // cubic km
      sunlightReduction: number; // percentage
      duration: number; // months
      accuracy: "estimated";
    };
    habitability: {
      areaLost: number; // km²
      percentageLost: number; // percentage of habitable land
      agricultureImpact: number; // percentage loss
      accuracy: "estimated";
    };
    longTerm: {
      extinctionRisk: number; // 0-1 scale
      recoveryTime: number; // years
      permanentChange: boolean;
      accuracy: "probability";
    };
  };

  // 5. Natural Disasters
  naturalDisasters: {
    tsunami: {
      triggered: boolean;
      waveHeight: number; // meters
      affectedCoastline: number; // km
      inlandPenetration: number; // km
      casualties: number;
      accuracy: "calculated" | "estimated";
    };
    seismic: {
      earthquakeMagnitude: number; // Richter scale
      aftershocks: number;
      faultLineActivation: boolean;
      volcanicActivity: boolean;
      accuracy: "calculated" | "estimated";
    };
    atmospheric: {
      hurricaneForceWinds: boolean;
      windRadius: number; // km
      fireStorms: boolean;
      fireStormRadius: number; // km
      accuracy: "calculated";
    };
  };

  // Time-based progression data
  timeline: {
    t0: TimelineSnapshot; // Impact moment
    t1Hour: TimelineSnapshot;
    t24Hours: TimelineSnapshot;
    t1Week: TimelineSnapshot;
    t1Month: TimelineSnapshot;
    t1Year: TimelineSnapshot;
    t10Years: TimelineSnapshot;
  };
}

export interface TimelineSnapshot {
  time: string;
  casualties: number;
  displaced: number;
  temperature: number; // change from baseline
  habitableArea: number; // percentage
  foodProduction: number; // percentage of normal
  description: string;
}

// Calculate comprehensive impact
export function calculateComprehensiveImpact(
  asteroid: UnifiedAsteroidData,
  location: ImpactLocation,
  impactAngle: number = 45
): ComprehensiveImpactResults {
  
  // Basic energy calculations
  const energyCalc = calculateEnhancedKineticEnergy(asteroid);
  const craterCalc = calculateEnhancedCrater(asteroid, impactAngle);
  const blastCalc = calculateEnhancedBlastEffects(asteroid);

  const tntEquivalent = energyCalc.effectiveEnergy / 4.184e12; // Convert to megatons

  // 1. GEOLOGICAL DESTRUCTION
  const geological = calculateGeologicalDestruction(
    asteroid,
    craterCalc,
    blastCalc,
    tntEquivalent
  );

  // 2. POPULATION CASUALTIES
  const casualties = calculatePopulationCasualties(
    location,
    geological,
    blastCalc,
    tntEquivalent
  );

  // 3. INFRASTRUCTURE DAMAGE
  const infrastructure = calculateInfrastructureDamage(
    location,
    geological,
    tntEquivalent,
    casualties
  );

  // 4. CLIMATE DAMAGE
  const climate = calculateClimateDamage(
    asteroid,
    tntEquivalent,
    craterCalc,
    location
  );

  // 5. NATURAL DISASTERS
  const naturalDisasters = calculateNaturalDisasters(
    asteroid,
    location,
    tntEquivalent,
    blastCalc
  );

  // Generate timeline
  const timeline = generateImpactTimeline(
    casualties,
    infrastructure,
    climate,
    naturalDisasters
  );

  return {
    asteroid: {
      id: asteroid.id,
      name: asteroid.name,
      diameter: asteroid.diameter,
      mass: asteroid.mass,
      velocity: asteroid.velocity,
      composition: asteroid.composition,
    },
    energy: {
      kineticEnergy: energyCalc.totalEnergy,
      tntEquivalent: tntEquivalent * 1000, // Convert to kilotons
      effectiveEnergy: energyCalc.effectiveEnergy,
      accuracy: asteroid.dataCompleteness > 0.7 ? "measured" : "estimated",
    },
    geological,
    casualties,
    infrastructure,
    climate,
    naturalDisasters,
    timeline,
  };
}

// Helper function: Geological destruction calculations
function calculateGeologicalDestruction(
  asteroid: UnifiedAsteroidData,
  craterCalc: any,
  blastCalc: any,
  tntMegatons: number
): ComprehensiveImpactResults["geological"] {
  
  const crater = craterCalc.crater;
  const effects = blastCalc.effects;

  // Calculate destruction radii based on overpressure zones
  const totalDestructionRadius = effects.fireballRadius; // Complete vaporization
  const severeDestructionRadius = effects.airblastRadius * 2; // 20 psi overpressure
  const moderateDestructionRadius = effects.thermalRadiation * 1.5; // 5 psi overpressure

  const affectedArea = Math.PI * Math.pow(moderateDestructionRadius, 2);

  return {
    crater: {
      diameter: crater.diameter,
      depth: crater.depth,
      volume: crater.volume,
      accuracy: "calculated",
    },
    explosionStrength: {
      tntEquivalent: tntMegatons * 1000, // kilotons
      richterScale: effects.seismicMagnitude,
      accuracy: "calculated",
    },
    impactRegion: {
      totalDestructionRadius,
      severeDestructionRadius,
      moderateDestructionRadius,
      affectedArea,
      accuracy: "calculated",
    },
  };
}

// Helper function: Population casualty calculations
function calculatePopulationCasualties(
  location: ImpactLocation,
  geological: any,
  blastCalc: any,
  tntMegatons: number
): ComprehensiveImpactResults["casualties"] {
  
  const { populationDensity, totalPopulation } = location;
  const { totalDestructionRadius, severeDestructionRadius, moderateDestructionRadius } = geological.impactRegion;

  // Calculate populations in each zone
  const totalDestructionArea = Math.PI * Math.pow(totalDestructionRadius, 2);
  const severeDestructionArea = Math.PI * Math.pow(severeDestructionRadius, 2) - totalDestructionArea;
  const moderateDestructionArea = Math.PI * Math.pow(moderateDestructionRadius, 2) - severeDestructionArea - totalDestructionArea;

  const popTotalDestruction = Math.min(totalDestructionArea * populationDensity, totalPopulation);
  const popSevereDestruction = Math.min(severeDestructionArea * populationDensity, totalPopulation - popTotalDestruction);
  const popModerateDestruction = Math.min(moderateDestructionArea * populationDensity, totalPopulation - popTotalDestruction - popSevereDestruction);

  // Immediate casualties
  const vaporized = Math.floor(popTotalDestruction * 1.0); // 100% fatality
  const crushed = Math.floor(popSevereDestruction * 0.75); // 75% fatality
  const immediateDeaths = vaporized + crushed + Math.floor(popModerateDestruction * 0.20); // 20% fatality in moderate zone

  // Short-term casualties (24 hours)
  const shortTermDeaths = Math.floor(
    popSevereDestruction * 0.15 + // Additional 15% from severe zone
    popModerateDestruction * 0.10 // 10% from moderate zone
  );
  const injuries = Math.floor(
    popSevereDestruction * 0.10 + // 10% injured
    popModerateDestruction * 0.50 // 50% injured
  );

  // Long-term casualties (months to years)
  const affectedPopulation = popTotalDestruction + popSevereDestruction + popModerateDestruction;
  const longTermDeaths = Math.floor(affectedPopulation * 0.05); // 5% from disease, starvation
  const displaced = Math.floor(affectedPopulation * 1.2); // 120% displacement (includes surrounding areas)
  const refugees = Math.floor(displaced * 0.6); // 60% become refugees

  return {
    immediate: {
      deaths: immediateDeaths,
      vaporized,
      crushed,
      accuracy: "estimated",
    },
    shortTerm: {
      deaths: shortTermDeaths,
      injuries,
      accuracy: "estimated",
    },
    longTerm: {
      deaths: longTermDeaths,
      displaced,
      refugees,
      accuracy: "probability",
    },
    total: {
      estimatedDeaths: immediateDeaths + shortTermDeaths + longTermDeaths,
      estimatedInjured: injuries,
      estimatedDisplaced: displaced,
    },
  };
}

// Helper function: Infrastructure damage calculations
function calculateInfrastructureDamage(
  location: ImpactLocation,
  geological: any,
  tntMegatons: number,
  casualties: any
): ComprehensiveImpactResults["infrastructure"] {
  
  const affectedArea = geological.impactRegion.affectedArea;
  const destructionRadius = geological.impactRegion.moderateDestructionRadius;

  // Estimate infrastructure based on affected area and population
  const buildingsPerKm2 = location.populationDensity / 50; // Rough estimate
  const totalBuildings = Math.floor(affectedArea * buildingsPerKm2);

  // Military infrastructure (rough estimates)
  const militaryBasesInArea = Math.floor(affectedArea / 10000); // 1 per 10,000 km²
  const militaryPersonnel = militaryBasesInArea * 5000;
  const militaryEquipmentValue = militaryBasesInArea * 5e9; // $5B per base

  // Civilian infrastructure
  const homesDestroyed = Math.floor(totalBuildings * 0.7); // 70% residential
  const hospitalsDamaged = Math.floor(affectedArea / 500); // 1 per 500 km²
  const schoolsDamaged = Math.floor(affectedArea / 100); // 1 per 100 km²

  // Energy infrastructure
  const powerPlantsInArea = Math.floor(affectedArea / 5000); // 1 per 5,000 km²
  const nuclearPlantsInArea = Math.floor(powerPlantsInArea * 0.1); // 10% nuclear
  const gridDamage = Math.min(100, (destructionRadius / 100) * 80); // Percentage
  const nuclearFalloutRisk = nuclearPlantsInArea > 0 ? 0.7 : 0;

  // Cultural infrastructure
  const heritagesSitesInArea = Math.floor(affectedArea / 1000);
  const museumsInArea = Math.floor(affectedArea / 500);

  // Economic calculations
  const directDamage = 
    location.infrastructureValue * (affectedArea / 1000) + // Infrastructure
    militaryEquipmentValue + // Military
    homesDestroyed * 300000; // Homes at $300k each

  const indirectDamage = directDamage * 1.5; // 150% multiplier for indirect costs
  const lostProduction = location.gdpPerCapita * casualties.total.estimatedDeaths * 0.3; // 30% of GDP per capita
  const recoveryTime = Math.min(50, tntMegatons / 10); // Years, capped at 50

  // Survival metrics
  const foodProductionLoss = Math.min(100, (affectedArea / 100000) * 30); // Percentage
  const waterSupplyDamage = Math.min(100, gridDamage * 0.8); // Tied to power grid
  const medicalCapacityLoss = (hospitalsDamaged / Math.max(1, affectedArea / 500)) * 100;
  const shelterAvailability = Math.max(0, 100 - (homesDestroyed / Math.max(1, totalBuildings)) * 100);

  return {
    military: {
      basesDestroyed: militaryBasesInArea,
      equipmentLoss: militaryEquipmentValue,
      personnelLoss: militaryPersonnel,
      accuracy: "estimated",
    },
    civilian: {
      buildingsDestroyed: totalBuildings,
      homesDestroyed,
      hospitalsDamaged,
      schoolsDamaged,
      accuracy: "estimated",
    },
    energy: {
      powerPlantsDestroyed: powerPlantsInArea,
      gridDamage,
      nuclearFalloutRisk,
      oilRefineryDamage: Math.floor(affectedArea / 8000), // 1 per 8,000 km²
      accuracy: "estimated",
    },
    cultural: {
      heritagesSitesDestroyed: heritagesSitesInArea,
      museumsDestroyed: museumsInArea,
      culturalLoss: heritagesSitesInArea > 0 ? "Significant" : "Moderate",
      accuracy: "estimated",
    },
    economic: {
      directDamage,
      indirectDamage,
      lostProduction,
      recoveryTime,
      accuracy: "estimated",
    },
    survival: {
      foodProductionLoss,
      waterSupplyDamage,
      medicalCapacityLoss,
      shelterAvailability,
      accuracy: "estimated",
    },
  };
}

// Helper function: Climate damage calculations
function calculateClimateDamage(
  asteroid: UnifiedAsteroidData,
  tntMegatons: number,
  craterCalc: any,
  location: ImpactLocation
): ComprehensiveImpactResults["climate"] {
  
  // Dust and debris calculations
  const craterVolume = craterCalc.crater.volume; // cubic meters
  const dustInjection = (craterVolume / 1e9) * 0.1; // 10% becomes atmospheric dust (cubic km)

  // Temperature effects based on impact size
  const immediateChange = location.isOcean ? 0.5 : 2.0; // Local heating
  const shortTermChange = -(dustInjection * 0.5); // Cooling from dust
  const longTermChange = -(dustInjection * 0.2); // Residual cooling

  // Sunlight reduction
  const sunlightReduction = Math.min(90, dustInjection * 10); // Percentage
  const dustDuration = Math.floor(dustInjection * 2); // Months

  // Habitability impact
  const directAreaLost = Math.PI * Math.pow(craterCalc.crater.diameter / 2000, 2); // km²
  const indirectAreaLost = directAreaLost * 5; // 5x from climate effects
  const totalAreaLost = directAreaLost + indirectAreaLost;
  const earthLandArea = 148940000; // km²
  const percentageLost = (totalAreaLost / earthLandArea) * 100;
  
  const agricultureImpact = Math.min(100, sunlightReduction * 0.8); // 80% correlation

  // Long-term effects
  const extinctionRisk = tntMegatons > 100000 ? 0.9 : tntMegatons > 10000 ? 0.5 : 0.1;
  const recoveryTime = Math.floor(dustDuration / 12) + 5; // Years
  const permanentChange = tntMegatons > 50000;

  return {
    temperature: {
      immediateChange,
      shortTermChange,
      longTermChange,
      accuracy: "estimated",
    },
    atmosphere: {
      dustInjection,
      sunlightReduction,
      duration: dustDuration,
      accuracy: "estimated",
    },
    habitability: {
      areaLost: totalAreaLost,
      percentageLost,
      agricultureImpact,
      accuracy: "estimated",
    },
    longTerm: {
      extinctionRisk,
      recoveryTime,
      permanentChange,
      accuracy: "probability",
    },
  };
}

// Helper function: Natural disaster calculations
function calculateNaturalDisasters(
  asteroid: UnifiedAsteroidData,
  location: ImpactLocation,
  tntMegatons: number,
  blastCalc: any
): ComprehensiveImpactResults["naturalDisasters"] {
  
  // Tsunami calculations (if ocean impact)
  let tsunami = {
    triggered: false,
    waveHeight: 0,
    affectedCoastline: 0,
    inlandPenetration: 0,
    casualties: 0,
    accuracy: "calculated" as const,
  };

  if (location.isOcean) {
    const oceanDepth = location.oceanDepth || 4000; // Average ocean depth
    const impactEnergy = tntMegatons * 4.184e15; // Joules
    
    // Simplified tsunami wave height calculation
    const waveHeight = Math.pow(impactEnergy / 1e18, 0.4) * 10; // meters
    const affectedCoastline = Math.min(10000, waveHeight * 100); // km
    const inlandPenetration = waveHeight * 0.5; // km
    
    // Estimate coastal casualties
    const coastalPopDensity = 200; // people per km²
    const affectedCoastalArea = affectedCoastline * inlandPenetration;
    const casualties = Math.floor(affectedCoastalArea * coastalPopDensity * 0.3); // 30% fatality

    tsunami = {
      triggered: true,
      waveHeight,
      affectedCoastline,
      inlandPenetration,
      casualties,
      accuracy: "estimated",
    };
  }

  // Seismic effects
  const earthquakeMagnitude = blastCalc.effects.seismicMagnitude;
  const aftershocks = Math.floor(earthquakeMagnitude * 10);
  const faultLineActivation = earthquakeMagnitude > 7.0;
  const volcanicActivity = earthquakeMagnitude > 8.0 && Math.random() > 0.7;

  // Atmospheric effects
  const hurricaneForceWinds = tntMegatons > 100;
  const windRadius = hurricaneForceWinds ? blastCalc.effects.airblastRadius * 2 : 0;
  const fireStorms = tntMegatons > 10;
  const fireStormRadius = fireStorms ? blastCalc.effects.thermalRadiation * 1.5 : 0;

  return {
    tsunami,
    seismic: {
      earthquakeMagnitude,
      aftershocks,
      faultLineActivation,
      volcanicActivity,
      accuracy: "calculated",
    },
    atmospheric: {
      hurricaneForceWinds,
      windRadius,
      fireStorms,
      fireStormRadius,
      accuracy: "calculated",
    },
  };
}

// Helper function: Generate impact timeline
function generateImpactTimeline(
  casualties: any,
  infrastructure: any,
  climate: any,
  naturalDisasters: any
): ComprehensiveImpactResults["timeline"] {
  
  return {
    t0: {
      time: "Impact (T+0)",
      casualties: casualties.immediate.deaths,
      displaced: 0,
      temperature: climate.temperature.immediateChange,
      habitableArea: 100,
      foodProduction: 100,
      description: "Asteroid impact creates massive crater and fireball. Immediate vaporization of everything within ground zero.",
    },
    t1Hour: {
      time: "T+1 Hour",
      casualties: casualties.immediate.deaths + Math.floor(casualties.shortTerm.deaths * 0.1),
      displaced: Math.floor(casualties.longTerm.displaced * 0.3),
      temperature: climate.temperature.immediateChange * 0.8,
      habitableArea: 100 - climate.habitability.percentageLost * 0.1,
      foodProduction: 100 - infrastructure.survival.foodProductionLoss * 0.2,
      description: "Shockwave expands outward. Buildings collapse. Fires ignite across the region. Dust begins to rise into atmosphere.",
    },
    t24Hours: {
      time: "T+24 Hours",
      casualties: casualties.immediate.deaths + casualties.shortTerm.deaths,
      displaced: Math.floor(casualties.longTerm.displaced * 0.7),
      temperature: climate.temperature.immediateChange * 0.3,
      habitableArea: 100 - climate.habitability.percentageLost * 0.3,
      foodProduction: 100 - infrastructure.survival.foodProductionLoss * 0.5,
      description: "Dust cloud spreads globally. Temperature begins to drop. Rescue operations hampered by infrastructure damage.",
    },
    t1Week: {
      time: "T+1 Week",
      casualties: casualties.immediate.deaths + casualties.shortTerm.deaths + Math.floor(casualties.longTerm.deaths * 0.1),
      displaced: casualties.longTerm.displaced,
      temperature: climate.temperature.shortTermChange * 0.3,
      habitableArea: 100 - climate.habitability.percentageLost * 0.5,
      foodProduction: 100 - infrastructure.survival.foodProductionLoss * 0.7,
      description: "Global sunlight reduced. Temperatures dropping worldwide. Food supply chains disrupted. Mass evacuations underway.",
    },
    t1Month: {
      time: "T+1 Month",
      casualties: casualties.immediate.deaths + casualties.shortTerm.deaths + Math.floor(casualties.longTerm.deaths * 0.3),
      displaced: casualties.longTerm.displaced,
      temperature: climate.temperature.shortTermChange * 0.6,
      habitableArea: 100 - climate.habitability.percentageLost * 0.7,
      foodProduction: 100 - infrastructure.survival.foodProductionLoss * 0.9,
      description: "Atmospheric dust at peak. Crop failures beginning. Refugee crisis intensifies. Global coordination efforts.",
    },
    t1Year: {
      time: "T+1 Year",
      casualties: casualties.total.estimatedDeaths,
      displaced: casualties.longTerm.displaced,
      temperature: climate.temperature.shortTermChange,
      habitableArea: 100 - climate.habitability.percentageLost,
      foodProduction: 100 - climate.habitability.agricultureImpact,
      description: "Dust settling but climate altered. Widespread famine. Societal restructuring. Long-term recovery begins.",
    },
    t10Years: {
      time: "T+10 Years",
      casualties: casualties.total.estimatedDeaths,
      displaced: Math.floor(casualties.longTerm.displaced * 0.5),
      temperature: climate.temperature.longTermChange,
      habitableArea: 100 - climate.habitability.percentageLost * 0.8,
      foodProduction: 100 - climate.habitability.agricultureImpact * 0.5,
      description: "Partial recovery. Climate stabilizing but permanently altered. Rebuilding efforts ongoing. New normal established.",
    },
  };
}

// Utility function to format numbers
export function formatLargeNumber(num: number): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(0);
}

// Utility function to format currency
export function formatCurrency(num: number): string {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toFixed(0)}`;
}
