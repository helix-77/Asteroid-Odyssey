/**
 * Tests for Scientific Validation and Disclaimer System
 */

import { describe, it, expect } from "vitest";
import {
  ScientificValidator,
  scientificValidator,
  validateImpactParameters,
  validateOrbitalParameters,
  validateDeflectionParameters,
  PHYSICS_MODEL_RANGES,
  SCIENTIFIC_REFERENCES,
} from "../validation";

describe("Physics Model Ranges", () => {
  it("should have comprehensive validity ranges for impact parameters", () => {
    const impact = PHYSICS_MODEL_RANGES.impact;

    expect(impact.energy.minValue).toBe(1e12);
    expect(impact.energy.maxValue).toBe(1e24);
    expect(impact.energy.unit).toBe("J");

    expect(impact.velocity.minValue).toBe(11000);
    expect(impact.velocity.maxValue).toBe(72000);
    expect(impact.velocity.unit).toBe("m/s");

    expect(impact.angle.minValue).toBe(0);
    expect(impact.angle.maxValue).toBe(90);
    expect(impact.angle.unit).toBe("degrees");
  });

  it("should have comprehensive validity ranges for orbital parameters", () => {
    const orbital = PHYSICS_MODEL_RANGES.orbital;

    expect(orbital.semiMajorAxis.minValue).toBe(0.1);
    expect(orbital.semiMajorAxis.maxValue).toBe(100);
    expect(orbital.semiMajorAxis.unit).toBe("AU");

    expect(orbital.eccentricity.minValue).toBe(0);
    expect(orbital.eccentricity.maxValue).toBe(0.99);
    expect(orbital.eccentricity.unit).toBe("");
  });

  it("should have comprehensive validity ranges for deflection parameters", () => {
    const deflection = PHYSICS_MODEL_RANGES.deflection;

    expect(deflection.deltaV.minValue).toBe(1e-6);
    expect(deflection.deltaV.maxValue).toBe(1000);
    expect(deflection.deltaV.unit).toBe("m/s");

    expect(deflection.leadTime.minValue).toBe(1);
    expect(deflection.leadTime.maxValue).toBe(50);
    expect(deflection.leadTime.unit).toBe("years");
  });
});

describe("Scientific References", () => {
  it("should have complete reference information", () => {
    const holsapple = SCIENTIFIC_REFERENCES.holsapple2007;

    expect(holsapple.authors).toBe("Holsapple, K. A., & Housen, K. R.");
    expect(holsapple.year).toBe(2007);
    expect(holsapple.title).toContain("crater");
    expect(holsapple.journal).toBe("Icarus");
    expect(holsapple.doi).toBeDefined();
    expect(holsapple.notes).toBeDefined();
  });

  it("should include key references for all physics domains", () => {
    expect(SCIENTIFIC_REFERENCES.holsapple2007).toBeDefined(); // Impact
    expect(SCIENTIFIC_REFERENCES.collins2005).toBeDefined(); // Impact
    expect(SCIENTIFIC_REFERENCES.meeus1998).toBeDefined(); // Orbital
    expect(SCIENTIFIC_REFERENCES.standish1998).toBeDefined(); // Orbital
    expect(SCIENTIFIC_REFERENCES.ahrens1992).toBeDefined(); // Deflection
  });
});

