import { describe, it, expect, beforeEach } from "vitest";
import {
  UncertaintyPropagator,
  UncertaintyOperations,
  DistributionType,
  UncertaintyVariable,
  CorrelationCoefficient,
} from "../uncertainty";
import { UncertaintyValue } from "../constants";

describe("UncertaintyPropagator", () => {
  let variables: UncertaintyVariable[];

  beforeEach(() => {
    variables = [
      {
        name: "x",
        value: new UncertaintyValue(10, 1, "m", "Test"),
        distribution: DistributionType.NORMAL,
      },
      {
        name: "y",
        value: new UncertaintyValue(5, 0.5, "m", "Test"),
        distribution: DistributionType.NORMAL,
      },
    ];
  });

  describe("Linear Propagation", () => {
    it("should propagate uncertainty for simple addition", () => {
      // f(x,y) = x + y, so ∂f/∂x = 1, ∂f/∂y = 1
      const partialDerivatives = { x: 1, y: 1 };

      const result = UncertaintyPropagator.propagateLinear(
        variables,
        partialDerivatives
      );

      expect(result.value).toBe(15); // 10 + 5
      expect(result.uncertainty).toBeCloseTo(Math.sqrt(1 * 1 + 0.5 * 0.5), 5); // √(1² + 0.5²)
      expect(result.method).toBe("linear");
      expect(result.contributingFactors).toHaveLength(2);
    });

    it("should propagate uncertainty for multiplication by constants", () => {
      // f(x,y) = 2x + 3y, so ∂f/∂x = 2, ∂f/∂y = 3
      const partialDerivatives = { x: 2, y: 3 };

      const result = UncertaintyPropagator.propagateLinear(
        variables,
        partialDerivatives
      );

      expect(result.value).toBe(35); // 2*10 + 3*5
      expect(result.uncertainty).toBeCloseTo(Math.sqrt(4 * 1 + 9 * 0.25), 5); // √(2²*1² + 3²*0.5²)
    });

    it("should handle correlations between variables", () => {
      const partialDerivatives = { x: 1, y: 1 };
      const correlations: CorrelationCoefficient[] = [
        { variable1: "x", variable2: "y", coefficient: 0.5 },
      ];

      const result = UncertaintyPropagator.propagateLinear(
        variables,
        partialDerivatives,
        correlations
      );

      // With positive correlation, uncertainty should be larger than independent case
      const independentUncertainty = Math.sqrt(1 * 1 + 0.5 * 0.5);
      expect(result.uncertainty).toBeGreaterThan(independentUncertainty);
    });

    it("should throw error for missing partial derivatives", () => {
      const partialDerivatives = { x: 1 }; // Missing y

      expect(() => {
        UncertaintyPropagator.propagateLinear(variables, partialDerivatives);
      }).toThrow("Missing partial derivative for variable: y");
    });

    it("should calculate contributing factors correctly", () => {
      const partialDerivatives = { x: 2, y: 1 };

      const result = UncertaintyPropagator.propagateLinear(
        variables,
        partialDerivatives
      );

      expect(result.contributingFactors).toHaveLength(2);

      const xContribution = result.contributingFactors.find(
        (f) => f.variable === "x"
      );
      const yContribution = result.contributingFactors.find(
        (f) => f.variable === "y"
      );

      expect(xContribution).toBeDefined();
      expect(yContribution).toBeDefined();

      // x has larger derivative and uncertainty, so should contribute more
      expect(xContribution!.contribution).toBeGreaterThan(
        yContribution!.contribution
      );
    });
  });

  describe("Nonlinear Propagation", () => {
    it("should propagate uncertainty for nonlinear functions", () => {
      // f(x,y) = x * y
      const func = (inputs: Record<string, number>) => inputs.x * inputs.y;

      const result = UncertaintyPropagator.propagateNonlinear(variables, func);

      expect(result.value).toBe(50); // 10 * 5
      expect(result.method).toBe("nonlinear");
      expect(result.uncertainty).toBeGreaterThan(0);
    });

    it("should handle complex nonlinear functions", () => {
      // f(x,y) = x² + sin(y)
      const func = (inputs: Record<string, number>) =>
        Math.pow(inputs.x, 2) + Math.sin(inputs.y);

      const result = UncertaintyPropagator.propagateNonlinear(variables, func);

      expect(result.value).toBeCloseTo(100 + Math.sin(5), 5);
      expect(result.uncertainty).toBeGreaterThan(0);
    });

    it("should use custom step size for numerical differentiation", () => {
      const func = (inputs: Record<string, number>) => inputs.x * inputs.y;

      const result1 = UncertaintyPropagator.propagateNonlinear(
        variables,
        func,
        [],
        1e-6
      );
      const result2 = UncertaintyPropagator.propagateNonlinear(
        variables,
        func,
        [],
        1e-10
      );

      // Results should be similar but not identical due to different step sizes
      expect(Math.abs(result1.uncertainty - result2.uncertainty)).toBeLessThan(
        0.1
      );
    });
  });

  describe("Monte Carlo Analysis", () => {
    it("should perform Monte Carlo uncertainty analysis", () => {
      const func = (inputs: Record<string, number>) => inputs.x + inputs.y;

      const result = UncertaintyPropagator.monteCarloAnalysis(
        variables,
        func,
        1000
      );

      expect(result.value).toBeCloseTo(15, 0); // Should be close to 10 + 5
      expect(result.uncertainty).toBeCloseTo(Math.sqrt(1 * 1 + 0.5 * 0.5), 0); // Should be close to analytical result
      expect(result.method).toBe("monte_carlo");
      expect(result.samples).toBe(1000);
    });

    it("should handle nonlinear functions with Monte Carlo", () => {
      const func = (inputs: Record<string, number>) => inputs.x * inputs.y;

      const result = UncertaintyPropagator.monteCarloAnalysis(
        variables,
        func,
        5000
      );

      expect(result.value).toBeCloseTo(50, 0); // Should be close to 10 * 5
      expect(result.uncertainty).toBeGreaterThan(0);
    });

    it("should provide reproducible results with seed", () => {
      const func = (inputs: Record<string, number>) => inputs.x + inputs.y;

      const result1 = UncertaintyPropagator.monteCarloAnalysis(
        variables,
        func,
        1000,
        [],
        12345
      );
      const result2 = UncertaintyPropagator.monteCarloAnalysis(
        variables,
        func,
        1000,
        [],
        12345
      );

      expect(result1.value).toBeCloseTo(result2.value, 10);
      expect(result1.uncertainty).toBeCloseTo(result2.uncertainty, 10);
    });

    it("should throw error for insufficient samples", () => {
      const func = (inputs: Record<string, number>) => inputs.x + inputs.y;

      expect(() => {
        UncertaintyPropagator.monteCarloAnalysis(variables, func, 50);
      }).toThrow("Monte Carlo analysis requires at least 100 samples");
    });

    it("should analyze contributing factors", () => {
      const func = (inputs: Record<string, number>) => 2 * inputs.x + inputs.y;

      const result = UncertaintyPropagator.monteCarloAnalysis(
        variables,
        func,
        1000
      );

      expect(result.contributingFactors).toHaveLength(2);

      const xContribution = result.contributingFactors.find(
        (f) => f.variable === "x"
      );
      const yContribution = result.contributingFactors.find(
        (f) => f.variable === "y"
      );

      expect(xContribution).toBeDefined();
      expect(yContribution).toBeDefined();

      // x should contribute more due to larger coefficient
      expect(xContribution!.relativeContribution).toBeGreaterThan(
        yContribution!.relativeContribution
      );
    });
  });

  describe("Independent Variable Combination", () => {
    let value1: UncertaintyValue;
    let value2: UncertaintyValue;

    beforeEach(() => {
      value1 = new UncertaintyValue(10, 1, "m", "Test");
      value2 = new UncertaintyValue(5, 0.5, "m", "Test");
    });

    it("should combine values for addition", () => {
      const result = UncertaintyPropagator.combineIndependent(
        [value1, value2],
        "add"
      );

      expect(result.value).toBe(15);
      expect(result.uncertainty).toBeCloseTo(Math.sqrt(1 * 1 + 0.5 * 0.5), 5);
    });

    it("should combine values for subtraction", () => {
      const result = UncertaintyPropagator.combineIndependent(
        [value1, value2],
        "subtract"
      );

      expect(result.value).toBe(5); // 10 - 5
      expect(result.uncertainty).toBeCloseTo(Math.sqrt(1 * 1 + 0.5 * 0.5), 5);
    });

    it("should combine values for multiplication", () => {
      const result = UncertaintyPropagator.combineIndependent(
        [value1, value2],
        "multiply"
      );

      expect(result.value).toBe(50); // 10 * 5

      // Relative uncertainty: √((1/10)² + (0.5/5)²) = √(0.01 + 0.01) = √0.02
      const expectedRelativeUncertainty = Math.sqrt(0.01 + 0.01);
      const expectedUncertainty = 50 * expectedRelativeUncertainty;
      expect(result.uncertainty).toBeCloseTo(expectedUncertainty, 5);
    });

    it("should combine values for division", () => {
      const result = UncertaintyPropagator.combineIndependent(
        [value1, value2],
        "divide"
      );

      expect(result.value).toBe(2); // 10 / 5

      // Same relative uncertainty calculation as multiplication
      const expectedRelativeUncertainty = Math.sqrt(0.01 + 0.01);
      const expectedUncertainty = 2 * expectedRelativeUncertainty;
      expect(result.uncertainty).toBeCloseTo(expectedUncertainty, 5);
    });

    it("should handle single value", () => {
      const result = UncertaintyPropagator.combineIndependent([value1], "add");

      expect(result.value).toBe(value1.value);
      expect(result.uncertainty).toBe(value1.uncertainty);
    });

    it("should throw error for empty array", () => {
      expect(() => {
        UncertaintyPropagator.combineIndependent([], "add");
      }).toThrow("At least one value is required");
    });

    it("should throw error for unsupported operation", () => {
      expect(() => {
        // @ts-expect-error Testing invalid operation
        UncertaintyPropagator.combineIndependent([value1, value2], "invalid");
      }).toThrow("Unsupported operation: invalid");
    });
  });

  describe("Error Handling", () => {
    it("should throw error for empty variables in linear propagation", () => {
      expect(() => {
        UncertaintyPropagator.propagateLinear([], {});
      }).toThrow("At least one variable is required");
    });

    it("should throw error for empty variables in nonlinear propagation", () => {
      const func = (inputs: Record<string, number>) => 0;

      expect(() => {
        UncertaintyPropagator.propagateNonlinear([], func);
      }).toThrow("At least one variable is required");
    });

    it("should throw error for empty variables in Monte Carlo", () => {
      const func = (inputs: Record<string, number>) => 0;

      expect(() => {
        UncertaintyPropagator.monteCarloAnalysis([], func);
      }).toThrow("At least one variable is required");
    });

    it("should handle unknown variables in correlations", () => {
      const partialDerivatives = { x: 1, y: 1 };
      const correlations: CorrelationCoefficient[] = [
        { variable1: "x", variable2: "unknown", coefficient: 0.5 },
      ];

      expect(() => {
        UncertaintyPropagator.propagateLinear(
          variables,
          partialDerivatives,
          correlations
        );
      }).toThrow("Unknown variable in correlation");
    });
  });
});

