/**
 * Solar Radiation Pressure Deflection Physics Model
 * Implements radiation pressure physics for asteroid deflection
 * Based on solar sail and surface modification deflection methods
 */

import { UncertaintyValue, PHYSICAL_CONSTANTS } from "../../physics/constants";
import { UnitConverter } from "../../physics/units";
import {
  UncertaintyPropagator,
  UncertaintyVariable,
  DistributionType,
} from "../../physics/uncertainty";

/**
 * Solar radiation pressure deflection methods
 */
export type SolarDeflectionMethod =
  | "solar_sail"
  | "surface_modification"
  | "concentrated_sunlight"
  | "albedo_modification";

/**
 * Solar sail properties
 */
export interface SolarSailProperties {
  sailArea: UncertaintyValue; // m² (effective sail area)
  sailMass: UncertaintyValue; // kg (total sail mass including support structure)
  reflectivity: UncertaintyValue; // dimensionless (0-1, fraction of light reflected)
  absorptivity: UncertaintyValue; // dimensionless (0-1, fraction of light absorbed)
  transmissivity: UncertaintyValue; // dimensionless (0-1, fraction of light transmitted)
  sailEfficiency: UncertaintyValue; // dimensionless (0-1, overall efficiency)
  deploymentTime: UncertaintyValue; // s (time to deploy sail)
  operationalLifetime: UncertaintyValue; // s (sail operational lifetime)
  sailType: "flat" | "parabolic" | "heliogyro" | "spinning";
}

/**
 * Target asteroid properties for solar deflection
 */
export interface SolarDeflectionTarget {
  mass: UncertaintyValue; // kg
  radius: UncertaintyValue; // m
  crossSectionalArea: UncertaintyValue; // m² (effective area facing Sun)
  albedo: UncertaintyValue; // dimensionless (0-1, geometric albedo)
  thermalInertia: UncertaintyValue; // J m⁻² K⁻¹ s⁻¹/²
  rotationPeriod: UncertaintyValue; // s
  obliquity: UncertaintyValue; // rad (axial tilt)
  surfaceRoughness: UncertaintyValue; // dimensionless (0-1, surface roughness factor)
  composition: "rocky" | "metallic" | "carbonaceous" | "mixed";
}

/**
 * Solar environment parameters
 */
export interface SolarEnvironment {
  solarDistance: UncertaintyValue; // AU (distance from Sun)
  solarFlux: UncertaintyValue; // W/m² (solar irradiance)
  solarConstant: UncertaintyValue; // W/m² (solar constant at 1 AU)
  seasonalVariation: UncertaintyValue; // dimensionless (±variation due to orbital eccentricity)
  solarActivity: UncertaintyValue; // dimensionless (solar activity factor)
  interplanetaryMedium: {
    density: UncertaintyValue; // kg/m³ (interplanetary dust density)
    dragCoefficient: UncertaintyValue; // dimensionless
  };
}

/**
 * Solar deflection mission parameters
 */
export interface SolarDeflectionMission {
  missionDuration: UncertaintyValue; // s
  deploymentDistance: UncertaintyValue; // m (distance from asteroid for deployment)
  operatingDistance: UncertaintyValue; // m (operating distance from asteroid)
  orientationAccuracy: UncertaintyValue; // rad (pointing accuracy)
  stationKeepingCapability: boolean;
  autonomousOperation: boolean;
  communicationDelay: UncertaintyValue; // s
}

/**
 * Solar radiation pressure force result
 */
export interface SolarRadiationForceResult {
  // Direct radiation pressure forces
  radiationPressureForce: UncertaintyValue; // N (force on sail/surface)
  photonMomentumFlux: UncertaintyValue; // kg⋅m/s per second

  // Force components
  radialForce: UncertaintyValue; // N (toward/away from Sun)
  tangentialForce: UncertaintyValue; // N (perpendicular to radial)
  normalForce: UncertaintyValue; // N (out of orbital plane)

  // Acceleration components
  radialAcceleration: UncertaintyValue; // m/s² (on target asteroid)
  tangentialAcceleration: UncertaintyValue; // m/s²
  normalAcceleration: UncertaintyValue; // m/s²

  // Efficiency factors
  geometricEfficiency: UncertaintyValue; // dimensionless (geometric factors)
  opticalEfficiency: UncertaintyValue; // dimensionless (optical properties)
  overallEfficiency: UncertaintyValue; // dimensionless (total efficiency)
}

/**
 * Solar deflection result
 */
export interface SolarDeflectionResult {
  // Force and acceleration
  forceResult: SolarRadiationForceResult;

  // Trajectory changes
  deltaV: UncertaintyValue; // m/s (total velocity change)
  deltaVRate: UncertaintyValue; // m/s per year
  orbitalElementChanges: {
    semiMajorAxis: UncertaintyValue; // m
    eccentricity: UncertaintyValue; // dimensionless
    inclination: UncertaintyValue; // rad
    argumentOfPeriapsis: UncertaintyValue; // rad
    longitudeOfAscendingNode: UncertaintyValue; // rad
    meanAnomaly: UncertaintyValue; // rad
  };

  // Mission parameters
  requiredSailArea: UncertaintyValue; // m²
  totalSystemMass: UncertaintyValue; // kg
  powerRequirement: UncertaintyValue; // W (for active systems)

  // Performance metrics
  deflectionEfficiency: UncertaintyValue; // m deflection per kg system mass
  costEffectiveness: UncertaintyValue; // m deflection per dollar (rough estimate)
  missionFeasibility: UncertaintyValue; // dimensionless (0-1 feasibility score)

  // Environmental factors
  seasonalVariations: {
    maxDeflection: UncertaintyValue; // m (at perihelion)
    minDeflection: UncertaintyValue; // m (at aphelion)
    averageDeflection: UncertaintyValue; // m (orbital average)
  };

