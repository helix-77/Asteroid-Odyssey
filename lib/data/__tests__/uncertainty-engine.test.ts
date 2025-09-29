/**
 * Tests for Uncertainty Engine
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  UncertaintyEngine,
  UncertaintyAssignment,
  DataQualityMetrics,
  MonteCarloResult,
} from "../uncertainty-engine";

describe("UncertaintyEngine", () => {
  let engine: UncertaintyEngine;

  beforeEach(() => {
    engine = new UncertaintyEngine();
  });

  const createMockDataQuality = (
    overrides: Partial<DataQualityMetrics> = {}
  ): DataQualityMetrics => ({
    observationArcDays: 365,
    numberOfObservations: 50,
    observationMethods: ["photometry"],
    lastObservationDate: "2024-01-01",
    dataSpan: 2,
    observationQuality: "good",
    ...overrides,
  });

  describe("assignUncertainty", () => {
    it("should assign uncertainty for diameter measurements", () => {
      const dataQuality = createMockDataQuality({
        observationMethods: ["radar"],
        observationQuality: "excellent",
      });

      const assignment = engine.assignUncertainty(
        "diameter",
        1000, // 1 km
        dataQuality,
        "radar"
      );

      expect(assignment.value).toBe(1000);
      expect(assignment.uncertainty).toBeGreaterThan(0);
      expect(assignment.uncertainty).toBeLessThan(100); // Should be small for radar
      expect(assignment.uncertaintyType).toBe("statistical");
      expect(assignment.confidenceLevel).toBeGreaterThan(0.6);
      expect(assignment.source).toContain("radar");
    });

    it("should assign higher uncertainty for poor quality data", () => {
      const goodData = createMockDataQuality({
        observationQuality: "excellent",
      });
      const poorData = createMockDataQuality({ observationQuality: "poor" });

      const goodAssignment = engine.assignUncertainty(
        "diameter",
        1000,
        goodData,
        "photometry"
      );
      const poorAssignment = engine.assignUncertainty(
        "diameter",
        1000,
        poorData,
        "photometry"
      );

      expect(poorAssignment.uncertainty).toBeGreaterThan(
        goodAssignment.uncertainty
      );
    });

    it("should assign higher uncertainty for short observation arcs", () => {
      const longArc = createMockDataQuality({ observationArcDays: 1000 });
      const shortArc = createMockDataQuality({ observationArcDays: 30 });

      const longAssignment = engine.assignUncertainty(
        "orbital_elements",
        1.5,
        longArc,
        "optical_astrometry"
      );
      const shortAssignment = engine.assignUncertainty(
        "orbital_elements",
        1.5,
        shortArc,
        "optical_astrometry"
      );

      expect(shortAssignment.uncertainty).toBeGreaterThan(
        longAssignment.uncertainty
      );
    });

    it("should assign higher uncertainty for fewer observations", () => {
      const manyObs = createMockDataQuality({ numberOfObservations: 200 });
      const fewObs = createMockDataQuality({ numberOfObservations: 10 });

      const manyAssignment = engine.assignUncertainty(
        "diameter",
        1000,
        manyObs,
        "photometry"
      );
      const fewAssignment = engine.assignUncertainty(
        "diameter",
        1000,
        fewObs,
        "photometry"
      );

      expect(fewAssignment.uncertainty).toBeGreaterThan(
        manyAssignment.uncertainty
      );
    });

    it("should include correlations for related parameters", () => {
      const dataQuality = createMockDataQuality();

      const diameterAssignment = engine.assignUncertainty(
        "diameter",
        1000,
        dataQuality,
        "photometry"
      );
      const massAssignment = engine.assignUncertainty(
        "mass",
        1e12,
        dataQuality,
        "density_volume"
      );

      expect(diameterAssignment.correlations).toBeDefined();
      expect(massAssignment.correlations).toBeDefined();
    });

    it("should handle different parameter types", () => {
      const dataQuality = createMockDataQuality();
      const parameters = [
        "diameter",
        "mass",
        "density",
        "orbital_elements",
        "absolute_magnitude",
      ];

      for (const param of parameters) {
        const assignment = engine.assignUncertainty(
          param,
          100,
          dataQuality,
          "default"
        );

        expect(assignment.value).toBe(100);
        expect(assignment.uncertainty).toBeGreaterThan(0);
        expect(assignment.uncertaintyType).toBeDefined();
        expect(assignment.confidenceLevel).toBeGreaterThan(0);
        expect(assignment.source).toBeDefined();
      }
    });
  });

  describe("classifyDataQuality", () => {
    it("should classify high quality data", () => {
      const quality = engine.classifyDataQuality(
        1500, // Long arc
        150, // Many observations
        ["radar", "spectroscopy"], // Good methods
        15 // Long data span
      );

      expect(quality).toBe("HIGH");
    });

    it("should classify medium quality data", () => {
      const quality = engine.classifyDataQuality(
        400, // Medium arc
        75, // Medium observations
        ["photometry"], // Standard method
        3 // Medium data span
      );

      expect(quality).toBe("MEDIUM");
    });

    it("should classify low quality data", () => {
      const quality = engine.classifyDataQuality(
        30, // Short arc
        5, // Few observations
        ["survey"], // Basic method
        0.5 // Short data span
      );

      expect(quality).toBe("LOW");
    });

    it("should give bonus for radar observations", () => {
      const withRadar = engine.classifyDataQuality(100, 20, ["radar"], 1);
      const withoutRadar = engine.classifyDataQuality(
        100,
        20,
        ["photometry"],
        1
      );

      // With radar should be better quality (or at least not worse)
      const qualityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      expect(qualityOrder[withRadar]).toBeGreaterThanOrEqual(
        qualityOrder[withoutRadar]
      );
    });
  });

  describe("monteCarloAnalysis", () => {
    it("should perform Monte Carlo analysis", () => {
      const parameters = new Map<string, UncertaintyAssignment>();
      parameters.set("x", {
        value: 10,
        uncertainty: 1,
        uncertaintyType: "statistical",
        confidenceLevel: 0.68,
        source: "test",
      });
      parameters.set("y", {
        value: 5,
        uncertainty: 0.5,
        uncertaintyType: "statistical",
        confidenceLevel: 0.68,
        source: "test",
      });

      // Simple calculation: z = x + y
      const calculation = (params: Map<string, number>) => {
        return params.get("x")! + params.get("y")!;
      };

      const result = engine.monteCarloAnalysis(parameters, calculation, 1000);

      expect(result.mean).toBeCloseTo(15, 0); // 10 + 5
      expect(result.standardDeviation).toBeGreaterThan(0);
      expect(result.percentiles.p50).toBeCloseTo(result.mean, 0);
      expect(result.percentiles.p16).toBeLessThan(result.percentiles.p84);
      expect(result.samples.length).toBeGreaterThan(500); // Should have most samples
      expect(typeof result.convergenceAchieved).toBe("boolean");
    });

    it("should handle calculation errors gracefully", () => {
      const parameters = new Map<string, UncertaintyAssignment>();
      parameters.set("x", {
        value: 1,
        uncertainty: 0.1,
        uncertaintyType: "statistical",
        confidenceLevel: 0.68,
        source: "test",
      });

      // Calculation that might fail for some values
      const calculation = (params: Map<string, number>) => {
        const x = params.get("x")!;
        if (x <= 0) throw new Error("Invalid value");
        return Math.log(x);
      };

      expect(() => {
        engine.monteCarloAnalysis(parameters, calculation, 1000);
      }).not.toThrow();
    });

    it("should throw error if too many samples fail", () => {
      const parameters = new Map<string, UncertaintyAssignment>();
      parameters.set("x", {
        value: 0,
        uncertainty: 1,
        uncertaintyType: "statistical",
        confidenceLevel: 0.68,
        source: "test",
      });

      // Calculation that always fails
      const calculation = (params: Map<string, number>) => {
        throw new Error("Always fails");
      };

      expect(() => {
        engine.monteCarloAnalysis(parameters, calculation, 100);
      }).toThrow("Monte Carlo analysis failed");
    });
  });

  describe("propagateLinearUncertainty", () => {
    it("should propagate uncertainty for linear combinations", () => {
      const terms = [
        { value: 10, uncertainty: 1, coefficient: 2 },
        { value: 5, uncertainty: 0.5, coefficient: -1 },
      ];

      const result = engine.propagateLinearUncertainty(terms);

      expect(result.value).toBeCloseTo(15, 6); // 2*10 + (-1)*5 = 15

      // σ² = (2*1)² + (-1*0.5)² = 4 + 0.25 = 4.25
      const expectedUncertainty = Math.sqrt(4.25);
      expect(result.uncertainty).toBeCloseTo(expectedUncertainty, 6);
    });

    it("should handle single term", () => {
      const terms = [{ value: 10, uncertainty: 2, coefficient: 3 }];

      const result = engine.propagateLinearUncertainty(terms);

      expect(result.value).toBe(30);
      expect(result.uncertainty).toBe(6); // 3 * 2
    });

    it("should handle zero coefficients", () => {
      const terms = [
        { value: 10, uncertainty: 1, coefficient: 0 },
        { value: 5, uncertainty: 0.5, coefficient: 2 },
      ];

      const result = engine.propagateLinearUncertainty(terms);

      expect(result.value).toBe(10); // 0*10 + 2*5
      expect(result.uncertainty).toBe(1); // sqrt((0*1)² + (2*0.5)²) = 1
    });
  });

  describe("propagateMultiplicativeUncertainty", () => {
    it("should propagate uncertainty for multiplication", () => {
      const factors = [
        { value: 10, uncertainty: 1 }, // 10% relative uncertainty
        { value: 5, uncertainty: 0.5 }, // 10% relative uncertainty
      ];

      const result = engine.propagateMultiplicativeUncertainty(factors);

      expect(result.value).toBe(50); // 10 * 5

      // Relative uncertainty: sqrt((0.1)² + (0.1)²) = sqrt(0.02) ≈ 0.141
      // Absolute uncertainty: 50 * 0.141 ≈ 7.07
      expect(result.uncertainty).toBeCloseTo(7.07, 1);
    });

    it("should handle exponents", () => {
      const factors = [
        { value: 2, uncertainty: 0.1, exponent: 3 }, // 2³ = 8
      ];

      const result = engine.propagateMultiplicativeUncertainty(factors);

      expect(result.value).toBe(8);

      // Relative uncertainty: 3 * (0.1/2) = 0.15
      // Absolute uncertainty: 8 * 0.15 = 1.2
      expect(result.uncertainty).toBeCloseTo(1.2, 6);
    });

    it("should handle division (negative exponents)", () => {
      const factors = [
        { value: 10, uncertainty: 1 },
        { value: 2, uncertainty: 0.1, exponent: -1 }, // Division by 2
      ];

      const result = engine.propagateMultiplicativeUncertainty(factors);

      expect(result.value).toBe(5); // 10 / 2
      expect(result.uncertainty).toBeGreaterThan(0);
    });
  });

  describe("edge cases and error handling", () => {
    it("should handle zero values gracefully", () => {
      const dataQuality = createMockDataQuality();

      const assignment = engine.assignUncertainty(
        "diameter",
        0,
        dataQuality,
        "photometry"
      );

      expect(assignment.value).toBe(0);
      expect(assignment.uncertainty).toBeGreaterThanOrEqual(0);
    });

    it("should handle negative values", () => {
      const dataQuality = createMockDataQuality();

      const assignment = engine.assignUncertainty(
        "orbital_elements",
        -1.5,
        dataQuality,
        "astrometry"
      );

      expect(assignment.value).toBe(-1.5);
      expect(assignment.uncertainty).toBeGreaterThan(0);
    });

    it("should handle very small uncertainties", () => {
      const dataQuality = createMockDataQuality({
        observationQuality: "excellent",
        observationMethods: ["radar"],
      });

      const assignment = engine.assignUncertainty(
        "diameter",
        1000,
        dataQuality,
        "radar"
      );

      expect(assignment.uncertainty).toBeGreaterThan(0);
      expect(assignment.uncertainty).toBeLessThan(assignment.value);
    });

    it("should handle unknown parameters", () => {
      const dataQuality = createMockDataQuality();

      const assignment = engine.assignUncertainty(
        "unknown_parameter",
        100,
        dataQuality,
        "unknown_method"
      );

      expect(assignment.value).toBe(100);
      expect(assignment.uncertainty).toBeGreaterThan(0);
      expect(assignment.uncertaintyType).toBe("combined");
    });

    it("should handle empty observation methods", () => {
      const dataQuality = createMockDataQuality({ observationMethods: [] });

      const quality = engine.classifyDataQuality(
        dataQuality.observationArcDays,
        dataQuality.numberOfObservations,
        dataQuality.observationMethods,
        dataQuality.dataSpan
      );

      expect(["HIGH", "MEDIUM", "LOW"]).toContain(quality);
    });
  });

  describe("consistency checks", () => {
    it("should have reasonable uncertainty ranges", () => {
      const dataQuality = createMockDataQuality();
      const parameters = ["diameter", "mass", "density"];

      for (const param of parameters) {
        const assignment = engine.assignUncertainty(
          param,
          1000,
          dataQuality,
          "default"
        );

        // Uncertainty should be reasonable fraction of value
        const relativeUncertainty =
          assignment.uncertainty / Math.abs(assignment.value);
        expect(relativeUncertainty).toBeGreaterThan(0);
        expect(relativeUncertainty).toBeLessThan(2); // Less than 200%
      }
    });

    it("should have consistent confidence levels", () => {
      const qualities: Array<DataQualityMetrics["observationQuality"]> = [
        "excellent",
        "good",
        "fair",
        "poor",
      ];

      let previousConfidence = 1.0;

      for (const quality of qualities) {
        const dataQuality = createMockDataQuality({
          observationQuality: quality,
        });
        const assignment = engine.assignUncertainty(
          "diameter",
          1000,
          dataQuality,
          "photometry"
        );

        // Confidence should decrease or stay same as quality decreases
        expect(assignment.confidenceLevel).toBeLessThanOrEqual(
          previousConfidence
        );
        previousConfidence = assignment.confidenceLevel;
      }
    });

    it("should maintain correlation symmetry", () => {
      const dataQuality = createMockDataQuality();

      const assignment1 = engine.assignUncertainty(
        "diameter",
        1000,
        dataQuality,
        "photometry"
      );
      const assignment2 = engine.assignUncertainty(
        "mass",
        1e12,
        dataQuality,
        "density_volume"
      );

      if (assignment1.correlations && assignment2.correlations) {
        const corr12 = assignment1.correlations.get("mass");
        const corr21 = assignment2.correlations.get("diameter");

        if (corr12 !== undefined && corr21 !== undefined) {
          expect(corr12).toBeCloseTo(corr21, 6);
        }
      }
    });
  });
});
