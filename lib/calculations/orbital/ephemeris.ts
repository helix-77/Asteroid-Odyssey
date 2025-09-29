/**
 * Enhanced Ephemeris Calculations with Proper Coordinate Systems
 * Implements J2000.0 ecliptic coordinates, coordinate transformations,
 * Julian date handling, and Earth rotation effects
 */

import { UncertaintyValue, PHYSICAL_CONSTANTS } from "../../physics/constants";
import { UnitConverter } from "../../physics/units";

/**
 * Supported coordinate reference frames
 */
export enum CoordinateFrame {
  J2000_ECLIPTIC = "J2000_ECLIPTIC",
  J2000_EQUATORIAL = "J2000_EQUATORIAL",
  EARTH_FIXED = "EARTH_FIXED",
  TOPOCENTRIC = "TOPOCENTRIC",
}

/**
 * Time scale types
 */
export enum TimeScale {
  UTC = "UTC", // Coordinated Universal Time
  TDB = "TDB", // Barycentric Dynamical Time
  TT = "TT", // Terrestrial Time
  TAI = "TAI", // International Atomic Time
}

/**
 * 3D vector with coordinate frame information
 */
export interface CoordinateVector {
  x: number;
  y: number;
  z: number;
  frame: CoordinateFrame;
  epoch: JulianDate;
  uncertainty?: {
    x: number;
    y: number;
    z: number;
  };
}

/**
 * Julian date with time scale information
 */
export interface JulianDate {
  jd: number;
  timeScale: TimeScale;
  description?: string;
}

/**
 * Orbital elements in standard format
 */
export interface StandardOrbitalElements {
  semiMajorAxis: number; // AU
  eccentricity: number;
  inclination: number; // radians
  longitudeOfAscendingNode: number; // radians (Ω)
  argumentOfPeriapsis: number; // radians (ω)
  meanAnomalyAtEpoch: number; // radians
  epoch: JulianDate;
  frame: CoordinateFrame;
}

/**
 * Earth orientation parameters
 */
export interface EarthOrientationParameters {
  polarMotionX: number; // arcseconds
  polarMotionY: number; // arcseconds
  ut1MinusUtc: number; // seconds
  lengthOfDay: number; // milliseconds
  celestialPoleOffsetX: number; // milliarcseconds
  celestialPoleOffsetY: number; // milliarcseconds
}

/**
 * Observer location for topocentric coordinates
 */
export interface ObserverLocation {
  latitude: number; // radians
  longitude: number; // radians
  altitude: number; // meters above sea level
  name?: string;
}

/**
 * Coordinate transformation matrix (3x3)
 */
export type TransformationMatrix = [
  [number, number, number],
  [number, number, number],
  [number, number, number]
];

/**
 * Enhanced ephemeris calculator with proper coordinate systems
 */
export class EphemerisCalculator {
  private static readonly J2000_EPOCH = 2451545.0; // Julian date of J2000.0
  private static readonly SECONDS_PER_DAY = 86400.0;
  private static readonly ARCSEC_TO_RAD = Math.PI / (180 * 3600);
  private static readonly MILLIARCSEC_TO_RAD = Math.PI / (180 * 3600 * 1000);

  /**
   * Create Julian date from calendar date
   */
  static createJulianDate(
    year: number,
    month: number,
    day: number,
    hour: number = 0,
    minute: number = 0,
    second: number = 0,
    timeScale: TimeScale = TimeScale.UTC
  ): JulianDate {
    // Julian date calculation (Meeus algorithm)
    let a = Math.floor((14 - month) / 12);
    let y = year + 4800 - a;
    let m = month + 12 * a - 3;

    let jdn =
      day +
      Math.floor((153 * m + 2) / 5) +
      365 * y +
      Math.floor(y / 4) -
      Math.floor(y / 100) +
      Math.floor(y / 400) -
      32045;

    let dayFraction = (hour + minute / 60 + second / 3600) / 24;
    let jd = jdn + dayFraction - 0.5;

    return {
      jd,
      timeScale,
      description: `${year}-${month.toString().padStart(2, "0")}-${day
        .toString()
        .padStart(2, "0")} ${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}:${second.toFixed(3).padStart(6, "0")} ${timeScale}`,
    };
  }

