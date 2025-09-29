/**
 * Gravity Tractor Physics Model
 * Implements precise gravitational calculations for asteroid deflection
 * Based on published gravity tractor mission studies and orbital mechanics
 */

import { UncertaintyValue, PHYSICAL_CONSTANTS } from "../../physics/constants";
import { UnitConverter } from "../../physics/units";
import {
  UncertaintyPropagator,
  UncertaintyVariable,
  DistributionType,
} from "../../physics/uncertainty";

/**
 * Gravity tractor spacecraft properties
 */
export interface GravityTractorProperties {
  mass: UncertaintyValue; // kg (spacecraft mass)
  thrustPower: UncertaintyValue; // W (available thrust power)
  specificImpulse: UncertaintyValue; // s (propulsion system efficiency)
  fuelMass: UncertaintyValue; // kg (available fuel mass)
  dryMass: UncertaintyValue; // kg (spacecraft mass without fuel)
  propulsionType: "ion" | "chemical" | "nuclear" | "solar_sail";
  operationalLifetime: UncertaintyValue; // s (mission duration capability)
}

/**
 * Target asteroid properties for gravity tractor
 */
export interface GravityTractorTarget {
  mass: UncertaintyValue; // kg
  radius: UncertaintyValue; // m
  density: UncertaintyValue; // kg/m³
  rotationPeriod: UncertaintyValue; // s
  obliquity: UncertaintyValue; // rad (axial tilt)
  surfaceGravity: UncertaintyValue; // m/s²
  escapeVelocity: UncertaintyValue; // m/s
}

/**
 * Gravity tractor mission geometry
 */
export interface GravityTractorGeometry {
  operatingDistance: UncertaintyValue; // m (distance from asteroid center)
  stationKeepingAltitude: UncertaintyValue; // m (altitude above surface)
  approachAngle: UncertaintyValue; // rad (angle relative to velocity vector)
  operatingPosition: "leading" | "trailing" | "above" | "below";
  coordinateSystem: "asteroid_fixed" | "inertial" | "orbital";
}

/**
 * Gravity tractor mission parameters
 */
export interface GravityTractorMission {
  missionDuration: UncertaintyValue; // s
  operatingEfficiency: UncertaintyValue; // dimensionless (0-1)
  stationKeepingDeltaV: UncertaintyValue; // m/s (required for station keeping)
  communicationDelay: UncertaintyValue; // s (Earth-spacecraft delay)
  solarDistance: UncertaintyValue; // AU (distance from Sun)
  launchWindow: {
    earliest: Date;
    latest: Date;
    duration: UncertaintyValue; // s
  };
}

/**
 * Gravity tractor force calculation result
 */
export interface GravityTractorForceResult {
  gravitationalForce: UncertaintyValue; // N
  thrustForce: UncertaintyValue; // N
  netForce: UncertaintyValue; // N
  forceDirection: {
    radial: UncertaintyValue; // N (toward/away from asteroid)
    tangential: UncertaintyValue; // N (along orbit)
    normal: UncertaintyValue; // N (perpendicular to orbit plane)
  };
  accelerationOnAsteroid: UncertaintyValue; // m/s²
  equivalentMassRatio: UncertaintyValue; // dimensionless (effective mass increase)
}

/**
 * Gravity tractor deflection result
 */
export interface GravityTractorResult {
  // Force and acceleration
  forceResult: GravityTractorForceResult;

  // Trajectory change
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

  // Mission requirements
  fuelConsumption: UncertaintyValue; // kg
  powerRequirement: UncertaintyValue; // W
  missionEfficiency: UncertaintyValue; // dimensionless

  // Timing and positioning
  optimalOperatingDistance: UncertaintyValue; // m
  stationKeepingRequirements: {
    deltaVPerYear: UncertaintyValue; // m/s/year
    fuelPerYear: UncertaintyValue; // kg/year
    thrustDutyCycle: UncertaintyValue; // dimensionless (0-1)
  };

  // Mission feasibility
  minimumMissionDuration: UncertaintyValue; // s
  maximumDeflection: UncertaintyValue; // m (at Earth encounter)
  costEffectiveness: UncertaintyValue; // m deflection per kg spacecraft

