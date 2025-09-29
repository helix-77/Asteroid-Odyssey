export interface Asteroid {
  id: string;
  name: string;
  diameter: number; // meters
  mass: number; // kg
  density: number; // kg/m³
  composition: string;
  orbitalElements: {
    semiMajorAxis: number; // AU
    eccentricity: number;
    inclination: number; // degrees
    longitudeOfAscendingNode: number; // degrees
    argumentOfPeriapsis: number; // degrees
    meanAnomaly: number; // degrees
  };
  velocity: number; // km/s
  threatLevel: "low" | "medium" | "high" | "critical";
  discoveryDate: string;
  nextApproach: string;
  minDistance: number; // AU
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
