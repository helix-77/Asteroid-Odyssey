import { Asteroid } from "../types";

// Unified asteroid data interface that extends the base Asteroid type
export interface UnifiedAsteroidData extends Asteroid {
  source: "local" | "nasa";
  dataCompleteness: number; // 0-1 score indicating how complete the data is
  estimatedFields: string[]; // List of fields that are estimated vs. measured
  impactProbability?: number;
  closeApproach?: {
    date: string;
    distance: number; // AU
    velocity: number; // km/s
  };
  absoluteMagnitude?: number;
}

// Raw data interfaces for parsing
interface LocalAsteroidData {
  id: string;
  name: string;
  size: number; // diameter in meters
  velocity: number; // km/s
  mass: number; // kg
  composition: string;
  threat_level: string;
  impact_probability?: number;
  discovery_date?: string;
  absolute_magnitude?: number;
  orbit?: {
    semi_major_axis: number;
    eccentricity: number;
    inclination: number;
    ascending_node: number;
    perihelion: number;
    mean_anomaly: number;
  };
  close_approach?: {
    date: string;
    distance: number;
    velocity: number;
  };
}

interface NASAAsteroidData {
  name: string;
  neo_reference_id: string;
  absolute_magnitude_h: number;
  is_potentially_hazardous_asteroid: boolean;
  est_diameter_min_m: number;
  est_diameter_max_m: number;
  closest_approach_date: string;
  miss_distance_km: string;
  relative_velocity_km_s: string;
  orbiting_body: string;
}

// Composition-based density mapping (kg/m³)
const COMPOSITION_DENSITIES: Record<string, number> = {
  stony: 2700,
  metallic: 7800,
  carbonaceous: 1300,
  "stony-iron": 5200,
  basaltic: 2900,
  unknown: 2500, // Default average
};

// Threat level mapping for NASA data
const getThreatLevel = (
  isPotentiallyHazardous: boolean,
  diameter: number
): Asteroid["threatLevel"] => {
  if (!isPotentiallyHazardous) return "low";
  if (diameter > 1000) return "critical";
  if (diameter > 500) return "high";
  return "medium";
};

// Calculate mass from diameter and composition
const calculateMass = (diameter: number, composition: string): number => {
  const density =
    COMPOSITION_DENSITIES[composition.toLowerCase()] ||
    COMPOSITION_DENSITIES.unknown;
  const radius = diameter / 2;
  const volume = (4 / 3) * Math.PI * Math.pow(radius, 3);
  return volume * density;
};

// Data completeness scoring
const calculateDataCompleteness = (
  asteroid: Partial<UnifiedAsteroidData>
): number => {
  const requiredFields = [
    "id",
    "name",
    "diameter",
    "mass",
    "velocity",
    "composition",
  ];
  const optionalFields = [
    "orbitalElements",
    "closeApproach",
    "absoluteMagnitude",
    "impactProbability",
  ];

  let score = 0;
  let totalWeight = 0;

  // Required fields (weight: 0.8)
  requiredFields.forEach((field) => {
    totalWeight += 0.8;
    if (asteroid[field as keyof UnifiedAsteroidData] !== undefined) {
      score += 0.8;
    }
  });

  // Optional fields (weight: 0.2)
  optionalFields.forEach((field) => {
    totalWeight += 0.2;
    if (asteroid[field as keyof UnifiedAsteroidData] !== undefined) {
      score += 0.2;
    }
  });

  return Math.min(score / totalWeight, 1);
};

// Error types for better error handling
export enum AsteroidDataError {
  NETWORK_ERROR = "NETWORK_ERROR",
  PARSE_ERROR = "PARSE_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  FILE_NOT_FOUND = "FILE_NOT_FOUND",
  INSUFFICIENT_DATA = "INSUFFICIENT_DATA",
  CALCULATION_ERROR = "CALCULATION_ERROR",
}

export interface AsteroidDataException extends Error {
  type: AsteroidDataError;
  details?: any;
  recoverable: boolean;
}

// Create typed error
function createAsteroidError(
  type: AsteroidDataError,
  message: string,
  details?: any,
  recoverable = true
): AsteroidDataException {
  const error = new Error(message) as AsteroidDataException;
  error.type = type;
  error.details = details;
  error.recoverable = recoverable;
  return error;
}

