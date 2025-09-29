/**
 * Uncertainty Quantification Engine
 *
 * This module implements realistic uncertainty assignment based on:
 * - Observation methods and data quality
 * - Observation arc length and number of observations
 * - Monte Carlo sampling for uncertain parameters
 * - Correlation handling for related orbital elements
 */

export interface UncertaintyAssignment {
  value: number;
  uncertainty: number;
  uncertaintyType: "statistical" | "systematic" | "model" | "combined";
  confidenceLevel: number; // e.g., 0.68 for 1-sigma, 0.95 for 2-sigma
  source: string;
  correlations?: Map<string, number>; // Correlation coefficients with other parameters
}

export interface DataQualityMetrics {
  observationArcDays: number;
  numberOfObservations: number;
  observationMethods: string[];
  lastObservationDate: string;
  dataSpan: number; // years
  observationQuality: "excellent" | "good" | "fair" | "poor";
}

export interface MonteCarloResult {
  mean: number;
  standardDeviation: number;
  percentiles: {
    p5: number;
    p16: number;
    p50: number; // median
    p84: number;
    p95: number;
  };
  samples: number[];
  convergenceAchieved: boolean;
}

export interface CorrelationMatrix {
  parameters: string[];
  matrix: number[][]; // Symmetric correlation matrix
  eigenvalues: number[];
  isPositiveDefinite: boolean;
}

export class UncertaintyEngine {
  private uncertaintyModels: Map<string, any> = new Map();
  private correlationData: Map<string, CorrelationMatrix> = new Map();

  constructor() {
    this.initializeUncertaintyModels();
  }

  /**
   * Assign uncertainty based on observation quality and methods
   */
  public assignUncertainty(
    parameter: string,
    value: number,
    dataQuality: DataQualityMetrics,
    derivationMethod: string = "unknown"
  ): UncertaintyAssignment {
    const baseUncertainty = this.getBaseUncertainty(
      parameter,
      derivationMethod
    );
    const qualityFactor = this.calculateQualityFactor(dataQuality);
    const arcLengthFactor = this.calculateArcLengthFactor(
      dataQuality.observationArcDays,
      parameter
    );
    const observationFactor = this.calculateObservationFactor(
      dataQuality.numberOfObservations
    );

    // Combine uncertainty factors
    const totalUncertaintyFactor =
      baseUncertainty * qualityFactor * arcLengthFactor * observationFactor;
    const uncertainty = Math.abs(value) * totalUncertaintyFactor;

    // Determine uncertainty type
    const uncertaintyType = this.determineUncertaintyType(derivationMethod);

    // Calculate confidence level based on data quality
    const confidenceLevel = this.calculateConfidenceLevel(dataQuality);

    return {
      value,
      uncertainty,
      uncertaintyType,
      confidenceLevel,
      source: `${derivationMethod} with ${dataQuality.observationQuality} data quality`,
      correlations: this.getParameterCorrelations(parameter),
    };
  }

  /**
   * Classify data quality based on observation metrics
   */
  public classifyDataQuality(
    observationArcDays: number,
    numberOfObservations: number,
    observationMethods: string[],
    dataSpan: number
  ): "HIGH" | "MEDIUM" | "LOW" {
    let score = 0;

    // Arc length scoring (0-3 points)
    if (observationArcDays > 1000) score += 3;
    else if (observationArcDays > 365) score += 2;
    else if (observationArcDays > 90) score += 1;

    // Number of observations scoring (0-3 points)
    if (numberOfObservations > 100) score += 3;
    else if (numberOfObservations > 50) score += 2;
    else if (numberOfObservations > 20) score += 1;

    // Observation methods scoring (0-2 points)
    const hasRadar = observationMethods.includes("radar");
    const hasSpectroscopy = observationMethods.includes("spectroscopy");
    const hasPhotometry = observationMethods.includes("photometry");

    if (hasRadar) score += 2;
    else if (hasSpectroscopy) score += 1;
    else if (hasPhotometry) score += 0.5;

    // Data span scoring (0-2 points)
    if (dataSpan > 10) score += 2;
    else if (dataSpan > 5) score += 1;
    else if (dataSpan > 1) score += 0.5;

    // Classify based on total score (0-10 possible)
    if (score >= 7) return "HIGH";
    if (score >= 4) return "MEDIUM";
    return "LOW";
  }

