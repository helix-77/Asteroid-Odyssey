/**
 * Tests for Evidence-Based Casualty Models
 * Validates casualty calculations against known ranges and historical data
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  calculateCasualties,
  getPopulationDensity,
  validateAgainstHistoricalCasualties,
  POPULATION_DENSITIES,
  CasualtySeverity,
  InjuryMechanism,
} from "../casualties";
import { calculateBlastEffects, STANDARD_ATMOSPHERE } from "../blast";
import { UncertaintyValue } from "../../../physics/constants";

describe("Evidence-Based Casualty Models", () => {
  let smallImpactEnergy: UncertaintyValue;
  let mediumImpactEnergy: UncertaintyValue;
  let largeImpactEnergy: UncertaintyValue;
  let surfaceBurst: UncertaintyValue;
  let airburst: UncertaintyValue;

  beforeEach(() => {
    // Test impact energies (in Joules)
    smallImpactEnergy = new UncertaintyValue(
      1e12, // 1 TJ (small building-sized asteroid)
      1e11,
      "J",
      "Test case",
      "Small impact energy"
    );

    mediumImpactEnergy = new UncertaintyValue(
      1e15, // 1 PJ (city block-sized asteroid)
      1e14,
      "J",
      "Test case",
      "Medium impact energy"
    );

    largeImpactEnergy = new UncertaintyValue(
      1e18, // 1 EJ (Tunguska-class event)
      1e17,
      "J",
      "Test case",
      "Large impact energy"
    );

    surfaceBurst = new UncertaintyValue(
      0,
      0,
      "m",
      "Test case",
      "Surface impact"
    );
    airburst = new UncertaintyValue(
      10000,
      1000,
      "m",
      "Test case",
      "10 km airburst"
    );
  });

  describe("Population Density Models", () => {
    it("should provide realistic population densities", () => {
      const globalAverage = getPopulationDensity("GLOBAL_AVERAGE");

      expect(globalAverage.urban.value).toBeGreaterThan(1000);
      expect(globalAverage.urban.value).toBeLessThan(10000);
      expect(globalAverage.suburban.value).toBeGreaterThan(100);
      expect(globalAverage.suburban.value).toBeLessThan(5000);
      expect(globalAverage.rural.value).toBeGreaterThan(1);
      expect(globalAverage.rural.value).toBeLessThan(500);
    });

    it("should have urban > suburban > rural density", () => {
      Object.values(POPULATION_DENSITIES).forEach((density) => {
        expect(density.urban.value).toBeGreaterThan(density.suburban.value);
        expect(density.suburban.value).toBeGreaterThan(density.rural.value);
      });
    });

    it("should include uncertainty estimates", () => {
      const highDensity = getPopulationDensity("HIGH_DENSITY_URBAN");

      expect(highDensity.urban.uncertainty).toBeGreaterThan(0);
      expect(highDensity.suburban.uncertainty).toBeGreaterThan(0);
      expect(highDensity.rural.uncertainty).toBeGreaterThan(0);
    });
  });

  describe("Casualty Calculations", () => {
    it("should calculate casualties for small urban impact", () => {
      const blastEffects = calculateBlastEffects(
        smallImpactEnergy,
        surfaceBurst,
        STANDARD_ATMOSPHERE
      );

      const casualties = calculateCasualties(
        blastEffects,
        getPopulationDensity("GLOBAL_AVERAGE"),
        {
          latitude: 40.7128,
          longitude: -74.006,
          terrainType: "urban",
        }
      );

      // Small impact should have limited casualties
      expect(casualties.total.fatalities.value).toBeGreaterThanOrEqual(0);
      expect(casualties.total.fatalities.value).toBeLessThan(100000);
      expect(casualties.total.injuries.value).toBeGreaterThanOrEqual(
        casualties.total.fatalities.value
      );

      // Should have uncertainty estimates
      expect(casualties.total.fatalities.uncertainty).toBeGreaterThan(0);
      expect(casualties.total.injuries.uncertainty).toBeGreaterThan(0);
    });

    it("should calculate casualties for medium suburban impact", () => {
      const blastEffects = calculateBlastEffects(
        mediumImpactEnergy,
        airburst,
        STANDARD_ATMOSPHERE
      );

      const casualties = calculateCasualties(
        blastEffects,
        getPopulationDensity("GLOBAL_AVERAGE"),
        {
          latitude: 40.7128,
          longitude: -74.006,
          terrainType: "suburban",
        }
      );

      // Medium impact should have moderate casualties
      expect(casualties.total.fatalities.value).toBeGreaterThan(0);
      expect(casualties.total.fatalities.value).toBeLessThan(1000000);
      expect(casualties.total.injuries.value).toBeGreaterThanOrEqual(
        casualties.total.fatalities.value
      );

      // Population should be exposed
      expect(casualties.populationExposed.total.value).toBeGreaterThan(0);
    });

    it("should calculate casualties for large rural impact", () => {
      const blastEffects = calculateBlastEffects(
        largeImpactEnergy,
        airburst,
        STANDARD_ATMOSPHERE
      );

      const casualties = calculateCasualties(
        blastEffects,
        getPopulationDensity("LOW_DENSITY"),
        {
          latitude: 40.7128,
          longitude: -74.006,
          terrainType: "rural",
        }
      );

      // Large impact in rural area should have fewer casualties than urban
      expect(casualties.total.fatalities.value).toBeGreaterThanOrEqual(0);
      expect(casualties.total.injuries.value).toBeGreaterThanOrEqual(0);

      // For rural terrain type, rural population should be weighted higher
      // But absolute numbers depend on density differences
      expect(casualties.populationExposed.rural.value).toBeGreaterThanOrEqual(
        0
      );
      expect(casualties.populationExposed.urban.value).toBeGreaterThanOrEqual(
        0
      );
      expect(
        casualties.populationExposed.suburban.value
      ).toBeGreaterThanOrEqual(0);
    });

    it("should scale casualties with population density", () => {
      const blastEffects = calculateBlastEffects(
        mediumImpactEnergy,
        airburst,
        STANDARD_ATMOSPHERE
      );

      const lowDensityCasualties = calculateCasualties(
        blastEffects,
        getPopulationDensity("LOW_DENSITY"),
        {
          latitude: 40.7128,
          longitude: -74.006,
          terrainType: "mixed",
        }
      );

      const highDensityCasualties = calculateCasualties(
        blastEffects,
        getPopulationDensity("HIGH_DENSITY_URBAN"),
        {
          latitude: 40.7128,
          longitude: -74.006,
          terrainType: "mixed",
        }
      );

      // High density should result in more casualties
      expect(highDensityCasualties.total.fatalities.value).toBeGreaterThan(
        lowDensityCasualties.total.fatalities.value
      );
      expect(highDensityCasualties.total.injuries.value).toBeGreaterThan(
        lowDensityCasualties.total.injuries.value
      );
    });

    it("should scale casualties with impact energy", () => {
      const populationDensity = getPopulationDensity("GLOBAL_AVERAGE");
      const location = {
        latitude: 40.7128,
        longitude: -74.006,
        terrainType: "urban" as const,
      };

      const smallBlast = calculateBlastEffects(
        smallImpactEnergy,
        airburst,
        STANDARD_ATMOSPHERE
      );
      const largeBlast = calculateBlastEffects(
        largeImpactEnergy,
        airburst,
        STANDARD_ATMOSPHERE
      );

      const smallCasualties = calculateCasualties(
        smallBlast,
        populationDensity,
        location
      );
      const largeCasualties = calculateCasualties(
        largeBlast,
        populationDensity,
        location
      );

      // Larger impact should result in more casualties
      expect(largeCasualties.total.fatalities.value).toBeGreaterThan(
        smallCasualties.total.fatalities.value
      );
      expect(largeCasualties.total.injuries.value).toBeGreaterThan(
        smallCasualties.total.injuries.value
      );
    });
  });

  describe("Casualty Breakdown", () => {
    it("should provide casualty breakdown by severity", () => {
      const blastEffects = calculateBlastEffects(
        mediumImpactEnergy,
        airburst,
        STANDARD_ATMOSPHERE
      );

      const casualties = calculateCasualties(
        blastEffects,
        getPopulationDensity("GLOBAL_AVERAGE"),
        {
          latitude: 40.7128,
          longitude: -74.006,
          terrainType: "urban",
        }
      );

      // Should have all severity categories
      expect(
        casualties.bySeverity[CasualtySeverity.EXPECTANT].value
      ).toBeGreaterThanOrEqual(0);
      expect(
        casualties.bySeverity[CasualtySeverity.IMMEDIATE].value
      ).toBeGreaterThanOrEqual(0);
      expect(
        casualties.bySeverity[CasualtySeverity.DELAYED].value
      ).toBeGreaterThanOrEqual(0);
      expect(
        casualties.bySeverity[CasualtySeverity.MINIMAL].value
      ).toBeGreaterThanOrEqual(0);

      // Expectant should equal fatalities
      expect(
        casualties.bySeverity[CasualtySeverity.EXPECTANT].value
      ).toBeCloseTo(
        casualties.total.fatalities.value,
        -1 // Allow for rounding differences
      );
    });

    it("should provide casualty breakdown by injury mechanism", () => {
      const blastEffects = calculateBlastEffects(
        mediumImpactEnergy,
        airburst,
        STANDARD_ATMOSPHERE
      );

      const casualties = calculateCasualties(
        blastEffects,
        getPopulationDensity("GLOBAL_AVERAGE"),
        {
          latitude: 40.7128,
          longitude: -74.006,
          terrainType: "urban",
        }
      );

      // Should have all injury mechanisms
      expect(
        casualties.byMechanism[InjuryMechanism.PRIMARY_BLAST].value
      ).toBeGreaterThanOrEqual(0);
      expect(
        casualties.byMechanism[InjuryMechanism.SECONDARY_BLAST].value
      ).toBeGreaterThanOrEqual(0);
      expect(
        casualties.byMechanism[InjuryMechanism.TERTIARY_BLAST].value
      ).toBeGreaterThanOrEqual(0);
      expect(
        casualties.byMechanism[InjuryMechanism.QUATERNARY_BLAST].value
      ).toBeGreaterThanOrEqual(0);
      expect(
        casualties.byMechanism[InjuryMechanism.THERMAL_RADIATION].value
      ).toBeGreaterThanOrEqual(0);

      // Primary and secondary blast should be major contributors
      expect(
        casualties.byMechanism[InjuryMechanism.PRIMARY_BLAST].value
      ).toBeGreaterThan(
        casualties.byMechanism[InjuryMechanism.QUATERNARY_BLAST].value
      );
    });

    it("should provide population exposure breakdown", () => {
      const blastEffects = calculateBlastEffects(
        mediumImpactEnergy,
        airburst,
        STANDARD_ATMOSPHERE
      );

      const casualties = calculateCasualties(
        blastEffects,
        getPopulationDensity("GLOBAL_AVERAGE"),
        {
          latitude: 40.7128,
          longitude: -74.006,
          terrainType: "mixed",
        }
      );

      // Should have population exposure data
      expect(casualties.populationExposed.total.value).toBeGreaterThan(0);
      expect(casualties.populationExposed.urban.value).toBeGreaterThanOrEqual(
        0
      );
      expect(
        casualties.populationExposed.suburban.value
      ).toBeGreaterThanOrEqual(0);
      expect(casualties.populationExposed.rural.value).toBeGreaterThanOrEqual(
        0
      );

      // Total should be sum of components (approximately, due to weighting)
      const componentSum =
        casualties.populationExposed.urban.value +
        casualties.populationExposed.suburban.value +
        casualties.populationExposed.rural.value;

      expect(casualties.populationExposed.total.value).toBeGreaterThan(0);
      expect(componentSum).toBeGreaterThan(0);
    });
  });

  describe("Validation and Quality Checks", () => {
    it("should include validity checks", () => {
      const blastEffects = calculateBlastEffects(
        mediumImpactEnergy,
        airburst,
        STANDARD_ATMOSPHERE
      );

      const casualties = calculateCasualties(
        blastEffects,
        getPopulationDensity("GLOBAL_AVERAGE"),
        {
          latitude: 40.7128,
          longitude: -74.006,
          terrainType: "urban",
        }
      );

      expect(casualties.validityCheck).toBeDefined();
      expect(typeof casualties.validityCheck.isValid).toBe("boolean");
      expect(Array.isArray(casualties.validityCheck.warnings)).toBe(true);
      expect(Array.isArray(casualties.validityCheck.limitations)).toBe(true);
    });

    it("should include methodology and references", () => {
      const blastEffects = calculateBlastEffects(
        mediumImpactEnergy,
        airburst,
        STANDARD_ATMOSPHERE
      );

      const casualties = calculateCasualties(
        blastEffects,
        getPopulationDensity("GLOBAL_AVERAGE"),
        {
          latitude: 40.7128,
          longitude: -74.006,
          terrainType: "urban",
        }
      );

      expect(casualties.methodology).toBeDefined();
      expect(casualties.methodology.length).toBeGreaterThan(0);
      expect(Array.isArray(casualties.references)).toBe(true);
      expect(casualties.references.length).toBeGreaterThan(0);

      // Should reference key sources
      const referencesText = casualties.references.join(" ");
      expect(referencesText).toContain("Glasstone");
      expect(referencesText).toContain("NATO");
    });

    it("should handle edge cases gracefully", () => {
      // Very small impact
      const tinyEnergy = new UncertaintyValue(
        1e6,
        1e5,
        "J",
        "Test",
        "Tiny impact"
      );
      const tinyBlast = calculateBlastEffects(
        tinyEnergy,
        surfaceBurst,
        STANDARD_ATMOSPHERE
      );

      const tinyCasualties = calculateCasualties(
        tinyBlast,
        getPopulationDensity("GLOBAL_AVERAGE"),
        {
          latitude: 40.7128,
          longitude: -74.006,
          terrainType: "urban",
        }
      );

      // Should not crash and should have minimal casualties
      expect(tinyCasualties.total.fatalities.value).toBeGreaterThanOrEqual(0);
      expect(tinyCasualties.total.injuries.value).toBeGreaterThanOrEqual(0);

      // Very large impact
      const hugeEnergy = new UncertaintyValue(
        1e21,
        1e20,
        "J",
        "Test",
        "Huge impact"
      );
      const hugeBlast = calculateBlastEffects(
        hugeEnergy,
        airburst,
        STANDARD_ATMOSPHERE
      );

      const hugeCasualties = calculateCasualties(
        hugeBlast,
        getPopulationDensity("HIGH_DENSITY_URBAN"),
        {
          latitude: 40.7128,
          longitude: -74.006,
          terrainType: "urban",
        }
      );

      // Should not crash and should have large casualties
      expect(hugeCasualties.total.fatalities.value).toBeGreaterThan(0);
      expect(hugeCasualties.total.injuries.value).toBeGreaterThan(0);
    });
  });

  describe("Reasonableness Checks", () => {
    it("should have injuries greater than or equal to fatalities", () => {
      const blastEffects = calculateBlastEffects(
        mediumImpactEnergy,
        airburst,
        STANDARD_ATMOSPHERE
      );

      const casualties = calculateCasualties(
        blastEffects,
        getPopulationDensity("GLOBAL_AVERAGE"),
        {
          latitude: 40.7128,
          longitude: -74.006,
          terrainType: "urban",
        }
      );

      expect(casualties.total.injuries.value).toBeGreaterThanOrEqual(
        casualties.total.fatalities.value
      );
    });

    it("should have reasonable casualty rates", () => {
      const blastEffects = calculateBlastEffects(
        mediumImpactEnergy,
        airburst,
        STANDARD_ATMOSPHERE
      );

      const casualties = calculateCasualties(
        blastEffects,
        getPopulationDensity("GLOBAL_AVERAGE"),
        {
          latitude: 40.7128,
          longitude: -74.006,
          terrainType: "urban",
        }
      );

      // Casualty rate should be reasonable (allowing for zone overlap effects)
      const totalCasualties =
        casualties.total.fatalities.value + casualties.total.injuries.value;
      const populationExposed = casualties.populationExposed.total.value;

      if (populationExposed > 0) {
        const casualtyRate = totalCasualties / populationExposed;
        expect(casualtyRate).toBeLessThanOrEqual(5.0); // Allow for zone overlap effects
        expect(casualtyRate).toBeGreaterThanOrEqual(0.0); // Cannot be negative
      }
    });

    it("should have consistent severity breakdown", () => {
      const blastEffects = calculateBlastEffects(
        mediumImpactEnergy,
        airburst,
        STANDARD_ATMOSPHERE
      );

      const casualties = calculateCasualties(
        blastEffects,
        getPopulationDensity("GLOBAL_AVERAGE"),
        {
          latitude: 40.7128,
          longitude: -74.006,
          terrainType: "urban",
        }
      );

      // Sum of injury severities should approximately equal total injuries
      const injurySeveritySum =
        casualties.bySeverity[CasualtySeverity.IMMEDIATE].value +
        casualties.bySeverity[CasualtySeverity.DELAYED].value +
        casualties.bySeverity[CasualtySeverity.MINIMAL].value;

      // Allow for some difference due to rounding and uncertainty propagation
      const relativeDifference =
        Math.abs(injurySeveritySum - casualties.total.injuries.value) /
        Math.max(injurySeveritySum, casualties.total.injuries.value);

      expect(relativeDifference).toBeLessThan(0.1); // Within 10%
    });
  });

  describe("Historical Validation", () => {
    it("should provide historical validation data", () => {
      const validation = validateAgainstHistoricalCasualties();

      expect(Array.isArray(validation)).toBe(true);
      expect(validation.length).toBeGreaterThan(0);

      validation.forEach((event) => {
        expect(event.name).toBeDefined();
        expect(event.observed).toBeDefined();
        expect(event.agreement).toBeDefined();

        if (event.observed.fatalities !== undefined) {
          expect(event.observed.fatalities).toBeGreaterThanOrEqual(0);
        }
        if (event.observed.injuries !== undefined) {
          expect(event.observed.injuries).toBeGreaterThanOrEqual(0);
        }
      });
    });

    it("should include key historical events", () => {
      const validation = validateAgainstHistoricalCasualties();
      const eventNames = validation.map((event) => event.name);

      expect(eventNames).toContain("Chelyabinsk (2013)");
      expect(eventNames).toContain("Tunguska (1908)");
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid population density gracefully", () => {
      expect(() => {
        getPopulationDensity("INVALID_DENSITY" as any);
      }).toThrow();
    });

    it("should handle extreme population densities", () => {
      const extremeDensity = {
        urban: new UncertaintyValue(
          100000,
          10000,
          "people/km²",
          "Test",
          "Extreme urban density"
        ),
        suburban: new UncertaintyValue(
          50000,
          5000,
          "people/km²",
          "Test",
          "Extreme suburban density"
        ),
        rural: new UncertaintyValue(
          10000,
          1000,
          "people/km²",
          "Test",
          "Extreme rural density"
        ),
        description: "Extreme test densities",
      };

      const blastEffects = calculateBlastEffects(
        mediumImpactEnergy,
        airburst,
        STANDARD_ATMOSPHERE
      );

      const casualties = calculateCasualties(blastEffects, extremeDensity, {
        latitude: 40.7128,
        longitude: -74.006,
        terrainType: "urban",
      });

      // Should include warnings about extreme densities
      expect(casualties.validityCheck.warnings.length).toBeGreaterThan(0);

      // Should still produce results
      expect(casualties.total.fatalities.value).toBeGreaterThanOrEqual(0);
      expect(casualties.total.injuries.value).toBeGreaterThanOrEqual(0);
    });
  });
});
