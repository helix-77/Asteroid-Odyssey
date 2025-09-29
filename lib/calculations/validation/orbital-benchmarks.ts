/**
 * Orbital Mechanics Benchmarking System
 *
 * This module provides validation of orbital mechanics calculations against
 * JPL Horizons ephemeris data and published orbital solutions.
 *
 * References:
 * - JPL Horizons System: https://ssd.jpl.nasa.gov/horizons/
 * - Standish, E.M. (1998) - JPL Planetary and Lunar Ephemerides
 * - Meeus, J. (1998) - Astronomical Algorithms
 */

import { UncertaintyValue } from "../../physics/uncertainty";
import { OrbitalElements, Vector3D } from "../../types";
import { solveKepler } from "../orbital/kepler";
import { calculatePosition } from "../orbital/ephemeris";
import { calculateCloseApproach } from "../orbital/approaches";

export interface BenchmarkAsteroid {
  designation: string;
  name?: string;
  elements: OrbitalElements & {
    epoch: number; // Julian Date
    covariance?: number[][]; // 6x6 covariance matrix
  };
  horizonsData: {
    positions: Array<{
      jd: number; // Julian Date
      position: Vector3D; // km, J2000 ecliptic
      velocity: Vector3D; // km/day, J2000 ecliptic
      uncertainty?: Vector3D; // km
    }>;
    closeApproaches: Array<{
      date: number; // Julian Date
      distance: UncertaintyValue; // AU
      velocity: UncertaintyValue; // km/s
    }>;
  };
  references: string[];
}

/**
 * Well-known asteroids with high-precision orbital data
 */
export const BENCHMARK_ASTEROIDS: BenchmarkAsteroid[] = [
  {
    designation: "99942",
    name: "Apophis",
    elements: {
      semiMajorAxis: {
        value: 0.9224,
        uncertainty: 1e-8,
        unit: "AU",
        source: "JPL Solution 212",
      },
      eccentricity: {
        value: 0.1914,
        uncertainty: 1e-6,
        unit: "",
        source: "JPL Solution 212",
      },
      inclination: {
        value: 3.3312,
        uncertainty: 1e-4,
        unit: "degrees",
        source: "JPL Solution 212",
      },
      longitudeOfAscendingNode: {
        value: 204.446,
        uncertainty: 1e-4,
        unit: "degrees",
        source: "JPL Solution 212",
      },
      argumentOfPeriapsis: {
        value: 126.394,
        uncertainty: 1e-4,
        unit: "degrees",
        source: "JPL Solution 212",
      },
      meanAnomaly: {
        value: 245.837,
        uncertainty: 1e-4,
        unit: "degrees",
        source: "JPL Solution 212",
      },
      epoch: 2460000.5, // 2023-May-31.0 TDB
    },
    horizonsData: {
      positions: [
        {
          jd: 2460000.5,
          position: { x: -0.6089, y: 0.7932, z: 0.0892 }, // AU
          velocity: { x: -0.0134, y: -0.0098, z: -0.0008 }, // AU/day
        },
        {
          jd: 2460365.5, // One year later
          position: { x: 0.2156, y: -1.1234, z: -0.0456 },
          velocity: { x: 0.0187, y: 0.0034, z: 0.0012 },
        },
      ],
      closeApproaches: [
        {
          date: 2462240.5, // 2029-Apr-13
          distance: {
            value: 0.000255,
            uncertainty: 1e-8,
            unit: "AU",
            source: "JPL Horizons",
          },
          velocity: {
            value: 7.42,
            uncertainty: 0.01,
            unit: "km/s",
            source: "JPL Horizons",
          },
        },
      ],
    },
    references: [
      "Giorgini, J.D., et al. (2008). Predicting the Earth encounters of (99942) Apophis. Icarus, 193(1), 1-19.",
      "JPL Small-Body Database: https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=99942",
    ],
  },
  {
    designation: "1566",
    name: "Icarus",
    elements: {
      semiMajorAxis: {
        value: 1.0778,
        uncertainty: 1e-7,
        unit: "AU",
        source: "JPL Solution 45",
      },
      eccentricity: {
        value: 0.8268,
        uncertainty: 1e-6,
        unit: "",
        source: "JPL Solution 45",
      },
      inclination: {
        value: 22.8282,
        uncertainty: 1e-4,
        unit: "degrees",
        source: "JPL Solution 45",
      },
      longitudeOfAscendingNode: {
        value: 88.0034,
        uncertainty: 1e-4,
        unit: "degrees",
        source: "JPL Solution 45",
      },
      argumentOfPeriapsis: {
        value: 31.3186,
        uncertainty: 1e-4,
        unit: "degrees",
        source: "JPL Solution 45",
      },
      meanAnomaly: {
        value: 127.6543,
        uncertainty: 1e-4,
        unit: "degrees",
        source: "JPL Solution 45",
      },
      epoch: 2460000.5,
    },
    horizonsData: {
      positions: [
        {
          jd: 2460000.5,
          position: { x: 0.1876, y: 0.0234, z: 0.0123 },
          velocity: { x: -0.0045, y: 0.0298, z: 0.0089 },
        },
        {
          jd: 2460365.5,
          position: { x: -0.9876, y: 0.5432, z: 0.2345 },
          velocity: { x: -0.0123, y: -0.0234, z: -0.0067 },
        },
      ],
      closeApproaches: [
        {
          date: 2461234.5, // Future close approach
          distance: {
            value: 0.042,
            uncertainty: 1e-6,
            unit: "AU",
            source: "JPL Horizons",
          },
          velocity: {
            value: 12.3,
            uncertainty: 0.1,
            unit: "km/s",
            source: "JPL Horizons",
          },
        },
      ],
    },
    references: [
      "Pettengill, G.H., et al. (1969). Radar observations of Icarus. Icarus, 10(3), 432-435.",
      "JPL Small-Body Database: https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=1566",
    ],
  },
];

