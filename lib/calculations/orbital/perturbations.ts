/**
 * Orbital Perturbation Models
 * Implements J2 oblateness effects, lunar/solar perturbations, relativistic corrections,
 * and radiation pressure effects for accurate orbital propagation
 */

import { UncertaintyValue, PHYSICAL_CONSTANTS } from "../../physics/constants";
import { UnitConverter } from "../../physics/units";

/**
 * Perturbation force types
 */
export enum PerturbationType {
  J2_OBLATENESS = "j2_oblateness",
  LUNAR_GRAVITY = "lunar_gravity",
  SOLAR_GRAVITY = "solar_gravity",
  RELATIVISTIC = "relativistic",
  RADIATION_PRESSURE = "radiation_pressure",
  ATMOSPHERIC_DRAG = "atmospheric_drag",
}

/**
 * 3D vector for positions and velocities
 */
export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

/**
 * Orbital state vector
 */
export interface OrbitalStateVector {
  position: Vector3D; // km
  velocity: Vector3D; // km/s
  epoch: number; // Julian date
}

/**
 * Perturbation acceleration result
 */
export interface PerturbationAcceleration {
  acceleration: Vector3D; // km/s²
  type: PerturbationType;
  magnitude: number; // km/s²
  description: string;
}

/**
 * Perturbation model configuration
 */
export interface PerturbationConfig {
  includeJ2: boolean;
  includeLunar: boolean;
  includeSolar: boolean;
  includeRelativistic: boolean;
  includeRadiationPressure: boolean;
  includeAtmosphericDrag: boolean;

  // Object properties for radiation pressure and drag
  mass?: number; // kg
  crossSectionalArea?: number; // m²
  reflectivityCoefficient?: number; // 0-2 (0=absorbing, 1=reflecting, 2=perfect reflector)
  dragCoefficient?: number; // typical ~2.2 for spheres
}

/**
 * Default perturbation configuration
 */
export const DEFAULT_PERTURBATION_CONFIG: PerturbationConfig = {
  includeJ2: true,
  includeLunar: true,
  includeSolar: true,
  includeRelativistic: false, // Usually small for asteroids
  includeRadiationPressure: false, // Requires object properties
  includeAtmosphericDrag: false, // Only for very low orbits
};

/**
 * Earth physical parameters for perturbations
 */
export const EARTH_PARAMETERS = {
  // J2 coefficient (Earth's oblateness)
  J2: new UncertaintyValue(
    1.0826267e-3,
    1e-9,
    "dimensionless",
    "IERS Conventions 2010",
    "Earth's second zonal harmonic coefficient"
  ),

  // Earth's equatorial radius
  EQUATORIAL_RADIUS: PHYSICAL_CONSTANTS.EARTH_EQUATORIAL_RADIUS.withUnit(
    "km",
    1e-3
  ),

  // Earth's gravitational parameter
  MU: new UncertaintyValue(
    398600.4418, // km³/s²
    8e-4,
    "km³/s²",
    "IERS Conventions 2010",
    "Earth's gravitational parameter"
  ),
};

/**
 * Solar system body parameters
 */
export const SOLAR_SYSTEM_PARAMETERS = {
  // Sun
  SUN_MU: new UncertaintyValue(
    1.32712442018e11, // km³/s²
    8e1,
    "km³/s²",
    "IAU 2015",
    "Solar gravitational parameter"
  ),

  // Moon
  MOON_MU: new UncertaintyValue(
    4902.7779, // km³/s²
    0.0001,
    "km³/s²",
    "DE430",
    "Lunar gravitational parameter"
  ),

  // Solar radiation pressure at 1 AU
  SOLAR_RADIATION_PRESSURE: new UncertaintyValue(
    4.56e-6, // N/m² at 1 AU
    0.01e-6,
    "N/m²",
    "Solar constant / c",
    "Solar radiation pressure at 1 AU"
  ),
};

/**
 * Orbital perturbation calculator
 */
export class PerturbationCalculator {
  private config: PerturbationConfig;

  constructor(config: Partial<PerturbationConfig> = {}) {
    this.config = { ...DEFAULT_PERTURBATION_CONFIG, ...config };
  }

