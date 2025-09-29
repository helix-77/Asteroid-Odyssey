/**
 * Tests for seismic magnitude calculations
 */

import { describe, it, expect, vi } from "vitest";
import {
  calculateSeismicMagnitude,
  calculateGroundMotionAtDistance,
  validateAgainstKnownImpacts,
  DEFAULT_GEOLOGICAL_PROPERTIES,
  type GeologicalProperties,
} from "../seismic";
import { UncertaintyValue } from "../../../physics/constants";

describe("Seismic Magnitude Calculations", () => {
  describe("calculateSeismicMagnitude", () => {
    it("should calculate reasonable magnitude for Tunguska-scale impact", () => {
      const kineticEnergy: UncertaintyValue = {
        value: 1.2e16, // 12 Mt TNT equivalent
        uncertainty: 3e15,
        unit: "J",
        source: "Tunguska estimates",
      };

      const result = calculateSeismicMagnitude(kineticEnergy);

      // Tunguska magnitude estimated at 4.5-5.2
      expect(result.momentMagnitude.value).toBeGreaterThan(4.0);
      expect(result.momentMagnitude.value).toBeLessThan(6.0);
      expect(result.momentMagnitude.unit).toBe("Mw");
      expect(result.scalingLaw).toContain("Ben-Menahem");
    });

    it("should calculate reasonable magnitude for Chelyabinsk-scale impact", () => {
      const kineticEnergy: UncertaintyValue = {
        value: 2.1e15, // 500 kt TNT equivalent
        uncertainty: 5e14,
        unit: "J",
        source: "Chelyabinsk estimates",
      };

      const result = calculateSeismicMagnitude(kineticEnergy);

      // Chelyabinsk magnitude recorded at 3.8-4.2
      expect(result.momentMagnitude.value).toBeGreaterThan(3.5);
      expect(result.momentMagnitude.value).toBeLessThan(4.5);
    });

    it("should handle different geological properties", () => {
      const kineticEnergy: UncertaintyValue = {
        value: 1e15,
        uncertainty: 2e14,
        unit: "J",
        source: "test",
      };

      const continentalResult = calculateSeismicMagnitude(
        kineticEnergy,
        DEFAULT_GEOLOGICAL_PROPERTIES.continental_crust
      );

      const oceanicResult = calculateSeismicMagnitude(
        kineticEnergy,
        DEFAULT_GEOLOGICAL_PROPERTIES.oceanic_crust
      );

      const sedimentaryResult = calculateSeismicMagnitude(
        kineticEnergy,
        DEFAULT_GEOLOGICAL_PROPERTIES.sedimentary
      );

      // Different geological properties should give different results
      expect(continentalResult.momentMagnitude.value).not.toBe(
        oceanicResult.momentMagnitude.value
      );
      expect(continentalResult.momentMagnitude.value).not.toBe(
        sedimentaryResult.momentMagnitude.value
      );

      // All should be reasonable magnitudes
      [continentalResult, oceanicResult, sedimentaryResult].forEach(
        (result) => {
          expect(result.momentMagnitude.value).toBeGreaterThan(2);
          expect(result.momentMagnitude.value).toBeLessThan(8);
        }
      );
    });

    it("should include proper uncertainty propagation", () => {
      const kineticEnergy: UncertaintyValue = {
        value: 1e15,
        uncertainty: 3e14, // 30% uncertainty
        unit: "J",
        source: "test",
      };

      const result = calculateSeismicMagnitude(kineticEnergy);

      // Should have meaningful uncertainty
      expect(result.momentMagnitude.uncertainty).toBeGreaterThan(0);
      expect(result.seismicMoment.uncertainty).toBeGreaterThan(0);
      expect(result.peakGroundAcceleration.uncertainty).toBeGreaterThan(0);
    });

    it("should calculate felt and damage radii", () => {
      const kineticEnergy: UncertaintyValue = {
        value: 1e16,
        uncertainty: 2e15,
        unit: "J",
        source: "test",
      };

      const result = calculateSeismicMagnitude(kineticEnergy);

      // Felt radius should be larger than damage radius
      expect(result.feltRadius.value).toBeGreaterThan(
        result.damageRadius.value
      );

      // Both should be positive
      expect(result.feltRadius.value).toBeGreaterThan(0);
      expect(result.damageRadius.value).toBeGreaterThan(0);

      // Units should be correct
      expect(result.feltRadius.unit).toBe("km");
      expect(result.damageRadius.unit).toBe("km");
    });

    it("should warn for energies outside validated range", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      // Too small energy
      const smallEnergy: UncertaintyValue = {
        value: 1e10, // Below minimum
        uncertainty: 1e9,
        unit: "J",
        source: "test",
      };

      calculateSeismicMagnitude(smallEnergy);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("outside validated range")
      );

      // Too large energy
      const largeEnergy: UncertaintyValue = {
        value: 1e25, // Above maximum
        uncertainty: 1e24,
        unit: "J",
        source: "test",
      };

      calculateSeismicMagnitude(largeEnergy);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("outside validated range")
      );

      consoleSpy.mockRestore();
    });

    it("should include validity range in results", () => {
      const kineticEnergy: UncertaintyValue = {
        value: 1e15,
        uncertainty: 2e14,
        unit: "J",
        source: "test",
      };

      const result = calculateSeismicMagnitude(kineticEnergy);

      expect(result.validityRange).toBeDefined();
      expect(result.validityRange.minEnergy).toBe(1e12);
      expect(result.validityRange.maxEnergy).toBe(1e24);
      expect(result.validityRange.unit).toBe("J");
    });
  });

  describe("calculateGroundMotionAtDistance", () => {
    it("should calculate ground motion at various distances", () => {
      const magnitude: UncertaintyValue = {
        value: 5.0,
        uncertainty: 0.2,
        unit: "Mw",
        source: "test",
      };

      const distances = [1, 10, 100, 1000]; // km
      const results = distances.map((d) =>
        calculateGroundMotionAtDistance(magnitude, d)
      );

      // Ground motion should decrease with distance
      for (let i = 1; i < results.length; i++) {
        expect(results[i].peakGroundAcceleration.value).toBeLessThan(
          results[i - 1].peakGroundAcceleration.value
        );
        expect(results[i].peakGroundVelocity.value).toBeLessThan(
          results[i - 1].peakGroundVelocity.value
        );
        expect(results[i].mercalliIntensity.value).toBeLessThan(
          results[i - 1].mercalliIntensity.value
        );
      }
    });

    it("should handle different geological properties", () => {
      const magnitude: UncertaintyValue = {
        value: 4.5,
        uncertainty: 0.1,
        unit: "Mw",
        source: "test",
      };

      const distance = 50; // km

      const continentalResult = calculateGroundMotionAtDistance(
        magnitude,
        distance,
        DEFAULT_GEOLOGICAL_PROPERTIES.continental_crust
      );

      const sedimentaryResult = calculateGroundMotionAtDistance(
        magnitude,
        distance,
        DEFAULT_GEOLOGICAL_PROPERTIES.sedimentary
      );

      // Different geological properties may affect results
      expect(continentalResult.distance).toBe(distance);
      expect(sedimentaryResult.distance).toBe(distance);

      // Both should have reasonable values
      expect(continentalResult.peakGroundAcceleration.value).toBeGreaterThan(0);
      expect(sedimentaryResult.peakGroundAcceleration.value).toBeGreaterThan(0);
    });

    it("should throw error for invalid distance", () => {
      const magnitude: UncertaintyValue = {
        value: 4.0,
        uncertainty: 0.1,
        unit: "Mw",
        source: "test",
      };

      expect(() => calculateGroundMotionAtDistance(magnitude, 0)).toThrow(
        "Distance must be positive"
      );
      expect(() => calculateGroundMotionAtDistance(magnitude, -10)).toThrow(
        "Distance must be positive"
      );
    });

    it("should include proper units and sources", () => {
      const magnitude: UncertaintyValue = {
        value: 4.5,
        uncertainty: 0.1,
        unit: "Mw",
        source: "test",
      };

      const result = calculateGroundMotionAtDistance(magnitude, 25);

      expect(result.peakGroundAcceleration.unit).toBe("m/s²");
      expect(result.peakGroundVelocity.unit).toBe("m/s");
      expect(result.mercalliIntensity.unit).toBe("MMI");

      expect(result.peakGroundAcceleration.source).toContain("Boore-Atkinson");
      expect(result.peakGroundVelocity.source).toContain("Campbell");
      expect(result.mercalliIntensity.source).toContain("Bakun");
    });

    it("should clamp MMI to valid range", () => {
      // Very high magnitude at close distance
      const highMagnitude: UncertaintyValue = {
        value: 9.0,
        uncertainty: 0.1,
        unit: "Mw",
        source: "test",
      };

      const closeResult = calculateGroundMotionAtDistance(highMagnitude, 1);
      expect(closeResult.mercalliIntensity.value).toBeLessThanOrEqual(12);

      // Low magnitude at far distance
      const lowMagnitude: UncertaintyValue = {
        value: 2.0,
        uncertainty: 0.1,
        unit: "Mw",
        source: "test",
      };

      const farResult = calculateGroundMotionAtDistance(lowMagnitude, 1000);
      expect(farResult.mercalliIntensity.value).toBeGreaterThanOrEqual(1);
    });
  });

  describe("validateAgainstKnownImpacts", () => {
    it("should validate Tunguska impact correctly", () => {
      const kineticEnergy: UncertaintyValue = {
        value: 1.2e16,
        uncertainty: 3e15,
        unit: "J",
        source: "Tunguska estimates",
      };

      const calculatedMagnitude: UncertaintyValue = {
        value: 4.8, // Within expected range
        uncertainty: 0.3,
        unit: "Mw",
        source: "calculated",
      };

      const validation = validateAgainstKnownImpacts(
        kineticEnergy,
        calculatedMagnitude,
        "Tunguska_1908"
      );

      expect(validation.isValid).toBe(true);
      expect(validation.confidence).toBe("HIGH");
      expect(validation.expectedRange.min).toBe(4.5);
      expect(validation.expectedRange.max).toBe(5.2);
    });

    it("should validate Chelyabinsk impact correctly", () => {
      const kineticEnergy: UncertaintyValue = {
        value: 2.1e15,
        uncertainty: 5e14,
        unit: "J",
        source: "Chelyabinsk estimates",
      };

      const calculatedMagnitude: UncertaintyValue = {
        value: 4.0, // Within expected range
        uncertainty: 0.2,
        unit: "Mw",
        source: "calculated",
      };

      const validation = validateAgainstKnownImpacts(
        kineticEnergy,
        calculatedMagnitude,
        "Chelyabinsk_2013"
      );

      expect(validation.isValid).toBe(true);
      expect(validation.confidence).toBe("HIGH");
      expect(validation.expectedRange.min).toBe(3.8);
      expect(validation.expectedRange.max).toBe(4.2);
    });

    it("should handle unknown events", () => {
      const kineticEnergy: UncertaintyValue = {
        value: 1e15,
        uncertainty: 2e14,
        unit: "J",
        source: "test",
      };

      const calculatedMagnitude: UncertaintyValue = {
        value: 4.0,
        uncertainty: 0.2,
        unit: "Mw",
        source: "calculated",
      };

      const validation = validateAgainstKnownImpacts(
        kineticEnergy,
        calculatedMagnitude,
        "Unknown_Event"
      );

      expect(validation.isValid).toBe(false);
      expect(validation.confidence).toBe("LOW");
      expect(validation.deviation).toBe(Infinity);
    });

    it("should assign correct confidence levels", () => {
      const kineticEnergy: UncertaintyValue = {
        value: 1.2e16,
        uncertainty: 3e15,
        unit: "J",
        source: "test",
      };

      // High confidence (within tolerance)
      const highConfMagnitude: UncertaintyValue = {
        value: 4.85, // Very close to expected mid-point (4.85)
        uncertainty: 0.1,
        unit: "Mw",
        source: "calculated",
      };

      const highConfValidation = validateAgainstKnownImpacts(
        kineticEnergy,
        highConfMagnitude,
        "Tunguska_1908"
      );

      expect(highConfValidation.confidence).toBe("HIGH");

      // Medium confidence (within 1.5x tolerance)
      const medConfMagnitude: UncertaintyValue = {
        value: 5.3, // Outside normal tolerance but within 1.5x (tolerance is ~0.35, so 1.5x = ~0.525)
        uncertainty: 0.1,
        unit: "Mw",
        source: "calculated",
      };

      const medConfValidation = validateAgainstKnownImpacts(
        kineticEnergy,
        medConfMagnitude,
        "Tunguska_1908"
      );

      expect(medConfValidation.confidence).toBe("MEDIUM");

      // Low confidence (outside 1.5x tolerance)
      const lowConfMagnitude: UncertaintyValue = {
        value: 6.0, // Way outside tolerance
        uncertainty: 0.1,
        unit: "Mw",
        source: "calculated",
      };

      const lowConfValidation = validateAgainstKnownImpacts(
        kineticEnergy,
        lowConfMagnitude,
        "Tunguska_1908"
      );

      expect(lowConfValidation.confidence).toBe("LOW");
      expect(lowConfValidation.isValid).toBe(false);
    });
  });

  describe("DEFAULT_GEOLOGICAL_PROPERTIES", () => {
    it("should have all required geological property types", () => {
      expect(DEFAULT_GEOLOGICAL_PROPERTIES.continental_crust).toBeDefined();
      expect(DEFAULT_GEOLOGICAL_PROPERTIES.oceanic_crust).toBeDefined();
      expect(DEFAULT_GEOLOGICAL_PROPERTIES.sedimentary).toBeDefined();
    });

    it("should have realistic property values", () => {
      Object.values(DEFAULT_GEOLOGICAL_PROPERTIES).forEach((props) => {
        // Density should be reasonable for rock (1000-4000 kg/m³)
        expect(props.density.value).toBeGreaterThan(1000);
        expect(props.density.value).toBeLessThan(4000);

        // P-wave velocity should be reasonable (3000-8000 m/s)
        expect(props.pWaveVelocity.value).toBeGreaterThan(3000);
        expect(props.pWaveVelocity.value).toBeLessThan(8000);

        // S-wave velocity should be less than P-wave velocity
        expect(props.sWaveVelocity.value).toBeLessThan(
          props.pWaveVelocity.value
        );

        // Quality factor should be positive
        expect(props.qualityFactor.value).toBeGreaterThan(0);

        // All should have proper units
        expect(props.density.unit).toBe("kg/m³");
        expect(props.pWaveVelocity.unit).toBe("m/s");
        expect(props.sWaveVelocity.unit).toBe("m/s");
        expect(props.qualityFactor.unit).toBe("dimensionless");
      });
    });
  });

  describe("Integration tests", () => {
    it("should produce consistent results across calculation chain", () => {
      const kineticEnergy: UncertaintyValue = {
        value: 5e15, // 1.2 Mt TNT equivalent
        uncertainty: 1e15,
        unit: "J",
        source: "test scenario",
      };

      // Calculate seismic magnitude
      const seismicResult = calculateSeismicMagnitude(kineticEnergy);

      // Calculate ground motion at various distances
      const distances = [10, 50, 100, 500];
      const groundMotions = distances.map((d) =>
        calculateGroundMotionAtDistance(seismicResult.momentMagnitude, d)
      );

      // Validate against known impact
      const validation = validateAgainstKnownImpacts(
        kineticEnergy,
        seismicResult.momentMagnitude,
        "Chelyabinsk_2013"
      );

      // Results should be physically consistent
      expect(seismicResult.momentMagnitude.value).toBeGreaterThan(0);
      expect(seismicResult.seismicMoment.value).toBeGreaterThan(0);

      // Ground motion should decrease with distance
      for (let i = 1; i < groundMotions.length; i++) {
        expect(groundMotions[i].peakGroundAcceleration.value).toBeLessThan(
          groundMotions[i - 1].peakGroundAcceleration.value
        );
      }

      // Should have reasonable validation result
      expect(validation.calculatedValue).toBe(
        seismicResult.momentMagnitude.value
      );
    });
  });
});
