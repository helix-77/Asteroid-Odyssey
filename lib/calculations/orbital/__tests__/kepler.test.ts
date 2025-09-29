/**
 * Comprehensive tests for enhanced Kepler equation solver
 * Tests all orbit types, edge cases, and numerical stability
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  KeplerSolver,
  solveKeplersEquation,
  calculateOrbitalRadius,
  calculateRadiusFromTrueAnomaly,
  validateOrbitalElements,
  OrbitType,
  DEFAULT_KEPLER_CONFIG,
} from "../kepler";

describe("KeplerSolver", () => {
  let solver: KeplerSolver;

  beforeEach(() => {
    solver = new KeplerSolver();
  });

  describe("Elliptical Orbits", () => {
    it("should solve circular orbit (e=0)", () => {
      const meanAnomaly = Math.PI / 4; // 45 degrees
      const eccentricity = 0;

      const result = solver.solve(meanAnomaly, eccentricity);

      expect(result.orbitType).toBe(OrbitType.ELLIPTICAL);
      expect(result.converged).toBe(true);
      expect(result.eccentricAnomaly).toBeCloseTo(meanAnomaly, 10);
      expect(result.trueAnomaly).toBeCloseTo(meanAnomaly, 10);
      expect(result.iterations).toBeLessThan(5);
    });

    it("should solve moderate eccentricity orbit (e=0.5)", () => {
      const meanAnomaly = Math.PI / 3; // 60 degrees
      const eccentricity = 0.5;

      const result = solver.solve(meanAnomaly, eccentricity);

      expect(result.orbitType).toBe(OrbitType.ELLIPTICAL);
      expect(result.converged).toBe(true);
      expect(result.eccentricAnomaly).toBeDefined();
      expect(result.trueAnomaly).toBeDefined();
      expect(result.residual).toBeLessThan(1e-12);

      // Verify Kepler's equation: E - e*sin(E) = M
      const E = result.eccentricAnomaly!;
      const keplerCheck = E - eccentricity * Math.sin(E);
      expect(keplerCheck).toBeCloseTo(meanAnomaly, 10);
    });

    it("should handle high eccentricity orbit (e=0.95)", () => {
      const meanAnomaly = Math.PI / 6; // 30 degrees
      const eccentricity = 0.95;

      const result = solver.solve(meanAnomaly, eccentricity);

      expect(result.orbitType).toBe(OrbitType.ELLIPTICAL);
      expect(result.converged).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0); // Should warn about high eccentricity

      // Verify solution accuracy
      const E = result.eccentricAnomaly!;
      const keplerCheck = E - eccentricity * Math.sin(E);
      expect(keplerCheck).toBeCloseTo(meanAnomaly, 8); // Slightly lower precision for high e
    });

    it("should handle extreme eccentricity orbit (e=0.999)", () => {
      const meanAnomaly = Math.PI / 12; // 15 degrees
      const eccentricity = 0.999;

      const result = solver.solve(meanAnomaly, eccentricity);

      expect(result.orbitType).toBe(OrbitType.ELLIPTICAL);
      expect(result.converged).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);

      // Should still maintain reasonable accuracy
      const E = result.eccentricAnomaly!;
      const keplerCheck = E - eccentricity * Math.sin(E);
      expect(Math.abs(keplerCheck - meanAnomaly)).toBeLessThan(1e-6);
    });

    it("should handle all quadrants correctly", () => {
      const eccentricity = 0.3;
      const testAngles = [
        Math.PI / 6, // 30°
        Math.PI / 2, // 90°
        (2 * Math.PI) / 3, // 120°
        Math.PI, // 180°
        (4 * Math.PI) / 3, // 240°
        (3 * Math.PI) / 2, // 270°
        (5 * Math.PI) / 3, // 300°
        2 * Math.PI - 0.1, // Near 360°
      ];

      testAngles.forEach((meanAnomaly) => {
        const result = solver.solve(meanAnomaly, eccentricity);

        expect(result.converged).toBe(true);
        expect(result.orbitType).toBe(OrbitType.ELLIPTICAL);

        // Verify Kepler's equation
        const E = result.eccentricAnomaly!;
        const keplerCheck = E - eccentricity * Math.sin(E);
        const normalizedM = meanAnomaly % (2 * Math.PI);
        expect(keplerCheck).toBeCloseTo(normalizedM, 10);
      });
    });
  });

  describe("Hyperbolic Orbits", () => {
    it("should solve moderate hyperbolic orbit (e=1.5)", () => {
      const meanAnomaly = 1.0; // Hyperbolic mean anomaly
      const eccentricity = 1.5;

      const result = solver.solve(meanAnomaly, eccentricity);

      expect(result.orbitType).toBe(OrbitType.HYPERBOLIC);
      expect(result.converged).toBe(true);
      expect(result.hyperbolicAnomaly).toBeDefined();
      expect(result.trueAnomaly).toBeDefined();

      // Verify hyperbolic Kepler's equation: e*sinh(H) - H = M
      const H = result.hyperbolicAnomaly!;
      const keplerCheck = eccentricity * Math.sinh(H) - H;
      expect(keplerCheck).toBeCloseTo(meanAnomaly, 10);
    });

    it("should solve high hyperbolic orbit (e=5.0)", () => {
      const meanAnomaly = 2.0;
      const eccentricity = 5.0;

      const result = solver.solve(meanAnomaly, eccentricity);

      expect(result.orbitType).toBe(OrbitType.HYPERBOLIC);
      expect(result.converged).toBe(true);

      // Verify solution
      const H = result.hyperbolicAnomaly!;
      const keplerCheck = eccentricity * Math.sinh(H) - H;
      expect(keplerCheck).toBeCloseTo(meanAnomaly, 8);
    });

    it("should handle negative mean anomaly for hyperbolic orbits", () => {
      const meanAnomaly = -1.5;
      const eccentricity = 2.0;

      const result = solver.solve(meanAnomaly, eccentricity);

      expect(result.orbitType).toBe(OrbitType.HYPERBOLIC);
      expect(result.converged).toBe(true);
      expect(result.hyperbolicAnomaly).toBeLessThan(0);
    });
  });

  describe("Parabolic Orbits", () => {
    it("should handle near-parabolic orbit (e=1.0)", () => {
      const meanAnomaly = 0.5;
      const eccentricity = 1.0;

      const result = solver.solve(meanAnomaly, eccentricity);

      expect(result.orbitType).toBe(OrbitType.PARABOLIC);
      expect(result.converged).toBe(true);
      expect(result.trueAnomaly).toBeDefined();
    });

    it("should warn about near-parabolic orbits", () => {
      const meanAnomaly = 0.5;
      const eccentricity = 1.0000000001; // Very close to 1

      const result = solver.solve(meanAnomaly, eccentricity);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.includes("parabolic"))).toBe(true);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should throw error for negative eccentricity", () => {
      expect(() => {
        solver.solve(1.0, -0.1);
      }).toThrow("Eccentricity cannot be negative");
    });

    it("should handle very small mean anomaly", () => {
      const result = solver.solve(1e-15, 0.5);
      expect(result.converged).toBe(true);
    });

    it("should handle very large mean anomaly", () => {
      const result = solver.solve(100 * Math.PI, 0.3);
      expect(result.converged).toBe(true);
    });

    it("should handle zero mean anomaly", () => {
      const result = solver.solve(0, 0.5);
      expect(result.converged).toBe(true);
      expect(result.eccentricAnomaly).toBeCloseTo(0, 10);
      expect(result.trueAnomaly).toBeCloseTo(0, 10);
    });

    it("should respect maximum iterations limit", () => {
      const customSolver = new KeplerSolver({ maxIterations: 5 });
      const result = customSolver.solve(Math.PI, 0.99);

      expect(result.iterations).toBeLessThanOrEqual(5);
    });

    it("should use adaptive tolerance for high eccentricity", () => {
      const adaptiveSolver = new KeplerSolver({ adaptiveTolerance: true });
      const nonAdaptiveSolver = new KeplerSolver({ adaptiveTolerance: false });

      const meanAnomaly = Math.PI / 4;
      const eccentricity = 0.99;

      const adaptiveResult = adaptiveSolver.solve(meanAnomaly, eccentricity);
      const nonAdaptiveResult = nonAdaptiveSolver.solve(
        meanAnomaly,
        eccentricity
      );

      // Adaptive solver should handle high eccentricity better
      expect(adaptiveResult.converged).toBe(true);
      expect(nonAdaptiveResult.converged).toBe(true);
    });
  });

  describe("Performance and Stability", () => {
    it("should converge quickly for typical orbits", () => {
      const testCases = [
        { M: Math.PI / 6, e: 0.1 },
        { M: Math.PI / 3, e: 0.3 },
        { M: Math.PI / 2, e: 0.5 },
        { M: (2 * Math.PI) / 3, e: 0.7 },
      ];

      testCases.forEach(({ M, e }) => {
        const result = solver.solve(M, e);
        expect(result.converged).toBe(true);
        expect(result.iterations).toBeLessThan(20);
      });
    });

    it("should maintain precision across multiple solves", () => {
      const meanAnomaly = Math.PI / 4;
      const eccentricity = 0.6;

      // Solve multiple times to check consistency
      const results = Array.from({ length: 10 }, () =>
        solver.solve(meanAnomaly, eccentricity)
      );

      const firstResult = results[0];
      results.forEach((result) => {
        expect(result.eccentricAnomaly).toBeCloseTo(
          firstResult.eccentricAnomaly!,
          12
        );
        expect(result.trueAnomaly).toBeCloseTo(firstResult.trueAnomaly, 12);
      });
    });
  });
});

describe("Utility Functions", () => {
  describe("solveKeplersEquation", () => {
    it("should work as convenience function", () => {
      const result = solveKeplersEquation(Math.PI / 3, 0.4);

      expect(result.orbitType).toBe(OrbitType.ELLIPTICAL);
      expect(result.converged).toBe(true);
    });

    it("should accept custom configuration", () => {
      const result = solveKeplersEquation(Math.PI / 3, 0.4, {
        tolerance: 1e-6,
        maxIterations: 50,
      });

      expect(result.converged).toBe(true);
      expect(result.residual).toBeLessThan(1e-6);
    });
  });

  describe("calculateOrbitalRadius", () => {
    it("should calculate radius from eccentric anomaly", () => {
      const semiMajorAxis = 1.0; // AU
      const eccentricity = 0.5;
      const eccentricAnomaly = Math.PI / 3; // 60 degrees

      const radius = calculateOrbitalRadius(
        semiMajorAxis,
        eccentricity,
        eccentricAnomaly
      );
      const expected =
        semiMajorAxis * (1 - eccentricity * Math.cos(eccentricAnomaly));

      expect(radius).toBeCloseTo(expected, 12);
    });

    it("should handle circular orbit", () => {
      const semiMajorAxis = 2.0;
      const eccentricity = 0;
      const eccentricAnomaly = Math.PI / 2;

      const radius = calculateOrbitalRadius(
        semiMajorAxis,
        eccentricity,
        eccentricAnomaly
      );

      expect(radius).toBeCloseTo(semiMajorAxis, 12);
    });
  });

  describe("calculateRadiusFromTrueAnomaly", () => {
    it("should calculate radius for elliptical orbit", () => {
      const semiMajorAxis = 1.5;
      const eccentricity = 0.3;
      const trueAnomaly = Math.PI / 4;

      const radius = calculateRadiusFromTrueAnomaly(
        semiMajorAxis,
        eccentricity,
        trueAnomaly
      );
      const expected =
        (semiMajorAxis * (1 - eccentricity * eccentricity)) /
        (1 + eccentricity * Math.cos(trueAnomaly));

      expect(radius).toBeCloseTo(expected, 12);
    });

    it("should calculate radius for hyperbolic orbit", () => {
      const semiMajorAxis = -1.0; // Negative for hyperbolic
      const eccentricity = 1.5;
      const trueAnomaly = Math.PI / 6;

      const radius = calculateRadiusFromTrueAnomaly(
        semiMajorAxis,
        eccentricity,
        trueAnomaly
      );
      const expected =
        (Math.abs(semiMajorAxis) * (eccentricity * eccentricity - 1)) /
        (1 + eccentricity * Math.cos(trueAnomaly));

      expect(radius).toBeCloseTo(expected, 12);
    });

    it("should calculate radius for parabolic orbit", () => {
      const periapsisDistance = 0.5;
      const eccentricity = 1.0;
      const trueAnomaly = Math.PI / 3;

      const radius = calculateRadiusFromTrueAnomaly(
        periapsisDistance,
        eccentricity,
        trueAnomaly
      );
      const expected = (2 * periapsisDistance) / (1 + Math.cos(trueAnomaly));

      expect(radius).toBeCloseTo(expected, 12);
    });
  });

  describe("validateOrbitalElements", () => {
    it("should validate correct elliptical orbit elements", () => {
      const result = validateOrbitalElements(1.0, 0.5, Math.PI / 3);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect negative eccentricity", () => {
      const result = validateOrbitalElements(1.0, -0.1, Math.PI / 3);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Eccentricity cannot be negative");
    });

    it("should detect invalid semi-major axis for elliptical orbit", () => {
      const result = validateOrbitalElements(-1.0, 0.5, Math.PI / 3);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Semi-major axis must be positive for elliptical orbits"
      );
    });

    it("should detect invalid semi-major axis for hyperbolic orbit", () => {
      const result = validateOrbitalElements(1.0, 1.5, Math.PI / 3);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Semi-major axis must be negative for hyperbolic orbits"
      );
    });

    it("should warn about high eccentricity", () => {
      const result = validateOrbitalElements(1.0, 15.0, Math.PI / 3);

      expect(result.warnings).toContain(
        "Very high eccentricity - numerical precision may be limited"
      );
    });

    it("should detect non-finite mean anomaly", () => {
      const result = validateOrbitalElements(1.0, 0.5, Number.NaN);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Mean anomaly must be finite");
    });
  });
});

describe("Known Asteroid Test Cases", () => {
  it("should solve for asteroid 99942 Apophis orbital elements", () => {
    // Apophis orbital elements (approximate)
    const eccentricity = 0.191;
    const meanAnomaly = 2.094; // radians

    const result = solveKeplersEquation(meanAnomaly, eccentricity);

    expect(result.converged).toBe(true);
    expect(result.orbitType).toBe(OrbitType.ELLIPTICAL);
    expect(result.iterations).toBeLessThan(10);

    // Verify the solution satisfies Kepler's equation
    const E = result.eccentricAnomaly!;
    const keplerCheck = E - eccentricity * Math.sin(E);
    expect(keplerCheck).toBeCloseTo(meanAnomaly, 10);
  });

  it("should solve for comet-like high eccentricity orbit", () => {
    // Halley's comet-like orbit
    const eccentricity = 0.967;
    const meanAnomaly = 0.5;

    const result = solveKeplersEquation(meanAnomaly, eccentricity);

    expect(result.converged).toBe(true);
    expect(result.orbitType).toBe(OrbitType.ELLIPTICAL);
    expect(result.warnings.length).toBeGreaterThan(0); // Should warn about high eccentricity
  });

  it("should solve for interstellar object (hyperbolic)", () => {
    // Oumuamua-like hyperbolic orbit
    const eccentricity = 1.2;
    const meanAnomaly = 1.0;

    const result = solveKeplersEquation(meanAnomaly, eccentricity);

    expect(result.converged).toBe(true);
    expect(result.orbitType).toBe(OrbitType.HYPERBOLIC);

    // Verify hyperbolic Kepler equation
    const H = result.hyperbolicAnomaly!;
    const keplerCheck = eccentricity * Math.sinh(H) - H;
    expect(keplerCheck).toBeCloseTo(meanAnomaly, 8);
  });
});