  // Validation flags
  withinValidityRange: boolean;
  warnings: string[];
  references: string[];
}

/**
 * Solar sail specifications for different types
 */
const SOLAR_SAIL_SPECIFICATIONS: Record<
  string,
  Partial<SolarSailProperties>
> = {
  flat: {
    sailEfficiency: new UncertaintyValue(
      0.85,
      0.05,
      "1",
      "Flat sail efficiency"
    ),
    reflectivity: new UncertaintyValue(0.88, 0.02, "1", "Aluminized polyimide"),
    absorptivity: new UncertaintyValue(0.1, 0.02, "1", "Typical absorption"),
    transmissivity: new UncertaintyValue(
      0.02,
      0.01,
      "1",
      "Minimal transmission"
    ),
    deploymentTime: new UncertaintyValue(3600, 600, "s", "1 hour deployment"),
    operationalLifetime: new UncertaintyValue(
      10 * 365.25 * 24 * 3600,
      2 * 365.25 * 24 * 3600,
      "s",
      "10 year lifetime"
    ),
    sailType: "flat",
  },

  parabolic: {
    sailEfficiency: new UncertaintyValue(
      0.92,
      0.03,
      "1",
      "Parabolic concentrator efficiency"
    ),
    reflectivity: new UncertaintyValue(
      0.95,
      0.02,
      "1",
      "High-quality reflector"
    ),
    absorptivity: new UncertaintyValue(0.04, 0.01, "1", "Low absorption"),
    transmissivity: new UncertaintyValue(
      0.01,
      0.005,
      "1",
      "Minimal transmission"
    ),
    deploymentTime: new UncertaintyValue(7200, 1200, "s", "2 hour deployment"),
    operationalLifetime: new UncertaintyValue(
      15 * 365.25 * 24 * 3600,
      3 * 365.25 * 24 * 3600,
      "s",
      "15 year lifetime"
    ),
    sailType: "parabolic",
  },

  heliogyro: {
    sailEfficiency: new UncertaintyValue(
      0.8,
      0.08,
      "1",
      "Heliogyro efficiency"
    ),
    reflectivity: new UncertaintyValue(
      0.85,
      0.03,
      "1",
      "Spinning blade reflectivity"
    ),
    absorptivity: new UncertaintyValue(
      0.12,
      0.03,
      "1",
      "Higher absorption due to geometry"
    ),
    transmissivity: new UncertaintyValue(0.03, 0.01, "1", "Some transmission"),
    deploymentTime: new UncertaintyValue(1800, 300, "s", "30 minute spin-up"),
    operationalLifetime: new UncertaintyValue(
      8 * 365.25 * 24 * 3600,
      2 * 365.25 * 24 * 3600,
      "s",
      "8 year lifetime"
    ),
    sailType: "heliogyro",
  },

  spinning: {
    sailEfficiency: new UncertaintyValue(
      0.75,
      0.1,
      "1",
      "Spinning disk efficiency"
    ),
    reflectivity: new UncertaintyValue(
      0.82,
      0.04,
      "1",
      "Spinning surface reflectivity"
    ),
    absorptivity: new UncertaintyValue(0.15, 0.04, "1", "Moderate absorption"),
    transmissivity: new UncertaintyValue(0.03, 0.01, "1", "Some transmission"),
    deploymentTime: new UncertaintyValue(900, 180, "s", "15 minute deployment"),
    operationalLifetime: new UncertaintyValue(
      5 * 365.25 * 24 * 3600,
      1 * 365.25 * 24 * 3600,
      "s",
      "5 year lifetime"
    ),
    sailType: "spinning",
  },
};

/**
 * Standard solar environment at different distances
 */
const SOLAR_ENVIRONMENTS: Record<string, Partial<SolarEnvironment>> = {
  "1_AU": {
    solarDistance: new UncertaintyValue(
      1.0,
      0.017,
      "AU",
      "Earth orbit (±1.7% eccentricity)"
    ),
    solarFlux: new UncertaintyValue(1361, 5, "W/m²", "Solar constant at 1 AU"),
    solarConstant: new UncertaintyValue(
      1361,
      5,
      "W/m²",
      "Standard solar constant"
    ),
    seasonalVariation: new UncertaintyValue(
      0.034,
      0.005,
      "1",
      "±3.4% seasonal variation"
    ),
    solarActivity: new UncertaintyValue(
      1.0,
      0.1,
      "1",
      "Average solar activity"
    ),
  },

  "1.5_AU": {
    solarDistance: new UncertaintyValue(1.5, 0.1, "AU", "Mars-like orbit"),
    solarFlux: new UncertaintyValue(605, 20, "W/m²", "Solar flux at 1.5 AU"),
    solarConstant: new UncertaintyValue(
      1361,
      5,
      "W/m²",
      "Standard solar constant"
    ),
    seasonalVariation: new UncertaintyValue(
      0.05,
      0.01,
      "1",
      "±5% seasonal variation"
    ),
    solarActivity: new UncertaintyValue(
      1.0,
      0.1,
      "1",
      "Average solar activity"
    ),
  },

  "2_AU": {
    solarDistance: new UncertaintyValue(2.0, 0.2, "AU", "Asteroid belt"),
    solarFlux: new UncertaintyValue(340, 15, "W/m²", "Solar flux at 2 AU"),
    solarConstant: new UncertaintyValue(
      1361,
      5,
      "W/m²",
      "Standard solar constant"
    ),
    seasonalVariation: new UncertaintyValue(
      0.1,
      0.02,
      "1",
      "±10% seasonal variation"
    ),
    solarActivity: new UncertaintyValue(
      1.0,
      0.1,
      "1",
      "Average solar activity"
    ),
  },
};

