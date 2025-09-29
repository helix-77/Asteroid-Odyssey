/**
 * Tests for Composition Engine
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  CompositionEngine,
  ClassificationResult,
  DerivedProperties,
} from "../composition-engine";

describe("CompositionEngine", () => {
  let engine: CompositionEngine;

  beforeEach(() => {
    engine = new CompositionEngine();
  });

  describe("classifyComposition", () => {
    it("should classify large asteroids as C-type", () => {
      const result = engine.classifyComposition(
        2000, // 2 km diameter
        15.0, // Absolute magnitude
        "Large Asteroid"
      );

      expect(result.primaryType).toBe("C-type");
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.evidenceSources).toContain("Size-based statistical model");
    });

    it("should classify small asteroids as S-type", () => {
      const result = engine.classifyComposition(
        50, // 50 m diameter
        22.0, // Absolute magnitude
        "Small Asteroid"
      );

      expect(result.primaryType).toBe("S-type");
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it("should use spectral type when available", () => {
      const result = engine.classifyComposition(
        500, // 500 m diameter
        18.0, // Absolute magnitude
        "Test Asteroid",
        "C" // Spectral type
      );

      expect(result.primaryType).toBe("C-type");
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.evidenceSources).toContain("Spectroscopic observations");
    });

    it("should recognize known asteroids by name", () => {
      const result = engine.classifyComposition(
        500, // 500 m diameter
        18.0, // Absolute magnitude
        "16 Psyche" // Known metallic asteroid
      );

      expect(result.primaryType).toBe("M-type");
      expect(result.evidenceSources).toContain("Name pattern analysis");
    });

    it("should provide alternative classifications", () => {
      const result = engine.classifyComposition(
        1000, // 1 km diameter
        16.0, // Absolute magnitude
        "Test Asteroid"
      );

      expect(Array.isArray(result.alternativeTypes)).toBe(true);
      expect(result.alternativeTypes.length).toBeGreaterThan(0);

      for (const alt of result.alternativeTypes) {
        expect(alt).toHaveProperty("type");
        expect(alt).toHaveProperty("probability");
        expect(alt.probability).toBeGreaterThan(0);
        expect(alt.probability).toBeLessThan(1);
      }
    });

    it("should include limitations when no spectral data", () => {
      const result = engine.classifyComposition(
        500, // 500 m diameter
        18.0, // Absolute magnitude
        "Test Asteroid"
        // No spectral type
      );

      expect(result.limitations).toContain("No spectroscopic data available");
    });

    it("should handle different spectral types correctly", () => {
      const spectralTypes = ["C", "S", "M", "X", "B", "V"];

      for (const spectralType of spectralTypes) {
        const result = engine.classifyComposition(
          500,
          18.0,
          "Test Asteroid",
          spectralType
        );

        expect(result.primaryType).toBeDefined();
        expect(result.confidence).toBeGreaterThan(0.5);
      }
    });
  });

  describe("deriveProperties", () => {
    it("should derive properties for C-type asteroid", () => {
      const properties = engine.deriveProperties(
        1000, // 1 km diameter
        "C-type",
        0.8 // 80% confidence
      );

      expect(properties.mass.value).toBeGreaterThan(0);
      expect(properties.mass.uncertainty).toBeGreaterThan(0);
      expect(properties.mass.unit).toBe("kg");

      expect(properties.density.value).toBeGreaterThan(1000);
      expect(properties.density.value).toBeLessThan(2000);
      expect(properties.density.unit).toBe("kg/m³");

      expect(properties.strength.value).toBeGreaterThan(0);
      expect(properties.strength.unit).toBe("Pa");

      expect(properties.porosity.value).toBeGreaterThan(0);
      expect(properties.porosity.value).toBeLessThan(1);

      expect(properties.albedo.value).toBeGreaterThan(0);
      expect(properties.albedo.value).toBeLessThan(1);
    });

    it("should derive properties for S-type asteroid", () => {
      const properties = engine.deriveProperties(
        500, // 500 m diameter
        "S-type",
        0.9 // 90% confidence
      );

      expect(properties.density.value).toBeGreaterThan(2000);
      expect(properties.density.value).toBeLessThan(3500);
      expect(properties.albedo.value).toBeGreaterThan(0.1);
    });

    it("should derive properties for M-type asteroid", () => {
      const properties = engine.deriveProperties(
        200, // 200 m diameter
        "M-type",
        0.85 // 85% confidence
      );

      expect(properties.density.value).toBeGreaterThan(4000);
      expect(properties.density.value).toBeLessThan(7000);
      expect(properties.strength.value).toBeGreaterThan(1e7);
    });

    it("should apply size corrections", () => {
      const smallProperties = engine.deriveProperties(50, "S-type", 0.8);
      const largeProperties = engine.deriveProperties(5000, "S-type", 0.8);

      // Large asteroids should have higher density due to compaction
      expect(largeProperties.density.value).toBeGreaterThan(
        smallProperties.density.value
      );

      // Small asteroids should have higher strength
      expect(smallProperties.strength.value).toBeGreaterThan(
        largeProperties.strength.value
      );
    });

    it("should include uncertainty in all derived properties", () => {
      const properties = engine.deriveProperties(1000, "C-type", 0.8);

      expect(properties.mass.uncertainty).toBeGreaterThan(0);
      expect(properties.density.uncertainty).toBeGreaterThan(0);
      expect(properties.strength.uncertainty).toBeGreaterThan(0);
      expect(properties.porosity.uncertainty).toBeGreaterThan(0);
      expect(properties.albedo.uncertainty).toBeGreaterThan(0);
    });

    it("should include derivation methods", () => {
      const properties = engine.deriveProperties(1000, "S-type", 0.8);

      expect(properties.mass.derivationMethod).toContain(
        "Volume × bulk density"
      );
      expect(properties.density.source).toContain("S-type composition model");
    });

    it("should handle confidence propagation", () => {
      const highConfidence = engine.deriveProperties(1000, "S-type", 0.9);
      const lowConfidence = engine.deriveProperties(1000, "S-type", 0.5);

      expect(highConfidence.mass.confidence).toBeGreaterThan(
        lowConfidence.mass.confidence
      );
      expect(highConfidence.density.confidence).toBeGreaterThan(
        lowConfidence.density.confidence
      );
    });

    it("should throw error for unknown composition type", () => {
      expect(() => {
        engine.deriveProperties(1000, "Unknown-type", 0.8);
      }).toThrow("Unknown composition type: Unknown-type");
    });
  });

  describe("validateProperties", () => {
    it("should validate against known asteroid data", () => {
      // Test with a known asteroid (433 Eros)
      const properties = engine.deriveProperties(16840, "S-type", 0.9);
      const validation = engine.validateProperties("433_Eros", properties);

      expect(validation).toHaveProperty("isValid");
      expect(validation).toHaveProperty("validationResults");
      expect(Array.isArray(validation.validationResults)).toBe(true);
    });

    it("should handle unknown asteroids gracefully", () => {
      const properties = engine.deriveProperties(1000, "S-type", 0.8);
      const validation = engine.validateProperties(
        "Unknown Asteroid",
        properties
      );

      expect(validation.isValid).toBe(true); // Should not fail for unknown
      expect(validation.validationResults.length).toBeGreaterThan(0);
      expect(validation.validationResults[0].notes).toContain(
        "No validation data available"
      );
    });

    it("should assess agreement levels correctly", () => {
      const properties = engine.deriveProperties(1000, "S-type", 0.8);
      const validation = engine.validateProperties("Test Asteroid", properties);

      for (const result of validation.validationResults) {
        if (result.agreement) {
          expect(["good", "fair", "poor"]).toContain(result.agreement);
        }
      }
    });
  });

  describe("edge cases and error handling", () => {
    it("should handle very small diameters", () => {
      const result = engine.classifyComposition(1, 25.0, "Tiny Asteroid");
      expect(result.primaryType).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);

      const properties = engine.deriveProperties(
        1,
        result.primaryType,
        result.confidence
      );
      expect(properties.mass.value).toBeGreaterThan(0);
    });

    it("should handle very large diameters", () => {
      const result = engine.classifyComposition(100000, 10.0, "Huge Asteroid");
      expect(result.primaryType).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);

      const properties = engine.deriveProperties(
        100000,
        result.primaryType,
        result.confidence
      );
      expect(properties.mass.value).toBeGreaterThan(0);
    });

    it("should handle extreme absolute magnitudes", () => {
      const brightResult = engine.classifyComposition(
        1000,
        5.0,
        "Bright Asteroid"
      );
      expect(brightResult.primaryType).toBeDefined();

      const faintResult = engine.classifyComposition(
        10,
        30.0,
        "Faint Asteroid"
      );
      expect(faintResult.primaryType).toBeDefined();
    });

    it("should cap confidence at reasonable levels", () => {
      const result = engine.classifyComposition(1000, 16.0, "16 Psyche", "M");
      expect(result.confidence).toBeLessThanOrEqual(0.95);
    });

    it("should handle empty or invalid names", () => {
      const result1 = engine.classifyComposition(1000, 16.0, "");
      expect(result1.primaryType).toBeDefined();

      const result2 = engine.classifyComposition(1000, 16.0, "   ");
      expect(result2.primaryType).toBeDefined();
    });

    it("should handle invalid spectral types", () => {
      const result = engine.classifyComposition(1000, 16.0, "Test", "INVALID");
      expect(result.primaryType).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe("consistency checks", () => {
    it("should maintain mass-density-volume consistency", () => {
      const diameter = 1000;
      const properties = engine.deriveProperties(diameter, "S-type", 0.8);

      const radius = diameter / 2;
      const volume = (4 / 3) * Math.PI * Math.pow(radius, 3);
      const bulkDensity =
        properties.density.value * (1 - properties.porosity.value);
      const expectedMass = volume * bulkDensity;

      // Should be within 10% due to rounding and corrections
      const ratio = properties.mass.value / expectedMass;
      expect(ratio).toBeGreaterThan(0.9);
      expect(ratio).toBeLessThan(1.1);
    });

    it("should have reasonable uncertainty ranges", () => {
      const properties = engine.deriveProperties(1000, "C-type", 0.8);

      // Uncertainties should be reasonable fractions of values
      expect(properties.mass.uncertainty / properties.mass.value).toBeLessThan(
        1.0
      );
      expect(
        properties.density.uncertainty / properties.density.value
      ).toBeLessThan(0.5);
      expect(
        properties.strength.uncertainty / properties.strength.value
      ).toBeLessThan(1.0);
    });

    it("should have consistent alternative type probabilities", () => {
      const result = engine.classifyComposition(1000, 16.0, "Test Asteroid");

      const totalProbability = result.alternativeTypes.reduce(
        (sum, alt) => sum + alt.probability,
        0
      );

      // Total alternative probability should be reasonable
      expect(totalProbability).toBeLessThan(1.0);
      expect(totalProbability).toBeGreaterThan(0);
    });
  });
});