describe("ScientificValidator", () => {
  let validator: ScientificValidator;

  beforeEach(() => {
    validator = new ScientificValidator();
  });

  describe("validateParameter", () => {
    it("should validate parameters within range", () => {
      const result = validator.validateParameter("impact", "energy", 1e15, "J");

      expect(result.isValid).toBe(true);
      expect(result.disclaimer).toBeUndefined();
    });

    it("should flag parameters below minimum range", () => {
      const result = validator.validateParameter("impact", "energy", 5e11, "J"); // Closer to minimum

      expect(result.isValid).toBe(false);
      expect(result.disclaimer).toBeDefined();
      expect(result.disclaimer!.level).toBe("CAUTION");
      expect(result.disclaimer!.category).toBe("VALIDITY");
      expect(result.disclaimer!.message).toContain("outside validated range");
    });

    it("should flag parameters above maximum range", () => {
      const result = validator.validateParameter(
        "orbital",
        "eccentricity",
        1.5
      );

      expect(result.isValid).toBe(false);
      expect(result.disclaimer).toBeDefined();
      expect(result.disclaimer!.level).toBe("CAUTION");
      expect(result.disclaimer!.limitations).toHaveLength(1);
      expect(result.disclaimer!.limitations[0].impact).toBe("HIGH");
    });

    it("should flag extremely out-of-range parameters as critical", () => {
      const result = validator.validateParameter(
        "impact",
        "velocity",
        1000000,
        "m/s"
      );

      expect(result.isValid).toBe(false);
      expect(result.disclaimer!.level).toBe("CRITICAL");
    });

    it("should handle unknown parameters", () => {
      const result = validator.validateParameter("impact", "unknownParam", 100);

      expect(result.isValid).toBe(false);
      expect(result.disclaimer!.level).toBe("WARNING");
      expect(result.disclaimer!.message).toContain("Unknown parameter");
    });
  });

  describe("generateModelDisclaimer", () => {
    it("should generate appropriate disclaimers for impact models", () => {
      const assumptions = ["Spherical asteroid", "Homogeneous target"];
      const limitations = [
        {
          aspect: "Geometry",
          description: "Assumes spherical impactor",
          impact: "MEDIUM" as const,
        },
      ];

      const disclaimer = validator.generateModelDisclaimer(
        "impact",
        assumptions,
        limitations
      );

      expect(disclaimer.level).toBe("WARNING");
      expect(disclaimer.category).toBe("ASSUMPTION");
      expect(disclaimer.message).toContain("simplified models");
      expect(disclaimer.limitations).toEqual(limitations);
      expect(disclaimer.references.length).toBeGreaterThan(0);
    });

    it("should generate appropriate disclaimers for orbital models", () => {
      const disclaimer = validator.generateModelDisclaimer("orbital", [], []);

      expect(disclaimer.level).toBe("INFO");
      expect(disclaimer.category).toBe("ASSUMPTION");
      expect(disclaimer.message).toContain("standard approximations");
    });

    it("should generate appropriate disclaimers for deflection models", () => {
      const disclaimer = validator.generateModelDisclaimer(
        "deflection",
        [],
        []
      );

      expect(disclaimer.level).toBe("CAUTION");
      expect(disclaimer.category).toBe("ASSUMPTION");
      expect(disclaimer.message).toContain("idealized scenarios");
    });
  });

  describe("generateDataQualityDisclaimer", () => {
    it("should generate disclaimers for high uncertainty data", () => {
      const disclaimer = validator.generateDataQualityDisclaimer(
        "Test Source",
        "HIGH"
      );

      expect(disclaimer.level).toBe("CRITICAL");
      expect(disclaimer.category).toBe("DATA_QUALITY");
      expect(disclaimer.message).toContain("high uncertainty");
      expect(disclaimer.limitations[0].impact).toBe("HIGH");
      expect(disclaimer.limitations[0].mitigation).toBeDefined();
    });

    it("should generate disclaimers for medium uncertainty data", () => {
      const disclaimer = validator.generateDataQualityDisclaimer(
        "NASA JPL",
        "MEDIUM"
      );

      expect(disclaimer.level).toBe("CAUTION");
      expect(disclaimer.message).toContain("moderate uncertainty");
      expect(disclaimer.limitations[0].impact).toBe("MEDIUM");
    });

    it("should generate disclaimers for low uncertainty data", () => {
      const disclaimer = validator.generateDataQualityDisclaimer(
        "JPL Horizons",
        "LOW"
      );

      expect(disclaimer.level).toBe("INFO");
      expect(disclaimer.message).toContain("well-constrained");
      expect(disclaimer.limitations[0].impact).toBe("LOW");
    });

    it("should flag outdated data", () => {
      const oldDate = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000); // 2 years ago
      const disclaimer = validator.generateDataQualityDisclaimer(
        "Old Source",
        "LOW",
        oldDate
      );

      expect(disclaimer.limitations).toHaveLength(2);
      expect(disclaimer.limitations[1].aspect).toBe("Data currency");
      expect(disclaimer.limitations[1].impact).toBe("MEDIUM");
    });
  });

  describe("generateAccuracyDisclaimer", () => {
    it("should generate disclaimers for low accuracy calculations", () => {
      const disclaimer = validator.generateAccuracyDisclaimer(
        "Impact Energy",
        60
      );

      expect(disclaimer.level).toBe("CRITICAL");
      expect(disclaimer.category).toBe("ACCURACY");
      expect(disclaimer.message).toContain("±60%");
      expect(disclaimer.limitations[0].impact).toBe("HIGH");
    });

    it("should generate disclaimers for moderate accuracy calculations", () => {
      const disclaimer = validator.generateAccuracyDisclaimer(
        "Orbital Position",
        25
      );

      expect(disclaimer.level).toBe("CAUTION");
      expect(disclaimer.message).toContain("±25%");
      expect(disclaimer.limitations[0].impact).toBe("HIGH");
    });

    it("should generate disclaimers for high accuracy calculations", () => {
      const disclaimer = validator.generateAccuracyDisclaimer(
        "Kepler Solver",
        5
      );

      expect(disclaimer.level).toBe("INFO");
      expect(disclaimer.message).toContain("±5%");
      expect(disclaimer.limitations[0].impact).toBe("MEDIUM");
    });

    it("should note uncertainty propagation when included", () => {
      const disclaimer = validator.generateAccuracyDisclaimer(
        "Test Calc",
        10,
        true
      );

      expect(disclaimer.limitations[0].mitigation).toContain(
        "Uncertainty propagation included"
      );
    });
  });

  describe("combineDisclaimers", () => {
    it("should return info disclaimer for empty array", () => {
      const combined = validator.combineDisclaimers([]);

      expect(combined.level).toBe("INFO");
      expect(combined.message).toContain("within validated parameter ranges");
    });

    it("should return single disclaimer unchanged", () => {
      const single = validator.generateAccuracyDisclaimer("Test", 10);
      const combined = validator.combineDisclaimers([single]);

      expect(combined).toEqual(single);
    });

    it("should combine multiple disclaimers with highest severity", () => {
      const info = validator.generateAccuracyDisclaimer("Test1", 5);
      const warning = validator.generateModelDisclaimer("impact", [], []);
      const critical = validator.generateDataQualityDisclaimer("Test", "HIGH");

      const combined = validator.combineDisclaimers([info, warning, critical]);

      expect(combined.level).toBe("CRITICAL");
      expect(combined.category).toBe("LIMITATION");
      expect(combined.message).toContain("3 issues identified");
      expect(combined.limitations.length).toBeGreaterThan(0);
      expect(combined.references.length).toBeGreaterThan(0);
    });

    it("should deduplicate limitations and references", () => {
      const disclaimer1 = validator.generateDataQualityDisclaimer(
        "Source1",
        "MEDIUM"
      );
      const disclaimer2 = validator.generateDataQualityDisclaimer(
        "Source2",
        "MEDIUM"
      );

      const combined = validator.combineDisclaimers([disclaimer1, disclaimer2]);

      // Should have unique limitations (both have 'Data quality' aspect)
      const dataQualityLimitations = combined.limitations.filter(
        (l) => l.aspect === "Data quality"
      );
      expect(dataQualityLimitations).toHaveLength(1);
    });
  });

  describe("formatDisclaimer", () => {
    it("should format disclaimer with all sections", () => {
      const disclaimer = validator.generateModelDisclaimer(
        "impact",
        ["test"],
        [
          {
            aspect: "Test",
            description: "Test limitation",
            impact: "HIGH",
            mitigation: "Test mitigation",
          },
        ]
      );

      const formatted = validator.formatDisclaimer(disclaimer);

      expect(formatted).toContain("**WARNING**:");
      expect(formatted).toContain("**Scientific Basis**:");
      expect(formatted).toContain("**Limitations**:");
      expect(formatted).toContain("**Recommendations**:");
      expect(formatted).toContain("**References**:");
      expect(formatted).toContain("*Mitigation: Test mitigation*");
    });

    it("should handle disclaimers without optional sections", () => {
      const disclaimer = {
        level: "INFO" as const,
        category: "ACCURACY" as const,
        message: "Test message",
        scientificBasis: "Test basis",
        limitations: [],
        references: [],
      };

      const formatted = validator.formatDisclaimer(disclaimer);

      expect(formatted).toContain("**INFO**: Test message");
      expect(formatted).toContain("**Scientific Basis**: Test basis");
      expect(formatted).not.toContain("**Limitations**:");
      expect(formatted).not.toContain("**Recommendations**:");
      expect(formatted).not.toContain("**References**:");
    });
  });
});

