/**
 * Unit tests for crater formation models
 * Tests Holsapple & Housen scaling laws implementation
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  calculateCraterDimensions,
  getTargetMaterial,
  getAvailableTargetMaterials,
  validateAgainstKnownCraters,
  TARGET_MATERIALS,
  SCALING_PARAMETERS,
} from "../crater";
import { UncertaintyValue } from "../../../physics/constants";

describe("Crater Formation Models", () => {
  let testImpactEnergy: UncertaintyValue;
  let testImpactVelocity: UncertaintyValue;
  let testImpactAngle: UncertaintyValue;
  let testProjectileDensity: UncertaintyValue;

  beforeEach(() => {
    // Typical asteroid impact parameters
    testImpactEnergy = new UncertaintyValue(
      1e15,
      1e14,
      "J",
      "Test",
      "Test impact energy"
    );
    testImpactVelocity = new UncertaintyValue(
      15000,
      2000,
      "m/s",
      "Test",
      "Test impact velocity"
    );
    testImpactAngle = new UncertaintyValue(
      45,
      10,
      "deg",
      "Test",
      "Test impact angle"
    );
    testProjectileDensity = new UncertaintyValue(
      2700,
      300,
      "kg/m³",
      "Test",
      "Test projectile density"
    );
  });

  describe("Target Materials Database", () => {
    it("should have all required target materials", () => {
      const materials = getAvailableTargetMaterials();
      expect(materials).toContain("sedimentaryRock");
      expect(materials).toContain("crystallineRock");
      expect(materials).toContain("dryRegolith");
      expect(materials).toContain("wetSediment");
      expect(materials).toContain("ice");
    });

    it("should return valid target material properties", () => {
      const material = getTargetMaterial("sedimentaryRock");
      expect(material.name).toBe("Sedimentary Rock");
      expect(material.density.value).toBeGreaterThan(0);
      expect(material.strength.value).toBeGreaterThan(0);
      expect(material.porosity.value).toBeGreaterThanOrEqual(0);
      expect(material.porosity.value).toBeLessThanOrEqual(1);
    });

    it("should throw error for unknown material", () => {
      expect(() => getTargetMaterial("unknownMaterial")).toThrow();
    });

    it("should have realistic density values", () => {
      const sedimentary = getTargetMaterial("sedimentaryRock");
      const crystalline = getTargetMaterial("crystallineRock");
      const ice = getTargetMaterial("ice");

      // Check realistic density ranges
      expect(sedimentary.density.value).toBeGreaterThan(2000);
      expect(sedimentary.density.value).toBeLessThan(3000);
      expect(crystalline.density.value).toBeGreaterThan(2500);
      expect(crystalline.density.value).toBeLessThan(3000);
      expect(ice.density.value).toBeGreaterThan(900);
      expect(ice.density.value).toBeLessThan(1000);
    });
  });

  describe("Scaling Parameters", () => {
    it("should have both strength and gravity regime parameters", () => {
      expect(SCALING_PARAMETERS.strengthRegime).toBeDefined();
      expect(SCALING_PARAMETERS.gravityRegime).toBeDefined();
    });

    it("should have valid scaling constants", () => {
      const strengthParams = SCALING_PARAMETERS.strengthRegime;
      const gravityParams = SCALING_PARAMETERS.gravityRegime;

      // K1 should be positive
      expect(strengthParams.K1.value).toBeGreaterThan(0);
      expect(gravityParams.K1.value).toBeGreaterThan(0);

      // K2 should be positive and less than 1 (depth < diameter)
      expect(strengthParams.K2.value).toBeGreaterThan(0);
      expect(strengthParams.K2.value).toBeLessThan(1);
      expect(gravityParams.K2.value).toBeGreaterThan(0);
      expect(gravityParams.K2.value).toBeLessThan(1);

      // mu should be positive and reasonable
      expect(strengthParams.mu.value).toBeGreaterThan(0);
      expect(strengthParams.mu.value).toBeLessThan(1);
      expect(gravityParams.mu.value).toBeGreaterThan(0);
      expect(gravityParams.mu.value).toBeLessThan(1);
    });

    it("should have valid velocity ranges", () => {
      const strengthParams = SCALING_PARAMETERS.strengthRegime;
      const gravityParams = SCALING_PARAMETERS.gravityRegime;

      expect(strengthParams.validityRange.minVelocity).toBeGreaterThan(0);
      expect(strengthParams.validityRange.maxVelocity).toBeGreaterThan(
        strengthParams.validityRange.minVelocity
      );
      expect(gravityParams.validityRange.minVelocity).toBeGreaterThan(0);
      expect(gravityParams.validityRange.maxVelocity).toBeGreaterThan(
        gravityParams.validityRange.minVelocity
      );
    });
  });

  describe("Crater Dimension Calculations", () => {
    it("should calculate reasonable crater dimensions", () => {
      const targetMaterial = getTargetMaterial("sedimentaryRock");
      const result = calculateCraterDimensions(
        testImpactEnergy,
        testImpactVelocity,
        testImpactAngle,
        testProjectileDensity,
        targetMaterial
      );

      // Crater should have positive dimensions
      expect(result.diameter.value).toBeGreaterThan(0);
      expect(result.depth.value).toBeGreaterThan(0);
      expect(result.volume.value).toBeGreaterThan(0);

      // Depth should be less than diameter (typical crater geometry)
      expect(result.depth.value).toBeLessThan(result.diameter.value);

      // Rim height should be small fraction of diameter
      expect(result.rimHeight.value).toBeLessThan(result.diameter.value * 0.2);
      expect(result.rimHeight.value).toBeGreaterThan(
        result.diameter.value * 0.01
      );
    });

    it("should handle different target materials", () => {
      const materials = [
        "sedimentaryRock",
        "crystallineRock",
        "dryRegolith",
        "ice",
      ];
      const results = materials.map((materialName) => {
        const material = getTargetMaterial(materialName);
        return calculateCraterDimensions(
          testImpactEnergy,
          testImpactVelocity,
          testImpactAngle,
          testProjectileDensity,
          material
        );
      });

      // All results should be valid
      results.forEach((result) => {
        expect(result.diameter.value).toBeGreaterThan(0);
        expect(result.depth.value).toBeGreaterThan(0);
        expect(result.volume.value).toBeGreaterThan(0);
      });

      // Different materials should give different results
      const diameters = results.map((r) => r.diameter.value);
      const uniqueDiameters = new Set(diameters);
      expect(uniqueDiameters.size).toBeGreaterThan(1);
    });

    it("should scale properly with impact energy", () => {
      const targetMaterial = getTargetMaterial("sedimentaryRock");

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

      const lowResult = calculateCraterDimensions(
        lowEnergy,
        testImpactVelocity,
        testImpactAngle,
        testProjectileDensity,
        targetMaterial
      );

      const highResult = calculateCraterDimensions(
        highEnergy,
        testImpactVelocity,
        testImpactAngle,
        testProjectileDensity,
        targetMaterial
      );

      // Higher energy should produce larger crater
      expect(highResult.diameter.value).toBeGreaterThan(
        lowResult.diameter.value
      );
      expect(highResult.depth.value).toBeGreaterThan(lowResult.depth.value);
      expect(highResult.volume.value).toBeGreaterThan(lowResult.volume.value);
    });

    it("should handle oblique impacts correctly", () => {
      const targetMaterial = getTargetMaterial("sedimentaryRock");

      const verticalImpact = new UncertaintyValue(
        90,
        5,
        "deg",
        "Test",
        "Vertical impact"
      );
      const obliqueImpact = new UncertaintyValue(
        30,
        5,
        "deg",
        "Test",
        "Oblique impact"
      );

      const verticalResult = calculateCraterDimensions(
        testImpactEnergy,
        testImpactVelocity,
        verticalImpact,
        testProjectileDensity,
        targetMaterial
      );

      const obliqueResult = calculateCraterDimensions(
        testImpactEnergy,
        testImpactVelocity,
        obliqueImpact,
        testProjectileDensity,
        targetMaterial
      );

      // Oblique impact should produce smaller crater
      expect(obliqueResult.diameter.value).toBeLessThan(
        verticalResult.diameter.value
      );
    });

    it("should include proper uncertainty propagation", () => {
      const targetMaterial = getTargetMaterial("sedimentaryRock");
      const result = calculateCraterDimensions(
        testImpactEnergy,
        testImpactVelocity,
        testImpactAngle,
        testProjectileDensity,
        targetMaterial
      );

      // All results should have uncertainties
      expect(result.diameter.uncertainty).toBeGreaterThan(0);
      expect(result.depth.uncertainty).toBeGreaterThan(0);
      expect(result.volume.uncertainty).toBeGreaterThan(0);

      // Relative uncertainties should be reasonable (< 100%)
      expect(result.diameter.relativeUncertainty).toBeLessThan(1.0);
      expect(result.depth.relativeUncertainty).toBeLessThan(1.0);
    });

    it("should provide validity checks", () => {
      const targetMaterial = getTargetMaterial("sedimentaryRock");
      const result = calculateCraterDimensions(
        testImpactEnergy,
        testImpactVelocity,
        testImpactAngle,
        testProjectileDensity,
        targetMaterial
      );

      expect(result.validityCheck).toBeDefined();
      expect(typeof result.validityCheck.isValid).toBe("boolean");
      expect(Array.isArray(result.validityCheck.warnings)).toBe(true);
      expect(Array.isArray(result.validityCheck.limitations)).toBe(true);
    });

    it("should warn about extreme parameters", () => {
      const targetMaterial = getTargetMaterial("sedimentaryRock");

      // Very low energy (below validity range)
      const veryLowEnergy = new UncertaintyValue(
        1e3,
        1e2,
        "J",
        "Test",
        "Very low energy"
      );
      const result = calculateCraterDimensions(
        veryLowEnergy,
        testImpactVelocity,
        testImpactAngle,
        testProjectileDensity,
        targetMaterial
      );

      expect(result.validityCheck.isValid).toBe(false);
      expect(result.validityCheck.warnings.length).toBeGreaterThan(0);
    });
  });

  describe("Formation Time Calculations", () => {
    it("should calculate reasonable formation times", () => {
      const targetMaterial = getTargetMaterial("sedimentaryRock");
      const result = calculateCraterDimensions(
        testImpactEnergy,
        testImpactVelocity,
        testImpactAngle,
        testProjectileDensity,
        targetMaterial
      );

      // Formation time should be positive and reasonable
      expect(result.formationTime.value).toBeGreaterThan(0);
      expect(result.formationTime.value).toBeLessThan(3600); // Less than 1 hour
      expect(result.formationTime.value).toBeGreaterThan(0.1); // More than 0.1 seconds
    });

    it("should scale with crater size", () => {
      const targetMaterial = getTargetMaterial("sedimentaryRock");

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

      const smallResult = calculateCraterDimensions(
        smallEnergy,
        testImpactVelocity,
        testImpactAngle,
        testProjectileDensity,
        targetMaterial
      );

      const largeResult = calculateCraterDimensions(
        largeEnergy,
        testImpactVelocity,
        testImpactAngle,
        testProjectileDensity,
        targetMaterial
      );

      // Larger crater should take longer to form
      expect(largeResult.formationTime.value).toBeGreaterThan(
        smallResult.formationTime.value
      );
    });
  });

  describe("Ejecta Calculations", () => {
    it("should calculate reasonable ejecta properties", () => {
      const targetMaterial = getTargetMaterial("sedimentaryRock");
      const result = calculateCraterDimensions(
        testImpactEnergy,
        testImpactVelocity,
        testImpactAngle,
        testProjectileDensity,
        targetMaterial
      );

      // Ejecta volume should be larger than crater volume
      expect(result.ejectaVolume.value).toBeGreaterThan(result.volume.value);

      // Ejecta range should be multiple of crater diameter
      expect(result.ejectaRange.value).toBeGreaterThan(result.diameter.value);
      expect(result.ejectaRange.value).toBeLessThan(result.diameter.value * 10);
    });
  });

  describe("Known Crater Validation", () => {
    it("should validate against Barringer Crater", () => {
      const validationResults = validateAgainstKnownCraters();
      expect(validationResults.length).toBeGreaterThan(0);

      const barringerResult = validationResults.find((r) =>
        r.name.includes("Barringer")
      );
      expect(barringerResult).toBeDefined();

      if (barringerResult) {
        expect(barringerResult.calculated.diameter.value).toBeGreaterThan(0);
        expect(barringerResult.observed.diameter).toBeGreaterThan(0);

        // Check that calculated diameter is within reasonable range of observed
        // Note: Scaling laws have inherent uncertainties and may differ by factors of 2-5
        const ratio =
          barringerResult.calculated.diameter.value /
          barringerResult.observed.diameter;
        expect(ratio).toBeGreaterThan(0.05); // Within factor of 20
        expect(ratio).toBeLessThan(20);
      }
    });

    it("should provide agreement assessment", () => {
      const validationResults = validateAgainstKnownCraters();

      validationResults.forEach((result) => {
        expect(["Good", "Fair", "Poor"]).toContain(result.agreement);
      });
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle zero impact angle gracefully", () => {
      const targetMaterial = getTargetMaterial("sedimentaryRock");
      const zeroAngle = new UncertaintyValue(0, 1, "deg", "Test", "Zero angle");

      expect(() => {
        calculateCraterDimensions(
          testImpactEnergy,
          testImpactVelocity,
          zeroAngle,
          testProjectileDensity,
          targetMaterial
        );
      }).not.toThrow();
    });

    it("should handle very high impact angles", () => {
      const targetMaterial = getTargetMaterial("sedimentaryRock");
      const highAngle = new UncertaintyValue(
        89,
        1,
        "deg",
        "Test",
        "High angle"
      );

      const result = calculateCraterDimensions(
        testImpactEnergy,
        testImpactVelocity,
        highAngle,
        testProjectileDensity,
        targetMaterial
      );

      expect(result.diameter.value).toBeGreaterThan(0);
    });

    it("should handle different gravity values", () => {
      const targetMaterial = getTargetMaterial("sedimentaryRock");
      const moonGravity = new UncertaintyValue(
        1.62,
        0.01,
        "m/s²",
        "NASA",
        "Moon surface gravity"
      );

      const result = calculateCraterDimensions(
        testImpactEnergy,
        testImpactVelocity,
        testImpactAngle,
        testProjectileDensity,
        targetMaterial,
        moonGravity
      );

      expect(result.diameter.value).toBeGreaterThan(0);
      expect(result.depth.value).toBeGreaterThan(0);
    });
  });

  describe("Physical Consistency", () => {
    it("should maintain physical relationships between crater dimensions", () => {
      const targetMaterial = getTargetMaterial("sedimentaryRock");
      const result = calculateCraterDimensions(
        testImpactEnergy,
        testImpactVelocity,
        testImpactAngle,
        testProjectileDensity,
        targetMaterial
      );

      // Depth should be less than diameter
      expect(result.depth.value).toBeLessThan(result.diameter.value);

      // Volume should be consistent with diameter and depth
      const expectedVolume =
        (Math.PI / 8) * Math.pow(result.diameter.value, 2) * result.depth.value;
      const volumeRatio = result.volume.value / expectedVolume;
      expect(volumeRatio).toBeCloseTo(1, 1); // Within 10%

      // Rim height should be small fraction of diameter
      expect(result.rimHeight.value / result.diameter.value).toBeLessThan(0.2);
      expect(result.rimHeight.value / result.diameter.value).toBeGreaterThan(
        0.01
      );
    });

    it("should have consistent units", () => {
      const targetMaterial = getTargetMaterial("sedimentaryRock");
      const result = calculateCraterDimensions(
        testImpactEnergy,
        testImpactVelocity,
        testImpactAngle,
        testProjectileDensity,
        targetMaterial
      );

      expect(result.diameter.unit).toBe("m");
      expect(result.depth.unit).toBe("m");
      expect(result.volume.unit).toBe("m³");
      expect(result.rimHeight.unit).toBe("m");
      expect(result.ejectaVolume.unit).toBe("m³");
      expect(result.ejectaRange.unit).toBe("m");
      expect(result.formationTime.unit).toBe("s");
    });
  });
});
