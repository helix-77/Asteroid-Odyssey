import { TemporalEffectsCalculator } from '../temporal-effects';
import { calculateEnhancedImpactEffects } from '../../enhanced-impact-calculator';
import type { CountryData, InfrastructurePoint } from '../types';

describe('TemporalEffectsCalculator', () => {
  const mockCountries: CountryData[] = [
    {
      name: 'United States of America',
      code: 'USA',
      population: 331900000,
      populationDensity: 36,
      habitability: 85,
      tsunamiRisk: 35,
      tectonicRisk: 45,
      gdp: 25460000000000,
      urbanization: 82.7,
      agriculturalLand: 44.5,
      forestCover: 33.9,
      waterResources: 3069,
      avgElevation: 760
    },
    {
      name: 'Japan',
      code: 'JPN',
      population: 125800000,
      populationDensity: 347,
      habitability: 82,
      tsunamiRisk: 95,
      tectonicRisk: 95,
      gdp: 4410000000000,
      urbanization: 91.8,
      agriculturalLand: 12.5,
      forestCover: 68.5,
      waterResources: 430,
      avgElevation: 438
    }
  ];

  const mockInfrastructure: InfrastructurePoint[] = [
    {
      name: 'Pentagon',
      type: 'military',
      latitude: 38.8719,
      longitude: -77.0563,
      importance: 5,
      country: 'USA'
    },
    {
      name: 'Tokyo Imperial Palace',
      type: 'military',
      latitude: 35.6852,
      longitude: 139.7528,
      importance: 4,
      country: 'Japan'
    }
  ];

  test('Pre-impact effects should show no damage', () => {
    const impactParams = {
      asteroidDiameter: 500,
      velocity: 20,
      density: 3000,
      impactAngle: 45,
      targetType: 'land' as const,
      latitude: 40.0,
      longitude: -100.0
    };

    const impactEffects = calculateEnhancedImpactEffects(impactParams);
    const calculator = new TemporalEffectsCalculator(
      impactParams,
      impactEffects,
      mockCountries,
      mockInfrastructure
    );

    const preImpact = calculator.calculateEffectsAtTime(-0.25); // 3 months before

    expect(preImpact.globalTemperature).toBe(0);
    expect(preImpact.cumulativeCasualties).toBe(0);
    expect(preImpact.atmosphericDust).toBe(0);
  });

  test('Impact moment should show immediate effects', () => {
    const impactParams = {
      asteroidDiameter: 500,
      velocity: 20,
      density: 3000,
      impactAngle: 45,
      targetType: 'land' as const,
      latitude: 40.0,
      longitude: -100.0
    };

    const impactEffects = calculateEnhancedImpactEffects(impactParams);
    const calculator = new TemporalEffectsCalculator(
      impactParams,
      impactEffects,
      mockCountries,
      mockInfrastructure
    );

    const atImpact = calculator.calculateEffectsAtTime(0);

    expect(atImpact.cumulativeCasualties).toBeGreaterThan(0);
    expect(atImpact.regionalDamage.size).toBeGreaterThan(0);
  });

  test('Post-impact effects should show climate changes', () => {
    const impactParams = {
      asteroidDiameter: 1000,
      velocity: 25,
      density: 3000,
      impactAngle: 45,
      targetType: 'land' as const,
      latitude: 40.0,
      longitude: -100.0
    };

    const impactEffects = calculateEnhancedImpactEffects(impactParams);
    const calculator = new TemporalEffectsCalculator(
      impactParams,
      impactEffects,
      mockCountries,
      mockInfrastructure
    );

    const oneYearAfter = calculator.calculateEffectsAtTime(1);

    expect(oneYearAfter.globalTemperature).toBeLessThan(0); // Cooling effect
    expect(oneYearAfter.atmosphericDust).toBeGreaterThan(0);
    expect(oneYearAfter.co2Level).toBeGreaterThan(410); // Above baseline
  });

  test('Long-term recovery should show improvement', () => {
    const impactParams = {
      asteroidDiameter: 500,
      velocity: 20,
      density: 3000,
      impactAngle: 45,
      targetType: 'land' as const,
      latitude: 40.0,
      longitude: -100.0
    };

    const impactEffects = calculateEnhancedImpactEffects(impactParams);
    const calculator = new TemporalEffectsCalculator(
      impactParams,
      impactEffects,
      mockCountries,
      mockInfrastructure
    );

    const oneYear = calculator.calculateEffectsAtTime(1);
    const tenYears = calculator.calculateEffectsAtTime(10);

    // Temperature should recover (get closer to 0)
    expect(Math.abs(tenYears.globalTemperature)).toBeLessThan(Math.abs(oneYear.globalTemperature));
    
    // Dust should settle
    expect(tenYears.atmosphericDust).toBeLessThan(oneYear.atmosphericDust);
    
    // Habitability should improve
    expect(tenYears.habitabilityIndex).toBeGreaterThan(oneYear.habitabilityIndex);
  });

  test('Infrastructure damage should be distance-dependent', () => {
    const impactParams = {
      asteroidDiameter: 500,
      velocity: 20,
      density: 3000,
      impactAngle: 45,
      targetType: 'land' as const,
      latitude: 38.8719, // Near Pentagon
      longitude: -77.0563
    };

    const impactEffects = calculateEnhancedImpactEffects(impactParams);
    const calculator = new TemporalEffectsCalculator(
      impactParams,
      impactEffects,
      mockCountries,
      mockInfrastructure
    );

    const atImpact = calculator.calculateEffectsAtTime(0);

    const pentagonDamage = atImpact.infrastructureDamage.get('Pentagon');
    const tokyoDamage = atImpact.infrastructureDamage.get('Tokyo Imperial Palace');

    expect(pentagonDamage).toBeDefined();
    expect(tokyoDamage).toBeDefined();
    
    // Pentagon should be more damaged (closer to impact)
    if (pentagonDamage && tokyoDamage) {
      expect(pentagonDamage.damageLevel).toBeGreaterThan(tokyoDamage.damageLevel);
    }
  });

  test('Regional damage should vary by distance', () => {
    const impactParams = {
      asteroidDiameter: 500,
      velocity: 20,
      density: 3000,
      impactAngle: 45,
      targetType: 'land' as const,
      latitude: 40.0,
      longitude: -100.0 // Central USA
    };

    const impactEffects = calculateEnhancedImpactEffects(impactParams);
    const calculator = new TemporalEffectsCalculator(
      impactParams,
      impactEffects,
      mockCountries,
      mockInfrastructure
    );

    const atImpact = calculator.calculateEffectsAtTime(0);

    const usaDamage = atImpact.regionalDamage.get('USA');
    const japanDamage = atImpact.regionalDamage.get('JPN');

    expect(usaDamage).toBeDefined();
    expect(japanDamage).toBeDefined();
    
    // USA should be more damaged (impact is in USA)
    if (usaDamage && japanDamage) {
      expect(usaDamage.populationLossPercent).toBeGreaterThan(japanDamage.populationLossPercent);
    }
  });
});

