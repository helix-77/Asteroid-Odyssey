// Test file for data loading and parsing accuracy
import { describe, it, expect } from "vitest";
import {
  loadAsteroidData,
  loadImpactScenarios,
  loadGeoJson,
} from "../lib/data";

// Test asteroid data loading

describe("Asteroid Data Loading", () => {
  it("should load and parse asteroids.json correctly", async () => {
    const asteroids = await loadAsteroidData("data/asteroids.json");
    expect(Array.isArray(asteroids)).toBe(true);
    expect(asteroids[0]).toHaveProperty("id");
    expect(asteroids[0]).toHaveProperty("name");
  });
});

describe("Impact Scenario Data Loading", () => {
  it("should load and parse impact_scenarios.json correctly", async () => {
    const scenarios = await loadImpactScenarios("data/impact_scenarios.json");
    expect(Array.isArray(scenarios)).toBe(true);
    expect(scenarios[0]).toHaveProperty("location");
    expect(scenarios[0]).toHaveProperty("impact");
    expect(scenarios[0].impact).toHaveProperty("energy");
  });
});

describe("GeoJSON Data Loading", () => {
  it("should load and parse world geojson correctly", async () => {
    const geojson = await loadGeoJson(
      "data/world-geojson-develop/countries/usa.json"
    );
    expect(geojson).toHaveProperty("type", "FeatureCollection");
    expect(geojson.features.length).toBeGreaterThan(0);
  });
});
