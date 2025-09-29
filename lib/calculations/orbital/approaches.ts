/**
 * Accurate Close Approach Calculations
 * Implements Earth orbital motion, gravitational focusing effects,
 * uncertainty propagation, and MOID calculations
 */

import { UncertaintyValue, PHYSICAL_CONSTANTS } from "../../physics/constants";
import { UnitConverter } from "../../physics/units";
import {
  UncertaintyPropagator,
  DistributionType,
  type UncertaintyVariable,
} from "../../physics/uncertainty";
import {
  EphemerisCalculator,
  type JulianDate,
  type CoordinateVector,
  CoordinateFrame,
  TimeScale,
} from "./ephemeris";
import { solveKeplersEquation, type KeplerSolutionResult } from "./kepler";

/**
 * Close approach result with uncertainty
 */
export interface CloseApproachResult {
  date: JulianDate;
  distance: UncertaintyValue; // km
  relativeVelocity: UncertaintyValue; // km/s
  asteroidPosition: CoordinateVector; // km
  earthPosition: CoordinateVector; // km
  relativePosition: CoordinateVector; // km
  impactProbability?: number; // 0-1
  warnings: string[];
}

/**
 * Orbital elements with uncertainty
 */
export interface UncertainOrbitalElements {
  semiMajorAxis: UncertaintyValue; // AU
  eccentricity: UncertaintyValue;
  inclination: UncertaintyValue; // radians
  longitudeOfAscendingNode: UncertaintyValue; // radians
  argumentOfPeriapsis: UncertaintyValue; // radians
  meanAnomalyAtEpoch: UncertaintyValue; // radians
  epoch: JulianDate;
  frame: CoordinateFrame;
  covarianceMatrix?: number[][]; // 6x6 covariance matrix
}

/**
 * MOID (Minimum Orbital Intersection Distance) result
 */
export interface MOIDResult {
  moid: UncertaintyValue; // AU
  asteroidTrueAnomaly: number; // radians
  earthTrueAnomaly: number; // radians
  asteroidPosition: CoordinateVector; // AU
  earthPosition: CoordinateVector; // AU
  convergenceInfo: {
    iterations: number;
    converged: boolean;
    residual: number;
  };
}

/**
 * Earth orbital parameters (simplified)
 */
export const EARTH_ORBITAL_ELEMENTS = {
  semiMajorAxis: new UncertaintyValue(
    1.0,
    0.0,
    "AU",
    "Definition",
    "Earth semi-major axis"
  ),
  eccentricity: new UncertaintyValue(
    0.0167086,
    0.0000001,
    "dimensionless",
    "JPL",
    "Earth eccentricity"
  ),
  inclination: new UncertaintyValue(
    0.0,
    0.0,
    "rad",
    "Definition",
    "Earth inclination to ecliptic"
  ),
  longitudeOfAscendingNode: new UncertaintyValue(
    0.0,
    0.0,
    "rad",
    "Definition",
    "Earth longitude of ascending node"
  ),
  argumentOfPeriapsis: new UncertaintyValue(
    1.796593063,
    0.000000001,
    "rad",
    "JPL",
    "Earth argument of periapsis"
  ),
  meanAnomalyAtEpoch: new UncertaintyValue(
    6.239996277,
    0.000000001,
    "rad",
    "JPL",
    "Earth mean anomaly at J2000.0"
  ),
};

/**
 * Close approach calculator with accurate orbital mechanics
 */
export class CloseApproachCalculator {
  private static readonly EARTH_RADIUS = 6378.137; // km
  private static readonly EARTH_SOI = 924000; // km (approximate sphere of influence)
  private static readonly AU_TO_KM = 149597870.7; // km/AU

