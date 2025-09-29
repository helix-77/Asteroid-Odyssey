/**
 * Uncertainty Propagation Framework
 * Implements linear and nonlinear error propagation with Monte Carlo analysis
 */

import { UncertaintyValue } from "./constants";

/**
 * Correlation coefficient between two variables (-1 to 1)
 */
export interface CorrelationCoefficient {
  variable1: string;
  variable2: string;
  coefficient: number; // -1 to 1
}

/**
 * Result of uncertainty propagation analysis
 */
export interface UncertaintyAnalysisResult {
  value: number;
  uncertainty: number;
  relativeUncertainty: number;
  contributingFactors: Array<{
    variable: string;
    contribution: number; // Absolute contribution to total uncertainty
    relativeContribution: number; // Percentage of total uncertainty
  }>;
  method: "linear" | "nonlinear" | "monte_carlo";
  samples?: number; // For Monte Carlo analysis
}

/**
 * Monte Carlo sample result
 */
export interface MonteCarloSample {
  inputs: Record<string, number>;
  output: number;
}

/**
 * Distribution types for Monte Carlo sampling
 */
export enum DistributionType {
  NORMAL = "normal",
  UNIFORM = "uniform",
  TRIANGULAR = "triangular",
}

/**
 * Variable definition for uncertainty analysis
 */
export interface UncertaintyVariable {
  name: string;
  value: UncertaintyValue;
  distribution: DistributionType;
}

/**
 * Uncertainty propagation calculator
 */
export class UncertaintyPropagator {
  /**
   * Linear uncertainty propagation for functions of the form f(x1, x2, ..., xn)
   * Uses the formula: σf² = Σ(∂f/∂xi)² σxi² + 2ΣΣ(∂f/∂xi)(∂f/∂xj)σxixj
   */
  static propagateLinear(
    variables: UncertaintyVariable[],
    partialDerivatives: Record<string, number>,
    correlations: CorrelationCoefficient[] = []
  ): UncertaintyAnalysisResult {
    if (variables.length === 0) {
      throw new Error(
        "At least one variable is required for uncertainty propagation"
      );
    }

    // Validate partial derivatives
    for (const variable of variables) {
      if (!(variable.name in partialDerivatives)) {
        throw new Error(
          `Missing partial derivative for variable: ${variable.name}`
        );
      }
    }

    // Calculate variance contributions
    let totalVariance = 0;
    const contributions: Array<{
      variable: string;
      contribution: number;
      relativeContribution: number;
    }> = [];

    // Individual variable contributions (diagonal terms)
    for (const variable of variables) {
      const derivative = partialDerivatives[variable.name];
      const variance = Math.pow(variable.value.uncertainty, 2);
      const contribution = Math.pow(derivative, 2) * variance;
      totalVariance += contribution;

      contributions.push({
        variable: variable.name,
        contribution: Math.sqrt(contribution),
        relativeContribution: 0, // Will be calculated after total uncertainty
      });
    }

    // Correlation contributions (off-diagonal terms)
    for (const correlation of correlations) {
      const var1 = variables.find((v) => v.name === correlation.variable1);
      const var2 = variables.find((v) => v.name === correlation.variable2);

      if (!var1 || !var2) {
        throw new Error(
          `Unknown variable in correlation: ${correlation.variable1} or ${correlation.variable2}`
        );
      }

      const derivative1 = partialDerivatives[correlation.variable1];
      const derivative2 = partialDerivatives[correlation.variable2];
      const covariance =
        correlation.coefficient *
        var1.value.uncertainty *
        var2.value.uncertainty;
      const correlationContribution =
        2 * derivative1 * derivative2 * covariance;

      totalVariance += correlationContribution;
    }

    const totalUncertainty = Math.sqrt(Math.abs(totalVariance));

    // Calculate relative contributions
    for (const contribution of contributions) {
      contribution.relativeContribution =
        totalUncertainty > 0
          ? (contribution.contribution / totalUncertainty) * 100
          : 0;
    }

    // Calculate result value (assuming linear combination)
    const resultValue = variables.reduce((sum, variable) => {
      return sum + partialDerivatives[variable.name] * variable.value.value;
    }, 0);

    return {
      value: resultValue,
      uncertainty: totalUncertainty,
      relativeUncertainty:
        resultValue !== 0 ? Math.abs(totalUncertainty / resultValue) : 0,
      contributingFactors: contributions,
      method: "linear",
    };
  }

