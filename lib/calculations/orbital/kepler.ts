/**
 * Enhanced Kepler Equation Solver
 * Implements adaptive Newton-Raphson iteration with proper convergence criteria
 * Handles elliptical, parabolic, and hyperbolic orbits with numerical stability
 */

import { UncertaintyValue } from "../../physics/constants";
import { UnitConverter } from "../../physics/units";

/**
 * Orbit type classification
 */
export enum OrbitType {
  ELLIPTICAL = "elliptical",
  PARABOLIC = "parabolic",
  HYPERBOLIC = "hyperbolic",
}

/**
 * Kepler solver configuration
 */
export interface KeplerSolverConfig {
  tolerance: number;
  maxIterations: number;
  adaptiveTolerance: boolean;
  stabilityChecks: boolean;
}

/**
 * Default solver configuration
 */
export const DEFAULT_KEPLER_CONFIG: KeplerSolverConfig = {
  tolerance: 1e-12,
  maxIterations: 100,
  adaptiveTolerance: true,
  stabilityChecks: true,
};

/**
 * Kepler equation solution result
 */
export interface KeplerSolutionResult {
  eccentricAnomaly?: number; // For elliptical orbits (E)
  hyperbolicAnomaly?: number; // For hyperbolic orbits (H)
  trueAnomaly: number; // True anomaly (ν)
  orbitType: OrbitType;
  iterations: number;
  converged: boolean;
  residual: number;
  warnings: string[];
}

/**
 * Enhanced Kepler equation solver with adaptive convergence
 */
export class KeplerSolver {
  private config: KeplerSolverConfig;

  constructor(config: Partial<KeplerSolverConfig> = {}) {
    this.config = { ...DEFAULT_KEPLER_CONFIG, ...config };
  }

  /**
   * Solve Kepler's equation for any orbit type
   * @param meanAnomaly Mean anomaly (radians)
   * @param eccentricity Orbital eccentricity
   * @returns Solution result with eccentric/hyperbolic anomaly and true anomaly
   */
  solve(meanAnomaly: number, eccentricity: number): KeplerSolutionResult {
    const warnings: string[] = [];

    // Validate inputs
    if (eccentricity < 0) {
      throw new Error("Eccentricity cannot be negative");
    }

    // Determine orbit type
    const orbitType = this.classifyOrbit(eccentricity);

    // Handle extreme eccentricity cases
    if (this.config.stabilityChecks) {
      if (eccentricity > 0.9 && eccentricity < 1.0) {
        warnings.push(
          "High eccentricity elliptical orbit - numerical precision may be limited"
        );
      }
      if (Math.abs(eccentricity - 1.0) < 1e-8) {
        warnings.push(
          "Near-parabolic orbit - consider using parabolic orbit equations"
        );
      }
    }

    let result: KeplerSolutionResult;

    switch (orbitType) {
      case OrbitType.ELLIPTICAL:
        result = this.solveElliptical(meanAnomaly, eccentricity);
        break;
      case OrbitType.PARABOLIC:
        result = this.solveParabolic(meanAnomaly);
        break;
      case OrbitType.HYPERBOLIC:
        result = this.solveHyperbolic(meanAnomaly, eccentricity);
        break;
      default:
        throw new Error(`Unsupported orbit type: ${orbitType}`);
    }

    result.warnings = [...result.warnings, ...warnings];
    return result;
  }

  /**
   * Classify orbit type based on eccentricity
   */
  private classifyOrbit(eccentricity: number): OrbitType {
    if (eccentricity < 1.0) {
      return OrbitType.ELLIPTICAL;
    } else if (Math.abs(eccentricity - 1.0) < 1e-10) {
      return OrbitType.PARABOLIC;
    } else {
      return OrbitType.HYPERBOLIC;
    }
  }

