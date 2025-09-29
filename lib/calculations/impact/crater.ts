/**
 * Crater Formation Models
 * Implements Holsapple & Housen (2007) scaling laws for impact crater formation
 * Based on peer-reviewed scaling relationships from laboratory and field data
 */

import { UncertaintyValue } from "../../physics/constants";
import { UnitConverter } from "../../physics/units";
import {
  UncertaintyPropagator,
  UncertaintyVariable,
  DistributionType,
} from "../../physics/uncertainty";

/**
 * Target material properties for crater formation calculations
 */
export interface TargetMaterial {
  name: string;
  density: UncertaintyValue; // kg/m³
  strength: UncertaintyValue; // Pa (cohesive strength)
  porosity: UncertaintyValue; // dimensionless (0-1)
  description: string;
}

/**
 * Crater scaling parameters from Holsapple & Housen (2007)
 */
export interface CraterScalingParameters {
  K1: UncertaintyValue; // Diameter scaling constant
  K2: UncertaintyValue; // Depth scaling constant
  mu: UncertaintyValue; // Scaling exponent
  nu: UncertaintyValue; // Velocity scaling exponent
  validityRange: {
    minEnergy: number; // J
    maxEnergy: number; // J
    minVelocity: number; // m/s
    maxVelocity: number; // m/s
  };
  reference: string;
}

/**
 * Crater formation result with uncertainties
 */
export interface CraterResult {
  diameter: UncertaintyValue; // m
  depth: UncertaintyValue; // m
  volume: UncertaintyValue; // m³
  rimHeight: UncertaintyValue; // m
  ejectaVolume: UncertaintyValue; // m³
  ejectaRange: UncertaintyValue; // m
  formationTime: UncertaintyValue; // s
  scalingLaw: string;
  targetMaterial: string;
  impactAngle: UncertaintyValue; // degrees
  validityCheck: {
    isValid: boolean;
    warnings: string[];
    limitations: string[];
  };
}

/**
 * Database of target material properties
 */
export const TARGET_MATERIALS: Record<string, TargetMaterial> = {
  sedimentaryRock: {
    name: "Sedimentary Rock",
    density: new UncertaintyValue(
      2400,
      200,
      "kg/m³",
      "Melosh (1989)",
      "Typical sedimentary rock density"
    ),
    strength: new UncertaintyValue(
      50e6,
      20e6,
      "Pa",
      "Holsapple & Housen (2007)",
      "Cohesive strength of sedimentary rock"
    ),
    porosity: new UncertaintyValue(
      0.15,
      0.05,
      "1",
      "Literature compilation",
      "Typical porosity of sedimentary rock"
    ),
    description: "Typical sedimentary rock target (sandstone, limestone)",
  },

  crystallineRock: {
    name: "Crystalline Rock",
    density: new UncertaintyValue(
      2700,
      100,
      "kg/m³",
      "Melosh (1989)",
      "Typical crystalline rock density"
    ),
    strength: new UncertaintyValue(
      200e6,
      50e6,
      "Pa",
      "Holsapple & Housen (2007)",
      "Cohesive strength of crystalline rock"
    ),
    porosity: new UncertaintyValue(
      0.05,
      0.02,
      "1",
      "Literature compilation",
      "Typical porosity of crystalline rock"
    ),
    description: "Typical crystalline rock target (granite, basalt)",
  },

  dryRegolith: {
    name: "Dry Regolith",
    density: new UncertaintyValue(
      1800,
      300,
      "kg/m³",
      "Housen & Holsapple (2011)",
      "Dry regolith/soil density"
    ),
    strength: new UncertaintyValue(
      1e3,
      5e2,
      "Pa",
      "Housen & Holsapple (2011)",
      "Cohesive strength of dry regolith"
    ),
    porosity: new UncertaintyValue(
      0.4,
      0.1,
      "1",
      "Literature compilation",
      "Typical porosity of dry regolith"
    ),
    description: "Dry regolith or unconsolidated material",
  },

  wetSediment: {
    name: "Wet Sediment",
    density: new UncertaintyValue(
      2000,
      200,
      "kg/m³",
      "Housen & Holsapple (2011)",
      "Water-saturated sediment density"
    ),
    strength: new UncertaintyValue(
      10e3,
      5e3,
      "Pa",
      "Housen & Holsapple (2011)",
      "Cohesive strength of wet sediment"
    ),
    porosity: new UncertaintyValue(
      0.3,
      0.1,
      "1",
      "Literature compilation",
      "Typical porosity of wet sediment"
    ),
    description: "Water-saturated sediment or mud",
  },

  ice: {
    name: "Ice",
    density: new UncertaintyValue(
      917,
      10,
      "kg/m³",
      "CRC Handbook",
      "Density of ice at 0°C"
    ),
    strength: new UncertaintyValue(
      5e6,
      2e6,
      "Pa",
      "Schultz & Gault (1985)",
      "Cohesive strength of ice"
    ),
    porosity: new UncertaintyValue(
      0.0,
      0.0,
      "1",
      "Assumed",
      "Pure ice porosity"
    ),
    description: "Pure water ice",
  },
};

