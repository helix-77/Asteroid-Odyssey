// Enhanced impact calculations for the asteroid impact simulator
// Includes geological destruction, population casualties, infrastructure damage, 
// climate impact, and natural disasters

import type { ImpactResults } from "./impact";

export interface EnhancedImpactResults extends ImpactResults {
  geological: {
    craterDiameter: number; // km
    craterDepth: number; // km
    explosionStrength: number; // megatons TNT
    impactRegionRadius: number; // km
    demolishedAreaRadius: number; // km
    seismicEffects: {
      magnitude: number;
      feltRadius: number; // km
      damageRadius: number; // km
    };
  };
  population: {
    immediateCasualties: number;
    injuredCount: number;
    displacedPopulation: number;
    affectedPopulation: number;
    casualtyByDistance: {
      distance: number; // km
      casualties: number;
      survivalRate: number; // percentage
    }[];
  };
  infrastructure: {
    military: {
      facilitiesDestroyed: number;
      facilitiesDamaged: number;
      strategicImpact: string;
    };
    civilian: {
      buildingsDestroyed: number;
      buildingsDamaged: number;
      transportationDisruption: number; // percentage
    };
    energy: {
      powerPlantsAffected: number;
      nuclearFacilitiesAtRisk: number;
      energyGridDisruption: number; // percentage
      nuclearFalloutRisk: boolean;
    };
    cultural: {
      sitesDestroyed: number;
      sitesDamaged: number;
      culturalLoss: string;
    };
    economic: {
      directDamage: number; // USD
      indirectDamage: number; // USD
      lostProduction: number; // USD per year
      recoveryTime: number; // years
    };
  };
  climate: {
    temperatureChange: number; // degrees Celsius
    dustCloudRadius: number; // km
    atmosphericEffects: {
      dustInjection: number; // tons
      sunlightReduction: number; // percentage
      duration: number; // months
    };
    habitabilityImpact: {
      affectedArea: number; // km²
      habitabilityLoss: number; // percentage
      recoveryTime: number; // years
    };
    agriculturalImpact: {
      cropLoss: number; // percentage
      affectedFarmland: number; // km²
      foodSecurityRisk: string;
    };
  };
  naturalDisasters: {
    tsunami: {
      triggered: boolean;
      waveHeight: number; // meters
      affectedCoastline: number; // km
      inlandPenetration: number; // km
    };
    earthquakes: {
      primaryMagnitude: number;
      aftershockCount: number;
      faultActivation: boolean;
    };
    tectonicEffects: {
      plateDisruption: boolean;
      volcanicActivation: boolean;
      landslideRisk: number; // percentage
    };
  };
}

// Calculate geological destruction effects
export function calculateGeologicalDestruction(
  asteroidMass: number, // kg
  velocity: number, // m/s
  angle: number, // degrees
  composition: string
): EnhancedImpactResults['geological'] {
  const kineticEnergy = 0.5 * asteroidMass * velocity * velocity; // Joules
  const tntEquivalent = kineticEnergy / 4.184e12; // megatons TNT
  
  // Crater calculations using scaling laws
  const impactorDensity = getCompositionDensity(composition);
  const targetDensity = 2700; // kg/m³ (crustal rock)
  const gravity = 9.81; // m/s²
  
  // Enhanced crater diameter calculation
  const angleRad = (angle * Math.PI) / 180;
  const angleFactor = Math.pow(Math.sin(angleRad), 1/3);
  const densityFactor = Math.pow(impactorDensity / targetDensity, 1/6);
  
  const craterDiameter = 1.88 * Math.pow(kineticEnergy / (targetDensity * gravity), 0.22) * angleFactor * densityFactor / 1000; // km
  const craterDepth = craterDiameter * 0.13; // km (depth-to-diameter ratio)
  
  // Impact region calculations
  const impactRegionRadius = craterDiameter * 2; // km
  const demolishedAreaRadius = craterDiameter * 5; // km
  
  // Seismic effects
  const seismicMagnitude = Math.max(0, 0.67 * Math.log10(kineticEnergy) - 5.87);
  const feltRadius = Math.pow(10, (seismicMagnitude - 2) / 3) * 100; // km
  const damageRadius = feltRadius * 0.3; // km
  
  return {
    craterDiameter,
    craterDepth,
    explosionStrength: tntEquivalent / 1000, // megatons
    impactRegionRadius,
    demolishedAreaRadius,
    seismicEffects: {
      magnitude: seismicMagnitude,
      feltRadius,
      damageRadius,
    },
  };
}

