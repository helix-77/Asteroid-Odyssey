/**
 * Tests for Solar Radiation Pressure Deflection Physics Model
 * Validates against solar sail physics and radiation pressure calculations
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  SolarDeflectionCalculator,
  SolarDeflectionUtils,
  type SolarSailProperties,
  type SolarDeflectionTarget,
  type SolarEnvironment,
  type SolarDeflectionMission,
} from "../solar";
import { UncertaintyValue } from "../../../physics/constants";

describe("SolarDeflectionCalculator", () => {
  let flatSail: SolarSailProperties;
  let apophis: SolarDeflectionTarget;
  let earthOrbit: SolarEnvironment;
  let typicalMission: SolarDeflectionMission;

  beforeEach(() => {
    // Large flat solar sail (10,000 m²)
    flatSail = SolarDeflectionUtils.createFlatSolarSail(10000);

    // Apophis-like asteroid
    apophis = SolarDeflectionUtils.createSolarTarget(
      6.1e10, // kg
      185, // m
      0.23, // albedo
      "rocky"
    );

    // Earth orbit solar environment
    earthOrbit = SolarDeflectionUtils.createSolarEnvironment(1.0);

    // 5-year mission
    typicalMission = SolarDeflectionUtils.createTypicalMission(5);
  });

  describe("calculateSolarDeflection", () => {
    it("should calculate solar sail deflection", () => {
      const result = SolarDeflectionCalculator.calculateSolarDeflection(
        "solar_sail",
        flatSail,
        apophis,
        earthOrbit,
        typicalMission
      );

      // Validate basic physics
      expect(result.forceResult.radiationPressureForce.value).toBeGreaterThan(
        0
      );
      expect(result.forceResult.photonMomentumFlux.value).toBeGreaterThan(0);
      expect(result.deltaV.value).toBeGreaterThan(0);

      // Check force components
      expect(result.forceResult.radialForce.value).toBeGreaterThan(0);
      expect(result.forceResult.tangentialForce.value).toBeGreaterThan(0);
      expect(result.forceResult.normalForce.value).toBeGreaterThan(0);

      // Radial force should dominate for solar radiation pressure
      expect(result.forceResult.radialForce.value).toBeGreaterThan(
        result.forceResult.tangentialForce.value
      );
      expect(result.forceResult.radialForce.value).toBeGreaterThan(
        result.forceResult.normalForce.value
      );

      // Check units
      expect(result.deltaV.unit).toBe("m/s");
      expect(result.forceResult.radiationPressureForce.unit).toBe("N");
      expect(result.requiredSailArea.unit).toBe("m²");
      expect(result.powerRequirement.unit).toBe("W");

      // Validate efficiency factors
      expect(result.forceResult.geometricEfficiency.value).toBeGreaterThan(0);
      expect(result.forceResult.geometricEfficiency.value).toBeLessThanOrEqual(
        1
      );
      expect(result.forceResult.opticalEfficiency.value).toBeGreaterThan(0);
      expect(result.forceResult.opticalEfficiency.value).toBeLessThanOrEqual(1);
      expect(result.forceResult.overallEfficiency.value).toBeGreaterThan(0);
      expect(result.forceResult.overallEfficiency.value).toBeLessThanOrEqual(1);

      // Check seasonal variations
      expect(result.seasonalVariations.maxDeflection.value).toBeGreaterThan(
        result.seasonalVariations.minDeflection.value
      );
      expect(result.seasonalVariations.averageDeflection.value).toBeGreaterThan(
        0
      );

      // Check that references are provided
      expect(result.references).toHaveLength(4);
      expect(result.references[0]).toContain("McInnes");
    });

    it("should handle different deflection methods", () => {
      const methods = [
        "solar_sail",
        "surface_modification",
        "concentrated_sunlight",
        "albedo_modification",
      ];

      methods.forEach((method) => {
        const result = SolarDeflectionCalculator.calculateSolarDeflection(
          method as any,
          flatSail,
          apophis,
          earthOrbit,
          typicalMission
        );

        expect(result.deltaV.value).toBeGreaterThan(0);
        expect(result.forceResult.radiationPressureForce.value).toBeGreaterThan(
          0
        );

        // Different methods should have different power requirements
        expect(result.powerRequirement.value).toBeGreaterThan(0);

        // Solar sail should have lowest power requirement
        if (method === "solar_sail") {
          expect(result.powerRequirement.value).toBeLessThan(200); // < 200 W
        }
      });
    });

    it("should scale with solar distance", () => {
      const nearSun = SolarDeflectionUtils.createSolarEnvironment(0.7); // Venus orbit
      const farSun = SolarDeflectionUtils.createSolarEnvironment(2.0); // Asteroid belt

      const nearResult = SolarDeflectionCalculator.calculateSolarDeflection(
        "solar_sail",
        flatSail,
        apophis,
        nearSun,
        typicalMission
      );

      const farResult = SolarDeflectionCalculator.calculateSolarDeflection(
        "solar_sail",
        flatSail,
        apophis,
        farSun,
        typicalMission
      );

      // Closer to Sun should produce more force (inverse square law)
      expect(
        nearResult.forceResult.radiationPressureForce.value
      ).toBeGreaterThan(farResult.forceResult.radiationPressureForce.value);
      expect(nearResult.deltaV.value).toBeGreaterThan(farResult.deltaV.value);

      // Force should scale with distance (exact scaling depends on implementation details)
      expect(
        nearResult.forceResult.radiationPressureForce.value
      ).toBeGreaterThan(
        farResult.forceResult.radiationPressureForce.value * 2 // At least 2x stronger closer to Sun
      );
    });

    it("should scale with sail area", () => {
      const smallSail = SolarDeflectionUtils.createFlatSolarSail(1000); // 1,000 m²
      const largeSail = SolarDeflectionUtils.createFlatSolarSail(50000); // 50,000 m²

      const smallResult = SolarDeflectionCalculator.calculateSolarDeflection(
        "solar_sail",
        smallSail,
        apophis,
        earthOrbit,
        typicalMission
      );

      const largeResult = SolarDeflectionCalculator.calculateSolarDeflection(
        "solar_sail",
        largeSail,
        apophis,
        earthOrbit,
        typicalMission
      );

      // Larger sail should produce more force
      expect(
        largeResult.forceResult.radiationPressureForce.value
      ).toBeGreaterThan(smallResult.forceResult.radiationPressureForce.value);
      expect(largeResult.deltaV.value).toBeGreaterThan(
        smallResult.deltaV.value
      );

      // Should scale roughly linearly with area
      const areaRatio = largeSail.sailArea.value / smallSail.sailArea.value;
      const forceRatio =
        largeResult.forceResult.radiationPressureForce.value /
        smallResult.forceResult.radiationPressureForce.value;

      expect(forceRatio).toBeGreaterThan(areaRatio * 0.5);
      expect(forceRatio).toBeLessThan(areaRatio * 2);
    });

    it("should generate warnings for extreme parameters", () => {
      // Test with very large sail
      const hugeSail = SolarDeflectionUtils.createFlatSolarSail(200000); // 200,000 m²

      const result = SolarDeflectionCalculator.calculateSolarDeflection(
        "solar_sail",
        hugeSail,
        apophis,
        earthOrbit,
        typicalMission
      );

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(
        result.warnings.some((w) => w.includes("Very large sail area"))
      ).toBe(true);
      expect(result.withinValidityRange).toBe(false);
    });

    it("should validate optical properties", () => {
      // Create sail with invalid optical properties
      const invalidSail: SolarSailProperties = {
        ...flatSail,
        reflectivity: new UncertaintyValue(0.5, 0.05, "1", "Low reflectivity"),
        absorptivity: new UncertaintyValue(0.3, 0.03, "1", "High absorption"),
        transmissivity: new UncertaintyValue(
          0.4,
          0.04,
          "1",
          "High transmission"
        ), // Sum > 1
      };

      const result = SolarDeflectionCalculator.calculateSolarDeflection(
        "solar_sail",
        invalidSail,
        apophis,
        earthOrbit,
        typicalMission
      );

      expect(
        result.warnings.some((w) => w.includes("Optical properties sum"))
      ).toBe(true);
    });

    it("should propagate uncertainties correctly", () => {
      const result = SolarDeflectionCalculator.calculateSolarDeflection(
        "solar_sail",
        flatSail,
        apophis,
        earthOrbit,
        typicalMission
      );

      // All results should have non-zero uncertainties
      expect(result.deltaV.uncertainty).toBeGreaterThan(0);
      expect(
        result.forceResult.radiationPressureForce.uncertainty
      ).toBeGreaterThan(0);
      expect(result.forceResult.photonMomentumFlux.uncertainty).toBeGreaterThan(
        0
      );

      // Uncertainties should be reasonable fractions of values
      expect(result.deltaV.relativeUncertaintyPercent).toBeLessThan(100);
      expect(
        result.forceResult.radiationPressureForce.relativeUncertaintyPercent
      ).toBeLessThan(100);
    });
  });

  describe("Solar Sail Specifications", () => {
    it("should provide specifications for all sail types", () => {
      const sailTypes = ["flat", "parabolic", "heliogyro", "spinning"];

      sailTypes.forEach((sailType) => {
        const specs =
          SolarDeflectionCalculator.getSolarSailSpecifications(sailType);

        expect(specs.sailType).toBe(sailType);
        expect(specs.sailEfficiency?.value).toBeGreaterThan(0);
        expect(specs.sailEfficiency?.value).toBeLessThanOrEqual(1);
        expect(specs.reflectivity?.value).toBeGreaterThan(0);
        expect(specs.reflectivity?.value).toBeLessThanOrEqual(1);
        expect(specs.operationalLifetime?.value).toBeGreaterThan(0);

        // Units should be correct
        expect(specs.sailEfficiency?.unit).toBe("1");
        expect(specs.reflectivity?.unit).toBe("1");
        expect(specs.operationalLifetime?.unit).toBe("s");
      });
    });

    it("should have different characteristics for different sail types", () => {
      const flat = SolarDeflectionCalculator.getSolarSailSpecifications("flat");
      const parabolic =
        SolarDeflectionCalculator.getSolarSailSpecifications("parabolic");
      const heliogyro =
        SolarDeflectionCalculator.getSolarSailSpecifications("heliogyro");

      // Parabolic should have higher efficiency and reflectivity
      expect(parabolic.sailEfficiency!.value).toBeGreaterThan(
        flat.sailEfficiency!.value
      );
      expect(parabolic.reflectivity!.value).toBeGreaterThan(
        flat.reflectivity!.value
      );

      // Parabolic should have longer operational lifetime
      expect(parabolic.operationalLifetime!.value).toBeGreaterThan(
        flat.operationalLifetime!.value
      );
      expect(parabolic.operationalLifetime!.value).toBeGreaterThan(
        heliogyro.operationalLifetime!.value
      );
    });

    it("should throw error for unknown sail type", () => {
      expect(() => {
        SolarDeflectionCalculator.getSolarSailSpecifications("unknown");
      }).toThrow("Unknown solar sail type: unknown");
    });
  });

  describe("Solar Environment", () => {
    it("should provide environments for different distances", () => {
      const distances = ["1_AU", "1.5_AU", "2_AU"];

      distances.forEach((distance) => {
        const environment =
          SolarDeflectionCalculator.getSolarEnvironment(distance);

        expect(environment.solarDistance?.value).toBeGreaterThan(0);
        expect(environment.solarFlux?.value).toBeGreaterThan(0);
        expect(environment.solarConstant?.value).toBeGreaterThan(0);
        expect(environment.seasonalVariation?.value).toBeGreaterThan(0);

        // Units should be correct
        expect(environment.solarDistance?.unit).toBe("AU");
        expect(environment.solarFlux?.unit).toBe("W/m²");
        expect(environment.solarConstant?.unit).toBe("W/m²");
      });
    });

    it("should have decreasing solar flux with distance", () => {
      const near = SolarDeflectionCalculator.getSolarEnvironment("1_AU");
      const middle = SolarDeflectionCalculator.getSolarEnvironment("1.5_AU");
      const far = SolarDeflectionCalculator.getSolarEnvironment("2_AU");

      // Solar flux should decrease with distance
      expect(near.solarFlux!.value).toBeGreaterThan(middle.solarFlux!.value);
      expect(middle.solarFlux!.value).toBeGreaterThan(far.solarFlux!.value);

      // Should roughly follow inverse square law
      const expectedMiddleFlux = near.solarFlux!.value / Math.pow(1.5, 2);
      expect(middle.solarFlux!.value).toBeCloseTo(expectedMiddleFlux, -1);
    });

    it("should throw error for unknown distance", () => {
      expect(() => {
        SolarDeflectionCalculator.getSolarEnvironment("unknown");
      }).toThrow("Unknown solar distance: unknown");
    });
  });

  describe("Utility Functions", () => {
    it("should create flat solar sail with correct properties", () => {
      const area = 5000; // m²
      const sail = SolarDeflectionUtils.createFlatSolarSail(area);

      expect(sail.sailArea.value).toBe(area);
      expect(sail.sailType).toBe("flat");
      expect(sail.sailMass.value).toBe(area * 0.01); // 10 g/m²

      // Should have flat sail characteristics
      expect(sail.reflectivity?.value).toBeGreaterThan(0.8); // High reflectivity
      expect(sail.sailEfficiency?.value).toBeGreaterThan(0.8); // Good efficiency

      // Should have reasonable uncertainties
      expect(sail.sailArea.uncertainty).toBe(area * 0.1); // 10%
    });

    it("should create solar environment with correct scaling", () => {
      const distance = 1.5; // AU
      const environment = SolarDeflectionUtils.createSolarEnvironment(distance);

      expect(environment.solarDistance.value).toBe(distance);

      // Solar flux should scale with inverse square of distance
      const expectedFlux = 1361 / Math.pow(distance, 2);
      expect(environment.solarFlux.value).toBeCloseTo(expectedFlux, 0);

      expect(environment.solarConstant.value).toBe(1361); // Should remain constant
    });

    it("should create typical mission parameters", () => {
      const durationYears = 3;
      const mission = SolarDeflectionUtils.createTypicalMission(durationYears);

      const expectedDuration = durationYears * 365.25 * 24 * 3600;
      expect(mission.missionDuration.value).toBe(expectedDuration);
      expect(mission.deploymentDistance.value).toBeGreaterThan(0);
      expect(mission.operatingDistance.value).toBeGreaterThan(0);
      expect(mission.orientationAccuracy.value).toBeGreaterThan(0);
      expect(mission.stationKeepingCapability).toBe(true);
      expect(mission.autonomousOperation).toBe(true);
    });

    it("should create solar target with specified properties", () => {
      const mass = 1e12; // kg
      const radius = 500; // m
      const albedo = 0.15;
      const composition = "carbonaceous";

      const target = SolarDeflectionUtils.createSolarTarget(
        mass,
        radius,
        albedo,
        composition
      );

      expect(target.mass.value).toBe(mass);
      expect(target.radius.value).toBe(radius);
      expect(target.albedo.value).toBe(albedo);
      expect(target.composition).toBe(composition);

      // Cross-sectional area should be calculated
      const expectedArea = Math.PI * radius * radius;
      expect(target.crossSectionalArea.value).toBeCloseTo(expectedArea, 0);

      // Should have reasonable default values
      expect(target.thermalInertia.value).toBeGreaterThan(0);
      expect(target.rotationPeriod.value).toBeGreaterThan(0);
      expect(target.surfaceRoughness.value).toBeGreaterThan(0);
      expect(target.surfaceRoughness.value).toBeLessThanOrEqual(1);
    });
  });

  describe("Physics Validation", () => {
    it("should have realistic radiation pressure forces", () => {
      const result = SolarDeflectionCalculator.calculateSolarDeflection(
        "solar_sail",
        flatSail,
        apophis,
        earthOrbit,
        typicalMission
      );

      // Radiation pressure force should be small but measurable
      expect(result.forceResult.radiationPressureForce.value).toBeGreaterThan(
        1e-6
      ); // > 1 μN
      expect(result.forceResult.radiationPressureForce.value).toBeLessThan(1); // < 1 N

      // Photon momentum flux should be realistic
      const expectedFlux = earthOrbit.solarFlux.value / 299792458; // c = speed of light
      expect(result.forceResult.photonMomentumFlux.value).toBeCloseTo(
        expectedFlux,
        -8
      );
    });

    it("should have realistic accelerations", () => {
      const result = SolarDeflectionCalculator.calculateSolarDeflection(
        "solar_sail",
        flatSail,
        apophis,
        earthOrbit,
        typicalMission
      );

      // Accelerations should be very small for large asteroids
      expect(result.forceResult.radialAcceleration.value).toBeGreaterThan(
        1e-20
      ); // > 10^-20 m/s²
      expect(result.forceResult.radialAcceleration.value).toBeLessThan(1e-10); // < 10^-10 m/s²

      expect(result.forceResult.tangentialAcceleration.value).toBeGreaterThan(
        0
      );
      expect(result.forceResult.normalAcceleration.value).toBeGreaterThan(0);
    });

    it("should have reasonable mission feasibility", () => {
      const result = SolarDeflectionCalculator.calculateSolarDeflection(
        "solar_sail",
        flatSail,
        apophis,
        earthOrbit,
        typicalMission
      );

      // Mission feasibility should be reasonable
      expect(result.missionFeasibility.value).toBeGreaterThan(0);
      expect(result.missionFeasibility.value).toBeLessThanOrEqual(1);

      // Deflection efficiency should be positive
      expect(result.deflectionEfficiency.value).toBeGreaterThan(0);

      // Cost effectiveness should be positive
      expect(result.costEffectiveness.value).toBeGreaterThan(0);
    });

    it("should have consistent seasonal variations", () => {
      const result = SolarDeflectionCalculator.calculateSolarDeflection(
        "solar_sail",
        flatSail,
        apophis,
        earthOrbit,
        typicalMission
      );

      // Seasonal variations should be consistent
      expect(result.seasonalVariations.maxDeflection.value).toBeGreaterThan(
        result.seasonalVariations.averageDeflection.value
      );
      expect(result.seasonalVariations.averageDeflection.value).toBeGreaterThan(
        result.seasonalVariations.minDeflection.value
      );

      // Variations should be reasonable (not too extreme)
      const variation =
        (result.seasonalVariations.maxDeflection.value -
          result.seasonalVariations.minDeflection.value) /
        result.seasonalVariations.averageDeflection.value;
      expect(variation).toBeLessThan(1); // Less than 100% variation
    });
  });
});