/**
 * Holsapple & Housen (2007) scaling parameters for different regimes
 */
export const SCALING_PARAMETERS: Record<string, CraterScalingParameters> = {
  strengthRegime: {
    K1: new UncertaintyValue(
      1.88,
      0.2,
      "1",
      "Holsapple & Housen (2007)",
      "Diameter scaling constant for strength regime"
    ),
    K2: new UncertaintyValue(
      0.13,
      0.02,
      "1",
      "Holsapple & Housen (2007)",
      "Depth scaling constant for strength regime"
    ),
    mu: new UncertaintyValue(
      0.22,
      0.02,
      "1",
      "Holsapple & Housen (2007)",
      "Scaling exponent for strength regime"
    ),
    nu: new UncertaintyValue(
      0.4,
      0.05,
      "1",
      "Holsapple & Housen (2007)",
      "Velocity scaling exponent"
    ),
    validityRange: {
      minEnergy: 1e6, // 1 MJ
      maxEnergy: 1e18, // 1 EJ
      minVelocity: 1000, // 1 km/s
      maxVelocity: 30000, // 30 km/s
    },
    reference:
      "Holsapple, K.A. & Housen, K.R. (2007). A crater and its ejecta: An interpretation of Deep Impact",
  },

  gravityRegime: {
    K1: new UncertaintyValue(
      1.25,
      0.15,
      "1",
      "Holsapple & Housen (2007)",
      "Diameter scaling constant for gravity regime"
    ),
    K2: new UncertaintyValue(
      0.25,
      0.03,
      "1",
      "Holsapple & Housen (2007)",
      "Depth scaling constant for gravity regime"
    ),
    mu: new UncertaintyValue(
      0.165,
      0.015,
      "1",
      "Holsapple & Housen (2007)",
      "Scaling exponent for gravity regime"
    ),
    nu: new UncertaintyValue(
      0.4,
      0.05,
      "1",
      "Holsapple & Housen (2007)",
      "Velocity scaling exponent"
    ),
    validityRange: {
      minEnergy: 1e12, // 1 TJ
      maxEnergy: 1e25, // 10 ZJ
      minVelocity: 5000, // 5 km/s
      maxVelocity: 50000, // 50 km/s
    },
    reference:
      "Holsapple, K.A. & Housen, K.R. (2007). A crater and its ejecta: An interpretation of Deep Impact",
  },
};

/**
 * Calculate crater dimensions using Holsapple & Housen scaling laws
 */
