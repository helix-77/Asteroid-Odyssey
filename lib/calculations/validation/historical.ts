/**
 * Historical Impact Event Validation
 *
 * This module provides validation of impact physics models against well-documented
 * historical impact events, specifically Tunguska (1908) and Chelyabinsk (2013).
 *
 * References:
 * - Boslough & Crawford (2008) - Tunguska airburst modeling
 * - Brown et al. (2013) - Chelyabinsk impact analysis
 * - Popova et al. (2013) - Chelyabinsk observational data
 */

import { UncertaintyValue } from "../../physics/uncertainty";
import { calculateBlastEffects } from "../impact/blast";
import { calculateCraterFormation } from "../impact/crater";
import { calculateSeismicMagnitude } from "../impact/seismic";

export interface HistoricalEvent {
  name: string;
  date: string;
  location: {
    latitude: number;
    longitude: number;
    altitude: number; // km above sea level
  };
  impactParameters: {
    energy: UncertaintyValue; // Joules
    altitude: UncertaintyValue; // km above ground
    velocity: UncertaintyValue; // km/s
    angle: UncertaintyValue; // degrees from horizontal
    diameter: UncertaintyValue; // meters
    mass: UncertaintyValue; // kg
    composition: string;
  };
  observedEffects: {
    blastRadius: UncertaintyValue; // km
    seismicMagnitude: UncertaintyValue;
    thermalEffects: UncertaintyValue; // km radius
    damageRadius: UncertaintyValue; // km
    casualties: number;
    injuries: number;
  };
  references: string[];
}

/**
 * Tunguska Event (1908)
 * 12 Mt airburst at 8 km altitude
 */
export const TUNGUSKA_EVENT: HistoricalEvent = {
  name: "Tunguska",
  date: "1908-06-30",
  location: {
    latitude: 60.886,
    longitude: 101.893,
    altitude: 0.15, // Siberian plateau
  },
  impactParameters: {
    energy: {
      value: 5.0e16, // 12 Mt TNT equivalent
      uncertainty: 2.0e16,
      unit: "J",
      source: "Boslough & Crawford (2008)",
    },
    altitude: {
      value: 8.0,
      uncertainty: 2.0,
      unit: "km",
      source: "Chyba et al. (1993)",
    },
    velocity: {
      value: 20.0,
      uncertainty: 5.0,
      unit: "km/s",
      source: "Hills & Goda (1993)",
    },
    angle: {
      value: 45.0,
      uncertainty: 15.0,
      unit: "degrees",
      source: "Estimated from trajectory analysis",
    },
    diameter: {
      value: 60.0,
      uncertainty: 20.0,
      unit: "m",
      source: "Derived from energy estimates",
    },
    mass: {
      value: 3.0e8,
      uncertainty: 1.5e8,
      unit: "kg",
      source: "Assuming stony composition",
    },
    composition: "Stony (S-type)",
  },
  observedEffects: {
    blastRadius: {
      value: 30.0,
      uncertainty: 5.0,
      unit: "km",
      source: "Tree fall radius observations",
    },
    seismicMagnitude: {
      value: 5.0,
      uncertainty: 0.5,
      unit: "Richter",
      source: "Seismic station records",
    },
    thermalEffects: {
      value: 15.0,
      uncertainty: 5.0,
      unit: "km",
      source: "Burn damage radius",
    },
    damageRadius: {
      value: 2150.0,
      uncertainty: 200.0,
      unit: "km²",
      source: "Total forest damage area",
    },
    casualties: 0,
    injuries: 0,
  },
  references: [
    "Boslough, M. B., & Crawford, D. A. (2008). Low-altitude airbursts and the impact threat. International Journal of Impact Engineering, 35(12), 1441-1448.",
    "Chyba, C. F., Thomas, P. J., & Zahnle, K. J. (1993). The 1908 Tunguska explosion: atmospheric disruption of a stony asteroid. Nature, 361(6407), 40-44.",
    "Hills, J. G., & Goda, M. P. (1993). The fragmentation of small asteroids in the atmosphere. The Astronomical Journal, 105(3), 1114-1144.",
  ],
};

/**
 * Chelyabinsk Event (2013)
 * 500 kt airburst at 23 km altitude
 */