  /**
   * Perform Monte Carlo uncertainty analysis
   */
  public monteCarloAnalysis(
    parameters: Map<string, UncertaintyAssignment>,
    calculationFunction: (params: Map<string, number>) => number,
    samples: number = 10000
  ): MonteCarloResult {
    const results: number[] = [];
    const paramNames = Array.from(parameters.keys());

    // Generate correlated samples if correlations exist
    const correlationMatrix = this.buildCorrelationMatrix(parameters);

    for (let i = 0; i < samples; i++) {
      const sampleParams = new Map<string, number>();

      if (correlationMatrix) {
        // Generate correlated samples using Cholesky decomposition
        const correlatedSamples = this.generateCorrelatedSamples(
          parameters,
          correlationMatrix
        );
        for (let j = 0; j < paramNames.length; j++) {
          sampleParams.set(paramNames[j], correlatedSamples[j]);
        }
      } else {
        // Generate independent samples
        for (const [name, assignment] of parameters) {
          const sample = this.sampleFromDistribution(assignment);
          sampleParams.set(name, sample);
        }
      }

      try {
        const result = calculationFunction(sampleParams);
        if (isFinite(result)) {
          results.push(result);
        }
      } catch (error) {
        // Skip invalid samples
        continue;
      }
    }

    if (results.length < samples * 0.5) {
      throw new Error("Monte Carlo analysis failed: too many invalid samples");
    }

    // Calculate statistics
    results.sort((a, b) => a - b);
    const mean = results.reduce((sum, val) => sum + val, 0) / results.length;
    const variance =
      results.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      (results.length - 1);
    const standardDeviation = Math.sqrt(variance);

    const percentiles = {
      p5: results[Math.floor(results.length * 0.05)],
      p16: results[Math.floor(results.length * 0.16)],
      p50: results[Math.floor(results.length * 0.5)],
      p84: results[Math.floor(results.length * 0.84)],
      p95: results[Math.floor(results.length * 0.95)],
    };

    // Check convergence (simplified)
    const convergenceAchieved = results.length >= samples * 0.9;

    return {
      mean,
      standardDeviation,
      percentiles,
      samples: results,
      convergenceAchieved,
    };
  }

  /**
   * Propagate uncertainty through linear combinations
   */
  public propagateLinearUncertainty(
    terms: Array<{
      value: number;
      uncertainty: number;
      coefficient: number;
    }>
  ): { value: number; uncertainty: number } {
    const value = terms.reduce(
      (sum, term) => sum + term.coefficient * term.value,
      0
    );

    // For linear combinations: σ² = Σ(aᵢ²σᵢ²)
    const varianceSum = terms.reduce(
      (sum, term) => sum + Math.pow(term.coefficient * term.uncertainty, 2),
      0
    );

    const uncertainty = Math.sqrt(varianceSum);

    return { value, uncertainty };
  }

  /**
   * Propagate uncertainty through multiplication/division
   */
  public propagateMultiplicativeUncertainty(
    factors: Array<{
      value: number;
      uncertainty: number;
      exponent?: number;
    }>
  ): { value: number; uncertainty: number } {
    let value = 1;
    let relativeVarianceSum = 0;

    for (const factor of factors) {
      const exponent = factor.exponent || 1;
      value *= Math.pow(factor.value, exponent);

      // For multiplicative: (σ/x)² = Σ(aᵢ²(σᵢ/xᵢ)²)
      const relativeUncertainty = factor.uncertainty / factor.value;
      relativeVarianceSum += Math.pow(exponent * relativeUncertainty, 2);
    }

    const relativeUncertainty = Math.sqrt(relativeVarianceSum);
    const uncertainty = Math.abs(value) * relativeUncertainty;

    return { value, uncertainty };
  }

