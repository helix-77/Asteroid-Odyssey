import { describe, it, expect } from "vitest";

// Import all existing physics calculation modules
import {
  calculateKineticEnergy,
  calculateCrater,
  calculateBlastEffects,
  estimateCasualties,
  calculateEconomicImpact,
  calculateImpact,
  energyToTNT,
  ASTEROID_DENSITIES,
} from "../impact";

import {
  calculateOrbitalState,
  calculateOrbitPath,
  calculateClosestApproach,
  solveKeplersEquation,
  calculateTrueAnomaly,
} from "../orbital";

import {
  calculateDeflection,
  calculateTrajectoryChange,
  calculateImpactReduction,
  assessMissionSuccess,
  calculateCostEffectiveness,
  compareStrategies,
  calculateLaunchWindow,
} from "../deflection";

describe("Comprehensive Physics Calculations Test Suite", () => {
  describe("Impact Physics Module", () => {
    const testParams = {
      asteroidMass: 1e12, // kg
      velocity: 20000, // m/s
      angle: 45, // degrees
      density: 2700, // kg/m³
      diameter: 500, // meters
    };

    const testLocation = {
      populationDensity: 1000, // people per km²
      totalPopulation: 1000000, // 1 million people
      gdpPerCapita: 50000,
      infrastructureValue: 1e11,
    };

    it("should calculate kinetic energy correctly", () => {
      const energy = calculateKineticEnergy(
        testParams.asteroidMass,
        testParams.velocity
      );

      expect(energy).toBeGreaterThan(0);
      expect(energy).toBe(
        0.5 *
          testParams.asteroidMass *
          testParams.velocity *
          testParams.velocity
      );
    });

    it("should convert energy to TNT equivalent", () => {
      const energy = 4.184e9; // 1 kiloton in Joules (correct value)
      const tntEquivalent = energyToTNT(energy);

      expect(tntEquivalent).toBeCloseTo(1, 3); // Should be close to 1 kiloton
    });

    it("should calculate crater dimensions", () => {
      const energy = calculateKineticEnergy(
        testParams.asteroidMass,
        testParams.velocity
      );
      const crater = calculateCrater(energy, testParams.angle);

      expect(crater.diameter).toBeGreaterThan(0);
      expect(crater.depth).toBeGreaterThan(0);
      expect(crater.volume).toBeGreaterThan(0);
      expect(crater.depth).toBeLessThan(crater.diameter); // Depth should be less than diameter
    });

    it("should calculate blast effects", () => {
      const energy = calculateKineticEnergy(
        testParams.asteroidMass,
        testParams.velocity
      );
      const effects = calculateBlastEffects(energy);

      expect(effects.fireballRadius).toBeGreaterThan(0);
      expect(effects.airblastRadius).toBeGreaterThan(0);
      expect(effects.thermalRadiation).toBeGreaterThan(0);
      expect(effects.seismicMagnitude).toBeGreaterThanOrEqual(0);

      // Airblast radius should generally be larger than fireball radius
      expect(effects.airblastRadius).toBeGreaterThan(effects.fireballRadius);
    });

    it("should estimate casualties", () => {
      const energy = calculateKineticEnergy(
        testParams.asteroidMass,
        testParams.velocity
      );
      const effects = calculateBlastEffects(energy);
      const casualties = estimateCasualties(
        effects,
        testLocation.populationDensity,
        testLocation.totalPopulation
      );

      expect(casualties.immediate).toBeGreaterThanOrEqual(0);
      expect(casualties.injured).toBeGreaterThanOrEqual(0);
      expect(casualties.displaced).toBeGreaterThanOrEqual(0);

      // Total casualties should not exceed population
      expect(casualties.immediate + casualties.injured).toBeLessThanOrEqual(
        testLocation.totalPopulation
      );
    });

    it("should calculate economic impact", () => {
      const energy = calculateKineticEnergy(
        testParams.asteroidMass,
        testParams.velocity
      );
      const crater = calculateCrater(energy, testParams.angle);
      const effects = calculateBlastEffects(energy);
      const economicImpact = calculateEconomicImpact(crater, effects);

      expect(economicImpact).toBeGreaterThan(0);
      expect(isFinite(economicImpact)).toBe(true);
    });

    it("should perform complete impact calculation", () => {
      const result = calculateImpact(testParams, testLocation);

      expect(result.kineticEnergy).toBeGreaterThan(0);
      expect(result.tntEquivalent).toBeGreaterThan(0);
      expect(result.crater.diameter).toBeGreaterThan(0);
      expect(result.effects.fireballRadius).toBeGreaterThan(0);
      expect(result.casualties.immediate).toBeGreaterThanOrEqual(0);
      expect(result.economicImpact).toBeGreaterThan(0);
    });

    it("should have realistic asteroid densities", () => {
      expect(ASTEROID_DENSITIES.stony).toBeGreaterThan(1000);
      expect(ASTEROID_DENSITIES.metallic).toBeGreaterThan(
        ASTEROID_DENSITIES.stony
      );
      expect(ASTEROID_DENSITIES.carbonaceous).toBeLessThan(
        ASTEROID_DENSITIES.stony
      );
    });
  });

  describe("Orbital Mechanics Module", () => {
    const testElements = {
      semi_major_axis: 1.5, // AU
      eccentricity: 0.2,
      inclination: 5.0, // degrees
      ascending_node: 45.0, // degrees
      perihelion: 90.0, // degrees
      mean_anomaly: 180.0, // degrees
    };

    it("should solve Kepler's equation", () => {
      const meanAnomaly = Math.PI; // 180 degrees in radians
      const eccentricity = 0.2;

      const eccentricAnomaly = solveKeplersEquation(meanAnomaly, eccentricity);

      expect(eccentricAnomaly).toBeGreaterThan(0);
      expect(eccentricAnomaly).toBeLessThan(2 * Math.PI);
      expect(isFinite(eccentricAnomaly)).toBe(true);

      // Verify Kepler's equation: M = E - e*sin(E)
      const calculatedMeanAnomaly =
        eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly);
      expect(Math.abs(calculatedMeanAnomaly - meanAnomaly)).toBeLessThan(1e-6);
    });

    it("should calculate true anomaly from eccentric anomaly", () => {
      const eccentricAnomaly = Math.PI / 2;
      const eccentricity = 0.2;

      const trueAnomaly = calculateTrueAnomaly(eccentricAnomaly, eccentricity);

      expect(isFinite(trueAnomaly)).toBe(true);
      expect(trueAnomaly).toBeGreaterThan(-Math.PI);
      expect(trueAnomaly).toBeLessThan(Math.PI);
    });

    it("should calculate orbital state", () => {
      const timeJD = 2460000.5; // Julian Date
      const state = calculateOrbitalState(testElements, timeJD);

      expect(state.position.x).toBeDefined();
      expect(state.position.y).toBeDefined();
      expect(state.position.z).toBeDefined();
      expect(state.velocity.vx).toBeDefined();
      expect(state.velocity.vy).toBeDefined();
      expect(state.velocity.vz).toBeDefined();
      expect(state.distance).toBeGreaterThan(0);
      expect(state.true_anomaly).toBeGreaterThanOrEqual(-180);
      expect(state.true_anomaly).toBeLessThanOrEqual(180);

      // Position should be finite
      expect(isFinite(state.position.x)).toBe(true);
      expect(isFinite(state.position.y)).toBe(true);
      expect(isFinite(state.position.z)).toBe(true);
    });

    it("should calculate orbit path", () => {
      const path = calculateOrbitPath(testElements, 365, 50);

      expect(path).toHaveLength(51); // 50 steps + 1 for start

      path.forEach((position) => {
        expect(isFinite(position.x)).toBe(true);
        expect(isFinite(position.y)).toBe(true);
        expect(isFinite(position.z)).toBe(true);
      });
    });

    it("should calculate closest approach", () => {
      const approach = calculateClosestApproach(testElements, 1000);

      expect(approach.distance).toBeGreaterThan(0);
      expect(approach.date).toBeGreaterThan(0);
      expect(approach.velocity).toBeGreaterThan(0);
      expect(isFinite(approach.distance)).toBe(true);
      expect(isFinite(approach.date)).toBe(true);
      expect(isFinite(approach.velocity)).toBe(true);
    });

    it("should handle circular orbits", () => {
      const circularElements = { ...testElements, eccentricity: 0 };
      const state = calculateOrbitalState(circularElements, 2460000.5);

      expect(isFinite(state.position.x)).toBe(true);
      expect(isFinite(state.position.y)).toBe(true);
      expect(isFinite(state.position.z)).toBe(true);
    });

    it("should handle highly elliptical orbits", () => {
      const ellipticalElements = { ...testElements, eccentricity: 0.9 };
      const state = calculateOrbitalState(ellipticalElements, 2460000.5);

      expect(isFinite(state.position.x)).toBe(true);
      expect(isFinite(state.position.y)).toBe(true);
      expect(isFinite(state.position.z)).toBe(true);
    });
  });

  describe("Deflection Strategy Module", () => {
    const testStrategy = {
      id: "kinetic_impactor",
      name: "Kinetic Impactor",
      deltaV: 0.001, // m/s
      leadTime: 5, // years
      cost: 1e9, // USD
      successRate: 0.8,
      massRequired: 500, // kg
    };

    const testAsteroid = {
      mass: 1e12, // kg
      velocity: 20000, // m/s
      size: 500, // meters
      distanceToEarth: 1.5, // AU
      impactProbability: 0.01, // 1%
    };

    it("should calculate trajectory change", () => {
      const trajectoryChange = calculateTrajectoryChange(
        testStrategy.deltaV,
        testAsteroid.velocity,
        testAsteroid.distanceToEarth,
        10 // years to impact
      );

      expect(trajectoryChange).toBeGreaterThan(0);
      expect(isFinite(trajectoryChange)).toBe(true);
    });

    it("should calculate impact probability reduction", () => {
      const trajectoryChange = 0.1; // degrees
      const reduction = calculateImpactReduction(
        trajectoryChange,
        testAsteroid.impactProbability
      );

      expect(reduction).toBeGreaterThanOrEqual(0);
      expect(reduction).toBeLessThanOrEqual(testAsteroid.impactProbability);
      expect(isFinite(reduction)).toBe(true);
    });

    it("should assess mission success", () => {
      const assessment = assessMissionSuccess(
        testStrategy,
        10, // lead time available
        testAsteroid.size,
        testAsteroid.mass
      );

      expect(typeof assessment.success).toBe("boolean");
      expect(Array.isArray(assessment.factors)).toBe(true);
    });

    it("should calculate cost effectiveness", () => {
      const costEffectiveness = calculateCostEffectiveness(
        0.5, // 50% impact reduction
        testStrategy.cost,
        1e12 // economic impact prevented
      );

      expect(costEffectiveness).toBeGreaterThan(0);
      expect(isFinite(costEffectiveness)).toBe(true);
    });

    it("should perform complete deflection calculation", () => {
      const result = calculateDeflection(testStrategy, testAsteroid, 10);

      expect(result.trajectoryChange).toBeGreaterThan(0);
      expect(result.impactProbabilityReduction).toBeGreaterThanOrEqual(0);
      expect(typeof result.missionSuccess).toBe("boolean");
      expect(result.costEffectiveness).toBeGreaterThan(0);
      expect(result.timeToImplement).toBe(testStrategy.leadTime);
      expect(Array.isArray(result.riskFactors)).toBe(true);
    });

    it("should compare multiple strategies", () => {
      const strategies = [
        testStrategy,
        {
          id: "nuclear",
          name: "Nuclear Deflection",
          deltaV: 0.1,
          leadTime: 3,
          cost: 5e9,
          successRate: 0.6,
          massRequired: 1000,
        },
      ];

      const comparison = compareStrategies(strategies, testAsteroid, 10);

      expect(comparison).toHaveLength(2);
      expect(comparison[0].strategy).toBeDefined();
      expect(comparison[0].trajectoryChange).toBeGreaterThan(0);

      // Should be sorted by cost effectiveness
      expect(comparison[0].costEffectiveness).toBeGreaterThanOrEqual(
        comparison[1].costEffectiveness
      );
    });

    it("should calculate launch windows", () => {
      const window = calculateLaunchWindow(testStrategy, 10);

      expect(window.earliestLaunch).toBeInstanceOf(Date);
      expect(window.latestLaunch).toBeInstanceOf(Date);
      expect(window.optimal).toBeInstanceOf(Date);

      // Earliest should be before latest
      expect(window.earliestLaunch.getTime()).toBeLessThan(
        window.latestLaunch.getTime()
      );
    });
  });

  describe("Integration Tests", () => {
    it("should handle complete impact scenario", () => {
      const asteroidParams = {
        asteroidMass: 1e12,
        velocity: 25000,
        angle: 60,
        density: 2700,
        diameter: 500,
      };

      const location = {
        populationDensity: 500,
        totalPopulation: 500000,
      };

      const impactResult = calculateImpact(asteroidParams, location);

      expect(impactResult.kineticEnergy).toBeGreaterThan(0);
      expect(impactResult.crater.diameter).toBeGreaterThan(0);
      expect(impactResult.casualties.immediate).toBeGreaterThanOrEqual(0);
      expect(impactResult.economicImpact).toBeGreaterThan(0);
    });

    it("should handle complete deflection scenario", () => {
      const orbitalElements = {
        semi_major_axis: 1.2,
        eccentricity: 0.3,
        inclination: 10.0,
        ascending_node: 120.0,
        perihelion: 45.0,
        mean_anomaly: 90.0,
      };

      const strategy = {
        id: "gravity_tractor",
        name: "Gravity Tractor",
        deltaV: 0.0001,
        leadTime: 15,
        cost: 2e9,
        successRate: 0.9,
        massRequired: 1000,
      };

      const asteroid = {
        mass: 5e11,
        velocity: 18000,
        size: 300,
        distanceToEarth: 0.8,
        impactProbability: 0.05,
      };

      // Calculate orbital state
      const orbitalState = calculateOrbitalState(orbitalElements, 2460000.5);
      expect(orbitalState.distance).toBeGreaterThan(0);

      // Calculate deflection
      const deflectionResult = calculateDeflection(strategy, asteroid, 20);
      expect(deflectionResult.trajectoryChange).toBeGreaterThan(0);
      expect(
        deflectionResult.impactProbabilityReduction
      ).toBeGreaterThanOrEqual(0);
    });

    it("should maintain consistency across calculations", () => {
      const mass = 1e12;
      const velocity = 20000;

      // Calculate energy multiple times
      const energy1 = calculateKineticEnergy(mass, velocity);
      const energy2 = calculateKineticEnergy(mass, velocity);

      expect(energy1).toBe(energy2);

      // Calculate orbital state multiple times
      const elements = {
        semi_major_axis: 1.5,
        eccentricity: 0.2,
        inclination: 5.0,
        ascending_node: 45.0,
        perihelion: 90.0,
        mean_anomaly: 180.0,
      };

      const state1 = calculateOrbitalState(elements, 2460000.5);
      const state2 = calculateOrbitalState(elements, 2460000.5);

      expect(state1.position.x).toBe(state2.position.x);
      expect(state1.position.y).toBe(state2.position.y);
      expect(state1.position.z).toBe(state2.position.z);
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle zero values gracefully", () => {
      expect(() => calculateKineticEnergy(0, 20000)).not.toThrow();
      expect(() => calculateKineticEnergy(1000, 0)).not.toThrow();

      const zeroMassEnergy = calculateKineticEnergy(0, 20000);
      const zeroVelocityEnergy = calculateKineticEnergy(1000, 0);

      expect(zeroMassEnergy).toBe(0);
      expect(zeroVelocityEnergy).toBe(0);
    });

    it("should handle extreme values", () => {
      expect(() => calculateKineticEnergy(1e20, 100000)).not.toThrow();
      expect(() => calculateKineticEnergy(1e-10, 1e-3)).not.toThrow();

      const largeEnergy = calculateKineticEnergy(1e20, 100000);
      const smallEnergy = calculateKineticEnergy(1e-10, 1e-3);

      expect(isFinite(largeEnergy)).toBe(true);
      expect(isFinite(smallEnergy)).toBe(true);
    });

    it("should handle invalid orbital elements gracefully", () => {
      const invalidElements = {
        semi_major_axis: -1, // Invalid negative value
        eccentricity: 1.5, // Invalid eccentricity > 1
        inclination: 200, // Invalid inclination > 180
        ascending_node: 400, // Invalid angle > 360
        perihelion: -50, // Invalid negative angle
        mean_anomaly: 500, // Invalid angle > 360
      };

      expect(() =>
        calculateOrbitalState(invalidElements, 2460000.5)
      ).not.toThrow();
    });

    it("should handle NaN and Infinity inputs", () => {
      expect(() => calculateKineticEnergy(NaN, 20000)).not.toThrow();
      expect(() => calculateKineticEnergy(1000, Infinity)).not.toThrow();

      const nanResult = calculateKineticEnergy(NaN, 20000);
      const infinityResult = calculateKineticEnergy(1000, Infinity);

      expect(isNaN(nanResult)).toBe(true);
      expect(infinityResult).toBe(Infinity);
    });
  });
});
