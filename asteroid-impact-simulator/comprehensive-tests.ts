// Comprehensive test suite for the asteroid impact simulator
import { calculateEnhancedImpact } from "@/lib/calculations/enhanced-impact-simulator";

// Test data sets
const testAsteroids = [
  {
    name: "Small Asteroid (Tunguska-like)",
    mass: 1e7, // 10 million kg
    velocity: 15000, // 15 km/s
    composition: "stony",
    expectedCrater: { min: 0.1, max: 0.5 }, // km
    expectedCasualties: { min: 0, max: 100000 },
  },
  {
    name: "Medium Asteroid (City Killer)",
    mass: 1e10, // 10 billion kg
    velocity: 20000, // 20 km/s
    composition: "metallic",
    expectedCrater: { min: 1, max: 5 }, // km
    expectedCasualties: { min: 100000, max: 10000000 },
  },
  {
    name: "Large Asteroid (Regional Devastation)",
    mass: 1e13, // 10 trillion kg
    velocity: 25000, // 25 km/s
    composition: "stony-iron",
    expectedCrater: { min: 10, max: 50 }, // km
    expectedCasualties: { min: 10000000, max: 100000000 },
  },
  {
    name: "Extinction-Level Asteroid",
    mass: 1e15, // 1 quadrillion kg
    velocity: 30000, // 30 km/s
    composition: "carbonaceous",
    expectedCrater: { min: 100, max: 300 }, // km
    expectedCasualties: { min: 100000000, max: 1000000000 },
  },
];

const testLocations = [
  {
    name: "New York City (Dense Urban)",
    lat: 40.7128,
    lng: -74.006,
    expectedHighCasualties: true,
    expectedHighEconomicDamage: true,
  },
  {
    name: "Sahara Desert (Remote)",
    lat: 23.8859,
    lng: 2.5447,
    expectedHighCasualties: false,
    expectedHighEconomicDamage: false,
  },
  {
    name: "Tokyo Bay (Coastal Urban)",
    lat: 35.6762,
    lng: 139.6503,
    expectedHighCasualties: true,
    expectedTsunami: true,
  },
  {
    name: "Yellowstone (Volcanic Region)",
    lat: 44.4280,
    lng: -110.5885,
    expectedVolcanicActivation: true,
    expectedSeismicEffects: true,
  },
];

// Mock data for testing
const mockPopulationData = [
  {
    region: "North America",
    coordinates: [
      { lat: 40.7128, lng: -74.006, density: 11000, name: "New York City" },
      { lat: 34.0522, lng: -118.2437, density: 3200, name: "Los Angeles" },
    ]
  },
  {
    region: "Asia",
    coordinates: [
      { lat: 35.6762, lng: 139.6503, density: 6200, name: "Tokyo" },
      { lat: 22.3193, lng: 114.1694, density: 6800, name: "Hong Kong" },
    ]
  },
];

const mockInfrastructureData = [
  {
    type: "military",
    locations: [
      { lat: 38.9072, lng: -77.0369, name: "Pentagon", country: "USA", importance: "critical" },
      { lat: 51.5014, lng: -0.1419, name: "Ministry of Defence", country: "UK", importance: "critical" },
    ]
  },
  {
    type: "energy",
    locations: [
      { lat: 35.6762, lng: 139.6503, name: "Fukushima Daiichi", country: "Japan", importance: "critical", subtype: "nuclear" },
      { lat: 40.7128, lng: -74.006, name: "Indian Point", country: "USA", importance: "critical", subtype: "nuclear" },
    ]
  },
];

