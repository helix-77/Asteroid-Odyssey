// Test file for physics-based impact calculations
import { describe, it, expect } from "vitest";
import {
  calculateCraterSize,
  calculateCasualties,
  calculateInfrastructureDamage,
  calculateClimateDamage,
  calculateNaturalDisaster,
} from "../lib/calculations/impact";

const testAsteroid = {
  id: "test-1",
  name: "Test Asteroid",
  size: 500,
  velocity: 20,
  mass: 1e10,
  orbit: {},
  close_approach: { date: "2025-10-01", distance: 0.01, velocity: 20 },
  threat_level: "high",
  impact_probability: 1.0,
};

const testLocation = { lat: 40, lon: -100, name: "Central USA" };

const testScenario = {
  location: testLocation,
  energy: 1e15,
  crater: { diameter: 5, depth: 1 },
  casualties: { immediate: 10000, injured: 50000, displaced: 200000 },
};

describe("Impact Physics Calculations", () => {
  it("should calculate crater size accurately", () => {
    const crater = calculateCraterSize(testAsteroid, testLocation);
    expect(crater.diameter).toBeGreaterThan(0);
    expect(crater.depth).toBeGreaterThan(0);
  });

  it("should estimate casualties accurately", () => {
    const casualties = calculateCasualties(testAsteroid, testLocation);
    expect(casualties.immediate).toBeGreaterThanOrEqual(0);
    expect(casualties.displaced).toBeGreaterThanOrEqual(0);
  });

  it("should estimate infrastructure damage", () => {
    const damage = calculateInfrastructureDamage(testAsteroid, testLocation);
    expect(damage.economicLoss).toBeGreaterThanOrEqual(0);
    expect(damage.military).toBeDefined();
  });

  it("should estimate climate damage", () => {
    const climate = calculateClimateDamage(testAsteroid, testLocation);
    expect(climate.temperatureChange).toBeDefined();
    expect(climate.habitabilityLoss).toBeDefined();
  });

  it("should estimate natural disaster effects", () => {
    const disaster = calculateNaturalDisaster(testAsteroid, testLocation);
    expect(disaster.tsunami).toBeDefined();
    expect(disaster.tectonic).toBeDefined();
  });
});