describe("UncertaintyOperations", () => {
  let value1: UncertaintyValue;
  let value2: UncertaintyValue;

  beforeEach(() => {
    value1 = new UncertaintyValue(10, 1, "m", "Test");
    value2 = new UncertaintyValue(5, 0.5, "m", "Test");
  });

  it("should add uncertainty values", () => {
    const result = UncertaintyOperations.add(value1, value2);

    expect(result.value).toBe(15);
    expect(result.uncertainty).toBeCloseTo(Math.sqrt(1.25), 5);
  });

  it("should subtract uncertainty values", () => {
    const result = UncertaintyOperations.subtract(value1, value2);

    expect(result.value).toBe(5);
    expect(result.uncertainty).toBeCloseTo(Math.sqrt(1.25), 5);
  });

  it("should multiply uncertainty values", () => {
    const result = UncertaintyOperations.multiply(value1, value2);

    expect(result.value).toBe(50);
    expect(result.uncertainty).toBeCloseTo(50 * Math.sqrt(0.02), 5);
  });

  it("should divide uncertainty values", () => {
    const result = UncertaintyOperations.divide(value1, value2);

    expect(result.value).toBe(2);
    expect(result.uncertainty).toBeCloseTo(2 * Math.sqrt(0.02), 5);
  });

  it("should raise to power", () => {
    const result = UncertaintyOperations.power(value1, 2);

    expect(result.value).toBe(100);
    expect(result.uncertainty).toBeCloseTo(100 * 2 * 0.1, 5); // 100 * 2 * (1/10)
  });

  it("should calculate square root", () => {
    const result = UncertaintyOperations.sqrt(value1);

    expect(result.value).toBeCloseTo(Math.sqrt(10), 5);
    expect(result.uncertainty).toBeCloseTo(1 / (2 * Math.sqrt(10)), 5);
  });

  it("should throw error for square root of negative value", () => {
    const negativeValue = new UncertaintyValue(-10, 1, "m", "Test");

    expect(() => {
      UncertaintyOperations.sqrt(negativeValue);
    }).toThrow("Cannot take square root of negative value");
  });

  it("should handle zero values in operations", () => {
    const zeroValue = new UncertaintyValue(0, 0.1, "m", "Test");

    const addResult = UncertaintyOperations.add(zeroValue, value1);
    expect(addResult.value).toBe(10);

    const multiplyResult = UncertaintyOperations.multiply(zeroValue, value1);
    expect(multiplyResult.value).toBe(0);
  });
});

