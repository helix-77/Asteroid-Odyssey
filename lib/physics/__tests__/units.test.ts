import { describe, it, expect } from "vitest";
import {
  UnitConverter,
  UnitConversions,
  UnitType,
  UNIT_DEFINITIONS,
  UnitConversionError,
  DimensionalAnalysisError,
  getSupportedUnits,
  getUnitInfo,
} from "../units";
import { UncertaintyValue } from "../constants";

describe("Unit Definitions", () => {
  it("should have all required base units", () => {
    expect(UNIT_DEFINITIONS["m"]).toBeDefined();
    expect(UNIT_DEFINITIONS["s"]).toBeDefined();
    expect(UNIT_DEFINITIONS["kg"]).toBeDefined();
    expect(UNIT_DEFINITIONS["J"]).toBeDefined();
    expect(UNIT_DEFINITIONS["K"]).toBeDefined();
  });

  it("should have astronomical units", () => {
    expect(UNIT_DEFINITIONS["AU"]).toBeDefined();
    expect(UNIT_DEFINITIONS["AU"].toBaseUnit).toBe(149597870700);
    expect(UNIT_DEFINITIONS["ly"]).toBeDefined();
  });

  it("should have energy units including TNT equivalents", () => {
    expect(UNIT_DEFINITIONS["J"]).toBeDefined();
    expect(UNIT_DEFINITIONS["kt TNT"]).toBeDefined();
    expect(UNIT_DEFINITIONS["Mt TNT"]).toBeDefined();
    expect(UNIT_DEFINITIONS["Mt TNT"].toBaseUnit).toBe(4.184e15);
  });

  it("should have consistent unit types", () => {
    expect(UNIT_DEFINITIONS["m"].type).toBe(UnitType.LENGTH);
    expect(UNIT_DEFINITIONS["km"].type).toBe(UnitType.LENGTH);
    expect(UNIT_DEFINITIONS["AU"].type).toBe(UnitType.LENGTH);

    expect(UNIT_DEFINITIONS["s"].type).toBe(UnitType.TIME);
    expect(UNIT_DEFINITIONS["year"].type).toBe(UnitType.TIME);

    expect(UNIT_DEFINITIONS["J"].type).toBe(UnitType.ENERGY);
    expect(UNIT_DEFINITIONS["Mt TNT"].type).toBe(UnitType.ENERGY);
  });
});