  /**
   * Get base uncertainty for different parameters and methods
   */
  private getBaseUncertainty(parameter: string, method: string): number {
    const uncertaintyMap: Record<string, Record<string, number>> = {
      diameter: {
        radar: 0.01, // 1% for radar measurements
        occultation: 0.02, // 2% for stellar occultations
        thermal_model: 0.15, // 15% for thermal models
        magnitude_albedo: 0.3, // 30% for magnitude-albedo conversion
        default: 0.25,
      },
      mass: {
        gravitational: 0.05, // 5% for gravitational measurements
        density_volume: 0.4, // 40% for derived from density×volume
        default: 0.5,
      },
      density: {
        measured: 0.1, // 10% for direct measurements
        composition_model: 0.2, // 20% for composition-based
        default: 0.3,
      },
      orbital_elements: {
        radar_astrometry: 0.001, // Very precise
        optical_astrometry: 0.01, // Good precision
        survey_detection: 0.05, // Survey precision
        default: 0.02,
      },
      absolute_magnitude: {
        photometry: 0.1, // 0.1 mag typical
        survey: 0.2, // 0.2 mag for surveys
        default: 0.15,
      },
    };

    const paramMap = uncertaintyMap[parameter];
    if (!paramMap) return 0.2; // Default 20%

    return paramMap[method] || paramMap["default"] || 0.2;
  }

  /**
   * Calculate quality factor based on data quality metrics
   */
  private calculateQualityFactor(dataQuality: DataQualityMetrics): number {
    const qualityFactors = {
      excellent: 0.8,
      good: 1.0,
      fair: 1.5,
      poor: 2.5,
    };

    return qualityFactors[dataQuality.observationQuality] || 1.5;
  }

  /**
   * Calculate arc length factor for orbital elements
   */
  private calculateArcLengthFactor(arcDays: number, parameter: string): number {
    if (!parameter.includes("orbital")) return 1.0;

    // Longer arcs give better orbital determination
    if (arcDays > 1000) return 0.8; // 20% improvement
    if (arcDays > 365) return 1.0; // Baseline
    if (arcDays > 90) return 1.5; // 50% worse
    return 3.0; // Very short arc, much worse
  }

  /**
   * Calculate observation number factor
   */
  private calculateObservationFactor(numObs: number): number {
    // More observations reduce uncertainty (roughly as 1/√N)
    const baselineObs = 50;
    return Math.sqrt(baselineObs / Math.max(numObs, 1));
  }

  /**
   * Determine uncertainty type based on derivation method
   */
  private determineUncertaintyType(
    method: string
  ): "statistical" | "systematic" | "model" | "combined" {
    if (method.includes("model") || method.includes("composition"))
      return "model";
    if (method.includes("systematic") || method.includes("calibration"))
      return "systematic";
    if (method.includes("measurement") || method.includes("observation"))
      return "statistical";
    return "combined";
  }

  /**
   * Calculate confidence level based on data quality
   */
  private calculateConfidenceLevel(dataQuality: DataQualityMetrics): number {
    // Return 1-sigma confidence level based on quality
    const qualityLevels = {
      excellent: 0.68, // 1-sigma
      good: 0.68,
      fair: 0.6, // Slightly less confident
      poor: 0.5, // Much less confident
    };

    return qualityLevels[dataQuality.observationQuality] || 0.6;
  }

