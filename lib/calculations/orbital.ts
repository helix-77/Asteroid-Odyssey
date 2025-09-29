// Orbital mechanics calculations for asteroid tracking
//! SCIENTIFIC ACCURACY NOTICE:
//! This module contains simplified orbital mechanics for educational purposes.
//! Many calculations use approximations and should not be used for actual
//! spacecraft navigation or precise asteroid tracking.
//!
//! References:
//! - Vallado, D.A. (2013) "Fundamentals of Astrodynamics and Applications"
//! - Meeus, J. (1998) "Astronomical Algorithms"
//! - Seidelmann, P.K. (2006) "Explanatory Supplement to the Astronomical Almanac"

export interface OrbitalElements {
  semi_major_axis: number; // AU
  eccentricity: number;
  inclination: number; // degrees
  ascending_node: number; // degrees
  perihelion: number; // degrees
  mean_anomaly: number; // degrees
}

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface Velocity3D {
  vx: number;
  vy: number;
  vz: number;
}

export interface OrbitalState {
  position: Position3D;
  velocity: Velocity3D;
  distance: number; // AU from Earth
  true_anomaly: number; // degrees
}

// Convert degrees to radians
const deg2rad = (degrees: number): number => degrees * (Math.PI / 180);

// Convert radians to degrees
const rad2deg = (radians: number): number => radians * (180 / Math.PI);

// Solve Kepler's equation iteratively
//! NUMERICAL METHOD: Newton-Raphson iteration with fixed tolerance
//! LIMITATIONS:
//! - May not converge for extreme eccentricities (e > 0.99)
//! - No adaptive tolerance based on orbital parameters
//! - Fixed maximum iterations may be insufficient for some cases
//! Reference: Vallado (2013) Section 2.2
export function solveKeplersEquation(
  meanAnomaly: number,
  eccentricity: number,
  tolerance = 1e-6
): number {
  let E = meanAnomaly; //! INITIAL GUESS: Mean anomaly (works for e < 0.8)
  let delta = 1;
  let iterations = 0;
  const maxIterations = 100; //! ARBITRARY LIMIT: May need more for high eccentricity

  while (Math.abs(delta) > tolerance && iterations < maxIterations) {
    const f = E - eccentricity * Math.sin(E) - meanAnomaly;
    const fp = 1 - eccentricity * Math.cos(E);
    delta = f / fp;
    E = E - delta;
    iterations++;
  }

  //! WARNING: No convergence check - may return inaccurate result
  return E;
}