describe('EnhancedImpactCalculator', () => {
  test('Larger asteroids should produce more energy', () => {
    const small = calculateEnhancedImpactEffects({
      asteroidDiameter: 100,
      velocity: 20,
      density: 3000,
      impactAngle: 45,
      targetType: 'land',
      latitude: 0,
      longitude: 0
    });

    const large = calculateEnhancedImpactEffects({
      asteroidDiameter: 1000,
      velocity: 20,
      density: 3000,
      impactAngle: 45,
      targetType: 'land',
      latitude: 0,
      longitude: 0
    });

    expect(large.kineticEnergy).toBeGreaterThan(small.kineticEnergy);
    expect(large.tntEquivalent).toBeGreaterThan(small.tntEquivalent);
    expect(large.craterDiameter).toBeGreaterThan(small.craterDiameter);
  });

  test('Higher velocity should produce more energy', () => {
    const slow = calculateEnhancedImpactEffects({
      asteroidDiameter: 500,
      velocity: 15,
      density: 3000,
      impactAngle: 45,
      targetType: 'land',
      latitude: 0,
      longitude: 0
    });

    const fast = calculateEnhancedImpactEffects({
      asteroidDiameter: 500,
      velocity: 30,
      density: 3000,
      impactAngle: 45,
      targetType: 'land',
      latitude: 0,
      longitude: 0
    });

    expect(fast.kineticEnergy).toBeGreaterThan(slow.kineticEnergy);
    expect(fast.tntEquivalent).toBeGreaterThan(slow.tntEquivalent);
  });

  test('Crater dimensions should be reasonable', () => {
    const impact = calculateEnhancedImpactEffects({
      asteroidDiameter: 500,
      velocity: 20,
      density: 3000,
      impactAngle: 45,
      targetType: 'land',
      latitude: 0,
      longitude: 0
    });

    // Crater should be larger than asteroid
    expect(impact.craterDiameter).toBeGreaterThan(500);
    
    // Depth should be less than diameter
    expect(impact.craterDepth).toBeLessThan(impact.craterDiameter);
    
    // Typical depth/diameter ratio for complex craters is 0.1-0.3
    const ratio = impact.craterDepth / impact.craterDiameter;
    expect(ratio).toBeGreaterThan(0.1);
    expect(ratio).toBeLessThan(0.4);
  });
});
