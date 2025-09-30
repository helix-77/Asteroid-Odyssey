// Test file for map rendering and overlay accuracy
import { describe, it, expect } from "vitest";
import {
  renderMap,
  overlayCrater,
  overlayCasualties,
  overlayInfrastructure,
  overlayClimate,
  overlayDisaster,
} from "../lib/utils/map";

const testGeoJson = require("../data/world-geojson-develop/countries/usa.json");
const testImpact = {
  location: { lat: 40, lon: -100, name: "Central USA" },
  crater: { diameter: 5, depth: 1 },
  casualties: { immediate: 10000, injured: 50000, displaced: 200000 },
  infrastructure: { economicLoss: 1e9, military: 2, civilian: 5 },
  climate: { temperatureChange: 2, habitabilityLoss: 0.3 },
  disaster: { tsunami: false, tectonic: true },
};

describe("Map Rendering", () => {
  it("should render real landmass boundaries", () => {
    const map = renderMap(testGeoJson);
    expect(map).toBeDefined();
    expect(map.landmassAccuracy).toBe(true);
  });

  it("should overlay crater at correct location and size", () => {
    const crater = overlayCrater(testImpact.location, testImpact.crater);
    expect(crater.position).toEqual([
      testImpact.location.lat,
      testImpact.location.lon,
    ]);
    expect(crater.size).toBe(testImpact.crater.diameter);
  });

  it("should overlay casualties, infrastructure, climate, and disaster layers", () => {
    expect(
      overlayCasualties(testImpact.location, testImpact.casualties)
    ).toBeDefined();
    expect(
      overlayInfrastructure(testImpact.location, testImpact.infrastructure)
    ).toBeDefined();
    expect(
      overlayClimate(testImpact.location, testImpact.climate)
    ).toBeDefined();
    expect(
      overlayDisaster(testImpact.location, testImpact.disaster)
    ).toBeDefined();
  });
});