  /**
   * Nonlinear uncertainty propagation using numerical differentiation
   * Calculates partial derivatives numerically and applies linear propagation
   */
  static propagateNonlinear(
    variables: UncertaintyVariable[],
    func: (inputs: Record<string, number>) => number,
    correlations: CorrelationCoefficient[] = [],
    stepSize: number = 1e-8
  ): UncertaintyAnalysisResult {
    if (variables.length === 0) {
      throw new Error(
        "At least one variable is required for uncertainty propagation"
      );
    }

    // Create input object with nominal values
    const nominalInputs: Record<string, number> = {};
    for (const variable of variables) {
      nominalInputs[variable.name] = variable.value.value;
    }

    const nominalOutput = func(nominalInputs);

    // Calculate partial derivatives numerically
    const partialDerivatives: Record<string, number> = {};
    for (const variable of variables) {
      const perturbedInputs = { ...nominalInputs };
      const h = Math.max(stepSize, Math.abs(variable.value.value) * stepSize);
      perturbedInputs[variable.name] += h;

      const perturbedOutput = func(perturbedInputs);
      partialDerivatives[variable.name] = (perturbedOutput - nominalOutput) / h;
    }

    // Use linear propagation with calculated derivatives
    const result = this.propagateLinear(
      variables,
      partialDerivatives,
      correlations
    );

    return {
      ...result,
      value: nominalOutput, // Use actual function output, not linear approximation
      method: "nonlinear",
    };
  }

  /**
   * Monte Carlo uncertainty analysis
   * Samples from input distributions and evaluates function many times
   */
  static monteCarloAnalysis(
    variables: UncertaintyVariable[],
    func: (inputs: Record<string, number>) => number,
    samples: number = 10000,
    correlations: CorrelationCoefficient[] = [],
    seed?: number
  ): UncertaintyAnalysisResult {
    if (variables.length === 0) {
      throw new Error(
        "At least one variable is required for Monte Carlo analysis"
      );
    }

    if (samples < 100) {
      throw new Error("Monte Carlo analysis requires at least 100 samples");
    }

    // Set random seed if provided (for reproducible results)
    if (seed !== undefined) {
      // Note: JavaScript doesn't have built-in seeded random,
      // but we can implement a simple LCG for testing
      Math.random = this.createSeededRandom(seed);
    }

    const results: number[] = [];
    const sampleData: MonteCarloSample[] = [];

    for (let i = 0; i < samples; i++) {
      const inputs: Record<string, number> = {};

      // Sample from each variable's distribution
      for (const variable of variables) {
        inputs[variable.name] = this.sampleFromDistribution(
          variable.value.value,
          variable.value.uncertainty,
          variable.distribution
        );
      }

      // Apply correlations (simplified approach - Cholesky decomposition would be more rigorous)
      if (correlations.length > 0) {
        const adjustedInputs = this.applyCorrelations(
          inputs,
          variables,
          correlations
        );
        Object.assign(inputs, adjustedInputs);
      }

      const output = func(inputs);
      results.push(output);

      if (i < 1000) {
        // Store first 1000 samples for analysis
        sampleData.push({ inputs, output });
      }
    }

    // Calculate statistics
    const mean = results.reduce((sum, val) => sum + val, 0) / results.length;
    const variance =
      results.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      (results.length - 1);
    const standardDeviation = Math.sqrt(variance);

    // Analyze contributions (simplified - based on correlation with inputs)
    const contributions = this.analyzeMonteCarloContributions(
      variables,
      sampleData,
      mean
    );

    return {
      value: mean,
      uncertainty: standardDeviation,
      relativeUncertainty: mean !== 0 ? Math.abs(standardDeviation / mean) : 0,
      contributingFactors: contributions,
      method: "monte_carlo",
      samples,
    };
  }