/**
 * Solar Radiation Pressure Deflection Calculator
 */
export class SolarDeflectionCalculator {
  /**
   * Calculate solar radiation pressure deflection
   */
  static calculateSolarDeflection(
    method: SolarDeflectionMethod,
    sailProperties: SolarSailProperties,
    target: SolarDeflectionTarget,
    environment: SolarEnvironment,
    mission: SolarDeflectionMission
  ): SolarDeflectionResult {
    const warnings: string[] = [];
    const references: string[] = [
      "McInnes, C.R. (1999). Solar Sailing: Technology, Dynamics and Mission Applications",
      "Wie, B. (2008). Solar radiation pressure effects on asteroids",
      "Dachwald, B. et al. (2006). Parametric model and optimal control of solar sails",
      "Vulpetti, G. et al. (2014). Solar Sails: A Novel Approach to Interplanetary Travel",
    ];

    // Validate input parameters
    const validationResult = this.validateInputParameters(
      method,
      sailProperties,
      target,
      environment,
      mission
    );
    warnings.push(...validationResult.warnings);

    // Calculate solar radiation pressure forces
    const forceResult = this.calculateSolarRadiationForces(
      method,
      sailProperties,
      target,
      environment,
      mission
    );

    // Calculate trajectory changes over mission duration
    const trajectoryChanges = this.calculateTrajectoryChanges(
      forceResult,
      target,
      mission
    );

    // Calculate required system parameters
    const systemRequirements = this.calculateSystemRequirements(
      method,
      sailProperties,
      target,
      forceResult
    );

    // Calculate performance metrics
    const performance = this.calculatePerformanceMetrics(
      forceResult,
      trajectoryChanges.deltaV,
      systemRequirements,
      mission
    );

    // Calculate seasonal variations
    const seasonalVariations = this.calculateSeasonalVariations(
      forceResult,
      environment,
      mission
    );

    return {
      forceResult,
      deltaV: trajectoryChanges.deltaV,
      deltaVRate: trajectoryChanges.deltaVRate,
      orbitalElementChanges: trajectoryChanges.orbitalElements,
      requiredSailArea: systemRequirements.sailArea,
      totalSystemMass: systemRequirements.totalMass,
      powerRequirement: systemRequirements.powerRequirement,
      deflectionEfficiency: performance.deflectionEfficiency,
      costEffectiveness: performance.costEffectiveness,
      missionFeasibility: performance.feasibilityScore,
      seasonalVariations,
      withinValidityRange: validationResult.withinValidityRange,
      warnings,
      references,
    };
  }

  /**
   * Calculate solar radiation pressure forces
   */
  private static calculateSolarRadiationForces(
    method: SolarDeflectionMethod,
    sailProperties: SolarSailProperties,
    target: SolarDeflectionTarget,
    environment: SolarEnvironment,
    mission: SolarDeflectionMission
  ): SolarRadiationForceResult {
    // Calculate photon momentum flux
    const photonMomentumFlux = this.calculatePhotonMomentumFlux(environment);

    // Calculate radiation pressure force based on method
    let radiationPressureForce: UncertaintyValue;
    let geometricEfficiency: UncertaintyValue;
    let opticalEfficiency: UncertaintyValue;

    switch (method) {
      case "solar_sail":
        ({
          force: radiationPressureForce,
          geometricEff: geometricEfficiency,
          opticalEff: opticalEfficiency,
        } = this.calculateSolarSailForce(sailProperties, environment));
        break;

      case "surface_modification":
        ({
          force: radiationPressureForce,
          geometricEff: geometricEfficiency,
          opticalEff: opticalEfficiency,
        } = this.calculateSurfaceModificationForce(target, environment));
        break;

      case "concentrated_sunlight":
        ({
          force: radiationPressureForce,
          geometricEff: geometricEfficiency,
          opticalEff: opticalEfficiency,
        } = this.calculateConcentratedSunlightForce(
          sailProperties,
          target,
          environment
        ));
        break;

      case "albedo_modification":
        ({
          force: radiationPressureForce,
          geometricEff: geometricEfficiency,
          opticalEff: opticalEfficiency,
        } = this.calculateAlbedoModificationForce(target, environment));
        break;

      default:
        throw new Error(`Unknown solar deflection method: ${method}`);
    }

    // Calculate force components (simplified - assumes optimal orientation)
    const forceComponents = this.calculateForceComponents(
      radiationPressureForce
    );

    // Calculate accelerations on target asteroid
    const accelerations = this.calculateAccelerations(
      forceComponents,
      target.mass
    );

    // Overall efficiency
    const overallEfficiency = new UncertaintyValue(
      geometricEfficiency.value *
        opticalEfficiency.value *
        sailProperties.sailEfficiency.value,
      Math.sqrt(
        Math.pow(
          geometricEfficiency.uncertainty *
            opticalEfficiency.value *
            sailProperties.sailEfficiency.value,
          2
        ) +
          Math.pow(
            geometricEfficiency.value *
              opticalEfficiency.uncertainty *
              sailProperties.sailEfficiency.value,
            2
          ) +
          Math.pow(
            geometricEfficiency.value *
              opticalEfficiency.value *
              sailProperties.sailEfficiency.uncertainty,
            2
          )
      ),
      "1",
      "Combined efficiency factors",
      "Overall system efficiency"
    );

    return {
      radiationPressureForce,
      photonMomentumFlux,
      radialForce: forceComponents.radial,
      tangentialForce: forceComponents.tangential,
      normalForce: forceComponents.normal,
      radialAcceleration: accelerations.radial,
      tangentialAcceleration: accelerations.tangential,
      normalAcceleration: accelerations.normal,
      geometricEfficiency,
      opticalEfficiency,
      overallEfficiency,
    };
  }

