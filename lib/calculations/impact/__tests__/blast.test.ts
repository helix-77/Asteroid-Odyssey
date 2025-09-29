/**
 * Unit tests for blast effects calculations
 * Tests Glasstone & Dolan nuclear scaling implementation
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  calculateBlastEffects,
  getAtmosphericConditions,
  validateAgainstKnownEvents,
  STANDARD_ATMOSPHERE,
  HIGH_ALTITUDE_ATMOSPHERE,
} from "../blast";
import { UncertaintyValue } from "../../../physics/constants";

describe("Blast Effects Calculations", () => {
  let testImpactEnergy: UncertaintyValue;
  let testBurstAltitude: UncertaintyValue;
  let testSurfaceBurst: UncertaintyValue;

  beforeEach(() => {
    // Typical asteroid impact parameters
    testImpactEnergy = new UncertaintyValue(
      1e15,
      1e14,
      "J",
      "Test",
      "Test impact energy"
    );
    testBurstAltitude = new UncertaintyValue(
      10000,
      1000,
      "m",
      "Test",
      "Test airburst altitude"
    );
    testSurfaceBurst = new UncertaintyValue(0, 0, "m", "Test", "Surface burst");
  });

  describe("Atmospheric Conditions", () => {
    it("should have standard atmospheric conditions", () => {
      expect(STANDARD_ATMOSPHERE.pressure.value).toBe(101325);
      expect(STANDARD_ATMOSPHERE.density.value).toBeCloseTo(1.225, 2);
      expect(STANDARD_ATMOSPHERE.temperature.value).toBe(288.15);
    });

    it("should have high altitude atmospheric conditions", () => {
      expect(HIGH_ALTITUDE_ATMOSPHERE.pressure.value).toBeLessThan(
        STANDARD_ATMOSPHERE.pressure.value
      );
      expect(HIGH_ALTITUDE_ATMOSPHERE.density.value).toBeLessThan(
        STANDARD_ATMOSPHERE.density.value
      );
      expect(HIGH_ALTITUDE_ATMOSPHERE.temperature.value).toBeLessThan(
        STANDARD_ATMOSPHERE.temperature.value
      );
    });

    it("should retrieve atmospheric conditions by name", () => {
      const standard = getAtmosphericConditions("standard");
      const highAltitude = getAtmosphericConditions("highAltitude");

      expect(standard.pressure.value).toBe(STANDARD_ATMOSPHERE.pressure.value);
      expect(highAltitude.pressure.value).toBe(
        HIGH_ALTITUDE_ATMOSPHERE.pressure.value
      );
    });

    it("should throw error for unknown atmospheric condition", () => {
      expect(() => getAtmosphericConditions("unknown")).toThrow();
    });
  });

  describe("Blast Effects Calculations", () => {
    it("should calculate reasonable blast effects for surface burst", () => {
      const result = calculateBlastEffects(testImpactEnergy, testSurfaceBurst);

      // All effects should be positive
      expect(result.fireball.radius.value).toBeGreaterThan(0);
      expect(result.fireball.duration.value).toBeGreaterThan(0);
      expect(result.fireball.temperature.value).toBeGreaterThan(0);
      expect(result.fireball.luminosity.value).toBeGreaterThan(0);

      expect(result.airblast.overpressure1psi.value).toBeGreaterThan(0);
      expect(result.airblast.overpressure5psi.value).toBeGreaterThan(0);
      expect(result.airblast.overpressure10psi.value).toBeGreaterThan(0);
      expect(result.airblast.dynamicPressure.value).toBeGreaterThan(0);
      expect(result.airblast.arrivalTime.value).toBeGreaterThan(0);

      expect(result.thermal.radiationRadius1stDegree.value).toBeGreaterThan(0);
      expect(result.thermal.radiationRadius2ndDegree.value).toBeGreaterThan(0);
      expect(result.thermal.radiationRadius3rdDegree.value).toBeGreaterThan(0);
      expect(result.thermal.thermalFluence.value).toBeGreaterThan(0);
      expect(result.thermal.pulseWidth.value).toBeGreaterThan(0);
    });

    it("should calculate reasonable blast effects for airburst", () => {
      const result = calculateBlastEffects(testImpactEnergy, testBurstAltitude);

      // Airburst should have different characteristics than surface burst
      expect(result.fireball.radius.value).toBeGreaterThan(0);
      expect(result.airblast.overpressure1psi.value).toBeGreaterThan(0);
      expect(result.thermal.radiationRadius1stDegree.value).toBeGreaterThan(0);
    });

    it("should have proper overpressure radius ordering", () => {
      const result = calculateBlastEffects(testImpactEnergy, testSurfaceBurst);

      // Higher overpressure should have smaller radius
      expect(result.airblast.overpressure10psi.value).toBeLessThan(
        result.airblast.overpressure5psi.value
      );
      expect(result.airblast.overpressure5psi.value).toBeLessThan(
        result.airblast.overpressure1psi.value
      );
    });

    it("should have proper thermal radius ordering", () => {
      const result = calculateBlastEffects(testImpactEnergy, testSurfaceBurst);

      // Higher degree burns should have smaller radius
      expect(result.thermal.radiationRadius3rdDegree.value).toBeLessThan(
        result.thermal.radiationRadius2ndDegree.value
      );
      expect(result.thermal.radiationRadius2ndDegree.value).toBeLessThan(
        result.thermal.radiationRadius1stDegree.value
      );
    });

    it("should scale properly with impact energy", () => {
      const lowEnergy = new UncertaintyValue(
        1e12,
        1e11,
        "J",
        "Test",
        "Low energy"
      );
      const highEnergy = new UncertaintyValue(
        1e18,
        1e17,
        "J",
        "Test",
        "High energy"
      );

      const lowResult = calculateBlastEffects(lowEnergy, testSurfaceBurst);
      const highResult = calculateBlastEffects(highEnergy, testSurfaceBurst);

      // Higher energy should produce larger effects
      expect(highResult.fireball.radius.value).toBeGreaterThan(
        lowResult.fireball.radius.value
      );
      expect(highResult.airblast.overpressure1psi.value).toBeGreaterThan(
        lowResult.airblast.overpressure1psi.value
      );
      expect(highResult.thermal.radiationRadius1stDegree.value).toBeGreaterThan(
        lowResult.thermal.radiationRadius1stDegree.value
      );
    });

    it("should handle different atmospheric conditions", () => {
      const standardResult = calculateBlastEffects(
        testImpactEnergy,
        testBurstAltitude,
        STANDARD_ATMOSPHERE
      );
      const altitudeResult = calculateBlastEffects(
        testImpactEnergy,
        testBurstAltitude,
        HIGH_ALTITUDE_ATMOSPHERE
      );

      // Different atmospheric conditions should give different results
      expect(standardResult.fireball.radius.value).not.toBe(
        altitudeResult.fireball.radius.value
      );
      expect(standardResult.airblast.overpressure1psi.value).not.toBe(
        altitudeResult.airblast.overpressure1psi.value
      );
    });

    it("should include proper uncertainty propagation", () => {
      const result = calculateBlastEffects(testImpactEnergy, testSurfaceBurst);

      // All results should have uncertainties
      expect(result.fireball.radius.uncertainty).toBeGreaterThan(0);
      expect(result.fireball.duration.uncertainty).toBeGreaterThan(0);
      expect(result.airblast.overpressure1psi.uncertainty).toBeGreaterThan(0);
      expect(
        result.thermal.radiationRadius1stDegree.uncertainty
      ).toBeGreaterThan(0);

      // Relative uncertainties should be reasonable
      expect(result.fireball.radius.relativeUncertainty).toBeLessThan(1.0);
      expect(result.airblast.overpressure1psi.relativeUncertainty).toBeLessThan(
        1.0
      );
    });

    it("should provide validity checks", () => {
      const result = calculateBlastEffects(testImpactEnergy, testSurfaceBurst);

      expect(result.validityCheck).toBeDefined();
      expect(typeof result.validityCheck.isValid).toBe("boolean");
      expect(Array.isArray(result.validityCheck.warnings)).toBe(true);
      expect(Array.isArray(result.validityCheck.limitations)).toBe(true);
    });

    it("should warn about extreme parameters", () => {
      // Very low energy (below validity range)
      const veryLowEnergy = new UncertaintyValue(
        1e6,
        1e5,
        "J",
        "Test",
        "Very low energy"
      );
      const result = calculateBlastEffects(veryLowEnergy, testSurfaceBurst);

      expect(result.validityCheck.isValid).toBe(false);
      expect(result.validityCheck.warnings.length).toBeGreaterThan(0);
    });

    it("should warn about very high altitude", () => {
      const veryHighAltitude = new UncertaintyValue(
        60000,
        5000,
        "m",
        "Test",
        "Very high altitude"
      );
      const result = calculateBlastEffects(testImpactEnergy, veryHighAltitude);

      expect(
        result.validityCheck.warnings.some((w) => w.includes("altitude"))
      ).toBe(true);
    });
  });

  describe("Fireball Effects", () => {
    it("should calculate reasonable fireball properties", () => {
      const result = calculateBlastEffects(testImpactEnergy, testSurfaceBurst);

      // Fireball radius should be reasonable (hundreds of meters for this energy)
      expect(result.fireball.radius.value).toBeGreaterThan(100);
      expect(result.fireball.radius.value).toBeLessThan(10000);

      // Fireball duration should be seconds to tens of seconds
      expect(result.fireball.duration.value).toBeGreaterThan(1);
      expect(result.fireball.duration.value).toBeLessThan(100);

      // Temperature should be very high (thousands of Kelvin)
      expect(result.fireball.temperature.value).toBeGreaterThan(2000);
      expect(result.fireball.temperature.value).toBeLessThan(10000);

      // Luminosity should be enormous
      expect(result.fireball.luminosity.value).toBeGreaterThan(1e12);
    });

    it("should scale fireball with energy", () => {
      const smallEnergy = new UncertaintyValue(
        1e13,
        1e12,
        "J",
        "Test",
        "Small energy"
      );
      const largeEnergy = new UncertaintyValue(
        1e17,
        1e16,
        "J",
        "Test",
        "Large energy"
      );

      const smallResult = calculateBlastEffects(smallEnergy, testSurfaceBurst);
      const largeResult = calculateBlastEffects(largeEnergy, testSurfaceBurst);

      // Larger energy should produce larger fireball
      expect(largeResult.fireball.radius.value).toBeGreaterThan(
        smallResult.fireball.radius.value
      );
      expect(largeResult.fireball.duration.value).toBeGreaterThan(
        smallResult.fireball.duration.value
      );
      expect(largeResult.fireball.luminosity.value).toBeGreaterThan(
        smallResult.fireball.luminosity.value
      );
    });
  });

  describe("Airblast Effects", () => {
    it("should calculate reasonable airblast properties", () => {
      const result = calculateBlastEffects(testImpactEnergy, testSurfaceBurst);

      // Overpressure radii should be in reasonable ranges
      expect(result.airblast.overpressure1psi.value).toBeGreaterThan(1000);
      expect(result.airblast.overpressure1psi.value).toBeLessThan(100000);

      expect(result.airblast.overpressure5psi.value).toBeGreaterThan(500);
      expect(result.airblast.overpressure5psi.value).toBeLessThan(50000);

      expect(result.airblast.overpressure10psi.value).toBeGreaterThan(200);
      expect(result.airblast.overpressure10psi.value).toBeLessThan(20000);

      // Dynamic pressure should be reasonable
      expect(result.airblast.dynamicPressure.value).toBeGreaterThan(1000);
      expect(result.airblast.dynamicPressure.value).toBeLessThan(100000);

      // Arrival time should be reasonable
      expect(result.airblast.arrivalTime.value).toBeGreaterThan(1);
      expect(result.airblast.arrivalTime.value).toBeLessThan(1000);
    });

    it("should have consistent arrival time with distance", () => {
      const result = calculateBlastEffects(testImpactEnergy, testSurfaceBurst);

      // Arrival time should be consistent with distance and sound speed
      const distance = result.airblast.overpressure1psi.value;
      const arrivalTime = result.airblast.arrivalTime.value;
      const impliedSpeed = distance / arrivalTime;

      // Speed should be greater than sound speed (343 m/s) but not too much faster
      expect(impliedSpeed).toBeGreaterThan(343);
      expect(impliedSpeed).toBeLessThan(1000);
    });
  });

  describe("Thermal Effects", () => {
    it("should calculate reasonable thermal properties", () => {
      const result = calculateBlastEffects(testImpactEnergy, testSurfaceBurst);

      // Thermal radii should be reasonable
      expect(result.thermal.radiationRadius1stDegree.value).toBeGreaterThan(
        1000
      );
      expect(result.thermal.radiationRadius1stDegree.value).toBeLessThan(
        100000
      );

      expect(result.thermal.radiationRadius2ndDegree.value).toBeGreaterThan(
        500
      );
      expect(result.thermal.radiationRadius2ndDegree.value).toBeLessThan(50000);

      expect(result.thermal.radiationRadius3rdDegree.value).toBeGreaterThan(
        200
      );
      expect(result.thermal.radiationRadius3rdDegree.value).toBeLessThan(20000);

      // Thermal fluence should be reasonable
      expect(result.thermal.thermalFluence.value).toBeGreaterThan(1000);
      expect(result.thermal.thermalFluence.value).toBeLessThan(1e8);

      // Pulse width should be reasonable
      expect(result.thermal.pulseWidth.value).toBeGreaterThan(0.1);
      expect(result.thermal.pulseWidth.value).toBeLessThan(100);
    });

    it("should have thermal effects affected by atmospheric conditions", () => {
      const dryResult = calculateBlastEffects(
        testImpactEnergy,
        testBurstAltitude,
        STANDARD_ATMOSPHERE
      );

      // Create humid conditions
      const humidAtmosphere = {
        ...STANDARD_ATMOSPHERE,
        humidity: new UncertaintyValue(0.8, 0.1, "1", "Test", "High humidity"),
      };
      const humidResult = calculateBlastEffects(
        testImpactEnergy,
        testBurstAltitude,
        humidAtmosphere
      );

      // Humid conditions should reduce thermal effects due to absorption
      expect(humidResult.thermal.radiationRadius1stDegree.value).toBeLessThan(
        dryResult.thermal.radiationRadius1stDegree.value
      );
    });
  });

  describe("Known Event Validation", () => {
    it("should validate against Chelyabinsk and Tunguska", () => {
      const validationResults = validateAgainstKnownEvents();
      expect(validationResults.length).toBeGreaterThanOrEqual(2);

      const chelyabinsk = validationResults.find((r) =>
        r.name.includes("Chelyabinsk")
      );
      const tunguska = validationResults.find((r) =>
        r.name.includes("Tunguska")
      );

      expect(chelyabinsk).toBeDefined();
      expect(tunguska).toBeDefined();

      if (chelyabinsk) {
        expect(
          chelyabinsk.calculated.airblast.overpressure1psi.value
        ).toBeGreaterThan(0);
        expect(chelyabinsk.observed.energy).toBeGreaterThan(0);
      }

      if (tunguska) {
        expect(
          tunguska.calculated.airblast.overpressure1psi.value
        ).toBeGreaterThan(0);
        expect(tunguska.observed.energy).toBeGreaterThan(0);
      }
    });

    it("should provide agreement assessment", () => {
      const validationResults = validateAgainstKnownEvents();

      validationResults.forEach((result) => {
        expect(["Good", "Fair", "Poor"]).toContain(result.agreement);
      });
    });

    it("should have reasonable agreement with known events", () => {
      const validationResults = validateAgainstKnownEvents();

      // At least one event should have Fair or Good agreement
      const hasReasonableAgreement = validationResults.some(
        (r) => r.agreement === "Good" || r.agreement === "Fair"
      );
      expect(hasReasonableAgreement).toBe(true);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle very small energies", () => {
      const tinyEnergy = new UncertaintyValue(
        1e9,
        1e8,
        "J",
        "Test",
        "Tiny energy"
      );

      expect(() => {
        calculateBlastEffects(tinyEnergy, testSurfaceBurst);
      }).not.toThrow();
    });

    it("should handle very large energies", () => {
      const hugeEnergy = new UncertaintyValue(
        1e20,
        1e19,
        "J",
        "Test",
        "Huge energy"
      );

      const result = calculateBlastEffects(hugeEnergy, testSurfaceBurst);
      expect(result.validityCheck.warnings.length).toBeGreaterThan(0);
    });

    it("should handle zero altitude gracefully", () => {
      const result = calculateBlastEffects(testImpactEnergy, testSurfaceBurst);
      expect(result.fireball.radius.value).toBeGreaterThan(0);
    });

    it("should handle extreme atmospheric conditions", () => {
      const extremeAtmosphere = {
        ...STANDARD_ATMOSPHERE,
        pressure: new UncertaintyValue(
          1000,
          100,
          "Pa",
          "Test",
          "Very low pressure"
        ),
        density: new UncertaintyValue(
          0.001,
          0.0001,
          "kg/m³",
          "Test",
          "Very low density"
        ),
      };

      expect(() => {
        calculateBlastEffects(
          testImpactEnergy,
          testBurstAltitude,
          extremeAtmosphere
        );
      }).not.toThrow();
    });
  });

  describe("Physical Consistency", () => {
    it("should maintain physical relationships", () => {
      const result = calculateBlastEffects(testImpactEnergy, testSurfaceBurst);

      // Fireball duration should scale with size
      const expectedDuration = Math.sqrt(result.fireball.radius.value / 100); // Rough scaling
      expect(result.fireball.duration.value).toBeGreaterThan(
        expectedDuration * 0.1
      );
      expect(result.fireball.duration.value).toBeLessThan(
        expectedDuration * 10
      );

      // Arrival time should be consistent with distance
      const distance = result.airblast.overpressure1psi.value;
      const time = result.airblast.arrivalTime.value;
      const speed = distance / time;
      expect(speed).toBeGreaterThan(300); // Faster than sound
      expect(speed).toBeLessThan(2000); // But not too fast
    });

    it("should have consistent units", () => {
      const result = calculateBlastEffects(testImpactEnergy, testSurfaceBurst);

      // Check all units are correct
      expect(result.fireball.radius.unit).toBe("m");
      expect(result.fireball.duration.unit).toBe("s");
      expect(result.fireball.temperature.unit).toBe("K");
      expect(result.fireball.luminosity.unit).toBe("W");

      expect(result.airblast.overpressure1psi.unit).toBe("m");
      expect(result.airblast.dynamicPressure.unit).toBe("Pa");
      expect(result.airblast.arrivalTime.unit).toBe("s");

      expect(result.thermal.radiationRadius1stDegree.unit).toBe("m");
      expect(result.thermal.thermalFluence.unit).toBe("J/m²");
      expect(result.thermal.pulseWidth.unit).toBe("s");
    });

    it("should have energy conservation in thermal calculations", () => {
      const result = calculateBlastEffects(testImpactEnergy, testSurfaceBurst);

      // Total thermal energy should be reasonable fraction of total energy
      const thermalRadius = result.thermal.radiationRadius1stDegree.value;
      const thermalFluence = result.thermal.thermalFluence.value;
      const totalThermalEnergy =
        thermalFluence * 4 * Math.PI * thermalRadius * thermalRadius;

      // Should be significant fraction of total energy but not exceed it
      expect(totalThermalEnergy).toBeGreaterThan(testImpactEnergy.value * 0.01);
      expect(totalThermalEnergy).toBeLessThan(testImpactEnergy.value * 2); // Allow for uncertainties
    });
  });
});