  /**
   * Convert between time scales
   */
  static convertTimeScale(jd: JulianDate, targetScale: TimeScale): JulianDate {
    if (jd.timeScale === targetScale) {
      return jd;
    }

    let convertedJD = jd.jd;

    // Simplified time scale conversions (for full accuracy, use IERS data)
    switch (jd.timeScale) {
      case TimeScale.UTC:
        if (targetScale === TimeScale.TT) {
          // UTC to TT: add leap seconds + 32.184s
          const leapSeconds = this.getLeapSeconds(jd.jd); // Approximate
          convertedJD += (leapSeconds + 32.184) / this.SECONDS_PER_DAY;
        } else if (targetScale === TimeScale.TDB) {
          // UTC to TDB via TT (simplified)
          const leapSeconds = this.getLeapSeconds(jd.jd);
          const ttJD = jd.jd + (leapSeconds + 32.184) / this.SECONDS_PER_DAY;
          convertedJD = ttJD + this.getTDBMinusTT(ttJD) / this.SECONDS_PER_DAY;
        }
        break;

      case TimeScale.TT:
        if (targetScale === TimeScale.UTC) {
          const leapSeconds = this.getLeapSeconds(jd.jd);
          convertedJD -= (leapSeconds + 32.184) / this.SECONDS_PER_DAY;
        } else if (targetScale === TimeScale.TDB) {
          convertedJD += this.getTDBMinusTT(jd.jd) / this.SECONDS_PER_DAY;
        }
        break;

      case TimeScale.TDB:
        if (targetScale === TimeScale.TT) {
          convertedJD -= this.getTDBMinusTT(jd.jd) / this.SECONDS_PER_DAY;
        } else if (targetScale === TimeScale.UTC) {
          const ttJD = jd.jd - this.getTDBMinusTT(jd.jd) / this.SECONDS_PER_DAY;
          const leapSeconds = this.getLeapSeconds(ttJD);
          convertedJD = ttJD - (leapSeconds + 32.184) / this.SECONDS_PER_DAY;
        }
        break;
    }

    return {
      jd: convertedJD,
      timeScale: targetScale,
      description: `Converted from ${jd.timeScale} to ${targetScale}`,
    };
  }

  /**
   * Calculate centuries since J2000.0
   */
  static centuriesSinceJ2000(jd: JulianDate): number {
    const tdbJD = this.convertTimeScale(jd, TimeScale.TDB);
    return (tdbJD.jd - this.J2000_EPOCH) / 36525.0;
  }

  /**
   * Calculate Earth's rotation angle (ERA)
   */
  static earthRotationAngle(jd: JulianDate): number {
    const ut1JD = this.convertTimeScale(jd, TimeScale.UTC); // Simplified: assume UTC ≈ UT1
    const t = ut1JD.jd - this.J2000_EPOCH;

    // Earth Rotation Angle (IAU 2000)
    const era = 2 * Math.PI * (0.779057273264 + 1.00273781191135448 * t);

    // Normalize to [0, 2π]
    return era - 2 * Math.PI * Math.floor(era / (2 * Math.PI));
  }

  /**
   * Calculate Greenwich Mean Sidereal Time
   */
  static greenwichMeanSiderealTime(jd: JulianDate): number {
    const ut1JD = this.convertTimeScale(jd, TimeScale.UTC);
    const t = (ut1JD.jd - this.J2000_EPOCH) / 36525.0;

    // GMST at 0h UT1 (IAU 2006)
    const gmst0 =
      24110.54841 + 8640184.812866 * t + 0.093104 * t * t - 6.2e-6 * t * t * t;

    // Add time since 0h UT1
    const dayFraction = ut1JD.jd - Math.floor(ut1JD.jd - 0.5) - 0.5;
    const gmst = gmst0 + 86400.0 * 1.00273790935 * dayFraction;

    // Convert to radians and normalize
    const gmstRad = ((gmst / 3600.0) * (Math.PI / 180.0)) / 15.0;
    return gmstRad - 2 * Math.PI * Math.floor(gmstRad / (2 * Math.PI));
  }