describe("Distribution Sampling", () => {
  it("should sample from different distributions", () => {
    const variables: UncertaintyVariable[] = [
      {
        name: "normal",
        value: new UncertaintyValue(0, 1, "1", "Test"),
        distribution: DistributionType.NORMAL,
      },
      {
        name: "uniform",
        value: new UncertaintyValue(0, 1, "1", "Test"),
        distribution: DistributionType.UNIFORM,
      },
      {
        name: "triangular",
        value: new UncertaintyValue(0, 1, "1", "Test"),
        distribution: DistributionType.TRIANGULAR,
      },
    ];

    const func = (inputs: Record<string, number>) =>
      inputs.normal + inputs.uniform + inputs.triangular;

    // This should not throw an error and should produce reasonable results
    const result = UncertaintyPropagator.monteCarloAnalysis(
      variables,
      func,
      1000
    );

    expect(result.value).toBeCloseTo(0, 1); // Should be close to 0
    expect(result.uncertainty).toBeGreaterThan(0);
    expect(result.contributingFactors).toHaveLength(3);
  });
});

describe("Edge Cases and Precision", () => {
  it("should handle very small uncertainties", () => {
    const preciseValue = new UncertaintyValue(1000000, 1e-10, "m", "Test");
    const result = UncertaintyOperations.power(preciseValue, 2);

    expect(result.value).toBe(1e12);
    expect(result.uncertainty).toBeCloseTo(2e-4, 5); // 2 * 1e12 * 1e-10 / 1e12 = 2e-10 * 1e6 = 2e-4
  });

  it("should handle very large values", () => {
    const largeValue = new UncertaintyValue(1e20, 1e18, "m", "Test");
    const smallValue = new UncertaintyValue(1e10, 1e8, "m", "Test");

    const result = UncertaintyOperations.multiply(largeValue, smallValue);

    expect(result.value).toBe(1e30);
    expect(Number.isFinite(result.uncertainty)).toBe(true);
    expect(result.uncertainty).toBeGreaterThan(0);
  });

  it("should maintain precision in complex calculations", () => {
    const variables: UncertaintyVariable[] = [
      {
        name: "x",
        value: new UncertaintyValue(1.23456789, 0.00000001, "m", "Test"),
        distribution: DistributionType.NORMAL,
      },
    ];

    const func = (inputs: Record<string, number>) => Math.pow(inputs.x, 3);

    const result = UncertaintyPropagator.propagateNonlinear(variables, func);

    expect(result.value).toBeCloseTo(Math.pow(1.23456789, 3), 8);
    expect(result.uncertainty).toBeGreaterThan(0);
  });
});