export const CHELYABINSK_EVENT: HistoricalEvent = {
  name: "Chelyabinsk",
  date: "2013-02-15",
  location: {
    latitude: 55.15,
    longitude: 61.41,
    altitude: 0.2, // Ural Mountains foothills
  },
  impactParameters: {
    energy: {
      value: 2.1e15, // 500 kt TNT equivalent
      uncertainty: 3.0e14,
      unit: "J",
      source: "Brown et al. (2013)",
    },
    altitude: {
      value: 23.3,
      uncertainty: 0.7,
      unit: "km",
      source: "Popova et al. (2013)",
    },
    velocity: {
      value: 19.16,
      uncertainty: 0.15,
      unit: "km/s",
      source: "Borovička et al. (2013)",
    },
    angle: {
      value: 18.3,
      uncertainty: 0.5,
      unit: "degrees",
      source: "Trajectory analysis from videos",
    },
    diameter: {
      value: 19.8,
      uncertainty: 1.0,
      unit: "m",
      source: "Popova et al. (2013)",
    },
    mass: {
      value: 1.3e7,
      uncertainty: 2.0e6,
      unit: "kg",
      source: "Pre-atmospheric mass estimate",
    },
    composition: "Ordinary chondrite (LL5)",
  },
  observedEffects: {
    blastRadius: {
      value: 100.0,
      uncertainty: 10.0,
      unit: "km",
      source: "Window damage radius",
    },
    seismicMagnitude: {
      value: 4.2,
      uncertainty: 0.1,
      unit: "Richter",
      source: "Regional seismic networks",
    },
    thermalEffects: {
      value: 50.0,
      uncertainty: 10.0,
      unit: "km",
      source: "Thermal radiation observations",
    },
    damageRadius: {
      value: 200.0,
      uncertainty: 20.0,
      unit: "km",
      source: "Building damage assessment",
    },
    casualties: 0,
    injuries: 1491,
  },
  references: [
    "Brown, P., et al. (2013). A 500-kiloton airburst over Chelyabinsk and an enhanced hazard from small impactors. Nature, 503(7475), 238-241.",
    "Popova, O. P., et al. (2013). Chelyabinsk airburst, damage assessment, meteorite recovery, and characterization. Science, 342(6162), 1069-1073.",
    "Borovička, J., et al. (2013). The trajectory, structure and origin of the Chelyabinsk asteroidal impactor. Nature, 503(7475), 235-237.",
  ],
};

export interface ValidationResult {
  event: string;
  parameter: string;
  predicted: UncertaintyValue;
  observed: UncertaintyValue;
  agreement: {
    withinUncertainty: boolean;
    sigmaDeviation: number;
    percentError: number;
  };
  status: "EXCELLENT" | "GOOD" | "ACCEPTABLE" | "POOR";
}

/**
 * Validate impact physics models against historical events
 */
export class HistoricalValidator {
  private events: HistoricalEvent[] = [TUNGUSKA_EVENT, CHELYABINSK_EVENT];

  /**
   * Validate blast effects calculations against historical observations
   */
  async validateBlastEffects(
    event: HistoricalEvent
  ): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    try {
      // Calculate predicted blast effects using our models
      const blastResults = await calculateBlastEffects({
        energy: event.impactParameters.energy,
        altitude: event.impactParameters.altitude,
        angle: event.impactParameters.angle,
        targetDensity: {
          value: 1.225,
          uncertainty: 0.1,
          unit: "kg/m³",
          source: "Sea level air density",
        },
      });

      // Compare blast radius
      const blastRadiusResult = this.compareValues(
        "Blast Radius",
        blastResults.blastRadius,
        event.observedEffects.blastRadius
      );
      results.push({
        event: event.name,
        parameter: "Blast Radius",
        predicted: blastResults.blastRadius,
        observed: event.observedEffects.blastRadius,
        agreement: blastRadiusResult,
        status: this.getValidationStatus(blastRadiusResult.sigmaDeviation),
      });

      // Compare thermal effects
      const thermalResult = this.compareValues(
        "Thermal Effects",
        blastResults.thermalRadius,
        event.observedEffects.thermalEffects
      );
      results.push({
        event: event.name,
        parameter: "Thermal Effects",
        predicted: blastResults.thermalRadius,
        observed: event.observedEffects.thermalEffects,
        agreement: thermalResult,
        status: this.getValidationStatus(thermalResult.sigmaDeviation),
      });
    } catch (error) {
      console.error(`Error validating blast effects for ${event.name}:`, error);
    }

