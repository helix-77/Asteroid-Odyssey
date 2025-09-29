import { describe, it, expect } from "vitest";
import {
  UncertaintyValue,
  PHYSICAL_CONSTANTS,
  DERIVED_CONSTANTS,
  ALL_CONSTANTS,
  getConstant,
  listConstants,
} from "../constants";

describe("UncertaintyValue", () => {
  it("should create a valid uncertainty value", () => {
    const value = new UncertaintyValue(9.80665, 0, "m/s²", "Test");
    expect(value.value).toBe(9.80665);
    expect(value.uncertainty).toBe(0);
    expect(value.unit).toBe("m/s²");
    expect(value.source).toBe("Test");
  });

  it("should throw error for negative uncertainty", () => {
    expect(() => {
      new UncertaintyValue(1.0, -0.1, "m", "Test");
    }).toThrow("Uncertainty must be non-negative");
  });

  it("should calculate relative uncertainty correctly", () => {
    const value = new UncertaintyValue(100, 5, "m", "Test");
    expect(value.relativeUncertainty).toBe(0.05);
    expect(value.relativeUncertaintyPercent).toBe(5);
  });

  it("should handle zero value for relative uncertainty", () => {
    const value = new UncertaintyValue(0, 1, "m", "Test");
    expect(value.relativeUncertainty).toBe(0);
  });

  it("should format toString correctly", () => {
    const exactValue = new UncertaintyValue(299792458, 0, "m/s", "Test");
    const uncertainValue = new UncertaintyValue(
      6.6743e-11,
      1.5e-15,
      "m³ kg⁻¹ s⁻²",
      "Test"
    );

    expect(exactValue.toString()).toBe("299792458 m/s (exact)");
    expect(uncertainValue.toString()).toBe("6.6743e-11 ± 1.5e-15 m³ kg⁻¹ s⁻²");
  });

  it("should create copy with different unit", () => {
    const kmValue = new UncertaintyValue(1, 0.001, "km", "Test");
    const mValue = kmValue.withUnit("m", 1000);

    expect(mValue.value).toBe(1000);
    expect(mValue.uncertainty).toBe(1);
    expect(mValue.unit).toBe("m");
    expect(mValue.source).toBe("Test");
  });
});

describe("Physical Constants Validation", () => {
  it("should have correct speed of light (exact)", () => {
    const c = PHYSICAL_CONSTANTS.SPEED_OF_LIGHT;
    expect(c.value).toBe(299792458);
    expect(c.uncertainty).toBe(0);
    expect(c.unit).toBe("m/s");
    expect(c.source).toBe("CODATA 2018");
  });

  it("should have correct gravitational constant", () => {
    const G = PHYSICAL_CONSTANTS.GRAVITATIONAL_CONSTANT;
    expect(G.value).toBe(6.6743e-11);
    expect(G.uncertainty).toBe(1.5e-15);
    expect(G.unit).toBe("m³ kg⁻¹ s⁻²");
    expect(G.source).toBe("CODATA 2018");
  });

  it("should have correct astronomical unit (exact)", () => {
    const AU = PHYSICAL_CONSTANTS.ASTRONOMICAL_UNIT;
    expect(AU.value).toBe(149597870.7);
    expect(AU.uncertainty).toBe(0);
    expect(AU.unit).toBe("km");
    expect(AU.source).toBe("IAU 2012 Resolution B2");
  });

  it("should have correct Earth mass", () => {
    const earthMass = PHYSICAL_CONSTANTS.EARTH_MASS;
    expect(earthMass.value).toBe(5.9722e24);
    expect(earthMass.uncertainty).toBe(6e20);
    expect(earthMass.unit).toBe("kg");
    expect(earthMass.source).toBe("IAU 2015 Resolution B3");
  });

  it("should have correct Earth equatorial radius", () => {
    const earthRadius = PHYSICAL_CONSTANTS.EARTH_EQUATORIAL_RADIUS;
    expect(earthRadius.value).toBe(6378137.0);
    expect(earthRadius.uncertainty).toBe(0);
    expect(earthRadius.unit).toBe("m");
    expect(earthRadius.source).toBe("WGS84/GRS80");
  });

  it("should have correct standard gravity", () => {
    const g = PHYSICAL_CONSTANTS.STANDARD_GRAVITY;
    expect(g.value).toBe(9.80665);
    expect(g.uncertainty).toBe(0);
    expect(g.unit).toBe("m/s²");
    expect(g.source).toBe("CGPM 1901");
  });
});