  /**
   * Calculate obliquity of the ecliptic
   */
  static obliquityOfEcliptic(jd: JulianDate): number {
    const t = this.centuriesSinceJ2000(jd);

    // Mean obliquity (IAU 2006)
    const epsilon0 =
      (84381.406 -
        46.836769 * t -
        0.0001831 * t * t +
        0.0020034 * t * t * t -
        0.000000576 * t * t * t * t -
        0.0000000434 * t * t * t * t * t) *
      this.ARCSEC_TO_RAD;

    return epsilon0;
  }

  /**
   * Transform coordinates between reference frames
   */
  static transformCoordinates(
    vector: CoordinateVector,
    targetFrame: CoordinateFrame,
    eop?: EarthOrientationParameters,
    observer?: ObserverLocation
  ): CoordinateVector {
    if (vector.frame === targetFrame) {
      return { ...vector };
    }

    const matrix = this.getTransformationMatrix(
      vector.frame,
      targetFrame,
      vector.epoch,
      eop,
      observer
    );

    const transformed = this.applyTransformation(matrix, [
      vector.x,
      vector.y,
      vector.z,
    ]);

    return {
      x: transformed[0],
      y: transformed[1],
      z: transformed[2],
      frame: targetFrame,
      epoch: vector.epoch,
      uncertainty: vector.uncertainty
        ? {
            x: vector.uncertainty.x, // Simplified: should transform uncertainty properly
            y: vector.uncertainty.y,
            z: vector.uncertainty.z,
          }
        : undefined,
    };
  }

  /**
   * Get transformation matrix between coordinate frames
   */
  private static getTransformationMatrix(
    fromFrame: CoordinateFrame,
    toFrame: CoordinateFrame,
    epoch: JulianDate,
    eop?: EarthOrientationParameters,
    observer?: ObserverLocation
  ): TransformationMatrix {
    // Identity matrix
    let matrix: TransformationMatrix = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];

    // Chain transformations as needed
    if (
      fromFrame === CoordinateFrame.J2000_ECLIPTIC &&
      toFrame === CoordinateFrame.J2000_EQUATORIAL
    ) {
      matrix = this.eclipticToEquatorialMatrix(epoch);
    } else if (
      fromFrame === CoordinateFrame.J2000_EQUATORIAL &&
      toFrame === CoordinateFrame.J2000_ECLIPTIC
    ) {
      matrix = this.transposeMatrix(this.eclipticToEquatorialMatrix(epoch));
    } else if (
      fromFrame === CoordinateFrame.J2000_EQUATORIAL &&
      toFrame === CoordinateFrame.EARTH_FIXED
    ) {
      matrix = this.equatorialToEarthFixedMatrix(epoch, eop);
    } else if (
      fromFrame === CoordinateFrame.EARTH_FIXED &&
      toFrame === CoordinateFrame.J2000_EQUATORIAL
    ) {
      matrix = this.transposeMatrix(
        this.equatorialToEarthFixedMatrix(epoch, eop)
      );
    } else if (toFrame === CoordinateFrame.TOPOCENTRIC && observer) {
      // First transform to Earth-fixed if needed
      let intermediateMatrix = matrix;
      if (fromFrame !== CoordinateFrame.EARTH_FIXED) {
        const toEarthFixed = this.getTransformationMatrix(
          fromFrame,
          CoordinateFrame.EARTH_FIXED,
          epoch,
          eop
        );
        intermediateMatrix = this.multiplyMatrices(toEarthFixed, matrix);
      }

      const topoMatrix = this.earthFixedToTopocentricMatrix(observer);
      matrix = this.multiplyMatrices(topoMatrix, intermediateMatrix);
    }