// Logging utility
function logError(context: string, error: any, details?: any) {
  const timestamp = new Date().toISOString();
  const safePayload = {
    message: error?.message ?? String(error),
    stack: error?.stack ?? undefined,
    type: (error && (error as any).type) || "UNKNOWN",
    details: details ?? undefined,
  };
  try {
    console.error(
      `[${timestamp}] Asteroid Data Manager - ${context}:`,
      safePayload
    );
  } catch {
    console.error(
      `[${timestamp}] Asteroid Data Manager - ${context}:`,
      `${safePayload.type}: ${safePayload.message}`
    );
  }
}

function logWarning(context: string, message: string, details?: any) {
  const timestamp = new Date().toISOString();
  const safePayload = {
    message,
    details: details ?? undefined,
  };
  try {
    console.warn(
      `[${timestamp}] Asteroid Data Manager - ${context}:`,
      safePayload
    );
  } catch {
    console.warn(`[${timestamp}] Asteroid Data Manager - ${context}:`, message);
  }
}

function logInfo(context: string, message: string, details?: any) {
  const timestamp = new Date().toISOString();
  const safePayload = {
    message,
    details: details ?? undefined,
  };
  try {
    console.info(
      `[${timestamp}] Asteroid Data Manager - ${context}:`,
      safePayload
    );
  } catch {
    console.info(`[${timestamp}] Asteroid Data Manager - ${context}:`, message);
  }
}

function getErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in (err as any)) {
    return String((err as any).message);
  }
  return String(err);
}

class AsteroidDataManager {
  private asteroids: Map<string, UnifiedAsteroidData> = new Map();
  private isLoaded = false;
  private loadingPromise: Promise<void> | null = null;
  private loadErrors: AsteroidDataException[] = [];
  private fallbackData: UnifiedAsteroidData[] = [];

  /**
   * Load and merge asteroid data from both local and NASA sources
   * Implements graceful degradation and fallback strategies
   */
  async loadAsteroidData(): Promise<void> {
    if (this.isLoaded) return;
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = this._performDataLoad();

    try {
      await this.loadingPromise;
      this.isLoaded = true;
      logInfo(
        "Data Loading",
        `Successfully loaded ${this.asteroids.size} asteroids`
      );
    } catch (error) {
      logError("Data Loading", error);
      // Even if loading fails, mark as loaded to prevent infinite retries
      this.isLoaded = true;

      // If we have no data at all, create minimal fallback data
      if (this.asteroids.size === 0) {
        this._createFallbackData();
        logWarning(
          "Data Loading",
          "Using fallback data due to complete loading failure"
        );
      }
    }
  }

  private async _performDataLoad(): Promise<void> {
    const loadResults = {
      local: {
        success: false,
        count: 0,
        errors: [] as AsteroidDataException[],
      },
      nasa: { success: false, count: 0, errors: [] as AsteroidDataException[] },
    };

    // Load local asteroid data with error handling
    try {
      const localCount = await this._loadLocalData();
      loadResults.local = { success: true, count: localCount, errors: [] };
      logInfo("Local Data", `Loaded ${localCount} asteroids from local data`);
    } catch (error: unknown) {
      const asteroidError =
        error instanceof Error && "type" in error
          ? (error as AsteroidDataException)
          : createAsteroidError(
              AsteroidDataError.NETWORK_ERROR,
              "Failed to load local data",
              error
            );

      loadResults.local.errors.push(asteroidError);
      this.loadErrors.push(asteroidError);
      logError("Local Data", asteroidError);
    }

    // Load NASA NEO sample data with error handling
    try {
      const nasaCount = await this._loadNASAData();
      loadResults.nasa = { success: true, count: nasaCount, errors: [] };
      logInfo("NASA Data", `Loaded ${nasaCount} asteroids from NASA data`);
    } catch (error: unknown) {
      const asteroidError =
        error instanceof Error && "type" in error
          ? (error as AsteroidDataException)
          : createAsteroidError(
              AsteroidDataError.NETWORK_ERROR,
              "Failed to load NASA data",
              error
            );

      loadResults.nasa.errors.push(asteroidError);
      this.loadErrors.push(asteroidError);
      logError("NASA Data", asteroidError);
    }

    // Check if we have any data at all
    if (this.asteroids.size === 0) {
      const totalErrors = [
        ...loadResults.local.errors,
        ...loadResults.nasa.errors,
      ];
      throw createAsteroidError(
        AsteroidDataError.INSUFFICIENT_DATA,
        "No asteroid data could be loaded from any source",
        { loadResults, errors: totalErrors },
        false
      );
    }

    // Log summary
    logInfo(
      "Data Loading Summary",
      `Total: ${this.asteroids.size} asteroids loaded. ` +
        `Local: ${
          loadResults.local.success ? loadResults.local.count : "failed"
        }, ` +
        `NASA: ${loadResults.nasa.success ? loadResults.nasa.count : "failed"}`
    );
  }