  /**
   * Calculate photon momentum flux from solar radiation
   */
  private static calculatePhotonMomentumFlux(
    environment: SolarEnvironment
  ): UncertaintyValue {
    // Photon momentum flux = Solar flux / c (speed of light)
    const variables: UncertaintyVariable[] = [
      {
        name: "flux",
        value: environment.solarFlux,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "c",
        value: PHYSICAL_CONSTANTS.SPEED_OF_LIGHT,
        distribution: DistributionType.NORMAL,
      },
    ];

    const momentumFluxFunction = (inputs: Record<string, number>) => {
      return inputs.flux / inputs.c;
    };

    const result = UncertaintyPropagator.propagateNonlinear(
      variables,
      momentumFluxFunction
    );

    return new UncertaintyValue(
      result.value,
      result.uncertainty,
      "kg⋅m/s per second per m²",
      "Calculated from solar flux and speed of light",
      "Photon momentum flux"
    );
  }

  /**
   * Calculate solar sail force
   */
  private static calculateSolarSailForce(
    sailProperties: SolarSailProperties,
    environment: SolarEnvironment
  ): {
    force: UncertaintyValue;
    geometricEff: UncertaintyValue;
    opticalEff: UncertaintyValue;
  } {
    // Solar sail force: F = (2 * Φ * A * R * cos²θ) where Φ is photon flux, A is area, R is reflectivity
    const variables: UncertaintyVariable[] = [
      {
        name: "flux",
        value: environment.solarFlux,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "area",
        value: sailProperties.sailArea,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "reflectivity",
        value: sailProperties.reflectivity,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "c",
        value: PHYSICAL_CONSTANTS.SPEED_OF_LIGHT,
        distribution: DistributionType.NORMAL,
      },
    ];

    const sailForceFunction = (inputs: Record<string, number>) => {
      // Assume optimal orientation (cos²θ = 1)
      return (2 * inputs.flux * inputs.area * inputs.reflectivity) / inputs.c;
    };

    const result = UncertaintyPropagator.propagateNonlinear(
      variables,
      sailForceFunction
    );

    const force = new UncertaintyValue(
      result.value,
      result.uncertainty,
      "N",
      "Solar sail radiation pressure force",
      "Solar sail force"
    );

    const geometricEfficiency = new UncertaintyValue(
      1.0, // Optimal orientation assumed
      0.1, // 10% uncertainty in geometric factors
      "1",
      "Geometric efficiency for optimal orientation",
      "Geometric efficiency"
    );

    const opticalEfficiency = sailProperties.reflectivity;

    return {
      force,
      geometricEff: geometricEfficiency,
      opticalEff: opticalEfficiency,
    };
  }

  /**
   * Calculate surface modification force
   */
  private static calculateSurfaceModificationForce(
    target: SolarDeflectionTarget,
    environment: SolarEnvironment
  ): {
    force: UncertaintyValue;
    geometricEff: UncertaintyValue;
    opticalEff: UncertaintyValue;
  } {
    // Surface modification changes asteroid's albedo and thermal properties
    const variables: UncertaintyVariable[] = [
      {
        name: "flux",
        value: environment.solarFlux,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "area",
        value: target.crossSectionalArea,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "albedo",
        value: target.albedo,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "c",
        value: PHYSICAL_CONSTANTS.SPEED_OF_LIGHT,
        distribution: DistributionType.NORMAL,
      },
    ];

    const surfaceForceFunction = (inputs: Record<string, number>) => {
      // Force from modified surface reflectivity
      const albedoChange = 0.5; // Assume 50% increase in albedo
      return (inputs.flux * inputs.area * albedoChange) / inputs.c;
    };

    const result = UncertaintyPropagator.propagateNonlinear(
      variables,
      surfaceForceFunction
    );

    const force = new UncertaintyValue(
      result.value,
      result.uncertainty,
      "N",
      "Surface modification radiation pressure force",
      "Surface modification force"
    );

    const geometricEfficiency = new UncertaintyValue(
      0.5, // Partial surface coverage
      0.2, // 20% uncertainty
      "1",
      "Geometric efficiency for surface modification",
      "Geometric efficiency"
    );

    const opticalEfficiency = new UncertaintyValue(
      0.5, // 50% albedo increase
      0.2, // 20% uncertainty
      "1",
      "Optical efficiency for surface modification",
      "Optical efficiency"
    );

    return {
      force,
      geometricEff: geometricEfficiency,
      opticalEff: opticalEfficiency,
    };
  }

  /**
   * Calculate concentrated sunlight force
   */
  private static calculateConcentratedSunlightForce(
    sailProperties: SolarSailProperties,
    target: SolarDeflectionTarget,
    environment: SolarEnvironment
  ): {
    force: UncertaintyValue;
    geometricEff: UncertaintyValue;
    opticalEff: UncertaintyValue;
  } {
    // Concentrated sunlight uses mirrors to focus solar radiation
    const variables: UncertaintyVariable[] = [
      {
        name: "flux",
        value: environment.solarFlux,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "mirrorArea",
        value: sailProperties.sailArea,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "targetArea",
        value: target.crossSectionalArea,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "reflectivity",
        value: sailProperties.reflectivity,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "c",
        value: PHYSICAL_CONSTANTS.SPEED_OF_LIGHT,
        distribution: DistributionType.NORMAL,
      },
    ];

    const concentratedForceFunction = (inputs: Record<string, number>) => {
      // Concentration factor limited by target area
      const concentrationFactor = Math.min(
        10,
        inputs.mirrorArea / inputs.targetArea
      );
      return (
        (inputs.flux *
          inputs.targetArea *
          concentrationFactor *
          inputs.reflectivity) /
        inputs.c
      );
    };

    const result = UncertaintyPropagator.propagateNonlinear(
      variables,
      concentratedForceFunction
    );

    const force = new UncertaintyValue(
      result.value,
      result.uncertainty,
      "N",
      "Concentrated sunlight radiation pressure force",
      "Concentrated sunlight force"
    );

    const geometricEfficiency = new UncertaintyValue(
      0.8, // Good focusing efficiency
      0.1, // 10% uncertainty
      "1",
      "Geometric efficiency for concentrated sunlight",
      "Geometric efficiency"
    );

    const opticalEfficiency = sailProperties.reflectivity;

    return {
      force,
      geometricEff: geometricEfficiency,
      opticalEff: opticalEfficiency,
    };
  }

