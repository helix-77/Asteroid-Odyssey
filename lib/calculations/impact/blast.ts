/**
 * Blast Effects Calculations
 * Implements Glasstone & Dolan (1977) nuclear scaling for impact blast effects
 * Adapted for kinetic impact events with proper atmospheric scaling
 */

import { UncertaintyValue } from "../../physics/constants";
import { UnitConverter } from "../../physics/units";
import {
  UncertaintyPropagator,
  UncertaintyVariable,
  DistributionType,
} from "../../physics/uncertainty";

/**
 * Atmospheric properties for blast calculations
 */
export interface AtmosphericConditions {
  pressure: UncertaintyValue; // Pa
  density: UncertaintyValue; // kg/m³
  temperature: UncertaintyValue; // K
  humidity: UncertaintyValue; // relative humidity (0-1)
  description: string;
}

/**
 * Blast effects result with uncertainties
 */
export interface BlastEffectsResult {
  fireball: {
    radius: UncertaintyValue; // m
    duration: UncertaintyValue; // s
    temperature: UncertaintyValue; // K
    luminosity: UncertaintyValue; // W
  };
  airblast: {
    overpressure1psi: UncertaintyValue; // m (radius for 1 psi overpressure)
    overpressure5psi: UncertaintyValue; // m (radius for 5 psi overpressure)
    overpressure10psi: UncertaintyValue; // m (radius for 10 psi overpressure)
    dynamicPressure: UncertaintyValue; // Pa (at 1 psi overpressure radius)
    arrivalTime: UncertaintyValue; // s (at 1 psi overpressure radius)
  };
  thermal: {
    radiationRadius1stDegree: UncertaintyValue; // m (1st degree burns)
    radiationRadius2ndDegree: UncertaintyValue; // m (2nd degree burns)
    radiationRadius3rdDegree: UncertaintyValue; // m (3rd degree burns)
    thermalFluence: UncertaintyValue; // J/m² (at 1st degree burn radius)
    pulseWidth: UncertaintyValue; // s
  };
  validityCheck: {
    isValid: boolean;
    warnings: string[];
    limitations: string[];
  };
  scalingMethod: string;
  atmosphericConditions: string;
}

/**
 * Standard atmospheric conditions
 */
export const STANDARD_ATMOSPHERE: AtmosphericConditions = {
  pressure: new UncertaintyValue(
    101325,
    0,
    "Pa",
    "ISO 2533",
    "Standard atmospheric pressure"
  ),
  density: new UncertaintyValue(
    1.225,
    0.01,
    "kg/m³",
    "ISO 2533",
    "Standard atmospheric density at sea level"
  ),
  temperature: new UncertaintyValue(
    288.15,
    0,
    "K",
    "ISO 2533",
    "Standard atmospheric temperature"
  ),
  humidity: new UncertaintyValue(0.0, 0.0, "1", "Assumed", "Dry air"),
  description: "Standard atmosphere (sea level, 15°C, dry air)",
};

/**
 * High altitude atmospheric conditions (typical for airbursts)
 */
export const HIGH_ALTITUDE_ATMOSPHERE: AtmosphericConditions = {
  pressure: new UncertaintyValue(
    26500,
    1000,
    "Pa",
    "US Standard Atmosphere",
    "Pressure at 10 km altitude"
  ),
  density: new UncertaintyValue(
    0.414,
    0.02,
    "kg/m³",
    "US Standard Atmosphere",
    "Density at 10 km altitude"
  ),
  temperature: new UncertaintyValue(
    223.15,
    2,
    "K",
    "US Standard Atmosphere",
    "Temperature at 10 km altitude"
  ),
  humidity: new UncertaintyValue(
    0.0,
    0.0,
    "1",
    "Assumed",
    "Dry air at altitude"
  ),
  description: "High altitude atmosphere (10 km, typical airburst altitude)",
};

/**
 * Calculate comprehensive blast effects from impact energy
 */
export function calculateBlastEffects(
  impactEnergy: UncertaintyValue, // J
  burstAltitude: UncertaintyValue, // m (0 for surface burst, >0 for airburst)
  atmosphericConditions: AtmosphericConditions = STANDARD_ATMOSPHERE
): BlastEffectsResult {
  // Convert energy to TNT equivalent for scaling
  const tntEquivalent = convertEnergyToTNT(impactEnergy);

  // Validate input parameters
  const validityCheck = validateBlastParameters(
    impactEnergy,
    burstAltitude,
    tntEquivalent
  );

  // Calculate fireball effects
  const fireball = calculateFireballEffects(
    tntEquivalent,
    burstAltitude,
    atmosphericConditions
  );

  // Calculate airblast effects
  const airblast = calculateAirblastEffects(
    tntEquivalent,
    burstAltitude,
    atmosphericConditions
  );

  // Calculate thermal radiation effects
  const thermal = calculateThermalEffects(
    tntEquivalent,
    burstAltitude,
    atmosphericConditions
  );

  return {
    fireball,
    airblast,
    thermal,
    validityCheck,
    scalingMethod: "Glasstone & Dolan (1977) nuclear effects scaling",
    atmosphericConditions: atmosphericConditions.description,
  };
}

