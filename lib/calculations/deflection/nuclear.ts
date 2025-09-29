/**
 * Nuclear Deflection Physics Model
 * Implements Ahrens & Harris (1992) models for nuclear asteroid deflection
 * Based on nuclear weapons effects studies and X-ray/neutron momentum deposition
 */

import { UncertaintyValue } from "../../physics/constants";
import { UnitConverter } from "../../physics/units";
import {
  UncertaintyPropagator,
  UncertaintyVariable,
  DistributionType,
} from "../../physics/uncertainty";

/**
 * Nuclear device properties
 */
export interface NuclearDeviceProperties {
  yield: UncertaintyValue; // Mt TNT equivalent
  mass: UncertaintyValue; // kg (device mass)
  xrayFraction: UncertaintyValue; // Fraction of energy in X-rays (0-1)
  neutronFraction: UncertaintyValue; // Fraction of energy in neutrons (0-1)
  gammaFraction: UncertaintyValue; // Fraction of energy in gamma rays (0-1)
  debrisFraction: UncertaintyValue; // Fraction of energy in debris (0-1)
  deviceType: "fission" | "fusion" | "hybrid";
}

/**
 * Target asteroid properties for nuclear deflection
 */
export interface NuclearTargetProperties {
  mass: UncertaintyValue; // kg
  radius: UncertaintyValue; // m
  density: UncertaintyValue; // kg/m³
  composition: "rocky" | "metallic" | "carbonaceous" | "mixed";
  albedo: UncertaintyValue; // Geometric albedo (0-1)
  thermalInertia: UncertaintyValue; // J m⁻² K⁻¹ s⁻¹/²
  vaporization: {
    energy: UncertaintyValue; // J/kg (specific energy for vaporization)
    temperature: UncertaintyValue; // K (vaporization temperature)
  };
}

/**
 * Nuclear deflection geometry
 */
export interface NuclearDeflectionGeometry {
  standoffDistance: UncertaintyValue; // m (distance from surface)
  burstHeight: UncertaintyValue; // m (height above surface, negative for subsurface)
  targetAspectAngle: UncertaintyValue; // rad (angle relative to velocity vector)
  detonationTiming: "contact" | "proximity" | "standoff" | "subsurface";
}

/**
 * Nuclear momentum deposition mechanisms
 */
export interface MomentumDepositionResult {
  // X-ray momentum deposition
  xrayMomentum: UncertaintyValue; // kg⋅m/s
  xrayPenetrationDepth: UncertaintyValue; // m
  xrayHeatedMass: UncertaintyValue; // kg

  // Neutron momentum deposition
  neutronMomentum: UncertaintyValue; // kg⋅m/s
  neutronPenetrationDepth: UncertaintyValue; // m
  neutronHeatedMass: UncertaintyValue; // kg

  // Debris momentum transfer
  debrisMomentum: UncertaintyValue; // kg⋅m/s

  // Total momentum transfer
  totalMomentum: UncertaintyValue; // kg⋅m/s

  // Vaporized/ablated mass
  vaporizedMass: UncertaintyValue; // kg
  ablationVelocity: UncertaintyValue; // m/s
}

/**
 * Nuclear deflection result
 */
export interface NuclearDeflectionResult {
  // Momentum transfer
  momentumDeposition: MomentumDepositionResult;
  momentumTransferEfficiency: UncertaintyValue; // dimensionless

  // Velocity change
  deltaV: UncertaintyValue; // m/s

  // Energy deposition
  totalEnergyDeposited: UncertaintyValue; // J
  specificEnergyDeposition: UncertaintyValue; // J/kg

  // Thermal effects
  surfaceTemperature: UncertaintyValue; // K
  thermalPenetrationDepth: UncertaintyValue; // m

  // Structural effects
  fractureRadius: UncertaintyValue; // m (radius of structural damage)
  spallationMass: UncertaintyValue; // kg (mass ejected by spallation)

  // Optimization parameters
  optimalStandoffDistance: UncertaintyValue; // m
  momentumCouplingCoefficient: UncertaintyValue; // s/m (momentum per unit energy per unit area)

  // Validation flags
  withinValidityRange: boolean;
  warnings: string[];
  references: string[];
}

/**
 * Nuclear device specifications for common types
 */