  private async _loadLocalData(): Promise<number> {
    let loadedCount = 0;
    let skippedCount = 0;
    const errors: Array<{ id: string; error: any }> = [];

    try {
      const response = await fetch("/api/asteroids");
      if (!response.ok) {
        if (response.status === 404) {
          throw createAsteroidError(
            AsteroidDataError.FILE_NOT_FOUND,
            "Local asteroid data file not found",
            { status: response.status, url: "/data/asteroids.json" }
          );
        } else {
          throw createAsteroidError(
            AsteroidDataError.NETWORK_ERROR,
            `Failed to load asteroids.json: ${response.statusText}`,
            { status: response.status, statusText: response.statusText }
          );
        }
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw createAsteroidError(
          AsteroidDataError.PARSE_ERROR,
          "Failed to parse local asteroid data as JSON",
          parseError
        );
      }

      if (!data || !Array.isArray(data.asteroids)) {
        throw createAsteroidError(
          AsteroidDataError.VALIDATION_ERROR,
          "Invalid local asteroid data format - expected { asteroids: [] }",
          { receivedType: typeof data, hasAsteroids: !!data?.asteroids }
        );
      }

      const localAsteroids = data.asteroids as LocalAsteroidData[];

      localAsteroids.forEach((asteroid, index) => {
        try {
          // Validate required fields
          if (!asteroid.id || !asteroid.name) {
            throw new Error(
              `Missing required fields (id or name) at index ${index}`
            );
          }

          const unified = this._normalizeLocalAsteroid(asteroid);
          const validation = this.validateAsteroidData(unified);

          if (!validation.isValid) {
            logWarning(
              "Local Data Validation",
              `Asteroid ${
                asteroid.id
              } has validation issues: ${validation.errors.join(", ")}`
            );
            // Still add it but mark as low quality
            unified.dataCompleteness = Math.min(unified.dataCompleteness, 0.3);
          }

          this.asteroids.set(unified.id, unified);
          loadedCount++;
        } catch (error) {
          errors.push({ id: asteroid.id || `index-${index}`, error });
          skippedCount++;
          logWarning(
            "Local Data Processing",
            `Skipped asteroid ${
              asteroid.id || `index-${index}`
            }: ${getErrorMessage(error)}`
          );
        }
      });

      if (errors.length > 0) {
        logWarning(
          "Local Data",
          `Processed ${loadedCount} asteroids, skipped ${skippedCount} due to errors`
        );
      }

      return loadedCount;
    } catch (error: unknown) {
      // Re-throw typed errors, wrap others
      if (error && typeof error === "object" && "type" in (error as any)) {
        throw error as Error;
      }
      const details =
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : { value: String(error) };
      throw createAsteroidError(
        AsteroidDataError.NETWORK_ERROR,
        "Unexpected error loading local asteroid data",
        details
      );
    }
  }

