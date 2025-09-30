export interface Asteroid {
  id: string;
  name: string;
  // Dimensions
  size?: number; // meters (diameter)
  diameter?: number; // meters (alias for size)
  // Physical properties
  mass?: number; // kg
  density?: number; // kg/m³
  composition?: string;
  // Kinematics
  velocity?: number; // km/s
  // Orbit (snake_case to match JSON)
  orbit?: {
    semi_major_axis: number; // AU
    eccentricity: number;
    inclination: number; // degrees
    ascending_node: number; // degrees
    perihelion: number; // degrees
    mean_anomaly: number; // degrees
  };
  // Close approach (snake_case to match JSON)
  close_approach?: {
    date: string;
    distance: number; // AU
    velocity: number; // km/s
  };
  // Threat/metadata (snake_case to match JSON)
  threat_level?: "low" | "medium" | "high" | "critical";
  impact_probability?: number;
  discovery_date?: string;
  absolute_magnitude?: number;
  // Alternate camelCase fields for broader compatibility
  threatLevel?: "low" | "medium" | "high" | "critical";
  discoveryDate?: string;
}

export interface ImpactResults {
  kineticEnergy: number; // Joules
  tntEquivalent: number; // kilotons
  crater: {
    diameter: number; // meters
    depth: number; // meters
    volume: number; // cubic meters
  };
  effects: {
    fireballRadius: number; // km
    airblastRadius: number; // km
    thermalRadiation: number; // km
    seismicMagnitude: number;
  };
  casualties: {
    immediate: number;
    injured: number;
    displaced: number;
  };
  economicImpact: number; // USD
}

export interface DeflectionStrategy {
  id: string;
  name: string;
  type: "kinetic" | "nuclear" | "gravity" | "solar";
  description: string;
  effectiveness: number; // 0-1
  cost: number; // USD millions
  timeRequired: number; // years
  technicalReadiness: number; // 1-9 TRL scale
  risks: string[];
  requirements: {
    mass: number; // kg
    power: number; // kW
    deltaV: number; // m/s
  };
}