// Calculate true anomaly from eccentric anomaly
export function calculateTrueAnomaly(
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

// Calculate orbital position and velocity
//! SIMPLIFIED ORBITAL MECHANICS: Two-body problem only
//! MAJOR LIMITATIONS:
//! - No perturbations (J2, lunar, solar, relativistic)
//! - Fixed epoch assumption (J2000.0)
//! - No proper time system handling (UTC vs TDB)
//! - Simplified coordinate transformations
//! - No uncertainty propagation
//! Reference: Vallado (2013) Chapter 2
export function calculateOrbitalState(
  elements: OrbitalElements,
  timeJD: number //! ASSUMPTION: Julian Date in UTC (should be TDB)
): OrbitalState {
  const {
    semi_major_axis: a,
    eccentricity: e,
    inclination: i,
    ascending_node: Omega,
    perihelion: omega,
    mean_anomaly: M0,
  } = elements;

  // Convert angles to radians
  const i_rad = deg2rad(i);
  const Omega_rad = deg2rad(Omega);
  const omega_rad = deg2rad(omega);
  const M0_rad = deg2rad(M0);

  // Mean motion (assuming standard gravitational parameter for Sun)
  const mu = 1.32712440018e20; //! CONSTANT: Sun's GM (IAU 2015 value)
  const a_m = a * 1.496e11; //! CONVERSION: AU to meters (IAU 2012 definition)
  const n = Math.sqrt(mu / (a_m * a_m * a_m)); // rad/s

  // Current mean anomaly (simplified - assumes epoch is J2000.0)
  //! MAJOR SIMPLIFICATION: Assumes all orbital elements are at J2000.0 epoch
  //! LIMITATION: No proper epoch handling or element propagation
  const M = M0_rad + n * (timeJD - 2451545.0) * 86400; //! HARDCODED: J2000.0 epoch

  // Solve Kepler's equation
  const E = solveKeplersEquation(M, e);

  // True anomaly
  const nu = calculateTrueAnomaly(E, e);

  // Distance from focus
  const r = a * (1 - e * Math.cos(E));

  // Position in orbital plane
  const x_orb = r * Math.cos(nu);
  const y_orb = r * Math.sin(nu);
  const z_orb = 0;

  // Velocity in orbital plane
  const h = Math.sqrt(mu * a_m * (1 - e * e)); // Specific angular momentum
  const vx_orb = -(mu / h) * Math.sin(nu);
  const vy_orb = (mu / h) * (e + Math.cos(nu));
  const vz_orb = 0;

  // Rotation matrices for 3D transformation
  //! COORDINATE SYSTEM: Assumes J2000.0 ecliptic coordinates
  //! LIMITATION: No precession, nutation, or frame transformations
  const cosOmega = Math.cos(Omega_rad);
  const sinOmega = Math.sin(Omega_rad);
  const cosomega = Math.cos(omega_rad);
  const sinomega = Math.sin(omega_rad);
  const cosi = Math.cos(i_rad);
  const sini = Math.sin(i_rad);

  // Transform to heliocentric coordinates
  //! SIMPLIFIED: Direct rotation matrix application without proper frame handling
  const x =
    (cosOmega * cosomega - sinOmega * sinomega * cosi) * x_orb +
    (-cosOmega * sinomega - sinOmega * cosomega * cosi) * y_orb;
  const y =
    (sinOmega * cosomega + cosOmega * sinomega * cosi) * x_orb +
    (-sinOmega * sinomega + cosOmega * cosomega * cosi) * y_orb;
  const z = sinomega * sini * x_orb + cosomega * sini * y_orb;

  const vx =
    (cosOmega * cosomega - sinOmega * sinomega * cosi) * vx_orb +
    (-cosOmega * sinomega - sinOmega * cosomega * cosi) * vy_orb;
  const vy =
    (sinOmega * cosomega + cosOmega * sinomega * cosi) * vx_orb +
    (-sinOmega * sinomega + cosOmega * cosomega * cosi) * vy_orb;
  const vz = sinomega * sini * vx_orb + cosomega * sini * vy_orb;

  // Convert back to AU and AU/day for position and velocity
  const position: Position3D = {
    x: x / 1.496e11, // Convert to AU
    y: y / 1.496e11,
    z: z / 1.496e11,
  };

  const velocity: Velocity3D = {
    vx: (vx * 86400) / 1.496e11, // Convert to AU/day
    vy: (vy * 86400) / 1.496e11,
    vz: (vz * 86400) / 1.496e11,
  };

  const distance = Math.sqrt(x * x + y * y + z * z) / 1.496e11; // AU

  return {
    position,
    velocity,
    distance,
    true_anomaly: rad2deg(nu),
  };
}

// Calculate future positions for orbit visualization
//! SIMPLIFIED ORBIT VISUALIZATION: Fixed time steps without adaptive sampling
//! LIMITATIONS:
//! - No consideration of orbital period for optimal sampling
//! - Fixed Julian date approximation
//! - No uncertainty propagation over time
export function calculateOrbitPath(
  elements: OrbitalElements,
  days = 365,
  steps = 100
): Position3D[] {
  const positions: Position3D[] = [];
  const currentJD = 2460000; //! HARDCODED: Approximate current Julian Date (should be dynamic)

  for (let i = 0; i <= steps; i++) {
    const timeOffset = (i / steps) * days;
    const state = calculateOrbitalState(elements, currentJD + timeOffset);
    positions.push(state.position);
  }

  return positions;
}

// Calculate closest approach to Earth
//! HIGHLY SIMPLIFIED APPROACH CALCULATION
//! MAJOR LIMITATIONS:
//! - Earth position fixed at (1,0,0) AU - ignores orbital motion
//! - No gravitational perturbations during close approach
//! - Brute force search instead of analytical methods
//! - No uncertainty propagation
//! - Daily time steps may miss actual closest approach
//! NEEDS REPLACEMENT: Should use proper MOID calculations
//! Reference: Sitarski (1968) "Approaches of the parabolic comets to the Earth"
export function calculateClosestApproach(
  elements: OrbitalElements,
  days = 1000
): { distance: number; date: number; velocity: number } {
  let minDistance = Number.POSITIVE_INFINITY;
  let closestDate = 0;
  let closestVelocity = 0;

  const currentJD = 2460000; //! HARDCODED: Should be current system time
  const earthPosition = { x: 1, y: 0, z: 0 }; //! MAJOR SIMPLIFICATION: Earth fixed at perihelion

  for (let day = 0; day < days; day++) {
    const state = calculateOrbitalState(elements, currentJD + day);
    const dx = state.position.x - earthPosition.x;
    const dy = state.position.y - earthPosition.y;
    const dz = state.position.z - earthPosition.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (distance < minDistance) {
      minDistance = distance;
      closestDate = currentJD + day;
      closestVelocity = Math.sqrt(
        state.velocity.vx * state.velocity.vx +
          state.velocity.vy * state.velocity.vy +
          state.velocity.vz * state.velocity.vz
      );
    }
  }

  return {
    distance: minDistance,
    date: closestDate,
    velocity: closestVelocity,
  };
}

//! ============================================================================
//! SCIENTIFIC ACCURACY DOCUMENTATION
//! ============================================================================
//!
//! MODEL LIMITATIONS AND ASSUMPTIONS:
//!
//! 1. ORBITAL MECHANICS:
//!    - Two-body problem only (no perturbations)
//!    - Fixed J2000.0 epoch assumption for all elements
//!    - No proper time system handling (UTC vs TDB vs TT)
//!    - Simplified coordinate transformations
//!    - No relativistic effects
//!
//! 2. KEPLER EQUATION SOLVER:
//!    - Fixed tolerance and iteration limits
//!    - May not converge for extreme eccentricities
//!    - No adaptive methods for different orbital types
//!
//! 3. CLOSE APPROACH CALCULATIONS:
//!    - Earth position grossly simplified (fixed at 1 AU)
//!    - No gravitational perturbations during approach
//!    - Brute force search instead of analytical methods
//!    - No minimum orbital intersection distance (MOID) calculations
//!
//! 4. COORDINATE SYSTEMS:
//!    - Assumes J2000.0 ecliptic coordinates throughout
//!    - No precession, nutation, or proper motion
//!    - No transformation between reference frames
//!
//! RECOMMENDED IMPROVEMENTS:
//! - Implement proper perturbation models (J2, lunar, solar)
//! - Add time system conversions (UTC, TDB, TT)
//! - Use analytical close approach methods (MOID)
//! - Include Earth's orbital motion in approach calculations
//! - Add uncertainty propagation for orbital elements
//! - Implement adaptive Kepler equation solvers
//!
//! SCIENTIFIC REFERENCES:
//! - Vallado, D.A. (2013) "Fundamentals of Astrodynamics and Applications"
//! - Meeus, J. (1998) "Astronomical Algorithms"
//! - Seidelmann, P.K. (2006) "Explanatory Supplement to the Astronomical Almanac"
//! - Sitarski, G. (1968) "Approaches of the parabolic comets to the Earth"
//! - Danby, J.M.A. (1988) "Fundamentals of Celestial Mechanics"
