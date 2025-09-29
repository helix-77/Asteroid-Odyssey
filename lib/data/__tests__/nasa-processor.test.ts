/**
 * Tests for NASA Data Processor
 */

import { describe, it, expect, beforeEach } from "vitest";
import { NASADataProcessor, ScientificAsteroid } from "../nasa-processor";

describe("NASADataProcessor", () => {
  let processor: NASADataProcessor;

  beforeEach(() => {
    processor = new NASADataProcessor();
  });

  const mockRawData = [
    {
      name: "1566 Icarus (1949 MA)",
      neo_reference_id: "2001566",
      absolute_magnitude_h: 16.53,
      is_potentially_hazardous_asteroid: true,
      est_diameter_min_m: 1313.877806011,
      est_diameter_max_m: 2937.9200883689,
      closest_approach_date: "2137-06-15",
      miss_distance_km: "5918307.427408966",
      relative_velocity_km_s: "28.2663007197",
      orbiting_body: "Earth",
    },
    {
      name: "25143 Itokawa (1998 SF36)",
      neo_reference_id: "2025143",
      absolute_magnitude_h: 19.26,
      is_potentially_hazardous_asteroid: true,
      est_diameter_min_m: 373.7274319137,
      est_diameter_max_m: 835.6799428155,
      closest_approach_date: "1905-06-27",
      miss_distance_km: "1728718.144376077",
      relative_velocity_km_s: "6.1597657534",
      orbiting_body: "Earth",
    },
  ];

  describe("processNASAData", () => {
    it("should process raw NASA data successfully", () => {
      const result = processor.processNASAData(mockRawData);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("neoReferenceId");
    });

    it("should generate proper IDs", () => {
      const result = processor.processNASAData(mockRawData);

      expect(result[0].id).toBe("nasa-2001566");
      expect(result[1].id).toBe("nasa-2025143");
    });

    it("should preserve original names", () => {
      const result = processor.processNASAData(mockRawData);

      expect(result[0].name).toBe("1566 Icarus (1949 MA)");
      expect(result[1].name).toBe("25143 Itokawa (1998 SF36)");
    });
  });

  describe("diameter calculations", () => {
    it("should calculate diameter with uncertainty", () => {
      const result = processor.processNASAData([mockRawData[0]]);
      const asteroid = result[0];

      expect(asteroid.diameter.min).toBe(1313.877806011);
      expect(asteroid.diameter.max).toBe(2937.9200883689);
      expect(asteroid.diameter.estimated).toBeGreaterThan(
        asteroid.diameter.min
      );
      expect(asteroid.diameter.estimated).toBeLessThan(asteroid.diameter.max);
      expect(asteroid.diameter.uncertainty).toBeGreaterThan(0);
      expect(asteroid.diameter.unit).toBe("meters");
    });

    it("should use geometric mean for diameter estimation", () => {
      const result = processor.processNASAData([mockRawData[0]]);
      const asteroid = result[0];

      const expectedDiameter = Math.sqrt(1313.877806011 * 2937.9200883689);
      expect(asteroid.diameter.estimated).toBeCloseTo(expectedDiameter, 1);
    });
  });

  describe("composition derivation", () => {
    it("should assign composition based on size", () => {
      const result = processor.processNASAData(mockRawData);

      // Larger asteroid should be C-type
      expect(result[0].composition.type).toBe("C-type");
      expect(result[0].composition.confidence).toBeGreaterThan(0);

      // Smaller asteroid should be S-type
      expect(result[1].composition.type).toBe("S-type");
      expect(result[1].composition.confidence).toBeGreaterThan(0);
    });

    it("should include composition source", () => {
      const result = processor.processNASAData([mockRawData[0]]);

      expect(result[0].composition.source).toContain(
        "Heuristic classification"
      );
    });
  });

  describe("mass calculations", () => {
    it("should calculate mass from diameter and composition", () => {
      const result = processor.processNASAData([mockRawData[0]]);
      const asteroid = result[0];

      expect(asteroid.mass.value).toBeGreaterThan(0);
      expect(asteroid.mass.uncertainty).toBeGreaterThan(0);
      expect(asteroid.mass.unit).toBe("kg");
      expect(asteroid.mass.derivationMethod).toContain("Volume from diameter");
    });

    it("should have reasonable mass values", () => {
      const result = processor.processNASAData([mockRawData[0]]);
      const asteroid = result[0];

      // Mass should be in reasonable range for asteroid
      expect(asteroid.mass.value).toBeGreaterThan(1e12); // At least 1 trillion kg
      expect(asteroid.mass.value).toBeLessThan(1e20); // Less than large asteroid
    });
  });

  describe("density calculations", () => {
    it("should assign density based on composition", () => {
      const result = processor.processNASAData([mockRawData[0]]);
      const asteroid = result[0];

      expect(asteroid.density.value).toBeGreaterThan(0);
      expect(asteroid.density.uncertainty).toBeGreaterThan(0);
      expect(asteroid.density.unit).toBe("kg/m³");
      expect(asteroid.density.source).toContain(asteroid.composition.type);
    });

    it("should use appropriate density ranges", () => {
      const result = processor.processNASAData(mockRawData);

      for (const asteroid of result) {
        expect(asteroid.density.value).toBeGreaterThan(500); // Minimum reasonable density
        expect(asteroid.density.value).toBeLessThan(8000); // Maximum reasonable density
      }
    });
  });

  describe("data quality assessment", () => {
    it("should assign uncertainty class", () => {
      const result = processor.processNASAData([mockRawData[0]]);
      const asteroid = result[0];

      expect(["HIGH", "MEDIUM", "LOW"]).toContain(
        asteroid.dataQuality.uncertaintyClass
      );
      expect(asteroid.dataQuality.dataReliability).toBeGreaterThan(0);
      expect(asteroid.dataQuality.dataReliability).toBeLessThanOrEqual(1);
    });

    it("should include observation arc information", () => {
      const result = processor.processNASAData([mockRawData[0]]);
      const asteroid = result[0];

      expect(asteroid.dataQuality.observationArc.days).toBeGreaterThan(0);
      expect(asteroid.dataQuality.numberOfObservations).toBeGreaterThan(0);
    });
  });

  describe("close approach data", () => {
    it("should convert miss distance to multiple units", () => {
      const result = processor.processNASAData([mockRawData[0]]);
      const asteroid = result[0];

      const kmDistance = parseFloat(mockRawData[0].miss_distance_km);
      expect(asteroid.closeApproach.missDistance.km).toBe(kmDistance);
      expect(asteroid.closeApproach.missDistance.au).toBeCloseTo(
        kmDistance / 149597870.7,
        6
      );
      expect(asteroid.closeApproach.missDistance.lunar).toBeCloseTo(
        kmDistance / 384400,
        3
      );
    });

    it("should convert velocity to multiple units", () => {
      const result = processor.processNASAData([mockRawData[0]]);
      const asteroid = result[0];

      const kmPerSec = parseFloat(mockRawData[0].relative_velocity_km_s);
      expect(asteroid.closeApproach.relativeVelocity.kmPerSec).toBe(kmPerSec);
      expect(asteroid.closeApproach.relativeVelocity.kmPerHour).toBe(
        kmPerSec * 3600
      );
    });

    it("should convert date to Julian date", () => {
      const result = processor.processNASAData([mockRawData[0]]);
      const asteroid = result[0];

      expect(asteroid.closeApproach.julianDate).toBeGreaterThan(2400000); // Reasonable JD
      expect(asteroid.closeApproach.date).toBe(
        mockRawData[0].closest_approach_date
      );
    });
  });

  describe("threat assessment", () => {
    it("should preserve PHA status", () => {
      const result = processor.processNASAData([mockRawData[0]]);
      const asteroid = result[0];

      expect(asteroid.threatAssessment.isPotentiallyHazardous).toBe(true);
    });

    it("should assign threat levels", () => {
      const result = processor.processNASAData(mockRawData);

      for (const asteroid of result) {
        expect(["low", "medium", "high", "critical"]).toContain(
          asteroid.threatAssessment.threatLevel
        );
      }
    });

    it("should calculate impact probability", () => {
      const result = processor.processNASAData([mockRawData[0]]);
      const asteroid = result[0];

      expect(
        asteroid.threatAssessment.impactProbability
      ).toBeGreaterThanOrEqual(0);
      expect(asteroid.threatAssessment.impactProbability).toBeLessThanOrEqual(
        1
      );
    });
  });

  describe("metadata", () => {
    it("should include processing metadata", () => {
      const result = processor.processNASAData([mockRawData[0]]);
      const asteroid = result[0];

      expect(asteroid.metadata.lastUpdated).toBeDefined();
      expect(asteroid.metadata.dataVersion).toBe("1.0.0");
      expect(asteroid.metadata.sources).toContain(
        "NASA JPL Small-Body Database"
      );
      expect(Array.isArray(asteroid.metadata.processingNotes)).toBe(true);
    });
  });

  describe("error handling", () => {
    it("should handle invalid data gracefully", () => {
      const invalidData = [
        {
          name: "Invalid Asteroid",
          neo_reference_id: "invalid",
          absolute_magnitude_h: -999, // Invalid magnitude
          is_potentially_hazardous_asteroid: true,
          est_diameter_min_m: -100, // Invalid diameter
          est_diameter_max_m: -50,
          closest_approach_date: "invalid-date",
          miss_distance_km: "not-a-number",
          relative_velocity_km_s: "invalid",
          orbiting_body: "Earth",
        },
      ];

      // Should not throw, but may return empty array or skip invalid entries
      expect(() => processor.processNASAData(invalidData)).not.toThrow();
    });

    it("should continue processing after encountering invalid data", () => {
      const mixedData = [
        {
          name: "Invalid Asteroid",
          neo_reference_id: "invalid",
          absolute_magnitude_h: -999,
          is_potentially_hazardous_asteroid: true,
          est_diameter_min_m: -100,
          est_diameter_max_m: -50,
          closest_approach_date: "invalid-date",
          miss_distance_km: "not-a-number",
          relative_velocity_km_s: "invalid",
          orbiting_body: "Earth",
        },
        mockRawData[0], // Valid data
      ];

      const result = processor.processNASAData(mixedData);
      // Should process at least the valid entry
      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });
});