/**
 * Convert impact energy to TNT equivalent
 */
function convertEnergyToTNT(impactEnergy: UncertaintyValue): UncertaintyValue {
  // TNT energy density: 4.184 × 10^6 J/kg, or 4.184 × 10^12 J/kt
  const tntEnergyPerKiloton = new UncertaintyValue(
    4.184e12,
    0,
    "J/kt",
    "Standard TNT energy density",
    "Energy per kiloton of TNT"
  );

  const variables: UncertaintyVariable[] = [
    {
      name: "energy",
      value: impactEnergy,
      distribution: DistributionType.NORMAL,
    },
    {
      name: "tntEnergy",
      value: tntEnergyPerKiloton,
      distribution: DistributionType.NORMAL,
    },
  ];

  const conversionFunction = (inputs: Record<string, number>) => {
    const { energy, tntEnergy } = inputs;
    return energy / tntEnergy;
  };

  const result = UncertaintyPropagator.propagateNonlinear(
    variables,
    conversionFunction
  );

  return new UncertaintyValue(
    result.value,
    result.uncertainty,
    "kt TNT",
    "Calculated from impact energy",
    "TNT equivalent yield"
  );
}

/**
 * Calculate fireball effects using Glasstone & Dolan scaling
 */
function calculateFireballEffects(
  tntEquivalent: UncertaintyValue,
  burstAltitude: UncertaintyValue,
  atmosphericConditions: AtmosphericConditions
): BlastEffectsResult["fireball"] {
  // Fireball radius scaling: R = 0.28 * W^0.4 (km) for surface burst
  // Adjusted for atmospheric density and burst altitude
  const variables: UncertaintyVariable[] = [
    {
      name: "yield",
      value: tntEquivalent,
      distribution: DistributionType.NORMAL,
    },
    {
      name: "density",
      value: atmosphericConditions.density,
      distribution: DistributionType.NORMAL,
    },
  ];

  const radiusFunction = (inputs: Record<string, number>) => {
    const { yield: yieldKt, density } = inputs;

    // Base scaling from Glasstone & Dolan
    let radius = 0.28 * Math.pow(yieldKt, 0.4) * 1000; // Convert km to m

    // Atmospheric density correction
    const densityCorrection = Math.pow(1.225 / density, 0.2); // Standard density = 1.225 kg/m³
    radius *= densityCorrection;

    // Altitude correction for airbursts
    if (inputs.altitude && inputs.altitude > 0) {
      const altitudeCorrection = Math.pow(1 + inputs.altitude / 10000, 0.1);
      radius *= altitudeCorrection;
    }

    return radius;
  };

  // Add altitude to variables if it's an airburst
  if (burstAltitude.value > 0) {
    variables.push({
      name: "altitude",
      value: burstAltitude,
      distribution: DistributionType.NORMAL,
    });
  }

  const radiusResult = UncertaintyPropagator.propagateNonlinear(
    variables,
    radiusFunction
  );
  const radius = new UncertaintyValue(
    radiusResult.value,
    radiusResult.uncertainty,
    "m",
    "Glasstone & Dolan (1977) scaling",
    "Fireball radius"
  );

  // Fireball duration: t = 0.44 * W^0.4 (seconds)
  const durationFunction = (inputs: Record<string, number>) => {
    const { yield: yieldKt } = inputs;
    return 0.44 * Math.pow(yieldKt, 0.4);
  };

  const durationResult = UncertaintyPropagator.propagateNonlinear(
    [
      {
        name: "yield",
        value: tntEquivalent,
        distribution: DistributionType.NORMAL,
      },
    ],
    durationFunction
  );

  const duration = new UncertaintyValue(
    durationResult.value,
    durationResult.uncertainty,
    "s",
    "Glasstone & Dolan (1977) scaling",
    "Fireball duration"
  );

  // Fireball temperature: approximately 3000-4000 K for nuclear explosions
  const temperature = new UncertaintyValue(
    3500,
    500,
    "K",
    "Glasstone & Dolan (1977)",
    "Peak fireball temperature"
  );

  // Fireball luminosity: L = σ * A * T^4 where A is surface area
  const luminosityFunction = (inputs: Record<string, number>) => {
    const { radius: r, temp } = inputs;
    const stefanBoltzmann = 5.670374419e-8; // W m^-2 K^-4
    const surfaceArea = 4 * Math.PI * r * r;
    return stefanBoltzmann * surfaceArea * Math.pow(temp, 4);
  };

  const luminosityResult = UncertaintyPropagator.propagateNonlinear(
    [
      { name: "radius", value: radius, distribution: DistributionType.NORMAL },
      {
        name: "temp",
        value: temperature,
        distribution: DistributionType.NORMAL,
      },
    ],
    luminosityFunction
  );

  const luminosity = new UncertaintyValue(
    luminosityResult.value,
    luminosityResult.uncertainty,
    "W",
    "Calculated from Stefan-Boltzmann law",
    "Fireball luminosity"
  );

  return {
    radius,
    duration,
    temperature,
    luminosity,
  };
}

