/**
 * Unit Conversion and Validation System
 * Provides comprehensive unit conversion with dimensional analysis validation
 */

import { UncertaintyValue } from "./constants";

/**
 * Supported unit types for dimensional analysis
 */
export enum UnitType {
  LENGTH = "LENGTH",
  TIME = "TIME",
  MASS = "MASS",
  ENERGY = "ENERGY",
  VELOCITY = "VELOCITY",
  ACCELERATION = "ACCELERATION",
  FORCE = "FORCE",
  PRESSURE = "PRESSURE",
  TEMPERATURE = "TEMPERATURE",
  ANGLE = "ANGLE",
  DIMENSIONLESS = "DIMENSIONLESS",
}

/**
 * Unit definition with conversion factor to base unit
 */
export interface UnitDefinition {
  name: string;
  symbol: string;
  type: UnitType;
  toBaseUnit: number; // Conversion factor to base unit
  baseUnit: string; // Base unit for this type
  description?: string;
}

/**
 * Comprehensive unit database
 */
export const UNIT_DEFINITIONS: Record<string, UnitDefinition> = {
  // Length units (base: meter)
  m: {
    name: "meter",
    symbol: "m",
    type: UnitType.LENGTH,
    toBaseUnit: 1,
    baseUnit: "m",
    description: "SI base unit of length",
  },
  km: {
    name: "kilometer",
    symbol: "km",
    type: UnitType.LENGTH,
    toBaseUnit: 1000,
    baseUnit: "m",
    description: "Kilometer (1000 meters)",
  },
  cm: {
    name: "centimeter",
    symbol: "cm",
    type: UnitType.LENGTH,
    toBaseUnit: 0.01,
    baseUnit: "m",
    description: "Centimeter (0.01 meters)",
  },
  mm: {
    name: "millimeter",
    symbol: "mm",
    type: UnitType.LENGTH,
    toBaseUnit: 0.001,
    baseUnit: "m",
    description: "Millimeter (0.001 meters)",
  },
  AU: {
    name: "astronomical unit",
    symbol: "AU",
    type: UnitType.LENGTH,
    toBaseUnit: 149597870700, // meters
    baseUnit: "m",
    description: "Astronomical unit (mean Earth-Sun distance)",
  },
  ly: {
    name: "light year",
    symbol: "ly",
    type: UnitType.LENGTH,
    toBaseUnit: 9.4607304725808e15, // meters
    baseUnit: "m",
    description: "Light year (distance light travels in one year)",
  },

  // Time units (base: second)
  s: {
    name: "second",
    symbol: "s",
    type: UnitType.TIME,
    toBaseUnit: 1,
    baseUnit: "s",
    description: "SI base unit of time",
  },
  min: {
    name: "minute",
    symbol: "min",
    type: UnitType.TIME,
    toBaseUnit: 60,
    baseUnit: "s",
    description: "Minute (60 seconds)",
  },
  h: {
    name: "hour",
    symbol: "h",
    type: UnitType.TIME,
    toBaseUnit: 3600,
    baseUnit: "s",
    description: "Hour (3600 seconds)",
  },
  day: {
    name: "day",
    symbol: "day",
    type: UnitType.TIME,
    toBaseUnit: 86400,
    baseUnit: "s",
    description: "Day (86400 seconds)",
  },
  year: {
    name: "year",
    symbol: "year",
    type: UnitType.TIME,
    toBaseUnit: 31557600, // Julian year (365.25 days)
    baseUnit: "s",
    description: "Julian year (365.25 days)",
  },

  // Mass units (base: kilogram)
  kg: {
    name: "kilogram",
    symbol: "kg",
    type: UnitType.MASS,
    toBaseUnit: 1,
    baseUnit: "kg",
    description: "SI base unit of mass",
  },
  g: {
    name: "gram",
    symbol: "g",
    type: UnitType.MASS,
    toBaseUnit: 0.001,
    baseUnit: "kg",
    description: "Gram (0.001 kg)",
  },
  t: {
    name: "metric ton",
    symbol: "t",
    type: UnitType.MASS,
    toBaseUnit: 1000,
    baseUnit: "kg",
    description: "Metric ton (1000 kg)",
  },

  // Energy units (base: joule)
  J: {
    name: "joule",
    symbol: "J",
    type: UnitType.ENERGY,
    toBaseUnit: 1,
    baseUnit: "J",
    description: "SI unit of energy",
  },
  kJ: {
    name: "kilojoule",
    symbol: "kJ",
    type: UnitType.ENERGY,
    toBaseUnit: 1000,
    baseUnit: "J",
    description: "Kilojoule (1000 J)",
  },
  MJ: {
    name: "megajoule",
    symbol: "MJ",
    type: UnitType.ENERGY,
    toBaseUnit: 1e6,
    baseUnit: "J",
    description: "Megajoule (10^6 J)",
  },
  GJ: {
    name: "gigajoule",
    symbol: "GJ",
    type: UnitType.ENERGY,
    toBaseUnit: 1e9,
    baseUnit: "J",
    description: "Gigajoule (10^9 J)",
  },
  TJ: {
    name: "terajoule",
    symbol: "TJ",
    type: UnitType.ENERGY,
    toBaseUnit: 1e12,
    baseUnit: "J",
    description: "Terajoule (10^12 J)",
  },
  "kt TNT": {
    name: "kiloton TNT equivalent",
    symbol: "kt TNT",
    type: UnitType.ENERGY,
    toBaseUnit: 4.184e12, // joules
    baseUnit: "J",
    description: "Kiloton TNT equivalent (4.184 × 10^12 J)",
  },
  "Mt TNT": {
    name: "megaton TNT equivalent",
    symbol: "Mt TNT",
    type: UnitType.ENERGY,
    toBaseUnit: 4.184e15, // joules
    baseUnit: "J",
    description: "Megaton TNT equivalent (4.184 × 10^15 J)",
  },
  eV: {
    name: "electron volt",
    symbol: "eV",
    type: UnitType.ENERGY,
    toBaseUnit: 1.602176634e-19, // joules
    baseUnit: "J",
    description: "Electron volt",
  },

  // Velocity units (base: m/s)
  "m/s": {
    name: "meter per second",
    symbol: "m/s",
    type: UnitType.VELOCITY,
    toBaseUnit: 1,
    baseUnit: "m/s",
    description: "SI unit of velocity",
  },
  "km/s": {
    name: "kilometer per second",
    symbol: "km/s",
    type: UnitType.VELOCITY,
    toBaseUnit: 1000,
    baseUnit: "m/s",
    description: "Kilometer per second",
  },
  "km/h": {
    name: "kilometer per hour",
    symbol: "km/h",
    type: UnitType.VELOCITY,
    toBaseUnit: 1000 / 3600,
    baseUnit: "m/s",
    description: "Kilometer per hour",
  },

  // Acceleration units (base: m/s²)
  "m/s²": {
    name: "meter per second squared",
    symbol: "m/s²",
    type: UnitType.ACCELERATION,
    toBaseUnit: 1,
    baseUnit: "m/s²",
    description: "SI unit of acceleration",
  },
  "km/s²": {
    name: "kilometer per second squared",
    symbol: "km/s²",
    type: UnitType.ACCELERATION,
    toBaseUnit: 1000,
    baseUnit: "m/s²",
    description: "Kilometer per second squared",
  },

  // Pressure units (base: pascal)
  Pa: {
    name: "pascal",
    symbol: "Pa",
    type: UnitType.PRESSURE,
    toBaseUnit: 1,
    baseUnit: "Pa",
    description: "SI unit of pressure",
  },
  kPa: {
    name: "kilopascal",
    symbol: "kPa",
    type: UnitType.PRESSURE,
    toBaseUnit: 1000,
    baseUnit: "Pa",
    description: "Kilopascal (1000 Pa)",
  },
  MPa: {
    name: "megapascal",
    symbol: "MPa",
    type: UnitType.PRESSURE,
    toBaseUnit: 1e6,
    baseUnit: "Pa",
    description: "Megapascal (10^6 Pa)",
  },
  GPa: {
    name: "gigapascal",
    symbol: "GPa",
    type: UnitType.PRESSURE,
    toBaseUnit: 1e9,
    baseUnit: "Pa",
    description: "Gigapascal (10^9 Pa)",
  },
  atm: {
    name: "atmosphere",
    symbol: "atm",
    type: UnitType.PRESSURE,
    toBaseUnit: 101325,
    baseUnit: "Pa",
    description: "Standard atmosphere (101325 Pa)",
  },

  // Temperature units (base: kelvin)
  K: {
    name: "kelvin",
    symbol: "K",
    type: UnitType.TEMPERATURE,
    toBaseUnit: 1,
    baseUnit: "K",
    description: "SI base unit of temperature",
  },

  // Angle units (base: radian)
  rad: {
    name: "radian",
    symbol: "rad",
    type: UnitType.ANGLE,
    toBaseUnit: 1,
    baseUnit: "rad",
    description: "SI unit of angle",
  },
  deg: {
    name: "degree",
    symbol: "deg",
    type: UnitType.ANGLE,
    toBaseUnit: Math.PI / 180,
    baseUnit: "rad",
    description: "Degree (π/180 radians)",
  },
  arcmin: {
    name: "arcminute",
    symbol: "arcmin",
    type: UnitType.ANGLE,
    toBaseUnit: Math.PI / (180 * 60),
    baseUnit: "rad",
    description: "Arcminute (1/60 degree)",
  },
  arcsec: {
    name: "arcsecond",
    symbol: "arcsec",
    type: UnitType.ANGLE,
    toBaseUnit: Math.PI / (180 * 3600),
    baseUnit: "rad",
    description: "Arcsecond (1/3600 degree)",
  },

  // Dimensionless
  "1": {
    name: "dimensionless",
    symbol: "1",
    type: UnitType.DIMENSIONLESS,
    toBaseUnit: 1,
    baseUnit: "1",
    description: "Dimensionless quantity",
  },
};

