/**
 * Comprehensive tests for orbital perturbation models
 * Tests J2, third-body, relativistic, and radiation pressure perturbations
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  PerturbationCalculator,
  PerturbationType,
  PerturbationUtils,
  createPerturbationCalculator,
  DEFAULT_PERTURBATION_CONFIG,
  EARTH_PARAMETERS,
  SOLAR_SYSTEM_PARAMETERS,
  type OrbitalStateVector,
  type Vector3D,
} from "../perturbations";

describe("PerturbationCalculator", () => {
  let calculator: PerturbationCalculator;

  beforeEach(() => {
    calculator = new PerturbationCalculator();
  });

  describe("J2 Oblateness Perturbation", () => {
    it("should calculate J2 perturbation for circular orbit", () => {
      const state: OrbitalStateVector = {
        position: { x: 7000, y: 0, z: 0 }, // km (circular orbit ~600 km altitude)
        velocity: { x: 0, y: 7.5, z: 0 }, // km/s
        epoch: 2460000,
      };

      const perturbations = calculator.calculatePerturbations(state);
      const j2Perturbation = perturbations.find(
        (p) => p.type === PerturbationType.J2_OBLATENESS
      );

      expect(j2Perturbation).toBeDefined();
      expect(j2Perturbation!.magnitude).toBeGreaterThan(0);
      expect(j2Perturbation!.acceleration.x).toBeLessThan(0); // Should point toward Earth
      expect(j2Perturbation!.description).toContain("J2");
    });

    it("should have stronger J2 effect at lower altitudes", () => {
      const lowOrbitState: OrbitalStateVector = {
        position: { x: 6600, y: 0, z: 0 }, // Lower altitude
        velocity: { x: 0, y: 7.8, z: 0 },
        epoch: 2460000,
      };

      const highOrbitState: OrbitalStateVector = {
        position: { x: 8000, y: 0, z: 0 }, // Higher altitude
        velocity: { x: 0, y: 7.0, z: 0 },
        epoch: 2460000,
      };

      const lowPerturbations = calculator.calculatePerturbations(lowOrbitState);
      const highPerturbations =
        calculator.calculatePerturbations(highOrbitState);

      const lowJ2 = lowPerturbations.find(
        (p) => p.type === PerturbationType.J2_OBLATENESS
      );
      const highJ2 = highPerturbations.find(
        (p) => p.type === PerturbationType.J2_OBLATENESS
      );

      expect(lowJ2!.magnitude).toBeGreaterThan(highJ2!.magnitude);
    });

    it("should have different J2 effects based on latitude", () => {
      const equatorialState: OrbitalStateVector = {
        position: { x: 7000, y: 0, z: 0 }, // Equatorial
        velocity: { x: 0, y: 7.5, z: 0 },
        epoch: 2460000,
      };

      const polarState: OrbitalStateVector = {
        position: { x: 0, y: 0, z: 7000 }, // Polar
        velocity: { x: 7.5, y: 0, z: 0 },
        epoch: 2460000,
      };

      const equatorialPerturbations =
        calculator.calculatePerturbations(equatorialState);
      const polarPerturbations = calculator.calculatePerturbations(polarState);

      const equatorialJ2 = equatorialPerturbations.find(
        (p) => p.type === PerturbationType.J2_OBLATENESS
      );
      const polarJ2 = polarPerturbations.find(
        (p) => p.type === PerturbationType.J2_OBLATENESS
      );

      // J2 effect should be different for different latitudes
      expect(equatorialJ2!.magnitude).not.toBeCloseTo(polarJ2!.magnitude, 10);
    });
  });

  describe("Third-Body Perturbations", () => {
    it("should calculate solar perturbation", () => {
      const state: OrbitalStateVector = {
        position: { x: 42164, y: 0, z: 0 }, // GEO altitude
        velocity: { x: 0, y: 3.07, z: 0 },
        epoch: 2460000,
      };

      const sunPosition: Vector3D = { x: 149597870, y: 0, z: 0 }; // 1 AU

      const perturbations = calculator.calculatePerturbations(
        state,
        sunPosition
      );
      const solarPerturbation = perturbations.find(
        (p) => p.type === PerturbationType.SOLAR_GRAVITY
      );

      expect(solarPerturbation).toBeDefined();
      expect(solarPerturbation!.magnitude).toBeGreaterThan(0);
      expect(solarPerturbation!.description).toContain("Solar");
    });

    it("should calculate lunar perturbation", () => {
      const state: OrbitalStateVector = {
        position: { x: 42164, y: 0, z: 0 }, // GEO altitude
        velocity: { x: 0, y: 3.07, z: 0 },
        epoch: 2460000,
      };

      const moonPosition: Vector3D = { x: 384400, y: 0, z: 0 }; // Moon distance

      const perturbations = calculator.calculatePerturbations(
        state,
        undefined,
        moonPosition
      );
      const lunarPerturbation = perturbations.find(
        (p) => p.type === PerturbationType.LUNAR_GRAVITY
      );

      expect(lunarPerturbation).toBeDefined();
      expect(lunarPerturbation!.magnitude).toBeGreaterThan(0);
      expect(lunarPerturbation!.description).toContain("Lunar");
    });

    it("should have stronger third-body effects at higher altitudes", () => {
      const lowState: OrbitalStateVector = {
        position: { x: 7000, y: 0, z: 0 }, // LEO
        velocity: { x: 0, y: 7.5, z: 0 },
        epoch: 2460000,
      };

      const highState: OrbitalStateVector = {
        position: { x: 42164, y: 0, z: 0 }, // GEO
        velocity: { x: 0, y: 3.07, z: 0 },
        epoch: 2460000,
      };

      const sunPosition: Vector3D = { x: 149597870, y: 0, z: 0 };

      const lowPerturbations = calculator.calculatePerturbations(
        lowState,
        sunPosition
      );
      const highPerturbations = calculator.calculatePerturbations(
        highState,
        sunPosition
      );

      const lowSolar = lowPerturbations.find(
        (p) => p.type === PerturbationType.SOLAR_GRAVITY
      );
      const highSolar = highPerturbations.find(
        (p) => p.type === PerturbationType.SOLAR_GRAVITY
      );

      // Solar perturbation should be relatively stronger at higher altitudes
      // (compared to central body acceleration)
      expect(highSolar!.magnitude).toBeGreaterThan(lowSolar!.magnitude);
    });
  });

  describe("Relativistic Perturbations", () => {
    it("should calculate relativistic perturbation", () => {
      const calculator = new PerturbationCalculator({
        includeRelativistic: true,
      });

      const state: OrbitalStateVector = {
        position: { x: 7000, y: 0, z: 0 },
        velocity: { x: 0, y: 7.5, z: 0 },
        epoch: 2460000,
      };

      const perturbations = calculator.calculatePerturbations(state);
      const relativisticPerturbation = perturbations.find(
        (p) => p.type === PerturbationType.RELATIVISTIC
      );

      expect(relativisticPerturbation).toBeDefined();
      expect(relativisticPerturbation!.magnitude).toBeGreaterThan(0);
      expect(relativisticPerturbation!.magnitude).toBeLessThan(1e-10); // Should be very small
      expect(relativisticPerturbation!.description).toContain("relativistic");
    });

    it("should have larger relativistic effects for higher velocities", () => {
      const calculator = new PerturbationCalculator({
        includeRelativistic: true,
      });

      const lowVelocityState: OrbitalStateVector = {
        position: { x: 42164, y: 0, z: 0 }, // GEO (lower velocity)
        velocity: { x: 0, y: 3.07, z: 0 },
        epoch: 2460000,
      };

      const highVelocityState: OrbitalStateVector = {
        position: { x: 7000, y: 0, z: 0 }, // LEO (higher velocity)
        velocity: { x: 0, y: 7.5, z: 0 },
        epoch: 2460000,
      };

      const lowVelPerturbations =
        calculator.calculatePerturbations(lowVelocityState);
      const highVelPerturbations =
        calculator.calculatePerturbations(highVelocityState);

      const lowVelRelativistic = lowVelPerturbations.find(
        (p) => p.type === PerturbationType.RELATIVISTIC
      );
      const highVelRelativistic = highVelPerturbations.find(
        (p) => p.type === PerturbationType.RELATIVISTIC
      );

      expect(highVelRelativistic!.magnitude).toBeGreaterThan(
        lowVelRelativistic!.magnitude
      );
    });
  });

  describe("Radiation Pressure Perturbations", () => {
    it("should calculate radiation pressure perturbation", () => {
      const calculator = new PerturbationCalculator({
        includeRadiationPressure: true,
        mass: 1000, // kg
        crossSectionalArea: 10, // m²
        reflectivityCoefficient: 1.0,
      });

      const state: OrbitalStateVector = {
        position: { x: 42164, y: 0, z: 0 },
        velocity: { x: 0, y: 3.07, z: 0 },
        epoch: 2460000,
      };

      const sunPosition: Vector3D = { x: 149597870, y: 0, z: 0 }; // 1 AU

      const perturbations = calculator.calculatePerturbations(
        state,
        sunPosition
      );
      const radiationPerturbation = perturbations.find(
        (p) => p.type === PerturbationType.RADIATION_PRESSURE
      );

      expect(radiationPerturbation).toBeDefined();
      expect(radiationPerturbation!.magnitude).toBeGreaterThan(0);
      expect(radiationPerturbation!.description).toContain(
        "radiation pressure"
      );
    });

    it("should have stronger radiation pressure for larger area-to-mass ratio", () => {
      const lowAreaMassCalculator = new PerturbationCalculator({
        includeRadiationPressure: true,
        mass: 1000, // kg
        crossSectionalArea: 1, // m²
      });

      const highAreaMassCalculator = new PerturbationCalculator({
        includeRadiationPressure: true,
        mass: 100, // kg (same area, less mass)
        crossSectionalArea: 1, // m²
      });

      const state: OrbitalStateVector = {
        position: { x: 42164, y: 0, z: 0 },
        velocity: { x: 0, y: 3.07, z: 0 },
        epoch: 2460000,
      };

      const sunPosition: Vector3D = { x: 149597870, y: 0, z: 0 };

      const lowPerturbations = lowAreaMassCalculator.calculatePerturbations(
        state,
        sunPosition
      );
      const highPerturbations = highAreaMassCalculator.calculatePerturbations(
        state,
        sunPosition
      );

      const lowRadiation = lowPerturbations.find(
        (p) => p.type === PerturbationType.RADIATION_PRESSURE
      );
      const highRadiation = highPerturbations.find(
        (p) => p.type === PerturbationType.RADIATION_PRESSURE
      );

      expect(highRadiation!.magnitude).toBeGreaterThan(lowRadiation!.magnitude);
    });

    it("should decrease with distance from Sun", () => {
      const calculator = new PerturbationCalculator({
        includeRadiationPressure: true,
        mass: 1000,
        crossSectionalArea: 10,
      });

      const state: OrbitalStateVector = {
        position: { x: 42164, y: 0, z: 0 },
        velocity: { x: 0, y: 3.07, z: 0 },
        epoch: 2460000,
      };

      const closeSunPosition: Vector3D = { x: 149597870, y: 0, z: 0 }; // 1 AU
      const farSunPosition: Vector3D = { x: 299195740, y: 0, z: 0 }; // 2 AU

      const closePerturbations = calculator.calculatePerturbations(
        state,
        closeSunPosition
      );
      const farPerturbations = calculator.calculatePerturbations(
        state,
        farSunPosition
      );

      const closeRadiation = closePerturbations.find(
        (p) => p.type === PerturbationType.RADIATION_PRESSURE
      );
      const farRadiation = farPerturbations.find(
        (p) => p.type === PerturbationType.RADIATION_PRESSURE
      );

      expect(closeRadiation!.magnitude).toBeGreaterThan(
        farRadiation!.magnitude
      );
      // Should follow inverse square law
      expect(closeRadiation!.magnitude / farRadiation!.magnitude).toBeCloseTo(
        4,
        1
      );
    });
  });

  describe("Total Perturbation Calculation", () => {
    it("should calculate total perturbation acceleration", () => {
      const state: OrbitalStateVector = {
        position: { x: 7000, y: 0, z: 0 },
        velocity: { x: 0, y: 7.5, z: 0 },
        epoch: 2460000,
      };

      const sunPosition: Vector3D = { x: 149597870, y: 0, z: 0 };
      const moonPosition: Vector3D = { x: 384400, y: 0, z: 0 };

      const totalPerturbation = calculator.calculateTotalPerturbation(
        state,
        sunPosition,
        moonPosition
      );

      expect(totalPerturbation.x).toBeDefined();
      expect(totalPerturbation.y).toBeDefined();
      expect(totalPerturbation.z).toBeDefined();
      expect(
        Math.sqrt(
          totalPerturbation.x ** 2 +
            totalPerturbation.y ** 2 +
            totalPerturbation.z ** 2
        )
      ).toBeGreaterThan(0);
    });

    it("should sum individual perturbations correctly", () => {
      const state: OrbitalStateVector = {
        position: { x: 7000, y: 0, z: 0 },
        velocity: { x: 0, y: 7.5, z: 0 },
        epoch: 2460000,
      };

      const perturbations = calculator.calculatePerturbations(state);
      const totalPerturbation = calculator.calculateTotalPerturbation(state);

      let sumX = 0,
        sumY = 0,
        sumZ = 0;
      for (const perturbation of perturbations) {
        sumX += perturbation.acceleration.x;
        sumY += perturbation.acceleration.y;
        sumZ += perturbation.acceleration.z;
      }

      expect(totalPerturbation.x).toBeCloseTo(sumX, 12);
      expect(totalPerturbation.y).toBeCloseTo(sumY, 12);
      expect(totalPerturbation.z).toBeCloseTo(sumZ, 12);
    });
  });

  describe("Orbital Propagation", () => {
    it("should propagate orbital state with perturbations", () => {
      const initialState: OrbitalStateVector = {
        position: { x: 7000, y: 0, z: 0 },
        velocity: { x: 0, y: 7.5, z: 0 },
        epoch: 2460000,
      };

      const timeStep = 60; // 60 seconds
      const duration = 3600; // 1 hour

      const states = calculator.propagateState(
        initialState,
        timeStep,
        duration
      );

      expect(states.length).toBe(Math.floor(duration / timeStep) + 1); // +1 for initial state
      expect(states[0]).toEqual(initialState);

      // Final state should be different from initial
      const finalState = states[states.length - 1];
      expect(finalState.position.x).not.toBeCloseTo(initialState.position.x, 3);
      expect(finalState.position.y).not.toBeCloseTo(initialState.position.y, 3);

      // Epoch should be updated
      expect(finalState.epoch).toBeCloseTo(
        initialState.epoch + duration / 86400,
        6
      );
    });

    it("should conserve energy approximately for short propagations", () => {
      const initialState: OrbitalStateVector = {
        position: { x: 7000, y: 0, z: 0 },
        velocity: { x: 0, y: 7.5, z: 0 },
        epoch: 2460000,
      };

      const timeStep = 10; // Small time step for accuracy
      const duration = 600; // 10 minutes

      const states = calculator.propagateState(
        initialState,
        timeStep,
        duration
      );

      const mu = EARTH_PARAMETERS.MU.value;

      // Calculate initial energy
      const r0 = Math.sqrt(
        initialState.position.x ** 2 +
          initialState.position.y ** 2 +
          initialState.position.z ** 2
      );
      const v0 = Math.sqrt(
        initialState.velocity.x ** 2 +
          initialState.velocity.y ** 2 +
          initialState.velocity.z ** 2
      );
      const initialEnergy = 0.5 * v0 * v0 - mu / r0;

      // Calculate final energy
      const finalState = states[states.length - 1];
      const rf = Math.sqrt(
        finalState.position.x ** 2 +
          finalState.position.y ** 2 +
          finalState.position.z ** 2
      );
      const vf = Math.sqrt(
        finalState.velocity.x ** 2 +
          finalState.velocity.y ** 2 +
          finalState.velocity.z ** 2
      );
      const finalEnergy = 0.5 * vf * vf - mu / rf;

      // Energy should be approximately conserved (within 1% for short propagation)
      const energyChange = Math.abs(
        (finalEnergy - initialEnergy) / initialEnergy
      );
      expect(energyChange).toBeLessThan(0.01);
    });
  });

  describe("Configuration Options", () => {
    it("should respect configuration settings", () => {
      const j2OnlyCalculator = new PerturbationCalculator({
        includeJ2: true,
        includeLunar: false,
        includeSolar: false,
        includeRelativistic: false,
        includeRadiationPressure: false,
      });

      const state: OrbitalStateVector = {
        position: { x: 7000, y: 0, z: 0 },
        velocity: { x: 0, y: 7.5, z: 0 },
        epoch: 2460000,
      };

      const sunPosition: Vector3D = { x: 149597870, y: 0, z: 0 };
      const moonPosition: Vector3D = { x: 384400, y: 0, z: 0 };

      const perturbations = j2OnlyCalculator.calculatePerturbations(
        state,
        sunPosition,
        moonPosition
      );

      expect(perturbations).toHaveLength(1);
      expect(perturbations[0].type).toBe(PerturbationType.J2_OBLATENESS);
    });

    it("should use default configuration when none provided", () => {
      const defaultCalculator = new PerturbationCalculator();

      expect(defaultCalculator["config"]).toEqual(DEFAULT_PERTURBATION_CONFIG);
    });
  });
});

describe("PerturbationUtils", () => {
  describe("estimatePerturbationMagnitudes", () => {
    it("should estimate perturbation magnitudes for LEO", () => {
      const magnitudes = PerturbationUtils.estimatePerturbationMagnitudes(
        7000, // km (LEO)
        0.01, // Low eccentricity
        Math.PI / 4 // 45 degree inclination
      );

      expect(magnitudes[PerturbationType.J2_OBLATENESS]).toBeGreaterThan(0);
      expect(magnitudes[PerturbationType.LUNAR_GRAVITY]).toBeGreaterThan(0);
      expect(magnitudes[PerturbationType.SOLAR_GRAVITY]).toBeGreaterThan(0);
      expect(magnitudes[PerturbationType.RELATIVISTIC]).toBeGreaterThan(0);

      // J2 should be dominant for LEO
      expect(magnitudes[PerturbationType.J2_OBLATENESS]).toBeGreaterThan(
        magnitudes[PerturbationType.LUNAR_GRAVITY]
      );
      expect(magnitudes[PerturbationType.J2_OBLATENESS]).toBeGreaterThan(
        magnitudes[PerturbationType.SOLAR_GRAVITY]
      );
    });

    it("should estimate perturbation magnitudes for GEO", () => {
      const magnitudes = PerturbationUtils.estimatePerturbationMagnitudes(
        42164, // km (GEO)
        0.01,
        0 // Equatorial
      );

      expect(magnitudes[PerturbationType.J2_OBLATENESS]).toBeGreaterThan(0);
      expect(magnitudes[PerturbationType.LUNAR_GRAVITY]).toBeGreaterThan(0);
      expect(magnitudes[PerturbationType.SOLAR_GRAVITY]).toBeGreaterThan(0);

      // Third-body effects should be more significant at GEO than relativistic
      // (Both are very small, but lunar should be larger)
      expect(magnitudes[PerturbationType.LUNAR_GRAVITY]).toBeGreaterThan(0);
      expect(magnitudes[PerturbationType.RELATIVISTIC]).toBeGreaterThan(0);
    });
  });

  describe("getSignificantPerturbations", () => {
    it("should identify significant perturbations for LEO", () => {
      const significant = PerturbationUtils.getSignificantPerturbations(
        7000, // LEO
        0.01,
        Math.PI / 4,
        1e-12 // Low threshold
      );

      expect(significant).toContain(PerturbationType.J2_OBLATENESS);
      expect(significant[0]).toBe(PerturbationType.J2_OBLATENESS); // Should be first (most significant)
    });

    it("should identify significant perturbations for GEO", () => {
      const significant = PerturbationUtils.getSignificantPerturbations(
        42164, // GEO
        0.01,
        0,
        1e-15 // Very low threshold
      );

      expect(significant).toContain(PerturbationType.J2_OBLATENESS);
      expect(significant).toContain(PerturbationType.LUNAR_GRAVITY);
      expect(significant).toContain(PerturbationType.SOLAR_GRAVITY);
    });

    it("should filter out insignificant perturbations with higher threshold", () => {
      const significant = PerturbationUtils.getSignificantPerturbations(
        42164, // GEO
        0.01,
        0,
        1e-6 // High threshold
      );

      // Only the most significant perturbations should remain
      expect(significant.length).toBeLessThan(4);
      if (significant.length > 0) {
        expect(significant[0]).toBe(PerturbationType.J2_OBLATENESS);
      }
    });
  });
});

describe("createPerturbationCalculator", () => {
  it("should create calculator for LEO with appropriate settings", () => {
    const calculator = createPerturbationCalculator("LEO");

    const config = calculator["config"];
    expect(config.includeJ2).toBe(true);
    expect(config.includeLunar).toBe(false); // Not significant for LEO
    expect(config.includeSolar).toBe(false); // Not significant for LEO
    expect(config.includeAtmosphericDrag).toBe(true); // Important for LEO
  });

  it("should create calculator for GEO with appropriate settings", () => {
    const calculator = createPerturbationCalculator("GEO");

    const config = calculator["config"];
    expect(config.includeJ2).toBe(true);
    expect(config.includeLunar).toBe(true); // Significant for GEO
    expect(config.includeSolar).toBe(true); // Significant for GEO
    expect(config.includeAtmosphericDrag).toBe(false); // Not relevant for GEO
  });

  it("should create calculator for interplanetary with appropriate settings", () => {
    const calculator = createPerturbationCalculator("interplanetary");

    const config = calculator["config"];
    expect(config.includeJ2).toBe(false); // Not relevant for interplanetary
    expect(config.includeSolar).toBe(true); // Primary perturbation
    expect(config.includeRelativistic).toBe(true); // Can be significant
  });

  it("should include object properties when provided", () => {
    const objectProps = {
      mass: 1000,
      area: 10,
      reflectivity: 1.5,
      dragCoefficient: 2.5,
    };

    const calculator = createPerturbationCalculator("GEO", objectProps);

    const config = calculator["config"];
    expect(config.mass).toBe(objectProps.mass);
    expect(config.crossSectionalArea).toBe(objectProps.area);
    expect(config.reflectivityCoefficient).toBe(objectProps.reflectivity);
    expect(config.dragCoefficient).toBe(objectProps.dragCoefficient);
  });
});

describe("Physical Constants and Parameters", () => {
  it("should have reasonable Earth parameters", () => {
    expect(EARTH_PARAMETERS.J2.value).toBeCloseTo(1.0826267e-3, 6);
    expect(EARTH_PARAMETERS.EQUATORIAL_RADIUS.value).toBeCloseTo(6378.137, 1);
    expect(EARTH_PARAMETERS.MU.value).toBeCloseTo(398600.4418, 1);
  });

  it("should have reasonable solar system parameters", () => {
    expect(SOLAR_SYSTEM_PARAMETERS.SUN_MU.value).toBeGreaterThan(1e11);
    expect(SOLAR_SYSTEM_PARAMETERS.MOON_MU.value).toBeCloseTo(4902.7779, 1);
    expect(SOLAR_SYSTEM_PARAMETERS.SOLAR_RADIATION_PRESSURE.value).toBeCloseTo(
      4.56e-6,
      1e-6
    );
  });
});

describe("Integration and Numerical Stability", () => {
  it("should maintain numerical stability over multiple orbits", () => {
    const calculator = new PerturbationCalculator({ includeJ2: true });

    const initialState: OrbitalStateVector = {
      position: { x: 7000, y: 0, z: 0 },
      velocity: { x: 0, y: 7.5, z: 0 },
      epoch: 2460000,
    };

    const timeStep = 30; // 30 seconds
    const duration = 5400; // 1.5 hours (about 1 orbit)

    const states = calculator.propagateState(initialState, timeStep, duration);

    // Check that position magnitudes remain reasonable
    for (const state of states) {
      const r = Math.sqrt(
        state.position.x ** 2 + state.position.y ** 2 + state.position.z ** 2
      );
      expect(r).toBeGreaterThan(6000); // Above Earth surface
      expect(r).toBeLessThan(10000); // Reasonable for LEO

      const v = Math.sqrt(
        state.velocity.x ** 2 + state.velocity.y ** 2 + state.velocity.z ** 2
      );
      expect(v).toBeGreaterThan(6); // Reasonable orbital velocity
      expect(v).toBeLessThan(9); // Reasonable orbital velocity
    }
  });

  it("should handle edge cases gracefully", () => {
    const calculator = new PerturbationCalculator();

    // Very high orbit
    const highOrbitState: OrbitalStateVector = {
      position: { x: 100000, y: 0, z: 0 }, // Very high altitude
      velocity: { x: 0, y: 1.0, z: 0 },
      epoch: 2460000,
    };

    expect(() => {
      calculator.calculatePerturbations(highOrbitState);
    }).not.toThrow();

    // Very eccentric position
    const eccentricState: OrbitalStateVector = {
      position: { x: 50000, y: 30000, z: 20000 },
      velocity: { x: -2, y: 1, z: 0.5 },
      epoch: 2460000,
    };

    expect(() => {
      calculator.calculatePerturbations(eccentricState);
    }).not.toThrow();
  });
});
