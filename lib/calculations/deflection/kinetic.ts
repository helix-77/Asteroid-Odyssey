/**
 * Kinetic Impactor Physics Model
 * Implements Holsapple & Housen momentum transfer models for asteroid deflection
 * Based on peer-reviewed research and DART mission results
 */

import { UncertaintyValue } from "../../physics/constants";
import { UnitConverter } from "../../physics/units";
import {
  UncertaintyPropagator,
  UncertaintyVariable,
  DistributionType,
} from "../../physics/uncertainty";

/**
 * Target material properties for momentum transfer calculations
 */
export interface TargetMaterialProperties {
  density: UncertaintyValue; // kg/m³
  strength: UncertaintyValue; // Pa (compressive strength)
  porosity: UncertaintyValue; // dimensionless (0-1)
  composition: "rocky" | "metallic" | "carbonaceous" | "mixed";
  grainSize: UncertaintyValue; // m (characteristic grain size)
}

/**
 * Impactor spacecraft properties
 */
export interface ImpactorProperties {
  mass: UncertaintyValue; // kg
  velocity: UncertaintyValue; // m/s (relative to target)
  diameter: UncertaintyValue; // m
  density: UncertaintyValue; // kg/m³
  material: "aluminum" | "steel" | "tungsten" | "composite";
}

/**
 * Impact geometry parameters
 */
export interface ImpactGeometry {
  impactAngle: UncertaintyValue; // radians (0 = head-on, π/2 = grazing)
  targetRadius: UncertaintyValue; // m
  impactLocation: "center" | "edge" | "random"; // Impact location on target
}

/**
 * Momentum transfer efficiency parameters from Holsapple & Housen (2012)
 */
export interface MomentumTransferParameters {
  beta: UncertaintyValue; // Momentum enhancement factor
  mu: UncertaintyValue; // Scaling exponent for crater ejecta
  K: UncertaintyValue; // Scaling constant
  validityRange: {
    minVelocity: number; // m/s
    maxVelocity: number; // m/s
    minMass: number; // kg
    maxMass: number; // kg
  };
}

/**
 * Kinetic impactor deflection result
 */
export interface KineticImpactResult {
  // Primary momentum transfer
  directMomentumTransfer: UncertaintyValue; // kg⋅m/s
  ejectaMomentumEnhancement: UncertaintyValue; // kg⋅m/s
  totalMomentumTransfer: UncertaintyValue; // kg⋅m/s

  // Momentum transfer efficiency
  momentumTransferEfficiency: UncertaintyValue; // dimensionless (β factor)

  // Velocity change
  deltaV: UncertaintyValue; // m/s

  // Crater properties
  craterDiameter: UncertaintyValue; // m
  craterDepth: UncertaintyValue; // m
  ejectaMass: UncertaintyValue; // kg
  ejectaVelocity: UncertaintyValue; // m/s

  // Mission parameters
  impactEnergy: UncertaintyValue; // J
  specificEnergy: UncertaintyValue; // J/kg (energy per unit target mass)

  // Validation flags
  withinValidityRange: boolean;
  warnings: string[];
  references: string[];
}

/**
 * Spacecraft optimization result
 */
export interface SpacecraftOptimizationResult {
  optimalMass: UncertaintyValue; // kg
  optimalVelocity: UncertaintyValue; // m/s
  maxDeltaV: UncertaintyValue; // m/s
  launchEnergyRequired: UncertaintyValue; // J
  missionDuration: UncertaintyValue; // s
  costEstimate: UncertaintyValue; // USD (rough estimate)
}

/**
 * Material property database for common asteroid types
 */
const ASTEROID_MATERIAL_PROPERTIES: Record<string, TargetMaterialProperties> = {
  rocky: {
    density: new UncertaintyValue(
      2700,
      300,
      "kg/m³",
      "Britt & Consolmagno 2003"
    ),
    strength: new UncertaintyValue(1e7, 5e6, "Pa", "Holsapple & Housen 2007"),
    porosity: new UncertaintyValue(0.2, 0.1, "1", "Britt & Consolmagno 2003"),
    composition: "rocky",
    grainSize: new UncertaintyValue(0.001, 0.0005, "m", "Estimated"),
  },
  metallic: {
    density: new UncertaintyValue(
      7800,
      500,
      "kg/m³",
      "Britt & Consolmagno 2003"
    ),
    strength: new UncertaintyValue(5e8, 1e8, "Pa", "Engineering estimates"),
    porosity: new UncertaintyValue(0.1, 0.05, "1", "Britt & Consolmagno 2003"),
    composition: "metallic",
    grainSize: new UncertaintyValue(0.01, 0.005, "m", "Estimated"),
  },
  carbonaceous: {
    density: new UncertaintyValue(
      1400,
      200,
      "kg/m³",
      "Britt & Consolmagno 2003"
    ),
    strength: new UncertaintyValue(1e6, 5e5, "Pa", "Holsapple & Housen 2007"),
    porosity: new UncertaintyValue(0.3, 0.1, "1", "Britt & Consolmagno 2003"),
    composition: "carbonaceous",
    grainSize: new UncertaintyValue(0.0001, 0.00005, "m", "Estimated"),
  },
};