  /**
   * Combine uncertainties for independent variables
   * For addition/subtraction: σ² = σ₁² + σ₂² + ...
   * For multiplication/division: (σ/f)² = (σ₁/x₁)² + (σ₂/x₂)² + ...
   */
  static combineIndependent(
    values: UncertaintyValue[],
    operation: "add" | "subtract" | "multiply" | "divide"
  ): UncertaintyValue {
    if (values.length === 0) {
      throw new Error("At least one value is required");
    }

    if (values.length === 1) {
      return values[0];
    }

    let result: number;
    let uncertainty: number;

    switch (operation) {
      case "add":
        result = values.reduce((sum, val) => sum + val.value, 0);
        uncertainty = Math.sqrt(
          values.reduce((sum, val) => sum + Math.pow(val.uncertainty, 2), 0)
        );
        break;

      case "subtract":
        result = values.reduce(
          (diff, val, index) => (index === 0 ? val.value : diff - val.value),
          0
        );
        uncertainty = Math.sqrt(
          values.reduce((sum, val) => sum + Math.pow(val.uncertainty, 2), 0)
        );
        break;

      case "multiply":
        result = values.reduce((prod, val) => prod * val.value, 1);
        const relativeUncertaintySquared = values.reduce((sum, val) => {
          const relativeUncertainty =
            val.value !== 0 ? val.uncertainty / Math.abs(val.value) : 0;
          return sum + Math.pow(relativeUncertainty, 2);
        }, 0);
        uncertainty = Math.abs(result) * Math.sqrt(relativeUncertaintySquared);
        break;

      case "divide":
        result = values.reduce(
          (quotient, val, index) =>
            index === 0 ? val.value : quotient / val.value,
          1
        );
        const relativeUncertaintySquaredDiv = values.reduce((sum, val) => {
          const relativeUncertainty =
            val.value !== 0 ? val.uncertainty / Math.abs(val.value) : 0;
          return sum + Math.pow(relativeUncertainty, 2);
        }, 0);
        uncertainty =
          Math.abs(result) * Math.sqrt(relativeUncertaintySquaredDiv);
        break;

      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }

    return new UncertaintyValue(
      result,
      uncertainty,
      values[0].unit, // Assume same units for now
      `Combined from ${values.length} values`,
      `Result of ${operation} operation`
    );
  }

  /**
   * Sample from a distribution
   */
  private static sampleFromDistribution(
    mean: number,
    standardDeviation: number,
    distribution: DistributionType
  ): number {
    switch (distribution) {
      case DistributionType.NORMAL:
        return this.sampleNormal(mean, standardDeviation);

      case DistributionType.UNIFORM:
        const halfWidth = standardDeviation * Math.sqrt(3); // For uniform: σ = width/(2√3)
        return mean + (Math.random() - 0.5) * 2 * halfWidth;

      case DistributionType.TRIANGULAR:
        // Simplified triangular distribution
        const u1 = Math.random();
        const u2 = Math.random();
        const sample = (u1 + u2 - 1) * standardDeviation * Math.sqrt(6);
        return mean + sample;

      default:
        throw new Error(`Unsupported distribution: ${distribution}`);
    }
  }

  /**
   * Sample from normal distribution using Box-Muller transform
   */
  private static sampleNormal(mean: number, standardDeviation: number): number {
    // Box-Muller transform
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z0 * standardDeviation;
  }

  /**
   * Apply correlations to sampled inputs (simplified approach)
   */
  private static applyCorrelations(
    inputs: Record<string, number>,
    variables: UncertaintyVariable[],
    correlations: CorrelationCoefficient[]
  ): Record<string, number> {
    // This is a simplified correlation implementation
    // A full implementation would use Cholesky decomposition
    const adjustedInputs = { ...inputs };

    for (const correlation of correlations) {
      if (Math.abs(correlation.coefficient) > 0.1) {
        const var1 = variables.find((v) => v.name === correlation.variable1);
        const var2 = variables.find((v) => v.name === correlation.variable2);

        if (var1 && var2) {
          const adjustment =
            correlation.coefficient *
            (inputs[correlation.variable1] - var1.value.value) *
            (var2.value.uncertainty / var1.value.uncertainty);
          adjustedInputs[correlation.variable2] += adjustment;
        }
      }
    }

    return adjustedInputs;
  }