  /**
   * Calculate all perturbation accelerations for a given orbital state
   */
  calculatePerturbations(
    state: OrbitalStateVector,
    sunPosition?: Vector3D,
    moonPosition?: Vector3D
  ): PerturbationAcceleration[] {
    const perturbations: PerturbationAcceleration[] = [];

    // J2 oblateness perturbation
    if (this.config.includeJ2) {
      const j2Perturbation = this.calculateJ2Perturbation(state);
      perturbations.push(j2Perturbation);
    }

    // Third-body perturbations
    if (this.config.includeSolar && sunPosition) {
      const solarPerturbation = this.calculateThirdBodyPerturbation(
        state,
        sunPosition,
        SOLAR_SYSTEM_PARAMETERS.SUN_MU.value,
        PerturbationType.SOLAR_GRAVITY
      );
      perturbations.push(solarPerturbation);
    }

    if (this.config.includeLunar && moonPosition) {
      const lunarPerturbation = this.calculateThirdBodyPerturbation(
        state,
        moonPosition,
        SOLAR_SYSTEM_PARAMETERS.MOON_MU.value,
        PerturbationType.LUNAR_GRAVITY
      );
      perturbations.push(lunarPerturbation);
    }

    // Relativistic perturbations
    if (this.config.includeRelativistic) {
      const relativisticPerturbation =
        this.calculateRelativisticPerturbation(state);
      perturbations.push(relativisticPerturbation);
    }

    // Radiation pressure
    if (
      this.config.includeRadiationPressure &&
      sunPosition &&
      this.config.mass &&
      this.config.crossSectionalArea
    ) {
      const radiationPerturbation = this.calculateRadiationPressure(
        state,
        sunPosition,
        this.config.mass,
        this.config.crossSectionalArea,
        this.config.reflectivityCoefficient || 1.0
      );
      perturbations.push(radiationPerturbation);
    }

    return perturbations;
  }

  /**
   * Calculate J2 oblateness perturbation
   * Based on Vallado "Fundamentals of Astrodynamics and Applications"
   */
  private calculateJ2Perturbation(
    state: OrbitalStateVector
  ): PerturbationAcceleration {
    const { x, y, z } = state.position;
    const r = Math.sqrt(x * x + y * y + z * z);
    const Re = EARTH_PARAMETERS.EQUATORIAL_RADIUS.value;
    const J2 = EARTH_PARAMETERS.J2.value;
    const mu = EARTH_PARAMETERS.MU.value;

    // J2 perturbation acceleration components
    const factor = (-1.5 * J2 * mu * Re * Re) / Math.pow(r, 5);
    const z2_r2 = (z * z) / (r * r);

    const ax = factor * x * (1 - 5 * z2_r2);
    const ay = factor * y * (1 - 5 * z2_r2);
    const az = factor * z * (3 - 5 * z2_r2);

    const acceleration: Vector3D = { x: ax, y: ay, z: az };
    const magnitude = Math.sqrt(ax * ax + ay * ay + az * az);

    return {
      acceleration,
      type: PerturbationType.J2_OBLATENESS,
      magnitude,
      description: "Earth oblateness (J2) perturbation",
    };
  }

  /**
   * Calculate third-body gravitational perturbation (Sun or Moon)
   */
  private calculateThirdBodyPerturbation(
    state: OrbitalStateVector,
    thirdBodyPosition: Vector3D,
    thirdBodyMu: number,
    type: PerturbationType
  ): PerturbationAcceleration {
    const { x, y, z } = state.position;
    const { x: xs, y: ys, z: zs } = thirdBodyPosition;

    // Vector from third body to satellite
    const dx = x - xs;
    const dy = y - ys;
    const dz = z - zs;
    const r_sat_third = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Distance from Earth to third body
    const r_earth_third = Math.sqrt(xs * xs + ys * ys + zs * zs);

    // Third-body perturbation acceleration
    const factor1 = thirdBodyMu / Math.pow(r_sat_third, 3);
    const factor2 = thirdBodyMu / Math.pow(r_earth_third, 3);

    const ax = factor1 * dx - factor2 * xs;
    const ay = factor1 * dy - factor2 * ys;
    const az = factor1 * dz - factor2 * zs;

    const acceleration: Vector3D = { x: ax, y: ay, z: az };
    const magnitude = Math.sqrt(ax * ax + ay * ay + az * az);

    const bodyName =
      type === PerturbationType.SOLAR_GRAVITY ? "Solar" : "Lunar";

    return {
      acceleration,
      type,
      magnitude,
      description: `${bodyName} gravitational perturbation`,
    };
  }