  /**
   * Solve Kepler's equation for elliptical orbits
   * E - e*sin(E) = M
   */
  private solveElliptical(
    meanAnomaly: number,
    eccentricity: number
  ): KeplerSolutionResult {
    const warnings: string[] = [];

    // Normalize mean anomaly to [0, 2π]
    const M = this.normalizeAngle(meanAnomaly);

    // Initial guess using smart starting value
    let E = this.getEllipticalInitialGuess(M, eccentricity);

    // Adaptive tolerance based on eccentricity
    let tolerance = this.config.tolerance;
    if (this.config.adaptiveTolerance) {
      tolerance = Math.max(this.config.tolerance, 1e-15 / (1 - eccentricity));
    }

    let iterations = 0;
    let converged = false;
    let residual = Number.POSITIVE_INFINITY;

    // Newton-Raphson iteration with adaptive step size
    while (iterations < this.config.maxIterations && !converged) {
      const f = E - eccentricity * Math.sin(E) - M;
      const fp = 1 - eccentricity * Math.cos(E);

      // Check for numerical issues
      if (Math.abs(fp) < 1e-15) {
        warnings.push("Near-singular derivative in Newton-Raphson iteration");
        break;
      }

      const delta = f / fp;

      // Adaptive step size for stability
      let stepSize = 1.0;
      if (Math.abs(delta) > 0.5) {
        stepSize = 0.5 / Math.abs(delta);
      }

      E = E - stepSize * delta;
      residual = Math.abs(f);

      converged = residual < tolerance;
      iterations++;

      // Stability check for oscillation
      if (this.config.stabilityChecks && iterations > 10) {
        if (Math.abs(delta) > Math.abs(f)) {
          warnings.push(
            "Potential oscillation detected in Newton-Raphson iteration"
          );
        }
      }
    }

    if (!converged) {
      warnings.push(
        `Failed to converge after ${iterations} iterations (residual: ${residual})`
      );
    }

    // Calculate true anomaly
    const trueAnomaly = this.eccentricToTrueAnomaly(E, eccentricity);

    return {
      eccentricAnomaly: E,
      trueAnomaly,
      orbitType: OrbitType.ELLIPTICAL,
      iterations,
      converged,
      residual,
      warnings,
    };
  }

  /**
   * Solve for parabolic orbits using Barker's equation
   * t = q^(3/2) * (tan(ν/2) + tan³(ν/2)/3) / √μ
   */
  private solveParabolic(meanAnomaly: number): KeplerSolutionResult {
    const warnings: string[] = [];

    // For parabolic orbits, we solve Barker's equation iteratively
    // This is a simplified implementation - full parabolic orbit solution
    // requires more sophisticated numerical methods

    let trueAnomaly = meanAnomaly; // Initial guess
    let iterations = 0;
    let converged = false;
    let residual = Number.POSITIVE_INFINITY;

    // Simplified iterative solution
    while (iterations < this.config.maxIterations && !converged) {
      const tanHalfNu = Math.tan(trueAnomaly / 2);
      const f = tanHalfNu + Math.pow(tanHalfNu, 3) / 3 - meanAnomaly;
      const fp =
        0.5 * (1 + Math.pow(tanHalfNu, 2)) * (1 + Math.pow(tanHalfNu, 2));

      if (Math.abs(fp) < 1e-15) {
        warnings.push("Near-singular derivative in parabolic orbit solution");
        break;
      }

      const delta = f / fp;
      trueAnomaly = trueAnomaly - delta;
      residual = Math.abs(f);

      converged = residual < this.config.tolerance;
      iterations++;
    }

    if (!converged) {
      warnings.push(
        `Parabolic orbit solution failed to converge after ${iterations} iterations`
      );
    }

    return {
      trueAnomaly,
      orbitType: OrbitType.PARABOLIC,
      iterations,
      converged,
      residual,
      warnings,
    };
  }

  /**
   * Solve Kepler's equation for hyperbolic orbits
   * e*sinh(H) - H = M
   */
  private solveHyperbolic(
    meanAnomaly: number,
    eccentricity: number
  ): KeplerSolutionResult {
    const warnings: string[] = [];

    // Initial guess for hyperbolic anomaly
    let H = this.getHyperbolicInitialGuess(meanAnomaly, eccentricity);

    let iterations = 0;
    let converged = false;
    let residual = Number.POSITIVE_INFINITY;

    // Newton-Raphson iteration for hyperbolic case
    while (iterations < this.config.maxIterations && !converged) {
      const f = eccentricity * Math.sinh(H) - H - meanAnomaly;
      const fp = eccentricity * Math.cosh(H) - 1;

      if (Math.abs(fp) < 1e-15) {
        warnings.push("Near-singular derivative in hyperbolic orbit solution");
        break;
      }

      const delta = f / fp;
      H = H - delta;
      residual = Math.abs(f);

      converged = residual < this.config.tolerance;
      iterations++;
    }

    if (!converged) {
      warnings.push(
        `Hyperbolic orbit solution failed to converge after ${iterations} iterations`
      );
    }

    // Calculate true anomaly from hyperbolic anomaly
    const trueAnomaly = this.hyperbolicToTrueAnomaly(H, eccentricity);

    return {
      hyperbolicAnomaly: H,
      trueAnomaly,
      orbitType: OrbitType.HYPERBOLIC,
      iterations,
      converged,
      residual,
      warnings,
    };
  }

  /**
   * Smart initial guess for elliptical orbits
   */
  private getEllipticalInitialGuess(
    meanAnomaly: number,
    eccentricity: number
  ): number {
    // Use different strategies based on eccentricity and mean anomaly
    if (eccentricity < 0.8) {
      // For moderate eccentricity, use mean anomaly as starting point
      return meanAnomaly + eccentricity * Math.sin(meanAnomaly);
    } else {
      // For high eccentricity, use more sophisticated guess
      const sign = meanAnomaly < Math.PI ? 1 : -1;
      return meanAnomaly + sign * eccentricity;
    }
  }