describe("Convenience Functions", () => {
  describe("validateImpactParameters", () => {
    it("should validate all impact parameters", () => {
      const disclaimers = validateImpactParameters({
        energy: 1e15,
        velocity: 20000,
        angle: 45,
        diameter: 100,
      });

      expect(disclaimers).toHaveLength(0); // All within range
    });

    it("should return disclaimers for out-of-range parameters", () => {
      const disclaimers = validateImpactParameters({
        energy: 1e10, // Too low
        velocity: 100000, // Too high
        angle: 45, // OK
      });

      expect(disclaimers).toHaveLength(2);
      expect(disclaimers[0].message).toContain("energy");
      expect(disclaimers[1].message).toContain("velocity");
    });

    it("should handle undefined parameters", () => {
      const disclaimers = validateImpactParameters({
        energy: 1e15,
        // Other parameters undefined
      });

      expect(disclaimers).toHaveLength(0);
    });
  });

  describe("validateOrbitalParameters", () => {
    it("should validate orbital parameters", () => {
      const disclaimers = validateOrbitalParameters({
        semiMajorAxis: 1.5,
        eccentricity: 0.3,
        inclination: 15,
      });

      expect(disclaimers).toHaveLength(0);
    });

    it("should flag invalid orbital parameters", () => {
      const disclaimers = validateOrbitalParameters({
        semiMajorAxis: 0.05, // Too low
        eccentricity: 1.2, // Too high (>1 = hyperbolic)
        inclination: 200, // Too high
      });

      expect(disclaimers).toHaveLength(3);
    });
  });

  describe("validateDeflectionParameters", () => {
    it("should validate deflection parameters", () => {
      const disclaimers = validateDeflectionParameters({
        deltaV: 0.1,
        leadTime: 10,
        asteroidMass: 1e12,
      });

      expect(disclaimers).toHaveLength(0);
    });

    it("should flag unrealistic deflection parameters", () => {
      const disclaimers = validateDeflectionParameters({
        deltaV: 2000, // Too high
        leadTime: 100, // Too long
        asteroidMass: 1e20, // Too massive
      });

      expect(disclaimers).toHaveLength(3);
    });
  });
});

