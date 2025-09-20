// Orbital mechanics calculations for asteroid tracking

export interface OrbitalElements {
  semi_major_axis: number // AU
  eccentricity: number
  inclination: number // degrees
  ascending_node: number // degrees
  perihelion: number // degrees
  mean_anomaly: number // degrees
}

export interface Position3D {
  x: number
  y: number
  z: number
}

export interface Velocity3D {
  vx: number
  vy: number
  vz: number
}

export interface OrbitalState {
  position: Position3D
  velocity: Velocity3D
  distance: number // AU from Earth
  true_anomaly: number // degrees
}

// Convert degrees to radians
const deg2rad = (degrees: number): number => degrees * (Math.PI / 180)

// Convert radians to degrees
const rad2deg = (radians: number): number => radians * (180 / Math.PI)

// Solve Kepler's equation iteratively
export function solveKeplersEquation(meanAnomaly: number, eccentricity: number, tolerance = 1e-6): number {
  let E = meanAnomaly // Initial guess
  let delta = 1
  let iterations = 0
  const maxIterations = 100

  while (Math.abs(delta) > tolerance && iterations < maxIterations) {
    const f = E - eccentricity * Math.sin(E) - meanAnomaly
    const fp = 1 - eccentricity * Math.cos(E)
    delta = f / fp
    E = E - delta
    iterations++
  }

  return E
}

// Calculate true anomaly from eccentric anomaly
export function calculateTrueAnomaly(eccentricAnomaly: number, eccentricity: number): number {
  const cosE = Math.cos(eccentricAnomaly)
  const sinE = Math.sin(eccentricAnomaly)

  const cosNu = (cosE - eccentricity) / (1 - eccentricity * cosE)
  const sinNu = (Math.sqrt(1 - eccentricity * eccentricity) * sinE) / (1 - eccentricity * cosE)

  return Math.atan2(sinNu, cosNu)
}

// Calculate orbital position and velocity
export function calculateOrbitalState(elements: OrbitalElements, timeJD: number): OrbitalState {
  const {
    semi_major_axis: a,
    eccentricity: e,
    inclination: i,
    ascending_node: Omega,
    perihelion: omega,
    mean_anomaly: M0,
  } = elements

  // Convert angles to radians
  const i_rad = deg2rad(i)
  const Omega_rad = deg2rad(Omega)
  const omega_rad = deg2rad(omega)
  const M0_rad = deg2rad(M0)

  // Mean motion (assuming standard gravitational parameter for Sun)
  const mu = 1.32712440018e20 // m³/s² (Sun's standard gravitational parameter)
  const a_m = a * 1.496e11 // Convert AU to meters
  const n = Math.sqrt(mu / (a_m * a_m * a_m)) // rad/s

  // Current mean anomaly (simplified - assumes epoch is J2000.0)
  const M = M0_rad + n * (timeJD - 2451545.0) * 86400 // seconds since J2000.0

  // Solve Kepler's equation
  const E = solveKeplersEquation(M, e)

  // True anomaly
  const nu = calculateTrueAnomaly(E, e)

  // Distance from focus
  const r = a * (1 - e * Math.cos(E))

  // Position in orbital plane
  const x_orb = r * Math.cos(nu)
  const y_orb = r * Math.sin(nu)
  const z_orb = 0

  // Velocity in orbital plane
  const h = Math.sqrt(mu * a_m * (1 - e * e)) // Specific angular momentum
  const vx_orb = -(mu / h) * Math.sin(nu)
  const vy_orb = (mu / h) * (e + Math.cos(nu))
  const vz_orb = 0

  // Rotation matrices for 3D transformation
  const cosOmega = Math.cos(Omega_rad)
  const sinOmega = Math.sin(Omega_rad)
  const cosomega = Math.cos(omega_rad)
  const sinomega = Math.sin(omega_rad)
  const cosi = Math.cos(i_rad)
  const sini = Math.sin(i_rad)

  // Transform to heliocentric coordinates
  const x =
    (cosOmega * cosomega - sinOmega * sinomega * cosi) * x_orb +
    (-cosOmega * sinomega - sinOmega * cosomega * cosi) * y_orb
  const y =
    (sinOmega * cosomega + cosOmega * sinomega * cosi) * x_orb +
    (-sinOmega * sinomega + cosOmega * cosomega * cosi) * y_orb
  const z = sinomega * sini * x_orb + cosomega * sini * y_orb

  const vx =
    (cosOmega * cosomega - sinOmega * sinomega * cosi) * vx_orb +
    (-cosOmega * sinomega - sinOmega * cosomega * cosi) * vy_orb
  const vy =
    (sinOmega * cosomega + cosOmega * sinomega * cosi) * vx_orb +
    (-sinOmega * sinomega + cosOmega * cosomega * cosi) * vy_orb
  const vz = sinomega * sini * vx_orb + cosomega * sini * vy_orb

  // Convert back to AU and AU/day for position and velocity
  const position: Position3D = {
    x: x / 1.496e11, // Convert to AU
    y: y / 1.496e11,
    z: z / 1.496e11,
  }

  const velocity: Velocity3D = {
    vx: (vx * 86400) / 1.496e11, // Convert to AU/day
    vy: (vy * 86400) / 1.496e11,
    vz: (vz * 86400) / 1.496e11,
  }

  const distance = Math.sqrt(x * x + y * y + z * z) / 1.496e11 // AU

  return {
    position,
    velocity,
    distance,
    true_anomaly: rad2deg(nu),
  }
}

// Calculate future positions for orbit visualization
export function calculateOrbitPath(elements: OrbitalElements, days = 365, steps = 100): Position3D[] {
  const positions: Position3D[] = []
  const currentJD = 2460000 // Approximate current Julian Date

  for (let i = 0; i <= steps; i++) {
    const timeOffset = (i / steps) * days
    const state = calculateOrbitalState(elements, currentJD + timeOffset)
    positions.push(state.position)
  }

  return positions
}

// Calculate closest approach to Earth
export function calculateClosestApproach(
  elements: OrbitalElements,
  days = 1000,
): { distance: number; date: number; velocity: number } {
  let minDistance = Number.POSITIVE_INFINITY
  let closestDate = 0
  let closestVelocity = 0

  const currentJD = 2460000
  const earthPosition = { x: 1, y: 0, z: 0 } // Simplified Earth position

  for (let day = 0; day < days; day++) {
    const state = calculateOrbitalState(elements, currentJD + day)
    const dx = state.position.x - earthPosition.x
    const dy = state.position.y - earthPosition.y
    const dz = state.position.z - earthPosition.z
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

    if (distance < minDistance) {
      minDistance = distance
      closestDate = currentJD + day
      closestVelocity = Math.sqrt(
        state.velocity.vx * state.velocity.vx +
          state.velocity.vy * state.velocity.vy +
          state.velocity.vz * state.velocity.vz,
      )
    }
  }

  return {
    distance: minDistance,
    date: closestDate,
    velocity: closestVelocity,
  }
}
