// Enhanced impact calculations with comprehensive error handling and fallbacks
import type { UnifiedAsteroidData } from "../data/asteroid-manager";
import {
  calculateKineticEnergy,
  energyToTNT,
  calculateCrater,
  calculateBlastEffects,
  calculateEnhancedKineticEnergy,
  calculateEnhancedCrater,
  calculateEnhancedBlastEffects,
  calculateEnhancedImpact,
  type EnhancedImpactResults,
} from "./impact";

// Enhanced error types for calculations
export enum CalculationError {
  INVALID_INPUT = "INVALID_INPUT",
  CALCULATION_OVERFLOW = "CALCULATION_OVERFLOW",
  CALCULATION_UNDERFLOW = "CALCULATION_UNDERFLOW",
  MISSING_DATA = "MISSING_DATA",
  UNSUPPORTED_COMPOSITION = "UNSUPPORTED_COMPOSITION",
  NUMERICAL_INSTABILITY = "NUMERICAL_INSTABILITY",
}

export interface CalculationException extends Error {
  type: CalculationError;
  details?: any;
  fallbackUsed: boolean;
  asteroid?: UnifiedAsteroidData;
}

// Create typed calculation error
function createCalculationError(
  type: CalculationError,
  message: string,
  details?: any,
  fallbackUsed = false,
  asteroid?: UnifiedAsteroidData
): CalculationException {
  const error = new Error(message) as CalculationException;
  error.type = type;
  error.details = details;
  error.fallbackUsed = fallbackUsed;
  error.asteroid = asteroid;
  return error;
}