const NUCLEAR_DEVICE_SPECIFICATIONS: Record<string, NuclearDeviceProperties> = {
  // Small tactical nuclear device
  tactical: {
    yield: new UncertaintyValue(
      0.01,
      0.002,
      "Mt TNT",
      "Tactical nuclear device"
    ),
    mass: new UncertaintyValue(100, 20, "kg", "Estimated device mass"),
    xrayFraction: new UncertaintyValue(0.75, 0.05, "1", "Ahrens & Harris 1992"),
    neutronFraction: new UncertaintyValue(
      0.05,
      0.01,
      "1",
      "Ahrens & Harris 1992"
    ),
    gammaFraction: new UncertaintyValue(
      0.15,
      0.02,
      "1",
      "Ahrens & Harris 1992"
    ),
    debrisFraction: new UncertaintyValue(
      0.05,
      0.01,
      "1",
      "Ahrens & Harris 1992"
    ),
    deviceType: "fission",
  },

  // Strategic nuclear warhead
  strategic: {
    yield: new UncertaintyValue(
      1.0,
      0.1,
      "Mt TNT",
      "Strategic nuclear warhead"
    ),
    mass: new UncertaintyValue(300, 50, "kg", "Estimated device mass"),
    xrayFraction: new UncertaintyValue(0.7, 0.05, "1", "Ahrens & Harris 1992"),
    neutronFraction: new UncertaintyValue(
      0.08,
      0.02,
      "1",
      "Ahrens & Harris 1992"
    ),
    gammaFraction: new UncertaintyValue(
      0.17,
      0.03,
      "1",
      "Ahrens & Harris 1992"
    ),
    debrisFraction: new UncertaintyValue(
      0.05,
      0.01,
      "1",
      "Ahrens & Harris 1992"
    ),
    deviceType: "fusion",
  },

  // Large thermonuclear device
  thermonuclear: {
    yield: new UncertaintyValue(
      10.0,
      1.0,
      "Mt TNT",
      "Large thermonuclear device"
    ),
    mass: new UncertaintyValue(1000, 200, "kg", "Estimated device mass"),
    xrayFraction: new UncertaintyValue(0.65, 0.05, "1", "Ahrens & Harris 1992"),
    neutronFraction: new UncertaintyValue(
      0.1,
      0.02,
      "1",
      "Ahrens & Harris 1992"
    ),
    gammaFraction: new UncertaintyValue(0.2, 0.03, "1", "Ahrens & Harris 1992"),
    debrisFraction: new UncertaintyValue(
      0.05,
      0.01,
      "1",
      "Ahrens & Harris 1992"
    ),
    deviceType: "fusion",
  },
};

/**
 * Material properties for nuclear deflection calculations
 */
const NUCLEAR_TARGET_PROPERTIES: Record<
  string,
  Partial<NuclearTargetProperties>
> = {
  rocky: {
    density: new UncertaintyValue(2700, 300, "kg/m³", "Typical rocky asteroid"),
    albedo: new UncertaintyValue(0.15, 0.05, "1", "S-type asteroid albedo"),
    thermalInertia: new UncertaintyValue(
      50,
      20,
      "J m⁻² K⁻¹ s⁻¹/²",
      "Rocky material"
    ),
    vaporization: {
      energy: new UncertaintyValue(
        8e6,
        2e6,
        "J/kg",
        "Silicate vaporization energy"
      ),
      temperature: new UncertaintyValue(
        2500,
        200,
        "K",
        "Silicate vaporization temperature"
      ),
    },
  },

  metallic: {
    density: new UncertaintyValue(7800, 500, "kg/m³", "Iron-nickel asteroid"),
    albedo: new UncertaintyValue(0.25, 0.05, "1", "M-type asteroid albedo"),
    thermalInertia: new UncertaintyValue(
      200,
      50,
      "J m⁻² K⁻¹ s⁻¹/²",
      "Metallic material"
    ),
    vaporization: {
      energy: new UncertaintyValue(
        6e6,
        1e6,
        "J/kg",
        "Iron vaporization energy"
      ),
      temperature: new UncertaintyValue(
        3000,
        200,
        "K",
        "Iron vaporization temperature"
      ),
    },
  },

  carbonaceous: {
    density: new UncertaintyValue(1400, 200, "kg/m³", "C-type asteroid"),
    albedo: new UncertaintyValue(0.05, 0.02, "1", "C-type asteroid albedo"),
    thermalInertia: new UncertaintyValue(
      20,
      10,
      "J m⁻² K⁻¹ s⁻¹/²",
      "Carbonaceous material"
    ),
    vaporization: {
      energy: new UncertaintyValue(
        4e6,
        1e6,
        "J/kg",
        "Carbonaceous vaporization energy"
      ),
      temperature: new UncertaintyValue(
        2000,
        200,
        "K",
        "Carbonaceous vaporization temperature"
      ),
    },
  },
};