  /**
   * Calculate relativistic perturbation (post-Newtonian correction)
   * Based on Einstein's general relativity
   */
  private calculateRelativisticPerturbation(
    state: OrbitalStateVector
  ): PerturbationAcceleration {
    const { x, y, z } = state.position;
    const { x: vx, y: vy, z: vz } = state.velocity;

    const r = Math.sqrt(x * x + y * y + z * z);
    const v2 = vx * vx + vy * vy + vz * vz;
    const rv = x * vx + y * vy + z * vz; // r·v
    const mu = EARTH_PARAMETERS.MU.value;
    const c = PHYSICAL_CONSTANTS.SPEED_OF_LIGHT.value / 1000; // km/s

    // Post-Newtonian acceleration correction
    const factor = mu / (c * c * r * r * r);
    const term1 = (4 * mu) / r - v2;
    const term2 = 4 * rv;

    const ax = factor * (term1 * x + term2 * vx);
    const ay = factor * (term1 * y + term2 * vy);
    const az = factor * (term1 * z + term2 * vz);

    const acceleration: Vector3D = { x: ax, y: ay, z: az };
    const magnitude = Math.sqrt(ax * ax + ay * ay + az * az);

    return {
      acceleration,
      type: PerturbationType.RELATIVISTIC,
      magnitude,
      description: "General relativistic correction",
    };
  }

  /**
   * Calculate solar radiation pressure perturbation
   */
  private calculateRadiationPressure(
    state: OrbitalStateVector,
    sunPosition: Vector3D,
    mass: number, // kg
    area: number, // m²
    reflectivity: number // 0-2
  ): PerturbationAcceleration {
    const { x, y, z } = state.position;
    const { x: xs, y: ys, z: zs } = sunPosition;

    // Vector from Sun to satellite
    const dx = x - xs;
    const dy = y - ys;
    const dz = z - zs;
    const r_sun_sat = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Unit vector from Sun to satellite
    const ux = dx / r_sun_sat;
    const uy = dy / r_sun_sat;
    const uz = dz / r_sun_sat;

    // Solar radiation pressure at satellite distance
    const AU_km = PHYSICAL_CONSTANTS.ASTRONOMICAL_UNIT.value;
    const P0 = SOLAR_SYSTEM_PARAMETERS.SOLAR_RADIATION_PRESSURE.value;
    const P = (P0 * (AU_km * AU_km)) / (r_sun_sat * r_sun_sat);

    // Acceleration due to radiation pressure
    const factor = (P * area * (1 + reflectivity)) / mass; // m/s² -> km/s²
    const ax = factor * ux * 1e-3; // Convert to km/s²
    const ay = factor * uy * 1e-3;
    const az = factor * uz * 1e-3;

    const acceleration: Vector3D = { x: ax, y: ay, z: az };
    const magnitude = Math.sqrt(ax * ax + ay * ay + az * az);

    return {
      acceleration,
      type: PerturbationType.RADIATION_PRESSURE,
      magnitude,
      description: "Solar radiation pressure",
    };
  }

  /**
   * Calculate total perturbation acceleration
   */
  calculateTotalPerturbation(
    state: OrbitalStateVector,
    sunPosition?: Vector3D,
    moonPosition?: Vector3D
  ): Vector3D {
    const perturbations = this.calculatePerturbations(
      state,
      sunPosition,
      moonPosition
    );

    let totalX = 0;
    let totalY = 0;
    let totalZ = 0;

    for (const perturbation of perturbations) {
      totalX += perturbation.acceleration.x;
      totalY += perturbation.acceleration.y;
      totalZ += perturbation.acceleration.z;
    }

    return { x: totalX, y: totalY, z: totalZ };
  }