describe("Global Validator Instance", () => {
  it("should provide a global validator instance", () => {
    expect(scientificValidator).toBeInstanceOf(ScientificValidator);

    const result = scientificValidator.validateParameter(
      "impact",
      "energy",
      1e15
    );
    expect(result.isValid).toBe(true);
  });
});

describe("Integration Tests", () => {
  it("should provide comprehensive validation for complex scenarios", () => {
    // Simulate a complex impact scenario with multiple issues
    const impactDisclaimers = validateImpactParameters({
      energy: 1e10, // Too low
      velocity: 15000, // OK
      angle: 45, // OK
      diameter: 0.0001, // Too small
    });

    const dataDisclaimer = scientificValidator.generateDataQualityDisclaimer(
      "Estimated values",
      "HIGH"
    );

    const modelDisclaimer = scientificValidator.generateModelDisclaimer(
      "impact",
      ["Spherical asteroid", "Homogeneous target"],
      [
        {
          aspect: "Geometry",
          description: "Simplified shape assumptions",
          impact: "MEDIUM",
        },
      ]
    );

    const allDisclaimers = [
      ...impactDisclaimers,
      dataDisclaimer,
      modelDisclaimer,
    ];
    const combined = scientificValidator.combineDisclaimers(allDisclaimers);

    expect(combined.level).toBe("CRITICAL");
    expect(combined.limitations.length).toBeGreaterThan(2);
    expect(combined.references.length).toBeGreaterThan(0);
    expect(combined.recommendations!.length).toBeGreaterThan(0);

    const formatted = scientificValidator.formatDisclaimer(combined);
    expect(formatted).toContain("**CRITICAL**");
    expect(formatted.length).toBeGreaterThan(500); // Comprehensive disclaimer
  });

  it("should handle edge cases gracefully", () => {
    // Test with extreme values
    const result1 = scientificValidator.validateParameter(
      "impact",
      "energy",
      0
    );
    expect(result1.isValid).toBe(false);
    expect(result1.disclaimer!.level).toBe("CRITICAL");

    const result2 = scientificValidator.validateParameter(
      "orbital",
      "eccentricity",
      -0.1
    );
    expect(result2.isValid).toBe(false);

    // Test with very recent data
    const recentDisclaimer = scientificValidator.generateDataQualityDisclaimer(
      "Fresh Data",
      "LOW",
      new Date()
    );
    expect(recentDisclaimer.limitations).toHaveLength(1); // No currency issue
  });
});