  private async _loadNASAData(): Promise<number> {
    let loadedCount = 0;
    let skippedCount = 0;
    const errors: Array<{ id: string; error: any }> = [];

    try {
      const response = await fetch("/api/neo-sample");
      if (!response.ok) {
        if (response.status === 404) {
          throw createAsteroidError(
            AsteroidDataError.FILE_NOT_FOUND,
            "NASA asteroid data file not found",
            { status: response.status, url: "/data/neo_sample.json" }
          );
        } else {
          throw createAsteroidError(
            AsteroidDataError.NETWORK_ERROR,
            `Failed to load neo_sample.json: ${response.statusText}`,
            { status: response.status, statusText: response.statusText }
          );
        }
      }

      let nasaAsteroids;
      try {
        nasaAsteroids = (await response.json()) as NASAAsteroidData[];
      } catch (parseError) {
        throw createAsteroidError(
          AsteroidDataError.PARSE_ERROR,
          "Failed to parse NASA asteroid data as JSON",
          parseError
        );
      }

      if (!Array.isArray(nasaAsteroids)) {
        throw createAsteroidError(
          AsteroidDataError.VALIDATION_ERROR,
          "Invalid NASA asteroid data format - expected array",
          { receivedType: typeof nasaAsteroids }
        );
      }

      // Limit NASA data to prevent overwhelming the interface
      const limitedData = nasaAsteroids.slice(0, 50);

      limitedData.forEach((asteroid, index) => {
        try {
          // Validate required NASA fields
          if (!asteroid.neo_reference_id || !asteroid.name) {
            throw new Error(`Missing required NASA fields at index ${index}`);
          }

          const unified = this._normalizeNASAAsteroid(asteroid);

          // Only add if we don't already have this asteroid from local data
          if (!this.asteroids.has(unified.id)) {
            const validation = this.validateAsteroidData(unified);

            if (!validation.isValid) {
              logWarning(
                "NASA Data Validation",
                `Asteroid ${
                  asteroid.neo_reference_id
                } has validation issues: ${validation.errors.join(", ")}`
              );
              // Still add it but mark as low quality
              unified.dataCompleteness = Math.min(
                unified.dataCompleteness,
                0.4
              );
            }

            this.asteroids.set(unified.id, unified);
            loadedCount++;
          } else {
            skippedCount++; // Already exists from local data
          }
        } catch (error) {
          errors.push({
            id: asteroid.neo_reference_id || `nasa-index-${index}`,
            error,
          });
          skippedCount++;
          logWarning(
            "NASA Data Processing",
            `Skipped NASA asteroid ${
              asteroid.neo_reference_id || `index-${index}`
            }: ${getErrorMessage(error)}`
          );
        }
      });

      if (errors.length > 0 || skippedCount > 0) {
        logWarning(
          "NASA Data",
          `Processed ${loadedCount} new asteroids, skipped ${skippedCount} (${
            errors.length
          } errors, ${skippedCount - errors.length} duplicates)`
        );
      }

      return loadedCount;
    } catch (error: unknown) {
      // Re-throw typed errors, wrap others
      if (error && typeof error === "object" && "type" in (error as any)) {
        throw error as Error;
      }
      const details =
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : { value: String(error) };
      throw createAsteroidError(
        AsteroidDataError.NETWORK_ERROR,
        "Unexpected error loading NASA asteroid data",
        details
      );
    }
  }