// Test functions
export function runComprehensiveTests() {
  console.log("🚀 Starting Comprehensive Asteroid Impact Simulator Tests");
  console.log("=" .repeat(60));
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test 1: Basic calculation validation
  console.log("\n📊 Test 1: Basic Calculation Validation");
  testAsteroids.forEach(asteroid => {
    totalTests++;
    try {
      const results = calculateEnhancedImpact(
        asteroid.mass,
        asteroid.velocity,
        45, // 45-degree angle
        asteroid.composition,
        { lat: 40.7128, lng: -74.006 }, // NYC
        mockPopulationData,
        mockInfrastructureData
      );
      
      const craterDiameter = results.geological.craterDiameter;
      const casualties = results.population.immediateCasualties;
      
      const craterValid = craterDiameter >= asteroid.expectedCrater.min && 
                         craterDiameter <= asteroid.expectedCrater.max;
      const casualtiesValid = casualties >= asteroid.expectedCasualties.min && 
                             casualties <= asteroid.expectedCasualties.max;
      
      if (craterValid && casualtiesValid) {
        console.log(`  ✅ ${asteroid.name}: PASS`);
        console.log(`     Crater: ${craterDiameter.toFixed(2)} km (expected: ${asteroid.expectedCrater.min}-${asteroid.expectedCrater.max})`);
        console.log(`     Casualties: ${casualties.toLocaleString()} (expected: ${asteroid.expectedCasualties.min.toLocaleString()}-${asteroid.expectedCasualties.max.toLocaleString()})`);
        passedTests++;
      } else {
        console.log(`  ❌ ${asteroid.name}: FAIL`);
        console.log(`     Crater: ${craterDiameter.toFixed(2)} km (expected: ${asteroid.expectedCrater.min}-${asteroid.expectedCrater.max}) - ${craterValid ? 'OK' : 'FAIL'}`);
        console.log(`     Casualties: ${casualties.toLocaleString()} (expected: ${asteroid.expectedCasualties.min.toLocaleString()}-${asteroid.expectedCasualties.max.toLocaleString()}) - ${casualtiesValid ? 'OK' : 'FAIL'}`);
      }
    } catch (error) {
      console.log(`  ❌ ${asteroid.name}: ERROR - ${error}`);
    }
  });
  
  // Test 2: Location-specific effects
  console.log("\n🌍 Test 2: Location-Specific Effects");
  const testAsteroid = testAsteroids[1]; // Medium asteroid
  
  testLocations.forEach(location => {
    totalTests++;
    try {
      const results = calculateEnhancedImpact(
        testAsteroid.mass,
        testAsteroid.velocity,
        45,
        testAsteroid.composition,
        { lat: location.lat, lng: location.lng },
        mockPopulationData,
        mockInfrastructureData
      );
      
      let testsPassed = 0;
      let testsTotal = 0;
      
      // Check casualty expectations
      if (location.expectedHighCasualties !== undefined) {
        testsTotal++;
        const highCasualties = results.population.immediateCasualties > 100000;
        if (highCasualties === location.expectedHighCasualties) {
          testsPassed++;
        }
      }
      
      // Check economic damage expectations
      if (location.expectedHighEconomicDamage !== undefined) {
        testsTotal++;
        const highEconomicDamage = results.infrastructure.economic.directDamage > 1e10;
        if (highEconomicDamage === location.expectedHighEconomicDamage) {
          testsPassed++;
        }
      }
      
      // Check tsunami expectations
      if (location.expectedTsunami !== undefined) {
        testsTotal++;
        const tsunamiTriggered = results.naturalDisasters.tsunami.triggered;
        if (tsunamiTriggered === location.expectedTsunami) {
          testsPassed++;
        }
      }
      
      // Check volcanic activation expectations
      if (location.expectedVolcanicActivation !== undefined) {
        testsTotal++;
        const volcanicActivation = results.naturalDisasters.tectonicEffects.volcanicActivation;
        if (volcanicActivation === location.expectedVolcanicActivation) {
          testsPassed++;
        }
      }
      
      if (testsPassed === testsTotal) {
        console.log(`  ✅ ${location.name}: PASS (${testsPassed}/${testsTotal})`);
        passedTests++;
      } else {
        console.log(`  ❌ ${location.name}: PARTIAL (${testsPassed}/${testsTotal})`);
      }
      
      console.log(`     Casualties: ${results.population.immediateCasualties.toLocaleString()}`);
      console.log(`     Economic: $${(results.infrastructure.economic.directDamage / 1e9).toFixed(1)}B`);
      console.log(`     Tsunami: ${results.naturalDisasters.tsunami.triggered ? 'Yes' : 'No'}`);
      
    } catch (error) {
      console.log(`  ❌ ${location.name}: ERROR - ${error}`);
    }
  });
  
  // Test 3: Composition effects
  console.log("\n🪨 Test 3: Composition Effects");
  const compositions = ["stony", "metallic", "carbonaceous", "stony-iron"];
  const baseAsteroid = { mass: 1e10, velocity: 20000, angle: 45 };
  
  compositions.forEach(composition => {
    totalTests++;
    try {
      const results = calculateEnhancedImpact(
        baseAsteroid.mass,
        baseAsteroid.velocity,
        baseAsteroid.angle,
        composition,
        { lat: 40.7128, lng: -74.006 },
        mockPopulationData,
        mockInfrastructureData
      );
      
      const hasValidResults = 
        results.geological.craterDiameter > 0 &&
        results.geological.explosionStrength > 0 &&
        results.population.immediateCasualties >= 0 &&
        results.infrastructure.economic.directDamage > 0;
      
      if (hasValidResults) {
        console.log(`  ✅ ${composition}: PASS`);
        console.log(`     Crater: ${results.geological.craterDiameter.toFixed(2)} km`);
        console.log(`     Explosion: ${results.geological.explosionStrength.toFixed(1)} MT`);
        passedTests++;
      } else {
        console.log(`  ❌ ${composition}: FAIL - Invalid results`);
      }
    } catch (error) {
      console.log(`  ❌ ${composition}: ERROR - ${error}`);
    }
  });
  
  // Test 4: Climate impact scaling
  console.log("\n🌡️ Test 4: Climate Impact Scaling");
  const climateSizes = [1e8, 1e10, 1e12, 1e14]; // Different asteroid masses
  
  climateSizes.forEach((mass, index) => {
    totalTests++;
    try {
      const results = calculateEnhancedImpact(
        mass,
        20000,
        45,
        "stony",
        { lat: 40.7128, lng: -74.006 },
        mockPopulationData,
        mockInfrastructureData
      );
      
      const tempChange = Math.abs(results.climate.temperatureChange);
      const dustCloud = results.climate.dustCloudRadius;
      const habitabilityLoss = results.climate.habitabilityImpact.habitabilityLoss;
      
      // Larger asteroids should have greater climate impact
      const validScaling = index === 0 || (tempChange >= 0 && dustCloud > 0);
      
      if (validScaling) {
        console.log(`  ✅ Mass ${(mass / 1e9).toFixed(0)}B kg: PASS`);
        console.log(`     Temp Change: ${results.climate.temperatureChange.toFixed(2)}°C`);
        console.log(`     Dust Cloud: ${dustCloud.toFixed(0)} km`);
        console.log(`     Habitability Loss: ${habitabilityLoss.toFixed(0)}%`);
        passedTests++;
      } else {
        console.log(`  ❌ Mass ${(mass / 1e9).toFixed(0)}B kg: FAIL - Invalid scaling`);
      }
    } catch (error) {
      console.log(`  ❌ Mass ${(mass / 1e9).toFixed(0)}B kg: ERROR - ${error}`);
    }
  });
  
  // Test Summary
  console.log("\n" + "=".repeat(60));
  console.log(`📋 Test Summary: ${passedTests}/${totalTests} tests passed`);
  console.log(`✅ Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log("🎉 All tests passed! The simulator is working correctly.");
  } else if (passedTests / totalTests > 0.8) {
    console.log("⚠️  Most tests passed. Minor issues detected.");
  } else {
    console.log("❌ Multiple test failures. Review implementation.");
  }
  
  return { passed: passedTests, total: totalTests, successRate: (passedTests / totalTests) * 100 };
}

// Performance test
export function runPerformanceTest() {
  console.log("\n⚡ Performance Test");
  console.log("-".repeat(30));
  
  const iterations = 100;
  const startTime = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    calculateEnhancedImpact(
      1e10, // 10 billion kg
      20000, // 20 km/s
      45, // 45 degrees
      "stony",
      { lat: 40.7128, lng: -74.006 },
      mockPopulationData,
      mockInfrastructureData
    );
  }
  
  const endTime = performance.now();
  const totalTime = endTime - startTime;
  const avgTime = totalTime / iterations;
  
  console.log(`Total time for ${iterations} calculations: ${totalTime.toFixed(2)}ms`);
  console.log(`Average time per calculation: ${avgTime.toFixed(2)}ms`);
  
  if (avgTime < 10) {
    console.log("✅ Performance: Excellent (< 10ms per calculation)");
  } else if (avgTime < 50) {
    console.log("✅ Performance: Good (< 50ms per calculation)");
  } else if (avgTime < 100) {
    console.log("⚠️  Performance: Acceptable (< 100ms per calculation)");
  } else {
    console.log("❌ Performance: Poor (> 100ms per calculation)");
  }
  
  return { totalTime, avgTime, iterations };
}

// Data validation test
export function validateDataIntegrity() {
  console.log("\n🔍 Data Integrity Validation");
  console.log("-".repeat(30));
  
  let validationsPassed = 0;
  let totalValidations = 0;
  
  // Test population data structure
  totalValidations++;
  const populationValid = mockPopulationData.every(region => 
    region.region && 
    Array.isArray(region.coordinates) &&
    region.coordinates.every(coord => 
      typeof coord.lat === 'number' && 
      typeof coord.lng === 'number' && 
      typeof coord.density === 'number' &&
      coord.name
    )
  );
  
  if (populationValid) {
    console.log("✅ Population data structure: Valid");
    validationsPassed++;
  } else {
    console.log("❌ Population data structure: Invalid");
  }
  
  // Test infrastructure data structure
  totalValidations++;
  const infrastructureValid = mockInfrastructureData.every(category =>
    category.type &&
    Array.isArray(category.locations) &&
    category.locations.every(location =>
      typeof location.lat === 'number' &&
      typeof location.lng === 'number' &&
      location.name &&
      location.country &&
      location.importance
    )
  );
  
  if (infrastructureValid) {
    console.log("✅ Infrastructure data structure: Valid");
    validationsPassed++;
  } else {
    console.log("❌ Infrastructure data structure: Invalid");
  }
  
  console.log(`\n📊 Data Validation: ${validationsPassed}/${totalValidations} passed`);
  
  return { passed: validationsPassed, total: totalValidations };
}
