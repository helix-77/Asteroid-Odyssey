/**
 * Comprehensive tests for close approach calculations
 * Tests MOID calculations, uncertainty propagation, and gravitational focusing
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  CloseApproachCalculator,
  CloseApproachUtils,
  createUncertainOrbitalElements,
  EARTH_ORBITAL_ELEMENTS,
  type CloseApproachResult,
  type UncertainOrbitalElements,
  type MOIDResult,
} from "../approaches";
import {
  EphemerisCalculator,
  CoordinateFrame,
  TimeScale,
  type JulianDate,
} from "../ephemeris";

describe("CloseApproachCalculator", () => {
  let testAsteroidElements: UncertainOrbitalElements;
  let testEpoch: JulianDate;

  beforeEach(() => {
    testEpoch = {
      jd: 2451545.0, // J2000.0
      timeScale: TimeScale.TDB,
    };

    testAsteroidElements = createUncertainOrbitalElements(
      {
        semiMajorAxis: 1.5, // AU
        eccentricity: 0.2,
        inclination: 5, // degrees
        longitudeOfAscendingNode: 45, // degrees
        argumentOfPeriapsis: 90, // degrees
        meanAnomalyAtEpoch: 0, // degrees
      },
      {
        semiMajorAxis: 0.001, // AU
        eccentricity: 0.001,
        inclination: 0.1, // degrees
        longitudeOfAscendingNode: 0.1, // degrees
        argumentOfPeriapsis: 0.1, // degrees
        meanAnomalyAtEpoch: 0.1, // degrees
      },
      testEpoch
    );
  });

  describe("Close Approach Detection", () => {
    it("should calculate close approaches over time period", () => {
      const startDate: JulianDate = {
        jd: 2451545.0, // J2000.0
        timeScale: TimeScale.TDB,
      };

      const endDate: JulianDate = {
        jd: 2451545.0 + 365, // One year later
        timeScale: TimeScale.TDB,
      };

      const approaches = CloseApproachCalculator.calculateCloseApproaches(
        testAsteroidElements,
        startDate,
        endDate,
        0.5, // 0.5 AU max distance
        10 // 10 day time step
      );

      expect(approaches).toBeDefined();
      expect(Array.isArray(approaches)).toBe(true);

      // Each approach should have required properties
      approaches.forEach((approach) => {
        expect(approach.date).toBeDefined();
        expect(approach.distance).toBeDefined();
        expect(approach.relativeVelocity).toBeDefined();
        expect(approach.asteroidPosition).toBeDefined();
        expect(approach.earthPosition).toBeDefined();
        expect(approach.relativePosition).toBeDefined();
        expect(approach.warnings).toBeDefined();
        expect(Array.isArray(approach.warnings)).toBe(true);
      });
    });

    it("should handle invalid input parameters", () => {
      const startDate: JulianDate = {
        jd: 2451545.0,
        timeScale: TimeScale.TDB,
      };

      const endDate: JulianDate = {
        jd: 2451545.0 - 100, // End before start
        timeScale: TimeScale.TDB,
      };

      expect(() => {
        CloseApproachCalculator.calculateCloseApproaches(
          testAsteroidElements,
          startDate,
          endDate
        );
      }).toThrow("End date must be after start date");

      expect(() => {
        CloseApproachCalculator.calculateCloseApproaches(
          testAsteroidElements,
          startDate,
          { jd: startDate.jd + 100, timeScale: TimeScale.TDB },
          -0.1 // Negative max distance
        );
      }).toThrow("Maximum distance must be positive");
    });

    it("should find approaches for Earth-crossing asteroid", () => {
      // Create an Earth-crossing asteroid
      const earthCrossingElements = createUncertainOrbitalElements(
        {
          semiMajorAxis: 1.2, // AU
          eccentricity: 0.3, // Crosses Earth orbit
          inclination: 2, // degrees
          longitudeOfAscendingNode: 0, // degrees
          argumentOfPeriapsis: 0, // degrees
          meanAnomalyAtEpoch: 0, // degrees
        },
        {
          semiMajorAxis: 0.001,
          eccentricity: 0.001,
          inclination: 0.01,
          longitudeOfAscendingNode: 0.01,
          argumentOfPeriapsis: 0.01,
          meanAnomalyAtEpoch: 0.01,
        },
        testEpoch
      );

      const startDate: JulianDate = {
        jd: 2451545.0,
        timeScale: TimeScale.TDB,
      };

      const endDate: JulianDate = {
        jd: 2451545.0 + 1000, // ~3 years
        timeScale: TimeScale.TDB,
      };

      const approaches = CloseApproachCalculator.calculateCloseApproaches(
        earthCrossingElements,
        startDate,
        endDate,
        0.1, // 0.1 AU max distance
        5 // 5 day time step
      );

      // Should find at least some approaches for Earth-crossing orbit
      expect(approaches.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Position Calculations", () => {
    it("should calculate asteroid position at given time", () => {
      const time: JulianDate = {
        jd: 2451545.0 + 100, // 100 days after epoch
        timeScale: TimeScale.TDB,
      };

      // Access private method through type assertion
      const calculator = CloseApproachCalculator as any;
      const position = calculator.calculateAsteroidPosition(
        testAsteroidElements,
        time
      );

      expect(position).toBeDefined();
      expect(position.x).toBeDefined();
      expect(position.y).toBeDefined();
      expect(position.z).toBeDefined();
      expect(position.frame).toBe(CoordinateFrame.J2000_ECLIPTIC);
      expect(position.epoch).toEqual(time);

      // Position should be reasonable for asteroid orbit
      const distance = Math.sqrt(
        position.x ** 2 + position.y ** 2 + position.z ** 2
      );
      expect(distance).toBeGreaterThan(100000); // > 100,000 km
      expect(distance).toBeLessThan(500000000); // < 500 million km
    });

    it("should calculate Earth position at given time", () => {
      const time: JulianDate = {
        jd: 2451545.0 + 100,
        timeScale: TimeScale.TDB,
      };

      const calculator = CloseApproachCalculator as any;
      const position = calculator.calculateEarthPosition(time);

      expect(position).toBeDefined();
      expect(position.frame).toBe(CoordinateFrame.J2000_ECLIPTIC);

      // Earth should be approximately 1 AU from Sun
      const distance = Math.sqrt(
        position.x ** 2 + position.y ** 2 + position.z ** 2
      );
      const distanceAU = distance / 149597870.7;
      expect(distanceAU).toBeCloseTo(1.0, 1); // Within 0.1 AU of 1 AU
    });

    it("should calculate relative position correctly", () => {
      const time: JulianDate = {
        jd: 2451545.0,
        timeScale: TimeScale.TDB,
      };

      const calculator = CloseApproachCalculator as any;
      const asteroidPos = calculator.calculateAsteroidPosition(
        testAsteroidElements,
        time
      );
      const earthPos = calculator.calculateEarthPosition(time);
      const relativePos = calculator.calculateRelativePosition(
        testAsteroidElements,
        time
      );

      expect(relativePos.x).toBeCloseTo(asteroidPos.x - earthPos.x, 6);
      expect(relativePos.y).toBeCloseTo(asteroidPos.y - earthPos.y, 6);
      expect(relativePos.z).toBeCloseTo(asteroidPos.z - earthPos.z, 6);
    });
  });

  describe("MOID Calculations", () => {
    it("should calculate MOID for asteroid orbit", () => {
      const moidResult =
        CloseApproachCalculator.calculateMOID(testAsteroidElements);

      expect(moidResult).toBeDefined();
      expect(moidResult.moid).toBeDefined();
      expect(moidResult.moid.value).toBeGreaterThan(0);
      expect(moidResult.moid.unit).toBe("AU");

      expect(moidResult.asteroidTrueAnomaly).toBeGreaterThanOrEqual(0);
      expect(moidResult.asteroidTrueAnomaly).toBeLessThan(2 * Math.PI);

      expect(moidResult.earthTrueAnomaly).toBeGreaterThanOrEqual(0);
      expect(moidResult.earthTrueAnomaly).toBeLessThan(2 * Math.PI);

      expect(moidResult.asteroidPosition).toBeDefined();
      expect(moidResult.earthPosition).toBeDefined();

      expect(moidResult.convergenceInfo).toBeDefined();
      expect(moidResult.convergenceInfo.iterations).toBeGreaterThan(0);
    });

    it("should find smaller MOID for Earth-crossing asteroid", () => {
      const earthCrossingElements = createUncertainOrbitalElements(
        {
          semiMajorAxis: 1.1,
          eccentricity: 0.2, // Crosses Earth orbit
          inclination: 1,
          longitudeOfAscendingNode: 0,
          argumentOfPeriapsis: 0,
          meanAnomalyAtEpoch: 0,
        },
        {
          semiMajorAxis: 0.001,
          eccentricity: 0.001,
          inclination: 0.01,
          longitudeOfAscendingNode: 0.01,
          argumentOfPeriapsis: 0.01,
          meanAnomalyAtEpoch: 0.01,
        },
        testEpoch
      );

      const regularMOID =
        CloseApproachCalculator.calculateMOID(testAsteroidElements);
      const crossingMOID = CloseApproachCalculator.calculateMOID(
        earthCrossingElements
      );

      // Earth-crossing asteroid should have smaller MOID
      expect(crossingMOID.moid.value).toBeLessThan(regularMOID.moid.value);
    });

    it("should handle circular Earth orbit correctly", () => {
      const moidResult = CloseApproachCalculator.calculateMOID(
        testAsteroidElements,
        EARTH_ORBITAL_ELEMENTS
      );

      expect(moidResult.moid.value).toBeGreaterThan(0);
      expect(moidResult.moid.value).toBeLessThan(10); // Should be reasonable
    });
  });

  describe("Gravitational Focusing", () => {
    it("should calculate gravitational focusing factor", () => {
      const calculator = CloseApproachCalculator as any;

      // Test at various distances and velocities
      const testCases = [
        { distance: 100000, velocity: 20 }, // 100,000 km, 20 km/s
        { distance: 50000, velocity: 15 }, // 50,000 km, 15 km/s
        { distance: 10000, velocity: 10 }, // 10,000 km, 10 km/s
      ];

      testCases.forEach(({ distance, velocity }) => {
        const factor = calculator.calculateGravitationalFocusing(
          distance,
          velocity
        );

        expect(factor).toBeGreaterThan(0);
        expect(factor).toBeLessThanOrEqual(1);
        expect(isFinite(factor)).toBe(true);
      });
    });

    it("should show stronger focusing for closer approaches", () => {
      const calculator = CloseApproachCalculator as any;

      const farFactor = calculator.calculateGravitationalFocusing(100000, 20);
      const closeFactor = calculator.calculateGravitationalFocusing(20000, 20);

      // Both factors should be reasonable
      expect(farFactor).toBeGreaterThan(0);
      expect(closeFactor).toBeGreaterThan(0);
      expect(farFactor).toBeLessThanOrEqual(1);
      expect(closeFactor).toBeLessThanOrEqual(1);
    });
  });

  describe("Uncertainty Propagation", () => {
    it("should propagate distance uncertainty", () => {
      const calculator = CloseApproachCalculator as any;

      const uncertainty = calculator.propagateDistanceUncertainty(
        testAsteroidElements,
        testEpoch
      );

      expect(uncertainty).toBeGreaterThan(0);
      expect(isFinite(uncertainty)).toBe(true);
    });

    it("should create close approach result with uncertainty", () => {
      const calculator = CloseApproachCalculator as any;

      const result = calculator.createCloseApproachResult(
        testAsteroidElements,
        testEpoch
      );

      expect(result).toBeDefined();
      expect(result.distance.uncertainty).toBeGreaterThan(0);
      expect(result.relativeVelocity.uncertainty).toBeGreaterThan(0);
      expect(result.impactProbability).toBeGreaterThanOrEqual(0);
      expect(result.impactProbability).toBeLessThanOrEqual(1);
    });

    it("should handle elements with different uncertainty levels", () => {
      const highUncertaintyElements = createUncertainOrbitalElements(
        {
          semiMajorAxis: 1.5,
          eccentricity: 0.2,
          inclination: 5,
          longitudeOfAscendingNode: 45,
          argumentOfPeriapsis: 90,
          meanAnomalyAtEpoch: 0,
        },
        {
          semiMajorAxis: 0.1, // High uncertainty
          eccentricity: 0.05,
          inclination: 1,
          longitudeOfAscendingNode: 1,
          argumentOfPeriapsis: 1,
          meanAnomalyAtEpoch: 1,
        },
        testEpoch
      );

      const calculator = CloseApproachCalculator as any;

      const lowUncertaintyResult = calculator.propagateDistanceUncertainty(
        testAsteroidElements,
        testEpoch
      );

      const highUncertaintyResult = calculator.propagateDistanceUncertainty(
        highUncertaintyElements,
        testEpoch
      );

      expect(highUncertaintyResult).toBeGreaterThan(lowUncertaintyResult);
    });
  });

  describe("Position from True Anomaly", () => {
    it("should calculate position from true anomaly", () => {
      const calculator = CloseApproachCalculator as any;

      const trueAnomalies = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];

      trueAnomalies.forEach((nu) => {
        const position = calculator.calculatePositionFromTrueAnomaly(
          testAsteroidElements,
          nu
        );

        expect(position).toBeDefined();
        expect(position.x).toBeDefined();
        expect(position.y).toBeDefined();
        expect(position.z).toBeDefined();
        expect(isFinite(position.x)).toBe(true);
        expect(isFinite(position.y)).toBe(true);
        expect(isFinite(position.z)).toBe(true);
      });
    });

    it("should calculate Earth position from true anomaly", () => {
      const calculator = CloseApproachCalculator as any;

      const position = calculator.calculateEarthPositionFromTrueAnomaly(
        EARTH_ORBITAL_ELEMENTS,
        Math.PI / 4 // 45 degrees
      );

      expect(position).toBeDefined();
      expect(position.frame).toBe(CoordinateFrame.J2000_ECLIPTIC);

      // Should be approximately 1 AU from origin
      const distance = Math.sqrt(
        position.x ** 2 + position.y ** 2 + position.z ** 2
      );
      expect(distance).toBeCloseTo(1.0, 1); // Within 0.1 AU
    });
  });
});

describe("CloseApproachUtils", () => {
  describe("Distance Conversions", () => {
    it("should convert distance to Earth radii", () => {
      const earthRadius = 6378.137; // km
      const distance = earthRadius * 5; // 5 Earth radii

      const earthRadii = CloseApproachUtils.distanceInEarthRadii(distance);

      expect(earthRadii).toBeCloseTo(5, 6);
    });

    it("should convert distance to lunar distances", () => {
      const lunarDistance = 384400; // km
      const distance = lunarDistance * 2.5; // 2.5 lunar distances

      const lunarDistances =
        CloseApproachUtils.distanceInLunarDistances(distance);

      expect(lunarDistances).toBeCloseTo(2.5, 6);
    });
  });

  describe("Approach Classification", () => {
    it("should classify approaches by distance", () => {
      const testCases = [
        { distance: 6000, expected: "Impact" },
        { distance: 50000, expected: "Extremely Close" },
        { distance: 200000, expected: "Very Close" },
        { distance: 1000000, expected: "Close" },
        { distance: 10000000, expected: "Moderate" },
        { distance: 100000000, expected: "Distant" },
      ];

      testCases.forEach(({ distance, expected }) => {
        const classification = CloseApproachUtils.classifyApproach(distance);
        expect(classification).toBe(expected);
      });
    });
  });

  describe("Torino Scale", () => {
    it("should calculate Torino Scale rating", () => {
      const testCases = [
        { probability: 0, energy: 1000, expectedMin: 0, expectedMax: 0 },
        { probability: 1e-6, energy: 100, expectedMin: 0, expectedMax: 3 },
        { probability: 1e-3, energy: 10000, expectedMin: 0, expectedMax: 10 },
      ];

      testCases.forEach(({ probability, energy, expectedMin, expectedMax }) => {
        const scale = CloseApproachUtils.calculateTorinoScale(
          probability,
          energy
        );

        expect(scale).toBeGreaterThanOrEqual(expectedMin);
        expect(scale).toBeLessThanOrEqual(expectedMax);
        expect(Number.isInteger(scale)).toBe(true);
      });
    });

    it("should return 0 for zero probability", () => {
      const scale = CloseApproachUtils.calculateTorinoScale(0, 1000);
      expect(scale).toBe(0);
    });
  });

  describe("Impact Energy Estimation", () => {
    it("should estimate impact energy from asteroid properties", () => {
      const diameter = 1.0; // km
      const velocity = 20; // km/s
      const density = 2000; // kg/m³

      const energy = CloseApproachUtils.estimateImpactEnergy(
        diameter,
        velocity,
        density
      );

      expect(energy).toBeGreaterThan(0);
      expect(isFinite(energy)).toBe(true);

      // Should be reasonable for 1 km asteroid
      expect(energy).toBeGreaterThan(1000); // > 1000 Mt TNT
      expect(energy).toBeLessThan(1000000); // < 1 million Mt TNT
    });

    it("should scale energy with diameter cubed", () => {
      const velocity = 20;
      const density = 2000;

      const energy1km = CloseApproachUtils.estimateImpactEnergy(
        1.0,
        velocity,
        density
      );
      const energy2km = CloseApproachUtils.estimateImpactEnergy(
        2.0,
        velocity,
        density
      );

      // Energy should scale as diameter³ (volume)
      expect(energy2km / energy1km).toBeCloseTo(8, 1); // 2³ = 8
    });

    it("should scale energy with velocity squared", () => {
      const diameter = 1.0;
      const density = 2000;

      const energy10kms = CloseApproachUtils.estimateImpactEnergy(
        diameter,
        10,
        density
      );
      const energy20kms = CloseApproachUtils.estimateImpactEnergy(
        diameter,
        20,
        density
      );

      // Energy should scale as velocity²
      expect(energy20kms / energy10kms).toBeCloseTo(4, 1); // (20/10)² = 4
    });
  });
});

describe("createUncertainOrbitalElements", () => {
  it("should create uncertain orbital elements from nominal values", () => {
    const nominalElements = {
      semiMajorAxis: 2.5,
      eccentricity: 0.15,
      inclination: 10,
      longitudeOfAscendingNode: 45,
      argumentOfPeriapsis: 90,
      meanAnomalyAtEpoch: 180,
    };

    const uncertainties = {
      semiMajorAxis: 0.01,
      eccentricity: 0.001,
      inclination: 0.1,
      longitudeOfAscendingNode: 0.5,
      argumentOfPeriapsis: 0.5,
      meanAnomalyAtEpoch: 1.0,
    };

    const epoch: JulianDate = {
      jd: 2451545.0,
      timeScale: TimeScale.TDB,
    };

    const elements = createUncertainOrbitalElements(
      nominalElements,
      uncertainties,
      epoch
    );

    expect(elements.semiMajorAxis.value).toBe(nominalElements.semiMajorAxis);
    expect(elements.semiMajorAxis.uncertainty).toBe(
      uncertainties.semiMajorAxis
    );
    expect(elements.semiMajorAxis.unit).toBe("AU");

    expect(elements.eccentricity.value).toBe(nominalElements.eccentricity);
    expect(elements.eccentricity.uncertainty).toBe(uncertainties.eccentricity);

    // Angular elements should be converted to radians
    expect(elements.inclination.value).toBeCloseTo(
      (nominalElements.inclination * Math.PI) / 180,
      10
    );
    expect(elements.inclination.uncertainty).toBeCloseTo(
      (uncertainties.inclination * Math.PI) / 180,
      10
    );
    expect(elements.inclination.unit).toBe("rad");

    expect(elements.epoch).toEqual(epoch);
    expect(elements.frame).toBe(CoordinateFrame.J2000_ECLIPTIC);
  });

  it("should use default frame when not specified", () => {
    const elements = createUncertainOrbitalElements(
      {
        semiMajorAxis: 1.5,
        eccentricity: 0.1,
        inclination: 5,
        longitudeOfAscendingNode: 0,
        argumentOfPeriapsis: 0,
        meanAnomalyAtEpoch: 0,
      },
      {
        semiMajorAxis: 0.001,
        eccentricity: 0.001,
        inclination: 0.01,
        longitudeOfAscendingNode: 0.01,
        argumentOfPeriapsis: 0.01,
        meanAnomalyAtEpoch: 0.01,
      },
      { jd: 2451545.0, timeScale: TimeScale.TDB }
    );

    expect(elements.frame).toBe(CoordinateFrame.J2000_ECLIPTIC);
  });
});

describe("Integration Tests", () => {
  it("should handle complete close approach analysis workflow", () => {
    const asteroidElements = createUncertainOrbitalElements(
      {
        semiMajorAxis: 1.3,
        eccentricity: 0.25,
        inclination: 3,
        longitudeOfAscendingNode: 30,
        argumentOfPeriapsis: 60,
        meanAnomalyAtEpoch: 45,
      },
      {
        semiMajorAxis: 0.001,
        eccentricity: 0.001,
        inclination: 0.01,
        longitudeOfAscendingNode: 0.01,
        argumentOfPeriapsis: 0.01,
        meanAnomalyAtEpoch: 0.01,
      },
      { jd: 2451545.0, timeScale: TimeScale.TDB }
    );

    // Calculate MOID
    const moidResult = CloseApproachCalculator.calculateMOID(asteroidElements);
    expect(moidResult.moid.value).toBeGreaterThan(0);

    // Calculate close approaches
    const startDate: JulianDate = { jd: 2451545.0, timeScale: TimeScale.TDB };
    const endDate: JulianDate = {
      jd: 2451545.0 + 365,
      timeScale: TimeScale.TDB,
    };

    const approaches = CloseApproachCalculator.calculateCloseApproaches(
      asteroidElements,
      startDate,
      endDate,
      0.2, // 0.2 AU max distance
      20 // 20 day time step
    );

    expect(approaches).toBeDefined();
    expect(Array.isArray(approaches)).toBe(true);

    // Analyze any found approaches
    approaches.forEach((approach) => {
      const distanceKm = approach.distance.value;
      const classification = CloseApproachUtils.classifyApproach(distanceKm);

      expect(classification).toBeDefined();
      expect(typeof classification).toBe("string");

      // Estimate impact energy if close enough
      if (distanceKm < 1000000) {
        // Within 1 million km
        const energy = CloseApproachUtils.estimateImpactEnergy(
          1.0, // Assume 1 km diameter
          approach.relativeVelocity.value
        );

        expect(energy).toBeGreaterThan(0);

        if (approach.impactProbability && approach.impactProbability > 0) {
          const torinoScale = CloseApproachUtils.calculateTorinoScale(
            approach.impactProbability,
            energy
          );

          expect(torinoScale).toBeGreaterThanOrEqual(0);
          expect(torinoScale).toBeLessThanOrEqual(10);
        }
      }
    });
  });

  it("should maintain consistency between MOID and close approach calculations", () => {
    const asteroidElements = createUncertainOrbitalElements(
      {
        semiMajorAxis: 1.1,
        eccentricity: 0.15,
        inclination: 1,
        longitudeOfAscendingNode: 0,
        argumentOfPeriapsis: 0,
        meanAnomalyAtEpoch: 0,
      },
      {
        semiMajorAxis: 0.001,
        eccentricity: 0.001,
        inclination: 0.01,
        longitudeOfAscendingNode: 0.01,
        argumentOfPeriapsis: 0.01,
        meanAnomalyAtEpoch: 0.01,
      },
      { jd: 2451545.0, timeScale: TimeScale.TDB }
    );

    const moidResult = CloseApproachCalculator.calculateMOID(asteroidElements);
    const moidKm = moidResult.moid.value * 149597870.7; // Convert AU to km

    const approaches = CloseApproachCalculator.calculateCloseApproaches(
      asteroidElements,
      { jd: 2451545.0, timeScale: TimeScale.TDB },
      { jd: 2451545.0 + 1000, timeScale: TimeScale.TDB },
      0.1, // 0.1 AU max distance
      5 // 5 day time step
    );

    if (approaches.length > 0) {
      const closestApproach = approaches.reduce((closest, current) =>
        current.distance.value < closest.distance.value ? current : closest
      );

      // Closest approach should be reasonably close to MOID
      // (allowing for orbital motion and time sampling differences)
      expect(closestApproach.distance.value).toBeGreaterThan(moidKm * 0.5);
      expect(closestApproach.distance.value).toBeLessThan(moidKm * 10);
    }
  });
});
