/**
 * Tests for Historical Impact Event Validation
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  HistoricalValidator,
  TUNGUSKA_EVENT,
  CHELYABINSK_EVENT,
  getHistoricalEvents,
  getHistoricalEvent,
  ValidationResult,
} from "../historical";

// Mock the calculation modules
vi.mock("../../impact/blast", () => ({
  calculateBlastEffects: vi.fn(),
}));

vi.mock("../../impact/seismic", () => ({
  calculateSeismicMagnitude: vi.fn(),
}));

import { calculateBlastEffects } from "../../impact/blast";
import { calculateSeismicMagnitude } from "../../impact/seismic";

const mockCalculateBlastEffects = vi.mocked(calculateBlastEffects);
const mockCalculateSeismicMagnitude = vi.mocked(calculateSeismicMagnitude);

describe("Historical Event Data", () => {
  it("should have correct Tunguska event parameters", () => {
    expect(TUNGUSKA_EVENT.name).toBe("Tunguska");
    expect(TUNGUSKA_EVENT.date).toBe("1908-06-30");
    expect(TUNGUSKA_EVENT.impactParameters.energy.value).toBe(5.0e16); // 12 Mt
    expect(TUNGUSKA_EVENT.impactParameters.altitude.value).toBe(8.0); // km
    expect(TUNGUSKA_EVENT.observedEffects.blastRadius.value).toBe(30.0); // km
    expect(TUNGUSKA_EVENT.references).toHaveLength(3);
  });

  it("should have correct Chelyabinsk event parameters", () => {
    expect(CHELYABINSK_EVENT.name).toBe("Chelyabinsk");
    expect(CHELYABINSK_EVENT.date).toBe("2013-02-15");
    expect(CHELYABINSK_EVENT.impactParameters.energy.value).toBe(2.1e15); // 500 kt
    expect(CHELYABINSK_EVENT.impactParameters.altitude.value).toBe(23.3); // km
    expect(CHELYABINSK_EVENT.observedEffects.injuries).toBe(1491);
    expect(CHELYABINSK_EVENT.references).toHaveLength(3);
  });

  it("should provide access to historical events", () => {
    const events = getHistoricalEvents();
    expect(events).toHaveLength(2);
    expect(events[0].name).toBe("Tunguska");
    expect(events[1].name).toBe("Chelyabinsk");
  });

  it("should retrieve specific events by name", () => {
    const tunguska = getHistoricalEvent("Tunguska");
    const chelyabinsk = getHistoricalEvent("chelyabinsk"); // case insensitive
    const nonexistent = getHistoricalEvent("Meteor Crater");

    expect(tunguska?.name).toBe("Tunguska");
    expect(chelyabinsk?.name).toBe("Chelyabinsk");
    expect(nonexistent).toBeUndefined();
  });
});

describe("HistoricalValidator", () => {
  let validator: HistoricalValidator;

  beforeEach(() => {
    validator = new HistoricalValidator();
    vi.clearAllMocks();
  });

  describe("validateBlastEffects", () => {
    it("should validate blast effects against Tunguska observations", async () => {
      // Mock blast calculation results
      mockCalculateBlastEffects.mockResolvedValue({
        blastRadius: {
          value: 28.5,
          uncertainty: 5.0,
          unit: "km",
          source: "Calculated",
        },
        thermalRadius: {
          value: 16.2,
          uncertainty: 3.0,
          unit: "km",
          source: "Calculated",
        },
        overpressure: {
          value: 5000,
          uncertainty: 1000,
          unit: "Pa",
          source: "Calculated",
        },
      });

      const results = await validator.validateBlastEffects(TUNGUSKA_EVENT);

      expect(results).toHaveLength(2);
      expect(results[0].parameter).toBe("Blast Radius");
      expect(results[0].event).toBe("Tunguska");
      expect(results[0].predicted.value).toBe(28.5);
      expect(results[0].observed.value).toBe(30.0);
      expect(results[0].status).toBe("EXCELLENT"); // Within 1 sigma
    });

    it("should validate blast effects against Chelyabinsk observations", async () => {
      mockCalculateBlastEffects.mockResolvedValue({
        blastRadius: {
          value: 95.0,
          uncertainty: 15.0,
          unit: "km",
          source: "Calculated",
        },
        thermalRadius: {
          value: 48.0,
          uncertainty: 8.0,
          unit: "km",
          source: "Calculated",
        },
        overpressure: {
          value: 1000,
          uncertainty: 200,
          unit: "Pa",
          source: "Calculated",
        },
      });

      const results = await validator.validateBlastEffects(CHELYABINSK_EVENT);

      expect(results).toHaveLength(2);
      expect(results[0].parameter).toBe("Blast Radius");
      expect(results[0].event).toBe("Chelyabinsk");
      expect(results[0].agreement.withinUncertainty).toBe(true);
    });

    it("should handle calculation errors gracefully", async () => {
      mockCalculateBlastEffects.mockRejectedValue(
        new Error("Calculation failed")
      );

      const results = await validator.validateBlastEffects(TUNGUSKA_EVENT);

      expect(results).toHaveLength(0);
    });
  });

  describe("validateSeismicEffects", () => {
    it("should validate seismic magnitude calculations", async () => {
      mockCalculateSeismicMagnitude.mockResolvedValue({
        value: 4.8,
        uncertainty: 0.3,
        unit: "Richter",
        source: "Calculated",
      });

      const results = await validator.validateSeismicEffects(TUNGUSKA_EVENT);

      expect(results).toHaveLength(1);
      expect(results[0].parameter).toBe("Seismic Magnitude");
      expect(results[0].predicted.value).toBe(4.8);
      expect(results[0].observed.value).toBe(5.0);
      expect(results[0].status).toBe("EXCELLENT");
    });

    it("should handle seismic calculation errors", async () => {
      mockCalculateSeismicMagnitude.mockRejectedValue(
        new Error("Seismic calculation failed")
      );

      const results = await validator.validateSeismicEffects(CHELYABINSK_EVENT);

      expect(results).toHaveLength(0);
    });
  });

  describe("validateAllEvents", () => {
    it("should validate all historical events comprehensively", async () => {
      // Mock all calculations
      mockCalculateBlastEffects.mockResolvedValue({
        blastRadius: {
          value: 30.0,
          uncertainty: 5.0,
          unit: "km",
          source: "Test",
        },
        thermalRadius: {
          value: 15.0,
          uncertainty: 3.0,
          unit: "km",
          source: "Test",
        },
        overpressure: {
          value: 5000,
          uncertainty: 1000,
          unit: "Pa",
          source: "Test",
        },
      });

      mockCalculateSeismicMagnitude.mockResolvedValue({
        value: 5.0,
        uncertainty: 0.5,
        unit: "Richter",
        source: "Test",
      });

      const results = await validator.validateAllEvents();

      // Should have results for both events (2 events × 3 parameters each)
      expect(results.length).toBeGreaterThanOrEqual(4);

      const eventNames = [...new Set(results.map((r) => r.event))];
      expect(eventNames).toContain("Tunguska");
      expect(eventNames).toContain("Chelyabinsk");
    });
  });

  describe("validation status determination", () => {
    it("should correctly classify validation results", async () => {
      // Test different sigma deviations
      const testCases = [
        {
          predicted: 100,
          observed: 100,
          uncertainty: 10,
          expectedStatus: "EXCELLENT",
        }, // 0 sigma
        {
          predicted: 105,
          observed: 100,
          uncertainty: 10,
          expectedStatus: "EXCELLENT",
        }, // 0.5 sigma
        {
          predicted: 115,
          observed: 100,
          uncertainty: 10,
          expectedStatus: "GOOD",
        }, // 1.5 sigma
        {
          predicted: 130,
          observed: 100,
          uncertainty: 10,
          expectedStatus: "ACCEPTABLE",
        }, // ~2.12 sigma
        {
          predicted: 145,
          observed: 100,
          uncertainty: 10,
          expectedStatus: "POOR",
        }, // ~3.18 sigma
      ];

      for (const testCase of testCases) {
        mockCalculateBlastEffects.mockResolvedValue({
          blastRadius: {
            value: testCase.predicted,
            uncertainty: testCase.uncertainty,
            unit: "km",
            source: "Test",
          },
          thermalRadius: {
            value: 15,
            uncertainty: 3,
            unit: "km",
            source: "Test",
          },
          overpressure: {
            value: 5000,
            uncertainty: 1000,
            unit: "Pa",
            source: "Test",
          },
        });

        const testEvent = {
          ...TUNGUSKA_EVENT,
          observedEffects: {
            ...TUNGUSKA_EVENT.observedEffects,
            blastRadius: {
              value: testCase.observed,
              uncertainty: testCase.uncertainty,
              unit: "km",
              source: "Test",
            },
          },
        };

        const results = await validator.validateBlastEffects(testEvent);
        expect(results[0].status).toBe(testCase.expectedStatus);
      }
    });
  });

  describe("validation report generation", () => {
    it("should generate comprehensive validation report", () => {
      const mockResults: ValidationResult[] = [
        {
          event: "Tunguska",
          parameter: "Blast Radius",
          predicted: {
            value: 28.5,
            uncertainty: 5.0,
            unit: "km",
            source: "Test",
          },
          observed: {
            value: 30.0,
            uncertainty: 5.0,
            unit: "km",
            source: "Observed",
          },
          agreement: {
            withinUncertainty: true,
            sigmaDeviation: 0.21,
            percentError: 5.0,
          },
          status: "EXCELLENT",
        },
        {
          event: "Chelyabinsk",
          parameter: "Seismic Magnitude",
          predicted: {
            value: 4.1,
            uncertainty: 0.2,
            unit: "Richter",
            source: "Test",
          },
          observed: {
            value: 4.2,
            uncertainty: 0.1,
            unit: "Richter",
            source: "Observed",
          },
          agreement: {
            withinUncertainty: true,
            sigmaDeviation: 0.45,
            percentError: 2.4,
          },
          status: "EXCELLENT",
        },
      ];

      const report = validator.generateValidationReport(mockResults);

      expect(report).toContain("# Historical Event Validation Report");
      expect(report).toContain("## Tunguska Event Validation");
      expect(report).toContain("## Chelyabinsk Event Validation");
      expect(report).toContain("### Blast Radius");
      expect(report).toContain("### Seismic Magnitude");
      expect(report).toContain("**Status**: EXCELLENT");
      expect(report).toContain("**Within Uncertainty**: Yes");
    });
  });
});

describe("Integration Tests", () => {
  it("should validate that historical events have realistic parameters", () => {
    const events = getHistoricalEvents();

    for (const event of events) {
      // Energy should be positive and reasonable
      expect(event.impactParameters.energy.value).toBeGreaterThan(0);
      expect(event.impactParameters.energy.value).toBeLessThan(1e20); // Less than dinosaur killer

      // Altitude should be reasonable for airbursts
      expect(event.impactParameters.altitude.value).toBeGreaterThan(0);
      expect(event.impactParameters.altitude.value).toBeLessThan(100); // Below space

      // Velocity should be in cosmic velocity range
      expect(event.impactParameters.velocity.value).toBeGreaterThan(10);
      expect(event.impactParameters.velocity.value).toBeLessThan(80);

      // Should have scientific references
      expect(event.references.length).toBeGreaterThan(0);

      // Observed effects should be reasonable
      expect(event.observedEffects.blastRadius.value).toBeGreaterThan(0);
      expect(event.observedEffects.seismicMagnitude.value).toBeGreaterThan(0);
      expect(event.observedEffects.seismicMagnitude.value).toBeLessThan(10);
    }
  });

  it("should ensure uncertainty values are reasonable", () => {
    const events = getHistoricalEvents();

    for (const event of events) {
      // Uncertainties should be positive and reasonable fractions of values
      const energy = event.impactParameters.energy;
      expect(energy.uncertainty).toBeGreaterThan(0);
      expect(energy.uncertainty / energy.value).toBeLessThan(1.0); // Less than 100% uncertainty

      const altitude = event.impactParameters.altitude;
      expect(altitude.uncertainty).toBeGreaterThan(0);
      expect(altitude.uncertainty / altitude.value).toBeLessThan(0.5); // Less than 50% uncertainty
    }
  });
});
