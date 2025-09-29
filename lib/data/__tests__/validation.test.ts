/**
 * Tests for Asteroid Data Validation System
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  AsteroidDataValidator,
  ValidationResult,
  OutlierDetectionResult,
} from "../validation";
import { ScientificAsteroid } from "../nasa-processor";

describe("AsteroidDataValidator", () => {
  let validator: AsteroidDataValidator;

  beforeEach(() => {
    validator = new AsteroidDataValidator();
  });

  const createMockAsteroid = (
    overrides: Partial<ScientificAsteroid> = {}
  ): ScientificAsteroid => ({
    id: "test-asteroid",
    name: "Test Asteroid",
    neoReferenceId: "2000001",
    absoluteMagnitude: {
      value: 18.0,
      uncertainty: 0.2,
      source: "Test",
    },
    diameter: {
      min: 400,
      max: 600,
      estimated: 500,
      uncertainty: 100,
      unit: "meters",
      derivationMethod: "Test",
    },
    mass: {
      value: 1e14,
      uncertainty: 2e13,
      unit: "kg",
      derivationMethod: "Test",
    },
    density: {
      value: 2700,
      uncertainty: 300,
      unit: "kg/m³",
      source: "Test",
    },
    composition: {
      type: "S-type",
      confidence: 0.8,
      source: "Test",
    },
    orbitalElements: {
      semiMajorAxis: 1.5,
      eccentricity: 0.2,
      inclination: 5.0,
      longitudeOfAscendingNode: 180.0,
      argumentOfPeriapsis: 90.0,
      meanAnomaly: 0.0,
      epoch: {
        jd: 2460000.5,
        calendar: "2023-01-01T00:00:00Z",
      },
    },
    closeApproach: {
      date: "2025-01-01T00:00:00Z",
      julianDate: 2460676.5,
      missDistance: {
        km: 5000000,
        au: 0.033,
        lunar: 13.0,
      },
      relativeVelocity: {
        kmPerSec: 15.0,
        kmPerHour: 54000,
      },
      orbitingBody: "Earth",
    },
    dataQuality: {
      uncertaintyClass: "MEDIUM",
      observationArc: {
        days: 365,
        firstObservation: "2022-01-01",
        lastObservation: "2023-01-01",
      },
      numberOfObservations: 100,
      dataReliability: 0.8,
    },
    threatAssessment: {
      isPotentiallyHazardous: false,
      impactProbability: 0.0001,
      threatLevel: "low",
      nextSignificantApproach: "2025-01-01T00:00:00Z",
    },
    metadata: {
      lastUpdated: "2024-01-01T00:00:00Z",
      dataVersion: "1.0.0",
      sources: ["Test"],
      processingNotes: [],
    },
    ...overrides,
  });

  describe("validateAsteroid", () => {
    it("should validate a well-formed asteroid", () => {
      const asteroid = createMockAsteroid();
      const result = validator.validateAsteroid(asteroid);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.qualityScore).toBeGreaterThan(0.5);
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it("should detect invalid diameter", () => {
      const asteroid = createMockAsteroid({
        diameter: {
          min: 400,
          max: 600,
          estimated: -100, // Invalid negative diameter
          uncertainty: 100,
          unit: "meters",
          derivationMethod: "Test",
        },
      });

      const result = validator.validateAsteroid(asteroid);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.property === "diameter.estimated")
      ).toBe(true);
    });

    it("should detect invalid mass", () => {
      const asteroid = createMockAsteroid({
        mass: {
          value: -1e14, // Invalid negative mass
          uncertainty: 2e13,
          unit: "kg",
          derivationMethod: "Test",
        },
      });

      const result = validator.validateAsteroid(asteroid);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.property === "mass.value")).toBe(true);
    });

    it("should detect invalid eccentricity", () => {
      const asteroid = createMockAsteroid({
        orbitalElements: {
          semiMajorAxis: 1.5,
          eccentricity: 1.5, // Invalid eccentricity > 1
          inclination: 5.0,
          longitudeOfAscendingNode: 180.0,
          argumentOfPeriapsis: 90.0,
          meanAnomaly: 0.0,
          epoch: {
            jd: 2460000.5,
            calendar: "2023-01-01T00:00:00Z",
          },
        },
      });

      const result = validator.validateAsteroid(asteroid);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.property === "orbitalElements.eccentricity")
      ).toBe(true);
    });

    it("should detect invalid inclination", () => {
      const asteroid = createMockAsteroid({
        orbitalElements: {
          semiMajorAxis: 1.5,
          eccentricity: 0.2,
          inclination: 200.0, // Invalid inclination > 180
          longitudeOfAscendingNode: 180.0,
          argumentOfPeriapsis: 90.0,
          meanAnomaly: 0.0,
          epoch: {
            jd: 2460000.5,
            calendar: "2023-01-01T00:00:00Z",
          },
        },
      });

      const result = validator.validateAsteroid(asteroid);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.property === "orbitalElements.inclination")
      ).toBe(true);
    });

    it("should warn about unusual density", () => {
      const asteroid = createMockAsteroid({
        density: {
          value: 10000, // Very high density
          uncertainty: 1000,
          unit: "kg/m³",
          source: "Test",
        },
      });

      const result = validator.validateAsteroid(asteroid);

      expect(
        result.warnings.some((w) => w.affectedProperty === "density")
      ).toBe(true);
    });

    it("should warn about short observation arc", () => {
      const asteroid = createMockAsteroid({
        dataQuality: {
          uncertaintyClass: "LOW",
          observationArc: {
            days: 15, // Very short arc
            firstObservation: "2023-01-01",
            lastObservation: "2023-01-16",
          },
          numberOfObservations: 5,
          dataReliability: 0.3,
        },
      });

      const result = validator.validateAsteroid(asteroid);

      expect(result.warnings.some((w) => w.type === "DATA_SPARSE")).toBe(true);
    });

    it("should warn about few observations", () => {
      const asteroid = createMockAsteroid({
        dataQuality: {
          uncertaintyClass: "LOW",
          observationArc: {
            days: 365,
            firstObservation: "2022-01-01",
            lastObservation: "2023-01-01",
          },
          numberOfObservations: 5, // Very few observations
          dataReliability: 0.3,
        },
      });

      const result = validator.validateAsteroid(asteroid);

      expect(result.warnings.some((w) => w.type === "DATA_SPARSE")).toBe(true);
    });
  });

  describe("detectOutliers", () => {
    it("should not detect outliers for normal asteroid", () => {
      const asteroid = createMockAsteroid();
      const outliers = validator.detectOutliers(asteroid);

      expect(outliers).toHaveLength(0);
    });

    it("should detect diameter-magnitude outlier", () => {
      const asteroid = createMockAsteroid({
        absoluteMagnitude: {
          value: 15.0, // Very bright
          uncertainty: 0.2,
          source: "Test",
        },
        diameter: {
          min: 50,
          max: 100,
          estimated: 75, // Very small for such bright magnitude
          uncertainty: 25,
          unit: "meters",
          derivationMethod: "Test",
        },
      });

      const outliers = validator.detectOutliers(asteroid);

      expect(
        outliers.some(
          (o) => o.comparisonGroup === "diameter-magnitude relationship"
        )
      ).toBe(true);
    });

    it("should detect mass-diameter outlier", () => {
      const asteroid = createMockAsteroid({
        diameter: {
          min: 400,
          max: 600,
          estimated: 500,
          uncertainty: 100,
          unit: "meters",
          derivationMethod: "Test",
        },
        mass: {
          value: 1e18, // Extremely high mass for size
          uncertainty: 2e17,
          unit: "kg",
          derivationMethod: "Test",
        },
      });

      const outliers = validator.detectOutliers(asteroid);

      expect(
        outliers.some((o) => o.comparisonGroup === "mass-diameter relationship")
      ).toBe(true);
    });

    it("should detect density-composition outlier", () => {
      const asteroid = createMockAsteroid({
        composition: {
          type: "C-type", // Carbonaceous
          confidence: 0.8,
          source: "Test",
        },
        density: {
          value: 5000, // Too high for C-type
          uncertainty: 500,
          unit: "kg/m³",
          source: "Test",
        },
      });

      const outliers = validator.detectOutliers(asteroid);

      expect(
        outliers.some((o) => o.comparisonGroup.includes("C-type density range"))
      ).toBe(true);
    });

    it("should provide outlier scores", () => {
      const asteroid = createMockAsteroid({
        mass: {
          value: 1e18, // Extremely high mass
          uncertainty: 2e17,
          unit: "kg",
          derivationMethod: "Test",
        },
      });

      const outliers = validator.detectOutliers(asteroid);
      const massOutlier = outliers.find(
        (o) => o.comparisonGroup === "mass-diameter relationship"
      );

      if (massOutlier) {
        expect(massOutlier.outlierScore).toBeGreaterThan(0);
        expect(massOutlier.expectedRange.min).toBeLessThan(
          massOutlier.expectedRange.max
        );
        expect(massOutlier.actualValue).toBe(1e18);
      }
    });
  });

  describe("crossValidateWithJPL", () => {
    it("should return validation result", async () => {
      const asteroid = createMockAsteroid();
      const result = await validator.crossValidateWithJPL(asteroid);

      expect(result).toHaveProperty("isValid");
      expect(result).toHaveProperty("confidence");
      expect(result).toHaveProperty("warnings");
      expect(result).toHaveProperty("errors");
      expect(result).toHaveProperty("qualityScore");
    });

    it("should handle asteroids without NEO reference ID", async () => {
      const asteroid = createMockAsteroid({ neoReferenceId: "" });
      const result = await validator.crossValidateWithJPL(asteroid);

      expect(result).toBeDefined();
      expect(typeof result.isValid).toBe("boolean");
    });
  });

  describe("confidence calculation", () => {
    it("should reduce confidence for errors", () => {
      const validAsteroid = createMockAsteroid();
      const invalidAsteroid = createMockAsteroid({
        diameter: {
          min: 400,
          max: 600,
          estimated: -100, // Invalid
          uncertainty: 100,
          unit: "meters",
          derivationMethod: "Test",
        },
      });

      const validResult = validator.validateAsteroid(validAsteroid);
      const invalidResult = validator.validateAsteroid(invalidAsteroid);

      expect(validResult.confidence).toBeGreaterThan(invalidResult.confidence);
    });

    it("should reduce confidence for warnings", () => {
      const normalAsteroid = createMockAsteroid();
      const warningAsteroid = createMockAsteroid({
        density: {
          value: 10000, // Unusual density
          uncertainty: 1000,
          unit: "kg/m³",
          source: "Test",
        },
      });

      const normalResult = validator.validateAsteroid(normalAsteroid);
      const warningResult = validator.validateAsteroid(warningAsteroid);

      expect(normalResult.confidence).toBeGreaterThan(warningResult.confidence);
    });
  });

  describe("quality score calculation", () => {
    it("should reflect data reliability", () => {
      const highReliability = createMockAsteroid({
        dataQuality: {
          uncertaintyClass: "HIGH",
          observationArc: {
            days: 1000,
            firstObservation: "2021-01-01",
            lastObservation: "2024-01-01",
          },
          numberOfObservations: 500,
          dataReliability: 0.95,
        },
      });

      const lowReliability = createMockAsteroid({
        dataQuality: {
          uncertaintyClass: "LOW",
          observationArc: {
            days: 30,
            firstObservation: "2023-12-01",
            lastObservation: "2023-12-31",
          },
          numberOfObservations: 10,
          dataReliability: 0.3,
        },
      });

      const highResult = validator.validateAsteroid(highReliability);
      const lowResult = validator.validateAsteroid(lowReliability);

      expect(highResult.qualityScore).toBeGreaterThan(lowResult.qualityScore);
    });

    it("should bonus for complete data", () => {
      const completeData = createMockAsteroid({
        orbitalElements: {
          semiMajorAxis: 1.5,
          eccentricity: 0.2,
          inclination: 5.0,
          longitudeOfAscendingNode: 180.0,
          argumentOfPeriapsis: 90.0,
          meanAnomaly: 0.0,
          epoch: {
            jd: 2460000.5,
            calendar: "2023-01-01T00:00:00Z",
          },
          covariance: [
            [1, 0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0, 0],
            [0, 0, 1, 0, 0, 0],
            [0, 0, 0, 1, 0, 0],
            [0, 0, 0, 0, 1, 0],
            [0, 0, 0, 0, 0, 1],
          ],
        },
        dataQuality: {
          uncertaintyClass: "HIGH",
          observationArc: {
            days: 1000, // Long arc
            firstObservation: "2021-01-01",
            lastObservation: "2024-01-01",
          },
          numberOfObservations: 200, // Many observations
          dataReliability: 0.8,
        },
      });

      const incompleteData = createMockAsteroid();

      const completeResult = validator.validateAsteroid(completeData);
      const incompleteResult = validator.validateAsteroid(incompleteData);

      expect(completeResult.qualityScore).toBeGreaterThan(
        incompleteResult.qualityScore
      );
    });
  });
});