describe("UnitConverter", () => {
  describe("Basic Conversions", () => {
    it("should convert length units correctly", () => {
      expect(UnitConverter.convert(1000, "m", "km")).toBe(1);
      expect(UnitConverter.convert(1, "km", "m")).toBe(1000);
      expect(UnitConverter.convert(1, "AU", "km")).toBeCloseTo(149597870.7, 1);
      expect(UnitConverter.convert(149597870.7, "km", "AU")).toBeCloseTo(1, 10);
    });

    it("should convert time units correctly", () => {
      expect(UnitConverter.convert(60, "s", "min")).toBe(1);
      expect(UnitConverter.convert(1, "min", "s")).toBe(60);
      expect(UnitConverter.convert(3600, "s", "h")).toBe(1);
      expect(UnitConverter.convert(86400, "s", "day")).toBe(1);
      expect(UnitConverter.convert(1, "year", "day")).toBeCloseTo(365.25, 2);
    });

    it("should convert energy units correctly", () => {
      expect(UnitConverter.convert(1000, "J", "kJ")).toBe(1);
      expect(UnitConverter.convert(1, "Mt TNT", "J")).toBe(4.184e15);
      expect(UnitConverter.convert(4.184e15, "J", "Mt TNT")).toBe(1);
      expect(UnitConverter.convert(1000, "kt TNT", "Mt TNT")).toBe(1);
    });

    it("should convert velocity units correctly", () => {
      expect(UnitConverter.convert(1000, "m/s", "km/s")).toBe(1);
      expect(UnitConverter.convert(1, "km/s", "m/s")).toBe(1000);
      expect(UnitConverter.convert(3.6, "km/h", "m/s")).toBeCloseTo(1, 5);
    });

    it("should convert angle units correctly", () => {
      expect(UnitConverter.convert(180, "deg", "rad")).toBeCloseTo(Math.PI, 10);
      expect(UnitConverter.convert(Math.PI, "rad", "deg")).toBeCloseTo(180, 10);
      expect(UnitConverter.convert(60, "arcmin", "deg")).toBe(1);
      expect(UnitConverter.convert(3600, "arcsec", "deg")).toBe(1);
    });
  });

  describe("Error Handling", () => {
    it("should throw error for unknown units", () => {
      expect(() => UnitConverter.convert(1, "unknown", "m")).toThrow(
        UnitConversionError
      );
      expect(() => UnitConverter.convert(1, "m", "unknown")).toThrow(
        UnitConversionError
      );
    });

    it("should throw error for incompatible dimensions", () => {
      expect(() => UnitConverter.convert(1, "m", "s")).toThrow(
        DimensionalAnalysisError
      );
      expect(() => UnitConverter.convert(1, "kg", "J")).toThrow(
        DimensionalAnalysisError
      );
      expect(() => UnitConverter.convert(1, "K", "Pa")).toThrow(
        DimensionalAnalysisError
      );
    });

    it("should provide meaningful error messages", () => {
      expect(() => UnitConverter.convert(1, "xyz", "m")).toThrow(
        "Unknown unit: xyz"
      );
      expect(() => UnitConverter.convert(1, "m", "s")).toThrow(
        "Cannot convert LENGTH to TIME"
      );
    });
  });

  describe("UncertaintyValue Conversion", () => {
    it("should convert UncertaintyValue correctly", () => {
      const kmValue = new UncertaintyValue(1, 0.001, "km", "Test");
      const mValue = UnitConverter.convertUncertaintyValue(kmValue, "m");

      expect(mValue.value).toBe(1000);
      expect(mValue.uncertainty).toBe(1);
      expect(mValue.unit).toBe("m");
      expect(mValue.source).toBe("Test");
    });

    it("should preserve relative uncertainty in conversions", () => {
      const originalValue = new UncertaintyValue(100, 5, "km", "Test");
      const convertedValue = UnitConverter.convertUncertaintyValue(
        originalValue,
        "m"
      );

      expect(originalValue.relativeUncertainty).toBeCloseTo(
        convertedValue.relativeUncertainty,
        10
      );
    });
  });

  describe("Utility Functions", () => {
    it("should validate units correctly", () => {
      expect(() => UnitConverter.validateUnit("m")).not.toThrow();
      expect(() => UnitConverter.validateUnit("unknown")).toThrow(
        UnitConversionError
      );

      const mDef = UnitConverter.validateUnit("m");
      expect(mDef.name).toBe("meter");
      expect(mDef.type).toBe(UnitType.LENGTH);
    });

    it("should check unit compatibility", () => {
      expect(UnitConverter.areCompatible("m", "km")).toBe(true);
      expect(UnitConverter.areCompatible("s", "min")).toBe(true);
      expect(UnitConverter.areCompatible("J", "Mt TNT")).toBe(true);
      expect(UnitConverter.areCompatible("m", "s")).toBe(false);
      expect(UnitConverter.areCompatible("unknown", "m")).toBe(false);
    });

    it("should get units by type", () => {
      const lengthUnits = UnitConverter.getUnitsOfType(UnitType.LENGTH);
      expect(lengthUnits.length).toBeGreaterThan(0);
      expect(lengthUnits.every((unit) => unit.type === UnitType.LENGTH)).toBe(
        true
      );

      const energyUnits = UnitConverter.getUnitsOfType(UnitType.ENERGY);
      expect(energyUnits.some((unit) => unit.symbol === "J")).toBe(true);
      expect(energyUnits.some((unit) => unit.symbol === "Mt TNT")).toBe(true);
    });

    it("should format values correctly", () => {
      expect(UnitConverter.formatValue(1000, "m", 3)).toBe("1.00e+3 m");
      expect(UnitConverter.formatValue(0.001, "km", 3)).toBe("0.00100 km");
    });

    it("should format UncertaintyValue correctly", () => {
      const exactValue = new UncertaintyValue(299792458, 0, "m/s", "Test");
      const uncertainValue = new UncertaintyValue(1000, 10, "m", "Test");

      expect(UnitConverter.formatUncertaintyValue(exactValue)).toContain(
        "(exact)"
      );
      expect(UnitConverter.formatUncertaintyValue(uncertainValue)).toContain(
        "±"
      );
    });
  });
});