  // Validation flags
  withinValidityRange: boolean;
  warnings: string[];
  references: string[];
}

/**
 * Spacecraft specifications for different propulsion types
 */
const SPACECRAFT_SPECIFICATIONS: Record<
  string,
  Partial<GravityTractorProperties>
> = {
  ion: {
    thrustPower: new UncertaintyValue(
      10000,
      2000,
      "W",
      "Typical ion propulsion power"
    ),
    specificImpulse: new UncertaintyValue(3000, 500, "s", "Ion propulsion Isp"),
    operationalLifetime: new UncertaintyValue(
      10 * 365.25 * 24 * 3600,
      2 * 365.25 * 24 * 3600,
      "s",
      "10 year mission"
    ),
    propulsionType: "ion",
  },

  chemical: {
    thrustPower: new UncertaintyValue(
      50000,
      10000,
      "W",
      "Chemical propulsion power"
    ),
    specificImpulse: new UncertaintyValue(
      450,
      50,
      "s",
      "Chemical propulsion Isp"
    ),
    operationalLifetime: new UncertaintyValue(
      2 * 365.25 * 24 * 3600,
      0.5 * 365.25 * 24 * 3600,
      "s",
      "2 year mission"
    ),
    propulsionType: "chemical",
  },

  nuclear: {
    thrustPower: new UncertaintyValue(
      100000,
      20000,
      "W",
      "Nuclear electric propulsion power"
    ),
    specificImpulse: new UncertaintyValue(
      5000,
      1000,
      "s",
      "Nuclear electric Isp"
    ),
    operationalLifetime: new UncertaintyValue(
      15 * 365.25 * 24 * 3600,
      3 * 365.25 * 24 * 3600,
      "s",
      "15 year mission"
    ),
    propulsionType: "nuclear",
  },

  solar_sail: {
    thrustPower: new UncertaintyValue(
      0,
      0,
      "W",
      "Solar sail (no power required)"
    ),
    specificImpulse: new UncertaintyValue(
      Infinity,
      0,
      "s",
      "Solar sail (no propellant)"
    ),
    operationalLifetime: new UncertaintyValue(
      20 * 365.25 * 24 * 3600,
      5 * 365.25 * 24 * 3600,
      "s",
      "20 year mission"
    ),
    propulsionType: "solar_sail",
  },
};

/**
 * Gravity Tractor Physics Calculator
 */
export class GravityTractorCalculator {
  /**
   * Calculate gravity tractor deflection effectiveness
   */
  static calculateGravityTractorDeflection(
    spacecraft: GravityTractorProperties,
    target: GravityTractorTarget,
    geometry: GravityTractorGeometry,
    mission: GravityTractorMission
  ): GravityTractorResult {
    const warnings: string[] = [];
    const references: string[] = [
      "Lu, E.T. & Love, S.G. (2005). Gravitational tractor for towing asteroids",
      "Wie, B. (2008). Dynamics and Control of Gravity Tractor Spacecraft",
      "Mazanek, D.D. et al. (2015). Asteroid Redirect Mission concept development summary",
      "Scheeres, D.J. (2012). Orbital mechanics about asteroids and comets",
    ];

    // Validate input parameters
    const validationResult = this.validateInputParameters(
      spacecraft,
      target,
      geometry,
      mission
    );
    warnings.push(...validationResult.warnings);

    // Calculate optimal operating distance
    const optimalDistance = this.calculateOptimalOperatingDistance(
      spacecraft,
      target,
      geometry
    );

    // Calculate gravitational and thrust forces
    const forceResult = this.calculateGravityTractorForces(spacecraft, target, {
      ...geometry,
      operatingDistance: optimalDistance,
    });

    // Calculate trajectory changes over mission duration
    const trajectoryChanges = this.calculateTrajectoryChanges(
      forceResult,
      target,
      mission
    );

    // Calculate mission requirements
    const missionRequirements = this.calculateMissionRequirements(
      spacecraft,
      target,
      geometry,
      mission,
      forceResult
    );

    // Calculate station keeping requirements
    const stationKeeping = this.calculateStationKeepingRequirements(
      spacecraft,
      target,
      geometry,
      mission
    );

    // Calculate mission feasibility metrics
    const feasibility = this.calculateMissionFeasibility(
      spacecraft,
      target,
      mission,
      trajectoryChanges.deltaV
    );

    return {
      forceResult,
      deltaV: trajectoryChanges.deltaV,
      deltaVRate: trajectoryChanges.deltaVRate,
      orbitalElementChanges: trajectoryChanges.orbitalElements,
      fuelConsumption: missionRequirements.fuelConsumption,
      powerRequirement: missionRequirements.powerRequirement,
      missionEfficiency: missionRequirements.efficiency,
      optimalOperatingDistance: optimalDistance,
      stationKeepingRequirements: stationKeeping,
      minimumMissionDuration: feasibility.minimumDuration,
      maximumDeflection: feasibility.maximumDeflection,
      costEffectiveness: feasibility.costEffectiveness,
      withinValidityRange: validationResult.withinValidityRange,
      warnings,
      references,
    };
  }