export function calculateCraterDimensions(
  impactEnergy: UncertaintyValue, // J
  impactVelocity: UncertaintyValue, // m/s
  impactAngle: UncertaintyValue, // degrees
  projectileDensity: UncertaintyValue, // kg/m³
  targetMaterial: TargetMaterial,
  gravity: UncertaintyValue = new UncertaintyValue(
    9.80665,
    0,
    "m/s²",
    "Standard",
    "Earth surface gravity"
  )
): CraterResult {
  // Determine scaling regime based on crater size and target strength
  const scalingRegime = determineScalingRegime(
    impactEnergy,
    targetMaterial,
    gravity
  );
  const scalingParams = SCALING_PARAMETERS[scalingRegime];

  // Validate input parameters
  const validityCheck = validateInputParameters(
    impactEnergy,
    impactVelocity,
    impactAngle,
    scalingParams
  );

  // Convert angle to radians for calculations
  const angleRad = new UncertaintyValue(
    UnitConverter.convert(impactAngle.value, "deg", "rad"),
    UnitConverter.convert(impactAngle.uncertainty, "deg", "rad"),
    "rad",
    impactAngle.source,
    "Impact angle in radians"
  );

  // Calculate angle correction factor: sin(θ)^(1/3) for oblique impacts
  const angleFactor = calculateAngleFactor(angleRad);

  // Calculate effective impact energy accounting for angle
  const effectiveEnergy = multiplyUncertaintyValues(impactEnergy, angleFactor);

  // Calculate crater diameter using scaling law
  const diameter = calculateCraterDiameter(
    effectiveEnergy,
    targetMaterial,
    gravity,
    scalingParams
  );

  // Calculate crater depth
  const depth = multiplyUncertaintyValues(diameter, scalingParams.K2);

  // Calculate crater volume (simplified as paraboloid: V = π/8 * D² * d)
  const volume = calculateCraterVolume(diameter, depth);

  // Calculate rim height (typically 5-10% of crater diameter)
  const rimHeight = multiplyUncertaintyValues(
    diameter,
    new UncertaintyValue(0.07, 0.02, "1", "Melosh (1989)", "Rim height factor")
  );

  // Calculate ejecta volume (typically 10-30 times crater volume)
  const ejectaVolume = multiplyUncertaintyValues(
    volume,
    new UncertaintyValue(20, 10, "1", "Melosh (1989)", "Ejecta volume factor")
  );

  // Calculate ejecta range (empirical relationship)
  const ejectaRange = calculateEjectaRange(diameter, gravity);

  // Calculate formation time (empirical relationship)
  const formationTime = calculateFormationTime(diameter, gravity);

  return {
    diameter,
    depth,
    volume,
    rimHeight,
    ejectaVolume,
    ejectaRange,
    formationTime,
    scalingLaw: `Holsapple & Housen (2007) - ${scalingRegime}`,
    targetMaterial: targetMaterial.name,
    impactAngle,
    validityCheck,
  };
}

/**
 * Determine whether to use strength or gravity scaling regime
 */
function determineScalingRegime(
  impactEnergy: UncertaintyValue,
  targetMaterial: TargetMaterial,
  gravity: UncertaintyValue
): string {
  // Transition occurs when gravitational energy equals strength energy
  // Approximate transition diameter: D_t ≈ (Y/ρg)^0.5 where Y is strength
  const transitionDiameter = Math.sqrt(
    targetMaterial.strength.value /
      (targetMaterial.density.value * gravity.value)
  );

  // Estimate crater diameter for regime determination (rough approximation)
  const estimatedDiameter = Math.pow(
    impactEnergy.value / (targetMaterial.density.value * gravity.value),
    0.22
  );

  return estimatedDiameter < transitionDiameter
    ? "strengthRegime"
    : "gravityRegime";
}

/**
 * Validate input parameters against scaling law validity ranges
 */
function validateInputParameters(
  impactEnergy: UncertaintyValue,
  impactVelocity: UncertaintyValue,
  impactAngle: UncertaintyValue,
  scalingParams: CraterScalingParameters
): { isValid: boolean; warnings: string[]; limitations: string[] } {
  const warnings: string[] = [];
  const limitations: string[] = [];
  let isValid = true;

  // Check energy range
  if (impactEnergy.value < scalingParams.validityRange.minEnergy) {
    warnings.push(
      `Impact energy (${impactEnergy.value.toExponential(
        2
      )} J) is below validated range (>${scalingParams.validityRange.minEnergy.toExponential(
        2
      )} J)`
    );
    isValid = false;
  }
  if (impactEnergy.value > scalingParams.validityRange.maxEnergy) {
    warnings.push(
      `Impact energy (${impactEnergy.value.toExponential(
        2
      )} J) is above validated range (<${scalingParams.validityRange.maxEnergy.toExponential(
        2
      )} J)`
    );
    isValid = false;
  }

  // Check velocity range
  if (impactVelocity.value < scalingParams.validityRange.minVelocity) {
    warnings.push(
      `Impact velocity (${impactVelocity.value} m/s) is below validated range (>${scalingParams.validityRange.minVelocity} m/s)`
    );
  }
  if (impactVelocity.value > scalingParams.validityRange.maxVelocity) {
    warnings.push(
      `Impact velocity (${impactVelocity.value} m/s) is above validated range (<${scalingParams.validityRange.maxVelocity} m/s)`
    );
  }

  // Check impact angle
  if (impactAngle.value < 15) {
    warnings.push(
      `Very oblique impact (${impactAngle.value}°) - scaling laws less accurate for grazing impacts`
    );
    limitations.push("Scaling laws derived primarily for impact angles >15°");
  }

  // General limitations
  limitations.push("Scaling laws assume homogeneous target material");
  limitations.push(
    "Does not account for atmospheric effects or projectile fragmentation"
  );
  limitations.push(
    "Derived from laboratory experiments and terrestrial crater data"
  );

  return { isValid, warnings, limitations };
}