/**
 * Nuclear Deflection Physics Calculator
 */
export class NuclearDeflectionCalculator {
  /**
   * Calculate nuclear deflection effectiveness
   */
  static calculateNuclearDeflection(
    device: NuclearDeviceProperties,
    target: NuclearTargetProperties,
    geometry: NuclearDeflectionGeometry
  ): NuclearDeflectionResult {
    const warnings: string[] = [];
    const references: string[] = [
      "Ahrens, T.J. & Harris, A.W. (1992). Deflection and fragmentation of near-Earth asteroids",
      "Glasstone, S. & Dolan, P.J. (1977). The Effects of Nuclear Weapons",
      "Solem, J.C. (2000). Nuclear explosive propulsion for interplanetary travel",
      "Wie, B. (2008). Dynamics and Control of Gravity Tractor Spacecraft",
    ];

    // Validate input parameters
    const validationResult = this.validateInputParameters(
      device,
      target,
      geometry
    );
    warnings.push(...validationResult.warnings);

    // Calculate total energy available
    const totalEnergy = this.calculateTotalEnergy(device);

    // Optimize standoff distance for maximum momentum transfer
    const optimalStandoff = this.optimizeStandoffDistance(
      device,
      target,
      geometry
    );

    // Calculate momentum deposition from different mechanisms
    const momentumDeposition = this.calculateMomentumDeposition(
      device,
      target,
      { ...geometry, standoffDistance: optimalStandoff }
    );

    // Calculate velocity change
    const deltaV = this.calculateVelocityChange(
      momentumDeposition.totalMomentum,
      target.mass
    );

    // Calculate momentum transfer efficiency
    const efficiency = this.calculateMomentumTransferEfficiency(
      momentumDeposition.totalMomentum,
      totalEnergy,
      geometry.standoffDistance
    );

    // Calculate thermal effects
    const thermalEffects = this.calculateThermalEffects(
      device,
      target,
      geometry
    );

    // Calculate structural effects
    const structuralEffects = this.calculateStructuralEffects(
      device,
      target,
      geometry
    );

    // Calculate momentum coupling coefficient
    const couplingCoefficient = this.calculateMomentumCouplingCoefficient(
      momentumDeposition.totalMomentum,
      totalEnergy,
      target.radius
    );

    return {
      momentumDeposition,
      momentumTransferEfficiency: efficiency,
      deltaV,
      totalEnergyDeposited: totalEnergy,
      specificEnergyDeposition: new UncertaintyValue(
        totalEnergy.value / target.mass.value,
        totalEnergy.uncertainty / target.mass.value,
        "J/kg",
        "Calculated specific energy",
        "Energy per unit mass"
      ),
      surfaceTemperature: thermalEffects.surfaceTemperature,
      thermalPenetrationDepth: thermalEffects.penetrationDepth,
      fractureRadius: structuralEffects.fractureRadius,
      spallationMass: structuralEffects.spallationMass,
      optimalStandoffDistance: optimalStandoff,
      momentumCouplingCoefficient: couplingCoefficient,
      withinValidityRange: validationResult.withinValidityRange,
      warnings,
      references,
    };
  }

  /**
   * Calculate total energy from nuclear device
   */
  private static calculateTotalEnergy(
    device: NuclearDeviceProperties
  ): UncertaintyValue {
    // Convert Mt TNT to Joules
    const energyInJoules = UnitConverter.convert(
      device.yield.value,
      "Mt TNT",
      "J"
    );
    const uncertaintyInJoules = UnitConverter.convert(
      device.yield.uncertainty,
      "Mt TNT",
      "J"
    );

    return new UncertaintyValue(
      energyInJoules,
      uncertaintyInJoules,
      "J",
      "Converted from TNT equivalent",
      "Total nuclear energy release"
    );
  }

