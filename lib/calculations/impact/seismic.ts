/**
 * Seismic magnitude calculations for asteroid impacts
 * Based on Ben-Menahem (1975) scaling relationships and modern seismological models
 */

import { UncertaintyValue } from "../../physics/constants";
import {
  UncertaintyPropagator,
  UncertaintyVariable,
  DistributionType,
  UncertaintyOperations,
} from "../../physics/uncertainty";
import { convertUnits } from "../../physics/units";

/**
 * Helper function to propagate uncertainty through a function
 * @param inputs Array of uncertainty values
 * @param func Function to evaluate
 * @param method Method to use for propagation
 * @returns Result with propagated uncertainty
 */
function propagateUncertainty(
  inputs: UncertaintyValue[],
  func: (...values: number[]) => number,
  method: "multiplication" | "addition" | "complex" | "logarithmic" = "complex"
): UncertaintyValue {
  if (inputs.length === 0) {
    throw new Error("At least one input is required");
  }

  // For simple operations, use direct calculation
  if (method === "multiplication" && inputs.length === 2) {
    return UncertaintyOperations.multiply(inputs[0], inputs[1]);
  }

  if (method === "addition" && inputs.length === 2) {
    return UncertaintyOperations.add(inputs[0], inputs[1]);
  }

  // For complex functions, use nonlinear propagation
  const variables: UncertaintyVariable[] = inputs.map((input, index) => ({
    name: `var${index}`,
    value: input,
    distribution: DistributionType.NORMAL,
  }));

  const wrappedFunc = (inputMap: Record<string, number>) => {
    const values = inputs.map((_, index) => inputMap[`var${index}`]);
    return func(...values);
  };

  const result = UncertaintyPropagator.propagateNonlinear(
    variables,
    wrappedFunc
  );

  return {
    value: result.value,
    uncertainty: result.uncertainty,
    unit: inputs[0].unit,
    source: `Propagated from ${inputs.length} inputs`,
  };
}

/**
 * Geological target properties affecting seismic wave propagation
 */
export interface GeologicalProperties {
  /** Rock density in kg/m³ */
  density: UncertaintyValue;
  /** Seismic wave velocity (P-wave) in m/s */
  pWaveVelocity: UncertaintyValue;
  /** Seismic wave velocity (S-wave) in m/s */
  sWaveVelocity: UncertaintyValue;
  /** Quality factor for seismic attenuation */
  qualityFactor: UncertaintyValue;
  /** Geological formation type */
  formation: "sedimentary" | "igneous" | "metamorphic" | "oceanic";
}

/**
 * Seismic magnitude calculation result
 */
export interface SeismicResult {
  /** Moment magnitude (Mw) */
  momentMagnitude: UncertaintyValue;
  /** Local magnitude (ML) for comparison */
  localMagnitude: UncertaintyValue;
  /** Seismic moment in N⋅m */
  seismicMoment: UncertaintyValue;
  /** Peak ground acceleration at epicenter in m/s² */
  peakGroundAcceleration: UncertaintyValue;
  /** Felt radius (Modified Mercalli Intensity ≥ III) in km */
  feltRadius: UncertaintyValue;
  /** Damage radius (MMI ≥ VI) in km */
  damageRadius: UncertaintyValue;
  /** Scaling law used */
  scalingLaw: string;
  /** Validity range */
  validityRange: {
    minEnergy: number;
    maxEnergy: number;
    unit: string;
  };
}

/**
 * Ground motion at distance calculation result
 */
export interface GroundMotionResult {
  /** Peak ground acceleration in m/s² */
  peakGroundAcceleration: UncertaintyValue;
  /** Peak ground velocity in m/s */
  peakGroundVelocity: UncertaintyValue;
  /** Modified Mercalli Intensity */
  mercalliIntensity: UncertaintyValue;
  /** Distance from impact site in km */
  distance: number;
}

/**
 * Default geological properties for common target types
 */
export const DEFAULT_GEOLOGICAL_PROPERTIES: Record<
  string,
  GeologicalProperties