describe("UnitConversions Convenience Functions", () => {
  it("should provide length conversion functions", () => {
    expect(UnitConversions.metersToKilometers(1000)).toBe(1);
    expect(UnitConversions.kilometersToMeters(1)).toBe(1000);
    expect(UnitConversions.auToKilometers(1)).toBeCloseTo(149597870.7, 1);
    expect(UnitConversions.kilometersToAU(149597870.7)).toBeCloseTo(1, 10);
  });

  it("should provide time conversion functions", () => {
    expect(UnitConversions.secondsToMinutes(60)).toBe(1);
    expect(UnitConversions.minutesToSeconds(1)).toBe(60);
    expect(UnitConversions.secondsToHours(3600)).toBe(1);
    expect(UnitConversions.hoursToSeconds(1)).toBe(3600);
    expect(UnitConversions.secondsToDays(86400)).toBe(1);
    expect(UnitConversions.daysToSeconds(1)).toBe(86400);
    expect(UnitConversions.yearsToSeconds(1)).toBe(31557600);
  });

  it("should provide energy conversion functions", () => {
    expect(UnitConversions.megatonsTNTToJoules(1)).toBe(4.184e15);
    expect(UnitConversions.joulesToMegatonsTNT(4.184e15)).toBe(1);
    expect(UnitConversions.kilotonsTNTToJoules(1)).toBe(4.184e12);
    expect(UnitConversions.joulesToKilotonsTNT(4.184e12)).toBe(1);
  });

  it("should provide velocity conversion functions", () => {
    expect(UnitConversions.msToKms(1000)).toBe(1);
    expect(UnitConversions.kmsToMs(1)).toBe(1000);
    expect(UnitConversions.kmhToMs(3.6)).toBeCloseTo(1, 5);
    expect(UnitConversions.msToKmh(1)).toBeCloseTo(3.6, 5);
  });

  it("should provide angle conversion functions", () => {
    expect(UnitConversions.degreesToRadians(180)).toBeCloseTo(Math.PI, 10);
    expect(UnitConversions.radiansToDegrees(Math.PI)).toBeCloseTo(180, 10);
    expect(UnitConversions.arcsecondsToRadians(206265)).toBeCloseTo(1, 5);
    expect(UnitConversions.radiansToArcseconds(1)).toBeCloseTo(206265, 0);
  });
});

describe("Module Functions", () => {
  it("should list all supported units", () => {
    const units = getSupportedUnits();
    expect(units).toContain("m");
    expect(units).toContain("km");
    expect(units).toContain("AU");
    expect(units).toContain("s");
    expect(units).toContain("year");
    expect(units).toContain("J");
    expect(units).toContain("Mt TNT");
    expect(units.length).toBeGreaterThan(20);
  });

  it("should get unit information", () => {
    const mInfo = getUnitInfo("m");
    expect(mInfo).toBeDefined();
    expect(mInfo?.name).toBe("meter");
    expect(mInfo?.type).toBe(UnitType.LENGTH);

    const unknownInfo = getUnitInfo("unknown");
    expect(unknownInfo).toBeNull();
  });
});

describe("Edge Cases and Precision", () => {
  it("should handle very large numbers", () => {
    const largeDistance = 1e20; // meters
    const auDistance = UnitConverter.convert(largeDistance, "m", "AU");
    expect(auDistance).toBeCloseTo(largeDistance / 149597870700, 5);
  });

  it("should handle very small numbers", () => {
    const smallDistance = 1e-10; // meters
    const kmDistance = UnitConverter.convert(smallDistance, "m", "km");
    expect(kmDistance).toBeCloseTo(1e-13, 15);
  });

  it("should maintain precision in round-trip conversions", () => {
    const originalValue = 123.456789;
    const converted = UnitConverter.convert(originalValue, "m", "km");
    const backConverted = UnitConverter.convert(converted, "km", "m");
    expect(backConverted).toBeCloseTo(originalValue, 10);
  });

  it("should handle zero values", () => {
    expect(UnitConverter.convert(0, "m", "km")).toBe(0);
    expect(UnitConverter.convert(0, "J", "Mt TNT")).toBe(0);
  });

  it("should handle negative values", () => {
    expect(UnitConverter.convert(-100, "m", "km")).toBe(-0.1);
    expect(UnitConverter.convert(-1, "Mt TNT", "J")).toBe(-4.184e15);
  });
});

describe("Scientific Accuracy", () => {
  it("should use correct astronomical unit value", () => {
    // IAU 2012 definition: 1 AU = 149,597,870.7 km exactly
    expect(UNIT_DEFINITIONS["AU"].toBaseUnit).toBe(149597870700);
  });

  it("should use correct TNT energy equivalents", () => {
    // 1 gram TNT = 4184 J, so 1 Mt TNT = 4.184 × 10^15 J
    expect(UNIT_DEFINITIONS["Mt TNT"].toBaseUnit).toBe(4.184e15);
    expect(UNIT_DEFINITIONS["kt TNT"].toBaseUnit).toBe(4.184e12);
  });

  it("should use correct Julian year definition", () => {
    // Julian year = 365.25 days exactly
    expect(UNIT_DEFINITIONS["year"].toBaseUnit).toBe(365.25 * 24 * 3600);
  });

  it("should maintain dimensional consistency", () => {
    // All length units should convert consistently
    const testValue = 1000;
    const mToKm = UnitConverter.convert(testValue, "m", "km");
    const kmToAu = UnitConverter.convert(mToKm, "km", "AU");
    const auToM = UnitConverter.convert(kmToAu, "AU", "m");
    expect(auToM).toBeCloseTo(testValue, 10);
  });
});