// Calculate population casualties with distance-based modeling
export function calculatePopulationCasualties(
  geological: EnhancedImpactResults['geological'],
  impactLocation: { lat: number; lng: number },
  populationData: any[]
): EnhancedImpactResults['population'] {
  let immediateCasualties = 0;
  let injuredCount = 0;
  let displacedPopulation = 0;
  let affectedPopulation = 0;
  
  const casualtyByDistance: { distance: number; casualties: number; survivalRate: number }[] = [];
  
  // Distance-based casualty calculation
  const distances = [1, 5, 10, 25, 50, 100]; // km
  
  distances.forEach(distance => {
    let casualties = 0;
    let population = 0;
    
    // Calculate population within this distance ring
    populationData.forEach(regionData => {
      regionData.coordinates?.forEach((coord: any) => {
        const distanceToImpact = calculateDistance(
          impactLocation.lat, impactLocation.lng,
          coord.lat, coord.lng
        );
        
        if (distanceToImpact <= distance) {
          const ringPopulation = coord.density * Math.PI * Math.pow(distance * 1000, 2) / 1000000; // Convert to people
          population += ringPopulation;
          
          // Casualty rates based on distance
          let mortalityRate = 0;
          if (distance <= geological.craterDiameter / 2) {
            mortalityRate = 1.0; // 100% mortality in crater
          } else if (distance <= geological.impactRegionRadius) {
            mortalityRate = 0.8; // 80% mortality in immediate impact region
          } else if (distance <= geological.demolishedAreaRadius) {
            mortalityRate = 0.3; // 30% mortality in demolished area
          } else if (distance <= geological.seismicEffects.damageRadius) {
            mortalityRate = 0.05; // 5% mortality in seismic damage area
          } else {
            mortalityRate = 0.001; // 0.1% mortality from indirect effects
          }
          
          casualties += ringPopulation * mortalityRate;
        }
      });
    });
    
    const survivalRate = population > 0 ? ((population - casualties) / population) * 100 : 100;
    casualtyByDistance.push({ distance, casualties, survivalRate });
    
    if (distance === distances[distances.length - 1]) {
      immediateCasualties = casualties;
      injuredCount = casualties * 2; // Estimate 2:1 injured to dead ratio
      displacedPopulation = population * 0.8; // 80% displacement
      affectedPopulation = population;
    }
  });
  
  return {
    immediateCasualties,
    injuredCount,
    displacedPopulation,
    affectedPopulation,
    casualtyByDistance,
  };
}