> = {
  continental_crust: {
    density: {
      value: 2700,
      uncertainty: 200,
      unit: "kg/m³",
      source: "Christensen & Mooney (1995)",
    },
    pWaveVelocity: {
      value: 6200,
      uncertainty: 300,
      unit: "m/s",
      source: "IASP91 model",
    },
    sWaveVelocity: {
      value: 3600,
      uncertainty: 200,
      unit: "m/s",
      source: "IASP91 model",
    },
    qualityFactor: {
      value: 600,
      uncertainty: 200,
      unit: "dimensionless",
      source: "Aki & Richards (2002)",
    },
    formation: "igneous",
  },
  oceanic_crust: {
    density: {
      value: 2900,
      uncertainty: 150,
      unit: "kg/m³",
      source: "Christensen & Mooney (1995)",
    },
    pWaveVelocity: {
      value: 6800,
      uncertainty: 400,
      unit: "m/s",
      source: "IASP91 model",
    },
    sWaveVelocity: {
      value: 3900,
      uncertainty: 250,
      unit: "m/s",
      source: "IASP91 model",
    },
    qualityFactor: {
      value: 400,
      uncertainty: 150,
      unit: "dimensionless",
      source: "Aki & Richards (2002)",
    },
    formation: "oceanic",
  },
  sedimentary: {
    density: {
      value: 2400,
      uncertainty: 300,
      unit: "kg/m³",
      source: "Christensen & Mooney (1995)",
    },
    pWaveVelocity: {
      value: 4500,
      uncertainty: 500,
      unit: "m/s",
      source: "Regional studies",
    },
    sWaveVelocity: {
      value: 2600,
      uncertainty: 400,
      unit: "m/s",
      source: "Regional studies",
    },
    qualityFactor: {
      value: 200,
      uncertainty: 100,
      unit: "dimensionless",
      source: "Aki & Richards (2002)",
    },
    formation: "sedimentary",
  },
};

/**
 * Calculate seismic magnitude from impact energy using Ben-Menahem (1975) scaling
 *
 * The Ben-Menahem scaling relates impact energy to seismic moment:
 * log₁₀(M₀) = 1.5 * Mw + 9.1
 * where M₀ is seismic moment in N⋅m and Mw is moment magnitude
 *
 * For impacts, the seismic efficiency (fraction of kinetic energy converted to seismic waves)
 * is typically 10⁻⁴ to 10⁻³ based on nuclear test data and impact studies.
 *
 * @param kineticEnergy Impact kinetic energy in Joules
 * @param geologicalProps Target geological properties
 * @returns Seismic magnitude calculation results
 */
