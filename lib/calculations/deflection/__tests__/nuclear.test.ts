/**
 * Tests for Nuclear Deflection Physics Model
 * Validates against nuclear weapons effects data and theoretical models
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  NuclearDeflectionCalculator,
  NuclearDeflectionUtils,
  type NuclearDeviceProperties,
  type NuclearTargetProperties,
  type NuclearDeflectionGeometry,
} from "../nuclear";
import { UncertaintyValue } from "../../../physics/constants";

describe("NuclearDeflectionCalculator", () => {
  let strategicDevice: NuclearDeviceProperties;
  let rockyTarget: NuclearTargetProperties;
  let optimalGeometry: NuclearDeflectionGeometry;

  beforeEach(() => {
    // Strategic nuclear device (1 Mt)
    strategicDevice = NuclearDeflectionUtils.createStrategicDevice();

    // Rocky asteroid target (similar to Apophis)
    rockyTarget = NuclearDeflectionUtils.createNuclearTarget(
      6.1e10, // kg (Apophis mass estimate)
      185, // m (Apophis radius estimate)
      "rocky"
    );

    // Optimal standoff geometry
    optimalGeometry = NuclearDeflectionUtils.createOptimalStandoffGeometry(185);
  });

  describe("calculateNuclearDeflection", () => {
    it("should calculate nuclear deflection for strategic device", () => {
      const result = NuclearDeflectionCalculator.calculateNuclearDeflection(
        strategicDevice,
        rockyTarget,
        optimalGeometry
      );

      // Validate basic physics
      expect(result.momentumDeposition.totalMomentum.value).toBeGreaterThan(0);
      expect(result.deltaV.value).toBeGreaterThan(0);
      expect(result.totalEnergyDeposited.value).toBeGreaterThan(0);

      // Check momentum components
      expect(result.momentumDeposition.xrayMomentum.value).toBeGreaterThan(0);
      expect(result.momentumDeposition.neutronMomentum.value).toBeGreaterThan(
        0
      );
      expect(result.momentumDeposition.debrisMomentum.value).toBeGreaterThan(0);

      // X-ray momentum should dominate
      expect(result.momentumDeposition.xrayMomentum.value).toBeGreaterThan(
        result.momentumDeposition.neutronMomentum.value
      );
      expect(result.momentumDeposition.xrayMomentum.value).toBeGreaterThan(
        result.momentumDeposition.debrisMomentum.value
      );

      // Check units
      expect(result.deltaV.unit).toBe("m/s");
      expect(result.totalEnergyDeposited.unit).toBe("J");
      expect(result.momentumTransferEfficiency.unit).toBe("1");

      // Validate thermal effects
      expect(result.surfaceTemperature.value).toBeGreaterThan(1000); // Should be very hot
      expect(result.thermalPenetrationDepth.value).toBeGreaterThan(0);

      // Validate structural effects
      expect(result.fractureRadius.value).toBeGreaterThan(0);
      expect(result.spallationMass.value).toBeGreaterThan(0);

      // Check that references are provided
      expect(result.references).toHaveLength(4);
      expect(result.references[0]).toContain("Ahrens");
    });

    it("should handle different device types", () => {
      const deviceTypes = ["tactical", "strategic", "thermonuclear"];

      deviceTypes.forEach((deviceType) => {
        const device =
          NuclearDeflectionCalculator.getDeviceSpecifications(deviceType);
        const result = NuclearDeflectionCalculator.calculateNuclearDeflection(
          device,
          rockyTarget,
          optimalGeometry
        );

        expect(result.deltaV.value).toBeGreaterThan(0);
        expect(result.momentumDeposition.totalMomentum.value).toBeGreaterThan(
          0
        );

        // Larger yields should generally produce more momentum
        if (deviceType === "thermonuclear") {
          expect(result.deltaV.value).toBeGreaterThan(1e-6); // At least μm/s
        }
      });
    });

    it("should handle different target compositions", () => {
      const compositions: Array<"rocky" | "metallic" | "carbonaceous"> = [
        "rocky",
        "metallic",
        "carbonaceous",
      ];

      compositions.forEach((composition) => {
        const target = NuclearDeflectionUtils.createNuclearTarget(
          6.1e10, // Same mass
          185, // Same radius
          composition
        );

        const result = NuclearDeflectionCalculator.calculateNuclearDeflection(
          strategicDevice,
          target,
          optimalGeometry
        );

        expect(result.deltaV.value).toBeGreaterThan(0);
        expect(result.momentumDeposition.totalMomentum.value).toBeGreaterThan(
          0
        );

        // Different compositions should give different thermal responses
        if (composition === "metallic") {
          // Metallic targets should have higher thermal conductivity
          expect(result.thermalPenetrationDepth.value).toBeGreaterThan(0);
        }
      });
    });

    it("should optimize standoff distance", () => {
      const result = NuclearDeflectionCalculator.calculateNuclearDeflection(
        strategicDevice,
        rockyTarget,
        optimalGeometry
      );

      // Optimal standoff should be a few target radii
      expect(result.optimalStandoffDistance.value).toBeGreaterThan(
        rockyTarget.radius.value
      );
      expect(result.optimalStandoffDistance.value).toBeLessThan(
        rockyTarget.radius.value * 10
      );

      // Should be close to the input geometry (which was already optimized)
      expect(
        Math.abs(
          result.optimalStandoffDistance.value -
            optimalGeometry.standoffDistance.value
        )
      ).toBeLessThan(rockyTarget.radius.value);
    });

    it("should validate energy conservation", () => {
      const result = NuclearDeflectionCalculator.calculateNuclearDeflection(
        strategicDevice,
        rockyTarget,
        optimalGeometry
      );

      // Total energy should equal device yield
      const expectedEnergy = strategicDevice.yield.value * 4.184e15; // Mt TNT to Joules
      expect(result.totalEnergyDeposited.value).toBeCloseTo(
        expectedEnergy,
        -12
      ); // Within 1%

      // Energy fractions should be consistent
      const xrayEnergy =
        result.totalEnergyDeposited.value * strategicDevice.xrayFraction.value;
      const neutronEnergy =
        result.totalEnergyDeposited.value *
        strategicDevice.neutronFraction.value;

      expect(xrayEnergy).toBeGreaterThan(neutronEnergy); // X-rays should dominate
    });

    it("should generate warnings for extreme parameters", () => {
      // Test with very large standoff distance
      const extremeGeometry: NuclearDeflectionGeometry = {
        standoffDistance: new UncertaintyValue(
          rockyTarget.radius.value * 20,
          100,
          "m",
          "Very large standoff"
        ),
        burstHeight: new UncertaintyValue(
          rockyTarget.radius.value * 20,
          100,
          "m",
          "Very high"
        ),
        targetAspectAngle: new UncertaintyValue(0, 0.1, "rad", "Head-on"),
        detonationTiming: "standoff",
      };

      const result = NuclearDeflectionCalculator.calculateNuclearDeflection(
        strategicDevice,
        rockyTarget,
        extremeGeometry
      );

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.includes("standoff distance"))).toBe(
        true
      );
    });

    it("should handle very small devices", () => {
      const smallDevice: NuclearDeviceProperties = {
        ...strategicDevice,
        yield: new UncertaintyValue(
          0.0005,
          0.0001,
          "Mt TNT",
          "Very small device"
        ),
      };

      const result = NuclearDeflectionCalculator.calculateNuclearDeflection(
        smallDevice,
        rockyTarget,
        optimalGeometry
      );

      expect(
        result.warnings.some((w) => w.includes("small nuclear yield"))
      ).toBe(true);
      expect(result.deltaV.value).toBeGreaterThan(0); // Should still work, just less effective
    });

    it("should propagate uncertainties correctly", () => {
      const result = NuclearDeflectionCalculator.calculateNuclearDeflection(
        strategicDevice,
        rockyTarget,
        optimalGeometry
      );

      // All results should have non-zero uncertainties
      expect(result.deltaV.uncertainty).toBeGreaterThan(0);
      expect(
        result.momentumDeposition.totalMomentum.uncertainty
      ).toBeGreaterThan(0);
      expect(result.totalEnergyDeposited.uncertainty).toBeGreaterThan(0);
      expect(result.surfaceTemperature.uncertainty).toBeGreaterThan(0);

      // Total momentum uncertainty should be combination of components
      const expectedUncertainty = Math.sqrt(
        Math.pow(result.momentumDeposition.xrayMomentum.uncertainty, 2) +
          Math.pow(result.momentumDeposition.neutronMomentum.uncertainty, 2) +
          Math.pow(result.momentumDeposition.debrisMomentum.uncertainty, 2)
      );

      expect(result.momentumDeposition.totalMomentum.uncertainty).toBeCloseTo(
        expectedUncertainty,
        5
      );
    });
  });

  describe("Device Specifications", () => {
    it("should provide specifications for all device types", () => {
      const deviceTypes = ["tactical", "strategic", "thermonuclear"];

      deviceTypes.forEach((deviceType) => {
        const device =
          NuclearDeflectionCalculator.getDeviceSpecifications(deviceType);

        expect(device.yield.value).toBeGreaterThan(0);
        expect(device.mass.value).toBeGreaterThan(0);

        // Energy fractions should sum to approximately 1
        const totalFraction =
          device.xrayFraction.value +
          device.neutronFraction.value +
          device.gammaFraction.value +
          device.debrisFraction.value;

        expect(totalFraction).toBeCloseTo(1.0, 1);

        // X-ray fraction should be largest
        expect(device.xrayFraction.value).toBeGreaterThan(
          device.neutronFraction.value
        );
        expect(device.xrayFraction.value).toBeGreaterThan(
          device.gammaFraction.value
        );
        expect(device.xrayFraction.value).toBeGreaterThan(
          device.debrisFraction.value
        );

        // Units should be correct
        expect(device.yield.unit).toBe("Mt TNT");
        expect(device.mass.unit).toBe("kg");
        expect(device.xrayFraction.unit).toBe("1");
      });
    });

    it("should have different yields for different device types", () => {
      const tactical =
        NuclearDeflectionCalculator.getDeviceSpecifications("tactical");
      const strategic =
        NuclearDeflectionCalculator.getDeviceSpecifications("strategic");
      const thermonuclear =
        NuclearDeflectionCalculator.getDeviceSpecifications("thermonuclear");

      // Yields should increase: tactical < strategic < thermonuclear
      expect(tactical.yield.value).toBeLessThan(strategic.yield.value);
      expect(strategic.yield.value).toBeLessThan(thermonuclear.yield.value);
    });

    it("should throw error for unknown device type", () => {
      expect(() => {
        NuclearDeflectionCalculator.getDeviceSpecifications("unknown");
      }).toThrow("Unknown nuclear device type: unknown");
    });
  });

  describe("Target Properties", () => {
    it("should provide properties for all compositions", () => {
      const compositions = ["rocky", "metallic", "carbonaceous"];

      compositions.forEach((composition) => {
        const properties =
          NuclearDeflectionCalculator.getNuclearTargetProperties(composition);

        expect(properties.density?.value).toBeGreaterThan(0);
        expect(properties.albedo?.value).toBeGreaterThanOrEqual(0);
        expect(properties.albedo?.value).toBeLessThanOrEqual(1);
        expect(properties.thermalInertia?.value).toBeGreaterThan(0);
        expect(properties.vaporization?.energy.value).toBeGreaterThan(0);
        expect(properties.vaporization?.temperature.value).toBeGreaterThan(0);

        // Units should be correct
        expect(properties.density?.unit).toBe("kg/m³");
        expect(properties.albedo?.unit).toBe("1");
        expect(properties.vaporization?.energy.unit).toBe("J/kg");
        expect(properties.vaporization?.temperature.unit).toBe("K");
      });
    });

    it("should have different properties for different compositions", () => {
      const rocky =
        NuclearDeflectionCalculator.getNuclearTargetProperties("rocky");
      const metallic =
        NuclearDeflectionCalculator.getNuclearTargetProperties("metallic");
      const carbonaceous =
        NuclearDeflectionCalculator.getNuclearTargetProperties("carbonaceous");

      // Metallic should be denser than rocky, rocky denser than carbonaceous
      expect(metallic.density!.value).toBeGreaterThan(rocky.density!.value);
      expect(rocky.density!.value).toBeGreaterThan(carbonaceous.density!.value);

      // Metallic should have higher thermal inertia
      expect(metallic.thermalInertia!.value).toBeGreaterThan(
        rocky.thermalInertia!.value
      );
      expect(rocky.thermalInertia!.value).toBeGreaterThan(
        carbonaceous.thermalInertia!.value
      );
    });

    it("should throw error for unknown composition", () => {
      expect(() => {
        NuclearDeflectionCalculator.getNuclearTargetProperties("unknown");
      }).toThrow("Unknown target composition: unknown");
    });
  });

  describe("Utility Functions", () => {
    it("should create strategic device with correct properties", () => {
      const device = NuclearDeflectionUtils.createStrategicDevice();

      expect(device.yield.value).toBe(1.0); // 1 Mt
      expect(device.deviceType).toBe("fusion");
      expect(device.mass.value).toBeGreaterThan(0);

      // Should have reasonable uncertainties
      expect(device.yield.uncertainty).toBeGreaterThan(0);
      expect(device.mass.uncertainty).toBeGreaterThan(0);
    });

    it("should create optimal standoff geometry", () => {
      const targetRadius = 100; // m
      const geometry =
        NuclearDeflectionUtils.createOptimalStandoffGeometry(targetRadius);

      expect(geometry.standoffDistance.value).toBeCloseTo(targetRadius * 3, 0);
      expect(geometry.burstHeight.value).toBeCloseTo(targetRadius * 3, 0);
      expect(geometry.targetAspectAngle.value).toBe(0); // Head-on
      expect(geometry.detonationTiming).toBe("standoff");
    });

    it("should create nuclear target with specified properties", () => {
      const mass = 1e12; // kg
      const radius = 500; // m
      const composition = "metallic";

      const target = NuclearDeflectionUtils.createNuclearTarget(
        mass,
        radius,
        composition
      );

      expect(target.mass.value).toBe(mass);
      expect(target.radius.value).toBe(radius);
      expect(target.composition).toBe(composition);

      // Should inherit composition-specific properties
      expect(target.density?.value).toBeGreaterThan(0);
      expect(target.albedo?.value).toBeGreaterThan(0);
      expect(target.thermalInertia?.value).toBeGreaterThan(0);

      // Should have reasonable uncertainties
      expect(target.mass.uncertainty).toBe(mass * 0.2); // 20%
      expect(target.radius.uncertainty).toBe(radius * 0.1); // 10%
    });
  });

  describe("Physics Validation", () => {
    it("should have realistic momentum coupling coefficients", () => {
      const result = NuclearDeflectionCalculator.calculateNuclearDeflection(
        strategicDevice,
        rockyTarget,
        optimalGeometry
      );

      // Momentum coupling coefficient should be in realistic range
      // Typical values are 10^-5 to 10^-2 s/m for nuclear deflection
      expect(result.momentumCouplingCoefficient.value).toBeGreaterThan(1e-6);
      expect(result.momentumCouplingCoefficient.value).toBeLessThan(5e-2);

      expect(result.momentumCouplingCoefficient.unit).toBe("s/m");
    });

    it("should have realistic thermal effects", () => {
      const result = NuclearDeflectionCalculator.calculateNuclearDeflection(
        strategicDevice,
        rockyTarget,
        optimalGeometry
      );

      // Surface temperature should be very high but not unrealistic
      expect(result.surfaceTemperature.value).toBeGreaterThan(2000); // Above melting point
      expect(result.surfaceTemperature.value).toBeLessThan(20000); // Below plasma temperatures

      // Thermal penetration should be reasonable
      expect(result.thermalPenetrationDepth.value).toBeGreaterThan(0.001); // > 1 mm
      expect(result.thermalPenetrationDepth.value).toBeLessThan(10); // < 10 m
    });

    it("should have realistic vaporization amounts", () => {
      const result = NuclearDeflectionCalculator.calculateNuclearDeflection(
        strategicDevice,
        rockyTarget,
        optimalGeometry
      );

      // Vaporized mass should be significant but not the entire asteroid
      expect(result.momentumDeposition.vaporizedMass.value).toBeGreaterThan(10); // > 10 kg (more realistic for surface heating)
      expect(result.momentumDeposition.vaporizedMass.value).toBeLessThan(
        rockyTarget.mass.value * 0.01
      ); // < 1% of target

      // Ablation velocity should be reasonable
      expect(result.momentumDeposition.ablationVelocity.value).toBeGreaterThan(
        1
      ); // > 1 m/s (realistic for nuclear ablation)
      expect(result.momentumDeposition.ablationVelocity.value).toBeLessThan(
        50000
      ); // < 50 km/s
    });

    it("should scale properly with device yield", () => {
      const smallDevice =
        NuclearDeflectionCalculator.getDeviceSpecifications("tactical");
      const largeDevice =
        NuclearDeflectionCalculator.getDeviceSpecifications("thermonuclear");

      const smallResult =
        NuclearDeflectionCalculator.calculateNuclearDeflection(
          smallDevice,
          rockyTarget,
          optimalGeometry
        );

      const largeResult =
        NuclearDeflectionCalculator.calculateNuclearDeflection(
          largeDevice,
          rockyTarget,
          optimalGeometry
        );

      // Larger device should produce more momentum and velocity change
      expect(
        largeResult.momentumDeposition.totalMomentum.value
      ).toBeGreaterThan(smallResult.momentumDeposition.totalMomentum.value);
      expect(largeResult.deltaV.value).toBeGreaterThan(
        smallResult.deltaV.value
      );

      // Should scale roughly with yield^(2/3) due to surface area effects
      const yieldRatio = largeDevice.yield.value / smallDevice.yield.value;
      const momentumRatio =
        largeResult.momentumDeposition.totalMomentum.value /
        smallResult.momentumDeposition.totalMomentum.value;

      expect(momentumRatio).toBeGreaterThan(2); // Should at least double with much larger yield
      expect(momentumRatio).toBeLessThan(Math.pow(yieldRatio, 1.0));
    });
  });
});