  private _normalizeLocalAsteroid(
    asteroid: LocalAsteroidData
  ): UnifiedAsteroidData {
    const estimatedFields: string[] = [];

    try {
      // Validate required fields
      if (!asteroid.id || !asteroid.name) {
        throw createAsteroidError(
          AsteroidDataError.VALIDATION_ERROR,
          "Missing required fields in local asteroid data",
          { id: asteroid.id, name: asteroid.name }
        );
      }

      // Validate and normalize numeric fields with fallbacks
      let diameter = asteroid.size;
      if (!diameter || diameter <= 0) {
        logWarning(
          "Local Normalization",
          `Invalid diameter for ${asteroid.id}, using default`
        );
        diameter = 100; // Default 100m
        estimatedFields.push("diameter");
      }

      let mass = asteroid.mass;
      if (!mass || mass <= 0) {
        // Calculate mass from diameter and composition
        const density =
          COMPOSITION_DENSITIES[asteroid.composition?.toLowerCase()] ||
          COMPOSITION_DENSITIES.unknown;
        const radius = diameter / 2;
        const volume = (4 / 3) * Math.PI * Math.pow(radius, 3);
        mass = volume * density;
        estimatedFields.push("mass");
        logWarning(
          "Local Normalization",
          `Calculated mass for ${asteroid.id} from diameter and composition`
        );
      }

      let velocity = asteroid.velocity;
      if (!velocity || velocity <= 0) {
        logWarning(
          "Local Normalization",
          `Invalid velocity for ${asteroid.id}, using default`
        );
        velocity = 15.0; // Default 15 km/s
        estimatedFields.push("velocity");
      }

      // Normalize composition
      let composition = asteroid.composition?.toLowerCase() || "unknown";
      if (!COMPOSITION_DENSITIES[composition]) {
        logWarning(
          "Local Normalization",
          `Unknown composition '${asteroid.composition}' for ${asteroid.id}, using 'unknown'`
        );
        composition = "unknown";
        estimatedFields.push("composition");
      }

      // Calculate density from composition
      const density = COMPOSITION_DENSITIES[composition];
      if (composition === "unknown" || !asteroid.composition) {
        estimatedFields.push("density");
      }

      // Normalize threat level
      let threatLevel =
        asteroid.threat_level?.toLowerCase() as Asteroid["threatLevel"];
      const validThreatLevels = ["low", "medium", "high", "critical"];
      if (!threatLevel || !validThreatLevels.includes(threatLevel)) {
        logWarning(
          "Local Normalization",
          `Invalid threat level '${asteroid.threat_level}' for ${asteroid.id}, using 'medium'`
        );
        threatLevel = "medium";
        estimatedFields.push("threatLevel");
      }

      const unified: UnifiedAsteroidData = {
        id: asteroid.id,
        name: asteroid.name,
        diameter,
        mass,
        density,
        composition,
        velocity,
        threatLevel,
        discoveryDate: asteroid.discovery_date || "Unknown",
        nextApproach: asteroid.close_approach?.date || "Unknown",
        minDistance: asteroid.close_approach?.distance || 0,
        orbitalElements: asteroid.orbit
          ? {
              semiMajorAxis: asteroid.orbit.semi_major_axis || 1.0,
              eccentricity: asteroid.orbit.eccentricity || 0.1,
              inclination: asteroid.orbit.inclination || 0,
              longitudeOfAscendingNode: asteroid.orbit.ascending_node || 0,
              argumentOfPeriapsis: asteroid.orbit.perihelion || 0,
              meanAnomaly: asteroid.orbit.mean_anomaly || 0,
            }
          : {
              semiMajorAxis: 1.0,
              eccentricity: 0.1,
              inclination: 0,
              longitudeOfAscendingNode: 0,
              argumentOfPeriapsis: 0,
              meanAnomaly: 0,
            },
        source: "local",
        dataCompleteness: 0, // Will be calculated below
        estimatedFields,
        impactProbability: asteroid.impact_probability,
        closeApproach: asteroid.close_approach
          ? {
              date: asteroid.close_approach.date,
              distance: asteroid.close_approach.distance,
              velocity: asteroid.close_approach.velocity,
            }
          : undefined,
        absoluteMagnitude: asteroid.absolute_magnitude,
      };

      // Add estimated orbital elements to estimated fields if not provided
      if (!asteroid.orbit) {
        estimatedFields.push("orbitalElements");
      }

      unified.dataCompleteness = calculateDataCompleteness(unified);

      return unified;
    } catch (error) {
      if (error instanceof Error && "type" in error) {
        throw error;
      }
      throw createAsteroidError(
        AsteroidDataError.VALIDATION_ERROR,
        `Failed to normalize local asteroid data for ${asteroid.id}`,
        error
      );
    }
  }