  /**
   * Calculate optimal operating distance for maximum efficiency
   */
  private static calculateOptimalOperatingDistance(
    spacecraft: GravityTractorProperties,
    target: GravityTractorTarget,
    geometry: GravityTractorGeometry
  ): UncertaintyValue {
    // Optimal distance balances gravitational force with station keeping requirements
    // Typically 2-5 times the asteroid radius for small asteroids

    const variables: UncertaintyVariable[] = [
      {
        name: "radius",
        value: target.radius,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "mass",
        value: target.mass,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "spacecraftMass",
        value: spacecraft.mass,
        distribution: DistributionType.NORMAL,
      },
    ];

    const optimalDistanceFunction = (inputs: Record<string, number>) => {
      // Optimal distance scales with asteroid size and spacecraft capability
      const baseDistance = 3 * inputs.radius; // 3 radii as baseline
      const massRatio = inputs.spacecraftMass / inputs.mass;
      const scalingFactor = Math.pow(massRatio, 0.2); // Weak dependence on mass ratio
      return baseDistance * (1 + scalingFactor);
    };

    const result = UncertaintyPropagator.propagateNonlinear(
      variables,
      optimalDistanceFunction
    );

    return new UncertaintyValue(
      result.value,
      result.uncertainty,
      "m",
      "Optimized for force vs station keeping balance",
      "Optimal operating distance"
    );
  }

  /**
   * Calculate gravitational and thrust forces
   */
  private static calculateGravityTractorForces(
    spacecraft: GravityTractorProperties,
    target: GravityTractorTarget,
    geometry: GravityTractorGeometry
  ): GravityTractorForceResult {
    // Gravitational force between spacecraft and asteroid
    const gravitationalForce = this.calculateGravitationalForce(
      spacecraft.mass,
      target.mass,
      geometry.operatingDistance
    );

    // Thrust force required for station keeping and deflection
    const thrustForce = this.calculateThrustForce(spacecraft, target, geometry);

    // Net force on asteroid (gravitational attraction)
    const netForce = gravitationalForce; // Thrust force doesn't directly act on asteroid

    // Force components in orbital coordinate system
    const forceComponents = this.calculateForceComponents(
      gravitationalForce,
      geometry
    );

    // Acceleration on asteroid
    const accelerationOnAsteroid = new UncertaintyValue(
      gravitationalForce.value / target.mass.value,
      Math.sqrt(
        Math.pow(gravitationalForce.uncertainty / target.mass.value, 2) +
          Math.pow(
            (gravitationalForce.value * target.mass.uncertainty) /
              Math.pow(target.mass.value, 2),
            2
          )
      ),
      "m/s²",
      "Gravitational acceleration from spacecraft",
      "Acceleration on asteroid"
    );

    // Equivalent mass ratio (how much the spacecraft effectively increases asteroid mass)
    const equivalentMassRatio = new UncertaintyValue(
      spacecraft.mass.value / target.mass.value,
      Math.sqrt(
        Math.pow(spacecraft.mass.uncertainty / target.mass.value, 2) +
          Math.pow(
            (spacecraft.mass.value * target.mass.uncertainty) /
              Math.pow(target.mass.value, 2),
            2
          )
      ),
      "1",
      "Spacecraft to asteroid mass ratio",
      "Equivalent mass ratio"
    );

    return {
      gravitationalForce,
      thrustForce,
      netForce,
      forceDirection: forceComponents,
      accelerationOnAsteroid,
      equivalentMassRatio,
    };
  }