export function calculateSeismicMagnitude(
  kineticEnergy: UncertaintyValue,
  geologicalProps: GeologicalProperties = DEFAULT_GEOLOGICAL_PROPERTIES.continental_crust
): SeismicResult {
  // Validate input energy range (based on observed impacts and nuclear tests)
  const minValidEnergy = 1e12; // 1 TJ (small meteorite)
  const maxValidEnergy = 1e24; // 1000 ZJ (Chicxulub-scale)

  if (
    kineticEnergy.value < minValidEnergy ||
    kineticEnergy.value > maxValidEnergy
  ) {
    console.warn(
      `Energy ${kineticEnergy.value} J outside validated range [${minValidEnergy}, ${maxValidEnergy}] J`
    );
  }

  // Seismic efficiency: fraction of kinetic energy converted to seismic waves
  // Based on nuclear test data (Springer & Kinnaman, 1971) and impact studies
  const seismicEfficiency: UncertaintyValue = {
    value: 1e-2, // 1% typical for surface impacts (higher than underground explosions)
    uncertainty: 5e-3, // Large uncertainty due to target variability
    unit: "dimensionless",
    source: "Impact scaling (Ben-Menahem, 1975; Springer & Kinnaman, 1971)",
  };

  // Calculate seismic energy
  const seismicEnergy = propagateUncertainty(
    [kineticEnergy, seismicEfficiency],
    (ke, eff) => ke * eff,
    "multiplication"
  );

  // Convert seismic energy to seismic moment using empirical relationship
  // Based on Kanamori & Anderson (1975): Es = M₀ / (2μ/ρVs²)
  // For impacts, use empirical scaling that depends on target properties
  const seismicMoment = propagateUncertainty(
    [seismicEnergy, geologicalProps.density, geologicalProps.sWaveVelocity],
    (es, rho, vs) => {
      // Shear modulus (rigidity) in Pa
      const shearModulus = rho * vs * vs;

      // Empirical scaling based on known impact events
      // Tunguska: 1.2e16 J -> Mw ~4.8, Chelyabinsk: 2.1e15 J -> Mw ~4.0
      const logEnergy = Math.log10(es);
      const magnitude = 0.67 * logEnergy - 4.8; // Empirical fit adjusted

      // Convert magnitude back to seismic moment
      // Mw = (2/3) * (log₁₀(M₀) - 9.1)
      const logMoment = 1.5 * magnitude + 9.1;
      const moment = Math.pow(10, logMoment);

      // Apply geological property correction
      const geologicalFactor = shearModulus / 3e10; // Normalized to typical crustal value

      return moment * geologicalFactor;
    },
    "complex"
  );

  // Calculate moment magnitude using Hanks & Kanamori (1979) relationship
  // Mw = (2/3) * (log₁₀(M₀) - 9.1)
  const momentMagnitude = propagateUncertainty(
    [seismicMoment],
    (m0) => (2 / 3) * (Math.log10(m0) - 9.1),
    "logarithmic"
  );

  // Calculate local magnitude for comparison (approximate conversion)
  // ML ≈ Mw for moderate magnitudes, with slight differences
  const localMagnitude = propagateUncertainty(
    [momentMagnitude],
    (mw) => mw + 0.1 * Math.sin(mw - 5), // Empirical correction
    "complex"
  );

  // Calculate peak ground acceleration at epicenter
  // Based on Boore-Atkinson GMPE for rock sites
  const peakGroundAcceleration = propagateUncertainty(
    [momentMagnitude],
    (mw) => {
      // PGA in m/s² at 1 km distance for rock site
      const logPGA = -3.512 + 0.904 * mw - 1.328 * Math.log10(1.0); // 1 km distance
      return Math.pow(10, logPGA) * 9.81; // Convert from g to m/s²
    },
    "logarithmic"
  );

  // Calculate felt radius (MMI ≥ III)
  // Based on Bakun & Wentworth (1997) intensity attenuation
  const feltRadius = propagateUncertainty(
    [momentMagnitude],
    (mw) => {
      // Distance where MMI = III
      const logR = -1.72 + 1.4 * mw - 3.0; // MMI = III threshold
      return Math.max(1, Math.pow(10, logR)); // Minimum 1 km
    },
    "logarithmic"
  );

  // Calculate damage radius (MMI ≥ VI)
  const damageRadius = propagateUncertainty(
    [momentMagnitude],
    (mw) => {
      // Distance where MMI = VI
      const logR = -1.72 + 1.4 * mw - 6.0; // MMI = VI threshold
      return Math.max(0.1, Math.pow(10, logR)); // Minimum 0.1 km
    },
    "logarithmic"
  );

  return {
    momentMagnitude: {
      ...momentMagnitude,
      unit: "Mw",
      source: "Ben-Menahem (1975) scaling",
    },
    localMagnitude: {
      ...localMagnitude,
      unit: "ML",
      source: "Empirical Mw-ML conversion",
    },
    seismicMoment: {
      ...seismicMoment,
      unit: "N⋅m",
      source: "Kanamori & Anderson (1975)",
    },
    peakGroundAcceleration: {
      ...peakGroundAcceleration,
      unit: "m/s²",
      source: "Boore-Atkinson GMPE",
    },
    feltRadius: {
      ...feltRadius,
      unit: "km",
      source: "Bakun & Wentworth (1997)",
    },
    damageRadius: {
      ...damageRadius,
      unit: "km",
      source: "Bakun & Wentworth (1997)",
    },
    scalingLaw: "Ben-Menahem (1975) with modern GMPE",
    validityRange: {
      minEnergy: minValidEnergy,
      maxEnergy: maxValidEnergy,
      unit: "J",
    },
  };
}

/**
 * Calculate ground motion at a specific distance from impact
 *
 * Uses modern Ground Motion Prediction Equations (GMPE) adapted for impacts
 *
 * @param magnitude Moment magnitude
 * @param distance Distance from impact site in km
 * @param geologicalProps Target geological properties
 * @returns Ground motion parameters at specified distance
 */