// Calculate infrastructure damage
export function calculateInfrastructureDamage(
  geological: EnhancedImpactResults['geological'],
  impactLocation: { lat: number; lng: number },
  infrastructureData: any[]
): EnhancedImpactResults['infrastructure'] {
  const infrastructure = {
    military: { facilitiesDestroyed: 0, facilitiesDamaged: 0, strategicImpact: "minimal" },
    civilian: { buildingsDestroyed: 0, buildingsDamaged: 0, transportationDisruption: 0 },
    energy: { powerPlantsAffected: 0, nuclearFacilitiesAtRisk: 0, energyGridDisruption: 0, nuclearFalloutRisk: false },
    cultural: { sitesDestroyed: 0, sitesDamaged: 0, culturalLoss: "minimal" },
    economic: { directDamage: 0, indirectDamage: 0, lostProduction: 0, recoveryTime: 0 },
  };
  
  infrastructureData.forEach(category => {
    category.locations?.forEach((facility: any) => {
      const distance = calculateDistance(
        impactLocation.lat, impactLocation.lng,
        facility.lat, facility.lng
      );
      
      let damageLevel = 0;
      if (distance <= geological.craterDiameter / 2) {
        damageLevel = 1.0; // Complete destruction
      } else if (distance <= geological.impactRegionRadius) {
        damageLevel = 0.8; // Severe damage
      } else if (distance <= geological.demolishedAreaRadius) {
        damageLevel = 0.5; // Moderate damage
      } else if (distance <= geological.seismicEffects.damageRadius) {
        damageLevel = 0.2; // Light damage
      }
      
      if (damageLevel > 0) {
        switch (category.type) {
          case 'military':
            if (damageLevel >= 0.8) infrastructure.military.facilitiesDestroyed++;
            else infrastructure.military.facilitiesDamaged++;
            if (facility.importance === 'critical') {
              infrastructure.military.strategicImpact = damageLevel >= 0.5 ? "severe" : "moderate";
            }
            break;
            
          case 'civilian':
            const buildingCount = Math.floor(Math.random() * 10000) + 1000; // Estimate buildings in area
            infrastructure.civilian.buildingsDestroyed += Math.floor(buildingCount * damageLevel);
            infrastructure.civilian.buildingsDamaged += Math.floor(buildingCount * (1 - damageLevel) * 0.5);
            infrastructure.civilian.transportationDisruption = Math.max(
              infrastructure.civilian.transportationDisruption,
              damageLevel * 100
            );
            break;
            
          case 'energy':
            infrastructure.energy.powerPlantsAffected++;
            if (facility.subtype === 'nuclear') {
              infrastructure.energy.nuclearFacilitiesAtRisk++;
              if (damageLevel >= 0.3) {
                infrastructure.energy.nuclearFalloutRisk = true;
              }
            }
            infrastructure.energy.energyGridDisruption = Math.max(
              infrastructure.energy.energyGridDisruption,
              damageLevel * 100
            );
            break;
            
          case 'cultural':
            if (damageLevel >= 0.8) infrastructure.cultural.sitesDestroyed++;
            else infrastructure.cultural.sitesDamaged++;
            if (facility.importance === 'critical') {
              infrastructure.cultural.culturalLoss = damageLevel >= 0.5 ? "severe" : "moderate";
            }
            break;
        }
      }
    });
  });
  
  // Economic calculations
  const affectedArea = Math.PI * Math.pow(geological.demolishedAreaRadius * 1000, 2); // m²
  const gdpPerM2 = 1000; // USD per m² (rough estimate)
  
  infrastructure.economic.directDamage = affectedArea * gdpPerM2 * 0.3; // 30% direct damage
  infrastructure.economic.indirectDamage = infrastructure.economic.directDamage * 0.5; // 50% indirect
  infrastructure.economic.lostProduction = infrastructure.economic.directDamage * 0.1; // 10% annual loss
  infrastructure.economic.recoveryTime = Math.min(20, geological.explosionStrength / 10); // years
  
  return infrastructure;
}

// Calculate climate impact
export function calculateClimateImpact(
  geological: EnhancedImpactResults['geological'],
  asteroidMass: number,
  composition: string
): EnhancedImpactResults['climate'] {
  const explosionStrength = geological.explosionStrength; // megatons
  
  // Temperature change calculation
  const temperatureChange = -Math.min(5, explosionStrength / 1000); // Max 5°C cooling
  
  // Dust cloud calculations
  const dustCloudRadius = Math.sqrt(explosionStrength) * 100; // km
  const dustInjection = asteroidMass * 0.1; // 10% of asteroid mass becomes dust
  
  // Atmospheric effects
  const sunlightReduction = Math.min(30, explosionStrength / 100); // Max 30% reduction
  const effectDuration = Math.min(24, explosionStrength / 50); // Max 24 months
  
  // Habitability impact
  const affectedArea = Math.PI * Math.pow(dustCloudRadius * 1000, 2); // m²
  const habitabilityLoss = Math.min(60, explosionStrength / 20); // Max 60% loss
  const recoveryTime = Math.min(50, explosionStrength / 10); // Max 50 years
  
  // Agricultural impact
  const cropLoss = Math.min(80, sunlightReduction * 2); // Crop loss percentage
  const affectedFarmland = affectedArea * 0.3 / 1000000; // 30% of affected area is farmland, convert to km²
  
  let foodSecurityRisk = "low";
  if (cropLoss > 50) foodSecurityRisk = "severe";
  else if (cropLoss > 25) foodSecurityRisk = "moderate";
  
  return {
    temperatureChange,
    dustCloudRadius,
    atmosphericEffects: {
      dustInjection,
      sunlightReduction,
      duration: effectDuration,
    },
    habitabilityImpact: {
      affectedArea: affectedArea / 1000000, // Convert to km²
      habitabilityLoss,
      recoveryTime,
    },
    agriculturalImpact: {
      cropLoss,
      affectedFarmland,
      foodSecurityRisk,
    },
  };
}