/**
 * Calculate airblast effects using Glasstone & Dolan scaling
 */
function calculateAirblastEffects(
  tntEquivalent: UncertaintyValue,
  burstAltitude: UncertaintyValue,
  atmosphericConditions: AtmosphericConditions
): BlastEffectsResult["airblast"] {
  // Overpressure scaling: R = K * W^(1/3) where K depends on overpressure level
  // K values from Glasstone & Dolan for different overpressure levels
  const scalingConstants = {
    psi1: 2.2, // 1 psi (6.9 kPa)
    psi5: 1.0, // 5 psi (34.5 kPa)
    psi10: 0.7, // 10 psi (69 kPa)
  };

  const calculateOverpressureRadius = (kValue: number) => {
    const variables: UncertaintyVariable[] = [
      {
        name: "yield",
        value: tntEquivalent,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "pressure",
        value: atmosphericConditions.pressure,
        distribution: DistributionType.NORMAL,
      },
    ];

    const radiusFunction = (inputs: Record<string, number>) => {
      const { yield: yieldKt, pressure } = inputs;

      // Base scaling
      let radius = kValue * Math.pow(yieldKt, 1 / 3) * 1000; // Convert km to m

      // Atmospheric pressure correction
      const pressureCorrection = Math.pow(101325 / pressure, 1 / 3);
      radius *= pressureCorrection;

      // Altitude correction for airbursts
      if (burstAltitude.value > 0) {
        const altitudeCorrection =
          1 + 0.1 * Math.log(1 + burstAltitude.value / 1000);
        radius *= altitudeCorrection;
      }

      return radius;
    };

    const result = UncertaintyPropagator.propagateNonlinear(
      variables,
      radiusFunction
    );
    return new UncertaintyValue(
      result.value,
      result.uncertainty,
      "m",
      "Glasstone & Dolan (1977) scaling",
      `Overpressure radius for ${
        kValue === 2.2 ? "1" : kValue === 1.0 ? "5" : "10"
      } psi`
    );
  };

  const overpressure1psi = calculateOverpressureRadius(scalingConstants.psi1);
  const overpressure5psi = calculateOverpressureRadius(scalingConstants.psi5);
  const overpressure10psi = calculateOverpressureRadius(scalingConstants.psi10);

  // Dynamic pressure at 1 psi overpressure radius
  // q = 0.5 * ρ * v^2 where v is wind velocity behind shock
  const dynamicPressureFunction = (inputs: Record<string, number>) => {
    const { density } = inputs;
    // Wind velocity behind 1 psi shock is approximately 70 m/s
    const windVelocity = 70; // m/s
    return 0.5 * density * windVelocity * windVelocity;
  };

  const dynamicPressureResult = UncertaintyPropagator.propagateNonlinear(
    [
      {
        name: "density",
        value: atmosphericConditions.density,
        distribution: DistributionType.NORMAL,
      },
    ],
    dynamicPressureFunction
  );

  const dynamicPressure = new UncertaintyValue(
    dynamicPressureResult.value,
    dynamicPressureResult.uncertainty,
    "Pa",
    "Calculated from shock wave theory",
    "Dynamic pressure at 1 psi overpressure radius"
  );

  // Arrival time of blast wave
  const arrivalTimeFunction = (inputs: Record<string, number>) => {
    const { radius, temp, pressure } = inputs;
    // Sound speed: c = sqrt(γ * R * T) where γ = 1.4 for air, R = 287 J/(kg·K)
    const soundSpeed = Math.sqrt(1.4 * 287 * temp);
    // Blast wave travels faster than sound initially, use average speed
    const averageSpeed = soundSpeed * 1.2;
    return radius / averageSpeed;
  };

  const arrivalTimeResult = UncertaintyPropagator.propagateNonlinear(
    [
      {
        name: "radius",
        value: overpressure1psi,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "temp",
        value: atmosphericConditions.temperature,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "pressure",
        value: atmosphericConditions.pressure,
        distribution: DistributionType.NORMAL,
      },
    ],
    arrivalTimeFunction
  );

  const arrivalTime = new UncertaintyValue(
    arrivalTimeResult.value,
    arrivalTimeResult.uncertainty,
    "s",
    "Calculated from blast wave propagation",
    "Arrival time at 1 psi overpressure radius"
  );

  return {
    overpressure1psi,
    overpressure5psi,
    overpressure10psi,
    dynamicPressure,
    arrivalTime,
  };
}