  private _normalizeNASAAsteroid(
    asteroid: NASAAsteroidData
  ): UnifiedAsteroidData {
    const estimatedFields: string[] = [];

    try {
      // Validate required fields
      if (!asteroid.neo_reference_id || !asteroid.name) {
        throw createAsteroidError(
          AsteroidDataError.VALIDATION_ERROR,
          "Missing required fields in NASA asteroid data",
          { id: asteroid.neo_reference_id, name: asteroid.name }
        );
      }

      // Calculate average diameter with validation
      let diameter = 0;
      if (asteroid.est_diameter_min_m && asteroid.est_diameter_max_m) {
        diameter =
          (asteroid.est_diameter_min_m + asteroid.est_diameter_max_m) / 2;
        estimatedFields.push("diameter"); // NASA diameters are estimates
      } else {
        logWarning(
          "NASA Normalization",
          `Missing diameter data for ${asteroid.neo_reference_id}, using default`
        );
        diameter = 100; // Default 100m
        estimatedFields.push("diameter");
      }

      if (diameter <= 0) {
        logWarning(
          "NASA Normalization",
          `Invalid diameter for ${asteroid.neo_reference_id}, using default`
        );
        diameter = 100;
      }

      // Estimate composition (NASA data doesn't include this)
      const composition = "stony"; // Default assumption for NEOs
      estimatedFields.push("composition");

      // Calculate mass from estimated diameter and composition
      const mass = calculateMass(diameter, composition);
      estimatedFields.push("mass");

      const density = COMPOSITION_DENSITIES[composition];
      estimatedFields.push("density");

      // Parse and validate velocity
      let velocity = 0;
      try {
        velocity = parseFloat(asteroid.relative_velocity_km_s);
        if (isNaN(velocity) || velocity <= 0) {
          throw new Error("Invalid velocity value");
        }
      } catch (error) {
        logWarning(
          "NASA Normalization",
          `Invalid velocity for ${asteroid.neo_reference_id}, using default`
        );
        velocity = 15.0; // Default 15 km/s
        estimatedFields.push("velocity");
      }

      const threatLevel = getThreatLevel(
        asteroid.is_potentially_hazardous_asteroid,
        diameter
      );

      // Parse and validate miss distance
      let minDistance = 0;
      try {
        const missDistanceKm = parseFloat(asteroid.miss_distance_km);
        if (!isNaN(missDistanceKm)) {
          minDistance = missDistanceKm / 149597870.7; // Convert km to AU
        }
      } catch (error) {
        logWarning(
          "NASA Normalization",
          `Invalid miss distance for ${asteroid.neo_reference_id}`
        );
        estimatedFields.push("minDistance");
      }

      const unified: UnifiedAsteroidData = {
        id: asteroid.neo_reference_id,
        name: asteroid.name,
        diameter,
        mass,
        density,
        composition,
        velocity,
        threatLevel,
        discoveryDate: "Unknown",
        nextApproach: asteroid.closest_approach_date || "Unknown",
        minDistance,
        orbitalElements: {
          // NASA sample doesn't include orbital elements, use defaults
          semiMajorAxis: 1.0,
          eccentricity: 0.1,
          inclination: 0,
          longitudeOfAscendingNode: 0,
          argumentOfPeriapsis: 0,
          meanAnomaly: 0,
        },
        source: "nasa",
        dataCompleteness: 0, // Will be calculated below
        estimatedFields,
        impactProbability: asteroid.is_potentially_hazardous_asteroid
          ? 0.001
          : 0.0001,
        closeApproach: {
          date: asteroid.closest_approach_date || "Unknown",
          distance: minDistance,
          velocity,
        },
        absoluteMagnitude: asteroid.absolute_magnitude_h || undefined,
      };

      // Mark orbital elements as estimated since NASA sample doesn't provide them
      estimatedFields.push("orbitalElements", "impactProbability");

      unified.dataCompleteness = calculateDataCompleteness(unified);

      return unified;
    } catch (error) {
      if (error instanceof Error && "type" in error) {
        throw error;
      }
      throw createAsteroidError(
        AsteroidDataError.VALIDATION_ERROR,
        `Failed to normalize NASA asteroid data for ${asteroid.neo_reference_id}`,
        error
      );
    }
  }