    return results;
  }

  /**
   * Validate seismic magnitude calculations
   */
  async validateSeismicEffects(
    event: HistoricalEvent
  ): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    try {
      const seismicMagnitude = await calculateSeismicMagnitude({
        energy: event.impactParameters.energy,
        distance: {
          value: 100,
          uncertainty: 10,
          unit: "km",
          source: "Typical monitoring distance",
        },
      });

      const seismicResult = this.compareValues(
        "Seismic Magnitude",
        seismicMagnitude,
        event.observedEffects.seismicMagnitude
      );

      results.push({
        event: event.name,
        parameter: "Seismic Magnitude",
        predicted: seismicMagnitude,
        observed: event.observedEffects.seismicMagnitude,
        agreement: seismicResult,
        status: this.getValidationStatus(seismicResult.sigmaDeviation),
      });
    } catch (error) {
      console.error(
        `Error validating seismic effects for ${event.name}:`,
        error
      );
    }

    return results;
  }

  /**
   * Run comprehensive validation against all historical events
   */
  async validateAllEvents(): Promise<ValidationResult[]> {
    const allResults: ValidationResult[] = [];

    for (const event of this.events) {
      const blastResults = await this.validateBlastEffects(event);
      const seismicResults = await this.validateSeismicEffects(event);

      allResults.push(...blastResults, ...seismicResults);
    }

    return allResults;
  }

  /**
   * Compare predicted vs observed values with uncertainty analysis
   */
  private compareValues(
    parameter: string,
    predicted: UncertaintyValue,
    observed: UncertaintyValue
  ): ValidationResult["agreement"] {
    const diff = Math.abs(predicted.value - observed.value);
    const combinedUncertainty = Math.sqrt(
      predicted.uncertainty ** 2 + observed.uncertainty ** 2
    );

    const sigmaDeviation = diff / combinedUncertainty;
    const percentError = (diff / observed.value) * 100;
    const withinUncertainty = sigmaDeviation <= 2.0; // Within 2-sigma

    return {
      withinUncertainty,
      sigmaDeviation,
      percentError,
    };
  }

  /**
   * Determine validation status based on sigma deviation
   */
  private getValidationStatus(
    sigmaDeviation: number
  ): ValidationResult["status"] {
    if (sigmaDeviation <= 1.0) return "EXCELLENT";
    if (sigmaDeviation <= 2.0) return "GOOD";
    if (sigmaDeviation <= 3.0) return "ACCEPTABLE";
    return "POOR";
  }

  /**
   * Generate validation report
   */
  generateValidationReport(results: ValidationResult[]): string {
    let report = "# Historical Event Validation Report\n\n";

    const eventGroups = results.reduce((groups, result) => {
      if (!groups[result.event]) groups[result.event] = [];
      groups[result.event].push(result);
      return groups;
    }, {} as Record<string, ValidationResult[]>);

    for (const [eventName, eventResults] of Object.entries(eventGroups)) {
      report += `## ${eventName} Event Validation\n\n`;

      for (const result of eventResults) {
        report += `### ${result.parameter}\n`;
        report += `- **Predicted**: ${result.predicted.value.toExponential(
          2
        )} ± ${result.predicted.uncertainty.toExponential(2)} ${
          result.predicted.unit
        }\n`;
        report += `- **Observed**: ${result.observed.value.toExponential(
          2
        )} ± ${result.observed.uncertainty.toExponential(2)} ${
          result.observed.unit
        }\n`;
        report += `- **Agreement**: ${result.agreement.sigmaDeviation.toFixed(
          2
        )}σ deviation (${result.agreement.percentError.toFixed(1)}% error)\n`;
        report += `- **Status**: ${result.status}\n`;
        report += `- **Within Uncertainty**: ${
          result.agreement.withinUncertainty ? "Yes" : "No"
        }\n\n`;
      }
    }

    return report;
  }
}

/**
 * Get all historical events for validation
 */
export function getHistoricalEvents(): HistoricalEvent[] {
  return [TUNGUSKA_EVENT, CHELYABINSK_EVENT];
}

/**
 * Get specific historical event by name
 */
export function getHistoricalEvent(name: string): HistoricalEvent | undefined {
  return [TUNGUSKA_EVENT, CHELYABINSK_EVENT].find(
    (event) => event.name.toLowerCase() === name.toLowerCase()
  );
}