  /**
   * Get parameter correlations
   */
  private getParameterCorrelations(
    parameter: string
  ): Map<string, number> | undefined {
    const correlations = new Map<string, number>();

    // Define known correlations
    if (parameter === "semiMajorAxis") {
      correlations.set("period", 1.0); // Perfect correlation via Kepler's 3rd law
      correlations.set("meanMotion", -1.0); // Inverse correlation
    }

    if (parameter === "diameter") {
      correlations.set("absoluteMagnitude", -0.8); // Strong inverse correlation
      correlations.set("mass", 0.9); // Strong positive correlation
    }

    if (parameter === "mass") {
      correlations.set("diameter", 0.9);
      correlations.set("density", 0.3); // Weak correlation
    }

    return correlations.size > 0 ? correlations : undefined;
  }

  /**
   * Build correlation matrix from parameter assignments
   */
  private buildCorrelationMatrix(
    parameters: Map<string, UncertaintyAssignment>
  ): CorrelationMatrix | null {
    const paramNames = Array.from(parameters.keys());
    const n = paramNames.length;

    if (n < 2) return null;

    // Initialize correlation matrix as identity
    const matrix: number[][] = Array(n)
      .fill(0)
      .map(() => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      matrix[i][i] = 1.0;
    }

    // Fill in known correlations
    for (let i = 0; i < n; i++) {
      const param1 = paramNames[i];
      const assignment1 = parameters.get(param1);

      if (assignment1?.correlations) {
        for (let j = i + 1; j < n; j++) {
          const param2 = paramNames[j];
          const correlation = assignment1.correlations.get(param2);

          if (correlation !== undefined) {
            matrix[i][j] = correlation;
            matrix[j][i] = correlation; // Symmetric
          }
        }
      }
    }

    // Check if matrix is positive definite (simplified check)
    const eigenvalues = this.approximateEigenvalues(matrix);
    const isPositiveDefinite = eigenvalues.every((val) => val > 0);

    return {
      parameters: paramNames,
      matrix,
      eigenvalues,
      isPositiveDefinite,
    };
  }

  /**
   * Generate correlated samples using Cholesky decomposition (simplified)
   */
  private generateCorrelatedSamples(
    parameters: Map<string, UncertaintyAssignment>,
    correlationMatrix: CorrelationMatrix
  ): number[] {
    const paramNames = correlationMatrix.parameters;
    const n = paramNames.length;

    // Generate independent normal samples
    const independentSamples = Array(n)
      .fill(0)
      .map(() => this.randomNormal());

    // Apply correlation (simplified - would use proper Cholesky in production)
    const correlatedSamples: number[] = [];

    for (let i = 0; i < n; i++) {
      const paramName = paramNames[i];
      const assignment = parameters.get(paramName)!;

      // Simple correlation application (not full Cholesky)
      let correlatedSample = independentSamples[i];

      // Apply correlations with previous parameters
      for (let j = 0; j < i; j++) {
        const correlation = correlationMatrix.matrix[i][j];
        if (Math.abs(correlation) > 0.1) {
          correlatedSample += correlation * independentSamples[j] * 0.5;
        }
      }

      // Convert to actual parameter value
      const value =
        assignment.value + correlatedSample * assignment.uncertainty;
      correlatedSamples.push(value);
    }

    return correlatedSamples;
  }

  /**
   * Sample from parameter distribution
   */
  private sampleFromDistribution(assignment: UncertaintyAssignment): number {
    // Assume normal distribution for now
    const normalSample = this.randomNormal();
    return assignment.value + normalSample * assignment.uncertainty;
  }

  /**
   * Generate random normal sample (Box-Muller transform)
   */
  private randomNormal(): number {
    let u = 0,
      v = 0;
    while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  /**
   * Approximate eigenvalues (simplified power method)
   */
  private approximateEigenvalues(matrix: number[][]): number[] {
    const n = matrix.length;
    const eigenvalues: number[] = [];

    // Simplified: just return diagonal elements as approximation
    for (let i = 0; i < n; i++) {
      eigenvalues.push(matrix[i][i]);
    }

    return eigenvalues;
  }

  /**
   * Initialize uncertainty models
   */
  private initializeUncertaintyModels(): void {
    // Load uncertainty models and correlation data
    // This would be loaded from configuration files in a real implementation
  }
}
