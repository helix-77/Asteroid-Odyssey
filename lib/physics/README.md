# Physics Foundation Infrastructure

This directory contains the scientific foundation for accurate physics calculations in the asteroid impact simulation. All implementations are based on peer-reviewed scientific literature and established standards.

## Components

### 1. Scientific Constants (`constants.ts`)

- **UncertaintyValue Class**: Represents physical quantities with proper uncertainty tracking
- **CODATA 2018 Constants**: All fundamental physical constants with official uncertainties
- **IAU Standards**: Astronomical constants following International Astronomical Union definitions
- **Derived Constants**: Commonly used values calculated from fundamental constants

Key features:

- Proper uncertainty propagation
- Source attribution for all values
- Relative uncertainty calculations
- Unit conversion support

### 2. Unit Conversion System (`units.ts`)

- **Comprehensive Unit Database**: Supports length, time, mass, energy, velocity, pressure, and angle units
- **Dimensional Analysis**: Prevents invalid unit conversions
- **Astronomical Units**: Full support for AU, light-years, and other space-relevant units
- **Energy Equivalents**: TNT equivalent conversions for impact energy calculations

Key features:

- Type-safe unit conversions
- Automatic dimensional validation
- UncertaintyValue integration
- Convenience functions for common conversions

### 3. Uncertainty Propagation (`uncertainty.ts`)

- **Linear Propagation**: Standard error propagation using partial derivatives
- **Nonlinear Propagation**: Numerical differentiation for complex functions
- **Monte Carlo Analysis**: Statistical uncertainty analysis with distribution sampling
- **Correlation Handling**: Support for correlated variables

Key features:

- Multiple propagation methods
- Contributing factor analysis
- Distribution sampling (Normal, Uniform, Triangular)
- Comprehensive error handling

## Usage Examples

### Basic Constants

```typescript
import { PHYSICAL_CONSTANTS } from "./constants";

const G = PHYSICAL_CONSTANTS.GRAVITATIONAL_CONSTANT;
console.log(G.toString()); // "6.6743e-11 ± 1.5e-15 m³ kg⁻¹ s⁻²"
```

### Unit Conversions

```typescript
import { UnitConverter } from "./units";

const distanceInAU = UnitConverter.convert(149597870.7, "km", "AU");
console.log(distanceInAU); // 1.0 (exactly)
```

### Uncertainty Propagation

```typescript
import { UncertaintyPropagator, DistributionType } from "./uncertainty";

const variables = [
  {
    name: "mass",
    value: new UncertaintyValue(1000, 50, "kg", "Measurement"),
    distribution: DistributionType.NORMAL,
  },
];

const kineticEnergy = (inputs: Record<string, number>) =>
  0.5 * inputs.mass * Math.pow(inputs.velocity, 2);

const result = UncertaintyPropagator.monteCarloAnalysis(
  variables,
  kineticEnergy,
  10000
);
```

## Testing

All components include comprehensive test suites:

- **96 total tests** covering all functionality
- **Edge case handling** for extreme values
- **Scientific accuracy validation** against known values
- **Error condition testing** for robust error handling

Run tests with:

```bash
pnpm run test:run lib/physics/__tests__/
```

## Scientific Standards

All implementations follow established scientific standards:

- **CODATA 2018** for fundamental constants
- **IAU 2012/2015** for astronomical constants
- **ISO/NIST** standards for units and measurements
- **Peer-reviewed literature** for all formulas and methods

## References

- CODATA 2018 Fundamental Physical Constants
- IAU 2012 Resolution B2 (Astronomical Unit)
- IAU 2015 Resolution B3 (Solar and Planetary Constants)
- NIST Special Publication 330 (International System of Units)
- Various peer-reviewed papers for specific calculation methods