    return matrix;
  }

  /**
   * Ecliptic to equatorial transformation matrix
   */
  private static eclipticToEquatorialMatrix(
    epoch: JulianDate
  ): TransformationMatrix {
    const epsilon = this.obliquityOfEcliptic(epoch);
    const cosEps = Math.cos(epsilon);
    const sinEps = Math.sin(epsilon);

    return [
      [1, 0, 0],
      [0, cosEps, sinEps],
      [0, -sinEps, cosEps],
    ];
  }

  /**
   * Equatorial to Earth-fixed transformation matrix
   */
  private static equatorialToEarthFixedMatrix(
    epoch: JulianDate,
    eop?: EarthOrientationParameters
  ): TransformationMatrix {
    const gmst = this.greenwichMeanSiderealTime(epoch);
    const cosGmst = Math.cos(gmst);
    const sinGmst = Math.sin(gmst);

    // Basic rotation matrix (ignoring polar motion and nutation for simplicity)
    let matrix: TransformationMatrix = [
      [cosGmst, sinGmst, 0],
      [-sinGmst, cosGmst, 0],
      [0, 0, 1],
    ];

    // Apply polar motion if EOP data available
    if (eop) {
      const xp = eop.polarMotionX * this.ARCSEC_TO_RAD;
      const yp = eop.polarMotionY * this.ARCSEC_TO_RAD;

      const polarMotionMatrix: TransformationMatrix = [
        [Math.cos(xp), 0, -Math.sin(xp)],
        [
          Math.sin(xp) * Math.sin(yp),
          Math.cos(yp),
          Math.cos(xp) * Math.sin(yp),
        ],
        [
          Math.sin(xp) * Math.cos(yp),
          -Math.sin(yp),
          Math.cos(xp) * Math.cos(yp),
        ],
      ];

      matrix = this.multiplyMatrices(polarMotionMatrix, matrix);
    }

    return matrix;
  }

  /**
   * Earth-fixed to topocentric transformation matrix
   */
  private static earthFixedToTopocentricMatrix(
    observer: ObserverLocation
  ): TransformationMatrix {
    const lat = observer.latitude;
    const lon = observer.longitude;

    const cosLat = Math.cos(lat);
    const sinLat = Math.sin(lat);
    const cosLon = Math.cos(lon);
    const sinLon = Math.sin(lon);

    return [
      [-sinLon, cosLon, 0],
      [-sinLat * cosLon, -sinLat * sinLon, cosLat],
      [cosLat * cosLon, cosLat * sinLon, sinLat],
    ];
  }

  /**
   * Apply transformation matrix to vector
   */
  private static applyTransformation(
    matrix: TransformationMatrix,
    vector: [number, number, number]
  ): [number, number, number] {
    return [
      matrix[0][0] * vector[0] +
        matrix[0][1] * vector[1] +
        matrix[0][2] * vector[2],
      matrix[1][0] * vector[0] +
        matrix[1][1] * vector[1] +
        matrix[1][2] * vector[2],
      matrix[2][0] * vector[0] +
        matrix[2][1] * vector[1] +
        matrix[2][2] * vector[2],
    ];
  }

  /**
   * Multiply two 3x3 matrices
   */
  private static multiplyMatrices(
    a: TransformationMatrix,
    b: TransformationMatrix
  ): TransformationMatrix {
    const result: TransformationMatrix = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        for (let k = 0; k < 3; k++) {
          result[i][j] += a[i][k] * b[k][j];
        }
      }
    }

    return result;
  }

  /**
   * Transpose a 3x3 matrix
   */
  private static transposeMatrix(
    matrix: TransformationMatrix
  ): TransformationMatrix {
    return [
      [matrix[0][0], matrix[1][0], matrix[2][0]],
      [matrix[0][1], matrix[1][1], matrix[2][1]],
      [matrix[0][2], matrix[1][2], matrix[2][2]],
    ];
  }

  /**
   * Calculate position and velocity from orbital elements
   */
  static calculateStateVector(
    elements: StandardOrbitalElements,
    observationTime: JulianDate
  ): { position: CoordinateVector; velocity: CoordinateVector } {
    // Convert observation time to same time scale as epoch
    const obsTime = this.convertTimeScale(
      observationTime,
      elements.epoch.timeScale
    );

    // Time since epoch in days
    const dt = obsTime.jd - elements.epoch.jd;

    // Mean motion (rad/day)
    const mu = 1.32712440018e20; // m³/s² (Solar gravitational parameter)
    const a_m = elements.semiMajorAxis * 1.496e11; // Convert AU to meters
    const n = Math.sqrt(mu / (a_m * a_m * a_m)) * this.SECONDS_PER_DAY; // rad/day

    // Current mean anomaly
    const M = elements.meanAnomalyAtEpoch + n * dt;

    // Solve Kepler's equation (simplified - should use enhanced solver)
    let E = M;
    for (let i = 0; i < 10; i++) {
      E = M + elements.eccentricity * Math.sin(E);
    }

    // True anomaly
    const cosE = Math.cos(E);
    const sinE = Math.sin(E);
    const cosNu =
      (cosE - elements.eccentricity) / (1 - elements.eccentricity * cosE);
    const sinNu =
      (Math.sqrt(1 - elements.eccentricity * elements.eccentricity) * sinE) /
      (1 - elements.eccentricity * cosE);
    const nu = Math.atan2(sinNu, cosNu);

    // Distance
    const r = elements.semiMajorAxis * (1 - elements.eccentricity * cosE);

    // Position in orbital plane (AU)
    const x_orb = r * Math.cos(nu);
    const y_orb = r * Math.sin(nu);
    const z_orb = 0;

    // Velocity in orbital plane (AU/day)
    const h =
      Math.sqrt(
        mu * a_m * (1 - elements.eccentricity * elements.eccentricity)
      ) / 1.496e11; // AU²/day
    const vx_orb =
      (-(mu / (h * 1.496e11)) * Math.sin(nu) * this.SECONDS_PER_DAY) / 1.496e11; // AU/day
    const vy_orb =
      ((mu / (h * 1.496e11)) *
        (elements.eccentricity + Math.cos(nu)) *
        this.SECONDS_PER_DAY) /
      1.496e11; // AU/day
    const vz_orb = 0;

    // Rotation matrices
    const cosOmega = Math.cos(elements.longitudeOfAscendingNode);
    const sinOmega = Math.sin(elements.longitudeOfAscendingNode);
    const cosomega = Math.cos(elements.argumentOfPeriapsis);
    const sinomega = Math.sin(elements.argumentOfPeriapsis);
    const cosi = Math.cos(elements.inclination);
    const sini = Math.sin(elements.inclination);

    // Transform to reference frame
    const x =
      (cosOmega * cosomega - sinOmega * sinomega * cosi) * x_orb +
      (-cosOmega * sinomega - sinOmega * cosomega * cosi) * y_orb;
    const y =
      (sinOmega * cosomega + cosOmega * sinomega * cosi) * x_orb +
      (-sinOmega * sinomega + cosOmega * cosomega * cosi) * y_orb;
    const z = sinomega * sini * x_orb + cosomega * sini * y_orb;

    const vx =
      (cosOmega * cosomega - sinOmega * sinomega * cosi) * vx_orb +
      (-cosOmega * sinomega - sinOmega * cosomega * cosi) * vy_orb;
    const vy =
      (sinOmega * cosomega + cosOmega * sinomega * cosi) * vx_orb +
      (-sinOmega * sinomega + cosOmega * cosomega * cosi) * vy_orb;
    const vz = sinomega * sini * vx_orb + cosomega * sini * vy_orb;

    return {
      position: {
        x,
        y,
        z,
        frame: elements.frame,
        epoch: obsTime,
      },
      velocity: {
        x: vx,
        y: vy,
        z: vz,
        frame: elements.frame,
        epoch: obsTime,
      },
    };
  }

  /**
   * Get approximate leap seconds (simplified implementation)
   */
  private static getLeapSeconds(jd: number): number {
    // Simplified leap second calculation
    // In practice, this should use IERS data
    if (jd < 2441317.5) return 10; // Before 1972
    if (jd < 2441499.5) return 10; // 1972
    if (jd < 2441683.5) return 11; // 1973
    if (jd < 2442048.5) return 12; // 1974
    if (jd < 2442413.5) return 13; // 1975
    if (jd < 2442778.5) return 14; // 1976
    if (jd < 2443144.5) return 15; // 1977
    if (jd < 2443509.5) return 16; // 1978
    if (jd < 2443874.5) return 17; // 1979
    if (jd < 2444239.5) return 18; // 1980
    if (jd < 2444786.5) return 19; // 1981
    if (jd < 2445151.5) return 20; // 1982
    if (jd < 2445516.5) return 21; // 1983
    if (jd < 2446247.5) return 22; // 1985
    if (jd < 2447161.5) return 23; // 1988
    if (jd < 2447892.5) return 24; // 1990
    if (jd < 2448257.5) return 25; // 1991
    if (jd < 2448804.5) return 26; // 1992
    if (jd < 2449169.5) return 27; // 1993
    if (jd < 2449534.5) return 28; // 1994
    if (jd < 2450083.5) return 29; // 1996
    if (jd < 2450630.5) return 30; // 1997
    if (jd < 2451179.5) return 31; // 1999
    if (jd < 2453736.5) return 32; // 2006
    if (jd < 2454832.5) return 33; // 2009
    if (jd < 2456109.5) return 34; // 2012
    if (jd < 2457204.5) return 35; // 2015
    if (jd < 2457754.5) return 36; // 2017
    return 37; // Current as of 2024
  }

  /**
   * Get TDB - TT in seconds (simplified)
   */
  private static getTDBMinusTT(jd: number): number {
    // Simplified calculation of TDB - TT
    // Full calculation requires planetary ephemeris
    const t = (jd - this.J2000_EPOCH) / 36525.0;
    return (
      0.001657 * Math.sin(628.3076 * t + 6.2401) +
      0.000022 * Math.sin(575.3385 * t + 4.297) +
      0.000014 * Math.sin(1256.6152 * t + 6.1969)
    );
  }
}