/**
 * Unit conversion error types
 */
export class UnitConversionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnitConversionError";
  }
}

export class DimensionalAnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DimensionalAnalysisError";
  }
}

/**
 * Unit converter class with validation
 */
export class UnitConverter {
  /**
   * Convert a value from one unit to another
   */
  static convert(value: number, fromUnit: string, toUnit: string): number {
    const fromDef = UNIT_DEFINITIONS[fromUnit];
    const toDef = UNIT_DEFINITIONS[toUnit];

    if (!fromDef) {
      throw new UnitConversionError(`Unknown unit: ${fromUnit}`);
    }
    if (!toDef) {
      throw new UnitConversionError(`Unknown unit: ${toUnit}`);
    }

    // Check dimensional compatibility
    if (fromDef.type !== toDef.type) {
      throw new DimensionalAnalysisError(
        `Cannot convert ${fromDef.type} to ${toDef.type}: incompatible dimensions`
      );
    }

    // Convert: value * (fromUnit to base) / (toUnit to base)
    return (value * fromDef.toBaseUnit) / toDef.toBaseUnit;
  }

  /**
   * Convert an UncertaintyValue from one unit to another
   */
  static convertUncertaintyValue(
    uncertaintyValue: UncertaintyValue,
    toUnit: string
  ): UncertaintyValue {
    const conversionFactor = this.getConversionFactor(
      uncertaintyValue.unit,
      toUnit
    );

    return new UncertaintyValue(
      uncertaintyValue.value * conversionFactor,
      uncertaintyValue.uncertainty * conversionFactor,
      toUnit,
      uncertaintyValue.source,
      uncertaintyValue.description
    );
  }