  /**
   * Calculate albedo modification force
   */
  private static calculateAlbedoModificationForce(
    target: SolarDeflectionTarget,
    environment: SolarEnvironment
  ): {
    force: UncertaintyValue;
    geometricEff: UncertaintyValue;
    opticalEff: UncertaintyValue;
  } {
    // Albedo modification changes the asteroid's reflectivity
    const variables: UncertaintyVariable[] = [
      {
        name: "flux",
        value: environment.solarFlux,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "area",
        value: target.crossSectionalArea,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "albedo",
        value: target.albedo,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "c",
        value: PHYSICAL_CONSTANTS.SPEED_OF_LIGHT,
        distribution: DistributionType.NORMAL,
      },
    ];

    const albedoForceFunction = (inputs: Record<string, number>) => {
      // Force from albedo change (Yarkovsky-like effect)
      const albedoChange = 0.3; // Assume 30% albedo change
      return (inputs.flux * inputs.area * albedoChange) / inputs.c;
    };

    const result = UncertaintyPropagator.propagateNonlinear(
      variables,
      albedoForceFunction
    );

    const force = new UncertaintyValue(
      result.value,
      result.uncertainty,
      "N",
      "Albedo modification radiation pressure force",
      "Albedo modification force"
    );

    const geometricEfficiency = new UncertaintyValue(
      0.3, // Partial coverage and orientation effects
      0.1, // 10% uncertainty
      "1",
      "Geometric efficiency for albedo modification",
      "Geometric efficiency"
    );

    const opticalEfficiency = new UncertaintyValue(
      0.3, // 30% albedo change
      0.1, // 10% uncertainty
      "1",
      "Optical efficiency for albedo modification",
      "Optical efficiency"
    );

    return {
      force,
      geometricEff: geometricEfficiency,
      opticalEff: opticalEfficiency,
    };
  }

  /**
   * Calculate force components
   */
  private static calculateForceComponents(totalForce: UncertaintyValue): {
    radial: UncertaintyValue;
    tangential: UncertaintyValue;
    normal: UncertaintyValue;
  } {
    // For solar radiation pressure, force is primarily radial (away from Sun)
    const radial = new UncertaintyValue(
      totalForce.value * 0.9, // 90% radial component
      totalForce.uncertainty * 0.9,
      "N",
      "Radial component of solar force",
      "Radial force"
    );

    const tangential = new UncertaintyValue(
      totalForce.value * 0.1, // 10% tangential component
      totalForce.uncertainty * 0.1,
      "N",
      "Tangential component of solar force",
      "Tangential force"
    );

    const normal = new UncertaintyValue(
      totalForce.value * 0.01, // 1% normal component
      totalForce.uncertainty * 0.01,
      "N",
      "Normal component of solar force",
      "Normal force"
    );

    return { radial, tangential, normal };
  }

  /**
   * Calculate accelerations on target asteroid
   */
  private static calculateAccelerations(
    forceComponents: {
      radial: UncertaintyValue;
      tangential: UncertaintyValue;
      normal: UncertaintyValue;
    },
    targetMass: UncertaintyValue
  ): {
    radial: UncertaintyValue;
    tangential: UncertaintyValue;
    normal: UncertaintyValue;
  } {
    const radial = new UncertaintyValue(
      forceComponents.radial.value / targetMass.value,
      Math.sqrt(
        Math.pow(forceComponents.radial.uncertainty / targetMass.value, 2) +
          Math.pow(
            (forceComponents.radial.value * targetMass.uncertainty) /
              Math.pow(targetMass.value, 2),
            2
          )
      ),
      "m/s²",
      "Radial acceleration on asteroid",
      "Radial acceleration"
    );

    const tangential = new UncertaintyValue(
      forceComponents.tangential.value / targetMass.value,
      Math.sqrt(
        Math.pow(forceComponents.tangential.uncertainty / targetMass.value, 2) +
          Math.pow(
            (forceComponents.tangential.value * targetMass.uncertainty) /
              Math.pow(targetMass.value, 2),
            2
          )
      ),
      "m/s²",
      "Tangential acceleration on asteroid",
      "Tangential acceleration"
    );

    const normal = new UncertaintyValue(
      forceComponents.normal.value / targetMass.value,
      Math.sqrt(
        Math.pow(forceComponents.normal.uncertainty / targetMass.value, 2) +
          Math.pow(
            (forceComponents.normal.value * targetMass.uncertainty) /
              Math.pow(targetMass.value, 2),
            2
          )
      ),
      "m/s²",
      "Normal acceleration on asteroid",
      "Normal acceleration"
    );

    return { radial, tangential, normal };
  }