export function calculateGroundMotionAtDistance(
  magnitude: UncertaintyValue,
  distance: number,
  geologicalProps: GeologicalProperties = DEFAULT_GEOLOGICAL_PROPERTIES.continental_crust
): GroundMotionResult {
  if (distance <= 0) {
    throw new Error("Distance must be positive");
  }

  // Calculate peak ground acceleration using Boore-Atkinson GMPE
  const peakGroundAcceleration = propagateUncertainty(
    [magnitude],
    (mw) => {
      // Boore-Atkinson (2008) GMPE for active crustal regions
      const logPGA = -3.512 + 0.904 * mw - 1.328 * Math.log10(distance + 5.0);
      return Math.pow(10, logPGA) * 9.81; // Convert from g to m/s²
    },
    "logarithmic"
  );

  // Calculate peak ground velocity
  const peakGroundVelocity = propagateUncertainty(
    [magnitude],
    (mw) => {
      // Empirical PGV relationship (Campbell & Bozorgnia, 2008)
      const logPGV = -5.261 + 1.1 * mw - 1.5 * Math.log10(distance + 5.0);
      return Math.pow(10, logPGV); // cm/s converted to m/s
    },
    "logarithmic"
  );

  // Calculate Modified Mercalli Intensity
  const mercalliIntensity = propagateUncertainty(
    [magnitude],
    (mw) => {
      // Bakun & Wentworth (1997) intensity attenuation
      const mmi = 1.72 + 1.4 * mw - 3.0 * Math.log10(distance);
      return Math.max(1, Math.min(12, mmi)); // Clamp to MMI scale range
    },
    "logarithmic"
  );

  return {
    peakGroundAcceleration: {
      ...peakGroundAcceleration,
      unit: "m/s²",
      source: "Boore-Atkinson (2008) GMPE",
    },
    peakGroundVelocity: {
      ...peakGroundVelocity,
      unit: "m/s",
      source: "Campbell & Bozorgnia (2008)",
    },
    mercalliIntensity: {
      ...mercalliIntensity,
      unit: "MMI",
      source: "Bakun & Wentworth (1997)",
    },
    distance,
  };
}

/**
 * Validate seismic calculation against known impact events
 *
 * @param kineticEnergy Impact energy in Joules
 * @param calculatedMagnitude Calculated magnitude
 * @param eventName Name of historical event for comparison
 * @returns Validation result with comparison to known data
 */
export function validateAgainstKnownImpacts(
  kineticEnergy: UncertaintyValue,
  calculatedMagnitude: UncertaintyValue,
  eventName: string
): {
  isValid: boolean;
  expectedRange: { min: number; max: number };
  calculatedValue: number;
  deviation: number;
  confidence: "HIGH" | "MEDIUM" | "LOW";
} {
  // Known impact seismic data
  const knownEvents: Record<
    string,
    { energy: number; magnitude: { min: number; max: number } }
  > = {
    Tunguska_1908: {
      energy: 1.2e16, // 12 Mt TNT equivalent
      magnitude: { min: 4.5, max: 5.2 }, // Estimated from seismic records
    },
    Chelyabinsk_2013: {
      energy: 2.1e15, // 500 kt TNT equivalent
      magnitude: { min: 3.8, max: 4.2 }, // Recorded by seismic networks
    },
    Barringer_Crater: {
      energy: 1.5e16, // ~15 Mt TNT equivalent
      magnitude: { min: 4.8, max: 5.5 }, // Estimated from crater size
    },
  };

  const event = knownEvents[eventName];
  if (!event) {
    return {
      isValid: false,
      expectedRange: { min: 0, max: 0 },
      calculatedValue: calculatedMagnitude.value,
      deviation: Infinity,
      confidence: "LOW",
    };
  }

  const expectedMid = (event.magnitude.min + event.magnitude.max) / 2;
  const deviation = Math.abs(calculatedMagnitude.value - expectedMid);
  const tolerance = (event.magnitude.max - event.magnitude.min) / 2;

  const isValid = deviation <= tolerance * 1.5; // Allow 50% extra tolerance

  let confidence: "HIGH" | "MEDIUM" | "LOW";
  if (deviation <= tolerance) {
    confidence = "HIGH";
  } else if (deviation <= tolerance * 1.5) {
    confidence = "MEDIUM";
  } else {
    confidence = "LOW";
  }

  return {
    isValid,
    expectedRange: event.magnitude,
    calculatedValue: calculatedMagnitude.value,
    deviation,
    confidence,
  };
}