  /**
   * Get conversion factor between two units
   */
  static getConversionFactor(fromUnit: string, toUnit: string): number {
    return this.convert(1, fromUnit, toUnit);
  }

  /**
   * Validate that a unit exists and return its definition
   */
  static validateUnit(unit: string): UnitDefinition {
    const definition = UNIT_DEFINITIONS[unit];
    if (!definition) {
      throw new UnitConversionError(`Unknown unit: ${unit}`);
    }
    return definition;
  }

  /**
   * Check if two units are dimensionally compatible
   */
  static areCompatible(unit1: string, unit2: string): boolean {
    try {
      const def1 = this.validateUnit(unit1);
      const def2 = this.validateUnit(unit2);
      return def1.type === def2.type;
    } catch {
      return false;
    }
  }

  /**
   * Get all units of a specific type
   */
  static getUnitsOfType(type: UnitType): UnitDefinition[] {
    return Object.values(UNIT_DEFINITIONS).filter((def) => def.type === type);
  }

  /**
   * Format a value with its unit
   */
  static formatValue(
    value: number,
    unit: string,
    precision: number = 3
  ): string {
    const definition = this.validateUnit(unit);
    return `${value.toPrecision(precision)} ${definition.symbol}`;
  }

  /**
   * Format an UncertaintyValue with its unit
   */
  static formatUncertaintyValue(
    uncertaintyValue: UncertaintyValue,
    precision: number = 3
  ): string {
    const definition = this.validateUnit(uncertaintyValue.unit);
    if (uncertaintyValue.uncertainty === 0) {
      return `${uncertaintyValue.value.toPrecision(precision)} ${
        definition.symbol
      } (exact)`;
    }
    return `${uncertaintyValue.value.toPrecision(
      precision
    )} ± ${uncertaintyValue.uncertainty.toPrecision(precision)} ${
      definition.symbol
    }`;
  }
}