  /**
   * Calculate trajectory changes over mission duration
   */
  private static calculateTrajectoryChanges(
    forceResult: SolarRadiationForceResult,
    target: SolarDeflectionTarget,
    mission: SolarDeflectionMission
  ): {
    deltaV: UncertaintyValue;
    deltaVRate: UncertaintyValue;
    orbitalElements: {
      semiMajorAxis: UncertaintyValue;
      eccentricity: UncertaintyValue;
      inclination: UncertaintyValue;
      argumentOfPeriapsis: UncertaintyValue;
      longitudeOfAscendingNode: UncertaintyValue;
      meanAnomaly: UncertaintyValue;
    };
  } {
    // Total acceleration magnitude
    const totalAcceleration = new UncertaintyValue(
      Math.sqrt(
        Math.pow(forceResult.radialAcceleration.value, 2) +
          Math.pow(forceResult.tangentialAcceleration.value, 2) +
          Math.pow(forceResult.normalAcceleration.value, 2)
      ),
      Math.sqrt(
        Math.pow(forceResult.radialAcceleration.uncertainty, 2) +
          Math.pow(forceResult.tangentialAcceleration.uncertainty, 2) +
          Math.pow(forceResult.normalAcceleration.uncertainty, 2)
      ),
      "m/s²",
      "Total acceleration magnitude",
      "Total acceleration"
    );

    // Total velocity change: ΔV = a * t
    const variables: UncertaintyVariable[] = [
      {
        name: "acceleration",
        value: totalAcceleration,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "time",
        value: mission.missionDuration,
        distribution: DistributionType.NORMAL,
      },
    ];

    const deltaVFunction = (inputs: Record<string, number>) => {
      return inputs.acceleration * inputs.time;
    };

    const deltaVResult = UncertaintyPropagator.propagateNonlinear(
      variables,
      deltaVFunction
    );

    const deltaV = new UncertaintyValue(
      deltaVResult.value,
      deltaVResult.uncertainty,
      "m/s",
      "Calculated from acceleration and time",
      "Total velocity change"
    );

    // Velocity change rate (per year)
    const secondsPerYear = 365.25 * 24 * 3600;
    const deltaVRate = new UncertaintyValue(
      deltaV.value / (mission.missionDuration.value / secondsPerYear),
      deltaV.uncertainty / (mission.missionDuration.value / secondsPerYear),
      "m/s",
      "Velocity change per year",
      "Delta-V rate"
    );

    // Orbital element changes (simplified)
    const orbitalElements = this.calculateOrbitalElementChanges(
      deltaV,
      forceResult
    );

    return {
      deltaV,
      deltaVRate,
      orbitalElements,
    };
  }

  /**
   * Calculate changes in orbital elements
   */
  private static calculateOrbitalElementChanges(
    deltaV: UncertaintyValue,
    forceResult: SolarRadiationForceResult
  ): {
    semiMajorAxis: UncertaintyValue;
    eccentricity: UncertaintyValue;
    inclination: UncertaintyValue;
    argumentOfPeriapsis: UncertaintyValue;
    longitudeOfAscendingNode: UncertaintyValue;
    meanAnomaly: UncertaintyValue;
  } {
    // Semi-major axis change (primarily from tangential acceleration)
    const semiMajorAxis = new UncertaintyValue(
      deltaV.value * 1e8, // Rough scaling: 1 m/s ΔV ≈ 100 km change in semi-major axis
      deltaV.uncertainty * 1e8,
      "m",
      "Estimated from velocity change",
      "Semi-major axis change"
    );

    // Eccentricity change (from radial acceleration)
    const eccentricity = new UncertaintyValue(
      forceResult.radialAcceleration.value * 1e-6, // Small eccentricity change
      forceResult.radialAcceleration.uncertainty * 1e-6,
      "1",
      "Estimated from radial acceleration",
      "Eccentricity change"
    );

    // Inclination change (from normal acceleration)
    const inclination = new UncertaintyValue(
      forceResult.normalAcceleration.value * 1e-8, // Very small inclination change
      forceResult.normalAcceleration.uncertainty * 1e-8,
      "rad",
      "Estimated from normal acceleration",
      "Inclination change"
    );

    // Other orbital elements have smaller changes
    const argumentOfPeriapsis = new UncertaintyValue(
      deltaV.value * 1e-7,
      deltaV.uncertainty * 1e-7,
      "rad",
      "Estimated from velocity change",
      "Argument of periapsis change"
    );

    const longitudeOfAscendingNode = new UncertaintyValue(
      forceResult.normalAcceleration.value * 1e-9,
      forceResult.normalAcceleration.uncertainty * 1e-9,
      "rad",
      "Estimated from normal acceleration",
      "Longitude of ascending node change"
    );

    const meanAnomaly = new UncertaintyValue(
      deltaV.value * 1e-6,
      deltaV.uncertainty * 1e-6,
      "rad",
      "Estimated from velocity change",
      "Mean anomaly change"
    );

    return {
      semiMajorAxis,
      eccentricity,
      inclination,
      argumentOfPeriapsis,
      longitudeOfAscendingNode,
      meanAnomaly,
    };
  }

  /**
   * Calculate system requirements
   */
  private static calculateSystemRequirements(
    method: SolarDeflectionMethod,
    sailProperties: SolarSailProperties,
    target: SolarDeflectionTarget,
    forceResult: SolarRadiationForceResult
  ): {
    sailArea: UncertaintyValue;
    totalMass: UncertaintyValue;
    powerRequirement: UncertaintyValue;
  } {
    // Required sail area (already specified in sailProperties)
    const sailArea = sailProperties.sailArea;

    // Total system mass
    const totalMass = new UncertaintyValue(
      sailProperties.sailMass.value * 1.5, // 50% overhead for support systems
      sailProperties.sailMass.uncertainty * 1.5,
      "kg",
      "Sail mass plus support systems",
      "Total system mass"
    );

    // Power requirement (varies by method)
    let powerRequirement: UncertaintyValue;
    switch (method) {
      case "solar_sail":
        powerRequirement = new UncertaintyValue(
          100, // 100 W for attitude control and communications
          20,
          "W",
          "Solar sail power requirement",
          "Power requirement"
        );
        break;

      case "surface_modification":
        powerRequirement = new UncertaintyValue(
          1000, // 1 kW for surface modification equipment
          200,
          "W",
          "Surface modification power requirement",
          "Power requirement"
        );
        break;

      case "concentrated_sunlight":
        powerRequirement = new UncertaintyValue(
          500, // 500 W for mirror control systems
          100,
          "W",
          "Concentrated sunlight power requirement",
          "Power requirement"
        );
        break;

      case "albedo_modification":
        powerRequirement = new UncertaintyValue(
          2000, // 2 kW for albedo modification systems
          400,
          "W",
          "Albedo modification power requirement",
          "Power requirement"
        );
        break;

      default:
        powerRequirement = new UncertaintyValue(
          500, // Default power requirement
          100,
          "W",
          "Default power requirement",
          "Power requirement"
        );
    }

    return {
      sailArea,
      totalMass,
      powerRequirement,
    };
  }