// Calculate natural disasters
export function calculateNaturalDisasters(
  geological: EnhancedImpactResults['geological'],
  impactLocation: { lat: number; lng: number },
  asteroidMass: number
): EnhancedImpactResults['naturalDisasters'] {
  const explosionStrength = geological.explosionStrength; // megatons
  
  // Tsunami calculation (if impact is near water)
  const isNearWater = isLocationNearWater(impactLocation); // Simplified check
  const tsunami = {
    triggered: isNearWater && explosionStrength > 1, // Trigger if >1 megaton near water
    waveHeight: isNearWater ? Math.min(100, explosionStrength / 10) : 0, // meters
    affectedCoastline: isNearWater ? Math.min(5000, explosionStrength * 50) : 0, // km
    inlandPenetration: isNearWater ? Math.min(50, explosionStrength / 20) : 0, // km
  };
  
  // Earthquake effects
  const earthquakes = {
    primaryMagnitude: geological.seismicEffects.magnitude,
    aftershockCount: Math.floor(Math.pow(geological.seismicEffects.magnitude, 2)),
    faultActivation: geological.seismicEffects.magnitude > 6.0,
  };
  
  // Tectonic effects
  const tectonicEffects = {
    plateDisruption: explosionStrength > 1000, // Only for very large impacts
    volcanicActivation: explosionStrength > 100 && Math.random() > 0.7, // 30% chance for large impacts
    landslideRisk: Math.min(90, geological.seismicEffects.magnitude * 15), // percentage
  };
  
  return {
    tsunami,
    earthquakes,
    tectonicEffects,
  };
}

// Helper functions
function getCompositionDensity(composition: string): number {
  const densities: Record<string, number> = {
    stony: 2700,
    metallic: 7800,
    carbonaceous: 1400,
    "stony-iron": 5300,
    basaltic: 2900,
  };
  return densities[composition] || 2500;
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function isLocationNearWater(location: { lat: number; lng: number }): boolean {
  // Simplified check - in reality, this would use coastline data
  // For now, assume locations within certain lat/lng ranges are near water
  const { lat, lng } = location;
  
  // Coastal regions (simplified)
  const coastalRegions = [
    { minLat: 25, maxLat: 50, minLng: -130, maxLng: -60 }, // North America East/West Coast
    { minLat: 35, maxLat: 70, minLng: -10, maxLng: 40 }, // Europe
    { minLat: 10, maxLat: 70, minLng: 100, maxLng: 150 }, // Asia Pacific
    { minLat: -50, maxLat: 0, minLng: 110, maxLng: 180 }, // Australia/Oceania
  ];
  
  return coastalRegions.some(region => 
    lat >= region.minLat && lat <= region.maxLat &&
    lng >= region.minLng && lng <= region.maxLng
  );
}

// Main enhanced impact calculation function
export function calculateEnhancedImpact(
  asteroidMass: number,
  velocity: number,
  angle: number,
  composition: string,
  impactLocation: { lat: number; lng: number },
  populationData: any[],
  infrastructureData: any[]
): EnhancedImpactResults {
  // Calculate base impact results
  const geological = calculateGeologicalDestruction(asteroidMass, velocity, angle, composition);
  const population = calculatePopulationCasualties(geological, impactLocation, populationData);
  const infrastructure = calculateInfrastructureDamage(geological, impactLocation, infrastructureData);
  const climate = calculateClimateImpact(geological, asteroidMass, composition);
  const naturalDisasters = calculateNaturalDisasters(geological, impactLocation, asteroidMass);
  
  // Calculate base values for compatibility
  const kineticEnergy = 0.5 * asteroidMass * velocity * velocity;
  const tntEquivalent = kineticEnergy / 4.184e9; // kilotons
  
  return {
    // Base compatibility
    kineticEnergy,
    tntEquivalent,
    crater: {
      diameter: geological.craterDiameter * 1000, // Convert to meters
      depth: geological.craterDepth * 1000, // Convert to meters
      volume: Math.PI * Math.pow(geological.craterDiameter * 500, 2) * geological.craterDepth * 1000 / 3, // m³
    },
    effects: {
      fireballRadius: geological.craterDiameter * 0.5, // km
      airblastRadius: geological.demolishedAreaRadius, // km
      thermalRadiation: geological.impactRegionRadius, // km
      seismicMagnitude: geological.seismicEffects.magnitude,
    },
    casualties: {
      immediate: population.immediateCasualties,
      injured: population.injuredCount,
      displaced: population.displacedPopulation,
    },
    economicImpact: infrastructure.economic.directDamage + infrastructure.economic.indirectDamage,
    
    // Enhanced data
    geological,
    population,
    infrastructure,
    climate,
    naturalDisasters,
  };
}