/**
 * Calculate thermal radiation effects
 */
function calculateThermalEffects(
  tntEquivalent: UncertaintyValue,
  burstAltitude: UncertaintyValue,
  atmosphericConditions: AtmosphericConditions
): BlastEffectsResult["thermal"] {
  // Thermal radiation scaling from Glasstone & Dolan
  // Different scaling constants for different burn levels
  const thermalScaling = {
    firstDegree: 1.9, // 1st degree burns (1 cal/cm²)
    secondDegree: 1.2, // 2nd degree burns (4 cal/cm²)
    thirdDegree: 0.8, // 3rd degree burns (10 cal/cm²)
  };

  const calculateThermalRadius = (
    scalingConstant: number,
    fluenceThreshold: number
  ) => {
    const variables: UncertaintyVariable[] = [
      {
        name: "yield",
        value: tntEquivalent,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "humidity",
        value: atmosphericConditions.humidity,
        distribution: DistributionType.NORMAL,
      },
    ];

    const radiusFunction = (inputs: Record<string, number>) => {
      const { yield: yieldKt, humidity } = inputs;

      // Base scaling: R = K * W^0.41 (km)
      let radius = scalingConstant * Math.pow(yieldKt, 0.41) * 1000; // Convert to meters

      // Atmospheric absorption correction (humidity and altitude)
      const absorptionFactor = Math.exp(
        -0.1 * humidity - burstAltitude.value / 50000
      );
      radius *= Math.sqrt(absorptionFactor);

      return radius;
    };

    const result = UncertaintyPropagator.propagateNonlinear(
      variables,
      radiusFunction
    );
    return new UncertaintyValue(
      result.value,
      result.uncertainty,
      "m",
      "Glasstone & Dolan (1977) thermal scaling",
      `Thermal radiation radius for ${fluenceThreshold} cal/cm² fluence`
    );
  };

  const radiationRadius1stDegree = calculateThermalRadius(
    thermalScaling.firstDegree,
    1
  );
  const radiationRadius2ndDegree = calculateThermalRadius(
    thermalScaling.secondDegree,
    4
  );
  const radiationRadius3rdDegree = calculateThermalRadius(
    thermalScaling.thirdDegree,
    10
  );

  // Thermal fluence at 1st degree burn radius
  const thermalFluenceFunction = (inputs: Record<string, number>) => {
    const { yield: yieldKt, radius } = inputs;
    // Total thermal energy is approximately 35% of total yield for nuclear explosions
    const thermalEnergy = yieldKt * 4.184e12 * 0.35; // J
    const surfaceArea = 4 * Math.PI * radius * radius;
    return thermalEnergy / surfaceArea; // J/m²
  };

  const thermalFluenceResult = UncertaintyPropagator.propagateNonlinear(
    [
      {
        name: "yield",
        value: tntEquivalent,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "radius",
        value: radiationRadius1stDegree,
        distribution: DistributionType.NORMAL,
      },
    ],
    thermalFluenceFunction
  );

  const thermalFluence = new UncertaintyValue(
    thermalFluenceResult.value,
    thermalFluenceResult.uncertainty,
    "J/m²",
    "Calculated from thermal energy distribution",
    "Thermal fluence at 1st degree burn radius"
  );

  // Thermal pulse width (duration of thermal radiation)
  const pulseWidthFunction = (inputs: Record<string, number>) => {
    const { yield: yieldKt } = inputs;
    // Pulse width scales as W^0.44 for yields > 1 kt
    return Math.max(0.2, 0.44 * Math.pow(yieldKt, 0.44));
  };

  const pulseWidthResult = UncertaintyPropagator.propagateNonlinear(
    [
      {
        name: "yield",
        value: tntEquivalent,
        distribution: DistributionType.NORMAL,
      },
    ],
    pulseWidthFunction
  );

  const pulseWidth = new UncertaintyValue(
    pulseWidthResult.value,
    pulseWidthResult.uncertainty,
    "s",
    "Glasstone & Dolan (1977) scaling",
    "Thermal pulse width"
  );

  return {
    radiationRadius1stDegree,
    radiationRadius2ndDegree,
    radiationRadius3rdDegree,
    thermalFluence,
    pulseWidth,
  };
}