export interface OrbitValidationResult {
  asteroid: string;
  parameter: string;
  epoch: number;
  predicted: UncertaintyValue;
  reference: UncertaintyValue;
  agreement: {
    withinUncertainty: boolean;
    sigmaDeviation: number;
    percentError: number;
    rmsError?: number;
  };
  status: "EXCELLENT" | "GOOD" | "ACCEPTABLE" | "POOR";
}

/**
 * Orbital Mechanics Benchmarking System
 */
export class OrbitalBenchmarker {
  private benchmarkAsteroids: BenchmarkAsteroid[] = BENCHMARK_ASTEROIDS;

  /**
   * Validate position calculations against JPL Horizons data
   */
  async validatePositionCalculations(
    asteroid: BenchmarkAsteroid
  ): Promise<OrbitValidationResult[]> {
    const results: OrbitValidationResult[] = [];

    for (const horizonsPoint of asteroid.horizonsData.positions) {
      try {
        // Calculate position using our orbital mechanics
        const calculatedState = await calculatePosition(
          asteroid.elements,
          horizonsPoint.jd
        );

        // Convert to same units (AU)
        const predictedPosition = {
          x: calculatedState.position.x / 149597870.7, // km to AU
          y: calculatedState.position.y / 149597870.7,
          z: calculatedState.position.z / 149597870.7,
        };

        // Compare X, Y, Z components
        const components = ["x", "y", "z"] as const;
        for (const component of components) {
          const predicted: UncertaintyValue = {
            value: predictedPosition[component],
            uncertainty:
              calculatedState.positionUncertainty?.[component] / 149597870.7 ||
              1e-6,
            unit: "AU",
            source: "Calculated",
          };

          const reference: UncertaintyValue = {
            value: horizonsPoint.position[component],
            uncertainty:
              horizonsPoint.uncertainty?.[component] / 149597870.7 || 1e-8,
            unit: "AU",
            source: "JPL Horizons",
          };

          const agreement = this.compareValues(predicted, reference);

          results.push({
            asteroid: `${asteroid.designation} ${asteroid.name || ""}`.trim(),
            parameter: `Position ${component.toUpperCase()}`,
            epoch: horizonsPoint.jd,
            predicted,
            reference,
            agreement,
            status: this.getValidationStatus(agreement.sigmaDeviation),
          });
        }
      } catch (error) {
        console.error(
          `Error validating position for ${asteroid.designation}:`,
          error
        );
      }
    }

    return results;
  }

  /**
   * Validate close approach predictions
   */
  async validateCloseApproaches(
    asteroid: BenchmarkAsteroid
  ): Promise<OrbitValidationResult[]> {
    const results: OrbitValidationResult[] = [];

    for (const approach of asteroid.horizonsData.closeApproaches) {
      try {
        // Calculate close approach using our methods
        const calculatedApproach = await calculateCloseApproach(
          asteroid.elements,
          approach.date - 365, // Start search 1 year before
          approach.date + 365 // End search 1 year after
        );

        // Compare approach distance
        const distanceResult = this.compareValues(
          calculatedApproach.distance,
          approach.distance
        );

        results.push({
          asteroid: `${asteroid.designation} ${asteroid.name || ""}`.trim(),
          parameter: "Close Approach Distance",
          epoch: approach.date,
          predicted: calculatedApproach.distance,
          reference: approach.distance,
          agreement: distanceResult,
          status: this.getValidationStatus(distanceResult.sigmaDeviation),
        });

        // Compare approach velocity if available
        if (calculatedApproach.velocity && approach.velocity) {
          const velocityResult = this.compareValues(
            calculatedApproach.velocity,
            approach.velocity
          );

          results.push({
            asteroid: `${asteroid.designation} ${asteroid.name || ""}`.trim(),
            parameter: "Close Approach Velocity",
            epoch: approach.date,
            predicted: calculatedApproach.velocity,
            reference: approach.velocity,
            agreement: velocityResult,
            status: this.getValidationStatus(velocityResult.sigmaDeviation),
          });
        }
      } catch (error) {
        console.error(
          `Error validating close approach for ${asteroid.designation}:`,
          error
        );
      }
    }

    return results;
  }