  /**
   * Optimize standoff distance for maximum momentum transfer
   */
  private static optimizeStandoffDistance(
    device: NuclearDeviceProperties,
    target: NuclearTargetProperties,
    geometry: NuclearDeflectionGeometry
  ): UncertaintyValue {
    // Optimal standoff distance based on Ahrens & Harris (1992)
    // Approximately 2-5 target radii for maximum momentum coupling

    const variables: UncertaintyVariable[] = [
      {
        name: "radius",
        value: target.radius,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "yield",
        value: device.yield,
        distribution: DistributionType.NORMAL,
      },
    ];

    const standoffFunction = (inputs: Record<string, number>) => {
      // Empirical relationship: optimal standoff ≈ 3 * radius * (yield/1Mt)^0.3
      const yieldFactor = Math.pow(inputs.yield / 1.0, 0.3); // Normalized to 1 Mt
      return 3.0 * inputs.radius * yieldFactor;
    };

    const result = UncertaintyPropagator.propagateNonlinear(
      variables,
      standoffFunction
    );

    return new UncertaintyValue(
      result.value,
      result.uncertainty,
      "m",
      "Optimized for maximum momentum transfer",
      "Optimal standoff distance"
    );
  }

  /**
   * Calculate momentum deposition from nuclear effects
   */
  private static calculateMomentumDeposition(
    device: NuclearDeviceProperties,
    target: NuclearTargetProperties,
    geometry: NuclearDeflectionGeometry
  ): MomentumDepositionResult {
    const totalEnergy = this.calculateTotalEnergy(device);

    // X-ray momentum deposition (dominant mechanism)
    const xrayResults = this.calculateXrayMomentumDeposition(
      device,
      target,
      geometry,
      totalEnergy
    );

    // Neutron momentum deposition
    const neutronResults = this.calculateNeutronMomentumDeposition(
      device,
      target,
      geometry,
      totalEnergy
    );

    // Debris momentum transfer (device fragments)
    const debrisResults = this.calculateDebrisMomentumTransfer(
      device,
      target,
      geometry,
      totalEnergy
    );

    // Total momentum (vector sum, assuming aligned)
    const totalMomentum = new UncertaintyValue(
      xrayResults.momentum.value +
        neutronResults.momentum.value +
        debrisResults.momentum.value,
      Math.sqrt(
        Math.pow(xrayResults.momentum.uncertainty, 2) +
          Math.pow(neutronResults.momentum.uncertainty, 2) +
          Math.pow(debrisResults.momentum.uncertainty, 2)
      ),
      "kg⋅m/s",
      "Combined momentum from all mechanisms",
      "Total momentum transfer"
    );

    // Total vaporized mass
    const vaporizedMass = new UncertaintyValue(
      xrayResults.vaporizedMass.value + neutronResults.vaporizedMass.value,
      Math.sqrt(
        Math.pow(xrayResults.vaporizedMass.uncertainty, 2) +
          Math.pow(neutronResults.vaporizedMass.uncertainty, 2)
      ),
      "kg",
      "Combined vaporized mass",
      "Total vaporized mass"
    );

    // Average ablation velocity
    const ablationVelocity = new UncertaintyValue(
      vaporizedMass.value > 0 ? totalMomentum.value / vaporizedMass.value : 0,
      vaporizedMass.value > 0
        ? Math.sqrt(
            Math.pow(totalMomentum.uncertainty / vaporizedMass.value, 2) +
              Math.pow(
                (totalMomentum.value * vaporizedMass.uncertainty) /
                  Math.pow(vaporizedMass.value, 2),
                2
              )
          )
        : 0,
      "m/s",
      "Calculated from momentum and mass",
      "Average ablation velocity"
    );

    return {
      xrayMomentum: xrayResults.momentum,
      xrayPenetrationDepth: xrayResults.penetrationDepth,
      xrayHeatedMass: xrayResults.heatedMass,
      neutronMomentum: neutronResults.momentum,
      neutronPenetrationDepth: neutronResults.penetrationDepth,
      neutronHeatedMass: neutronResults.heatedMass,
      debrisMomentum: debrisResults.momentum,
      totalMomentum,
      vaporizedMass,
      ablationVelocity,
    };
  }

