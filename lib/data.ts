import { Asteroid, ImpactScenario, MapRegion } from "./types";
import { readFileSync } from "fs";
import path from "path";

/**
 * Loads asteroid data from local JSON file (Node.js for Vitest)
 */
export function loadAsteroidData(filePath: string): Asteroid[] {
  try {
    const absPath = path.resolve(process.cwd(), filePath);
    const raw = readFileSync(absPath, "utf8");
    const data = JSON.parse(raw);
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.asteroids)) return data.asteroids;
    throw new Error("Invalid asteroid data format");
  } catch (error) {
    console.error("Asteroid data loading error:", error);
    return [];
  }
}

/**
 * Loads impact scenarios from local JSON file (Node.js for Vitest)
 */
export function loadImpactScenarios(filePath: string): ImpactScenario[] {
  try {
    const absPath = path.resolve(process.cwd(), filePath);
    const raw = readFileSync(absPath, "utf8");
    const data = JSON.parse(raw);
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.scenarios)) return data.scenarios;
    throw new Error("Invalid impact scenario data format");
  } catch (error) {
    console.error("Impact scenario data loading error:", error);
    return [];
  }
}

/**
 * Loads GeoJSON map data (Node.js for Vitest)
 */
export function loadGeoJson(filePath: string): MapRegion | any {
  try {
    const absPath = path.resolve(process.cwd(), filePath);
    const raw = readFileSync(absPath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("GeoJSON loading error:", error);
    return null;
  }
}