  /**
   * Initial guess for hyperbolic orbits
   */
  private getHyperbolicInitialGuess(
    meanAnomaly: number,
    eccentricity: number
  ): number {
    // For hyperbolic orbits, use logarithmic initial guess
    if (Math.abs(meanAnomaly) < 1) {
      return meanAnomaly / (eccentricity - 1);
    } else {
      return (
        Math.sign(meanAnomaly) *
        Math.log((2 * Math.abs(meanAnomaly)) / eccentricity + 1.8)
      );
    }
  }

  /**
   * Convert eccentric anomaly to true anomaly for elliptical orbits
   */
  private eccentricToTrueAnomaly(
    eccentricAnomaly: number,
    eccentricity: number
  ): number {
    const cosE = Math.cos(eccentricAnomaly);
    const sinE = Math.sin(eccentricAnomaly);

    const cosNu = (cosE - eccentricity) / (1 - eccentricity * cosE);
    const sinNu =
      (Math.sqrt(1 - eccentricity * eccentricity) * sinE) /
      (1 - eccentricity * cosE);

    return Math.atan2(sinNu, cosNu);
  }

  /**
   * Convert hyperbolic anomaly to true anomaly for hyperbolic orbits
   */
  private hyperbolicToTrueAnomaly(
    hyperbolicAnomaly: number,
    eccentricity: number
  ): number {
    const coshH = Math.cosh(hyperbolicAnomaly);
    const sinhH = Math.sinh(hyperbolicAnomaly);

    const cosNu = (eccentricity - coshH) / (eccentricity * coshH - 1);
    const sinNu =
      (Math.sqrt(eccentricity * eccentricity - 1) * sinhH) /
      (eccentricity * coshH - 1);

    return Math.atan2(sinNu, cosNu);
  }

  /**
   * Normalize angle to [0, 2π] range
   */
  private normalizeAngle(angle: number): number {
    const twoPi = 2 * Math.PI;
    let normalized = angle % twoPi;
    if (normalized < 0) {
      normalized += twoPi;
    }
    return normalized;
  }
}

/**
 * Convenience function for solving Kepler's equation with default settings
 */
export function solveKeplersEquation(
  meanAnomaly: number,
  eccentricity: number,
  config?: Partial<KeplerSolverConfig>
): KeplerSolutionResult {
  const solver = new KeplerSolver(config);
  return solver.solve(meanAnomaly, eccentricity);
}

/**
 * Calculate orbital radius from eccentric anomaly (elliptical orbits)
 */
export function calculateOrbitalRadius(
  semiMajorAxis: number,
  eccentricity: number,
  eccentricAnomaly: number
): number {
  return semiMajorAxis * (1 - eccentricity * Math.cos(eccentricAnomaly));
}

/**
 * Calculate orbital radius from true anomaly (any orbit type)
 */
export function calculateRadiusFromTrueAnomaly(
  semiMajorAxis: number,
  eccentricity: number,
  trueAnomaly: number
): number {
  if (eccentricity < 1.0) {
    // Elliptical orbit
    return (
      (semiMajorAxis * (1 - eccentricity * eccentricity)) /
      (1 + eccentricity * Math.cos(trueAnomaly))
    );
  } else if (eccentricity > 1.0) {
    // Hyperbolic orbit (semiMajorAxis is negative)
    return (
      (Math.abs(semiMajorAxis) * (eccentricity * eccentricity - 1)) /
      (1 + eccentricity * Math.cos(trueAnomaly))
    );
  } else {
    // Parabolic orbit (use periapsis distance)
    const periapsisDistance = semiMajorAxis; // For parabolic orbits, this is the periapsis distance
    return (2 * periapsisDistance) / (1 + Math.cos(trueAnomaly));
  }
}

/**
 * Validate orbital elements for Kepler equation solving
 */
export function validateOrbitalElements(
  semiMajorAxis: number,
  eccentricity: number,
  meanAnomaly: number
): { isValid: boolean; warnings: string[]; errors: string[] } {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Validate eccentricity
  if (eccentricity < 0) {
    errors.push("Eccentricity cannot be negative");
  }
  if (eccentricity > 10) {
    warnings.push(
      "Very high eccentricity - numerical precision may be limited"
    );
  }

  // Validate semi-major axis
  if (eccentricity < 1.0 && semiMajorAxis <= 0) {
    errors.push("Semi-major axis must be positive for elliptical orbits");
  }
  if (eccentricity > 1.0 && semiMajorAxis >= 0) {
    errors.push("Semi-major axis must be negative for hyperbolic orbits");
  }

  // Validate mean anomaly
  if (!isFinite(meanAnomaly)) {
    errors.push("Mean anomaly must be finite");
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}
