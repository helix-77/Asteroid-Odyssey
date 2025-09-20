export interface Asteroid {
  id: string
  name: string
  diameter: number // meters
  mass: number // kg
  density: number // kg/m³
  composition: string
  orbitalElements: {
    semiMajorAxis: number // AU
    eccentricity: number
    inclination: number // degrees
    longitudeOfAscendingNode: number // degrees
    argumentOfPeriapsis: number // degrees
    meanAnomaly: number // degrees
  }
  velocity: number // km/s
  threatLevel: "low" | "medium" | "high" | "critical"
  discoveryDate: string
  nextApproach: string
  minDistance: number // AU
}

export interface ImpactResults {
  craterDiameter: number // meters
  blastRadius: number // meters
  energyMegatons: number
  seismicMagnitude: number
  casualties: number
  economicDamage: number // USD
  environmentalImpact: string
  recoveryTime: number // years
}

export interface DeflectionStrategy {
  id: string
  name: string
  type: "kinetic" | "nuclear" | "gravity" | "solar"
  description: string
  effectiveness: number // 0-1
  cost: number // USD millions
  timeRequired: number // years
  technicalReadiness: number // 1-9 TRL scale
  risks: string[]
  requirements: {
    mass: number // kg
    power: number // kW
    deltaV: number // m/s
  }
}