  /**
   * Propagate orbital state with perturbations using Runge-Kutta 4th order
   */
  propagateState(
    initialState: OrbitalStateVector,
    timeStep: number, // seconds
    duration: number, // seconds
    sunPositionFunc?: (jd: number) => Vector3D,
    moonPositionFunc?: (jd: number) => Vector3D
  ): OrbitalStateVector[] {
    const states: OrbitalStateVector[] = [initialState];
    let currentState = { ...initialState };
    const steps = Math.floor(duration / timeStep);

    for (let i = 0; i < steps; i++) {
      const jd = currentState.epoch + timeStep / 86400; // Convert seconds to days

      // Get third-body positions if functions provided
      const sunPos = sunPositionFunc ? sunPositionFunc(jd) : undefined;
      const moonPos = moonPositionFunc ? moonPositionFunc(jd) : undefined;

      // RK4 integration step
      currentState = this.rk4Step(currentState, timeStep, sunPos, moonPos);
      currentState.epoch = jd;

      states.push({ ...currentState });
    }

    return states;
  }

  /**
   * Runge-Kutta 4th order integration step
   */
  private rk4Step(
    state: OrbitalStateVector,
    dt: number,
    sunPosition?: Vector3D,
    moonPosition?: Vector3D
  ): OrbitalStateVector {
    const dtSec = dt; // dt is already in seconds

    // Convert to state vector [x, y, z, vx, vy, vz]
    const y0 = [
      state.position.x,
      state.position.y,
      state.position.z,
      state.velocity.x,
      state.velocity.y,
      state.velocity.z,
    ];

    // RK4 coefficients
    const k1 = this.stateDerivative(y0, sunPosition, moonPosition);

    const y1 = y0.map((val, i) => val + 0.5 * dtSec * k1[i]);
    const k2 = this.stateDerivative(y1, sunPosition, moonPosition);

    const y2 = y0.map((val, i) => val + 0.5 * dtSec * k2[i]);
    const k3 = this.stateDerivative(y2, sunPosition, moonPosition);

    const y3 = y0.map((val, i) => val + dtSec * k3[i]);
    const k4 = this.stateDerivative(y3, sunPosition, moonPosition);

    // Final state
    const yf = y0.map(
      (val, i) => val + (dtSec / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])
    );

    return {
      position: { x: yf[0], y: yf[1], z: yf[2] },
      velocity: { x: yf[3], y: yf[4], z: yf[5] },
      epoch: state.epoch,
    };
  }

  /**
   * Calculate state derivative for integration
   * Returns [vx, vy, vz, ax, ay, az]
   */
  private stateDerivative(
    stateVector: number[],
    sunPosition?: Vector3D,
    moonPosition?: Vector3D
  ): number[] {
    const [x, y, z, vx, vy, vz] = stateVector;
    const r = Math.sqrt(x * x + y * y + z * z);
    const mu = EARTH_PARAMETERS.MU.value;

    // Central body acceleration (Earth)
    const centralAccel = {
      x: (-mu * x) / (r * r * r),
      y: (-mu * y) / (r * r * r),
      z: (-mu * z) / (r * r * r),
    };

    // Perturbation accelerations
    const state: OrbitalStateVector = {
      position: { x, y, z },
      velocity: { x: vx, y: vy, z: vz },
      epoch: 0, // Not used in derivative calculation
    };

    const perturbAccel = this.calculateTotalPerturbation(
      state,
      sunPosition,
      moonPosition
    );

    // Total acceleration
    const totalAccel = {
      x: centralAccel.x + perturbAccel.x,
      y: centralAccel.y + perturbAccel.y,
      z: centralAccel.z + perturbAccel.z,
    };

    return [vx, vy, vz, totalAccel.x, totalAccel.y, totalAccel.z];
  }
}

/**
 * Utility functions for common perturbation calculations
 */