  /**
   * Create minimal fallback data when all loading fails
   */
  private _createFallbackData(): void {
    const fallbackAsteroids: UnifiedAsteroidData[] = [
      {
        id: "fallback-apophis",
        name: "99942 Apophis (Fallback)",
        diameter: 370,
        mass: 6.1e10,
        density: 2600,
        composition: "stony",
        velocity: 7.42,
        threatLevel: "medium",
        discoveryDate: "2004",
        nextApproach: "2029-04-13",
        minDistance: 0.000255,
        orbitalElements: {
          semiMajorAxis: 0.922,
          eccentricity: 0.191,
          inclination: 3.33,
          longitudeOfAscendingNode: 204.4,
          argumentOfPeriapsis: 126.4,
          meanAnomaly: 0,
        },
        source: "local",
        dataCompleteness: 0.9,
        estimatedFields: [],
        impactProbability: 0.000027,
      },
      {
        id: "fallback-bennu",
        name: "101955 Bennu (Fallback)",
        diameter: 492,
        mass: 7.8e10,
        density: 1190,
        composition: "carbonaceous",
        velocity: 6.14,
        threatLevel: "low",
        discoveryDate: "1999",
        nextApproach: "2135-09-25",
        minDistance: 0.002,
        orbitalElements: {
          semiMajorAxis: 1.126,
          eccentricity: 0.204,
          inclination: 6.03,
          longitudeOfAscendingNode: 2.06,
          argumentOfPeriapsis: 66.2,
          meanAnomaly: 0,
        },
        source: "local",
        dataCompleteness: 0.95,
        estimatedFields: [],
        impactProbability: 0.000037,
      },
      {
        id: "fallback-demo",
        name: "Demo Asteroid (Fallback)",
        diameter: 150,
        mass: 2.5e9,
        density: 2500,
        composition: "unknown",
        velocity: 15.5,
        threatLevel: "medium",
        discoveryDate: "Unknown",
        nextApproach: "Unknown",
        minDistance: 0.05,
        orbitalElements: {
          semiMajorAxis: 1.0,
          eccentricity: 0.1,
          inclination: 0,
          longitudeOfAscendingNode: 0,
          argumentOfPeriapsis: 0,
          meanAnomaly: 0,
        },
        source: "local",
        dataCompleteness: 0.6,
        estimatedFields: ["composition", "mass", "orbitalElements"],
        impactProbability: 0.0001,
      },
    ];

    fallbackAsteroids.forEach((asteroid) => {
      this.asteroids.set(asteroid.id, asteroid);
    });

    this.fallbackData = fallbackAsteroids;
    logWarning(
      "Fallback Data",
      `Created ${fallbackAsteroids.length} fallback asteroids`
    );
  }

  /**
   * Get all available asteroids with error handling
   */
  async getAllAsteroids(): Promise<UnifiedAsteroidData[]> {
    try {
      await this.loadAsteroidData();

      if (this.asteroids.size === 0) {
        logWarning(
          "Get All Asteroids",
          "No asteroids available, returning empty array"
        );
        return [];
      }

      return Array.from(this.asteroids.values()).sort((a, b) => {
        // Sort by data completeness first, then by threat level
        if (a.dataCompleteness !== b.dataCompleteness) {
          return b.dataCompleteness - a.dataCompleteness;
        }
        const threatOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return threatOrder[b.threatLevel] - threatOrder[a.threatLevel];
      });
    } catch (error) {
      logError("Get All Asteroids", error);
      // Return fallback data if available
      if (this.fallbackData.length > 0) {
        logInfo("Get All Asteroids", "Returning fallback data due to error");
        return this.fallbackData;
      }
      return [];
    }
  }

  /**
   * Get asteroid by ID with error handling and fallbacks
   */
  async getAsteroidById(id: string): Promise<UnifiedAsteroidData | null> {
    try {
      if (!id || typeof id !== "string") {
        logWarning("Get Asteroid By ID", `Invalid ID provided: ${id}`);
        return null;
      }

      await this.loadAsteroidData();
      const asteroid = this.asteroids.get(id);

      if (!asteroid) {
        logWarning("Get Asteroid By ID", `Asteroid not found: ${id}`);
        return null;
      }

      // Validate the asteroid data before returning
      const validation = this.validateAsteroidData(asteroid);
      if (!validation.isValid) {
        logWarning(
          "Get Asteroid By ID",
          `Asteroid ${id} has validation issues: ${validation.errors.join(
            ", "
          )}`
        );
        // Return it anyway but log the issues
      }

      return asteroid;
    } catch (error) {
      logError("Get Asteroid By ID", error, { requestedId: id });
      return null;
    }
  }

  /**
   * Get asteroids filtered by criteria
   */
  async getAsteroidsByFilter(filter: {
    threatLevel?: Asteroid["threatLevel"];
    source?: "local" | "nasa";
    minDataCompleteness?: number;
  }): Promise<UnifiedAsteroidData[]> {
    const allAsteroids = await this.getAllAsteroids();

    return allAsteroids.filter((asteroid) => {
      if (filter.threatLevel && asteroid.threatLevel !== filter.threatLevel) {
        return false;
      }
      if (filter.source && asteroid.source !== filter.source) {
        return false;
      }
      if (
        filter.minDataCompleteness &&
        asteroid.dataCompleteness < filter.minDataCompleteness
      ) {
        return false;
      }
      return true;
    });
  }

