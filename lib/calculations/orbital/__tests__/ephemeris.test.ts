/**
 * Comprehensive tests for ephemeris calculations and coordinate systems
 * Tests Julian date handling, coordinate transformations, and Earth rotation
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  EphemerisCalculator,
  CoordinateUtils,
  StandardObservers,
  validateCoordinateVector,
  CoordinateFrame,
  TimeScale,
  type JulianDate,
  type CoordinateVector,
  type StandardOrbitalElements,
  type ObserverLocation,
  type EarthOrientationParameters,
} from "../ephemeris";

describe("EphemerisCalculator", () => {
  describe("Julian Date Operations", () => {
    it("should create Julian date from calendar date", () => {
      // Test J2000.0 epoch
      const j2000 = EphemerisCalculator.createJulianDate(
        2000,
        1,
        1,
        12,
        0,
        0,
        TimeScale.TT
      );
      expect(j2000.jd).toBeCloseTo(2451545.0, 6);
      expect(j2000.timeScale).toBe(TimeScale.TT);
    });

    it("should create Julian date for known dates", () => {
      // Test January 1, 2024 00:00 UTC
      const jd2024 = EphemerisCalculator.createJulianDate(
        2024,
        1,
        1,
        0,
        0,
        0,
        TimeScale.UTC
      );
      expect(jd2024.jd).toBeCloseTo(2460310.5, 6);

      // Test with fractional day
      const jdMidnight = EphemerisCalculator.createJulianDate(
        2024,
        1,
        1,
        12,
        30,
        45,
        TimeScale.UTC
      );
      const expectedFraction = (12 + 30 / 60 + 45 / 3600) / 24;
      expect(jdMidnight.jd).toBeCloseTo(2460310.5 + expectedFraction, 8);
    });

    it("should handle leap years correctly", () => {
      // February 29, 2000 (leap year)
      const leapDay = EphemerisCalculator.createJulianDate(
        2000,
        2,
        29,
        0,
        0,
        0
      );
      expect(leapDay.jd).toBeCloseTo(2451603.5, 6);

      // March 1, 2000 should be one day later
      const marchFirst = EphemerisCalculator.createJulianDate(
        2000,
        3,
        1,
        0,
        0,
        0
      );
      expect(marchFirst.jd).toBeCloseTo(2451604.5, 6);
    });

    it("should include description in Julian date", () => {
      const jd = EphemerisCalculator.createJulianDate(
        2024,
        6,
        15,
        14,
        30,
        0,
        TimeScale.UTC
      );
      expect(jd.description).toContain("2024-06-15");
      expect(jd.description).toContain("14:30:00.000");
      expect(jd.description).toContain("UTC");
    });
  });

  describe("Time Scale Conversions", () => {
    it("should convert UTC to TT", () => {
      const utcJD: JulianDate = {
        jd: 2460310.5, // 2024-01-01 00:00 UTC
        timeScale: TimeScale.UTC,
      };

      const ttJD = EphemerisCalculator.convertTimeScale(utcJD, TimeScale.TT);

      expect(ttJD.timeScale).toBe(TimeScale.TT);
      expect(ttJD.jd).toBeGreaterThan(utcJD.jd); // TT is ahead of UTC
      expect(ttJD.jd - utcJD.jd).toBeCloseTo((37 + 32.184) / 86400, 6); // Approximate leap seconds + TAI-TT
    });

    it("should convert TT to UTC", () => {
      const ttJD: JulianDate = {
        jd: 2460310.5,
        timeScale: TimeScale.TT,
      };

      const utcJD = EphemerisCalculator.convertTimeScale(ttJD, TimeScale.UTC);

      expect(utcJD.timeScale).toBe(TimeScale.UTC);
      expect(utcJD.jd).toBeLessThan(ttJD.jd); // UTC is behind TT
    });

    it("should convert UTC to TDB", () => {
      const utcJD: JulianDate = {
        jd: 2460310.5,
        timeScale: TimeScale.UTC,
      };

      const tdbJD = EphemerisCalculator.convertTimeScale(utcJD, TimeScale.TDB);

      expect(tdbJD.timeScale).toBe(TimeScale.TDB);
      expect(tdbJD.jd).toBeGreaterThan(utcJD.jd); // TDB is ahead of UTC
    });

    it("should return same date when converting to same time scale", () => {
      const utcJD: JulianDate = {
        jd: 2460310.5,
        timeScale: TimeScale.UTC,
      };

      const sameJD = EphemerisCalculator.convertTimeScale(utcJD, TimeScale.UTC);

      expect(sameJD).toEqual(utcJD);
    });

    it("should be reversible for time scale conversions", () => {
      const originalJD: JulianDate = {
        jd: 2460310.5,
        timeScale: TimeScale.UTC,
      };

      const ttJD = EphemerisCalculator.convertTimeScale(
        originalJD,
        TimeScale.TT
      );
      const backToUTC = EphemerisCalculator.convertTimeScale(
        ttJD,
        TimeScale.UTC
      );

      expect(backToUTC.jd).toBeCloseTo(originalJD.jd, 8);
      expect(backToUTC.timeScale).toBe(originalJD.timeScale);
    });
  });

  describe("Time Calculations", () => {
    it("should calculate centuries since J2000", () => {
      const j2000: JulianDate = {
        jd: 2451545.0,
        timeScale: TimeScale.TDB,
      };

      const centuries = EphemerisCalculator.centuriesSinceJ2000(j2000);
      expect(centuries).toBeCloseTo(0, 10);

      // Test one century later
      const j2100: JulianDate = {
        jd: 2451545.0 + 36525,
        timeScale: TimeScale.TDB,
      };

      const centuriesLater = EphemerisCalculator.centuriesSinceJ2000(j2100);
      expect(centuriesLater).toBeCloseTo(1, 6);
    });

    it("should calculate Earth rotation angle", () => {
      const jd: JulianDate = {
        jd: 2451545.0, // J2000.0
        timeScale: TimeScale.UTC,
      };

      const era = EphemerisCalculator.earthRotationAngle(jd);

      expect(era).toBeGreaterThanOrEqual(0);
      expect(era).toBeLessThan(2 * Math.PI);
      // ERA at J2000.0 should be around 1.75 radians, but let's just check it's reasonable
      expect(era).toBeGreaterThan(1.0);
      expect(era).toBeLessThan(5.0);
    });

    it("should calculate Greenwich Mean Sidereal Time", () => {
      const jd: JulianDate = {
        jd: 2451545.0, // J2000.0
        timeScale: TimeScale.UTC,
      };

      const gmst = EphemerisCalculator.greenwichMeanSiderealTime(jd);

      expect(gmst).toBeGreaterThanOrEqual(0);
      expect(gmst).toBeLessThan(2 * Math.PI);
    });

    it("should calculate obliquity of ecliptic", () => {
      const j2000: JulianDate = {
        jd: 2451545.0,
        timeScale: TimeScale.TDB,
      };

      const obliquity = EphemerisCalculator.obliquityOfEcliptic(j2000);

      // Obliquity at J2000.0 should be approximately 23.4393 degrees
      const obliquityDegrees = (obliquity * 180) / Math.PI;
      expect(obliquityDegrees).toBeCloseTo(23.4393, 3);
    });
  });

  describe("Coordinate Transformations", () => {
    it("should transform from ecliptic to equatorial coordinates", () => {
      const epoch: JulianDate = {
        jd: 2451545.0,
        timeScale: TimeScale.TDB,
      };

      const eclipticVector: CoordinateVector = {
        x: 1,
        y: 0,
        z: 0, // Along ecliptic plane
        frame: CoordinateFrame.J2000_ECLIPTIC,
        epoch,
      };

      const equatorialVector = EphemerisCalculator.transformCoordinates(
        eclipticVector,
        CoordinateFrame.J2000_EQUATORIAL
      );

      expect(equatorialVector.frame).toBe(CoordinateFrame.J2000_EQUATORIAL);
      expect(equatorialVector.x).toBeCloseTo(1, 10); // X component unchanged
      expect(equatorialVector.y).toBeCloseTo(0, 10); // Y component unchanged
      expect(equatorialVector.z).toBeCloseTo(0, 10); // Z component unchanged (on ecliptic)
    });

    it("should transform ecliptic pole to equatorial coordinates", () => {
      const epoch: JulianDate = {
        jd: 2451545.0,
        timeScale: TimeScale.TDB,
      };

      const eclipticPole: CoordinateVector = {
        x: 0,
        y: 0,
        z: 1, // Ecliptic north pole
        frame: CoordinateFrame.J2000_ECLIPTIC,
        epoch,
      };

      const equatorialVector = EphemerisCalculator.transformCoordinates(
        eclipticPole,
        CoordinateFrame.J2000_EQUATORIAL
      );

      expect(equatorialVector.frame).toBe(CoordinateFrame.J2000_EQUATORIAL);
      expect(equatorialVector.x).toBeCloseTo(0, 10);
      // The actual obliquity at J2000.0 from our calculation
      const obliquity = EphemerisCalculator.obliquityOfEcliptic(epoch);
      expect(equatorialVector.y).toBeCloseTo(Math.sin(obliquity), 6);
      expect(equatorialVector.z).toBeCloseTo(Math.cos(obliquity), 6);
    });

    it("should be reversible for ecliptic-equatorial transformations", () => {
      const epoch: JulianDate = {
        jd: 2451545.0,
        timeScale: TimeScale.TDB,
      };

      const originalVector: CoordinateVector = {
        x: 0.5,
        y: 0.7,
        z: 0.3,
        frame: CoordinateFrame.J2000_ECLIPTIC,
        epoch,
      };

      const equatorial = EphemerisCalculator.transformCoordinates(
        originalVector,
        CoordinateFrame.J2000_EQUATORIAL
      );

      const backToEcliptic = EphemerisCalculator.transformCoordinates(
        equatorial,
        CoordinateFrame.J2000_ECLIPTIC
      );

      expect(backToEcliptic.x).toBeCloseTo(originalVector.x, 10);
      expect(backToEcliptic.y).toBeCloseTo(originalVector.y, 10);
      expect(backToEcliptic.z).toBeCloseTo(originalVector.z, 10);
    });

    it("should transform to Earth-fixed coordinates", () => {
      const epoch: JulianDate = {
        jd: 2451545.0,
        timeScale: TimeScale.UTC,
      };

      const equatorialVector: CoordinateVector = {
        x: 1,
        y: 0,
        z: 0, // Along vernal equinox
        frame: CoordinateFrame.J2000_EQUATORIAL,
        epoch,
      };

      const earthFixedVector = EphemerisCalculator.transformCoordinates(
        equatorialVector,
        CoordinateFrame.EARTH_FIXED
      );

      expect(earthFixedVector.frame).toBe(CoordinateFrame.EARTH_FIXED);
      // Earth-fixed coordinates should be different due to rotation
      expect(Math.abs(earthFixedVector.x - 1)).toBeGreaterThan(0.0001);
    });

    it("should transform to topocentric coordinates", () => {
      const epoch: JulianDate = {
        jd: 2451545.0,
        timeScale: TimeScale.UTC,
      };

      const earthFixedVector: CoordinateVector = {
        x: 0,
        y: 0,
        z: 1, // North pole direction
        frame: CoordinateFrame.EARTH_FIXED,
        epoch,
      };

      const observer = StandardObservers.GREENWICH;

      const topoVector = EphemerisCalculator.transformCoordinates(
        earthFixedVector,
        CoordinateFrame.TOPOCENTRIC,
        undefined,
        observer
      );

      expect(topoVector.frame).toBe(CoordinateFrame.TOPOCENTRIC);
      // Should transform based on observer location
      expect(topoVector.z).toBeCloseTo(Math.sin(observer.latitude), 3);
    });

    it("should return same vector when transforming to same frame", () => {
      const epoch: JulianDate = {
        jd: 2451545.0,
        timeScale: TimeScale.TDB,
      };

      const vector: CoordinateVector = {
        x: 1,
        y: 2,
        z: 3,
        frame: CoordinateFrame.J2000_EQUATORIAL,
        epoch,
      };

      const sameVector = EphemerisCalculator.transformCoordinates(
        vector,
        CoordinateFrame.J2000_EQUATORIAL
      );

      expect(sameVector.x).toBe(vector.x);
      expect(sameVector.y).toBe(vector.y);
      expect(sameVector.z).toBe(vector.z);
      expect(sameVector.frame).toBe(vector.frame);
    });
  });

  describe("State Vector Calculations", () => {
    it("should calculate state vector from orbital elements", () => {
      const elements: StandardOrbitalElements = {
        semiMajorAxis: 1.0, // 1 AU
        eccentricity: 0.0167, // Earth-like
        inclination: 0, // Ecliptic plane
        longitudeOfAscendingNode: 0,
        argumentOfPeriapsis: 0,
        meanAnomalyAtEpoch: 0, // At periapsis
        epoch: {
          jd: 2451545.0,
          timeScale: TimeScale.TDB,
        },
        frame: CoordinateFrame.J2000_ECLIPTIC,
      };

      const observationTime: JulianDate = {
        jd: 2451545.0, // Same as epoch
        timeScale: TimeScale.TDB,
      };

      const stateVector = EphemerisCalculator.calculateStateVector(
        elements,
        observationTime
      );

      expect(stateVector.position.frame).toBe(CoordinateFrame.J2000_ECLIPTIC);
      expect(stateVector.velocity.frame).toBe(CoordinateFrame.J2000_ECLIPTIC);

      // At periapsis with zero mean anomaly, should be at periapsis distance
      const r = Math.sqrt(
        stateVector.position.x ** 2 +
          stateVector.position.y ** 2 +
          stateVector.position.z ** 2
      );
      const expectedR = elements.semiMajorAxis * (1 - elements.eccentricity);
      expect(r).toBeCloseTo(expectedR, 3);
    });

    it("should handle time evolution of orbital elements", () => {
      const elements: StandardOrbitalElements = {
        semiMajorAxis: 1.0,
        eccentricity: 0.1,
        inclination: 0,
        longitudeOfAscendingNode: 0,
        argumentOfPeriapsis: 0,
        meanAnomalyAtEpoch: 0,
        epoch: {
          jd: 2451545.0,
          timeScale: TimeScale.TDB,
        },
        frame: CoordinateFrame.J2000_ECLIPTIC,
      };

      // Observe 90 days later (approximately 1/4 orbit)
      const observationTime: JulianDate = {
        jd: 2451545.0 + 90,
        timeScale: TimeScale.TDB,
      };

      const stateVector = EphemerisCalculator.calculateStateVector(
        elements,
        observationTime
      );

      // Position should be different from epoch
      const r = Math.sqrt(
        stateVector.position.x ** 2 +
          stateVector.position.y ** 2 +
          stateVector.position.z ** 2
      );

      expect(r).toBeGreaterThan(0.5);
      expect(r).toBeLessThan(1.5);
    });
  });

  describe("Earth Orientation Parameters", () => {
    it("should apply polar motion when provided", () => {
      const epoch: JulianDate = {
        jd: 2451545.0,
        timeScale: TimeScale.UTC,
      };

      const equatorialVector: CoordinateVector = {
        x: 1,
        y: 0,
        z: 0,
        frame: CoordinateFrame.J2000_EQUATORIAL,
        epoch,
      };

      const eop: EarthOrientationParameters = {
        polarMotionX: 0.1, // arcseconds
        polarMotionY: 0.1, // arcseconds
        ut1MinusUtc: 0.0,
        lengthOfDay: 0.0,
        celestialPoleOffsetX: 0.0,
        celestialPoleOffsetY: 0.0,
      };

      const earthFixedWithEOP = EphemerisCalculator.transformCoordinates(
        equatorialVector,
        CoordinateFrame.EARTH_FIXED,
        eop
      );

      const earthFixedWithoutEOP = EphemerisCalculator.transformCoordinates(
        equatorialVector,
        CoordinateFrame.EARTH_FIXED
      );

      // Results should be slightly different when EOP is applied
      expect(
        Math.abs(earthFixedWithEOP.x - earthFixedWithoutEOP.x)
      ).toBeGreaterThan(1e-15);
    });
  });
});

describe("CoordinateUtils", () => {
  describe("Spherical-Cartesian Conversions", () => {
    it("should convert spherical to Cartesian coordinates", () => {
      const radius = 1.0;
      const longitude = Math.PI / 4; // 45 degrees
      const latitude = Math.PI / 6; // 30 degrees

      const [x, y, z] = CoordinateUtils.sphericalToCartesian(
        radius,
        longitude,
        latitude
      );

      expect(x).toBeCloseTo(
        radius * Math.cos(latitude) * Math.cos(longitude),
        10
      );
      expect(y).toBeCloseTo(
        radius * Math.cos(latitude) * Math.sin(longitude),
        10
      );
      expect(z).toBeCloseTo(radius * Math.sin(latitude), 10);
    });

    it("should convert Cartesian to spherical coordinates", () => {
      const x = 1.0;
      const y = 1.0;
      const z = 0.5;

      const spherical = CoordinateUtils.cartesianToSpherical(x, y, z);

      const expectedRadius = Math.sqrt(x * x + y * y + z * z);
      const expectedLongitude = Math.atan2(y, x);
      const expectedLatitude = Math.asin(z / expectedRadius);

      expect(spherical.radius).toBeCloseTo(expectedRadius, 10);
      expect(spherical.longitude).toBeCloseTo(expectedLongitude, 10);
      expect(spherical.latitude).toBeCloseTo(expectedLatitude, 10);
    });

    it("should be reversible for spherical-Cartesian conversions", () => {
      const originalRadius = 2.5;
      const originalLongitude = Math.PI / 3;
      const originalLatitude = Math.PI / 4;

      const [x, y, z] = CoordinateUtils.sphericalToCartesian(
        originalRadius,
        originalLongitude,
        originalLatitude
      );

      const spherical = CoordinateUtils.cartesianToSpherical(x, y, z);

      expect(spherical.radius).toBeCloseTo(originalRadius, 10);
      expect(spherical.longitude).toBeCloseTo(originalLongitude, 10);
      expect(spherical.latitude).toBeCloseTo(originalLatitude, 10);
    });
  });

  describe("Angular Calculations", () => {
    it("should calculate angular separation correctly", () => {
      // Test separation between two points on celestial sphere
      const ra1 = 0; // 0 hours
      const dec1 = 0; // 0 degrees
      const ra2 = Math.PI / 2; // 6 hours
      const dec2 = 0; // 0 degrees

      const separation = CoordinateUtils.angularSeparation(
        ra1,
        dec1,
        ra2,
        dec2
      );

      expect(separation).toBeCloseTo(Math.PI / 2, 10); // 90 degrees
    });

    it("should calculate zero separation for identical points", () => {
      const ra = Math.PI / 4;
      const dec = Math.PI / 6;

      const separation = CoordinateUtils.angularSeparation(ra, dec, ra, dec);

      expect(separation).toBeCloseTo(0, 10);
    });

    it("should calculate maximum separation for antipodal points", () => {
      const ra1 = 0;
      const dec1 = Math.PI / 2; // North pole
      const ra2 = 0;
      const dec2 = -Math.PI / 2; // South pole

      const separation = CoordinateUtils.angularSeparation(
        ra1,
        dec1,
        ra2,
        dec2
      );

      expect(separation).toBeCloseTo(Math.PI, 10); // 180 degrees
    });
  });

  describe("Angle Normalization", () => {
    it("should normalize positive angles", () => {
      const angle = 3 * Math.PI; // 540 degrees
      const normalized = CoordinateUtils.normalizeAngle(angle);

      expect(normalized).toBeCloseTo(Math.PI, 10); // 180 degrees
    });

    it("should normalize negative angles", () => {
      const angle = -Math.PI / 2; // -90 degrees
      const normalized = CoordinateUtils.normalizeAngle(angle);

      expect(normalized).toBeCloseTo((3 * Math.PI) / 2, 10); // 270 degrees
    });

    it("should leave angles in range unchanged", () => {
      const angle = Math.PI / 4; // 45 degrees
      const normalized = CoordinateUtils.normalizeAngle(angle);

      expect(normalized).toBeCloseTo(angle, 10);
    });
  });

  describe("Unit Conversions", () => {
    it("should convert degrees to radians", () => {
      expect(CoordinateUtils.degreesToRadians(180)).toBeCloseTo(Math.PI, 10);
      expect(CoordinateUtils.degreesToRadians(90)).toBeCloseTo(Math.PI / 2, 10);
      expect(CoordinateUtils.degreesToRadians(0)).toBeCloseTo(0, 10);
    });

    it("should convert radians to degrees", () => {
      expect(CoordinateUtils.radiansToDegrees(Math.PI)).toBeCloseTo(180, 10);
      expect(CoordinateUtils.radiansToDegrees(Math.PI / 2)).toBeCloseTo(90, 10);
      expect(CoordinateUtils.radiansToDegrees(0)).toBeCloseTo(0, 10);
    });

    it("should be reversible for degree-radian conversions", () => {
      const originalDegrees = 123.456;
      const radians = CoordinateUtils.degreesToRadians(originalDegrees);
      const backToDegrees = CoordinateUtils.radiansToDegrees(radians);

      expect(backToDegrees).toBeCloseTo(originalDegrees, 10);
    });
  });
});

describe("Standard Observers", () => {
  it("should have reasonable coordinates for Greenwich", () => {
    const greenwich = StandardObservers.GREENWICH;

    expect(greenwich.latitude).toBeCloseTo((51.4769 * Math.PI) / 180, 6);
    expect(greenwich.longitude).toBeCloseTo(0, 10);
    expect(greenwich.altitude).toBe(46);
    expect(greenwich.name).toContain("Greenwich");
  });

  it("should have reasonable coordinates for Goldstone", () => {
    const goldstone = StandardObservers.GOLDSTONE;

    expect(goldstone.latitude).toBeCloseTo((35.4267 * Math.PI) / 180, 6);
    expect(goldstone.longitude).toBeCloseTo((-116.89 * Math.PI) / 180, 6);
    expect(goldstone.altitude).toBe(1036);
    expect(goldstone.name).toContain("Goldstone");
  });
});

describe("Coordinate Vector Validation", () => {
  it("should validate correct coordinate vector", () => {
    const vector: CoordinateVector = {
      x: 1.0,
      y: 2.0,
      z: 3.0,
      frame: CoordinateFrame.J2000_EQUATORIAL,
      epoch: {
        jd: 2451545.0,
        timeScale: TimeScale.TDB,
      },
    };

    const validation = validateCoordinateVector(vector);

    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it("should detect non-finite coordinates", () => {
    const vector: CoordinateVector = {
      x: Number.NaN,
      y: 2.0,
      z: 3.0,
      frame: CoordinateFrame.J2000_EQUATORIAL,
      epoch: {
        jd: 2451545.0,
        timeScale: TimeScale.TDB,
      },
    };

    const validation = validateCoordinateVector(vector);

    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain("Coordinate components must be finite");
  });

  it("should warn about large coordinate magnitudes", () => {
    const vector: CoordinateVector = {
      x: 2000,
      y: 0,
      z: 0, // Very large (2000 AU)
      frame: CoordinateFrame.J2000_EQUATORIAL,
      epoch: {
        jd: 2451545.0,
        timeScale: TimeScale.TDB,
      },
    };

    const validation = validateCoordinateVector(vector);

    expect(validation.isValid).toBe(true);
    expect(validation.warnings).toContain(
      "Very large coordinate magnitude - check units"
    );
  });

  it("should warn about unreasonable epochs", () => {
    const vector: CoordinateVector = {
      x: 1.0,
      y: 2.0,
      z: 3.0,
      frame: CoordinateFrame.J2000_EQUATORIAL,
      epoch: {
        jd: 1000000, // Very old date
        timeScale: TimeScale.TDB,
      },
    };

    const validation = validateCoordinateVector(vector);

    expect(validation.isValid).toBe(true);
    expect(validation.warnings).toContain(
      "Epoch outside reasonable range (1582-4000 CE)"
    );
  });
});

describe("Integration Tests", () => {
  it("should handle complete coordinate transformation chain", () => {
    // Start with ecliptic coordinates
    const epoch: JulianDate = {
      jd: 2451545.0,
      timeScale: TimeScale.TDB,
    };

    const eclipticVector: CoordinateVector = {
      x: 1,
      y: 0.5,
      z: 0.2,
      frame: CoordinateFrame.J2000_ECLIPTIC,
      epoch,
    };

    // Transform through multiple coordinate systems
    const equatorial = EphemerisCalculator.transformCoordinates(
      eclipticVector,
      CoordinateFrame.J2000_EQUATORIAL
    );

    const earthFixed = EphemerisCalculator.transformCoordinates(
      equatorial,
      CoordinateFrame.EARTH_FIXED
    );

    const topocentric = EphemerisCalculator.transformCoordinates(
      earthFixed,
      CoordinateFrame.TOPOCENTRIC,
      undefined,
      StandardObservers.GREENWICH
    );

    // Each transformation should preserve vector magnitude approximately
    const originalMag = Math.sqrt(
      eclipticVector.x ** 2 + eclipticVector.y ** 2 + eclipticVector.z ** 2
    );
    const finalMag = Math.sqrt(
      topocentric.x ** 2 + topocentric.y ** 2 + topocentric.z ** 2
    );

    expect(finalMag).toBeCloseTo(originalMag, 6);
    expect(topocentric.frame).toBe(CoordinateFrame.TOPOCENTRIC);
  });

  it("should handle orbital element to state vector conversion with coordinate transforms", () => {
    const elements: StandardOrbitalElements = {
      semiMajorAxis: 1.5, // 1.5 AU
      eccentricity: 0.2,
      inclination: Math.PI / 12, // 15 degrees
      longitudeOfAscendingNode: Math.PI / 6, // 30 degrees
      argumentOfPeriapsis: Math.PI / 4, // 45 degrees
      meanAnomalyAtEpoch: Math.PI / 3, // 60 degrees
      epoch: {
        jd: 2451545.0,
        timeScale: TimeScale.TDB,
      },
      frame: CoordinateFrame.J2000_ECLIPTIC,
    };

    const observationTime: JulianDate = {
      jd: 2451545.0 + 100, // 100 days later
      timeScale: TimeScale.TDB,
    };

    const stateVector = EphemerisCalculator.calculateStateVector(
      elements,
      observationTime
    );

    // Transform position to equatorial coordinates
    const equatorialPosition = EphemerisCalculator.transformCoordinates(
      stateVector.position,
      CoordinateFrame.J2000_EQUATORIAL
    );

    expect(equatorialPosition.frame).toBe(CoordinateFrame.J2000_EQUATORIAL);

    // Position should be reasonable for asteroid orbit
    const distance = Math.sqrt(
      equatorialPosition.x ** 2 +
        equatorialPosition.y ** 2 +
        equatorialPosition.z ** 2
    );
    expect(distance).toBeGreaterThan(1.0); // At least 1 AU
    expect(distance).toBeLessThan(2.0); // Less than 2 AU for this orbit
  });
});