  /**
   * Calculate performance metrics
   */
  private static calculatePerformanceMetrics(
    forceResult: SolarRadiationForceResult,
    deltaV: UncertaintyValue,
    systemRequirements: any,
    mission: SolarDeflectionMission
  ): {
    deflectionEfficiency: UncertaintyValue;
    costEffectiveness: UncertaintyValue;
    feasibilityScore: UncertaintyValue;
  } {
    // Deflection efficiency (rough estimate of deflection per unit mass)
    const deflectionEfficiency = new UncertaintyValue(
      (deltaV.value * 1000) / systemRequirements.totalMass.value, // m deflection per kg
      (deltaV.uncertainty * 1000) / systemRequirements.totalMass.value,
      "m/kg",
      "Deflection per unit system mass",
      "Deflection efficiency"
    );

    // Cost effectiveness (very rough estimate)
    const costPerKg = 50000; // $50k per kg (rough estimate for space systems)
    const totalCost = systemRequirements.totalMass.value * costPerKg;
    const costEffectiveness = new UncertaintyValue(
      (deltaV.value * 1000) / totalCost, // m deflection per dollar
      (deltaV.uncertainty * 1000) / totalCost,
      "m/$",
      "Deflection per dollar spent",
      "Cost effectiveness"
    );

    // Mission feasibility score (0-1)
    let feasibilityScore = 1.0;

    // Reduce feasibility for very large systems
    if (systemRequirements.sailArea.value > 10000) {
      // > 10,000 m²
      feasibilityScore *= 0.7;
    }

    // Reduce feasibility for very long missions
    const missionYears = mission.missionDuration.value / (365.25 * 24 * 3600);
    if (missionYears > 10) {
      feasibilityScore *= 0.8;
    }

    // Reduce feasibility for very high power requirements
    if (systemRequirements.powerRequirement.value > 5000) {
      // > 5 kW
      feasibilityScore *= 0.6;
    }

    const feasibility = new UncertaintyValue(
      feasibilityScore,
      0.2, // 20% uncertainty in feasibility assessment
      "1",
      "Mission feasibility assessment",
      "Feasibility score"
    );

    return {
      deflectionEfficiency,
      costEffectiveness,
      feasibilityScore: feasibility,
    };
  }

  /**
   * Calculate seasonal variations
   */
  private static calculateSeasonalVariations(
    forceResult: SolarRadiationForceResult,
    environment: SolarEnvironment,
    mission: SolarDeflectionMission
  ): {
    maxDeflection: UncertaintyValue;
    minDeflection: UncertaintyValue;
    averageDeflection: UncertaintyValue;
  } {
    const baseDeflection =
      forceResult.radiationPressureForce.value *
      mission.missionDuration.value *
      1000; // Rough scaling
    const seasonalVariation = environment.seasonalVariation.value;

    const maxDeflection = new UncertaintyValue(
      baseDeflection * (1 + seasonalVariation),
      baseDeflection * seasonalVariation * 0.5,
      "m",
      "Maximum deflection at perihelion",
      "Maximum deflection"
    );

    const minDeflection = new UncertaintyValue(
      baseDeflection * (1 - seasonalVariation),
      baseDeflection * seasonalVariation * 0.5,
      "m",
      "Minimum deflection at aphelion",
      "Minimum deflection"
    );

    const averageDeflection = new UncertaintyValue(
      baseDeflection,
      baseDeflection * seasonalVariation * 0.3,
      "m",
      "Average deflection over orbit",
      "Average deflection"
    );

    return {
      maxDeflection,
      minDeflection,
      averageDeflection,
    };
  }

  /**
   * Validate input parameters
   */
  private static validateInputParameters(
    method: SolarDeflectionMethod,
    sailProperties: SolarSailProperties,
    target: SolarDeflectionTarget,
    environment: SolarEnvironment,
    mission: SolarDeflectionMission
  ): { withinValidityRange: boolean; warnings: string[] } {
    const warnings: string[] = [];
    let withinValidityRange = true;

    // Check optical properties sum to approximately 1
    const totalOptical =
      sailProperties.reflectivity.value +
      sailProperties.absorptivity.value +
      sailProperties.transmissivity.value;

    if (Math.abs(totalOptical - 1.0) > 0.1) {
      warnings.push(
        `Optical properties sum to ${totalOptical.toFixed(
          2
        )}, should be close to 1.0`
      );
    }

    // Check sail area is reasonable
    if (sailProperties.sailArea.value > 100000) {
      // > 100,000 m²
      warnings.push(
        `Very large sail area (${sailProperties.sailArea.value.toFixed(
          0
        )} m²) may be impractical to deploy`
      );
      withinValidityRange = false;
    }

    // Check solar distance
    if (environment.solarDistance.value > 5) {
      // > 5 AU
      warnings.push(
        `Large solar distance (${environment.solarDistance.value.toFixed(
          1
        )} AU) reduces solar radiation pressure significantly`
      );
    }

    // Check mission duration
    const missionYears = mission.missionDuration.value / (365.25 * 24 * 3600);
    if (
      missionYears >
      sailProperties.operationalLifetime.value / (365.25 * 24 * 3600)
    ) {
      warnings.push(
        `Mission duration (${missionYears.toFixed(
          1
        )} years) exceeds sail operational lifetime`
      );
      withinValidityRange = false;
    }

    // Check target size for surface modification methods
    if (
      (method === "surface_modification" || method === "albedo_modification") &&
      target.radius.value > 1000
    ) {
      // > 1 km radius
      warnings.push(
        `Large target radius (${target.radius.value.toFixed(
          0
        )} m) makes surface modification challenging`
      );
    }

    return { withinValidityRange, warnings };
  }