/**
 * Momentum transfer parameters from Holsapple & Housen (2012)
 */
const MOMENTUM_TRANSFER_PARAMETERS: Record<string, MomentumTransferParameters> =
  {
    rocky: {
      beta: new UncertaintyValue(2.0, 0.5, "1", "Holsapple & Housen 2012"),
      mu: new UncertaintyValue(0.4, 0.1, "1", "Holsapple & Housen 2012"),
      K: new UncertaintyValue(0.2, 0.05, "1", "Holsapple & Housen 2012"),
      validityRange: {
        minVelocity: 1000, // m/s
        maxVelocity: 50000, // m/s
        minMass: 1, // kg
        maxMass: 1e6, // kg
      },
    },
    metallic: {
      beta: new UncertaintyValue(1.5, 0.3, "1", "Holsapple & Housen 2012"),
      mu: new UncertaintyValue(0.3, 0.1, "1", "Holsapple & Housen 2012"),
      K: new UncertaintyValue(0.15, 0.04, "1", "Holsapple & Housen 2012"),
      validityRange: {
        minVelocity: 1000, // m/s
        maxVelocity: 50000, // m/s
        minMass: 1, // kg
        maxMass: 1e6, // kg
      },
    },
    carbonaceous: {
      beta: new UncertaintyValue(3.0, 0.8, "1", "Holsapple & Housen 2012"),
      mu: new UncertaintyValue(0.5, 0.15, "1", "Holsapple & Housen 2012"),
      K: new UncertaintyValue(0.3, 0.08, "1", "Holsapple & Housen 2012"),
      validityRange: {
        minVelocity: 1000, // m/s
        maxVelocity: 50000, // m/s
        minMass: 1, // kg
        maxMass: 1e6, // kg
      },
    },
  };

/**
 * Kinetic Impactor Physics Calculator
 */
export class KineticImpactorCalculator {
  /**
   * Calculate momentum transfer from kinetic impact
   */
  static calculateMomentumTransfer(
    impactor: ImpactorProperties,
    target: TargetMaterialProperties,
    geometry: ImpactGeometry,
    targetMass: UncertaintyValue
  ): KineticImpactResult {
    const warnings: string[] = [];
    const references: string[] = [
      "Holsapple, K.A. & Housen, K.R. (2012). Momentum transfer in asteroid impacts",
      "Cheng, A.F. et al. (2023). DART mission results and momentum transfer efficiency",
      "Holsapple, K.A. & Housen, K.R. (2007). A crater and its ejecta: An interpretation of Deep Impact",
    ];

    // Get momentum transfer parameters for target composition
    const transferParams = MOMENTUM_TRANSFER_PARAMETERS[target.composition];
    if (!transferParams) {
      throw new Error(`Unknown target composition: ${target.composition}`);
    }

    // Validate input parameters
    const validationResult = this.validateInputParameters(
      impactor,
      target,
      geometry,
      transferParams
    );
    warnings.push(...validationResult.warnings);

    // Calculate impact energy
    const impactEnergy = this.calculateImpactEnergy(impactor);

    // Calculate direct momentum transfer (impactor momentum)
    const directMomentum = this.calculateDirectMomentumTransfer(
      impactor,
      geometry
    );

    // Calculate crater dimensions using scaling laws
    const craterResult = this.calculateCraterDimensions(
      impactor,
      target,
      geometry,
      impactEnergy
    );

    // Calculate ejecta momentum enhancement
    const ejectaEnhancement = this.calculateEjectaMomentumEnhancement(
      impactor,
      target,
      geometry,
      craterResult,
      transferParams
    );

    // Total momentum transfer
    const totalMomentumTransfer = this.combineMomentumTransfers(
      directMomentum,
      ejectaEnhancement
    );

    // Calculate velocity change (ΔV = Δp / m_target)
    const deltaV = this.calculateVelocityChange(
      totalMomentumTransfer,
      targetMass
    );

    // Calculate momentum transfer efficiency (β factor)
    const efficiency = this.calculateMomentumTransferEfficiency(
      totalMomentumTransfer,
      directMomentum
    );

    // Calculate specific energy
    const specificEnergy = this.calculateSpecificEnergy(
      impactEnergy,
      targetMass
    );

    return {
      directMomentumTransfer: directMomentum,
      ejectaMomentumEnhancement: ejectaEnhancement,
      totalMomentumTransfer,
      momentumTransferEfficiency: efficiency,
      deltaV,
      craterDiameter: craterResult.diameter,
      craterDepth: craterResult.depth,
      ejectaMass: craterResult.ejectaMass,
      ejectaVelocity: craterResult.ejectaVelocity,
      impactEnergy,
      specificEnergy,
      withinValidityRange: validationResult.withinValidityRange,
      warnings,
      references,
    };
  }