  /**
   * Calculate X-ray momentum deposition
   */
  private static calculateXrayMomentumDeposition(
    device: NuclearDeviceProperties,
    target: NuclearTargetProperties,
    geometry: NuclearDeflectionGeometry,
    totalEnergy: UncertaintyValue
  ): {
    momentum: UncertaintyValue;
    penetrationDepth: UncertaintyValue;
    heatedMass: UncertaintyValue;
    vaporizedMass: UncertaintyValue;
  } {
    // X-ray energy
    const xrayEnergy = new UncertaintyValue(
      totalEnergy.value * device.xrayFraction.value,
      Math.sqrt(
        Math.pow(totalEnergy.uncertainty * device.xrayFraction.value, 2) +
          Math.pow(totalEnergy.value * device.xrayFraction.uncertainty, 2)
      ),
      "J",
      "X-ray energy fraction",
      "Energy in X-rays"
    );

    // X-ray penetration depth (simplified model)
    const penetrationDepth = new UncertaintyValue(
      0.1 / target.density.value, // Rough approximation: 0.1 kg/m² surface density
      (0.1 * target.density.uncertainty) / Math.pow(target.density.value, 2),
      "m",
      "Estimated X-ray penetration",
      "X-ray penetration depth"
    );

    // Heated mass (mass within penetration depth)
    const surfaceArea = 4 * Math.PI * Math.pow(target.radius.value, 2);
    const heatedVolume = surfaceArea * penetrationDepth.value;
    const heatedMass = new UncertaintyValue(
      heatedVolume * target.density.value,
      heatedVolume * target.density.uncertainty,
      "kg",
      "Mass heated by X-rays",
      "X-ray heated mass"
    );

    // Vaporized mass (fraction of heated mass that vaporizes)
    const vaporizedFraction = Math.min(
      1.0,
      xrayEnergy.value / (heatedMass.value * target.vaporization.energy.value)
    );
    const vaporizedMass = new UncertaintyValue(
      heatedMass.value * vaporizedFraction,
      heatedMass.uncertainty * vaporizedFraction,
      "kg",
      "Vaporized by X-ray heating",
      "X-ray vaporized mass"
    );

    // Momentum from ablation (simplified: p = m * v_escape)
    const escapeVelocity = Math.sqrt(
      (2 * 6.67e-11 * target.mass.value) / target.radius.value
    );
    const momentum = new UncertaintyValue(
      vaporizedMass.value * escapeVelocity * 5, // Higher momentum coupling for X-ray ablation
      vaporizedMass.uncertainty * escapeVelocity * 5,
      "kg⋅m/s",
      "X-ray ablation momentum",
      "Momentum from X-ray ablation"
    );

    return {
      momentum,
      penetrationDepth,
      heatedMass,
      vaporizedMass,
    };
  }

  /**
   * Calculate neutron momentum deposition
   */
  private static calculateNeutronMomentumDeposition(
    device: NuclearDeviceProperties,
    target: NuclearTargetProperties,
    geometry: NuclearDeflectionGeometry,
    totalEnergy: UncertaintyValue
  ): {
    momentum: UncertaintyValue;
    penetrationDepth: UncertaintyValue;
    heatedMass: UncertaintyValue;
    vaporizedMass: UncertaintyValue;
  } {
    // Neutron energy
    const neutronEnergy = new UncertaintyValue(
      totalEnergy.value * device.neutronFraction.value,
      Math.sqrt(
        Math.pow(totalEnergy.uncertainty * device.neutronFraction.value, 2) +
          Math.pow(totalEnergy.value * device.neutronFraction.uncertainty, 2)
      ),
      "J",
      "Neutron energy fraction",
      "Energy in neutrons"
    );

    // Neutron penetration depth (much deeper than X-rays)
    const penetrationDepth = new UncertaintyValue(
      1.0 / target.density.value, // Rough approximation: 1 kg/m² surface density
      target.density.uncertainty / Math.pow(target.density.value, 2),
      "m",
      "Estimated neutron penetration",
      "Neutron penetration depth"
    );

    // Heated mass (smaller fraction due to lower neutron energy and efficiency)
    const surfaceArea = 4 * Math.PI * Math.pow(target.radius.value, 2);
    const heatedVolume = surfaceArea * penetrationDepth.value;
    const heatedMass = new UncertaintyValue(
      heatedVolume * target.density.value * 0.1, // 10% heating efficiency (much lower than X-rays)
      heatedVolume * target.density.uncertainty * 0.1,
      "kg",
      "Mass heated by neutrons",
      "Neutron heated mass"
    );

    // Vaporized mass (smaller than X-ray due to lower energy)
    const vaporizedFraction = Math.min(
      0.1,
      neutronEnergy.value /
        (heatedMass.value * target.vaporization.energy.value)
    );
    const vaporizedMass = new UncertaintyValue(
      heatedMass.value * vaporizedFraction,
      heatedMass.uncertainty * vaporizedFraction,
      "kg",
      "Vaporized by neutron heating",
      "Neutron vaporized mass"
    );

    // Momentum from neutron-induced ablation
    const escapeVelocity = Math.sqrt(
      (2 * 6.67e-11 * target.mass.value) / target.radius.value
    );
    const momentum = new UncertaintyValue(
      vaporizedMass.value * escapeVelocity * 0.5, // Much lower coupling than X-rays
      vaporizedMass.uncertainty * escapeVelocity * 0.5,
      "kg⋅m/s",
      "Neutron ablation momentum",
      "Momentum from neutron ablation"
    );

    return {
      momentum,
      penetrationDepth,
      heatedMass,
      vaporizedMass,
    };
  }