  /**
   * Get solar sail specifications
   */
  static getSolarSailSpecifications(
    sailType: string
  ): Partial<SolarSailProperties> {
    const specs = SOLAR_SAIL_SPECIFICATIONS[sailType];
    if (!specs) {
      throw new Error(`Unknown solar sail type: ${sailType}`);
    }
    return specs;
  }

  /**
   * Get solar environment for given distance
   */
  static getSolarEnvironment(distance: string): Partial<SolarEnvironment> {
    const environment = SOLAR_ENVIRONMENTS[distance];
    if (!environment) {
      throw new Error(`Unknown solar distance: ${distance}`);
    }
    return environment;
  }
}

/**
 * Convenience functions for solar deflection calculations
 */
export const SolarDeflectionUtils = {
  /**
   * Create a typical flat solar sail
   */
  createFlatSolarSail: (area: number): SolarSailProperties => {
    const baseSpecs =
      SolarDeflectionCalculator.getSolarSailSpecifications("flat");
    return {
      sailArea: new UncertaintyValue(
        area,
        area * 0.1,
        "m²",
        "Specified sail area"
      ),
      sailMass: new UncertaintyValue(
        area * 0.01,
        area * 0.002,
        "kg",
        "10 g/m² sail density"
      ),
      ...baseSpecs,
    } as SolarSailProperties;
  },

  /**
   * Create solar environment at specified distance
   */
  createSolarEnvironment: (distanceAU: number): SolarEnvironment => {
    const solarConstant = 1361; // W/m² at 1 AU
    const flux = solarConstant / Math.pow(distanceAU, 2);

    return {
      solarDistance: new UncertaintyValue(
        distanceAU,
        distanceAU * 0.05,
        "AU",
        "Specified distance"
      ),
      solarFlux: new UncertaintyValue(
        flux,
        flux * 0.05,
        "W/m²",
        "Calculated from distance"
      ),
      solarConstant: new UncertaintyValue(
        solarConstant,
        5,
        "W/m²",
        "Standard solar constant"
      ),
      seasonalVariation: new UncertaintyValue(
        0.05,
        0.01,
        "1",
        "Typical seasonal variation"
      ),
      solarActivity: new UncertaintyValue(
        1.0,
        0.1,
        "1",
        "Average solar activity"
      ),
      interplanetaryMedium: {
        density: new UncertaintyValue(
          1e-20,
          5e-21,
          "kg/m³",
          "Interplanetary dust density"
        ),
        dragCoefficient: new UncertaintyValue(
          2.0,
          0.2,
          "1",
          "Typical drag coefficient"
        ),
      },
    };
  },

  /**
   * Create typical mission parameters
   */
  createTypicalMission: (durationYears: number): SolarDeflectionMission => ({
    missionDuration: new UncertaintyValue(
      durationYears * 365.25 * 24 * 3600,
      0.5 * 365.25 * 24 * 3600,
      "s",
      `${durationYears} year mission`
    ),
    deploymentDistance: new UncertaintyValue(
      1000,
      200,
      "m",
      "1 km deployment distance"
    ),
    operatingDistance: new UncertaintyValue(
      500,
      100,
      "m",
      "500 m operating distance"
    ),
    orientationAccuracy: new UncertaintyValue(
      0.01,
      0.002,
      "rad",
      "±0.01 rad pointing accuracy"
    ),
    stationKeepingCapability: true,
    autonomousOperation: true,
    communicationDelay: new UncertaintyValue(1200, 300, "s", "20 minute delay"),
  }),

  /**
   * Create target from basic properties
   */
  createSolarTarget: (
    mass: number,
    radius: number,
    albedo: number,
    composition: "rocky" | "metallic" | "carbonaceous" | "mixed"
  ): SolarDeflectionTarget => ({
    mass: new UncertaintyValue(mass, mass * 0.2, "kg", "Target specification"),
    radius: new UncertaintyValue(
      radius,
      radius * 0.1,
      "m",
      "Target specification"
    ),
    crossSectionalArea: new UncertaintyValue(
      Math.PI * radius * radius,
      Math.PI * radius * radius * 0.2,
      "m²",
      "Calculated"
    ),
    albedo: new UncertaintyValue(albedo, albedo * 0.3, "1", "Specified albedo"),
    thermalInertia: new UncertaintyValue(
      50,
      20,
      "J m⁻² K⁻¹ s⁻¹/²",
      "Typical thermal inertia"
    ),
    rotationPeriod: new UncertaintyValue(
      24 * 3600,
      12 * 3600,
      "s",
      "Estimated rotation period"
    ),
    obliquity: new UncertaintyValue(0.1, 0.05, "rad", "Estimated obliquity"),
    surfaceRoughness: new UncertaintyValue(
      0.5,
      0.2,
      "1",
      "Moderate surface roughness"
    ),
    composition,
  }),
};