  /**
   * Calculate gravitational force between spacecraft and asteroid
   */
  private static calculateGravitationalForce(
    spacecraftMass: UncertaintyValue,
    asteroidMass: UncertaintyValue,
    distance: UncertaintyValue
  ): UncertaintyValue {
    // F = G * m1 * m2 / r²
    const variables: UncertaintyVariable[] = [
      {
        name: "G",
        value: PHYSICAL_CONSTANTS.GRAVITATIONAL_CONSTANT,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "m1",
        value: spacecraftMass,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "m2",
        value: asteroidMass,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "r",
        value: distance,
        distribution: DistributionType.NORMAL,
      },
    ];

    const forceFunction = (inputs: Record<string, number>) => {
      return (inputs.G * inputs.m1 * inputs.m2) / Math.pow(inputs.r, 2);
    };

    const result = UncertaintyPropagator.propagateNonlinear(
      variables,
      forceFunction
    );

    return new UncertaintyValue(
      result.value,
      result.uncertainty,
      "N",
      "Calculated from Newton's law of gravitation",
      "Gravitational force"
    );
  }

  /**
   * Calculate thrust force required for station keeping
   */
  private static calculateThrustForce(
    spacecraft: GravityTractorProperties,
    target: GravityTractorTarget,
    geometry: GravityTractorGeometry
  ): UncertaintyValue {
    // Thrust force depends on propulsion system and power available
    const variables: UncertaintyVariable[] = [
      {
        name: "power",
        value: spacecraft.thrustPower,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "isp",
        value: spacecraft.specificImpulse,
        distribution: DistributionType.NORMAL,
      },
    ];

    const thrustFunction = (inputs: Record<string, number>) => {
      if (spacecraft.propulsionType === "solar_sail") {
        // Solar sail thrust depends on solar radiation pressure
        const solarConstant = 1361; // W/m² at 1 AU
        const lightSpeed = 299792458; // m/s
        const sailArea = 1000; // m² (assumed sail area)
        const efficiency = 0.9; // Sail efficiency
        return (2 * solarConstant * sailArea * efficiency) / lightSpeed;
      } else {
        // For other propulsion types: F = 2 * η * P / (Isp * g)
        const g = 9.80665; // Standard gravity
        const efficiency = 0.5; // Propulsion efficiency
        return (2 * efficiency * inputs.power) / (inputs.isp * g);
      }
    };

    const result = UncertaintyPropagator.propagateNonlinear(
      variables,
      thrustFunction
    );

    return new UncertaintyValue(
      result.value,
      result.uncertainty,
      "N",
      "Calculated from propulsion system parameters",
      "Thrust force"
    );
  }

  /**
   * Calculate force components in orbital coordinate system
   */
  private static calculateForceComponents(
    gravitationalForce: UncertaintyValue,
    geometry: GravityTractorGeometry
  ): {
    radial: UncertaintyValue;
    tangential: UncertaintyValue;
    normal: UncertaintyValue;
  } {
    // For gravity tractor, force is primarily radial
    const radial = gravitationalForce;

    // Small tangential component due to orbital motion
    const tangential = new UncertaintyValue(
      gravitationalForce.value * 0.1, // ~10% tangential component
      gravitationalForce.uncertainty * 0.1,
      "N",
      "Tangential component from orbital motion",
      "Tangential force"
    );

    // Minimal normal component
    const normal = new UncertaintyValue(
      gravitationalForce.value * 0.01, // ~1% normal component
      gravitationalForce.uncertainty * 0.01,
      "N",
      "Normal component from geometry",
      "Normal force"
    );

    return { radial, tangential, normal };
  }