export const PerturbationUtils = {
  /**
   * Estimate perturbation significance for orbit planning
   */
  estimatePerturbationMagnitudes(
    semiMajorAxis: number, // km
    eccentricity: number,
    inclination: number // radians
  ): Record<PerturbationType, number> {
    const r = semiMajorAxis; // Approximate with semi-major axis
    const Re = EARTH_PARAMETERS.EQUATORIAL_RADIUS.value;
    const mu = EARTH_PARAMETERS.MU.value;

    // J2 perturbation magnitude estimate
    const j2Magnitude =
      (1.5 * EARTH_PARAMETERS.J2.value * mu * Re * Re) / Math.pow(r, 4);

    // Third-body perturbation estimates (very approximate)
    const lunarMagnitude =
      SOLAR_SYSTEM_PARAMETERS.MOON_MU.value / Math.pow(384400, 3); // Moon distance ~384,400 km
    const solarMagnitude =
      SOLAR_SYSTEM_PARAMETERS.SUN_MU.value / Math.pow(149597870, 3); // 1 AU

    // Relativistic perturbation (very small)
    const c = PHYSICAL_CONSTANTS.SPEED_OF_LIGHT.value / 1000; // km/s
    const relativisticMagnitude = (4 * mu * mu) / (c * c * r * r * r);

    return {
      [PerturbationType.J2_OBLATENESS]: j2Magnitude,
      [PerturbationType.LUNAR_GRAVITY]: lunarMagnitude,
      [PerturbationType.SOLAR_GRAVITY]: solarMagnitude,
      [PerturbationType.RELATIVISTIC]: relativisticMagnitude,
      [PerturbationType.RADIATION_PRESSURE]: 0, // Depends on object properties
      [PerturbationType.ATMOSPHERIC_DRAG]: 0, // Depends on altitude and object properties
    };
  },

  /**
   * Determine which perturbations are significant for a given orbit
   */
  getSignificantPerturbations(
    semiMajorAxis: number,
    eccentricity: number,
    inclination: number,
    threshold: number = 1e-9 // km/s²
  ): PerturbationType[] {
    const magnitudes = this.estimatePerturbationMagnitudes(
      semiMajorAxis,
      eccentricity,
      inclination
    );

    return Object.entries(magnitudes)
      .filter(([_, magnitude]) => magnitude > threshold)
      .map(([type, _]) => type as PerturbationType)
      .sort((a, b) => magnitudes[b] - magnitudes[a]); // Sort by magnitude, descending
  },
};

/**
 * Create a perturbation calculator with recommended settings for different orbit types
 */
export function createPerturbationCalculator(
  orbitType: "LEO" | "MEO" | "GEO" | "HEO" | "interplanetary",
  objectProperties?: {
    mass: number;
    area: number;
    reflectivity?: number;
    dragCoefficient?: number;
  }
): PerturbationCalculator {
  let config: Partial<PerturbationConfig>;

  switch (orbitType) {
    case "LEO": // Low Earth Orbit
      config = {
        includeJ2: true,
        includeLunar: false, // Usually negligible for LEO
        includeSolar: false, // Usually negligible for LEO
        includeRelativistic: false,
        includeRadiationPressure: false,
        includeAtmosphericDrag: true, // Important for LEO
      };
      break;

    case "MEO": // Medium Earth Orbit
      config = {
        includeJ2: true,
        includeLunar: true,
        includeSolar: true,
        includeRelativistic: false,
        includeRadiationPressure: !!objectProperties,
        includeAtmosphericDrag: false,
      };
      break;

    case "GEO": // Geostationary Orbit
      config = {
        includeJ2: true,
        includeLunar: true,
        includeSolar: true,
        includeRelativistic: false,
        includeRadiationPressure: !!objectProperties,
        includeAtmosphericDrag: false,
      };
      break;

    case "HEO": // Highly Elliptical Orbit
      config = {
        includeJ2: true,
        includeLunar: true,
        includeSolar: true,
        includeRelativistic: false,
        includeRadiationPressure: !!objectProperties,
        includeAtmosphericDrag: false,
      };
      break;

    case "interplanetary":
      config = {
        includeJ2: false, // Not relevant for interplanetary
        includeLunar: false,
        includeSolar: true, // Solar gravity is primary
        includeRelativistic: true, // Can be significant for high-speed trajectories
        includeRadiationPressure: !!objectProperties,
        includeAtmosphericDrag: false,
      };
      break;

    default:
      config = DEFAULT_PERTURBATION_CONFIG;
  }

  if (objectProperties) {
    config.mass = objectProperties.mass;
    config.crossSectionalArea = objectProperties.area;
    config.reflectivityCoefficient = objectProperties.reflectivity || 1.0;
    config.dragCoefficient = objectProperties.dragCoefficient || 2.2;
  }

  return new PerturbationCalculator(config);
}
