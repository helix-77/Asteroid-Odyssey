import { describe, it, expect } from "vitest";

// Import physics calculation modules
import {
  calculateKineticEnergy,
  calculateCraterDimensions,
  calculateBlastEffects,
} from "../impact";
import {
  calculateOrbitalPosition,
  propagateOrbit,
  calculateCloseApproach,
} from "../orbital";
import {
  calculateKineticImpactorEffectiveness,
  calculateNuclearDeflection,
  calculateGravityTractorEffect,
} from "../deflection";

// Import enhanced modules
import { CraterCalculator } from "../impact/crater";
import { BlastCalculator } from "../impact/blast";
import { SeismicCalculator } from "../impact/seismic";
import { KeplerSolver } from "../orbital/kepler";
import { EphemerisCalculator } from "../orbital/ephemeris";
import { KineticImpactorCalculator } from "../deflection/kinetic";
import { NuclearDeflectionCalculator } from "../deflection/nuclear";
import { UncertaintyPropagator } from "../../physics/uncertainty";

describe("Edge Case Testing for Extreme Parameter Values", () => {
  describe("Impact Physics Edge Cases", () => {
    it("should handle zero mass gracefully", () => {
      expect(() => calculateKineticEnergy(0, 20000)).not.toThrow();

      const result = calculateKineticEnergy(0, 20000);
      expect(result).toBe(0);
    });

    it("should handle zero velocity gracefully", () => {
      expect(() => calculateKineticEnergy(1e12, 0)).not.toThrow();

      const result = calculateKineticEnergy(1e12, 0);
      expect(result).toBe(0);
    });

    it("should handle extremely small asteroids", () => {
      const calculator = new CraterCalculator();

      const microMeteoriteParams = {
        impactorMass: { value: 1e-9, uncertainty: 1e-10, unit: "kg" }, // 1 nanogram
        impactorVelocity: { value: 11000, uncertainty: 1000, unit: "m/s" },
        impactorDensity: { value: 3000, uncertainty: 300, unit: "kg/m³" },
        impactAngle: { value: 45, uncertainty: 5, unit: "degrees" },
        targetMaterial: "rock" as const,
      };

      expect(() =>
        calculator.calculateCraterDimensions(microMeteoriteParams)
      ).not.toThrow();

      const result = calculator.calculateCraterDimensions(microMeteoriteParams);
      expect(result.diameter.value).toBeGreaterThan(0);
      expect(isFinite(result.diameter.value)).toBe(true);
    });

    it("should handle extremely large asteroids", () => {
      const calculator = new CraterCalculator();

      const chicxulubParams = {
        impactorMass: { value: 1e18, uncertainty: 5e17, unit: "kg" }, // ~10 km diameter
        impactorVelocity: { value: 30000, uncertainty: 5000, unit: "m/s" },
        impactorDensity: { value: 2000, uncertainty: 500, unit: "kg/m³" },
        impactAngle: { value: 60, uncertainty: 15, unit: "degrees" },
        targetMaterial: "rock" as const,
      };

      expect(() =>
        calculator.calculateCraterDimensions(chicxulubParams)
      ).not.toThrow();

      const result = calculator.calculateCraterDimensions(chicxulubParams);
      expect(result.diameter.value).toBeGreaterThan(100000); // > 100 km
      expect(isFinite(result.diameter.value)).toBe(true);
    });

    it("should handle grazing impacts (very shallow angles)", () => {
      const calculator = new CraterCalculator();

      const grazingParams = {
        impactorMass: { value: 1e12, uncertainty: 1e11, unit: "kg" },
        impactorVelocity: { value: 20000, uncertainty: 2000, unit: "m/s" },
        impactorDensity: { value: 2700, uncertainty: 270, unit: "kg/m³" },
        impactAngle: { value: 5, uncertainty: 2, unit: "degrees" }, // Very shallow
        targetMaterial: "rock" as const,
      };

      expect(() =>
        calculator.calculateCraterDimensions(grazingParams)
      ).not.toThrow();

      const result = calculator.calculateCraterDimensions(grazingParams);
      expect(result.diameter.value).toBeGreaterThan(0);
      expect(isFinite(result.diameter.value)).toBe(true);
    });

    it("should handle vertical impacts", () => {
      const calculator = new CraterCalculator();

      const verticalParams = {
        impactorMass: { value: 1e12, uncertainty: 1e11, unit: "kg" },
        impactorVelocity: { value: 20000, uncertainty: 2000, unit: "m/s" },
        impactorDensity: { value: 2700, uncertainty: 270, unit: "kg/m³" },
        impactAngle: { value: 90, uncertainty: 0, unit: "degrees" }, // Perfectly vertical
        targetMaterial: "rock" as const,
      };

      expect(() =>
        calculator.calculateCraterDimensions(verticalParams)
      ).not.toThrow();

      const result = calculator.calculateCraterDimensions(verticalParams);
      expect(result.diameter.value).toBeGreaterThan(0);
      expect(isFinite(result.diameter.value)).toBe(true);
    });

    it("should handle extremely high velocities", () => {
      const hyperVelocityParams = {
        impactorMass: { value: 1e12, uncertainty: 1e11, unit: "kg" },
        impactorVelocity: { value: 100000, uncertainty: 10000, unit: "m/s" }, // 100 km/s
        impactorDensity: { value: 2700, uncertainty: 270, unit: "kg/m³" },
        impactAngle: { value: 45, uncertainty: 5, unit: "degrees" },
        targetMaterial: "rock" as const,
      };

      const calculator = new CraterCalculator();
      expect(() =>
        calculator.calculateCraterDimensions(hyperVelocityParams)
      ).not.toThrow();

      const result = calculator.calculateCraterDimensions(hyperVelocityParams);
      expect(result.diameter.value).toBeGreaterThan(0);
      expect(isFinite(result.diameter.value)).toBe(true);
    });

    it("should handle blast calculations at extreme altitudes", () => {
      const calculator = new BlastCalculator();

      // Very high altitude (near space)
      const highAltitudeParams = {
        energy: { value: 1e15, uncertainty: 1e14, unit: "J" },
        altitude: { value: 100000, uncertainty: 5000, unit: "m" }, // 100 km
        atmosphericDensity: { value: 1e-6, uncertainty: 1e-7, unit: "kg/m³" }, // Very thin atmosphere
      };

      expect(() =>
        calculator.calculateBlastEffects(highAltitudeParams)
      ).not.toThrow();

      const result = calculator.calculateBlastEffects(highAltitudeParams);
      expect(result.fireballRadius.value).toBeGreaterThan(0);
      expect(isFinite(result.fireballRadius.value)).toBe(true);
    });

    it("should handle ground-level impacts", () => {
      const calculator = new BlastCalculator();

      const groundLevelParams = {
        energy: { value: 1e15, uncertainty: 1e14, unit: "J" },
        altitude: { value: 0, uncertainty: 0, unit: "m" }, // Ground level
        atmosphericDensity: { value: 1.225, uncertainty: 0.1, unit: "kg/m³" },
      };

      expect(() =>
        calculator.calculateBlastEffects(groundLevelParams)
      ).not.toThrow();

      const result = calculator.calculateBlastEffects(groundLevelParams);
      expect(result.fireballRadius.value).toBeGreaterThan(0);
      expect(isFinite(result.fireballRadius.value)).toBe(true);
    });
  });

  describe("Orbital Mechanics Edge Cases", () => {
    it("should handle circular orbits (eccentricity = 0)", () => {
      const solver = new KeplerSolver();

      expect(() => solver.solveKeplerEquation(Math.PI / 2, 0)).not.toThrow();

      const result = solver.solveKeplerEquation(Math.PI / 2, 0);
      expect(Math.abs(result - Math.PI / 2)).toBeLessThan(1e-10);
    });

    it("should handle highly elliptical orbits (eccentricity near 1)", () => {
      const solver = new KeplerSolver();

      expect(() => solver.solveKeplerEquation(Math.PI / 4, 0.99)).not.toThrow();

      const result = solver.solveKeplerEquation(Math.PI / 4, 0.99);
      expect(isFinite(result)).toBe(true);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(2 * Math.PI);
    });

    it("should handle parabolic orbits (eccentricity = 1)", () => {
      const solver = new KeplerSolver();

      // For parabolic orbits, we use Barker's equation instead of Kepler's
      expect(() => solver.solveKeplerEquation(Math.PI / 4, 1.0)).not.toThrow();

      const result = solver.solveKeplerEquation(Math.PI / 4, 1.0);
      expect(isFinite(result)).toBe(true);
    });

    it("should handle hyperbolic orbits (eccentricity > 1)", () => {
      const solver = new KeplerSolver();

      // For hyperbolic orbits, we use the hyperbolic Kepler equation
      expect(() => solver.solveKeplerEquation(1.0, 1.5)).not.toThrow();

      const result = solver.solveKeplerEquation(1.0, 1.5);
      expect(isFinite(result)).toBe(true);
    });

    it("should handle retrograde orbits (inclination > 90°)", () => {
      const calculator = new EphemerisCalculator();

      const retrogradeElements = {
        semiMajorAxis: 1.5,
        eccentricity: 0.2,
        inclination: 150.0, // Retrograde
        longitudeOfAscendingNode: 45.0,
        argumentOfPeriapsis: 90.0,
        meanAnomaly: 180.0,
        epoch: 2460000.5,
      };

      expect(() =>
        calculator.calculatePosition(
          retrogradeElements,
          retrogradeElements.epoch
        )
      ).not.toThrow();

      const position = calculator.calculatePosition(
        retrogradeElements,
        retrogradeElements.epoch
      );
      expect(isFinite(position.x)).toBe(true);
      expect(isFinite(position.y)).toBe(true);
      expect(isFinite(position.z)).toBe(true);
    });

    it("should handle polar orbits (inclination = 90°)", () => {
      const calculator = new EphemerisCalculator();

      const polarElements = {
        semiMajorAxis: 1.0,
        eccentricity: 0.1,
        inclination: 90.0, // Polar
        longitudeOfAscendingNode: 0.0,
        argumentOfPeriapsis: 0.0,
        meanAnomaly: 0.0,
        epoch: 2460000.5,
      };

      expect(() =>
        calculator.calculatePosition(polarElements, polarElements.epoch)
      ).not.toThrow();

      const position = calculator.calculatePosition(
        polarElements,
        polarElements.epoch
      );
      expect(isFinite(position.x)).toBe(true);
      expect(isFinite(position.y)).toBe(true);
      expect(isFinite(position.z)).toBe(true);
    });

    it("should handle very long time propagations", () => {
      const elements = {
        semiMajorAxis: 1.5,
        eccentricity: 0.2,
        inclination: 5.0,
        longitudeOfAscendingNode: 45.0,
        argumentOfPeriapsis: 90.0,
        meanAnomaly: 180.0,
        epoch: 2460000.5,
      };

      // Propagate 1000 years into the future
      const futureTime = elements.epoch + 365250; // 1000 years

      expect(() =>
        calculateOrbitalPosition(elements, futureTime)
      ).not.toThrow();

      const position = calculateOrbitalPosition(elements, futureTime);
      expect(isFinite(position.x)).toBe(true);
      expect(isFinite(position.y)).toBe(true);
      expect(isFinite(position.z)).toBe(true);
    });

    it("should handle very short time intervals", () => {
      const elements = {
        semiMajorAxis: 1.5,
        eccentricity: 0.2,
        inclination: 5.0,
        longitudeOfAscendingNode: 45.0,
        argumentOfPeriapsis: 90.0,
        meanAnomaly: 180.0,
        epoch: 2460000.5,
      };

      // Very small time step (1 second)
      const nearFutureTime = elements.epoch + 1.0 / 86400; // 1 second

      expect(() =>
        calculateOrbitalPosition(elements, nearFutureTime)
      ).not.toThrow();

      const position = calculateOrbitalPosition(elements, nearFutureTime);
      expect(isFinite(position.x)).toBe(true);
      expect(isFinite(position.y)).toBe(true);
      expect(isFinite(position.z)).toBe(true);
    });
  });

  describe("Deflection Strategy Edge Cases", () => {
    it("should handle very small spacecraft masses", () => {
      const calculator = new KineticImpactorCalculator();

      const smallSpacecraftParams = {
        spacecraftMass: { value: 1, uncertainty: 0.1, unit: "kg" }, // 1 kg CubeSat
        impactVelocity: { value: 10000, uncertainty: 1000, unit: "m/s" },
        targetMass: { value: 1e12, uncertainty: 1e11, unit: "kg" },
        targetComposition: "rocky" as const,
        impactAngle: { value: 0, uncertainty: 5, unit: "degrees" },
      };

      expect(() =>
        calculator.calculateMomentumTransfer(smallSpacecraftParams)
      ).not.toThrow();

      const result = calculator.calculateMomentumTransfer(
        smallSpacecraftParams
      );
      expect(result.deltaV.value).toBeGreaterThan(0);
      expect(isFinite(result.deltaV.value)).toBe(true);
    });

    it("should handle very large spacecraft masses", () => {
      const calculator = new KineticImpactorCalculator();

      const largeSpacecraftParams = {
        spacecraftMass: { value: 100000, uncertainty: 10000, unit: "kg" }, // 100 ton spacecraft
        impactVelocity: { value: 5000, uncertainty: 500, unit: "m/s" },
        targetMass: { value: 1e12, uncertainty: 1e11, unit: "kg" },
        targetComposition: "rocky" as const,
        impactAngle: { value: 0, uncertainty: 5, unit: "degrees" },
      };

      expect(() =>
        calculator.calculateMomentumTransfer(largeSpacecraftParams)
      ).not.toThrow();

      const result = calculator.calculateMomentumTransfer(
        largeSpacecraftParams
      );
      expect(result.deltaV.value).toBeGreaterThan(0);
      expect(isFinite(result.deltaV.value)).toBe(true);
    });

    it("should handle extremely low impact velocities", () => {
      const calculator = new KineticImpactorCalculator();

      const lowVelocityParams = {
        spacecraftMass: { value: 500, uncertainty: 50, unit: "kg" },
        impactVelocity: { value: 100, uncertainty: 10, unit: "m/s" }, // Very slow impact
        targetMass: { value: 1e12, uncertainty: 1e11, unit: "kg" },
        targetComposition: "rocky" as const,
        impactAngle: { value: 0, uncertainty: 5, unit: "degrees" },
      };

      expect(() =>
        calculator.calculateMomentumTransfer(lowVelocityParams)
      ).not.toThrow();

      const result = calculator.calculateMomentumTransfer(lowVelocityParams);
      expect(result.deltaV.value).toBeGreaterThan(0);
      expect(isFinite(result.deltaV.value)).toBe(true);
    });

    it("should handle extremely high impact velocities", () => {
      const calculator = new KineticImpactorCalculator();

      const highVelocityParams = {
        spacecraftMass: { value: 500, uncertainty: 50, unit: "kg" },
        impactVelocity: { value: 50000, uncertainty: 5000, unit: "m/s" }, // Very fast impact
        targetMass: { value: 1e12, uncertainty: 1e11, unit: "kg" },
        targetComposition: "rocky" as const,
        impactAngle: { value: 0, uncertainty: 5, unit: "degrees" },
      };

      expect(() =>
        calculator.calculateMomentumTransfer(highVelocityParams)
      ).not.toThrow();

      const result = calculator.calculateMomentumTransfer(highVelocityParams);
      expect(result.deltaV.value).toBeGreaterThan(0);
      expect(isFinite(result.deltaV.value)).toBe(true);
    });

    it("should handle very small nuclear yields", () => {
      const calculator = new NuclearDeflectionCalculator();

      const smallYieldParams = {
        asteroidMass: { value: 1e12, uncertainty: 1e11, unit: "kg" },
        asteroidRadius: { value: 500, uncertainty: 50, unit: "m" },
        nuclearYield: { value: 1, uncertainty: 0.1, unit: "kt" }, // 1 kt (small tactical nuke)
        standoffDistance: { value: 50, uncertainty: 10, unit: "m" },
        warningTime: { value: 365.25 * 5, uncertainty: 30, unit: "days" },
      };

      expect(() =>
        calculator.calculateMomentumTransfer(smallYieldParams)
      ).not.toThrow();

      const result = calculator.calculateMomentumTransfer(smallYieldParams);
      expect(result.deltaV.value).toBeGreaterThan(0);
      expect(isFinite(result.deltaV.value)).toBe(true);
    });

    it("should handle very large nuclear yields", () => {
      const calculator = new NuclearDeflectionCalculator();

      const largeYieldParams = {
        asteroidMass: { value: 1e15, uncertainty: 1e14, unit: "kg" },
        asteroidRadius: { value: 2000, uncertainty: 200, unit: "m" },
        nuclearYield: { value: 100000, uncertainty: 10000, unit: "kt" }, // 100 Mt (Tsar Bomba scale)
        standoffDistance: { value: 1000, uncertainty: 100, unit: "m" },
        warningTime: { value: 365.25 * 20, uncertainty: 365, unit: "days" },
      };

      expect(() =>
        calculator.calculateMomentumTransfer(largeYieldParams)
      ).not.toThrow();

      const result = calculator.calculateMomentumTransfer(largeYieldParams);
      expect(result.deltaV.value).toBeGreaterThan(0);
      expect(isFinite(result.deltaV.value)).toBe(true);
    });

    it("should handle very short warning times", () => {
      const shortWarningParams = {
        asteroidMass: 1e12,
        asteroidRadius: 500,
        nuclearYield: 1000, // 1 Mt
        standoffDistance: 100,
        warningTime: 30, // 30 days
      };

      expect(() =>
        calculateNuclearDeflection(shortWarningParams)
      ).not.toThrow();

      const result = calculateNuclearDeflection(shortWarningParams);
      expect(result.deltaV).toBeGreaterThan(0);
      expect(isFinite(result.deltaV)).toBe(true);
    });

    it("should handle very long warning times", () => {
      const longWarningParams = {
        asteroidMass: 1e12,
        asteroidRadius: 500,
        nuclearYield: 1000, // 1 Mt
        standoffDistance: 100,
        warningTime: 365.25 * 100, // 100 years
      };

      expect(() => calculateNuclearDeflection(longWarningParams)).not.toThrow();

      const result = calculateNuclearDeflection(longWarningParams);
      expect(result.deltaV).toBeGreaterThan(0);
      expect(isFinite(result.deltaV)).toBe(true);
    });
  });

  describe("Uncertainty Propagation Edge Cases", () => {
    it("should handle zero uncertainties", () => {
      const propagator = new UncertaintyPropagator();

      const perfectValue = {
        value: 1000,
        uncertainty: 0,
        unit: "m",
      };

      expect(() =>
        propagator.propagateLinearUncertainty([
          { ...perfectValue, coefficient: 2 },
        ])
      ).not.toThrow();

      const result = propagator.propagateLinearUncertainty([
        { ...perfectValue, coefficient: 2 },
      ]);

      expect(result.uncertainty).toBe(0);
      expect(result.value).toBe(2000);
    });

    it("should handle very large uncertainties", () => {
      const propagator = new UncertaintyPropagator();

      const uncertainValue = {
        value: 1000,
        uncertainty: 10000, // 1000% uncertainty
        unit: "m",
      };

      expect(() =>
        propagator.propagateLinearUncertainty([
          { ...uncertainValue, coefficient: 1 },
        ])
      ).not.toThrow();

      const result = propagator.propagateLinearUncertainty([
        { ...uncertainValue, coefficient: 1 },
      ]);

      expect(result.uncertainty).toBe(10000);
      expect(isFinite(result.uncertainty)).toBe(true);
    });

    it("should handle negative values with uncertainties", () => {
      const propagator = new UncertaintyPropagator();

      const negativeValue = {
        value: -1000,
        uncertainty: 100,
        unit: "m/s",
      };

      expect(() =>
        propagator.propagateLinearUncertainty([
          { ...negativeValue, coefficient: 1 },
        ])
      ).not.toThrow();

      const result = propagator.propagateLinearUncertainty([
        { ...negativeValue, coefficient: 1 },
      ]);

      expect(result.value).toBe(-1000);
      expect(result.uncertainty).toBe(100);
    });
  });

  describe("Invalid Input Handling", () => {
    it("should handle NaN inputs gracefully", () => {
      expect(() => calculateKineticEnergy(NaN, 20000)).not.toThrow();
      expect(() => calculateKineticEnergy(1e12, NaN)).not.toThrow();

      const result1 = calculateKineticEnergy(NaN, 20000);
      const result2 = calculateKineticEnergy(1e12, NaN);

      expect(isNaN(result1)).toBe(true);
      expect(isNaN(result2)).toBe(true);
    });

    it("should handle Infinity inputs gracefully", () => {
      expect(() => calculateKineticEnergy(Infinity, 20000)).not.toThrow();
      expect(() => calculateKineticEnergy(1e12, Infinity)).not.toThrow();

      const result1 = calculateKineticEnergy(Infinity, 20000);
      const result2 = calculateKineticEnergy(1e12, Infinity);

      expect(result1).toBe(Infinity);
      expect(result2).toBe(Infinity);
    });

    it("should handle negative masses gracefully", () => {
      expect(() => calculateKineticEnergy(-1e12, 20000)).not.toThrow();

      const result = calculateKineticEnergy(-1e12, 20000);
      // Kinetic energy should still be positive (mass squared in some formulations)
      expect(Math.abs(result)).toBeGreaterThan(0);
    });

    it("should handle negative velocities gracefully", () => {
      expect(() => calculateKineticEnergy(1e12, -20000)).not.toThrow();

      const result = calculateKineticEnergy(1e12, -20000);
      // Kinetic energy should be positive (velocity squared)
      expect(result).toBeGreaterThan(0);
    });
  });
});