  /**
   * Optimize spacecraft parameters for maximum deflection
   */
  static optimizeSpacecraft(
    target: TargetMaterialProperties,
    geometry: ImpactGeometry,
    targetMass: UncertaintyValue,
    constraints: {
      maxMass: number; // kg
      maxVelocity: number; // m/s
      launchCapability: number; // kg to required velocity
    }
  ): SpacecraftOptimizationResult {
    // This is a simplified optimization - a full implementation would use
    // numerical optimization methods like gradient descent or genetic algorithms

    const massRange = [100, constraints.maxMass]; // kg
    const velocityRange = [5000, constraints.maxVelocity]; // m/s

    let bestDeltaV = new UncertaintyValue(0, 0, "m/s", "Optimization result");
    let optimalMass = new UncertaintyValue(
      1000,
      100,
      "kg",
      "Optimization result"
    );
    let optimalVelocity = new UncertaintyValue(
      10000,
      1000,
      "m/s",
      "Optimization result"
    );

    // Grid search optimization (simplified)
    const massSteps = 20;
    const velocitySteps = 20;

    for (let i = 0; i < massSteps; i++) {
      for (let j = 0; j < velocitySteps; j++) {
        const mass =
          massRange[0] + (i / (massSteps - 1)) * (massRange[1] - massRange[0]);
        const velocity =
          velocityRange[0] +
          (j / (velocitySteps - 1)) * (velocityRange[1] - velocityRange[0]);

        const testImpactor: ImpactorProperties = {
          mass: new UncertaintyValue(mass, mass * 0.1, "kg", "Test parameter"),
          velocity: new UncertaintyValue(
            velocity,
            velocity * 0.05,
            "m/s",
            "Test parameter"
          ),
          diameter: new UncertaintyValue(
            Math.pow(mass / 2700, 1 / 3) * 2,
            0.1,
            "m",
            "Estimated"
          ),
          density: new UncertaintyValue(
            2700,
            100,
            "kg/m³",
            "Typical spacecraft"
          ),
          material: "aluminum",
        };

        try {
          const result = this.calculateMomentumTransfer(
            testImpactor,
            target,
            geometry,
            targetMass
          );
          if (result.deltaV.value > bestDeltaV.value) {
            bestDeltaV = result.deltaV;
            optimalMass = testImpactor.mass;
            optimalVelocity = testImpactor.velocity;
          }
        } catch (error) {
          // Skip invalid parameter combinations
          continue;
        }
      }
    }

    // Calculate launch energy required (simplified)
    const launchEnergy = new UncertaintyValue(
      0.5 * optimalMass.value * Math.pow(optimalVelocity.value, 2),
      0.5 * optimalMass.uncertainty * Math.pow(optimalVelocity.value, 2) +
        optimalMass.value * optimalVelocity.value * optimalVelocity.uncertainty,
      "J",
      "Calculated from kinetic energy"
    );

    // Estimate mission duration (simplified - assumes direct trajectory)
    const missionDuration = new UncertaintyValue(
      365.25 * 24 * 3600, // 1 year in seconds
      30 * 24 * 3600, // ±1 month uncertainty
      "s",
      "Estimated mission duration"
    );

    // Rough cost estimate (very simplified)
    const costEstimate = new UncertaintyValue(
      500e6 + optimalMass.value * 10000, // Base cost + mass-dependent cost
      200e6, // Large uncertainty
      "USD",
      "Rough cost estimate"
    );

    return {
      optimalMass,
      optimalVelocity,
      maxDeltaV: bestDeltaV,
      launchEnergyRequired: launchEnergy,
      missionDuration,
      costEstimate,
    };
  }