  /**
   * Calculate close approaches over a time period
   */
  static calculateCloseApproaches(
    asteroidElements: UncertainOrbitalElements,
    startDate: JulianDate,
    endDate: JulianDate,
    maxDistance: number = 0.1, // AU
    timeStep: number = 1.0 // days
  ): CloseApproachResult[] {
    const approaches: CloseApproachResult[] = [];
    const warnings: string[] = [];

    // Validate inputs
    if (endDate.jd <= startDate.jd) {
      throw new Error("End date must be after start date");
    }

    if (maxDistance <= 0) {
      throw new Error("Maximum distance must be positive");
    }

    // Convert time step to Julian days
    const stepDays = timeStep;
    const totalDays = endDate.jd - startDate.jd;
    const steps = Math.ceil(totalDays / stepDays);

    let previousDistance = Number.POSITIVE_INFINITY;
    let previousAsteroidPos: CoordinateVector | null = null;
    let previousEarthPos: CoordinateVector | null = null;

    for (let i = 0; i <= steps; i++) {
      const currentJD: JulianDate = {
        jd: startDate.jd + i * stepDays,
        timeScale: startDate.timeScale,
      };

      try {
        // Calculate positions
        const asteroidPos = this.calculateAsteroidPosition(
          asteroidElements,
          currentJD
        );
        const earthPos = this.calculateEarthPosition(currentJD);

        // Calculate distance
        const dx = asteroidPos.x - earthPos.x;
        const dy = asteroidPos.y - earthPos.y;
        const dz = asteroidPos.z - earthPos.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        // Check for local minimum (close approach)
        if (
          previousDistance !== Number.POSITIVE_INFINITY &&
          distance > previousDistance &&
          previousDistance <= maxDistance * this.AU_TO_KM
        ) {
          // Refine the close approach time
          const refinedApproach = this.refineCloseApproach(
            asteroidElements,
            {
              jd: currentJD.jd - stepDays,
              timeScale: currentJD.timeScale,
            },
            currentJD,
            previousAsteroidPos!,
            previousEarthPos!
          );

          if (refinedApproach) {
            approaches.push(refinedApproach);
          }
        }

        previousDistance = distance;
        previousAsteroidPos = asteroidPos;
        previousEarthPos = earthPos;
      } catch (error) {
        warnings.push(`Error at ${currentJD.jd}: ${error}`);
      }
    }

    // Add warnings to all results
    approaches.forEach((approach) => {
      approach.warnings.push(...warnings);
    });

    return approaches;
  }

  /**
   * Calculate asteroid position at given time
   */
  private static calculateAsteroidPosition(
    elements: UncertainOrbitalElements,
    time: JulianDate
  ): CoordinateVector {
    // Convert time to same scale as epoch
    const observationTime = EphemerisCalculator.convertTimeScale(
      time,
      elements.epoch.timeScale
    );

    // Time since epoch in days
    const dt = observationTime.jd - elements.epoch.jd;

    // Mean motion (rad/day)
    const mu = 1.32712440018e20; // m³/s² (Solar gravitational parameter)
    const a_m = elements.semiMajorAxis.value * this.AU_TO_KM * 1000; // Convert AU to meters
    const n = Math.sqrt(mu / (a_m * a_m * a_m)) * 86400; // rad/day

    // Current mean anomaly
    const M = elements.meanAnomalyAtEpoch.value + n * dt;

    // Solve Kepler's equation
    const keplerResult = solveKeplersEquation(M, elements.eccentricity.value);

    if (!keplerResult.converged) {
      throw new Error("Kepler equation failed to converge");
    }

    const E = keplerResult.eccentricAnomaly!;
    const nu = keplerResult.trueAnomaly;

    // Distance
    const r =
      elements.semiMajorAxis.value *
      (1 - elements.eccentricity.value * Math.cos(E));

    // Position in orbital plane (AU)
    const x_orb = r * Math.cos(nu);
    const y_orb = r * Math.sin(nu);
    const z_orb = 0;

    // Rotation matrices
    const cosOmega = Math.cos(elements.longitudeOfAscendingNode.value);
    const sinOmega = Math.sin(elements.longitudeOfAscendingNode.value);
    const cosomega = Math.cos(elements.argumentOfPeriapsis.value);
    const sinomega = Math.sin(elements.argumentOfPeriapsis.value);
    const cosi = Math.cos(elements.inclination.value);
    const sini = Math.sin(elements.inclination.value);

    // Transform to heliocentric coordinates (AU)
    const x =
      (cosOmega * cosomega - sinOmega * sinomega * cosi) * x_orb +
      (-cosOmega * sinomega - sinOmega * cosomega * cosi) * y_orb;
    const y =
      (sinOmega * cosomega + cosOmega * sinomega * cosi) * x_orb +
      (-sinOmega * sinomega + cosOmega * cosomega * cosi) * y_orb;
    const z = sinomega * sini * x_orb + cosomega * sini * y_orb;

    return {
      x: x * this.AU_TO_KM, // Convert to km
      y: y * this.AU_TO_KM,
      z: z * this.AU_TO_KM,
      frame: elements.frame,
      epoch: observationTime,
    };
  }