  /**
   * Get data source statistics
   */
  async getDataStats(): Promise<{
    total: number;
    bySource: Record<string, number>;
    byThreatLevel: Record<string, number>;
    averageCompleteness: number;
  }> {
    const allAsteroids = await this.getAllAsteroids();

    const stats = {
      total: allAsteroids.length,
      bySource: { local: 0, nasa: 0 },
      byThreatLevel: { low: 0, medium: 0, high: 0, critical: 0 },
      averageCompleteness: 0,
    };

    let totalCompleteness = 0;

    allAsteroids.forEach((asteroid) => {
      stats.bySource[asteroid.source]++;
      stats.byThreatLevel[asteroid.threatLevel]++;
      totalCompleteness += asteroid.dataCompleteness;
    });

    stats.averageCompleteness =
      allAsteroids.length > 0 ? totalCompleteness / allAsteroids.length : 0;

    return stats;
  }

  /**
   * Get loading errors and data quality information
   */
  getDataQualityReport(): {
    loadErrors: AsteroidDataException[];
    totalAsteroids: number;
    dataSourceBreakdown: { local: number; nasa: number; fallback: number };
    averageCompleteness: number;
    lowQualityCount: number;
    hasErrors: boolean;
  } {
    const asteroids = Array.from(this.asteroids.values());
    const sourceBreakdown = { local: 0, nasa: 0, fallback: 0 };
    let totalCompleteness = 0;
    let lowQualityCount = 0;

    asteroids.forEach((asteroid) => {
      if (this.fallbackData.some((f) => f.id === asteroid.id)) {
        sourceBreakdown.fallback++;
      } else {
        sourceBreakdown[asteroid.source]++;
      }

      totalCompleteness += asteroid.dataCompleteness;
      if (asteroid.dataCompleteness < 0.5) {
        lowQualityCount++;
      }
    });

    return {
      loadErrors: this.loadErrors,
      totalAsteroids: asteroids.length,
      dataSourceBreakdown: sourceBreakdown,
      averageCompleteness:
        asteroids.length > 0 ? totalCompleteness / asteroids.length : 0,
      lowQualityCount,
      hasErrors: this.loadErrors.length > 0,
    };
  }

  /**
   * Clear errors and retry loading
   */
  async retryDataLoading(): Promise<void> {
    this.loadErrors = [];
    this.isLoaded = false;
    this.loadingPromise = null;
    this.asteroids.clear();
    this.fallbackData = [];

    logInfo("Retry Loading", "Retrying asteroid data loading");
    await this.loadAsteroidData();
  }

  /**
   * Validate asteroid data integrity with comprehensive checks
   */
  validateAsteroidData(asteroid: UnifiedAsteroidData): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!asteroid.id) errors.push("Missing asteroid ID");
    if (!asteroid.name) errors.push("Missing asteroid name");
    if (asteroid.diameter <= 0) errors.push("Invalid diameter");
    if (asteroid.mass <= 0) errors.push("Invalid mass");
    if (asteroid.velocity <= 0) errors.push("Invalid velocity");
    if (!asteroid.composition) errors.push("Missing composition");

    // Range validation with warnings for extreme values
    if (asteroid.diameter > 100000) {
      errors.push("Diameter too large (>100km)");
    } else if (asteroid.diameter > 10000) {
      warnings.push("Very large diameter (>10km) - verify data");
    }

    if (asteroid.velocity > 100) {
      errors.push("Velocity too high (>100 km/s)");
    } else if (asteroid.velocity > 50) {
      warnings.push("Very high velocity (>50 km/s) - verify data");
    }

    if (asteroid.mass > 1e15) {
      warnings.push("Very large mass - verify calculation");
    }

    if (asteroid.dataCompleteness < 0 || asteroid.dataCompleteness > 1) {
      errors.push("Invalid data completeness score");
    } else if (asteroid.dataCompleteness < 0.3) {
      warnings.push("Very low data completeness");
    }

    // Density validation
    if (asteroid.density <= 0) {
      errors.push("Invalid density");
    } else if (asteroid.density < 500 || asteroid.density > 10000) {
      warnings.push("Unusual density value - verify composition");
    }

    // Threat level validation
    const validThreatLevels = ["low", "medium", "high", "critical"];
    if (!validThreatLevels.includes(asteroid.threatLevel)) {
      errors.push("Invalid threat level");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

// Export singleton instance
export const asteroidDataManager = new AsteroidDataManager();

// Export utilities
export { COMPOSITION_DENSITIES };