  /**
   * Calculate impact energy
   */
  private static calculateImpactEnergy(
    impactor: ImpactorProperties
  ): UncertaintyValue {
    // KE = ½mv²
    const variables: UncertaintyVariable[] = [
      {
        name: "mass",
        value: impactor.mass,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "velocity",
        value: impactor.velocity,
        distribution: DistributionType.NORMAL,
      },
    ];

    const energyFunction = (inputs: Record<string, number>) => {
      return 0.5 * inputs.mass * Math.pow(inputs.velocity, 2);
    };

    const result = UncertaintyPropagator.propagateNonlinear(
      variables,
      energyFunction
    );

    return new UncertaintyValue(
      result.value,
      result.uncertainty,
      "J",
      "Calculated from kinetic energy formula",
      "Impact kinetic energy"
    );
  }

  /**
   * Calculate direct momentum transfer (impactor momentum)
   */
  private static calculateDirectMomentumTransfer(
    impactor: ImpactorProperties,
    geometry: ImpactGeometry
  ): UncertaintyValue {
    // p = mv * cos(impact_angle) for momentum component along impact direction
    const variables: UncertaintyVariable[] = [
      {
        name: "mass",
        value: impactor.mass,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "velocity",
        value: impactor.velocity,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "angle",
        value: geometry.impactAngle,
        distribution: DistributionType.NORMAL,
      },
    ];

    const momentumFunction = (inputs: Record<string, number>) => {
      return inputs.mass * inputs.velocity * Math.cos(inputs.angle);
    };

    const result = UncertaintyPropagator.propagateNonlinear(
      variables,
      momentumFunction
    );

    return new UncertaintyValue(
      result.value,
      result.uncertainty,
      "kg⋅m/s",
      "Calculated from impactor momentum",
      "Direct momentum transfer"
    );
  }

  /**
   * Calculate crater dimensions using scaling laws
   */
  private static calculateCraterDimensions(
    impactor: ImpactorProperties,
    target: TargetMaterialProperties,
    geometry: ImpactGeometry,
    impactEnergy: UncertaintyValue
  ): {
    diameter: UncertaintyValue;
    depth: UncertaintyValue;
    ejectaMass: UncertaintyValue;
    ejectaVelocity: UncertaintyValue;
  } {
    // Simplified crater scaling - full implementation would use Collins et al. (2005)
    // D = K * (E/ρg)^(1/3.4) where D is diameter, E is energy, ρ is density, g is gravity

    const variables: UncertaintyVariable[] = [
      {
        name: "energy",
        value: impactEnergy,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "density",
        value: target.density,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "radius",
        value: geometry.targetRadius,
        distribution: DistributionType.NORMAL,
      },
    ];

    // Simplified scaling law for crater diameter
    const diameterFunction = (inputs: Record<string, number>) => {
      const gravity =
        (6.67e-11 *
          inputs.density *
          (4 / 3) *
          Math.PI *
          Math.pow(inputs.radius, 3)) /
        Math.pow(inputs.radius, 2);
      const scalingFactor = 0.02; // Realistic empirical constant for small asteroid impactscts
      return (
        scalingFactor *
        Math.pow(inputs.energy / (inputs.density * gravity), 1 / 3.4)
      );
    };

    const diameterResult = UncertaintyPropagator.propagateNonlinear(
      variables,
      diameterFunction
    );

    const diameter = new UncertaintyValue(
      diameterResult.value,
      diameterResult.uncertainty,
      "m",
      "Calculated from crater scaling laws",
      "Crater diameter"
    );

    // Depth is typically D/5 to D/10 for simple craters
    const depth = new UncertaintyValue(
      diameter.value / 7,
      diameter.uncertainty / 7,
      "m",
      "Estimated from diameter",
      "Crater depth"
    );

    // Ejecta mass is approximately crater volume * density
    const craterVolume = (Math.PI / 12) * Math.pow(diameter.value, 3); // Simplified bowl shape
    const ejectaMass = new UncertaintyValue(
      craterVolume * target.density.value,
      craterVolume * target.density.uncertainty,
      "kg",
      "Calculated from crater volume",
      "Ejecta mass"
    );

    // Ejecta velocity scaling (simplified)
    const ejectaVelocity = new UncertaintyValue(
      Math.pow(impactEnergy.value / ejectaMass.value, 0.5) * 0.1, // ~10% of specific energy
      Math.pow(impactEnergy.uncertainty / ejectaMass.value, 0.5) * 0.1,
      "m/s",
      "Estimated from energy scaling",
      "Average ejecta velocity"
    );

    return {
      diameter,
      depth,
      ejectaMass,
      ejectaVelocity,
    };
  }