  /**
   * Calculate debris momentum transfer
   */
  private static calculateDebrisMomentumTransfer(
    device: NuclearDeviceProperties,
    target: NuclearTargetProperties,
    geometry: NuclearDeflectionGeometry,
    totalEnergy: UncertaintyValue
  ): {
    momentum: UncertaintyValue;
  } {
    // Debris kinetic energy
    const debrisEnergy = new UncertaintyValue(
      totalEnergy.value * device.debrisFraction.value,
      Math.sqrt(
        Math.pow(totalEnergy.uncertainty * device.debrisFraction.value, 2) +
          Math.pow(totalEnergy.value * device.debrisFraction.uncertainty, 2)
      ),
      "J",
      "Debris kinetic energy",
      "Energy in device debris"
    );

    // Debris velocity (assuming debris mass equals device mass)
    const debrisVelocity = Math.sqrt(
      (2 * debrisEnergy.value) / device.mass.value
    );

    // Momentum transfer (only a small fraction of debris actually impacts target)
    const momentum = new UncertaintyValue(
      device.mass.value * debrisVelocity * 0.0001, // Only 0.01% of debris momentum is transferred
      Math.sqrt(
        Math.pow(device.mass.uncertainty * debrisVelocity * 0.0001, 2) +
          Math.pow(
            (device.mass.value * debrisEnergy.uncertainty * 0.0001) /
              (2 * debrisEnergy.value),
            2
          )
      ),
      "kg⋅m/s",
      "Debris impact momentum",
      "Momentum from debris impact"
    );

    return { momentum };
  }