  /**
   * Calculate Earth position at given time
   */
  private static calculateEarthPosition(time: JulianDate): CoordinateVector {
    // Convert to TDB for accurate calculations
    const tdbTime = EphemerisCalculator.convertTimeScale(time, TimeScale.TDB);

    // Time since J2000.0 in centuries
    const T = (tdbTime.jd - 2451545.0) / 36525.0;

    // Earth's mean longitude (simplified VSOP87)
    const L = 280.4664567 + 36000.76982779 * T + 0.0003032028 * T * T;
    const L_rad = ((L * Math.PI) / 180) % (2 * Math.PI);

    // Earth's mean anomaly
    const M = 357.5291092 + 35999.0502909 * T - 0.0001536667 * T * T;
    const M_rad = ((M * Math.PI) / 180) % (2 * Math.PI);

    // Equation of center (simplified)
    const C =
      (1.9146 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M_rad) +
      (0.019993 - 0.000101 * T) * Math.sin(2 * M_rad) +
      0.000289 * Math.sin(3 * M_rad);
    const C_rad = (C * Math.PI) / 180;

    // True longitude
    const nu = L_rad + C_rad;

    // Earth-Sun distance (AU)
    const r =
      1.000001018 *
      (1 - EARTH_ORBITAL_ELEMENTS.eccentricity.value * Math.cos(M_rad));

    // Heliocentric coordinates (km)
    const x = r * Math.cos(nu) * this.AU_TO_KM;
    const y = r * Math.sin(nu) * this.AU_TO_KM;
    const z = 0; // Earth is in ecliptic plane

    return {
      x,
      y,
      z,
      frame: CoordinateFrame.J2000_ECLIPTIC,
      epoch: tdbTime,
    };
  }

  /**
   * Refine close approach time using interpolation
   */
  private static refineCloseApproach(
    asteroidElements: UncertainOrbitalElements,
    startTime: JulianDate,
    endTime: JulianDate,
    startAsteroidPos: CoordinateVector,
    startEarthPos: CoordinateVector
  ): CloseApproachResult | null {
    const maxIterations = 10;
    const tolerance = 1e-6; // days

    let t1 = startTime.jd;
    let t2 = endTime.jd;

    for (let i = 0; i < maxIterations; i++) {
      const t_mid = (t1 + t2) / 2;
      const midTime: JulianDate = { jd: t_mid, timeScale: startTime.timeScale };

      // Calculate positions at three points
      const pos1 = this.calculateRelativePosition(asteroidElements, {
        jd: t1,
        timeScale: startTime.timeScale,
      });
      const pos2 = this.calculateRelativePosition(asteroidElements, midTime);
      const pos3 = this.calculateRelativePosition(asteroidElements, {
        jd: t2,
        timeScale: startTime.timeScale,
      });

      const d1 = Math.sqrt(pos1.x * pos1.x + pos1.y * pos1.y + pos1.z * pos1.z);
      const d2 = Math.sqrt(pos2.x * pos2.x + pos2.y * pos2.y + pos2.z * pos2.z);
      const d3 = Math.sqrt(pos3.x * pos3.x + pos3.y * pos3.y + pos3.z * pos3.z);

      // Find minimum
      if (d1 < d2) {
        t2 = t_mid;
      } else if (d3 < d2) {
        t1 = t_mid;
      } else {
        // Minimum is at t_mid
        if (Math.abs(t2 - t1) < tolerance) {
          return this.createCloseApproachResult(asteroidElements, midTime);
        }

        // Narrow the search
        const dt = (t2 - t1) / 4;
        t1 = t_mid - dt;
        t2 = t_mid + dt;
      }
    }

    // Return best estimate
    const bestTime: JulianDate = {
      jd: (t1 + t2) / 2,
      timeScale: startTime.timeScale,
    };
    return this.createCloseApproachResult(asteroidElements, bestTime);
  }

  /**
   * Calculate relative position (asteroid - Earth)
   */
  private static calculateRelativePosition(
    asteroidElements: UncertainOrbitalElements,
    time: JulianDate
  ): CoordinateVector {
    const asteroidPos = this.calculateAsteroidPosition(asteroidElements, time);
    const earthPos = this.calculateEarthPosition(time);

    return {
      x: asteroidPos.x - earthPos.x,
      y: asteroidPos.y - earthPos.y,
      z: asteroidPos.z - earthPos.z,
      frame: asteroidPos.frame,
      epoch: time,
    };
  }

