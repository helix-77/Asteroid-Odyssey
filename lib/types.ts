export interface Asteroid {
  id: string;
  name: string;
  size?: number; // meters (diameter)
  diameter?: number; // meters (alias for size)
  mass: number; // kg
  density?: number; // kg/m³
  composition: string;
  orbit?: {
    semi_major_axis: number; // AU
    eccentricity: number;
    inclination: number; // degrees
    ascending_node: number; // degrees
    perihelion: number; // degrees
    mean_anomaly: number; // degrees
  };
  orbitalElements?: {
    semiMajorAxis: number; // AU
    eccentricity: number;
    inclination: number; // degrees
    longitudeOfAscendingNode: number; // degrees
    argumentOfPeriapsis: number; // degrees
    meanAnomaly: number; // degrees
  };
  close_approach?: {
    date: string;
    distance: number; // AU
    velocity: number; // km/s
  };
  velocity: number; // km/s
  threat_level?: "low" | "medium" | "high" | "critical";
  threatLevel?: "low" | "medium" | "high" | "critical";
  impact_probability?: number;
  discovery_date?: string;
  discoveryDate?: string;
  absolute_magnitude?: number;
  nextApproach?: string;
  minDistance?: number; // AU
}

// Enhanced scientific asteroid interface (from nasa-processor.ts)
export interface ScientificAsteroid {
  // Basic identification
  id: string;
  name: string;
  neoReferenceId: string;

  // Observed properties with uncertainties
  absoluteMagnitude: {
    value: number;
    uncertainty: number;
    source: string;
  };

  diameter: {
    min: number;
    max: number;
    estimated: number;
    uncertainty: number;
    unit: string;
    derivationMethod: string;
  };

  // Derived physical properties
  mass: {
    value: number;
    uncertainty: number;
    unit: string;
    derivationMethod: string;
  };

  density: {
    value: number;
    uncertainty: number;
    unit: string;
    source: string;
  };

  composition: {
    type: string;
    confidence: number;
    source: string;
  };

  // Enhanced orbital elements
  orbitalElements: {
    semiMajorAxis: number; // AU
    eccentricity: number;
    inclination: number; // degrees
    longitudeOfAscendingNode: number; // degrees
    argumentOfPeriapsis: number; // degrees
    meanAnomaly: number; // degrees
    epoch: {
      jd: number; // Julian Date
      calendar: string;
    };
    // Covariance matrix for uncertainty propagation
    covariance?: number[][]; // 6x6 matrix
  };

  // Close approach data
  closeApproach: {
    date: string;
    julianDate: number;
    missDistance: {
      km: number;
      au: number;
      lunar: number;
    };
    relativeVelocity: {
      kmPerSec: number;
      kmPerHour: number;
    };
    orbitingBody: string;
  };

  // Data quality and provenance
  dataQuality: {
    uncertaintyClass: "HIGH" | "MEDIUM" | "LOW";
    observationArc: {
      days: number;
      firstObservation: string;
      lastObservation: string;
    };
    numberOfObservations: number;
    dataReliability: number; // 0-1 scale
  };

  // Threat assessment
  threatAssessment: {
    isPotentiallyHazardous: boolean;
    impactProbability: number;
    threatLevel: "low" | "medium" | "high" | "critical";
    nextSignificantApproach: string;
  };

  // Metadata
  metadata: {
    lastUpdated: string;
    dataVersion: string;
    sources: string[];
    processingNotes: string[];
  };
}

export interface ImpactResults {
  craterDiameter: number; // meters
  blastRadius: number; // meters
  energyMegatons: number;
  seismicMagnitude: number;
  casualties: number;
  economicDamage: number; // USD
  environmentalImpact: string;
  recoveryTime: number; // years
  kineticEnergy?: number; // Joules
  tntEquivalent?: number; // kilotons
  crater?: {
    diameter: number; // meters
    depth: number; // meters
    volume: number; // cubic meters
  };
  effects?: {
    fireballRadius: number; // km
    airblastRadius: number; // km
    thermalRadiation: number; // km
    seismicMagnitude: number;
  };
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