// Logging utility for calculations
function logCalculationError(
  context: string,
  error: any,
  asteroid?: UnifiedAsteroidData
) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] Enhanced Impact Calculations - ${context}:`, {
    error: error.message || error,
    stack: error.stack,
    asteroidId: asteroid?.id,
    asteroidName: asteroid?.name,
    type: error.type || "UNKNOWN",
  });
}

function logCalculationWarning(
  context: string,
  message: string,
  asteroid?: UnifiedAsteroidData
) {
  const timestamp = new Date().toISOString();
  console.warn(
    `[${timestamp}] Enhanced Impact Calculations - ${context}:`,
    message,
    {
      asteroidId: asteroid?.id,
      asteroidName: asteroid?.name,
    }
  );
}

// Validation functions
export function validateAsteroidForCalculations(
  asteroid: UnifiedAsteroidData
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  canProceedWithFallbacks: boolean;
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Critical validations (cannot proceed without these)
  if (!asteroid.mass || asteroid.mass <= 0) {
    errors.push("Invalid or missing mass");
  }
  if (!asteroid.velocity || asteroid.velocity <= 0) {
    errors.push("Invalid or missing velocity");
  }
  if (!asteroid.diameter || asteroid.diameter <= 0) {
    errors.push("Invalid or missing diameter");
  }

  // Non-critical validations (can use fallbacks)
  if (!asteroid.composition || asteroid.composition === "unknown") {
    warnings.push("Unknown composition - using default properties");
  }
  if (!asteroid.density || asteroid.density <= 0) {
    warnings.push("Invalid density - will calculate from composition");
  }

  // Range validations
  if (asteroid.mass > 1e18) {
    warnings.push("Extremely large mass - results may be unrealistic");
  }
  if (asteroid.velocity > 100) {
    warnings.push("Extremely high velocity - results may be unrealistic");
  }
  if (asteroid.diameter > 100000) {
    warnings.push("Extremely large diameter - results may be unrealistic");
  }

  // Data quality warnings
  if (asteroid.dataCompleteness < 0.3) {
    warnings.push("Very low data completeness - results have high uncertainty");
  }
  if (asteroid.estimatedFields && asteroid.estimatedFields.length > 3) {
    warnings.push("Many estimated fields - results have high uncertainty");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    canProceedWithFallbacks:
      errors.length === 0 || (errors.length <= 2 && warnings.length > 0),
  };
}

// Create fallback asteroid data for calculations
export function createFallbackAsteroidData(
  originalAsteroid: Partial<UnifiedAsteroidData>
): UnifiedAsteroidData {
  const fallback: UnifiedAsteroidData = {
    id: originalAsteroid.id || "fallback-calculation",
    name: originalAsteroid.name || "Fallback Asteroid",
    diameter:
      originalAsteroid.diameter && originalAsteroid.diameter > 0
        ? originalAsteroid.diameter
        : 150,
    mass:
      originalAsteroid.mass && originalAsteroid.mass > 0
        ? originalAsteroid.mass
        : 2.5e9,
    density:
      originalAsteroid.density && originalAsteroid.density > 0
        ? originalAsteroid.density
        : 2500,
    composition:
      originalAsteroid.composition && originalAsteroid.composition !== "unknown"
        ? originalAsteroid.composition
        : "stony",
    velocity:
      originalAsteroid.velocity && originalAsteroid.velocity > 0
        ? originalAsteroid.velocity
        : 15.5,
    threatLevel: originalAsteroid.threatLevel || "medium",
    discoveryDate: originalAsteroid.discoveryDate || "Unknown",
    nextApproach: originalAsteroid.nextApproach || "Unknown",
    minDistance: originalAsteroid.minDistance || 0.05,
    orbitalElements: originalAsteroid.orbitalElements || {
      semiMajorAxis: 1.0,
      eccentricity: 0.1,
      inclination: 0,
      longitudeOfAscendingNode: 0,
      argumentOfPeriapsis: 0,
      meanAnomaly: 0,
    },
    source: "local",
    dataCompleteness: 0.3, // Low completeness for fallback
    estimatedFields: [
      "mass",
      "velocity",
      "diameter",
      "composition",
      "density",
      "orbitalElements",
    ],
    impactProbability: 0.0001,
  };

  // Recalculate mass if needed
  if (!originalAsteroid.mass || originalAsteroid.mass <= 0) {
    const radius = fallback.diameter / 2;
    const volume = (4 / 3) * Math.PI * Math.pow(radius, 3);
    fallback.mass = volume * fallback.density;
  }

  return fallback;
}

// Safe calculation wrapper
export async function safeCalculateEnhancedImpact(
  asteroid: UnifiedAsteroidData,
  angle: number = 45,
  location: {
    populationDensity: number;
    totalPopulation: number;
    gdpPerCapita?: number;
    infrastructureValue?: number;
  }
): Promise<{
  results: EnhancedImpactResults | null;
  errors: CalculationException[];
  warnings: string[];
  fallbackUsed: boolean;
  validationReport: ReturnType<typeof validateAsteroidForCalculations>;
}> {
  const errors: CalculationException[] = [];
  const warnings: string[] = [];
  let fallbackUsed = false;
  let results: EnhancedImpactResults | null = null;

  try {
    // Validate input asteroid data
    const validation = validateAsteroidForCalculations(asteroid);

    if (!validation.isValid && !validation.canProceedWithFallbacks) {
      throw createCalculationError(
        CalculationError.INVALID_INPUT,
        `Cannot perform calculations: ${validation.errors.join(", ")}`,
        { validation },
        false,
        asteroid
      );
    }

    // Add validation warnings
    warnings.push(...validation.warnings);

    let calculationAsteroid = asteroid;

    // Use fallback data if needed
    if (!validation.isValid && validation.canProceedWithFallbacks) {
      logCalculationWarning(
        "Input Validation",
        `Using fallback data for asteroid ${
          asteroid.id
        }: ${validation.errors.join(", ")}`,
        asteroid
      );
      calculationAsteroid = createFallbackAsteroidData(asteroid);
      fallbackUsed = true;
      warnings.push(
        "Fallback data used due to missing or invalid asteroid properties"
      );
    }

    // Validate angle parameter
    if (angle < 0 || angle > 90) {
      logCalculationWarning(
        "Parameter Validation",
        `Invalid impact angle ${angle}°, using 45°`,
        asteroid
      );
      angle = 45;
      warnings.push("Invalid impact angle - using default 45°");
    }

    // Validate location parameters
    if (location.populationDensity < 0) {
      logCalculationWarning(
        "Parameter Validation",
        "Invalid population density, using 0",
        asteroid
      );
      location.populationDensity = 0;
      warnings.push("Invalid population density - using 0");
    }

    if (location.totalPopulation < 0) {
      logCalculationWarning(
        "Parameter Validation",
        "Invalid total population, using 0",
        asteroid
      );
      location.totalPopulation = 0;
      warnings.push("Invalid total population - using 0");
    }

    // Perform calculations with error handling
    try {
      results = calculateEnhancedImpact(calculationAsteroid, angle, location);

      // Validate results for numerical stability
      if (!isFinite(results.kineticEnergy) || results.kineticEnergy <= 0) {
        throw createCalculationError(
          CalculationError.NUMERICAL_INSTABILITY,
          "Kinetic energy calculation resulted in invalid value",
          { kineticEnergy: results.kineticEnergy },
          fallbackUsed,
          asteroid
        );
      }

      if (!isFinite(results.crater.diameter) || results.crater.diameter <= 0) {
        throw createCalculationError(
          CalculationError.NUMERICAL_INSTABILITY,
          "Crater calculation resulted in invalid value",
          { craterDiameter: results.crater.diameter },
          fallbackUsed,
          asteroid
        );
      }

      // Check for extreme values that might indicate calculation errors
      if (results.kineticEnergy > 1e25) {
        warnings.push(
          "Extremely high kinetic energy - verify asteroid mass and velocity"
        );
      }
      if (results.crater.diameter > 1000000) {
        warnings.push("Extremely large crater - results may be unrealistic");
      }
      if (results.effects.seismicMagnitude > 12) {
        warnings.push(
          "Extremely high seismic magnitude - results may be unrealistic"
        );
      }
    } catch (calcError) {
      // Try fallback calculation if main calculation fails
      if (!fallbackUsed) {
        logCalculationWarning(
          "Main Calculation Failed",
          "Attempting fallback calculation",
          asteroid
        );

        try {
          const fallbackAsteroid = createFallbackAsteroidData(asteroid);
          results = calculateEnhancedImpact(fallbackAsteroid, angle, location);
          fallbackUsed = true;
          warnings.push(
            "Main calculation failed - using fallback asteroid data"
          );
        } catch (fallbackError) {
          throw createCalculationError(
            CalculationError.CALCULATION_OVERFLOW,
            "Both main and fallback calculations failed",
            { mainError: calcError, fallbackError },
            true,
            asteroid
          );
        }
      } else {
        throw calcError;
      }
    }

    return {
      results,
      errors,
      warnings,
      fallbackUsed,
      validationReport: validation,
    };
  } catch (error) {
    const calcError =
      error instanceof Error && "type" in error
        ? (error as CalculationException)
        : createCalculationError(
            CalculationError.INVALID_INPUT,
            "Unexpected error during impact calculations",
            error,
            fallbackUsed,
            asteroid
          );

    errors.push(calcError);
    logCalculationError("Safe Calculate Enhanced Impact", calcError, asteroid);

    return {
      results: null,
      errors,
      warnings,
      fallbackUsed,
      validationReport: validateAsteroidForCalculations(asteroid),
    };
  }
}

// Safe basic calculation wrapper for simple cases
export async function safeCalculateBasicImpact(
  mass: number,
  velocity: number,
  angle: number = 45
): Promise<{
  kineticEnergy: number | null;
  tntEquivalent: number | null;
  crater: { diameter: number; depth: number; volume: number } | null;
  effects: {
    fireballRadius: number;
    airblastRadius: number;
    thermalRadiation: number;
    seismicMagnitude: number;
  } | null;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Validate inputs
    if (!mass || mass <= 0) {
      errors.push("Invalid mass value");
    }
    if (!velocity || velocity <= 0) {
      errors.push("Invalid velocity value");
    }
    if (angle < 0 || angle > 90) {
      warnings.push("Invalid angle - using 45°");
      angle = 45;
    }

    if (errors.length > 0) {
      return {
        kineticEnergy: null,
        tntEquivalent: null,
        crater: null,
        effects: null,
        errors,
        warnings,
      };
    }

    // Perform calculations
    const kineticEnergy = calculateKineticEnergy(mass, velocity * 1000); // Convert km/s to m/s
    const tntEquivalent = energyToTNT(kineticEnergy);
    const crater = calculateCrater(kineticEnergy, angle);
    const effects = calculateBlastEffects(kineticEnergy);

    // Validate results
    if (!isFinite(kineticEnergy) || kineticEnergy <= 0) {
      errors.push("Kinetic energy calculation failed");
    }
    if (!isFinite(crater.diameter) || crater.diameter <= 0) {
      errors.push("Crater calculation failed");
    }

    return {
      kineticEnergy: isFinite(kineticEnergy) ? kineticEnergy : null,
      tntEquivalent: isFinite(tntEquivalent) ? tntEquivalent : null,
      crater: isFinite(crater.diameter) ? crater : null,
      effects: isFinite(effects.fireballRadius) ? effects : null,
      errors,
      warnings,
    };
  } catch (error) {
    errors.push(`Calculation error: ${error.message || error}`);
    return {
      kineticEnergy: null,
      tntEquivalent: null,
      crater: null,
      effects: null,
      errors,
      warnings,
    };
  }
}

// Utility to format calculation errors for user display
export function formatCalculationError(error: CalculationException): {
  title: string;
  message: string;
  severity: "error" | "warning";
  suggestions: string[];
} {
  switch (error.type) {
    case CalculationError.INVALID_INPUT:
      return {
        title: "Invalid Input Data",
        message:
          "The asteroid data contains invalid values that prevent accurate calculations.",
        severity: "error",
        suggestions: [
          "Select an asteroid with higher data completeness",
          "Verify the asteroid properties are within realistic ranges",
          "Try using a different asteroid from the database",
        ],
      };

    case CalculationError.MISSING_DATA:
      return {
        title: "Insufficient Data",
        message:
          "Critical asteroid properties are missing for accurate calculations.",
        severity: "warning",
        suggestions: [
          "Results are based on estimated values",
          "Consider using asteroids with measured properties",
          "Interpret results with caution due to data limitations",
        ],
      };

    case CalculationError.NUMERICAL_INSTABILITY:
      return {
        title: "Calculation Error",
        message: "The calculations produced unstable or unrealistic results.",
        severity: "error",
        suggestions: [
          "Try with different impact parameters",
          "Select an asteroid with more typical properties",
          "Check if the asteroid data is within realistic ranges",
        ],
      };

    case CalculationError.UNSUPPORTED_COMPOSITION:
      return {
        title: "Unknown Composition",
        message:
          "The asteroid composition is not recognized by the calculation system.",
        severity: "warning",
        suggestions: [
          "Results use default material properties",
          "Actual impact effects may differ based on true composition",
          "Consider selecting asteroids with known compositions",
        ],
      };

    default:
      return {
        title: "Calculation Error",
        message:
          error.message || "An unexpected error occurred during calculations.",
        severity: "error",
        suggestions: [
          "Try refreshing the page",
          "Select a different asteroid",
          "Contact support if the problem persists",
        ],
      };
  }
}