  /**
   * Create close approach result with uncertainty propagation
   */
  private static createCloseApproachResult(
    asteroidElements: UncertainOrbitalElements,
    time: JulianDate
  ): CloseApproachResult {
    const warnings: string[] = [];

    // Calculate nominal positions
    const asteroidPos = this.calculateAsteroidPosition(asteroidElements, time);
    const earthPos = this.calculateEarthPosition(time);

    const relativePos: CoordinateVector = {
      x: asteroidPos.x - earthPos.x,
      y: asteroidPos.y - earthPos.y,
      z: asteroidPos.z - earthPos.z,
      frame: asteroidPos.frame,
      epoch: time,
    };

    const nominalDistance = Math.sqrt(
      relativePos.x * relativePos.x +
        relativePos.y * relativePos.y +
        relativePos.z * relativePos.z
    );

    // Estimate uncertainty using linear propagation
    let distanceUncertainty = 0;

    if (asteroidElements.covarianceMatrix) {
      // Use full covariance matrix if available
      distanceUncertainty = this.propagateDistanceUncertainty(
        asteroidElements,
        time
      );
    } else {
      // Simple uncertainty estimate
      const relativeUncertainty = Math.max(
        asteroidElements.semiMajorAxis.relativeUncertainty,
        asteroidElements.eccentricity.relativeUncertainty
      );
      distanceUncertainty = nominalDistance * relativeUncertainty;
    }

    // Calculate relative velocity (numerical differentiation)
    const dt = 0.001; // days
    const futureTime: JulianDate = {
      jd: time.jd + dt,
      timeScale: time.timeScale,
    };
    const futureRelativePos = this.calculateRelativePosition(
      asteroidElements,
      futureTime
    );

    const relativeVelocity = {
      x: (futureRelativePos.x - relativePos.x) / (dt * 86400), // km/s
      y: (futureRelativePos.y - relativePos.y) / (dt * 86400),
      z: (futureRelativePos.z - relativePos.z) / (dt * 86400),
    };

    const velocityMagnitude = Math.sqrt(
      relativeVelocity.x * relativeVelocity.x +
        relativeVelocity.y * relativeVelocity.y +
        relativeVelocity.z * relativeVelocity.z
    );

    // Apply gravitational focusing if close enough
    let focusedDistance = nominalDistance;
    if (nominalDistance < this.EARTH_SOI) {
      const focusingFactor = this.calculateGravitationalFocusing(
        nominalDistance,
        velocityMagnitude
      );
      focusedDistance = nominalDistance * focusingFactor;

      if (focusingFactor < 0.9) {
        warnings.push("Gravitational focusing effects applied");
      }
    }

    // Calculate impact probability (simplified)
    let impactProbability = 0;
    if (distanceUncertainty > 0) {
      const sigma = distanceUncertainty;
      const earthCrossSection = Math.PI * this.EARTH_RADIUS * this.EARTH_RADIUS;
      const uncertaintyArea = Math.PI * sigma * sigma;

      if (focusedDistance < 3 * sigma) {
        impactProbability = earthCrossSection / uncertaintyArea;
        impactProbability = Math.min(impactProbability, 1.0);

        if (impactProbability > 1e-6) {
          warnings.push(
            `Non-negligible impact probability: ${impactProbability.toExponential(
              2
            )}`
          );
        }
      }
    }

    return {
      date: time,
      distance: new UncertaintyValue(
        focusedDistance,
        distanceUncertainty,
        "km",
        "Close approach calculation",
        "Distance at closest approach"
      ),
      relativeVelocity: new UncertaintyValue(
        velocityMagnitude,
        velocityMagnitude * 0.01, // 1% uncertainty estimate
        "km/s",
        "Numerical differentiation",
        "Relative velocity at closest approach"
      ),
      asteroidPosition: asteroidPos,
      earthPosition: earthPos,
      relativePosition: relativePos,
      impactProbability,
      warnings,
    };
  }