/**
 * Utility functions for coordinate system operations
 */
export const CoordinateUtils = {
  /**
   * Convert spherical coordinates to Cartesian
   */
  sphericalToCartesian(
    radius: number,
    longitude: number, // radians
    latitude: number // radians
  ): [number, number, number] {
    const cosLat = Math.cos(latitude);
    return [
      radius * cosLat * Math.cos(longitude),
      radius * cosLat * Math.sin(longitude),
      radius * Math.sin(latitude),
    ];
  },

  /**
   * Convert Cartesian coordinates to spherical
   */
  cartesianToSpherical(
    x: number,
    y: number,
    z: number
  ): { radius: number; longitude: number; latitude: number } {
    const radius = Math.sqrt(x * x + y * y + z * z);
    const longitude = Math.atan2(y, x);
    const latitude = Math.asin(z / radius);

    return { radius, longitude, latitude };
  },

  /**
   * Calculate angular separation between two directions
   */
  angularSeparation(
    ra1: number,
    dec1: number, // radians
    ra2: number,
    dec2: number // radians
  ): number {
    const cosTheta =
      Math.sin(dec1) * Math.sin(dec2) +
      Math.cos(dec1) * Math.cos(dec2) * Math.cos(ra1 - ra2);
    return Math.acos(Math.max(-1, Math.min(1, cosTheta)));
  },

  /**
   * Normalize angle to [0, 2π] range
   */
  normalizeAngle(angle: number): number {
    const twoPi = 2 * Math.PI;
    let normalized = angle % twoPi;
    if (normalized < 0) {
      normalized += twoPi;
    }
    return normalized;
  },

  /**
   * Convert degrees to radians
   */
  degreesToRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  },

  /**
   * Convert radians to degrees
   */
  radiansToDegrees(radians: number): number {
    return (radians * 180) / Math.PI;
  },
};

