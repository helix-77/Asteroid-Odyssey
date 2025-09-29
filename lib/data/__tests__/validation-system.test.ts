/**
 * Tests for Data Validation System
 */

import { describe, it, expect, beforeEach } from "vitest";
import { DataValidationSystem, ValidationReport } from "../validation-system";
import { ScientificAsteroid } from "../nasa-processor";

describe("DataValidationSystem", () => {
  let validator: DataValidationSystem;

  beforeEach(() => {
    validator = new DataValidationSystem();
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
      source: "NASA JPL Small-Body Database",
    },
    diameter: {
      min: 400,
      max: 600,
      estimated: 500,
      uncertainty: 100,
      unit: "meters",
      derivationMethod: "Absolute magnitude to diameter conversion",
    },
    mass: {
      value: 1e14,
      uncertainty: 2e13,
      unit: "kg",
      derivationMethod: "Volume × bulk density (S-type model)",
    },
    density: {
      value: 2700,
      uncertainty: 300,
      unit: "kg/m³",
      source: "S-type composition model",
    },
    composition: {
      type: "S-type",
      confidence: 0.8,
      source: "Size-based statistical model",
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
      sources: ["NASA JPL Small-Body Database", "Enhanced Processing Pipeline"],
      processingNotes: [],
    },
    ...overrides,
  });

  describe("validateAsteroid", () => {
    it("should validate a well-formed asteroid", async () => {
      const asteroid = createMockAsteroid();
      const report = await validator.validateAsteroid(asteroid);

      expect(report.asteroidId).toBe(asteroid.id);
      expect(report.asteroidName).toBe(asteroid.name);
      expect(["PASS", "WARNING", "FAIL"]).toContain(report.overallStatus);
      expect(report.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(report.confidenceScore).toBeLessThanOrEqual(1);
      expect(["A", "B", "C", "D", "F"]).toContain(report.qualityGrade);

      expect(report.validationResults).toHaveProperty("physicalProperties");
      expect(report.validationResults).toHaveProperty("orbitalElements");
      expect(report.validationResults).toHaveProperty("dataConsistency");
      expect(report.validationResults).toHaveProperty("outlierDetection");
      expect(report.validationResults).toHaveProperty("provenanceTracking");

      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(Array.isArray(report.limitations)).toBe(true);
      expect(report.lastValidated).toBeDefined();
    });

    it("should fail validation for invalid diameter", async () => {
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

      const report = await validator.validateAsteroid(asteroid);

      expect(report.overallStatus).toBe("FAIL");
      expect(report.validationResults.physicalProperties.status).toBe("FAIL");

      const diameterCheck =
        report.validationResults.physicalProperties.checks.find(
          (c) => c.property === "diameter"
        );
      expect(diameterCheck?.result).toBe("FAIL");
    });

    it("should warn for unusual density", async () => {
      const asteroid = createMockAsteroid({
        density: {
          value: 25000, // Extremely high density
          uncertainty: 1000,
          unit: "kg/m³",
          source: "Test",
        },
      });

      const report = await validator.validateAsteroid(asteroid);

      const densityCheck =
        report.validationResults.physicalProperties.checks.find(
          (c) => c.property === "density"
        );
      expect(densityCheck?.result).toBe("WARNING");
    });

    it("should validate orbital elements", async () => {
      const asteroid = createMockAsteroid();
      const report = await validator.validateAsteroid(asteroid);

      expect(report.validationResults.orbitalElements).toHaveProperty(
        "physicalConsistency"
      );
      expect(
        report.validationResults.orbitalElements.physicalConsistency
      ).toHaveProperty("boundOrbit");
      expect(
        report.validationResults.orbitalElements.physicalConsistency
      ).toHaveProperty("keplerLaws");
      expect(
        report.validationResults.orbitalElements.physicalConsistency
      ).toHaveProperty("reasonableElements");
    });

    it("should fail for unbound orbit", async () => {
      const asteroid = createMockAsteroid({
        orbitalElements: {
          semiMajorAxis: 1.5,
          eccentricity: 1.5, // Hyperbolic orbit
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

      const report = await validator.validateAsteroid(asteroid);

      expect(
        report.validationResults.orbitalElements.physicalConsistency.boundOrbit
      ).toBe("FAIL");
    });

    it("should check data consistency", async () => {
      const asteroid = createMockAsteroid();
      const report = await validator.validateAsteroid(asteroid);

      expect(report.validationResults.dataConsistency.status).toBeDefined();
      expect(
        Array.isArray(report.validationResults.dataConsistency.checks)
      ).toBe(true);

      for (const check of report.validationResults.dataConsistency.checks) {
        expect(check).toHaveProperty("relationship");
        expect(check).toHaveProperty("consistency");
        expect(check).toHaveProperty("deviation");
        expect(check).toHaveProperty("message");
        expect(["excellent", "good", "fair", "poor"]).toContain(
          check.consistency
        );
      }
    });

    it("should detect outliers", async () => {
      const asteroid = createMockAsteroid();
      const report = await validator.validateAsteroid(asteroid);

      expect(report.validationResults.outlierDetection.status).toBeDefined();
      expect(
        Array.isArray(report.validationResults.outlierDetection.outliers)
      ).toBe(true);

      for (const outlier of report.validationResults.outlierDetection
        .outliers) {
        expect(outlier).toHaveProperty("property");
        expect(outlier).toHaveProperty("outlierScore");
        expect(outlier).toHaveProperty("severity");
        expect(outlier).toHaveProperty("comparisonGroup");
        expect(outlier).toHaveProperty("message");
        expect(["minor", "moderate", "severe"]).toContain(outlier.severity);
      }
    });

    it("should validate data provenance", async () => {
      const asteroid = createMockAsteroid();
      const report = await validator.validateAsteroid(asteroid);

      const provenance = report.validationResults.provenanceTracking;

      expect(provenance.status).toBeDefined();
      expect(provenance.dataCompleteness).toBeGreaterThanOrEqual(0);
      expect(provenance.dataCompleteness).toBeLessThanOrEqual(1);
      expect(provenance.sourceReliability).toBeGreaterThanOrEqual(0);
      expect(provenance.sourceReliability).toBeLessThanOrEqual(1);

      expect(provenance.traceability).toHaveProperty("observedProperties");
      expect(provenance.traceability).toHaveProperty("derivedProperties");
      expect(provenance.traceability).toHaveProperty("missingProvenance");

      expect(Array.isArray(provenance.traceability.observedProperties)).toBe(
        true
      );
      expect(Array.isArray(provenance.traceability.derivedProperties)).toBe(
        true
      );
      expect(Array.isArray(provenance.traceability.missingProvenance)).toBe(
        true
      );
    });

    it("should assign appropriate quality grades", async () => {
      const excellentAsteroid = createMockAsteroid({
        metadata: {
          lastUpdated: "2024-01-01T00:00:00Z",
          dataVersion: "1.0.0",
          sources: ["NASA JPL", "radar", "spectroscopy"],
          processingNotes: [],
        },
      });

      const poorAsteroid = createMockAsteroid({
        diameter: {
          min: 400,
          max: 600,
          estimated: -100, // Invalid
          uncertainty: 100,
          unit: "meters",
          derivationMethod: "Test",
        },
        metadata: {
          lastUpdated: "2024-01-01T00:00:00Z",
          dataVersion: "1.0.0",
          sources: ["unknown"],
          processingNotes: [],
        },
      });

      const excellentReport = await validator.validateAsteroid(
        excellentAsteroid
      );
      const poorReport = await validator.validateAsteroid(poorAsteroid);

      const gradeOrder = { A: 5, B: 4, C: 3, D: 2, F: 1 };
      expect(gradeOrder[excellentReport.qualityGrade]).toBeGreaterThan(
        gradeOrder[poorReport.qualityGrade]
      );
    });

    it("should provide meaningful recommendations", async () => {
      const asteroid = createMockAsteroid({
        dataQuality: {
          uncertaintyClass: "LOW",
          observationArc: {
            days: 30, // Short arc
            firstObservation: "2023-12-01",
            lastObservation: "2023-12-31",
          },
          numberOfObservations: 5, // Few observations
          dataReliability: 0.3,
        },
      });

      const report = await validator.validateAsteroid(asteroid);

      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(
        report.recommendations.some((r) => r.includes("observations"))
      ).toBe(true);
    });

    it("should identify limitations", async () => {
      const asteroid = createMockAsteroid({
        neoReferenceId: "", // No JPL reference
        metadata: {
          lastUpdated: "2024-01-01T00:00:00Z",
          dataVersion: "1.0.0",
          sources: ["unknown_source"], // Poor source
          processingNotes: [],
        },
      });

      const report = await validator.validateAsteroid(asteroid);

      expect(report.limitations.length).toBeGreaterThan(0);
    });
  });

  describe("physical property validation", () => {
    it("should validate mass-density-volume consistency", async () => {
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
        density: {
          value: 2700,
          uncertainty: 300,
          unit: "kg/m³",
          source: "Test",
        },
      });

      const report = await validator.validateAsteroid(asteroid);

      // Should detect inconsistency between mass and size
      const massCheck = report.validationResults.physicalProperties.checks.find(
        (c) => c.property === "mass"
      );
      expect(massCheck?.result).toBe("WARNING");
    });

    it("should validate composition-density consistency", async () => {
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

      const report = await validator.validateAsteroid(asteroid);

      const compositionCheck =
        report.validationResults.physicalProperties.checks.find(
          (c) => c.property === "composition"
        );
      expect(compositionCheck?.result).toBe("WARNING");
    });
  });

  describe("confidence scoring", () => {
    it("should give higher confidence to better data", async () => {
      const highQualityAsteroid = createMockAsteroid({
        dataQuality: {
          uncertaintyClass: "HIGH",
          observationArc: {
            days: 1000,
            firstObservation: "2021-01-01",
            lastObservation: "2024-01-01",
          },
          numberOfObservations: 200,
          dataReliability: 0.95,
        },
        metadata: {
          lastUpdated: "2024-01-01T00:00:00Z",
          dataVersion: "1.0.0",
          sources: ["NASA JPL", "radar", "spectroscopy"],
          processingNotes: [],
        },
      });

      const lowQualityAsteroid = createMockAsteroid({
        dataQuality: {
          uncertaintyClass: "LOW",
          observationArc: {
            days: 30,
            firstObservation: "2023-12-01",
            lastObservation: "2023-12-31",
          },
          numberOfObservations: 5,
          dataReliability: 0.3,
        },
        metadata: {
          lastUpdated: "2024-01-01T00:00:00Z",
          dataVersion: "1.0.0",
          sources: ["survey"],
          processingNotes: [],
        },
      });

      const highQualityReport = await validator.validateAsteroid(
        highQualityAsteroid
      );
      const lowQualityReport = await validator.validateAsteroid(
        lowQualityAsteroid
      );

      expect(highQualityReport.confidenceScore).toBeGreaterThan(
        lowQualityReport.confidenceScore
      );
    });
  });

  describe("edge cases", () => {
    it("should handle missing data gracefully", async () => {
      const incompleteAsteroid = createMockAsteroid({
        absoluteMagnitude: {
          value: 18.0,
          uncertainty: 0.2,
          source: "", // Missing source
        },
        diameter: {
          min: 400,
          max: 600,
          estimated: 500,
          uncertainty: 100,
          unit: "meters",
          derivationMethod: "", // Missing method
        },
      });

      const report = await validator.validateAsteroid(incompleteAsteroid);

      expect(report).toBeDefined();
      expect(
        report.validationResults.provenanceTracking.traceability
          .missingProvenance.length
      ).toBeGreaterThan(0);
    });

    it("should handle extreme values", async () => {
      const extremeAsteroid = createMockAsteroid({
        diameter: {
          min: 1,
          max: 2,
          estimated: 1.5, // Very small
          uncertainty: 0.5,
          unit: "meters",
          derivationMethod: "Test",
        },
        absoluteMagnitude: {
          value: 35, // Very faint
          uncertainty: 1.0,
          source: "Test",
        },
      });

      const report = await validator.validateAsteroid(extremeAsteroid);

      expect(report).toBeDefined();
      expect(report.overallStatus).toBeDefined();
    });
  });
});