  /**
   * Calculate gravitational focusing factor
   */
  private static calculateGravitationalFocusing(
    distance: number, // km
    velocity: number // km/s
  ): number {
    const earthMass = PHYSICAL_CONSTANTS.EARTH_MASS.value; // kg
    const G = PHYSICAL_CONSTANTS.GRAVITATIONAL_CONSTANT.value; // m³ kg⁻¹ s⁻²

    // Convert to consistent units
    const r = distance * 1000; // m
    const v = velocity * 1000; // m/s

    // Gravitational parameter
    const mu = G * earthMass; // m³/s²

    // Impact parameter for grazing trajectory
    const b_grazing = this.EARTH_RADIUS * 1000; // m

    // Deflection angle
    const theta = 2 * Math.atan(mu / (b_grazing * v * v));

    // Focusing factor (simplified)
    const focusingFactor = Math.sin(theta / 2);

    return Math.max(focusingFactor, 0.1); // Minimum factor to avoid numerical issues
  }

  /**
   * Propagate distance uncertainty using covariance matrix
   */
  private static propagateDistanceUncertainty(
    elements: UncertainOrbitalElements,
    time: JulianDate
  ): number {
    // This is a simplified implementation
    // Full implementation would require partial derivatives of position with respect to orbital elements

    const relativeUncertainties = [
      elements.semiMajorAxis.relativeUncertainty,
      elements.eccentricity.relativeUncertainty,
      elements.inclination.relativeUncertainty,
      elements.longitudeOfAscendingNode.relativeUncertainty,
      elements.argumentOfPeriapsis.relativeUncertainty,
      elements.meanAnomalyAtEpoch.relativeUncertainty,
    ];

    // Root sum of squares
    const combinedRelativeUncertainty = Math.sqrt(
      relativeUncertainties.reduce((sum, u) => sum + u * u, 0)
    );

    // Estimate distance
    const nominalDistance = elements.semiMajorAxis.value * this.AU_TO_KM;

    return nominalDistance * combinedRelativeUncertainty;
  }

  /**
   * Calculate Minimum Orbital Intersection Distance (MOID)
   */
  static calculateMOID(
    asteroidElements: UncertainOrbitalElements,
    earthElements: typeof EARTH_ORBITAL_ELEMENTS = EARTH_ORBITAL_ELEMENTS
  ): MOIDResult {
    const maxIterations = 100;
    const tolerance = 1e-12; // AU

    let bestMOID = Number.POSITIVE_INFINITY;
    let bestAsteroidNu = 0;
    let bestEarthNu = 0;
    let bestAsteroidPos: CoordinateVector = {
      x: 0,
      y: 0,
      z: 0,
      frame: CoordinateFrame.J2000_ECLIPTIC,
      epoch: asteroidElements.epoch,
    };
    let bestEarthPos: CoordinateVector = {
      x: 0,
      y: 0,
      z: 0,
      frame: CoordinateFrame.J2000_ECLIPTIC,
      epoch: asteroidElements.epoch,
    };

    let iterations = 0;
    let converged = false;
    let residual = Number.POSITIVE_INFINITY;

    // Grid search over true anomalies
    const nuSteps = 360; // 1 degree steps

    for (let i = 0; i < nuSteps; i++) {
      const asteroidNu = (2 * Math.PI * i) / nuSteps;

      for (let j = 0; j < nuSteps; j++) {
        const earthNu = (2 * Math.PI * j) / nuSteps;

        // Calculate positions
        const asteroidPos = this.calculatePositionFromTrueAnomaly(
          asteroidElements,
          asteroidNu
        );
        const earthPos = this.calculateEarthPositionFromTrueAnomaly(
          earthElements,
          earthNu
        );

        // Calculate distance
        const dx = asteroidPos.x - earthPos.x;
        const dy = asteroidPos.y - earthPos.y;
        const dz = asteroidPos.z - earthPos.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distance < bestMOID) {
          bestMOID = distance;
          bestAsteroidNu = asteroidNu;
          bestEarthNu = earthNu;
          bestAsteroidPos = asteroidPos;
          bestEarthPos = earthPos;
        }

        iterations++;
      }
    }

    // Refine using local optimization (simplified)
    const refinementSteps = 10;
    const stepSize = Math.PI / 180; // 1 degree