/**
 * Validate blast calculation parameters
 */
function validateBlastParameters(
  impactEnergy: UncertaintyValue,
  burstAltitude: UncertaintyValue,
  tntEquivalent: UncertaintyValue
): { isValid: boolean; warnings: string[]; limitations: string[] } {
  const warnings: string[] = [];
  const limitations: string[] = [];
  let isValid = true;

  // Check energy range - Glasstone & Dolan scaling valid for 1 kt to 20 Mt
  if (tntEquivalent.value < 0.001) {
    warnings.push(
      `TNT equivalent (${tntEquivalent.value.toFixed(
        6
      )} kt) is below validated range (>0.001 kt)`
    );
    isValid = false;
  }
  if (tntEquivalent.value > 20000) {
    warnings.push(
      `TNT equivalent (${tntEquivalent.value.toFixed(
        0
      )} kt) is above validated range (<20,000 kt)`
    );
    isValid = false;
  }

  // Check burst altitude
  if (burstAltitude.value > 50000) {
    warnings.push(
      `Burst altitude (${burstAltitude.value.toFixed(
        0
      )} m) is very high - atmospheric effects may be underestimated`
    );
  }

  // General limitations
  limitations.push("Scaling laws derived from nuclear weapons tests");
  limitations.push("Assumes spherical symmetry and homogeneous atmosphere");
  limitations.push(
    "Does not account for terrain effects or meteorological conditions"
  );
  limitations.push("Thermal effects assume clear atmospheric conditions");
  limitations.push("Overpressure scaling assumes ideal gas behavior");

  return { isValid, warnings, limitations };
}

/**
 * Validate against known impact events
 */
export function validateAgainstKnownEvents(): Array<{
  name: string;
  observed: {
    energy: number; // J
    blastRadius?: number; // m
    thermalRadius?: number; // m
  };
  calculated: BlastEffectsResult;
  agreement: string;
}> {
  const knownEvents = [
    {
      name: "Chelyabinsk (2013)",
      energy: new UncertaintyValue(
        5e14,
        1e14,
        "J",
        "Brown et al. (2013)",
        "Estimated impact energy"
      ),
      altitude: new UncertaintyValue(
        23000,
        2000,
        "m",
        "Brown et al. (2013)",
        "Airburst altitude"
      ),
      observed: {
        energy: 5e14,
        blastRadius: 100000, // Approximate radius of window damage
        thermalRadius: 50000, // Approximate radius of thermal effects
      },
    },
    {
      name: "Tunguska (1908)",
      energy: new UncertaintyValue(
        1.2e16,
        5e15,
        "J",
        "Boslough & Crawford (2008)",
        "Estimated impact energy"
      ),
      altitude: new UncertaintyValue(
        8000,
        2000,
        "m",
        "Boslough & Crawford (2008)",
        "Estimated airburst altitude"
      ),
      observed: {
        energy: 1.2e16,
        blastRadius: 2000000, // Approximate radius of tree damage
        thermalRadius: 500000, // Approximate radius of thermal effects
      },
    },
  ];

  return knownEvents.map((event) => {
    const calculated = calculateBlastEffects(
      event.energy,
      event.altitude,
      HIGH_ALTITUDE_ATMOSPHERE
    );

    // Compare blast radius (use 1 psi overpressure as proxy for damage)
    const blastRatio = event.observed.blastRadius
      ? calculated.airblast.overpressure1psi.value / event.observed.blastRadius
      : 0;

    const agreement =
      blastRatio > 0.5 && blastRatio < 2.0
        ? "Good"
        : blastRatio > 0.2 && blastRatio < 5.0
        ? "Fair"
        : "Poor";

    return {
      name: event.name,
      observed: event.observed,
      calculated,
      agreement,
    };
  });
}

/**
 * Get atmospheric conditions by name
 */
export function getAtmosphericConditions(name: string): AtmosphericConditions {
  const conditions = {
    standard: STANDARD_ATMOSPHERE,
    highAltitude: HIGH_ALTITUDE_ATMOSPHERE,
  };

  const condition = conditions[name as keyof typeof conditions];
  if (!condition) {
    throw new Error(
      `Unknown atmospheric condition: ${name}. Available: ${Object.keys(
        conditions
      ).join(", ")}`
    );
  }
  return condition;
}