/**
 * Calculate angle correction factor for oblique impacts
 */
function calculateAngleFactor(angleRad: UncertaintyValue): UncertaintyValue {
  // Use sin(θ)^(1/3) scaling for oblique impacts
  const sinAngle = new UncertaintyValue(
    Math.sin(angleRad.value),
    Math.abs(Math.cos(angleRad.value)) * angleRad.uncertainty,
    "1",
    angleRad.source,
    "Sine of impact angle"
  );

  // Calculate sin^(1/3)
  const exponent = 1 / 3;
  const result = Math.pow(sinAngle.value, exponent);
  const uncertainty = Math.abs(
    (result * exponent * sinAngle.uncertainty) / sinAngle.value
  );

  return new UncertaintyValue(
    result,
    uncertainty,
    "1",
    "Calculated",
    "Angle correction factor for oblique impact"
  );
}

/**
 * Calculate crater diameter using scaling laws
 */
function calculateCraterDiameter(
  effectiveEnergy: UncertaintyValue,
  targetMaterial: TargetMaterial,
  gravity: UncertaintyValue,
  scalingParams: CraterScalingParameters
): UncertaintyValue {
  // Scaling law: D = K1 * (E / (ρ * g))^μ
  // Where E is energy, ρ is target density, g is gravity

  const variables: UncertaintyVariable[] = [
    {
      name: "K1",
      value: scalingParams.K1,
      distribution: DistributionType.NORMAL,
    },
    {
      name: "energy",
      value: effectiveEnergy,
      distribution: DistributionType.NORMAL,
    },
    {
      name: "density",
      value: targetMaterial.density,
      distribution: DistributionType.NORMAL,
    },
    { name: "gravity", value: gravity, distribution: DistributionType.NORMAL },
    {
      name: "mu",
      value: scalingParams.mu,
      distribution: DistributionType.NORMAL,
    },
  ];

  const scalingFunction = (inputs: Record<string, number>) => {
    const { K1, energy, density, gravity, mu } = inputs;
    return K1 * Math.pow(energy / (density * gravity), mu);
  };

  const result = UncertaintyPropagator.propagateNonlinear(
    variables,
    scalingFunction
  );

  return new UncertaintyValue(
    result.value,
    result.uncertainty,
    "m",
    "Holsapple & Housen (2007) scaling law",
    "Crater diameter from scaling law"
  );
}

/**
 * Calculate crater volume as paraboloid
 */
function calculateCraterVolume(
  diameter: UncertaintyValue,
  depth: UncertaintyValue
): UncertaintyValue {
  // Volume of paraboloid: V = π/8 * D² * d
  const variables: UncertaintyVariable[] = [
    {
      name: "diameter",
      value: diameter,
      distribution: DistributionType.NORMAL,
    },
    { name: "depth", value: depth, distribution: DistributionType.NORMAL },
  ];

  const volumeFunction = (inputs: Record<string, number>) => {
    const { diameter, depth } = inputs;
    return (Math.PI / 8) * diameter * diameter * depth;
  };

  const result = UncertaintyPropagator.propagateNonlinear(
    variables,
    volumeFunction
  );

  return new UncertaintyValue(
    result.value,
    result.uncertainty,
    "m³",
    "Calculated from paraboloid geometry",
    "Crater volume"
  );
}

/**
 * Calculate ejecta range using empirical relationships
 */
