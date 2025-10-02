// Types for impact simulation calculations

export interface ImpactParameters {
  asteroidDiameter: number; // meters
  velocity: number; // km/s
  density: number; // kg/m³
  impactAngle: number; // degrees
  targetType: 'land' | 'water';
  latitude: number;
  longitude: number;
}

export interface ImpactEffects {
  // Energy
  kineticEnergy: number; // joules
  tntEquivalent: number; // megatons
  
  // Crater
  craterDiameter: number; // meters
  craterDepth: number; // meters
  craterVolume: number; // cubic meters
  
  // Blast effects
  blastRadius: number; // meters
  thermalRadius: number; // meters
  seismicMagnitude: number; // Richter scale
  
  // Casualties and damage
  estimatedCasualties: number;
  economicDamage: number; // USD
  affectedArea: number; // square km
}

export interface TemporalEffects {
  time: number; // years relative to impact (negative = before impact)
  
  // Global effects
  globalTemperature: number; // °C change from baseline
  atmosphericDust: number; // percentage of normal sunlight
  co2Level: number; // ppm
  ozoneDepletion: number; // percentage
  
  // Regional effects
  regionalDamage: Map<string, RegionalDamage>;
  
  // Infrastructure
  infrastructureDamage: Map<string, InfrastructureDamage>;
  
  // Casualties
  immediateCasualties: number;
  cumulativeCasualties: number;
  
  // Economic
  economicImpact: number; // USD
  
  // Recovery metrics
  habitabilityIndex: number; // 0-100
  agriculturalCapacity: number; // percentage of pre-impact
  waterQuality: number; // percentage of pre-impact
}

export interface RegionalDamage {
  countryCode: string;
  countryName: string;
  distance: number; // km from impact
  
  // Population effects
  populationLoss: number; // absolute number
  populationLossPercent: number; // percentage
  
  // Habitability
  habitabilityChange: number; // change from baseline (0-100 scale)
  
  // Infrastructure
  infrastructureDestroyed: number; // percentage
  
  // Environmental
  agriculturalLoss: number; // percentage
  forestLoss: number; // percentage
  waterContamination: number; // percentage
  
  // Specific hazards
  tsunamiImpact: number; // 0-100 severity
  seismicImpact: number; // 0-100 severity
  thermalImpact: number; // 0-100 severity
  blastImpact: number; // 0-100 severity
}

export interface InfrastructureDamage {
  facilityId: string;
  facilityName: string;
  type: 'military' | 'energy' | 'cultural' | 'civilian';
  importance: number; // 1-5
  
  // Damage state
  damageLevel: number; // 0-100 (0 = intact, 100 = destroyed)
  operational: boolean;
  
  // Recovery
  recoveryTime: number; // years
  recoveryProgress: number; // 0-100
}

export interface ClimateEffects {
  time: number; // years
  temperatureAnomaly: number; // °C
  precipitationChange: number; // percentage
  dustLoading: number; // Tg (teragrams)
  sunlightReduction: number; // percentage
  co2Increase: number; // ppm
  ozoneDepletion: number; // percentage
}

export interface CountryData {
  name: string;
  code: string;
  population: number;
  populationDensity: number;
  habitability: number;
  tsunamiRisk: number;
  tectonicRisk: number;
  gdp: number;
  urbanization: number;
  agriculturalLand: number;
  forestCover: number;
  waterResources: number;
  avgElevation: number;
}

export interface InfrastructurePoint {
  name: string;
  type: 'military' | 'energy' | 'cultural' | 'civilian';
  latitude: number;
  longitude: number;
  importance: number;
  country: string;
}