  /**
   * Calculate velocity change from momentum transfer
   */
  private static calculateVelocityChange(
    momentum: UncertaintyValue,
    targetMass: UncertaintyValue
  ): UncertaintyValue {
    const variables: UncertaintyVariable[] = [
      {
        name: "momentum",
        value: momentum,
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
      "Velocity change from nuclear deflection"
    );
  }

  /**
   * Calculate momentum transfer efficiency
   */
  private static calculateMomentumTransferEfficiency(
    momentum: UncertaintyValue,
    energy: UncertaintyValue,
    standoffDistance: UncertaintyValue
  ): UncertaintyValue {
    // Efficiency based on momentum per unit energy
    // Higher efficiency for closer standoff distances
    const variables: UncertaintyVariable[] = [
      {
        name: "momentum",
        value: momentum,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "energy",
        value: energy,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "distance",
        value: standoffDistance,
        distribution: DistributionType.NORMAL,
      },
    ];

    const efficiencyFunction = (inputs: Record<string, number>) => {
      // Simplified efficiency model
      const baseEfficiency = inputs.momentum / (inputs.energy / 3e8); // momentum per photon
      const distanceFactor = 1 / (1 + inputs.distance / 1000); // Decreases with distance
      return baseEfficiency * distanceFactor;
    };

    const result = UncertaintyPropagator.propagateNonlinear(
      variables,
      efficiencyFunction
    );

    return new UncertaintyValue(
      result.value,
      result.uncertainty,
      "1",
      "Nuclear momentum transfer efficiency",
      "Efficiency of momentum transfer"
    );
  }

  /**
   * Calculate thermal effects
   */
  private static calculateThermalEffects(
    device: NuclearDeviceProperties,
    target: NuclearTargetProperties,
    geometry: NuclearDeflectionGeometry
  ): {
    surfaceTemperature: UncertaintyValue;
    penetrationDepth: UncertaintyValue;
  } {
    const totalEnergy = this.calculateTotalEnergy(device);

    // Surface temperature from thermal radiation
    const thermalEnergy = totalEnergy.value * 0.3; // ~30% thermal radiation
    const surfaceArea =
      4 * Math.PI * Math.pow(geometry.standoffDistance.value, 2);
    const energyFlux = thermalEnergy / surfaceArea;

    // Stefan-Boltzmann law: T^4 = flux / (σ * ε)
    const stefanBoltzmann = 5.67e-8; // W m⁻² K⁻⁴
    const emissivity = 0.9; // Typical for rocky surfaces
    const temperature = Math.pow(
      energyFlux / (stefanBoltzmann * emissivity),
      0.25
    );

    const surfaceTemperature = new UncertaintyValue(
      temperature,
      temperature * 0.2, // 20% uncertainty
      "K",
      "Calculated from thermal flux",
      "Peak surface temperature"
    );

    // Thermal penetration depth
    const thermalDiffusivity =
      target.thermalInertia.value / (target.density.value * 1000); // Rough estimate
    const heatingTime = 1; // 1 second heating duration
    const penetrationDepth = new UncertaintyValue(
      Math.sqrt(thermalDiffusivity * heatingTime),
      Math.sqrt(thermalDiffusivity * heatingTime) * 0.3,
      "m",
      "Thermal diffusion calculation",
      "Thermal penetration depth"
    );

    return {
      surfaceTemperature,
      penetrationDepth,
    };
  }

  /**
   * Calculate structural effects
   */
  private static calculateStructuralEffects(
    device: NuclearDeviceProperties,
    target: NuclearTargetProperties,
    geometry: NuclearDeflectionGeometry
  ): {
    fractureRadius: UncertaintyValue;
    spallationMass: UncertaintyValue;
  } {
    const totalEnergy = this.calculateTotalEnergy(device);

    // Fracture radius based on stress wave propagation
    const stressWaveEnergy = totalEnergy.value * 0.1; // ~10% goes into stress waves
    const fractureRadius = new UncertaintyValue(
      Math.pow(
        stressWaveEnergy / (4 * Math.PI * target.density.value * 1e6),
        1 / 3
      ), // Rough scaling
      Math.pow(
        stressWaveEnergy / (4 * Math.PI * target.density.value * 1e6),
        1 / 3
      ) * 0.5,
      "m",
      "Stress wave propagation estimate",
      "Fracture radius"
    );

    // Spallation mass (mass ejected by stress waves)
    const spallationVolume =
      (4 / 3) * Math.PI * Math.pow(fractureRadius.value, 3) * 0.1; // 10% of fractured volume
    const spallationMass = new UncertaintyValue(
      spallationVolume * target.density.value,
      spallationVolume * target.density.uncertainty,
      "kg",
      "Spallation volume estimate",
      "Mass ejected by spallation"
    );

    return {
      fractureRadius,
      spallationMass,
    };
  }

  /**
   * Calculate momentum coupling coefficient
   */
  private static calculateMomentumCouplingCoefficient(
    momentum: UncertaintyValue,
    energy: UncertaintyValue,
    radius: UncertaintyValue
  ): UncertaintyValue {
    // Momentum coupling coefficient: Cm = momentum / (energy / effective_area)
    // Use effective area (hemisphere facing the blast) rather than total surface area
    const effectiveArea = 2 * Math.PI * Math.pow(radius.value, 2); // Hemisphere
    const energyPerArea = energy.value / effectiveArea;

    const coefficient = new UncertaintyValue(
      momentum.value / energyPerArea,
      Math.sqrt(
        Math.pow(momentum.uncertainty / energyPerArea, 2) +
          Math.pow(
            (momentum.value * energy.uncertainty) / Math.pow(energyPerArea, 2),
            2
          )
      ),
      "s/m",
      "Momentum per unit energy per unit area",
      "Momentum coupling coefficient"
    );

    return coefficient;
  }

  /**
   * Validate input parameters
   */
  private static validateInputParameters(
    device: NuclearDeviceProperties,
    target: NuclearTargetProperties,
    geometry: NuclearDeflectionGeometry
  ): { withinValidityRange: boolean; warnings: string[] } {
    const warnings: string[] = [];
    let withinValidityRange = true;

    // Check energy fractions sum to approximately 1
    const totalFraction =
      device.xrayFraction.value +
      device.neutronFraction.value +
      device.gammaFraction.value +
      device.debrisFraction.value;

    if (Math.abs(totalFraction - 1.0) > 0.1) {
      warnings.push(
        `Energy fractions sum to ${totalFraction.toFixed(
          2
        )}, should be close to 1.0`
      );
    }

    // Check standoff distance is reasonable
    if (geometry.standoffDistance.value < target.radius.value) {
      warnings.push(
        `Standoff distance (${geometry.standoffDistance.value.toFixed(
          1
        )}m) is less than target radius - may cause fragmentation`
      );
    }

    if (geometry.standoffDistance.value > target.radius.value * 10) {
      warnings.push(
        `Large standoff distance (${geometry.standoffDistance.value.toFixed(
          1
        )}m) may reduce momentum transfer efficiency`
      );
    }

    // Check device yield is within reasonable range
    if (device.yield.value < 0.001) {
      warnings.push(
        `Very small nuclear yield (${device.yield.value} Mt) may be ineffective for deflection`
      );
    }

    if (device.yield.value > 100) {
      warnings.push(
        `Very large nuclear yield (${device.yield.value} Mt) may cause fragmentation instead of deflection`
      );
      withinValidityRange = false;
    }

    return { withinValidityRange, warnings };
  }

  /**
   * Get nuclear device specifications
   */
  static getDeviceSpecifications(deviceType: string): NuclearDeviceProperties {
    const specs = NUCLEAR_DEVICE_SPECIFICATIONS[deviceType];
    if (!specs) {
      throw new Error(`Unknown nuclear device type: ${deviceType}`);
    }
    return specs;
  }

  /**
   * Get nuclear target properties
   */
  static getNuclearTargetProperties(
    composition: string
  ): Partial<NuclearTargetProperties> {
    const properties = NUCLEAR_TARGET_PROPERTIES[composition];
    if (!properties) {
      throw new Error(`Unknown target composition: ${composition}`);
    }
    return properties;
  }
}

/**
 * Convenience functions for nuclear deflection calculations
 */
export const NuclearDeflectionUtils = {
  /**
   * Create a typical strategic nuclear device
   */
  createStrategicDevice: (): NuclearDeviceProperties =>
    NuclearDeflectionCalculator.getDeviceSpecifications("strategic"),

  /**
   * Create optimal standoff geometry
   */
  createOptimalStandoffGeometry: (
    targetRadius: number
  ): NuclearDeflectionGeometry => ({
    standoffDistance: new UncertaintyValue(
      targetRadius * 3,
      targetRadius * 0.5,
      "m",
      "Optimal standoff"
    ),
    burstHeight: new UncertaintyValue(
      targetRadius * 3,
      targetRadius * 0.5,
      "m",
      "Above surface"
    ),
    targetAspectAngle: new UncertaintyValue(0, 0.1, "rad", "Head-on approach"),
    detonationTiming: "standoff",
  }),

  /**
   * Create nuclear target from basic properties
   */
  createNuclearTarget: (
    mass: number,
    radius: number,
    composition: "rocky" | "metallic" | "carbonaceous"
  ): NuclearTargetProperties => {
    const baseProperties =
      NuclearDeflectionCalculator.getNuclearTargetProperties(composition);

    return {
      mass: new UncertaintyValue(
        mass,
        mass * 0.2,
        "kg",
        "Target specification"
      ),
      radius: new UncertaintyValue(
        radius,
        radius * 0.1,
        "m",
        "Target specification"
      ),
      composition,
      ...baseProperties,
    } as NuclearTargetProperties;
  },
};