  /**
   * Calculate ejecta momentum enhancement
   */
  private static calculateEjectaMomentumEnhancement(
    impactor: ImpactorProperties,
    target: TargetMaterialProperties,
    geometry: ImpactGeometry,
    craterResult: any,
    transferParams: MomentumTransferParameters
  ): UncertaintyValue {
    // Momentum enhancement from ejecta: p_ejecta = β * p_impactor - p_impactor = (β - 1) * p_impactor
    const directMomentum = impactor.mass.value * impactor.velocity.value;

    const variables: UncertaintyVariable[] = [
      {
        name: "beta",
        value: transferParams.beta,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "momentum",
        value: new UncertaintyValue(
          directMomentum,
          directMomentum * 0.1,
          "kg⋅m/s",
          "Calculated"
        ),
        distribution: DistributionType.NORMAL,
      },
    ];

    const enhancementFunction = (inputs: Record<string, number>) => {
      return (inputs.beta - 1) * inputs.momentum;
    };

    const result = UncertaintyPropagator.propagateNonlinear(
      variables,
      enhancementFunction
    );

    return new UncertaintyValue(
      result.value,
      result.uncertainty,
      "kg⋅m/s",
      "Calculated from momentum enhancement factor",
      "Ejecta momentum enhancement"
    );
  }

  /**
   * Combine momentum transfers
   */
  private static combineMomentumTransfers(
    direct: UncertaintyValue,
    ejecta: UncertaintyValue
  ): UncertaintyValue {
    return new UncertaintyValue(
      direct.value + ejecta.value,
      Math.sqrt(
        Math.pow(direct.uncertainty, 2) + Math.pow(ejecta.uncertainty, 2)
      ),
      "kg⋅m/s",
      "Combined momentum transfers",
      "Total momentum transfer"
    );
  }

  /**
   * Calculate velocity change
   */
  private static calculateVelocityChange(
    momentumTransfer: UncertaintyValue,
    targetMass: UncertaintyValue
  ): UncertaintyValue {
    const variables: UncertaintyVariable[] = [
      {
        name: "momentum",
        value: momentumTransfer,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "mass",
        value: targetMass,
        distribution: DistributionType.NORMAL,
      },
    ];

    const deltaVFunction = (inputs: Record<string, number>) => {
      return inputs.momentum / inputs.mass;
    };

    const result = UncertaintyPropagator.propagateNonlinear(
      variables,
      deltaVFunction
    );

    return new UncertaintyValue(
      result.value,
      result.uncertainty,
      "m/s",
      "Calculated from momentum conservation",
      "Velocity change"
    );
  }

  /**
   * Calculate momentum transfer efficiency
   */
  private static calculateMomentumTransferEfficiency(
    totalMomentum: UncertaintyValue,
    directMomentum: UncertaintyValue
  ): UncertaintyValue {
    const variables: UncertaintyVariable[] = [
      {
        name: "total",
        value: totalMomentum,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "direct",
        value: directMomentum,
        distribution: DistributionType.NORMAL,
      },
    ];

    const efficiencyFunction = (inputs: Record<string, number>) => {
      return inputs.direct !== 0 ? inputs.total / inputs.direct : 0;
    };

    const result = UncertaintyPropagator.propagateNonlinear(
      variables,
      efficiencyFunction
    );

    return new UncertaintyValue(
      result.value,
      result.uncertainty,
      "1",
      "Calculated as total/direct momentum ratio",
      "Momentum transfer efficiency (β factor)"
    );
  }

  /**
   * Calculate specific energy
   */
  private static calculateSpecificEnergy(
    energy: UncertaintyValue,
    mass: UncertaintyValue
  ): UncertaintyValue {
    const variables: UncertaintyVariable[] = [
      {
        name: "energy",
        value: energy,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "mass",
        value: mass,
        distribution: DistributionType.NORMAL,
      },
    ];

    const specificEnergyFunction = (inputs: Record<string, number>) => {
      return inputs.energy / inputs.mass;
    };

    const result = UncertaintyPropagator.propagateNonlinear(
      variables,
      specificEnergyFunction
    );

    return new UncertaintyValue(
      result.value,
      result.uncertainty,
      "J/kg",
      "Calculated as energy per unit mass",
      "Specific energy"
    );
  }

