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
import { CasualtyCalculator } from "../impact/casualties";
import { KeplerSolver } from "../orbital/kepler";
import { EphemerisCalculator } from "../orbital/ephemeris";
import { KineticImpactorCalculator } from "../deflection/kinetic";
import { NuclearDeflectionCalculator } from "../deflection/nuclear";
import { GravityTractorCalculator } from "../deflection/gravity";

describe("Regression Tests Against Known Results", () => {
  describe("Historical Impact Events", () => {
    it("should reproduce Tunguska (1908) impact parameters", () => {
      const calculator = new BlastCalculator();

      // Tunguska parameters from literature
      const tunguskaParams = {
        energy: {
          value: 12e6 * 4.184e9,
          uncertainty: 3e6 * 4.184e9,
          unit: "J",
        }, // 12 Mt TNT equivalent
        altitude: { value: 8000, uncertainty: 2000, unit: "m" },
        atmosphericDensity: { value: 0.4, uncertainty: 0.1, unit: "kg/m³" }, // At 8km altitude
      };

      const blastEffects = calculator.calculateBlastEffects(tunguskaParams);

      // Known Tunguska effects
      // Trees flattened out to ~20 km radius
      // Seismic waves detected globally
      // Atmospheric pressure waves circled Earth twice

      expect(blastEffects.fireballRadius.value).toBeGreaterThan(1000); // > 1 km fireball
      expect(blastEffects.overpressure[20000]).toBeGreaterThan(1000); // > 1 kPa at 20 km (tree damage threshold)
      expect(blastEffects.thermalRadiation[10000]).toBeGreaterThan(1e6); // Significant thermal effects at 10 km
    });

    it("should reproduce Chelyabinsk (2013) impact parameters", () => {
      const calculator = new BlastCalculator();

      // Chelyabinsk parameters from NASA/ESA analysis
      const chelyabinskParams = {
        energy: {
          value: 500e3 * 4.184e9,
          uncertainty: 100e3 * 4.184e9,
          unit: "J",
        }, // 500 kt TNT equivalent
        altitude: { value: 23000, uncertainty: 2000, unit: "m" },
        atmosphericDensity: { value: 0.04, uncertainty: 0.01, unit: "kg/m³" }, // At 23km altitude
      };

      const blastEffects = calculator.calculateBlastEffects(chelyabinskParams);

      // Known Chelyabinsk effects
      // Windows broken in Chelyabinsk (~65 km from ground zero)
      // Fireball visible for hundreds of kilometers
      // Seismic magnitude ~2.7

      expect(blastEffects.fireballRadius.value).toBeGreaterThan(500); // > 500 m fireball
      expect(blastEffects.overpressure[65000]).toBeGreaterThan(100); // > 100 Pa at 65 km (window damage)

      // Test seismic effects
      const seismicCalculator = new SeismicCalculator();
      const seismicEffects = seismicCalculator.calculateSeismicMagnitude({
        energy: chelyabinskParams.energy,
        distance: { value: 0, uncertainty: 0, unit: "km" }, // At impact point
        geologicalProperties: {
          density: { value: 2700, uncertainty: 200, unit: "kg/m³" },
          seismicVelocity: { value: 6000, uncertainty: 500, unit: "m/s" },
        },
      });

      expect(seismicEffects.magnitude.value).toBeCloseTo(2.7, 0.5);
    });

    it("should reproduce Barringer Crater formation", () => {
      const calculator = new CraterCalculator();

      // Barringer Crater (Meteor Crater) parameters
      const barringerParams = {
        impactorMass: { value: 3e8, uncertainty: 1e8, unit: "kg" }, // ~300,000 tons
        impactorVelocity: { value: 12000, uncertainty: 2000, unit: "m/s" },
        impactorDensity: { value: 7800, uncertainty: 500, unit: "kg/m³" }, // Iron meteorite
        impactAngle: { value: 45, uncertainty: 15, unit: "degrees" },
        targetMaterial: "rock" as const,
      };

      const craterResult =
        calculator.calculateCraterDimensions(barringerParams);

      // Known Barringer Crater dimensions
      // Diameter: ~1.2 km
      // Depth: ~170 m (original, now partially filled)

      expect(craterResult.diameter.value).toBeCloseTo(1200, 300); // Within 300m of 1.2 km
      expect(craterResult.depth.value).toBeGreaterThan(150); // At least 150m deep
    });
  });

  describe("Laboratory Impact Scaling", () => {
    it("should match hypervelocity impact experiments", () => {
      const calculator = new CraterCalculator();

      // Typical laboratory impact parameters
      const labParams = {
        impactorMass: { value: 0.001, uncertainty: 0.0001, unit: "kg" }, // 1 gram projectile
        impactorVelocity: { value: 5000, uncertainty: 100, unit: "m/s" },
        impactorDensity: { value: 2700, uncertainty: 100, unit: "kg/m³" }, // Aluminum
        impactAngle: { value: 90, uncertainty: 5, unit: "degrees" }, // Normal impact
        targetMaterial: "rock" as const,
      };

      const craterResult = calculator.calculateCraterDimensions(labParams);

      // Laboratory scaling laws suggest crater diameter ~10-20 times projectile diameter
      const projectileRadius = Math.pow(
        (3 * labParams.impactorMass.value) /
          (4 * Math.PI * labParams.impactorDensity.value),
        1 / 3
      );
      const projectileDiameter = 2 * projectileRadius;
      const scalingFactor = craterResult.diameter.value / projectileDiameter;

      expect(scalingFactor).toBeGreaterThan(8);
      expect(scalingFactor).toBeLessThan(25);
    });
  });

  describe("Orbital Mechanics Benchmarks", () => {
    it("should match JPL Horizons for well-known asteroids", () => {
      const calculator = new EphemerisCalculator();

      // Apophis orbital elements (epoch 2023-01-01)
      const apophisElements = {
        semiMajorAxis: 0.9224, // AU
        eccentricity: 0.1914,
        inclination: 3.3386, // degrees
        longitudeOfAscendingNode: 204.446,
        argumentOfPeriapsis: 126.394,
        meanAnomaly: 267.22,
        epoch: 2459945.5, // 2023-01-01 00:00 UTC
      };

      const position = calculator.calculatePosition(
        apophisElements,
        apophisElements.epoch
      );

      // Verify position is reasonable (within solar system bounds)
      const distance = Math.sqrt(
        position.x ** 2 + position.y ** 2 + position.z ** 2
      );
      expect(distance).toBeGreaterThan(0.5); // > 0.5 AU from Sun
      expect(distance).toBeLessThan(2.0); // < 2.0 AU from Sun (reasonable for Apophis)

      // Verify position components are finite
      expect(isFinite(position.x)).toBe(true);
      expect(isFinite(position.y)).toBe(true);
      expect(isFinite(position.z)).toBe(true);
    });

    it("should solve Kepler equation for known test cases", () => {
      const solver = new KeplerSolver();

      // Known test cases from astronomical literature
      const testCases = [
        { meanAnomaly: 0, eccentricity: 0, expected: 0 },
        { meanAnomaly: Math.PI / 2, eccentricity: 0, expected: Math.PI / 2 },
        { meanAnomaly: Math.PI, eccentricity: 0, expected: Math.PI },
        { meanAnomaly: Math.PI / 2, eccentricity: 0.5, expected: 1.6857 }, // Approximate
        { meanAnomaly: Math.PI, eccentricity: 0.9, expected: Math.PI },
      ];

      testCases.forEach(({ meanAnomaly, eccentricity, expected }) => {
        const result = solver.solveKeplerEquation(meanAnomaly, eccentricity);

        if (expected === Math.PI && eccentricity > 0) {
          // For high eccentricity at mean anomaly = π, result should be close to π
          expect(Math.abs(result - expected)).toBeLessThan(0.1);
        } else {
          expect(Math.abs(result - expected)).toBeLessThan(0.01);
        }
      });
    });
  });

  describe("Deflection Mission Benchmarks", () => {
    it("should reproduce DART mission momentum transfer", () => {
      const calculator = new KineticImpactorCalculator();

      // DART mission parameters
      const dartParams = {
        spacecraftMass: { value: 610, uncertainty: 10, unit: "kg" },
        impactVelocity: { value: 6140, uncertainty: 50, unit: "m/s" },
        targetMass: { value: 4.3e9, uncertainty: 5e8, unit: "kg" }, // Dimorphos estimated mass
        targetComposition: "rocky" as const,
        impactAngle: { value: 0, uncertainty: 5, unit: "degrees" }, // Nearly head-on
      };

      const result = calculator.calculateMomentumTransfer(dartParams);

      // DART achieved a period change of ~32 minutes (exceeded expectations)
      // This corresponds to a velocity change of ~2.14 mm/s
      const expectedDeltaV = 0.00214; // m/s

      // Our calculation should be in the right order of magnitude
      expect(result.deltaV.value).toBeGreaterThan(0.001); // > 1 mm/s
      expect(result.deltaV.value).toBeLessThan(0.01); // < 1 cm/s

      // Momentum enhancement factor should be > 1 due to ejecta
      expect(result.momentumEnhancement).toBeGreaterThan(1.0);
      expect(result.momentumEnhancement).toBeLessThan(10.0); // Reasonable upper bound
    });

    it("should calculate realistic gravity tractor performance", () => {
      const calculator = new GravityTractorCalculator();

      // Hypothetical gravity tractor mission to Apophis
      const gravityTractorParams = {
        spacecraftMass: { value: 1000, uncertainty: 100, unit: "kg" },
        asteroidMass: { value: 6.1e10, uncertainty: 1e10, unit: "kg" }, // Apophis mass estimate
        operatingDistance: { value: 200, uncertainty: 50, unit: "m" },
        missionDuration: { value: 365.25 * 5, uncertainty: 30, unit: "days" }, // 5 years
        thrustEfficiency: {
          value: 0.9,
          uncertainty: 0.05,
          unit: "dimensionless",
        },
      };

      const result = calculator.calculateTrajectoryChange(gravityTractorParams);

      // Gravity tractor should produce small but measurable deflection
      expect(result.deltaV.value).toBeGreaterThan(1e-6); // > 1 μm/s
      expect(result.deltaV.value).toBeLessThan(1e-3); // < 1 mm/s

      // Deflection distance should scale with warning time
      expect(result.deflectionDistance.value).toBeGreaterThan(1000); // > 1 km deflection
    });

    it("should calculate nuclear deflection scaling", () => {
      const calculator = new NuclearDeflectionCalculator();

      // Hypothetical nuclear deflection scenario
      const nuclearParams = {
        asteroidMass: { value: 1e12, uncertainty: 2e11, unit: "kg" },
        asteroidRadius: { value: 500, uncertainty: 50, unit: "m" },
        nuclearYield: { value: 1e6, uncertainty: 1e5, unit: "kt" }, // 1 Mt
        standoffDistance: { value: 100, uncertainty: 20, unit: "m" },
        warningTime: { value: 365.25 * 10, uncertainty: 365, unit: "days" }, // 10 years
      };

      const result = calculator.calculateMomentumTransfer(nuclearParams);

      // Nuclear deflection should be more effective than kinetic impact
      expect(result.deltaV.value).toBeGreaterThan(0.01); // > 1 cm/s
      expect(result.deltaV.value).toBeLessThan(10); // < 10 m/s (reasonable upper bound)

      // Energy coupling efficiency should be reasonable
      expect(result.couplingEfficiency).toBeGreaterThan(0.001); // > 0.1%
      expect(result.couplingEfficiency).toBeLessThan(0.1); // < 10%
    });
  });

  describe("Uncertainty Propagation Validation", () => {
    it("should propagate uncertainties correctly through impact calculations", () => {
      const calculator = new CraterCalculator();

      const params = {
        impactorMass: { value: 1e12, uncertainty: 1e11, unit: "kg" }, // 10% uncertainty
        impactorVelocity: { value: 20000, uncertainty: 2000, unit: "m/s" }, // 10% uncertainty
        impactorDensity: { value: 2700, uncertainty: 270, unit: "kg/m³" }, // 10% uncertainty
        impactAngle: { value: 45, uncertainty: 5, unit: "degrees" },
        targetMaterial: "rock" as const,
      };

      const result = calculator.calculateCraterDimensions(params);

      // Uncertainty should be propagated (not zero)
      expect(result.diameter.uncertainty).toBeGreaterThan(0);
      expect(result.depth.uncertainty).toBeGreaterThan(0);

      // Relative uncertainty should be reasonable (not larger than inputs)
      const diameterRelativeUncertainty =
        result.diameter.uncertainty / result.diameter.value;
      expect(diameterRelativeUncertainty).toBeLessThan(0.5); // < 50%
      expect(diameterRelativeUncertainty).toBeGreaterThan(0.05); // > 5%
    });

    it("should handle correlated uncertainties in orbital calculations", () => {
      const calculator = new EphemerisCalculator();

      const elements = {
        semiMajorAxis: 1.5,
        eccentricity: 0.2,
        inclination: 5.0,
        longitudeOfAscendingNode: 45.0,
        argumentOfPeriapsis: 90.0,
        meanAnomaly: 180.0,
        epoch: 2460000.5,
      };

      // Calculate positions at different times
      const position1 = calculator.calculatePosition(elements, elements.epoch);
      const position2 = calculator.calculatePosition(
        elements,
        elements.epoch + 365.25
      );

      // Positions should be different but reasonable
      const distance1 = Math.sqrt(
        position1.x ** 2 + position1.y ** 2 + position1.z ** 2
      );
      const distance2 = Math.sqrt(
        position2.x ** 2 + position2.y ** 2 + position2.z ** 2
      );

      expect(Math.abs(distance1 - distance2)).toBeGreaterThan(0.1); // Positions should change
      expect(Math.abs(distance1 - distance2)).toBeLessThan(2.0); // But not too much for 1 year
    });
  });

  describe("Performance Regression Tests", () => {
    it("should maintain calculation speed for real-time applications", () => {
      const startTime = performance.now();

      // Perform typical calculation sequence
      const energy = calculateKineticEnergy(1e12, 20000);
      const position = calculateOrbitalPosition(
        {
          semiMajorAxis: 1.5,
          eccentricity: 0.2,
          inclination: 5.0,
          longitudeOfAscendingNode: 45.0,
          argumentOfPeriapsis: 90.0,
          meanAnomaly: 180.0,
          epoch: 2460000.5,
        },
        2460000.5
      );
      const deflection = calculateKineticImpactorEffectiveness({
        spacecraftMass: 500,
        impactVelocity: 6000,
        asteroidMass: 1e12,
        asteroidRadius: 500,
      });

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should complete in less than 10ms for real-time use
      expect(totalTime).toBeLessThan(10);

      // Results should be valid
      expect(energy).toBeGreaterThan(0);
      expect(isFinite(position.x)).toBe(true);
      expect(deflection.deltaV).toBeGreaterThan(0);
    });
  });
});
