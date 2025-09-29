/**
 * Scientific Constants Database
 * Based on CODATA 2018 and IAU 2012 recommendations
 * All values include proper uncertainties and source attribution
 */

/**
 * Represents a physical constant with uncertainty and metadata
 */
export class UncertaintyValue {
  constructor(
    public readonly value: number,
    public readonly uncertainty: number,
    public readonly unit: string,
    public readonly source: string,
    public readonly description?: string
  ) {
    if (uncertainty < 0) {
      throw new Error("Uncertainty must be non-negative");
    }
  }

  /**
   * Get the relative uncertainty as a fraction
   */
  get relativeUncertainty(): number {
    return this.value !== 0 ? Math.abs(this.uncertainty / this.value) : 0;
  }

  /**
   * Get the relative uncertainty as a percentage
   */
  get relativeUncertaintyPercent(): number {
    return this.relativeUncertainty * 100;
  }

  /**
   * Format the value with uncertainty in scientific notation
   */
  toString(): string {
    if (this.uncertainty === 0) {
      return `${this.value} ${this.unit} (exact)`;
    }
    return `${this.value} ± ${this.uncertainty} ${this.unit}`;
  }

  /**
   * Create a copy with a different unit (value and uncertainty scaled accordingly)
   */
  withUnit(newUnit: string, conversionFactor: number): UncertaintyValue {
    return new UncertaintyValue(
      this.value * conversionFactor,
      this.uncertainty * conversionFactor,
      newUnit,
      this.source,
      this.description
    );
  }
}

/**
 * CODATA 2018 Physical Constants
 * Source: https://physics.nist.gov/cuu/Constants/
 */
export const PHYSICAL_CONSTANTS = {
  // Fundamental Constants
  SPEED_OF_LIGHT: new UncertaintyValue(
    299792458,
    0,
    "m/s",
    "CODATA 2018",
    "Speed of light in vacuum (exact by definition)"
  ),

  GRAVITATIONAL_CONSTANT: new UncertaintyValue(
    6.6743e-11,
    1.5e-15,
    "m³ kg⁻¹ s⁻²",
    "CODATA 2018",
    "Newtonian constant of gravitation"
  ),

  PLANCK_CONSTANT: new UncertaintyValue(
    6.62607015e-34,
    0,
    "J⋅s",
    "CODATA 2018",
    "Planck constant (exact by definition)"
  ),

  // Astronomical Constants (IAU 2012)
  ASTRONOMICAL_UNIT: new UncertaintyValue(
    149597870.7,
    0,
    "km",
    "IAU 2012 Resolution B2",
    "Astronomical unit (exact by definition)"
  ),

  // Earth Properties (IERS/IAU)
  EARTH_MASS: new UncertaintyValue(
    5.9722e24,
    6e20,
    "kg",
    "IAU 2015 Resolution B3",
    "Mass of Earth"
  ),

  EARTH_EQUATORIAL_RADIUS: new UncertaintyValue(
    6378137.0,
    0,
    "m",
    "WGS84/GRS80",
    "Earth equatorial radius (WGS84 reference ellipsoid)"
  ),

  EARTH_POLAR_RADIUS: new UncertaintyValue(
    6356752.314245,
    0,
    "m",
    "WGS84/GRS80",
    "Earth polar radius (WGS84 reference ellipsoid)"
  ),

  EARTH_MEAN_RADIUS: new UncertaintyValue(
    6371008.8,
    0,
    "m",
    "IUGG",
    "Earth mean radius (volumetric)"
  ),

  // Solar System Properties
  SOLAR_MASS: new UncertaintyValue(
    1.9884e30,
    2e26,
    "kg",
    "IAU 2015 Resolution B3",
    "Mass of the Sun"
  ),

  SOLAR_RADIUS: new UncertaintyValue(
    695700,
    0,
    "km",
    "IAU 2015 Resolution B3",
    "Nominal solar radius"
  ),

  // Physical Constants for Impact Calculations
  STEFAN_BOLTZMANN_CONSTANT: new UncertaintyValue(
    5.670374419e-8,
    0,
    "W m⁻² K⁻⁴",
    "CODATA 2018",
    "Stefan-Boltzmann constant (exact by definition)"
  ),

  BOLTZMANN_CONSTANT: new UncertaintyValue(
    1.380649e-23,
    0,
    "J/K",
    "CODATA 2018",
    "Boltzmann constant (exact by definition)"
  ),

  // Standard Atmosphere
  STANDARD_GRAVITY: new UncertaintyValue(
    9.80665,
    0,
    "m/s²",
    "CGPM 1901",
    "Standard acceleration due to gravity (exact by definition)"
  ),

  STANDARD_ATMOSPHERE: new UncertaintyValue(
    101325,
    0,
    "Pa",
    "ISO 2533",
    "Standard atmospheric pressure (exact by definition)"
  ),

  // Conversion Constants
  ELECTRON_VOLT: new UncertaintyValue(
    1.602176634e-19,
    0,
    "J",
    "CODATA 2018",
    "Electron volt (exact by definition)"
  ),

  ATOMIC_MASS_UNIT: new UncertaintyValue(
    1.6605390666e-27,
    5.0e-37,
    "kg",
    "CODATA 2018",
    "Atomic mass unit"
  ),
} as const;

/**
 * Derived constants commonly used in asteroid impact calculations
 */
export const DERIVED_CONSTANTS = {
  // Earth orbital properties
  EARTH_ORBITAL_VELOCITY: new UncertaintyValue(
    29.78,
    0.01,
    "km/s",
    "Calculated from AU and year",
    "Earth mean orbital velocity"
  ),

  // Escape velocities
  EARTH_ESCAPE_VELOCITY: new UncertaintyValue(
    11.18,
    0.001,
    "km/s",
    "Calculated from Earth mass and radius",
    "Earth escape velocity at surface"
  ),

  SOLAR_ESCAPE_VELOCITY_AT_EARTH: new UncertaintyValue(
    42.1,
    0.1,
    "km/s",
    "Calculated from solar mass and Earth orbit",
    "Solar escape velocity at Earth orbital distance"
  ),

  // Energy conversion factors
  JOULE_TO_MEGATON_TNT: new UncertaintyValue(
    1 / 4.184e15,
    0,
    "Mt TNT/J",
    "Calculated from TNT energy density",
    "Conversion factor from joules to megatons TNT equivalent"
  ),

  MEGATON_TNT_TO_JOULE: new UncertaintyValue(
    4.184e15,
    0,
    "J/(Mt TNT)",
    "Calculated from TNT energy density",
    "Conversion factor from megatons TNT to joules"
  ),
} as const;

/**
 * Get all constants as a flat object for easy access
 */
export const ALL_CONSTANTS = {
  ...PHYSICAL_CONSTANTS,
  ...DERIVED_CONSTANTS,
} as const;

/**
 * Validate that a constant exists and return it
 */
export function getConstant(
  name: keyof typeof ALL_CONSTANTS
): UncertaintyValue {
  const constant = ALL_CONSTANTS[name];
  if (!constant) {
    throw new Error(`Unknown constant: ${name}`);
  }
  return constant;
}

/**
 * List all available constants with their descriptions
 */
export function listConstants(): Array<{
  name: string;
  value: UncertaintyValue;
}> {
  return Object.entries(ALL_CONSTANTS).map(([name, value]) => ({
    name,
    value,
  }));
}
