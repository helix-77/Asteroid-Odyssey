// Temporal Effects Calculator - Models how impact effects change over time
// Time range: -0.5 years (6 months before) to 50 years after impact

import type {
  ImpactParameters,
  ImpactEffects,
  TemporalEffects,
  RegionalDamage,
  InfrastructureDamage,
  ClimateEffects,
  CountryData,
  InfrastructurePoint
} from './types';

// Calculate distance between two lat/lng points (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export class TemporalEffectsCalculator {
  private impactParams: ImpactParameters;
  private impactEffects: ImpactEffects;
  private countries: CountryData[];
  private infrastructure: InfrastructurePoint[];
  
  // Impact time is t=0
  private readonly IMPACT_TIME = 0;
  
  constructor(
    impactParams: ImpactParameters,
    impactEffects: ImpactEffects,
    countries: CountryData[],
    infrastructure: InfrastructurePoint[]
  ) {
    this.impactParams = impactParams;
    this.impactEffects = impactEffects;
    this.countries = countries;
    this.infrastructure = infrastructure;
  }
  
  /**
   * Calculate all effects at a specific time
   * @param timeYears Time in years relative to impact (negative = before, 0 = impact, positive = after)
   */
  calculateEffectsAtTime(timeYears: number): TemporalEffects {
    const climateEffects = this.calculateClimateEffects(timeYears);
    const regionalDamage = this.calculateRegionalDamage(timeYears);
    const infrastructureDamage = this.calculateInfrastructureDamage(timeYears);
    const casualties = this.calculateCasualties(timeYears, regionalDamage);
    const economicImpact = this.calculateEconomicImpact(timeYears, regionalDamage);
    
    return {
      time: timeYears,
      globalTemperature: climateEffects.temperatureAnomaly,
      atmosphericDust: climateEffects.sunlightReduction,
      co2Level: climateEffects.co2Increase,
      ozoneDepletion: climateEffects.ozoneDepletion,
      regionalDamage,
      infrastructureDamage,
      immediateCasualties: casualties.immediate,
      cumulativeCasualties: casualties.cumulative,
      economicImpact,
      habitabilityIndex: this.calculateGlobalHabitability(timeYears, climateEffects),
      agriculturalCapacity: this.calculateAgriculturalCapacity(timeYears, climateEffects),
      waterQuality: this.calculateWaterQuality(timeYears)
    };
  }
  
  /**
   * Calculate climate effects over time
   */
  private calculateClimateEffects(timeYears: number): ClimateEffects {
    const energy = this.impactEffects.kineticEnergy;
    const tnt = this.impactEffects.tntEquivalent;
    
    // Before impact: normal conditions
    if (timeYears < 0) {
      return {
        time: timeYears,
        temperatureAnomaly: 0,
        precipitationChange: 0,
        dustLoading: 0,
        sunlightReduction: 0,
        co2Increase: 0,
        ozoneDepletion: 0
      };
    }
    
    // Dust injection scales with impact energy
    const dustMass = Math.pow(tnt, 0.7) * 100; // Teragrams
    
    // Dust settles over time (exponential decay with multiple timescales)
    const fastDecay = Math.exp(-timeYears / 0.5); // Fast settling (months)
    const slowDecay = Math.exp(-timeYears / 5); // Slow settling (years)
    const dustLoading = dustMass * (0.7 * fastDecay + 0.3 * slowDecay);
    
    // Sunlight reduction from dust
    const sunlightReduction = Math.min(95, dustLoading * 0.8);
    
    // Temperature drop from reduced sunlight
    // Peak cooling in first year, gradual recovery
    let temperatureAnomaly = 0;
    if (timeYears < 1) {
      temperatureAnomaly = -sunlightReduction * 0.15; // Up to -14°C for major impacts
    } else {
      const recoveryFactor = Math.exp(-(timeYears - 1) / 10);
      temperatureAnomaly = -sunlightReduction * 0.15 * recoveryFactor;
    }
    
    // CO2 increase from fires and biomass burning
    const co2Peak = Math.min(200, tnt * 0.5); // ppm increase
    const co2Increase = 410 + co2Peak * Math.exp(-timeYears / 20); // Long-term persistence
    
    // Ozone depletion from NOx production
    const ozoneDepletion = Math.min(50, tnt * 0.3) * Math.exp(-timeYears / 3);
    
    // Precipitation changes (reduced due to cooling)
    const precipitationChange = temperatureAnomaly * 2; // Roughly 2% per degree
    
    return {
      time: timeYears,
      temperatureAnomaly,
      precipitationChange,
      dustLoading,
      sunlightReduction,
      co2Increase,
      ozoneDepletion
    };
  }
  
  /**
   * Calculate regional damage for each country
   */
  private calculateRegionalDamage(timeYears: number): Map<string, RegionalDamage> {
    const damageMap = new Map<string, RegionalDamage>();
    
    for (const country of this.countries) {
      // Estimate country center (simplified - would need actual data)
      const countryLat = this.estimateCountryCenter(country.code).lat;
      const countryLng = this.estimateCountryCenter(country.code).lng;
      
      const distance = calculateDistance(
        this.impactParams.latitude,
        this.impactParams.longitude,
        countryLat,
        countryLng
      );
      
      // Calculate damage based on distance and time
      const damage = this.calculateDamageAtDistance(distance, timeYears, country);
      
      damageMap.set(country.code, {
        countryCode: country.code,
        countryName: country.name,
        distance,
        ...damage
      });
    }
    
    return damageMap;
  }
  
  /**
   * Calculate damage at a specific distance from impact
   */
  private calculateDamageAtDistance(distance: number, timeYears: number, country: CountryData) {
    // Before impact: no damage
    if (timeYears < 0) {
      return {
        populationLoss: 0,
        populationLossPercent: 0,
        habitabilityChange: 0,
        infrastructureDestroyed: 0,
        agriculturalLoss: 0,
        forestLoss: 0,
        waterContamination: 0,
        tsunamiImpact: 0,
        seismicImpact: 0,
        thermalImpact: 0,
        blastImpact: 0
      };
    }
    
    const craterRadius = this.impactEffects.craterDiameter / 2000; // km
    const blastRadius = this.impactEffects.blastRadius / 1000; // km
    const thermalRadius = this.impactEffects.thermalRadius / 1000; // km
    
    // Immediate effects (t=0 to t=0.1 years)
    let blastImpact = 0;
    let thermalImpact = 0;
    let seismicImpact = 0;
    let tsunamiImpact = 0;
    
    if (distance < craterRadius) {
      blastImpact = 100;
      thermalImpact = 100;
      seismicImpact = 100;
    } else if (distance < blastRadius) {
      blastImpact = 100 * Math.exp(-Math.pow(distance / blastRadius, 2));
      thermalImpact = 100 * Math.exp(-Math.pow(distance / thermalRadius, 2));
      seismicImpact = 100 * Math.exp(-distance / (blastRadius * 2));
    } else {
      // Distant effects
      seismicImpact = Math.max(0, 50 * Math.exp(-distance / 5000)) * country.tectonicRisk / 100;
    }
    
    // Tsunami effects (if water impact and coastal)
    if (this.impactParams.targetType === 'water' && country.tsunamiRisk > 20) {
      const tsunamiDecay = Math.exp(-distance / 3000);
      tsunamiImpact = country.tsunamiRisk * tsunamiDecay;
    }
    
    // Immediate casualties (first few months)
    const immediateDamage = Math.max(blastImpact, thermalImpact, tsunamiImpact);
    let populationLossPercent = immediateDamage * country.populationDensity / 1000;
    
    // Add climate-driven casualties over time
    if (timeYears > 0.1) {
      const climateEffects = this.calculateClimateEffects(timeYears);
      const temperatureDrop = Math.abs(climateEffects.temperatureAnomaly);
      
      // Agricultural collapse leads to famine
      const famineRisk = Math.min(80, temperatureDrop * 5);
      const famineCasualties = famineRisk * 0.3 * (1 - Math.exp(-timeYears / 2));
      
      populationLossPercent += famineCasualties;
    }
    
    populationLossPercent = Math.min(95, populationLossPercent);
    const populationLoss = country.population * populationLossPercent / 100;
    
    // Infrastructure destruction
    let infrastructureDestroyed = immediateDamage * 0.8;
    
    // Recovery over time (starts after 1 year)
    if (timeYears > 1) {
      const recoveryRate = 0.05; // 5% per year
      const recovered = (timeYears - 1) * recoveryRate * 100;
      infrastructureDestroyed = Math.max(0, infrastructureDestroyed - recovered);
    }
    
    // Agricultural loss
    const immediateAgLoss = immediateDamage * 0.9;
    const climaticAgLoss = Math.abs(this.calculateClimateEffects(timeYears).temperatureAnomaly) * 8;
    let agriculturalLoss = Math.min(100, immediateAgLoss + climaticAgLoss);
    
    // Agricultural recovery (slower than infrastructure)
    if (timeYears > 2) {
      const agRecovery = (timeYears - 2) * 0.03 * 100;
      agriculturalLoss = Math.max(0, agriculturalLoss - agRecovery);
    }
    
    // Forest loss
    const forestLoss = Math.min(100, thermalImpact * 0.7 + blastImpact * 0.5);
    
    // Water contamination
    const waterContamination = Math.min(100, immediateDamage * 0.6 * Math.exp(-timeYears / 5));
    
    // Habitability change
    const habitabilityChange = -(populationLossPercent * 0.5 + agriculturalLoss * 0.3 + waterContamination * 0.2);
    
    return {
      populationLoss,
      populationLossPercent,
      habitabilityChange,
      infrastructureDestroyed,
      agriculturalLoss,
      forestLoss,
      waterContamination,
      tsunamiImpact,
      seismicImpact,
      thermalImpact,
      blastImpact
    };
  }
  
  /**
   * Calculate infrastructure damage over time
   */
  private calculateInfrastructureDamage(timeYears: number): Map<string, InfrastructureDamage> {
    const damageMap = new Map<string, InfrastructureDamage>();
    
    for (const facility of this.infrastructure) {
      const distance = calculateDistance(
        this.impactParams.latitude,
        this.impactParams.longitude,
        facility.latitude,
        facility.longitude
      );
      
      let damageLevel = 0;
      let recoveryTime = 0;
      
      if (timeYears >= 0) {
        const craterRadius = this.impactEffects.craterDiameter / 2000; // km
        const blastRadius = this.impactEffects.blastRadius / 1000; // km
        
        if (distance < craterRadius) {
          damageLevel = 100;
          recoveryTime = 50; // Never recovers
        } else if (distance < blastRadius) {
          damageLevel = 100 * Math.exp(-Math.pow(distance / blastRadius, 1.5));
          recoveryTime = damageLevel / 10; // 10% per year recovery rate
        } else {
          // Indirect damage from climate/economic collapse
          const climateDamage = Math.min(30, Math.abs(this.calculateClimateEffects(timeYears).temperatureAnomaly) * 2);
          damageLevel = climateDamage;
          recoveryTime = 5;
        }
        
        // Recovery progress
        let recoveryProgress = 0;
        if (timeYears > 1 && damageLevel < 100) {
          recoveryProgress = Math.min(100, ((timeYears - 1) / recoveryTime) * 100);
          damageLevel = damageLevel * (1 - recoveryProgress / 100);
        }
      }
      
      damageMap.set(facility.name, {
        facilityId: facility.name,
        facilityName: facility.name,
        type: facility.type,
        importance: facility.importance,
        damageLevel,
        operational: damageLevel < 50,
        recoveryTime,
        recoveryProgress: timeYears > 1 ? Math.min(100, ((timeYears - 1) / recoveryTime) * 100) : 0
      });
    }
    
    return damageMap;
  }
  
  /**
   * Calculate casualties over time
   */
  private calculateCasualties(timeYears: number, regionalDamage: Map<string, RegionalDamage>) {
    let immediate = 0;
    let cumulative = 0;
    
    if (timeYears >= 0) {
      for (const [_, damage] of regionalDamage) {
        cumulative += damage.populationLoss;
        
        // Immediate casualties (first 6 months)
        if (timeYears < 0.5) {
          const immediateFactor = Math.max(damage.blastImpact, damage.thermalImpact, damage.tsunamiImpact) / 100;
          immediate += damage.populationLoss * immediateFactor;
        }
      }
    }
    
    return { immediate, cumulative };
  }
  
  /**
   * Calculate economic impact
   */
  private calculateEconomicImpact(timeYears: number, regionalDamage: Map<string, RegionalDamage>): number {
    if (timeYears < 0) return 0;
    
    let totalDamage = 0;
    
    for (const country of this.countries) {
      const damage = regionalDamage.get(country.code);
      if (damage) {
        // Direct damage to infrastructure and assets
        const directDamage = country.gdp * (damage.infrastructureDestroyed / 100) * 2;
        
        // Ongoing economic losses from reduced capacity
        const ongoingLoss = country.gdp * timeYears * (damage.populationLossPercent / 100);
        
        totalDamage += directDamage + ongoingLoss;
      }
    }
    
    return totalDamage;
  }
  
  /**
   * Calculate global habitability index
   */
  private calculateGlobalHabitability(timeYears: number, climateEffects: ClimateEffects): number {
    if (timeYears < 0) return 75; // Pre-impact baseline
    
    const temperaturePenalty = Math.abs(climateEffects.temperatureAnomaly) * 3;
    const dustPenalty = climateEffects.sunlightReduction * 0.5;
    const ozonePenalty = climateEffects.ozoneDepletion * 0.3;
    
    let habitability = 75 - temperaturePenalty - dustPenalty - ozonePenalty;
    
    // Recovery over time
    if (timeYears > 5) {
      const recovery = (timeYears - 5) * 1.5;
      habitability = Math.min(75, habitability + recovery);
    }
    
    return Math.max(0, Math.min(100, habitability));
  }
  
  /**
   * Calculate agricultural capacity
   */
  private calculateAgriculturalCapacity(timeYears: number, climateEffects: ClimateEffects): number {
    if (timeYears < 0) return 100;
    
    const temperatureImpact = Math.abs(climateEffects.temperatureAnomaly) * 8;
    const sunlightImpact = climateEffects.sunlightReduction * 0.9;
    
    let capacity = 100 - temperatureImpact - sunlightImpact;
    
    // Recovery
    if (timeYears > 3) {
      const recovery = (timeYears - 3) * 3;
      capacity = Math.min(100, capacity + recovery);
    }
    
    return Math.max(0, capacity);
  }
  
  /**
   * Calculate water quality
   */
  private calculateWaterQuality(timeYears: number): number {
    if (timeYears < 0) return 100;
    
    const craterRadius = this.impactEffects.craterDiameter / 2000;
    const contaminationRadius = craterRadius * 50; // Contamination spreads
    
    // Initial contamination
    let quality = 100 - (this.impactEffects.tntEquivalent * 0.5);
    
    // Recovery through natural processes
    if (timeYears > 1) {
      const recovery = (timeYears - 1) * 4;
      quality = Math.min(100, quality + recovery);
    }
    
    return Math.max(20, quality);
  }
  
  /**
   * Estimate country center (simplified - using rough coordinates)
   */
  private estimateCountryCenter(code: string): { lat: number; lng: number } {
    // Simplified country centers - in production, use actual geographic centers
    const centers: Record<string, { lat: number; lng: number }> = {
      'USA': { lat: 39.8, lng: -98.5 },
      'CHN': { lat: 35.0, lng: 105.0 },
      'IND': { lat: 20.5, lng: 78.9 },
      'BRA': { lat: -10.0, lng: -55.0 },
      'RUS': { lat: 61.5, lng: 105.3 },
      'JPN': { lat: 36.2, lng: 138.2 },
      'DEU': { lat: 51.1, lng: 10.4 },
      'GBR': { lat: 55.3, lng: -3.4 },
      'FRA': { lat: 46.2, lng: 2.2 },
      'ITA': { lat: 41.8, lng: 12.5 },
      'CAN': { lat: 56.1, lng: -106.3 },
      'AUS': { lat: -25.2, lng: 133.7 },
      'MEX': { lat: 23.6, lng: -102.5 },
      'IDN': { lat: -0.7, lng: 113.9 },
      'KOR': { lat: 35.9, lng: 127.7 },
      'ESP': { lat: 40.4, lng: -3.7 },
      'TUR': { lat: 38.9, lng: 35.2 },
      'ARG': { lat: -38.4, lng: -63.6 },
      'ZAF': { lat: -30.5, lng: 22.9 },
      'EGY': { lat: 26.8, lng: 30.8 },
      'NGA': { lat: 9.0, lng: 8.6 },
      'KEN': { lat: -0.0, lng: 37.9 },
      'ETH': { lat: 9.1, lng: 40.4 },
      'SAU': { lat: 23.8, lng: 45.0 },
      'IRN': { lat: 32.4, lng: 53.6 },
      'THA': { lat: 15.8, lng: 100.9 },
      'PHL': { lat: 12.8, lng: 121.7 },
      'VNM': { lat: 14.0, lng: 108.2 },
      'POL': { lat: 51.9, lng: 19.1 },
      'NLD': { lat: 52.1, lng: 5.2 },
      'BEL': { lat: 50.5, lng: 4.4 },
      'SWE': { lat: 60.1, lng: 18.6 },
      'NOR': { lat: 60.4, lng: 8.4 },
      'CHE': { lat: 46.8, lng: 8.2 },
      'AUT': { lat: 47.5, lng: 14.5 },
      'GRC': { lat: 39.0, lng: 21.8 },
      'PRT': { lat: 39.3, lng: -8.2 },
      'CHL': { lat: -35.6, lng: -71.5 },
      'PER': { lat: -9.1, lng: -75.0 },
      'COL': { lat: 4.5, lng: -74.2 },
      'VEN': { lat: 6.4, lng: -66.5 },
      'ECU': { lat: -1.8, lng: -78.1 },
      'NZL': { lat: -40.9, lng: 174.8 },
      'MYS': { lat: 4.2, lng: 101.9 },
      'SGP': { lat: 1.3, lng: 103.8 },
      'BGD': { lat: 23.6, lng: 90.3 },
      'PAK': { lat: 30.3, lng: 69.3 },
      'AFG': { lat: 33.9, lng: 67.7 },
      'IRQ': { lat: 33.2, lng: 43.6 },
      'MAR': { lat: 31.7, lng: -7.0 },
      'DZA': { lat: 28.0, lng: 1.6 },
      'SDN': { lat: 12.8, lng: 30.2 },
      'TZA': { lat: -6.3, lng: 34.8 },
      'UGA': { lat: 1.3, lng: 32.2 },
      'GHA': { lat: 7.9, lng: -1.0 },
      'MOZ': { lat: -18.6, lng: 35.5 },
      'MDG': { lat: -18.7, lng: 46.8 },
      'CMR': { lat: 7.3, lng: 12.3 },
      'AGO': { lat: -11.2, lng: 17.8 },
      'NER': { lat: 17.6, lng: 8.0 },
      'MLI': { lat: 17.5, lng: -3.9 },
      'BFA': { lat: 12.2, lng: -1.5 },
      'ZMB': { lat: -13.1, lng: 27.8 },
      'ZWE': { lat: -19.0, lng: 29.1 },
      'SOM': { lat: 5.1, lng: 46.1 },
      'TCD': { lat: 15.4, lng: 18.7 },
      'SEN': { lat: 14.4, lng: -14.4 },
      'RWA': { lat: -1.9, lng: 29.8 },
      'TUN': { lat: 33.8, lng: 9.5 },
      'BOL': { lat: -16.2, lng: -63.5 },
      'PRY': { lat: -23.4, lng: -58.4 },
      'URY': { lat: -32.5, lng: -55.7 },
      'FIN': { lat: 61.9, lng: 25.7 },
      'DNK': { lat: 56.2, lng: 9.5 },
      'IRL': { lat: 53.4, lng: -8.2 },
      'ISL': { lat: 64.9, lng: -19.0 },
      'CUB': { lat: 21.5, lng: -77.7 },
      'DOM': { lat: 18.7, lng: -70.1 },
      'HTI': { lat: 18.9, lng: -72.2 },
      'GTM': { lat: 15.7, lng: -90.2 },
      'HND': { lat: 15.1, lng: -86.2 },
      'NIC': { lat: 12.8, lng: -85.2 },
      'CRI': { lat: 9.7, lng: -83.7 },
      'PAN': { lat: 8.5, lng: -80.7 },
      'JAM': { lat: 18.1, lng: -77.2 },
      'LBY': { lat: 26.3, lng: 17.2 },
      'JOR': { lat: 30.5, lng: 36.2 },
      'LBN': { lat: 33.8, lng: 35.8 },
      'ISR': { lat: 31.0, lng: 34.8 },
      'ARE': { lat: 23.4, lng: 53.8 },
      'QAT': { lat: 25.3, lng: 51.1 },
      'KWT': { lat: 29.3, lng: 47.4 },
      'OMN': { lat: 21.5, lng: 55.9 },
      'YEM': { lat: 15.5, lng: 48.5 },
      'SYR': { lat: 34.8, lng: 38.9 },
      'NPL': { lat: 28.3, lng: 84.1 },
      'LKA': { lat: 7.8, lng: 80.7 },
      'MMR': { lat: 21.9, lng: 95.9 },
      'KHM': { lat: 12.5, lng: 104.9 },
      'LAO': { lat: 19.8, lng: 102.4 },
      'MNG': { lat: 46.8, lng: 103.8 },
      'KAZ': { lat: 48.0, lng: 66.9 },
      'UZB': { lat: 41.3, lng: 64.5 },
      'TKM': { lat: 38.9, lng: 59.5 },
      'KGZ': { lat: 41.2, lng: 74.7 },
      'TJK': { lat: 38.8, lng: 71.2 },
      'AZE': { lat: 40.1, lng: 47.5 },
      'GEO': { lat: 42.3, lng: 43.3 },
      'ARM': { lat: 40.0, lng: 45.0 },
      'BLR': { lat: 53.7, lng: 27.9 },
      'UKR': { lat: 48.3, lng: 31.1 },
      'ROU': { lat: 45.9, lng: 24.9 },
      'BGR': { lat: 42.7, lng: 25.4 },
      'SRB': { lat: 44.0, lng: 21.0 },
      'HRV': { lat: 45.1, lng: 15.2 },
      'BIH': { lat: 43.9, lng: 17.6 },
      'ALB': { lat: 41.1, lng: 20.1 },
      'MKD': { lat: 41.6, lng: 21.7 },
      'SVN': { lat: 46.1, lng: 14.9 },
      'SVK': { lat: 48.6, lng: 19.6 },
      'CZE': { lat: 49.8, lng: 15.4 },
      'HUN': { lat: 47.1, lng: 19.5 },
      'LTU': { lat: 55.1, lng: 23.8 },
      'LVA': { lat: 56.8, lng: 24.6 },
      'EST': { lat: 58.5, lng: 25.0 },
      'LUX': { lat: 49.8, lng: 6.1 },
      'MLT': { lat: 35.9, lng: 14.3 },
      'CYP': { lat: 35.1, lng: 33.4 }
    };
    
    return centers[code] || { lat: 0, lng: 0 };
  }
}