  /**
   * Validate input parameters
   */
  private static validateInputParameters(
    impactor: ImpactorProperties,
    target: TargetMaterialProperties,
    geometry: ImpactGeometry,
    transferParams: MomentumTransferParameters
  ): { withinValidityRange: boolean; warnings: string[] } {
    const warnings: string[] = [];
    let withinValidityRange = true;

    // Check velocity range
    if (impactor.velocity.value < transferParams.validityRange.minVelocity) {
      warnings.push(
        `Impact velocity ${impactor.velocity.value} m/s is below validated range (${transferParams.validityRange.minVelocity} m/s)`
      );
      withinValidityRange = false;
    }
    if (impactor.velocity.value > transferParams.validityRange.maxVelocity) {
      warnings.push(
        `Impact velocity ${impactor.velocity.value} m/s is above validated range (${transferParams.validityRange.maxVelocity} m/s)`
      );
      withinValidityRange = false;
    }

    // Check mass range
    if (impactor.mass.value < transferParams.validityRange.minMass) {
      warnings.push(
        `Impactor mass ${impactor.mass.value} kg is below validated range (${transferParams.validityRange.minMass} kg)`
      );
      withinValidityRange = false;
    }
    if (impactor.mass.value > transferParams.validityRange.maxMass) {
      warnings.push(
        `Impactor mass ${impactor.mass.value} kg is above validated range (${transferParams.validityRange.maxMass} kg)`
      );
      withinValidityRange = false;
    }

    // Check impact angle
    if (geometry.impactAngle.value > Math.PI / 3) {
      warnings.push(
        `Impact angle ${((geometry.impactAngle.value * 180) / Math.PI).toFixed(
          1
        )}° is quite oblique - momentum transfer efficiency may be reduced`
      );
    }

    // Check target properties
    if (target.porosity.value > 0.5) {
      warnings.push(
        `High target porosity (${(target.porosity.value * 100).toFixed(
          1
        )}%) may affect momentum transfer efficiency`
      );
    }

    return { withinValidityRange, warnings };
  }

  /**
   * Get material properties for common asteroid types
   */
  static getMaterialProperties(composition: string): TargetMaterialProperties {
    const properties = ASTEROID_MATERIAL_PROPERTIES[composition];
    if (!properties) {
      throw new Error(`Unknown asteroid composition: ${composition}`);
    }
    return properties;
  }

  /**
   * Get momentum transfer parameters for composition
   */
  static getMomentumTransferParameters(
    composition: string
  ): MomentumTransferParameters {
    const params = MOMENTUM_TRANSFER_PARAMETERS[composition];
    if (!params) {
      throw new Error(
        `Unknown composition for momentum transfer: ${composition}`
      );
    }
    return params;
  }
}

/**
 * Convenience functions for common calculations
 */
export const KineticImpactorUtils = {
  /**
   * Create a typical spacecraft impactor
   */
  createTypicalSpacecraft: (
    mass: number,
    velocity: number
  ): ImpactorProperties => ({
    mass: new UncertaintyValue(mass, mass * 0.1, "kg", "Mission specification"),
    velocity: new UncertaintyValue(
      velocity,
      velocity * 0.05,
      "m/s",
      "Mission specification"
    ),
    diameter: new UncertaintyValue(
      Math.pow(mass / 2700, 1 / 3) * 2,
      0.1,
      "m",
      "Estimated from mass"
    ),
    density: new UncertaintyValue(
      2700,
      100,
      "kg/m³",
      "Typical spacecraft density"
    ),
    material: "aluminum",
  }),

  /**
   * Create head-on impact geometry
   */
  createHeadOnImpact: (targetRadius: number): ImpactGeometry => ({
    impactAngle: new UncertaintyValue(0, 0.1, "rad", "Head-on impact"),
    targetRadius: new UncertaintyValue(
      targetRadius,
      targetRadius * 0.1,
      "m",
      "Target specification"
    ),
    impactLocation: "center",
  }),

  /**
   * Estimate DART-like mission parameters
   */
  createDARTLikeMission: (): ImpactorProperties => ({
    mass: new UncertaintyValue(610, 30, "kg", "DART mission specification"),
    velocity: new UncertaintyValue(6140, 100, "m/s", "DART impact velocity"),
    diameter: new UncertaintyValue(1.2, 0.1, "m", "DART spacecraft dimensions"),
    density: new UncertaintyValue(508, 50, "kg/m³", "DART bulk density"),
    material: "aluminum",
  }),
};