describe("Derived Constants Validation", () => {
  it("should have reasonable Earth orbital velocity", () => {
    const v = DERIVED_CONSTANTS.EARTH_ORBITAL_VELOCITY;
    expect(v.value).toBeCloseTo(29.78, 2);
    expect(v.unit).toBe("km/s");
    // Should be approximately 2πAU/year
    const expectedVelocity = (2 * Math.PI * 149597870.7) / (365.25 * 24 * 3600);
    expect(v.value).toBeCloseTo(expectedVelocity, 1);
  });

  it("should have correct Earth escape velocity", () => {
    const vEsc = DERIVED_CONSTANTS.EARTH_ESCAPE_VELOCITY;
    expect(vEsc.value).toBeCloseTo(11.18, 3);
    expect(vEsc.unit).toBe("km/s");

    // Verify calculation: v_esc = sqrt(2GM/R)
    const G = PHYSICAL_CONSTANTS.GRAVITATIONAL_CONSTANT.value;
    const M = PHYSICAL_CONSTANTS.EARTH_MASS.value;
    const R = PHYSICAL_CONSTANTS.EARTH_EQUATORIAL_RADIUS.value;
    const expectedVelocity = Math.sqrt((2 * G * M) / R) / 1000; // Convert to km/s
    expect(vEsc.value).toBeCloseTo(expectedVelocity, 1);
  });

  it("should have correct energy conversion factors", () => {
    const jToMt = DERIVED_CONSTANTS.JOULE_TO_MEGATON_TNT;
    const mtToJ = DERIVED_CONSTANTS.MEGATON_TNT_TO_JOULE;

    // These should be reciprocals
    expect(jToMt.value * mtToJ.value).toBeCloseTo(1, 5);

    // 1 Mt TNT = 4.184 × 10^15 J (by definition)
    expect(mtToJ.value).toBe(4.184e15);
    expect(jToMt.value).toBeCloseTo(1 / 4.184e15, 20);
  });
});

describe("Constant Access Functions", () => {
  it("should get constant by name", () => {
    const c = getConstant("SPEED_OF_LIGHT");
    expect(c.value).toBe(299792458);
    expect(c.unit).toBe("m/s");
  });

  it("should throw error for unknown constant", () => {
    expect(() => {
      // @ts-expect-error Testing invalid constant name
      getConstant("UNKNOWN_CONSTANT");
    }).toThrow("Unknown constant: UNKNOWN_CONSTANT");
  });

  it("should list all constants", () => {
    const constants = listConstants();
    expect(constants.length).toBeGreaterThan(0);

    // Check that all constants are included
    const constantNames = constants.map((c) => c.name);
    expect(constantNames).toContain("SPEED_OF_LIGHT");
    expect(constantNames).toContain("GRAVITATIONAL_CONSTANT");
    expect(constantNames).toContain("EARTH_MASS");
    expect(constantNames).toContain("EARTH_ORBITAL_VELOCITY");
  });

  it("should have all constants accessible through ALL_CONSTANTS", () => {
    expect(ALL_CONSTANTS.SPEED_OF_LIGHT).toBeDefined();
    expect(ALL_CONSTANTS.GRAVITATIONAL_CONSTANT).toBeDefined();
    expect(ALL_CONSTANTS.EARTH_ORBITAL_VELOCITY).toBeDefined();
  });
});

describe("Scientific Accuracy Validation", () => {
  it("should have uncertainties that are scientifically reasonable", () => {
    // Gravitational constant has known large relative uncertainty
    const G = PHYSICAL_CONSTANTS.GRAVITATIONAL_CONSTANT;
    expect(G.relativeUncertaintyPercent).toBeCloseTo(2.2e-3, 1);

    // Earth mass uncertainty should be reasonable
    const earthMass = PHYSICAL_CONSTANTS.EARTH_MASS;
    expect(earthMass.relativeUncertaintyPercent).toBeLessThan(0.02);

    // Exact constants should have zero uncertainty
    const c = PHYSICAL_CONSTANTS.SPEED_OF_LIGHT;
    expect(c.uncertainty).toBe(0);

    const AU = PHYSICAL_CONSTANTS.ASTRONOMICAL_UNIT;
    expect(AU.uncertainty).toBe(0);
  });

  it("should have proper source attribution", () => {
    const constants = listConstants();

    constants.forEach(({ value }) => {
      expect(value.source).toBeTruthy();
      expect(typeof value.source).toBe("string");
      expect(value.source.length).toBeGreaterThan(0);
    });
  });

  it("should have consistent units", () => {
    // Mass units should be kg
    expect(PHYSICAL_CONSTANTS.EARTH_MASS.unit).toBe("kg");
    expect(PHYSICAL_CONSTANTS.SOLAR_MASS.unit).toBe("kg");

    // Distance units should be consistent
    expect(PHYSICAL_CONSTANTS.EARTH_EQUATORIAL_RADIUS.unit).toBe("m");
    expect(PHYSICAL_CONSTANTS.ASTRONOMICAL_UNIT.unit).toBe("km");

    // Velocity units should be consistent
    expect(DERIVED_CONSTANTS.EARTH_ORBITAL_VELOCITY.unit).toBe("km/s");
    expect(DERIVED_CONSTANTS.EARTH_ESCAPE_VELOCITY.unit).toBe("km/s");
  });
});

describe("Edge Cases and Error Handling", () => {
  it("should handle zero values correctly", () => {
    const zeroValue = new UncertaintyValue(0, 0.1, "m", "Test");
    expect(zeroValue.relativeUncertainty).toBe(0);
    expect(zeroValue.toString()).toBe("0 ± 0.1 m");
  });

  it("should handle very small uncertainties", () => {
    const preciseValue = new UncertaintyValue(1.0, 1e-15, "m", "Test");
    expect(preciseValue.relativeUncertainty).toBe(1e-15);
    expect(preciseValue.toString()).toContain("1e-15");
  });

  it("should handle large values correctly", () => {
    const largeValue = new UncertaintyValue(1e30, 1e26, "kg", "Test");
    expect(largeValue.relativeUncertaintyPercent).toBeCloseTo(0.01, 2);
  });
});
