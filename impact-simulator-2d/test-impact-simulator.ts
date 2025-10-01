/**
 * Test file for Impact Simulator functionality
 */

import { calculateImpactEffects, calculateTimeBasedEffects } from '@/lib/calculations/impact-calculator';

// Test cases for impact calculations
export function testImpactCalculations() {
  console.log("Testing Impact Calculations...");
  
  // Test Case 1: Small asteroid impact
  const smallAsteroid = {
    asteroidDiameter: 50, // meters
    velocity: 15, // km/s
    density: 3000, // kg/m³
    impactAngle: 45, // degrees
    targetType: 'land' as const
  };
  
  const smallImpact = calculateImpactEffects(smallAsteroid);
  console.log("Small Asteroid Impact:", {
    craterDiameter: `${(smallImpact.craterDiameter / 1000).toFixed(2)} km`,
    tntEquivalent: `${smallImpact.tntEquivalent.toFixed(2)} MT`,
    casualties: smallImpact.estimatedCasualties
  });
  
  // Test Case 2: Large asteroid impact (dinosaur killer size)
  const largeAsteroid = {
    asteroidDiameter: 10000, // 10 km
    velocity: 20, // km/s
    density: 3000, // kg/m³
    impactAngle: 60, // degrees
    targetType: 'water' as const
  };
  
  const largeImpact = calculateImpactEffects(largeAsteroid);
  console.log("Large Asteroid Impact:", {
    craterDiameter: `${(largeImpact.craterDiameter / 1000).toFixed(2)} km`,
    tntEquivalent: `${(largeImpact.tntEquivalent / 1000000).toFixed(2)} million MT`,
    casualties: largeImpact.estimatedCasualties
  });
  
  // Test time-based effects
  const timeEffects = calculateTimeBasedEffects(largeImpact, 10);
  console.log("Climate Effects after 10 years:", timeEffects);
  
  return { smallImpact, largeImpact };
}

// Test data layer calculations
export function testDataLayerCalculations() {
  console.log("Testing Data Layer Calculations...");
  
  // Test population density mapping
  const testCountries = ["USA", "China", "India", "Brazil", "Russia"];
  const populationData = require('@/data/population_density.json');
  
  testCountries.forEach(country => {
    const data = populationData.find((p: any) => p.Country === country);
    if (data) {
      console.log(`${country}: ${data.Density} people/km²`);
    }
  });
}

// Test infrastructure damage assessment
export function testInfrastructureDamage(impactLat: number, impactLng: number, blastRadius: number) {
  console.log("Testing Infrastructure Damage Assessment...");
  
  const infrastructure = require('@/data/critical_infrastructure.json');
  const facilities = infrastructure.facilities || [];
  
  // Calculate distance from impact to each facility
  const damaged = facilities.filter((facility: any) => {
    const distance = calculateDistance(
      impactLat, impactLng,
      facility.latitude, facility.longitude
    );
    return distance <= blastRadius;
  });
  
  console.log(`Facilities damaged: ${damaged.length}`);
  damaged.forEach((f: any) => {
    console.log(`- ${f.name} (${f.type})`);
  });
  
  return damaged;
}

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Test timeline progression
export function testTimelineProgression() {
  console.log("Testing Timeline Progression...");
  
  const timePoints = [0, 1, 10, 50, 100]; // years
  const impact = calculateImpactEffects({
    asteroidDiameter: 1000,
    velocity: 20,
    density: 3000,
    impactAngle: 45,
    targetType: 'land'
  });
  
  timePoints.forEach(time => {
    const effects = calculateTimeBasedEffects(impact, time);
    console.log(`Year ${time}:`, {
      temperature: `${effects.temperature.toFixed(1)}°C`,
      co2: `${effects.co2Level.toFixed(0)} ppm`,
      sunlight: `${effects.sunlightReduction.toFixed(0)}% reduction`,
      habitability: `${effects.habitability.toFixed(0)}%`
    });
  });
}

// Run all tests if this file is executed directly
if (require.main === module) {
  console.log("=== Running Impact Simulator Tests ===\n");
  testImpactCalculations();
  console.log("\n");
  testDataLayerCalculations();
  console.log("\n");
  testInfrastructureDamage(40.7128, -74.0060, 100); // NYC impact
  console.log("\n");
  testTimelineProgression();
  console.log("\n=== Tests Complete ===");
}