/**
 * Create standard observer locations
 */
export const StandardObservers = {
  GREENWICH: {
    latitude: (51.4769 * Math.PI) / 180,
    longitude: 0,
    altitude: 46,
    name: "Greenwich Observatory",
  } as ObserverLocation,

  ARECIBO: {
    latitude: (18.3464 * Math.PI) / 180,
    longitude: (-66.7528 * Math.PI) / 180,
    altitude: 497,
    name: "Arecibo Observatory",
  } as ObserverLocation,

  GOLDSTONE: {
    latitude: (35.4267 * Math.PI) / 180,
    longitude: (-116.89 * Math.PI) / 180,
    altitude: 1036,
    name: "Goldstone Deep Space Communications Complex",
  } as ObserverLocation,
};

/**
 * Validate coordinate vector
 */
export function validateCoordinateVector(vector: CoordinateVector): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check for finite values
  if (!isFinite(vector.x) || !isFinite(vector.y) || !isFinite(vector.z)) {
    errors.push("Coordinate components must be finite");
  }

  // Check for reasonable magnitudes
  const magnitude = Math.sqrt(
    vector.x * vector.x + vector.y * vector.y + vector.z * vector.z
  );
  if (magnitude > 1000) {
    // AU
    warnings.push("Very large coordinate magnitude - check units");
  }

  // Check epoch validity
  if (vector.epoch.jd < 2000000 || vector.epoch.jd > 3000000) {
    warnings.push("Epoch outside reasonable range (1582-4000 CE)");
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}
