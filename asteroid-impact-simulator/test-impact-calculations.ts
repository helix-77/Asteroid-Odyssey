// Test file for impact calculations
import { calculateImpact, type ImpactParameters } from "@/lib/calculations/impact";

// Test asteroid data
const testAsteroid = {
  id: "test-asteroid",
  name: "Test Asteroid",
  size: 150, // meters
  velocity: 20, // km/s
  mass: 1.5e10, // kg
  composition: "stony",
  threat_level: "high",
  impact_probability: 0.001,
};

// Test location data (New York City)
const testLocation = {
  lat: 40.7128,
  lng: -74.006,
  name: "New York City",
  region: "North America",
  populationDensity: 11000, // people per km²
  totalPopulation: 8500000,
};

// Test impact parameters
const testImpactParams: ImpactParameters = {
  asteroidMass: testAsteroid.mass,
  velocity: testAsteroid.velocity * 1000, // Convert to m/s
  angle: 45, // degrees
  density: 2700, // kg/m³ for stony composition
  diameter: testAsteroid.size,
  composition: testAsteroid.composition,
};

// Test location parameters
const testLocationParams = {
  populationDensity: testLocation.populationDensity,
  totalPopulation: testLocation.totalPopulation,
  gdpPerCapita: 65000,
  infrastructureValue: 1e12,
};

// Run test calculation
export function runImpactTest() {
  console.log("Running impact calculation test...");
  console.log("Test Asteroid:", testAsteroid);
  console.log("Test Location:", testLocation);
  
  const results = calculateImpact(testImpactParams, testLocationParams);
  
  console.log("Impact Results:");
  console.log("- Kinetic Energy:", (results.kineticEnergy / 1e15).toFixed(2), "PJ");
  console.log("- TNT Equivalent:", results.tntEquivalent.toFixed(1), "kilotons");
  console.log("- Crater Diameter:", (results.crater.diameter / 1000).toFixed(2), "km");
  console.log("- Crater Depth:", results.crater.depth.toFixed(0), "m");
  console.log("- Fireball Radius:", results.effects.fireballRadius.toFixed(2), "km");
  console.log("- Airblast Radius:", results.effects.airblastRadius.toFixed(2), "km");
  console.log("- Thermal Radiation:", results.effects.thermalRadiation.toFixed(2), "km");
  console.log("- Seismic Magnitude:", results.effects.seismicMagnitude.toFixed(1));
  console.log("- Immediate Casualties:", results.casualties.immediate.toLocaleString());
  console.log("- Injured:", results.casualties.injured.toLocaleString());
  console.log("- Displaced:", results.casualties.displaced.toLocaleString());
  console.log("- Economic Impact:", "$" + (results.economicImpact / 1e9).toFixed(1) + "B");
  
  return results;
}

// Validate calculation results
export function validateResults(results: any) {
  const validations = [
    { name: "Kinetic Energy", value: results.kineticEnergy, min: 1e12, max: 1e18 },
    { name: "TNT Equivalent", value: results.tntEquivalent, min: 1, max: 1e6 },
    { name: "Crater Diameter", value: results.crater.diameter, min: 100, max: 50000 },
    { name: "Crater Depth", value: results.crater.depth, min: 10, max: 5000 },
    { name: "Fireball Radius", value: results.effects.fireballRadius, min: 0.1, max: 100 },
    { name: "Airblast Radius", value: results.effects.airblastRadius, min: 1, max: 1000 },
    { name: "Casualties", value: results.casualties.immediate, min: 0, max: 50000000 },
    { name: "Economic Impact", value: results.economicImpact, min: 1e6, max: 1e15 },
  ];
  
  console.log("\nValidation Results:");
  validations.forEach(validation => {
    const isValid = validation.value >= validation.min && validation.value <= validation.max;
    console.log(`- ${validation.name}: ${isValid ? "✓" : "✗"} (${validation.value})`);
  });
}

// Test different asteroid sizes
export function testAsteroidSizes() {
  console.log("\nTesting different asteroid sizes:");
  
  const sizes = [50, 100, 200, 500, 1000]; // meters
  
  sizes.forEach(size => {
    const params = {
      ...testImpactParams,
      asteroidMass: (4/3) * Math.PI * Math.pow(size/2, 3) * 2700, // Calculate mass from size
      diameter: size,
    };
    
    const results = calculateImpact(params, testLocationParams);
    
    console.log(`Size ${size}m:`);
    console.log(`  - TNT Equivalent: ${results.tntEquivalent.toFixed(1)} kt`);
    console.log(`  - Crater: ${(results.crater.diameter / 1000).toFixed(2)} km`);
    console.log(`  - Casualties: ${results.casualties.immediate.toLocaleString()}`);
  });
}