    for (let iter = 0; iter < refinementSteps; iter++) {
      let improved = false;

      // Try small perturbations
      const perturbations = [
        [-stepSize, 0],
        [stepSize, 0],
        [0, -stepSize],
        [0, stepSize],
        [-stepSize, -stepSize],
        [-stepSize, stepSize],
        [stepSize, -stepSize],
        [stepSize, stepSize],
      ];

      for (const [dNu1, dNu2] of perturbations) {
        const testAsteroidNu = bestAsteroidNu + dNu1;
        const testEarthNu = bestEarthNu + dNu2;

        const asteroidPos = this.calculatePositionFromTrueAnomaly(
          asteroidElements,
          testAsteroidNu
        );
        const earthPos = this.calculateEarthPositionFromTrueAnomaly(
          earthElements,
          testEarthNu
        );

        const dx = asteroidPos.x - earthPos.x;
        const dy = asteroidPos.y - earthPos.y;
        const dz = asteroidPos.z - earthPos.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distance < bestMOID) {
          bestMOID = distance;
          bestAsteroidNu = testAsteroidNu;
          bestEarthNu = testEarthNu;
          bestAsteroidPos = asteroidPos;
          bestEarthPos = earthPos;
          improved = true;
        }
      }

      if (!improved) {
        converged = true;
        break;
      }
    }

    residual = bestMOID;

    // Estimate uncertainty
    const moidUncertainty =
      bestMOID *
      Math.max(
        asteroidElements.semiMajorAxis.relativeUncertainty,
        asteroidElements.eccentricity.relativeUncertainty
      );

    return {
      moid: new UncertaintyValue(
        bestMOID,
        moidUncertainty,
        "AU",
        "MOID calculation",
        "Minimum Orbital Intersection Distance"
      ),
      asteroidTrueAnomaly: bestAsteroidNu,
      earthTrueAnomaly: bestEarthNu,
      asteroidPosition: bestAsteroidPos,
      earthPosition: bestEarthPos,
      convergenceInfo: {
        iterations,
        converged,
        residual,
      },
    };
  }

  /**
   * Calculate position from true anomaly
   */
  private static calculatePositionFromTrueAnomaly(
    elements: UncertainOrbitalElements,
    trueAnomaly: number
  ): CoordinateVector {
    const a = elements.semiMajorAxis.value;
    const e = elements.eccentricity.value;
    const i = elements.inclination.value;
    const Omega = elements.longitudeOfAscendingNode.value;
    const omega = elements.argumentOfPeriapsis.value;
    const nu = trueAnomaly;

    // Distance
    const r = (a * (1 - e * e)) / (1 + e * Math.cos(nu));

    // Position in orbital plane
    const x_orb = r * Math.cos(nu);
    const y_orb = r * Math.sin(nu);
    const z_orb = 0;

    // Rotation matrices
    const cosOmega = Math.cos(Omega);
    const sinOmega = Math.sin(Omega);
    const cosomega = Math.cos(omega);
    const sinomega = Math.sin(omega);
    const cosi = Math.cos(i);
    const sini = Math.sin(i);

    // Transform to heliocentric coordinates
    const x =
      (cosOmega * cosomega - sinOmega * sinomega * cosi) * x_orb +
      (-cosOmega * sinomega - sinOmega * cosomega * cosi) * y_orb;
    const y =
      (sinOmega * cosomega + cosOmega * sinomega * cosi) * x_orb +
      (-sinOmega * sinomega + cosOmega * cosomega * cosi) * y_orb;
    const z = sinomega * sini * x_orb + cosomega * sini * y_orb;

    return {
      x,
      y,
      z,
      frame: elements.frame,
      epoch: elements.epoch,
    };
  }

  /**
   * Calculate Earth position from true anomaly
   */
  private static calculateEarthPositionFromTrueAnomaly(
    earthElements: typeof EARTH_ORBITAL_ELEMENTS,
    trueAnomaly: number
  ): CoordinateVector {
    const a = earthElements.semiMajorAxis.value;
    const e = earthElements.eccentricity.value;
    const nu = trueAnomaly;

    // Distance
    const r = (a * (1 - e * e)) / (1 + e * Math.cos(nu));

    // Position (Earth orbit is in ecliptic plane)
    const x = r * Math.cos(nu + earthElements.argumentOfPeriapsis.value);
    const y = r * Math.sin(nu + earthElements.argumentOfPeriapsis.value);
    const z = 0;

    return {
      x,
      y,
      z,
      frame: CoordinateFrame.J2000_ECLIPTIC,
      epoch: { jd: 2451545.0, timeScale: TimeScale.TDB },
    };
  }
}

/**
 * Utility functions for close approach analysis
 */
