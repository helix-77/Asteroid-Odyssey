/**
 * Tests for Orbital Mechanics Benchmarking System
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  OrbitalBenchmarker,
  BENCHMARK_ASTEROIDS,
  getBenchmarkAsteroids,
  getBenchmarkAsteroid,
  OrbitValidationResult,
} from "../orbital-benchmarks";

// Mock the orbital calculation modules
vi.mock("../../orbital/kepler", () => ({
  solveKepler: vi.fn(),
}));

vi.mock("../../orbital/ephemeris", () => ({
  calculatePosition: vi.fn(),
}));

vi.mock("../../orbital/approaches", () => ({
  calculateCloseApproach: vi.fn(),
}));

import { solveKepler } from "../../orbital/kepler";
import { calculatePosition } from "../../orbital/ephemeris";
import { calculateCloseApproach } from "../../orbital/approaches";

const mockSolveKepler = vi.mocked(solveKepler);
const mockCalculatePosition = vi.mocked(calculatePosition);
const mockCalculateCloseApproach = vi.mocked(calculateCloseApproach);

describe("Benchmark Asteroid Data", () => {
  it("should have correct Apophis orbital elements", () => {
    const apophis = BENCHMARK_ASTEROIDS.find((a) => a.designation === "99942");

    expect(apophis).toBeDefined();
    expect(apophis!.name).toBe("Apophis");
    expect(apophis!.elements.semiMajorAxis.value).toBeCloseTo(0.9224, 4);
    expect(apophis!.elements.eccentricity.value).toBeCloseTo(0.1914, 4);
    expect(apophis!.horizonsData.positions).toHaveLength(2);
    expect(apophis!.horizonsData.closeApproaches).toHaveLength(1);
    expect(apophis!.references).toHaveLength(2);
  });

  it("should have correct Icarus orbital elements", () => {
    const icarus = BENCHMARK_ASTEROIDS.find((a) => a.designation === "1566");

    expect(icarus).toBeDefined();
    expect(icarus!.name).toBe("Icarus");
    expect(icarus!.elements.semiMajorAxis.value).toBeCloseTo(1.0778, 4);
    expect(icarus!.elements.eccentricity.value).toBeCloseTo(0.8268, 4);
    expect(icarus!.elements.inclination.value).toBeCloseTo(22.8282, 4);
    expect(icarus!.horizonsData.positions).toHaveLength(2);
  });

  it("should provide access to benchmark asteroids", () => {
    const asteroids = getBenchmarkAsteroids();
    expect(asteroids).toHaveLength(2);
    expect(asteroids[0].designation).toBe("99942");
    expect(asteroids[1].designation).toBe("1566");
  });

  it("should retrieve specific asteroids by designation or name", () => {
    const apophis1 = getBenchmarkAsteroid("99942");
    const apophis2 = getBenchmarkAsteroid("Apophis");
    const icarus = getBenchmarkAsteroid("Icarus");
    const nonexistent = getBenchmarkAsteroid("Ceres");

    expect(apophis1?.name).toBe("Apophis");
    expect(apophis2?.name).toBe("Apophis");
    expect(icarus?.name).toBe("Icarus");
    expect(nonexistent).toBeUndefined();
  });
});

describe("OrbitalBenchmarker", () => {
  let benchmarker: OrbitalBenchmarker;

  beforeEach(() => {
    benchmarker = new OrbitalBenchmarker();
    vi.clearAllMocks();
  });

  describe("validatePositionCalculations", () => {
    it("should validate position calculations against JPL Horizons data", async () => {
      const apophis = BENCHMARK_ASTEROIDS[0];

      // Mock position calculation results
      mockCalculatePosition.mockResolvedValue({
        position: { x: -91200000, y: 118700000, z: 13350000 }, // km
        velocity: { x: -2.0, y: -1.47, z: -0.12 }, // km/s
        positionUncertainty: { x: 1000, y: 1000, z: 1000 }, // km
      });

      const results = await benchmarker.validatePositionCalculations(apophis);

      expect(results).toHaveLength(6); // 2 epochs × 3 components each
      expect(results[0].parameter).toBe("Position X");
      expect(results[0].asteroid).toContain("99942");
      expect(results[0].asteroid).toContain("Apophis");
      expect(results[0].predicted.unit).toBe("AU");
      expect(results[0].reference.unit).toBe("AU");
    });

    it("should handle position calculation errors gracefully", async () => {
      const apophis = BENCHMARK_ASTEROIDS[0];
      mockCalculatePosition.mockRejectedValue(
        new Error("Position calculation failed")
      );

      const results = await benchmarker.validatePositionCalculations(apophis);

      expect(results).toHaveLength(0);
    });
  });

  describe("validateCloseApproaches", () => {
    it("should validate close approach predictions", async () => {
      const apophis = BENCHMARK_ASTEROIDS[0];

      // Mock close approach calculation
      mockCalculateCloseApproach.mockResolvedValue({
        date: 2462240.5,
        distance: {
          value: 0.000256,
          uncertainty: 2e-8,
          unit: "AU",
          source: "Calculated",
        },
        velocity: {
          value: 7.41,
          uncertainty: 0.02,
          unit: "km/s",
          source: "Calculated",
        },
      });

      const results = await benchmarker.validateCloseApproaches(apophis);

      expect(results).toHaveLength(2); // Distance and velocity
      expect(results[0].parameter).toBe("Close Approach Distance");
      expect(results[1].parameter).toBe("Close Approach Velocity");
      expect(results[0].status).toBeDefined(); // Status should be assigned
    });

    it("should handle close approach calculation errors", async () => {
      const apophis = BENCHMARK_ASTEROIDS[0];
      mockCalculateCloseApproach.mockRejectedValue(
        new Error("Close approach calculation failed")
      );

      const results = await benchmarker.validateCloseApproaches(apophis);

      expect(results).toHaveLength(0);
    });
  });

  describe("validateKeplerSolver", () => {
    it("should validate Kepler equation solver accuracy", async () => {
      // Mock Kepler solver results for test cases
      const expectedResults = [0.0, Math.PI / 2, 0.0, Math.PI, 1.0985];

      mockSolveKepler
        .mockResolvedValueOnce(0.0)
        .mockResolvedValueOnce(Math.PI / 2)
        .mockResolvedValueOnce(0.0)
        .mockResolvedValueOnce(Math.PI)
        .mockResolvedValueOnce(1.0984); // Slightly off to test validation

      const results = await benchmarker.validateKeplerSolver();

      expect(results).toHaveLength(5);
      expect(results[0].parameter).toContain("Test Case 1");
      expect(results[0].status).toBe("EXCELLENT");
      expect(results[4].status).toBeDefined(); // Status should be assigned
    });

    it("should handle Kepler solver errors", async () => {
      mockSolveKepler.mockRejectedValue(new Error("Kepler solver failed"));

      const results = await benchmarker.validateKeplerSolver();

      expect(results).toHaveLength(0);
    });
  });

  describe("validateAllOrbitalMechanics", () => {
    it("should run comprehensive validation", async () => {
      // Mock all calculations
      mockSolveKepler.mockResolvedValue(0.0);
      mockCalculatePosition.mockResolvedValue({
        position: { x: -91200000, y: 118700000, z: 13350000 },
        velocity: { x: -2.0, y: -1.47, z: -0.12 },
        positionUncertainty: { x: 1000, y: 1000, z: 1000 },
      });
      mockCalculateCloseApproach.mockResolvedValue({
        date: 2462240.5,
        distance: {
          value: 0.000255,
          uncertainty: 1e-8,
          unit: "AU",
          source: "Test",
        },
        velocity: {
          value: 7.42,
          uncertainty: 0.01,
          unit: "km/s",
          source: "Test",
        },
      });

      const results = await benchmarker.validateAllOrbitalMechanics();

      // Should have results from Kepler solver + position + close approach validations
      expect(results.length).toBeGreaterThan(10);

      const parameterTypes = [...new Set(results.map((r) => r.parameter))];
      expect(parameterTypes).toContain("Position X");
      expect(parameterTypes).toContain("Close Approach Distance");
      expect(parameterTypes.some((p) => p.includes("Test Case"))).toBe(true);
    });
  });

  describe("accuracy statistics calculation", () => {
    it("should calculate comprehensive accuracy statistics", () => {
      const mockResults: OrbitValidationResult[] = [
        {
          asteroid: "Test",
          parameter: "Position X",
          epoch: 2460000.5,
          predicted: {
            value: 1.0,
            uncertainty: 0.01,
            unit: "AU",
            source: "Test",
          },
          reference: {
            value: 1.01,
            uncertainty: 0.005,
            unit: "AU",
            source: "Reference",
          },
          agreement: {
            withinUncertainty: true,
            sigmaDeviation: 0.5,
            percentError: 1.0,
          },
          status: "EXCELLENT",
        },
        {
          asteroid: "Test",
          parameter: "Position Y",
          epoch: 2460000.5,
          predicted: {
            value: 0.5,
            uncertainty: 0.02,
            unit: "AU",
            source: "Test",
          },
          reference: {
            value: 0.52,
            uncertainty: 0.01,
            unit: "AU",
            source: "Reference",
          },
          agreement: {
            withinUncertainty: true,
            sigmaDeviation: 1.2,
            percentError: 4.0,
          },
          status: "GOOD",
        },
        {
          asteroid: "Test",
          parameter: "Position Z",
          epoch: 2460000.5,
          predicted: {
            value: 0.1,
            uncertainty: 0.005,
            unit: "AU",
            source: "Test",
          },
          reference: {
            value: 0.15,
            uncertainty: 0.002,
            unit: "AU",
            source: "Reference",
          },
          agreement: {
            withinUncertainty: false,
            sigmaDeviation: 3.5,
            percentError: 50.0,
          },
          status: "POOR",
        },
      ];

      const stats = benchmarker.calculateAccuracyStatistics(mockResults);

      expect(stats.overallAccuracy).toBeCloseTo(66.7, 1); // 2 out of 3 within uncertainty
      expect(stats.statusDistribution.EXCELLENT).toBe(1);
      expect(stats.statusDistribution.GOOD).toBe(1);
      expect(stats.statusDistribution.POOR).toBe(1);

      expect(stats.parameterStats["Position X"].count).toBe(1);
      expect(stats.parameterStats["Position X"].meanError).toBe(1.0);
      expect(stats.parameterStats["Position X"].withinUncertaintyPercent).toBe(
        100
      );
    });
  });

  describe("benchmark report generation", () => {
    it("should generate comprehensive benchmark report", () => {
      const mockResults: OrbitValidationResult[] = [
        {
          asteroid: "Apophis",
          parameter: "Position X",
          epoch: 2460000.5,
          predicted: {
            value: -0.6089,
            uncertainty: 1e-6,
            unit: "AU",
            source: "Test",
          },
          reference: {
            value: -0.6089,
            uncertainty: 1e-8,
            unit: "AU",
            source: "JPL",
          },
          agreement: {
            withinUncertainty: true,
            sigmaDeviation: 0.1,
            percentError: 0.01,
          },
          status: "EXCELLENT",
        },
      ];

      const report = benchmarker.generateBenchmarkReport(mockResults);

      expect(report).toContain("# Orbital Mechanics Benchmarking Report");
      expect(report).toContain("## Overall Performance");
      expect(report).toContain("**Overall Accuracy**: 100.0%");
      expect(report).toContain("## Status Distribution");
      expect(report).toContain("**EXCELLENT**: 1 (100.0%)");
      expect(report).toContain("## Parameter-Specific Performance");
      expect(report).toContain("### Position X");
      expect(report).toContain("## Detailed Results");
      expect(report).toContain("### Apophis");
    });
  });

  describe("validation status determination", () => {
    it("should correctly classify validation results", () => {
      const testCases = [
        { sigmaDeviation: 0.5, expectedStatus: "EXCELLENT" },
        { sigmaDeviation: 1.5, expectedStatus: "GOOD" },
        { sigmaDeviation: 2.5, expectedStatus: "ACCEPTABLE" },
        { sigmaDeviation: 4.0, expectedStatus: "POOR" },
      ];

      for (const testCase of testCases) {
        // Access private method through any cast for testing
        const status = (benchmarker as any).getValidationStatus(
          testCase.sigmaDeviation
        );
        expect(status).toBe(testCase.expectedStatus);
      }
    });
  });

  describe("value comparison", () => {
    it("should correctly compare values with uncertainty", () => {
      const predicted = {
        value: 1.0,
        uncertainty: 0.1,
        unit: "AU",
        source: "Test",
      };
      const reference = {
        value: 1.05,
        uncertainty: 0.05,
        unit: "AU",
        source: "Reference",
      };

      // Access private method for testing
      const agreement = (benchmarker as any).compareValues(
        predicted,
        reference
      );

      expect(agreement.percentError).toBeCloseTo(4.76, 1);
      expect(agreement.sigmaDeviation).toBeCloseTo(0.447, 2); // 0.05 / sqrt(0.1^2 + 0.05^2)
      expect(agreement.withinUncertainty).toBe(true); // Less than 2 sigma
    });

    it("should handle zero reference values", () => {
      const predicted = {
        value: 0.01,
        uncertainty: 0.001,
        unit: "AU",
        source: "Test",
      };
      const reference = {
        value: 0.0,
        uncertainty: 0.0001,
        unit: "AU",
        source: "Reference",
      };

      const agreement = (benchmarker as any).compareValues(
        predicted,
        reference
      );

      expect(agreement.percentError).toBe(0); // Should handle division by zero
      expect(agreement.sigmaDeviation).toBeGreaterThan(0);
    });
  });
});

describe("Integration Tests", () => {
  it("should have realistic orbital elements for benchmark asteroids", () => {
    const asteroids = getBenchmarkAsteroids();

    for (const asteroid of asteroids) {
      // Semi-major axis should be reasonable for NEOs
      expect(asteroid.elements.semiMajorAxis.value).toBeGreaterThan(0.5);
      expect(asteroid.elements.semiMajorAxis.value).toBeLessThan(5.0);

      // Eccentricity should be valid
      expect(asteroid.elements.eccentricity.value).toBeGreaterThanOrEqual(0);
      expect(asteroid.elements.eccentricity.value).toBeLessThan(1.0);

      // Inclination should be reasonable
      expect(asteroid.elements.inclination.value).toBeGreaterThanOrEqual(0);
      expect(asteroid.elements.inclination.value).toBeLessThan(180);

      // Should have position data
      expect(asteroid.horizonsData.positions.length).toBeGreaterThan(0);

      // Should have scientific references
      expect(asteroid.references.length).toBeGreaterThan(0);
    }
  });

  it("should have consistent units across all data", () => {
    const asteroids = getBenchmarkAsteroids();

    for (const asteroid of asteroids) {
      // Orbital elements should have consistent units
      expect(asteroid.elements.semiMajorAxis.unit).toBe("AU");
      expect(asteroid.elements.eccentricity.unit).toBe("");
      expect(asteroid.elements.inclination.unit).toBe("degrees");

      // Position data should be in consistent units
      for (const pos of asteroid.horizonsData.positions) {
        expect(typeof pos.position.x).toBe("number");
        expect(typeof pos.position.y).toBe("number");
        expect(typeof pos.position.z).toBe("number");
      }

      // Close approach data should have proper units
      for (const approach of asteroid.horizonsData.closeApproaches) {
        expect(approach.distance.unit).toBe("AU");
        expect(approach.velocity.unit).toBe("km/s");
      }
    }
  });

  it("should have reasonable uncertainties", () => {
    const asteroids = getBenchmarkAsteroids();

    for (const asteroid of asteroids) {
      // Orbital element uncertainties should be reasonable fractions
      const elements = asteroid.elements;

      expect(
        elements.semiMajorAxis.uncertainty / elements.semiMajorAxis.value
      ).toBeLessThan(0.01);
      expect(
        elements.eccentricity.uncertainty /
          Math.max(elements.eccentricity.value, 0.001)
      ).toBeLessThan(0.1);

      // Close approach uncertainties should be reasonable
      for (const approach of asteroid.horizonsData.closeApproaches) {
        expect(
          approach.distance.uncertainty / approach.distance.value
        ).toBeLessThan(0.1);
        expect(
          approach.velocity.uncertainty / approach.velocity.value
        ).toBeLessThan(0.1);
      }
    }
  });
});