  /**
   * Calculate trajectory changes over mission duration
   */
  private static calculateTrajectoryChanges(
    forceResult: GravityTractorForceResult,
    target: GravityTractorTarget,
    mission: GravityTractorMission
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
    // Total velocity change: ΔV = a * t
    const variables: UncertaintyVariable[] = [
      {
        name: "acceleration",
        value: forceResult.accelerationOnAsteroid,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "time",
        value: mission.missionDuration,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "efficiency",
        value: mission.operatingEfficiency,
        distribution: DistributionType.NORMAL,
      },
    ];

    const deltaVFunction = (inputs: Record<string, number>) => {
      return inputs.acceleration * inputs.time * inputs.efficiency;
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
    const orbitalElements = this.calculateOrbitalElementChanges(deltaV, target);

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
    target: GravityTractorTarget
  ): {
    semiMajorAxis: UncertaintyValue;
    eccentricity: UncertaintyValue;
    inclination: UncertaintyValue;
    argumentOfPeriapsis: UncertaintyValue;
    longitudeOfAscendingNode: UncertaintyValue;
    meanAnomaly: UncertaintyValue;
  } {
    // Simplified orbital mechanics - in reality this would be much more complex

    // Semi-major axis change (dominant effect for gravity tractor)
    const semiMajorAxis = new UncertaintyValue(
      deltaV.value * 1e8, // Rough scaling: 1 m/s ΔV ≈ 100 km change in semi-major axis
      deltaV.uncertainty * 1e8,
      "m",
      "Estimated from velocity change",
      "Semi-major axis change"
    );

    // Other orbital elements have smaller changes
    const eccentricity = new UncertaintyValue(
      deltaV.value * 1e-6, // Very small eccentricity change
      deltaV.uncertainty * 1e-6,
      "1",
      "Estimated from velocity change",
      "Eccentricity change"
    );

    const inclination = new UncertaintyValue(
      deltaV.value * 1e-8, // Minimal inclination change
      deltaV.uncertainty * 1e-8,
      "rad",
      "Estimated from velocity change",
      "Inclination change"
    );

    const argumentOfPeriapsis = new UncertaintyValue(
      deltaV.value * 1e-7,
      deltaV.uncertainty * 1e-7,
      "rad",
      "Estimated from velocity change",
      "Argument of periapsis change"
    );

    const longitudeOfAscendingNode = new UncertaintyValue(
      deltaV.value * 1e-8,
      deltaV.uncertainty * 1e-8,
      "rad",
      "Estimated from velocity change",
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
   * Calculate mission requirements (fuel, power, etc.)
   */
  private static calculateMissionRequirements(
    spacecraft: GravityTractorProperties,
    target: GravityTractorTarget,
    geometry: GravityTractorGeometry,
    mission: GravityTractorMission,
    forceResult: GravityTractorForceResult
  ): {
    fuelConsumption: UncertaintyValue;
    powerRequirement: UncertaintyValue;
    efficiency: UncertaintyValue;
  } {
    // Fuel consumption based on thrust and specific impulse
    const variables: UncertaintyVariable[] = [
      {
        name: "thrust",
        value: forceResult.thrustForce,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "isp",
        value: spacecraft.specificImpulse,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "time",
        value: mission.missionDuration,
        distribution: DistributionType.NORMAL,
      },
    ];

    const fuelFunction = (inputs: Record<string, number>) => {
      if (spacecraft.propulsionType === "solar_sail") {
        return 0; // No fuel required for solar sail
      }
      const g = 9.80665; // Standard gravity
      // Use a more realistic fuel consumption: mass flow rate = thrust / (Isp * g)
      const massFlowRate = inputs.thrust / (inputs.isp * g);
      return massFlowRate * inputs.time * 0.1; // 10% duty cycle for station keeping
    };

    const fuelResult = UncertaintyPropagator.propagateNonlinear(
      variables,
      fuelFunction
    );

    const fuelConsumption = new UncertaintyValue(
      fuelResult.value,
      fuelResult.uncertainty,
      "kg",
      "Calculated from thrust and specific impulse",
      "Fuel consumption"
    );

    // Power requirement (constant for electric propulsion)
    const powerRequirement = spacecraft.thrustPower;

    // Mission efficiency (fuel utilization)
    const efficiency = new UncertaintyValue(
      Math.min(
        1.0,
        spacecraft.fuelMass.value /
          (fuelConsumption.value + spacecraft.dryMass.value)
      ),
      0.1, // 10% uncertainty in efficiency
      "1",
      "Fuel utilization efficiency",
      "Mission efficiency"
    );

    return {
      fuelConsumption,
      powerRequirement,
      efficiency,
    };
  }

  /**
   * Calculate station keeping requirements
   */
  private static calculateStationKeepingRequirements(
    spacecraft: GravityTractorProperties,
    target: GravityTractorTarget,
    geometry: GravityTractorGeometry,
    mission: GravityTractorMission
  ): {
    deltaVPerYear: UncertaintyValue;
    fuelPerYear: UncertaintyValue;
    thrustDutyCycle: UncertaintyValue;
  } {
    // Station keeping ΔV depends on asteroid gravity and orbital perturbations
    const variables: UncertaintyVariable[] = [
      {
        name: "surfaceGravity",
        value: target.surfaceGravity,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "distance",
        value: geometry.operatingDistance,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "radius",
        value: target.radius,
        distribution: DistributionType.NORMAL,
      },
    ];

    const stationKeepingFunction = (inputs: Record<string, number>) => {
      // Station keeping ΔV scales with surface gravity and distance
      const gravityAtDistance =
        inputs.surfaceGravity * Math.pow(inputs.radius / inputs.distance, 2);
      const perturbationFactor = 0.1; // 10% of local gravity for perturbations
      const secondsPerYear = 365.25 * 24 * 3600;
      return gravityAtDistance * perturbationFactor * secondsPerYear * 0.01; // 1% efficiency
    };

    const stationKeepingResult = UncertaintyPropagator.propagateNonlinear(
      variables,
      stationKeepingFunction
    );

    const deltaVPerYear = new UncertaintyValue(
      stationKeepingResult.value,
      stationKeepingResult.uncertainty,
      "m/s",
      "Station keeping velocity requirement per year",
      "Station keeping ΔV per year"
    );

    // Fuel per year for station keeping
    const fuelPerYear = new UncertaintyValue(
      (deltaVPerYear.value * spacecraft.mass.value) /
        (spacecraft.specificImpulse.value * 9.80665),
      (deltaVPerYear.uncertainty * spacecraft.mass.value) /
        (spacecraft.specificImpulse.value * 9.80665),
      "kg",
      "Fuel required for station keeping per year",
      "Fuel per year"
    );

    // Thrust duty cycle (fraction of time thrusting)
    const thrustDutyCycle = new UncertaintyValue(
      0.1, // 10% duty cycle typical for station keeping
      0.02, // ±2% uncertainty
      "1",
      "Fraction of time spent thrusting",
      "Thrust duty cycle"
    );

    return {
      deltaVPerYear,
      fuelPerYear,
      thrustDutyCycle,
    };
  }

  /**
   * Calculate mission feasibility metrics
   */
  private static calculateMissionFeasibility(
    spacecraft: GravityTractorProperties,
    target: GravityTractorTarget,
    mission: GravityTractorMission,
    deltaV: UncertaintyValue
  ): {
    minimumDuration: UncertaintyValue;
    maximumDeflection: UncertaintyValue;
    costEffectiveness: UncertaintyValue;
  } {
    // Minimum mission duration for meaningful deflection
    const minimumDuration = new UncertaintyValue(
      365.25 * 24 * 3600, // 1 year minimum
      30 * 24 * 3600, // ±1 month uncertainty
      "s",
      "Minimum time for effective deflection",
      "Minimum mission duration"
    );

    // Maximum deflection at Earth encounter (simplified)
    const variables: UncertaintyVariable[] = [
      {
        name: "deltaV",
        value: deltaV,
        distribution: DistributionType.NORMAL,
      },
      {
        name: "timeToEncounter",
        value: new UncertaintyValue(
          10 * 365.25 * 24 * 3600,
          2 * 365.25 * 24 * 3600,
          "s",
          "Time to Earth encounter"
        ),
        distribution: DistributionType.NORMAL,
      },
    ];

    const deflectionFunction = (inputs: Record<string, number>) => {
      // Simplified deflection: deflection ≈ ΔV * time_to_encounter
      // This is a very rough approximation for small velocity changes
      return inputs.deltaV * inputs.timeToEncounter * 0.001; // Scale factor for realistic deflection
    };

    const deflectionResult = UncertaintyPropagator.propagateNonlinear(
      variables,
      deflectionFunction
    );

    const maximumDeflection = new UncertaintyValue(
      deflectionResult.value,
      deflectionResult.uncertainty,
      "m",
      "Maximum deflection at Earth encounter",
      "Maximum deflection"
    );

    // Cost effectiveness (deflection per unit spacecraft mass)
    const costEffectiveness = new UncertaintyValue(
      maximumDeflection.value / spacecraft.mass.value,
      Math.sqrt(
        Math.pow(maximumDeflection.uncertainty / spacecraft.mass.value, 2) +
          Math.pow(
            (maximumDeflection.value * spacecraft.mass.uncertainty) /
              Math.pow(spacecraft.mass.value, 2),
            2
          )
      ),
      "m/kg",
      "Deflection per unit spacecraft mass",
      "Cost effectiveness"
    );

    return {
      minimumDuration,
      maximumDeflection,
      costEffectiveness,
    };
  }

  /**
   * Validate input parameters
   */
  private static validateInputParameters(
    spacecraft: GravityTractorProperties,
    target: GravityTractorTarget,
    geometry: GravityTractorGeometry,
    mission: GravityTractorMission
  ): { withinValidityRange: boolean; warnings: string[] } {
    const warnings: string[] = [];
    let withinValidityRange = true;

    // Check spacecraft mass ratio
    const massRatio = spacecraft.mass.value / target.mass.value;
    if (massRatio < 1e-7) {
      warnings.push(
        `Very small spacecraft-to-asteroid mass ratio (${massRatio.toExponential(
          2
        )}) may be ineffective`
      );
    }
    if (massRatio > 1e-6) {
      warnings.push(
        `Large spacecraft-to-asteroid mass ratio (${massRatio.toExponential(
          2
        )}) - consider other deflection methods`
      );
    }

    // Check operating distance
    if (geometry.operatingDistance.value < target.radius.value * 2) {
      warnings.push(
        `Operating distance (${geometry.operatingDistance.value.toFixed(
          0
        )}m) is very close to asteroid surface`
      );
    }
    if (geometry.operatingDistance.value > target.radius.value * 20) {
      warnings.push(
        `Large operating distance (${geometry.operatingDistance.value.toFixed(
          0
        )}m) reduces gravitational force significantly`
      );
    }

    // Check mission duration
    const yearsToSeconds = 365.25 * 24 * 3600;
    const missionYears = mission.missionDuration.value / yearsToSeconds;
    if (missionYears < 1) {
      warnings.push(
        `Short mission duration (${missionYears.toFixed(
          1
        )} years) may not provide sufficient deflection`
      );
    }
    if (missionYears > 20) {
      warnings.push(
        `Very long mission duration (${missionYears.toFixed(
          1
        )} years) may exceed spacecraft lifetime`
      );
      withinValidityRange = false;
    }

    // Check fuel availability
    if (spacecraft.fuelMass.value < spacecraft.dryMass.value * 0.1) {
      warnings.push(`Low fuel mass ratio may limit mission effectiveness`);
    }

    // Check propulsion system compatibility
    if (spacecraft.propulsionType === "chemical" && missionYears > 3) {
      warnings.push(
        `Chemical propulsion may not be suitable for missions longer than 3 years`
      );
    }

    return { withinValidityRange, warnings };
  }

  /**
   * Get spacecraft specifications for different propulsion types
   */
  static getSpacecraftSpecifications(
    propulsionType: string
  ): Partial<GravityTractorProperties> {
    const specs = SPACECRAFT_SPECIFICATIONS[propulsionType];
    if (!specs) {
      throw new Error(`Unknown propulsion type: ${propulsionType}`);
    }
    return specs;
  }

  /**
   * Create target properties from basic asteroid parameters
   */
  static createTargetFromBasicProperties(
    mass: number,
    radius: number,
    density?: number
  ): GravityTractorTarget {
    const actualDensity =
      density || mass / ((4 / 3) * Math.PI * Math.pow(radius, 3));
    const surfaceGravity =
      (PHYSICAL_CONSTANTS.GRAVITATIONAL_CONSTANT.value * mass) /
      Math.pow(radius, 2);
    const escapeVelocity = Math.sqrt(
      (2 * PHYSICAL_CONSTANTS.GRAVITATIONAL_CONSTANT.value * mass) / radius
    );

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
      density: new UncertaintyValue(
        actualDensity,
        actualDensity * 0.3,
        "kg/m³",
        "Calculated or specified"
      ),
      rotationPeriod: new UncertaintyValue(
        24 * 3600,
        12 * 3600,
        "s",
        "Estimated rotation period"
      ),
      obliquity: new UncertaintyValue(0.1, 0.05, "rad", "Estimated obliquity"),
      surfaceGravity: new UncertaintyValue(
        surfaceGravity,
        surfaceGravity * 0.2,
        "m/s²",
        "Calculated"
      ),
      escapeVelocity: new UncertaintyValue(
        escapeVelocity,
        escapeVelocity * 0.2,
        "m/s",
        "Calculated"
      ),
    };
  }
}

/**
 * Convenience functions for gravity tractor calculations
 */
export const GravityTractorUtils = {
  /**
   * Create a typical ion propulsion spacecraft
   */
  createIonSpacecraft: (mass: number): GravityTractorProperties => {
    const baseSpecs =
      GravityTractorCalculator.getSpacecraftSpecifications("ion");
    return {
      mass: new UncertaintyValue(
        mass,
        mass * 0.1,
        "kg",
        "Spacecraft specification"
      ),
      fuelMass: new UncertaintyValue(
        mass * 0.3,
        mass * 0.05,
        "kg",
        "30% fuel fraction"
      ),
      dryMass: new UncertaintyValue(
        mass * 0.7,
        mass * 0.05,
        "kg",
        "70% dry mass"
      ),
      ...baseSpecs,
    } as GravityTractorProperties;
  },

  /**
   * Create optimal mission geometry
   */
  createOptimalGeometry: (targetRadius: number): GravityTractorGeometry => ({
    operatingDistance: new UncertaintyValue(
      targetRadius * 3,
      targetRadius * 0.5,
      "m",
      "3 radii distance"
    ),
    stationKeepingAltitude: new UncertaintyValue(
      targetRadius * 2,
      targetRadius * 0.3,
      "m",
      "2 radii altitude"
    ),
    approachAngle: new UncertaintyValue(
      0,
      0.1,
      "rad",
      "Optimal approach angle"
    ),
    operatingPosition: "leading",
    coordinateSystem: "asteroid_fixed",
  }),

  /**
   * Create typical mission parameters
   */
  createTypicalMission: (durationYears: number): GravityTractorMission => ({
    missionDuration: new UncertaintyValue(
      durationYears * 365.25 * 24 * 3600,
      0.5 * 365.25 * 24 * 3600,
      "s",
      `${durationYears} year mission`
    ),
    operatingEfficiency: new UncertaintyValue(0.8, 0.1, "1", "80% efficiency"),
    stationKeepingDeltaV: new UncertaintyValue(
      100,
      20,
      "m/s",
      "Station keeping budget"
    ),
    communicationDelay: new UncertaintyValue(1200, 300, "s", "20 minute delay"),
    solarDistance: new UncertaintyValue(1.5, 0.5, "AU", "1.5 AU from Sun"),
    launchWindow: {
      earliest: new Date("2030-01-01"),
      latest: new Date("2035-12-31"),
      duration: new UncertaintyValue(
        2 * 365.25 * 24 * 3600,
        0.5 * 365.25 * 24 * 3600,
        "s",
        "2 year window"
      ),
    },
  }),
};