export const CloseApproachUtils = {
  /**
   * Convert close approach distance to Earth radii
   */
  distanceInEarthRadii(distance: number): number {
    return distance / CloseApproachCalculator["EARTH_RADIUS"];
  },

  /**
   * Convert close approach distance to lunar distances
   */
  distanceInLunarDistances(distance: number): number {
    const lunarDistance = 384400; // km
    return distance / lunarDistance;
  },

  /**
   * Classify close approach by distance
   */
  classifyApproach(distance: number): string {
    const earthRadii = this.distanceInEarthRadii(distance);
    const lunarDistances = this.distanceInLunarDistances(distance);

    if (earthRadii < 1) {
      return "Impact";
    } else if (earthRadii < 10) {
      return "Extremely Close";
    } else if (lunarDistances < 1) {
      return "Very Close";
    } else if (lunarDistances < 10) {
      return "Close";
    } else if (lunarDistances < 100) {
      return "Moderate";
    } else {
      return "Distant";
    }
  },

  /**
   * Calculate Torino Scale rating
   */
  calculateTorinoScale(
    impactProbability: number,
    kineticEnergy: number // megatons TNT
  ): number {
    if (impactProbability <= 0) return 0;

    const logProb = Math.log10(impactProbability);
    const logEnergy = Math.log10(kineticEnergy);

    // Simplified Torino Scale calculation
    let scale = logProb + 0.5 * logEnergy - 3;

    // Clamp to valid range
    scale = Math.max(0, Math.min(10, Math.round(scale)));

    return scale;
  },

  /**
   * Estimate impact energy from asteroid properties
   */
  estimateImpactEnergy(
    diameter: number, // km
    velocity: number, // km/s
    density: number = 2000 // kg/m³
  ): number {
    const radius = diameter / 2; // km
    const volume = (4 / 3) * Math.PI * Math.pow(radius * 1000, 3); // m³
    const mass = volume * density; // kg
    const energy = 0.5 * mass * Math.pow(velocity * 1000, 2); // J

    // Convert to megatons TNT
    const megatonsTNT = energy / 4.184e15;

    return megatonsTNT;
  },
};

/**
 * Create uncertain orbital elements from nominal values and uncertainties
 */
export function createUncertainOrbitalElements(
  nominalElements: {
    semiMajorAxis: number; // AU
    eccentricity: number;
    inclination: number; // degrees
    longitudeOfAscendingNode: number; // degrees
    argumentOfPeriapsis: number; // degrees
    meanAnomalyAtEpoch: number; // degrees
  },
  uncertainties: {
    semiMajorAxis: number; // AU
    eccentricity: number;
    inclination: number; // degrees
    longitudeOfAscendingNode: number; // degrees
    argumentOfPeriapsis: number; // degrees
    meanAnomalyAtEpoch: number; // degrees
  },
  epoch: JulianDate,
  frame: CoordinateFrame = CoordinateFrame.J2000_ECLIPTIC
): UncertainOrbitalElements {
  return {
    semiMajorAxis: new UncertaintyValue(
      nominalElements.semiMajorAxis,
      uncertainties.semiMajorAxis,
      "AU",
      "User input",
      "Semi-major axis"
    ),
    eccentricity: new UncertaintyValue(
      nominalElements.eccentricity,
      uncertainties.eccentricity,
      "dimensionless",
      "User input",
      "Eccentricity"
    ),
    inclination: new UncertaintyValue(
      (nominalElements.inclination * Math.PI) / 180,
      (uncertainties.inclination * Math.PI) / 180,
      "rad",
      "User input",
      "Inclination"
    ),
    longitudeOfAscendingNode: new UncertaintyValue(
      (nominalElements.longitudeOfAscendingNode * Math.PI) / 180,
      (uncertainties.longitudeOfAscendingNode * Math.PI) / 180,
      "rad",
      "User input",
      "Longitude of ascending node"
    ),
    argumentOfPeriapsis: new UncertaintyValue(
      (nominalElements.argumentOfPeriapsis * Math.PI) / 180,
      (uncertainties.argumentOfPeriapsis * Math.PI) / 180,
      "rad",
      "User input",
      "Argument of periapsis"
    ),
    meanAnomalyAtEpoch: new UncertaintyValue(
      (nominalElements.meanAnomalyAtEpoch * Math.PI) / 180,
      (uncertainties.meanAnomalyAtEpoch * Math.PI) / 180,
      "rad",
      "User input",
      "Mean anomaly at epoch"
    ),
    epoch,
    frame,
  };
}
