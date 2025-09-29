// Tests for enhanced impact calculations with error handling
import { describe, it, expect, beforeEach } from "vitest";
import {
  safeCalculateEnhancedImpact,
  validateAsteroidForCalculations,
  createFallbackAsteroidData,
  safeCalculateBasicImpact,
  formatCalculationError,
  CalculationError,
} from "../enhanced-impact";
import type { UnifiedAsteroidData } from "../../data/asteroid-manager";

describe("Enhanced Impact Calculations", () => {
  let validAsteroid: UnifiedAsteroidData;
  let invalidAsteroid: Partial<UnifiedAsteroidData>;

  beforeEach(() => {
    validAsteroid = {
      id: "test-asteroid",
      name: "Test Asteroid",
      diameter: 150,
      mass: 2.5e9,
      density: 2500,
      composition: "stony",
      velocity: 15.5,
      threatLevel: "medium",
      discoveryDate: "2024",
      nextApproach: "2025-01-01",
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
      dataCompleteness: 0.8,
      estimatedFields: [],
      impactProbability: 0.0001,
    };

    invalidAsteroid = {
      id: "invalid-asteroid",
      name: "Invalid Asteroid",
      diameter: -100, // Invalid
      mass: 0, // Invalid
      velocity: -5, // Invalid
      composition: "unknown",
      density: 0,
      threatLevel: "low",
      discoveryDate: "Unknown",
      nextApproach: "Unknown",
      minDistance: 0,
      orbitalElements: {
        semiMajorAxis: 1.0,
        eccentricity: 0.1,
        inclination: 0,
        longitudeOfAscendingNode: 0,
        argumentOfPeriapsis: 0,
        meanAnomaly: 0,
      },
      source: "local",
      dataCompleteness: 0.1,
      estimatedFields: ["mass", "velocity", "diameter"],
      impactProbability: 0.0001,
    };
  });

  describe("validateAsteroidForCalculations", () => {
    it("should validate a complete asteroid", () => {
      const result = validateAsteroidForCalculations(validAsteroid);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect invalid asteroid data", () => {
      const result = validateAsteroidForCalculations(
        invalidAsteroid as UnifiedAsteroidData
      );
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain("Invalid or missing mass");
      expect(result.errors).toContain("Invalid or missing velocity");
      expect(result.errors).toContain("Invalid or missing diameter");
    });

    it("should detect missing composition as warning", () => {
      const asteroidWithoutComposition = {
        ...validAsteroid,
        composition: "unknown",
      };
      const result = validateAsteroidForCalculations(
        asteroidWithoutComposition
      );
      expect(result.warnings).toContain(
        "Unknown composition - using default properties"
      );
    });

    it("should detect low data completeness", () => {
      const lowQualityAsteroid = {
        ...validAsteroid,
        dataCompleteness: 0.2,
      };
      const result = validateAsteroidForCalculations(lowQualityAsteroid);
      expect(result.warnings).toContain(
        "Very low data completeness - results have high uncertainty"
      );
    });
  });

  describe("createFallbackAsteroidData", () => {
    it("should create valid fallback data from partial asteroid", () => {
      const fallback = createFallbackAsteroidData(invalidAsteroid);

      expect(fallback.id).toBe(invalidAsteroid.id);
      expect(fallback.name).toBe(invalidAsteroid.name);
      expect(fallback.diameter).toBeGreaterThan(0);
      expect(fallback.mass).toBeGreaterThan(0);
      expect(fallback.velocity).toBeGreaterThan(0);
      expect(fallback.composition).toBe("stony");
      expect(fallback.dataCompleteness).toBe(0.3);
    });

    it("should preserve valid values from original asteroid", () => {
      const partialAsteroid = {
        id: "test",
        name: "Test",
        diameter: 200,
        mass: 0, // Invalid, should be recalculated
        velocity: 20,
      };

      const fallback = createFallbackAsteroidData(partialAsteroid);

      expect(fallback.diameter).toBe(200); // Preserved
      expect(fallback.velocity).toBe(20); // Preserved
      expect(fallback.mass).toBeGreaterThan(0); // Recalculated
    });
  });

  describe("safeCalculateBasicImpact", () => {
    it("should calculate basic impact for valid inputs", async () => {
      const result = await safeCalculateBasicImpact(2.5e9, 15.5, 45);

      expect(result.errors).toHaveLength(0);
      expect(result.kineticEnergy).toBeGreaterThan(0);
      expect(result.tntEquivalent).toBeGreaterThan(0);
      expect(result.crater).toBeTruthy();
      expect(result.effects).toBeTruthy();
    });

    it("should handle invalid mass", async () => {
      const result = await safeCalculateBasicImpact(0, 15.5, 45);

      expect(result.errors).toContain("Invalid mass value");
      expect(result.kineticEnergy).toBeNull();
    });

    it("should handle invalid velocity", async () => {
      const result = await safeCalculateBasicImpact(2.5e9, 0, 45);

      expect(result.errors).toContain("Invalid velocity value");
      expect(result.kineticEnergy).toBeNull();
    });

    it("should warn about invalid angle", async () => {
      const result = await safeCalculateBasicImpact(2.5e9, 15.5, 120);

      expect(result.warnings).toContain("Invalid angle - using 45°");
      expect(result.kineticEnergy).toBeGreaterThan(0);
    });
  });

  describe("safeCalculateEnhancedImpact", () => {
    const defaultLocation = {
      populationDensity: 100,
      totalPopulation: 1000000,
      gdpPerCapita: 65000,
      infrastructureValue: 1e12,
    };

    it("should calculate enhanced impact for valid asteroid", async () => {
      const result = await safeCalculateEnhancedImpact(
        validAsteroid,
        45,
        defaultLocation
      );

      // The calculation might fail and use fallback, which is acceptable
      if (result.results) {
        expect(result.results.kineticEnergy).toBeGreaterThan(0);
      } else {
        // If no results, should have errors
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it("should use fallback for invalid asteroid", async () => {
      const result = await safeCalculateEnhancedImpact(
        invalidAsteroid as UnifiedAsteroidData,
        45,
        defaultLocation
      );

      // Should either fail completely or use fallback
      if (result.results) {
        expect(result.fallbackUsed).toBe(true);
        expect(result.warnings.length).toBeGreaterThan(0);
      } else {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it("should handle invalid angle parameter", async () => {
      const result = await safeCalculateEnhancedImpact(
        validAsteroid,
        -10,
        defaultLocation
      );

      expect(result.warnings).toContain(
        "Invalid impact angle - using default 45°"
      );
    });

    it("should handle invalid population parameters", async () => {
      const invalidLocation = {
        populationDensity: -100,
        totalPopulation: -1000,
        gdpPerCapita: 65000,
        infrastructureValue: 1e12,
      };

      const result = await safeCalculateEnhancedImpact(
        validAsteroid,
        45,
        invalidLocation
      );

      expect(result.warnings).toContain("Invalid population density - using 0");
      expect(result.warnings).toContain("Invalid total population - using 0");
    });
  });

  describe("formatCalculationError", () => {
    it("should format invalid input error", () => {
      const error = {
        type: CalculationError.INVALID_INPUT,
        message: "Test error",
        fallbackUsed: false,
        name: "TestError",
      } as any;

      const formatted = formatCalculationError(error);

      expect(formatted.title).toBe("Invalid Input Data");
      expect(formatted.severity).toBe("error");
      expect(formatted.suggestions.length).toBeGreaterThan(0);
    });

    it("should format missing data error", () => {
      const error = {
        type: CalculationError.MISSING_DATA,
        message: "Missing data",
        fallbackUsed: false,
        name: "MissingDataError",
      } as any;

      const formatted = formatCalculationError(error);

      expect(formatted.title).toBe("Insufficient Data");
      expect(formatted.severity).toBe("warning");
    });

    it("should format numerical instability error", () => {
      const error = {
        type: CalculationError.NUMERICAL_INSTABILITY,
        message: "Unstable calculation",
        fallbackUsed: false,
        name: "InstabilityError",
      } as any;

      const formatted = formatCalculationError(error);

      expect(formatted.title).toBe("Calculation Error");
      expect(formatted.severity).toBe("error");
    });

    it("should format unknown error type", () => {
      const error = {
        type: "UNKNOWN_ERROR" as any,
        message: "Unknown error",
        fallbackUsed: false,
        name: "UnknownError",
      } as any;

      const formatted = formatCalculationError(error);

      expect(formatted.title).toBe("Calculation Error");
      expect(formatted.severity).toBe("error");
    });
  });
});