/**
 * Convenience functions for common conversions
 */
export const UnitConversions = {
  // Length conversions
  metersToKilometers: (m: number) => UnitConverter.convert(m, "m", "km"),
  kilometersToMeters: (km: number) => UnitConverter.convert(km, "km", "m"),
  metersToAU: (m: number) => UnitConverter.convert(m, "m", "AU"),
  auToMeters: (au: number) => UnitConverter.convert(au, "AU", "m"),
  auToKilometers: (au: number) => UnitConverter.convert(au, "AU", "km"),
  kilometersToAU: (km: number) => UnitConverter.convert(km, "km", "AU"),

  // Time conversions
  secondsToMinutes: (s: number) => UnitConverter.convert(s, "s", "min"),
  minutesToSeconds: (min: number) => UnitConverter.convert(min, "min", "s"),
  secondsToHours: (s: number) => UnitConverter.convert(s, "s", "h"),
  hoursToSeconds: (h: number) => UnitConverter.convert(h, "h", "s"),
  secondsToDays: (s: number) => UnitConverter.convert(s, "s", "day"),
  daysToSeconds: (days: number) => UnitConverter.convert(days, "day", "s"),
  secondsToYears: (s: number) => UnitConverter.convert(s, "s", "year"),
  yearsToSeconds: (years: number) => UnitConverter.convert(years, "year", "s"),

  // Energy conversions
  joulesToMegatonsTNT: (j: number) => UnitConverter.convert(j, "J", "Mt TNT"),
  megatonsTNTToJoules: (mt: number) => UnitConverter.convert(mt, "Mt TNT", "J"),
  joulesToKilotonsTNT: (j: number) => UnitConverter.convert(j, "J", "kt TNT"),
  kilotonsTNTToJoules: (kt: number) => UnitConverter.convert(kt, "kt TNT", "J"),

  // Velocity conversions
  msToKms: (ms: number) => UnitConverter.convert(ms, "m/s", "km/s"),
  kmsToMs: (kms: number) => UnitConverter.convert(kms, "km/s", "m/s"),
  kmhToMs: (kmh: number) => UnitConverter.convert(kmh, "km/h", "m/s"),
  msToKmh: (ms: number) => UnitConverter.convert(ms, "m/s", "km/h"),

  // Angle conversions
  degreesToRadians: (deg: number) => UnitConverter.convert(deg, "deg", "rad"),
  radiansToDegrees: (rad: number) => UnitConverter.convert(rad, "rad", "deg"),
  arcsecondsToRadians: (arcsec: number) =>
    UnitConverter.convert(arcsec, "arcsec", "rad"),
  radiansToArcseconds: (rad: number) =>
    UnitConverter.convert(rad, "rad", "arcsec"),
};

/**
 * Get a list of all supported units
 */
export function getSupportedUnits(): string[] {
  return Object.keys(UNIT_DEFINITIONS);
}

/**
 * Get unit information
 */
export function getUnitInfo(unit: string): UnitDefinition | null {
  return UNIT_DEFINITIONS[unit] || null;
}