function calculateEjectaRange(
  diameter: UncertaintyValue,
  gravity: UncertaintyValue
): UncertaintyValue {
  // Empirical relationship: R ≈ 2-3 * D for continuous ejecta
  const rangeFactor = new UncertaintyValue(
    2.5,
    0.5,
    "1",
    "Melosh (1989)",
    "Ejecta range factor"
  );

  return multiplyUncertaintyValues(diameter, rangeFactor);
}

/**
 * Calculate crater formation time
 */
function calculateFormationTime(
  diameter: UncertaintyValue,
  gravity: UncertaintyValue
): UncertaintyValue {
  // Formation time: t ≈ sqrt(D/g)
  const variables: UncertaintyVariable[] = [
    {
      name: "diameter",
      value: diameter,
      distribution: DistributionType.NORMAL,
    },
    { name: "gravity", value: gravity, distribution: DistributionType.NORMAL },
  ];

  const timeFunction = (inputs: Record<string, number>) => {
    const { diameter, gravity } = inputs;
    return Math.sqrt(diameter / gravity);
  };

  const result = UncertaintyPropagator.propagateNonlinear(
    variables,
    timeFunction
  );

  return new UncertaintyValue(
    result.value,
    result.uncertainty,
    "s",
    "Calculated from dimensional analysis",
    "Crater formation time"
  );
}

/**
 * Helper function to multiply two uncertainty values
 */
function multiplyUncertaintyValues(
  a: UncertaintyValue,
  b: UncertaintyValue
): UncertaintyValue {
  const result = a.value * b.value;
  const relativeUncertaintyA =
    a.value !== 0 ? a.uncertainty / Math.abs(a.value) : 0;
  const relativeUncertaintyB =
    b.value !== 0 ? b.uncertainty / Math.abs(b.value) : 0;
  const relativeUncertainty = Math.sqrt(
    relativeUncertaintyA * relativeUncertaintyA +
      relativeUncertaintyB * relativeUncertaintyB
  );
  const uncertainty = Math.abs(result) * relativeUncertainty;

  return new UncertaintyValue(
    result,
    uncertainty,
    a.unit, // Assume compatible units
    "Calculated",
    `Product of ${a.description} and ${b.description}`
  );
}

/**
 * Get target material by name
 */
export function getTargetMaterial(name: string): TargetMaterial {
  const material = TARGET_MATERIALS[name];
  if (!material) {
    throw new Error(
      `Unknown target material: ${name}. Available materials: ${Object.keys(
        TARGET_MATERIALS
      ).join(", ")}`
    );
  }
  return material;
}

/**
 * List all available target materials
 */
export function getAvailableTargetMaterials(): string[] {
  return Object.keys(TARGET_MATERIALS);
}

/**
 * Calculate crater dimensions for known impact events (for validation)
 */
export function validateAgainstKnownCraters(): Array<{
  name: string;
  observed: { diameter: number; depth?: number };
  calculated: CraterResult;
  agreement: string;
}> {
  const knownCraters = [
    {
      name: "Barringer Crater (Meteor Crater)",
      energy: new UncertaintyValue(
        1.5e16,
        5e15,
        "J",
        "Kring (2007)",
        "Estimated impact energy"
      ),
      velocity: new UncertaintyValue(
        12000,
        2000,
        "m/s",
        "Kring (2007)",
        "Estimated impact velocity"
      ),
      angle: new UncertaintyValue(
        45,
        15,
        "deg",
        "Assumed",
        "Typical impact angle"
      ),
      projectileDensity: new UncertaintyValue(
        7800,
        500,
        "kg/m³",
        "Iron meteorite",
        "Iron meteorite density"
      ),
      targetMaterial: TARGET_MATERIALS.sedimentaryRock,
      observed: { diameter: 1200, depth: 170 },
    },
  ];

  return knownCraters.map((crater) => {
    const calculated = calculateCraterDimensions(
      crater.energy,
      crater.velocity,
      crater.angle,
      crater.projectileDensity,
      crater.targetMaterial
    );

    const diameterRatio = calculated.diameter.value / crater.observed.diameter;
    const agreement =
      diameterRatio > 0.5 && diameterRatio < 2.0
        ? "Good"
        : diameterRatio > 0.2 && diameterRatio < 5.0
        ? "Fair"
        : "Poor";

    return {
      name: crater.name,
      observed: crater.observed,
      calculated,
      agreement,
    };
  });
}