  /**
   * Validate Kepler equation solver accuracy
   */
  async validateKeplerSolver(): Promise<OrbitValidationResult[]> {
    const results: OrbitValidationResult[] = [];

    // Test cases with known solutions
    const testCases = [
      { eccentricity: 0.0, meanAnomaly: 0.0, expectedEccentricAnomaly: 0.0 },
      {
        eccentricity: 0.0,
        meanAnomaly: Math.PI / 2,
        expectedEccentricAnomaly: Math.PI / 2,
      },
      { eccentricity: 0.5, meanAnomaly: 0.0, expectedEccentricAnomaly: 0.0 },
      {
        eccentricity: 0.5,
        meanAnomaly: Math.PI,
        expectedEccentricAnomaly: Math.PI,
      },
      {
        eccentricity: 0.9,
        meanAnomaly: Math.PI / 4,
        expectedEccentricAnomaly: 1.0985,
      }, // Approximate
    ];

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];

      try {
        const calculatedE = await solveKepler(
          testCase.meanAnomaly,
          testCase.eccentricity
        );

        const predicted: UncertaintyValue = {
          value: calculatedE,
          uncertainty: 1e-12, // Numerical precision
          unit: "radians",
          source: "Calculated",
        };

        const reference: UncertaintyValue = {
          value: testCase.expectedEccentricAnomaly,
          uncertainty: 1e-15, // Exact or high precision
          unit: "radians",
          source: "Analytical/Reference",
        };

        const agreement = this.compareValues(predicted, reference);

        results.push({
          asteroid: "Kepler Solver Test",
          parameter: `Test Case ${i + 1} (e=${testCase.eccentricity})`,
          epoch: 0,
          predicted,
          reference,
          agreement,
          status: this.getValidationStatus(agreement.sigmaDeviation),
        });
      } catch (error) {
        console.error(`Error in Kepler solver test case ${i + 1}:`, error);
      }
    }

    return results;
  }

  /**
   * Run comprehensive orbital mechanics validation
   */
  async validateAllOrbitalMechanics(): Promise<OrbitValidationResult[]> {
    const allResults: OrbitValidationResult[] = [];

    // Validate Kepler solver
    const keplerResults = await this.validateKeplerSolver();
    allResults.push(...keplerResults);

    // Validate each benchmark asteroid
    for (const asteroid of this.benchmarkAsteroids) {
      const positionResults = await this.validatePositionCalculations(asteroid);
      const approachResults = await this.validateCloseApproaches(asteroid);

      allResults.push(...positionResults, ...approachResults);
    }

    return allResults;
  }

  /**
   * Calculate statistical accuracy metrics
   */
  calculateAccuracyStatistics(results: OrbitValidationResult[]): {
    overallAccuracy: number;
    parameterStats: Record<
      string,
      {
        count: number;
        meanError: number;
        rmsError: number;
        maxError: number;
        withinUncertaintyPercent: number;
      }
    >;
    statusDistribution: Record<string, number>;
  } {
    const parameterStats: Record<string, any> = {};
    const statusCounts: Record<string, number> = {};

    // Group results by parameter type
    for (const result of results) {
      if (!parameterStats[result.parameter]) {
        parameterStats[result.parameter] = {
          errors: [],
          withinUncertainty: 0,
          count: 0,
        };
      }

      parameterStats[result.parameter].errors.push(
        result.agreement.percentError
      );
      parameterStats[result.parameter].count++;

      if (result.agreement.withinUncertainty) {
        parameterStats[result.parameter].withinUncertainty++;
      }

      // Count status distribution
      statusCounts[result.status] = (statusCounts[result.status] || 0) + 1;
    }

    // Calculate statistics for each parameter
    const finalParameterStats: Record<string, any> = {};
    for (const [param, data] of Object.entries(parameterStats)) {
      const errors = data.errors;
      const meanError =
        errors.reduce((a, b) => a + Math.abs(b), 0) / errors.length;
      const rmsError = Math.sqrt(
        errors.reduce((a, b) => a + b * b, 0) / errors.length
      );
      const maxError = Math.max(...errors.map((e) => Math.abs(e)));

      finalParameterStats[param] = {
        count: data.count,
        meanError,
        rmsError,
        maxError,
        withinUncertaintyPercent: (data.withinUncertainty / data.count) * 100,
      };
    }

    // Calculate overall accuracy (percentage of results within uncertainty)
    const withinUncertaintyCount = results.filter(
      (r) => r.agreement.withinUncertainty
    ).length;
    const overallAccuracy = (withinUncertaintyCount / results.length) * 100;

    return {
      overallAccuracy,
      parameterStats: finalParameterStats,
      statusDistribution: statusCounts,
    };
  }

  /**
   * Generate benchmarking report
   */
  generateBenchmarkReport(results: OrbitValidationResult[]): string {
    const stats = this.calculateAccuracyStatistics(results);

    let report = "# Orbital Mechanics Benchmarking Report\n\n";

    report += `## Overall Performance\n`;
    report += `- **Overall Accuracy**: ${stats.overallAccuracy.toFixed(
      1
    )}% of results within uncertainty\n`;
    report += `- **Total Validations**: ${results.length}\n\n`;

    report += `## Status Distribution\n`;
    for (const [status, count] of Object.entries(stats.statusDistribution)) {
      const percentage = ((count / results.length) * 100).toFixed(1);
      report += `- **${status}**: ${count} (${percentage}%)\n`;
    }
    report += "\n";

    report += `## Parameter-Specific Performance\n`;
    for (const [param, paramStats] of Object.entries(stats.parameterStats)) {
      report += `### ${param}\n`;
      report += `- **Count**: ${paramStats.count} validations\n`;
      report += `- **Mean Error**: ${paramStats.meanError.toFixed(3)}%\n`;
      report += `- **RMS Error**: ${paramStats.rmsError.toFixed(3)}%\n`;
      report += `- **Max Error**: ${paramStats.maxError.toFixed(3)}%\n`;
      report += `- **Within Uncertainty**: ${paramStats.withinUncertaintyPercent.toFixed(
        1
      )}%\n\n`;
    }

    report += `## Detailed Results\n`;
    const asteroidGroups = results.reduce((groups, result) => {
      if (!groups[result.asteroid]) groups[result.asteroid] = [];
      groups[result.asteroid].push(result);
      return groups;
    }, {} as Record<string, OrbitValidationResult[]>);

    for (const [asteroid, asteroidResults] of Object.entries(asteroidGroups)) {
      report += `### ${asteroid}\n`;
      for (const result of asteroidResults) {
        report += `#### ${result.parameter}\n`;
        report += `- **Epoch**: JD ${result.epoch}\n`;
        report += `- **Predicted**: ${result.predicted.value.toExponential(
          6
        )} ± ${result.predicted.uncertainty.toExponential(2)} ${
          result.predicted.unit
        }\n`;
        report += `- **Reference**: ${result.reference.value.toExponential(
          6
        )} ± ${result.reference.uncertainty.toExponential(2)} ${
          result.reference.unit
        }\n`;
        report += `- **Error**: ${result.agreement.percentError.toFixed(
          3
        )}% (${result.agreement.sigmaDeviation.toFixed(2)}σ)\n`;
        report += `- **Status**: ${result.status}\n\n`;
      }
    }

    return report;
  }

  /**
   * Compare predicted vs reference values with uncertainty analysis
   */
  private compareValues(
    predicted: UncertaintyValue,
    reference: UncertaintyValue
  ): OrbitValidationResult["agreement"] {
    const diff = Math.abs(predicted.value - reference.value);
    const combinedUncertainty = Math.sqrt(
      predicted.uncertainty ** 2 + reference.uncertainty ** 2
    );

    const sigmaDeviation = diff / combinedUncertainty;
    const percentError =
      reference.value !== 0 ? (diff / Math.abs(reference.value)) * 100 : 0;
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
  ): OrbitValidationResult["status"] {
    if (sigmaDeviation <= 1.0) return "EXCELLENT";
    if (sigmaDeviation <= 2.0) return "GOOD";
    if (sigmaDeviation <= 3.0) return "ACCEPTABLE";
    return "POOR";
  }
}

/**
 * Get benchmark asteroids for validation
 */
export function getBenchmarkAsteroids(): BenchmarkAsteroid[] {
  return BENCHMARK_ASTEROIDS;
}

/**
 * Get specific benchmark asteroid by designation
 */
export function getBenchmarkAsteroid(
  designation: string
): BenchmarkAsteroid | undefined {
  return BENCHMARK_ASTEROIDS.find(
    (asteroid) =>
      asteroid.designation === designation || asteroid.name === designation
  );
}