  /**
   * Analyze Monte Carlo contributions
   */
  private static analyzeMonteCarloContributions(
    variables: UncertaintyVariable[],
    samples: MonteCarloSample[],
    meanOutput: number
  ): Array<{
    variable: string;
    contribution: number;
    relativeContribution: number;
  }> {
    const contributions = variables.map((variable) => {
      // Calculate correlation between input variable and output
      const inputValues = samples.map((s) => s.inputs[variable.name]);
      const outputValues = samples.map((s) => s.output);

      const correlation = this.calculateCorrelation(inputValues, outputValues);
      const outputStd = this.calculateStandardDeviation(outputValues);
      const inputStd = this.calculateStandardDeviation(inputValues);

      // Contribution is approximately correlation * input_std * (output_std / input_std)
      const contribution =
        Math.abs(correlation) * inputStd * (outputStd / (inputStd || 1));

      return {
        variable: variable.name,
        contribution,
        relativeContribution: 0, // Will be calculated below
      };
    });

    // Calculate relative contributions
    const totalContribution = contributions.reduce(
      (sum, c) => sum + c.contribution,
      0
    );
    contributions.forEach((c) => {
      c.relativeContribution =
        totalContribution > 0 ? (c.contribution / totalContribution) * 100 : 0;
    });

    return contributions;
  }

  /**
   * Calculate correlation coefficient between two arrays
   */
  private static calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
    const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;

    let numerator = 0;
    let sumXSquared = 0;
    let sumYSquared = 0;

    for (let i = 0; i < x.length; i++) {
      const deltaX = x[i] - meanX;
      const deltaY = y[i] - meanY;
      numerator += deltaX * deltaY;
      sumXSquared += deltaX * deltaX;
      sumYSquared += deltaY * deltaY;
    }

    const denominator = Math.sqrt(sumXSquared * sumYSquared);
    return denominator > 0 ? numerator / denominator : 0;
  }

  /**
   * Calculate standard deviation
   */
  private static calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      (values.length - 1);
    return Math.sqrt(variance);
  }

  /**
   * Create a seeded random number generator (simple LCG)
   */
  private static createSeededRandom(seed: number): () => number {
    let state = seed;
    return function () {
      state = (state * 1664525 + 1013904223) % Math.pow(2, 32);
      return state / Math.pow(2, 32);
    };
  }
}

/**
 * Convenience functions for common uncertainty operations
 */
export const UncertaintyOperations = {
  /**
   * Add two uncertainty values
   */
  add: (a: UncertaintyValue, b: UncertaintyValue): UncertaintyValue => {
    return UncertaintyPropagator.combineIndependent([a, b], "add");
  },

  /**
   * Subtract two uncertainty values
   */
  subtract: (a: UncertaintyValue, b: UncertaintyValue): UncertaintyValue => {
    return UncertaintyPropagator.combineIndependent([a, b], "subtract");
  },

  /**
   * Multiply two uncertainty values
   */
  multiply: (a: UncertaintyValue, b: UncertaintyValue): UncertaintyValue => {
    return UncertaintyPropagator.combineIndependent([a, b], "multiply");
  },

  /**
   * Divide two uncertainty values
   */
  divide: (a: UncertaintyValue, b: UncertaintyValue): UncertaintyValue => {
    return UncertaintyPropagator.combineIndependent([a, b], "divide");
  },

  /**
   * Raise uncertainty value to a power
   */
  power: (base: UncertaintyValue, exponent: number): UncertaintyValue => {
    const result = Math.pow(base.value, exponent);
    const relativeUncertainty =
      base.value !== 0 ? base.uncertainty / Math.abs(base.value) : 0;
    const uncertainty = Math.abs(result * exponent * relativeUncertainty);

    return new UncertaintyValue(
      result,
      uncertainty,
      base.unit, // Note: units should be adjusted for powers
      base.source,
      `${base.description} raised to power ${exponent}`
    );
  },

  /**
   * Square root of uncertainty value
   */
  sqrt: (value: UncertaintyValue): UncertaintyValue => {
    if (value.value < 0) {
      throw new Error("Cannot take square root of negative value");
    }

    const result = Math.sqrt(value.value);
    const uncertainty =
      value.value > 0 ? value.uncertainty / (2 * Math.sqrt(value.value)) : 0;

    return new UncertaintyValue(
      result,
      uncertainty,
      value.unit, // Note: units should be adjusted for square root
      value.source,
      `Square root of ${value.description}`
    );
  },
};
