import { describe, it, expect } from "vitest";
import {
  computeKineticEnergy,
  energyToMegatonsTNT,
  estimateBlastRadiiKm,
  estimateCraterRadiusKm,
  estimateCasualties,
  estimateEconomicDamageUSD,
  estimateTsunami,
  estimateClimateImpact,
  computeImpactBundle,
  withProvenance,
} from "@/lib/calculations";

describe("Calculations", () => {
  describe("computeKineticEnergy", () => {
    it("calculates kinetic energy correctly", () => {
      const mass = 1000; // kg
      const velocity = 20000; // m/s
      const expected = 0.5 * mass * velocity * velocity; // 2e11 J

      expect(computeKineticEnergy(mass, velocity)).toBe(expected);
    });

    it("handles zero values", () => {
      expect(computeKineticEnergy(0, 1000)).toBe(0);
      expect(computeKineticEnergy(1000, 0)).toBe(0);
    });
  });

  describe("energyToMegatonsTNT", () => {
    it("converts joules to megatons correctly", () => {
      const oneMegaton = 4.184e15; // J
      expect(energyToMegatonsTNT(oneMegaton)).toBeCloseTo(1, 6);
      expect(energyToMegatonsTNT(oneMegaton * 10)).toBeCloseTo(10, 6);
    });
  });

  describe("estimateBlastRadiiKm", () => {
    it("scales blast radii with energy", () => {
      const energy1 = 4.184e15; // 1 Mt
      const energy8 = 8 * 4.184e15; // 8 Mt

      const radii1 = estimateBlastRadiiKm(energy1);
      const radii8 = estimateBlastRadiiKm(energy8);

      // Should scale as cube root of energy ratio
      const expectedRatio = Math.cbrt(8);

      expect(radii8.overpressure20psi / radii1.overpressure20psi).toBeCloseTo(
        expectedRatio,
        1
      );
      expect(radii8.overpressure10psi / radii1.overpressure10psi).toBeCloseTo(
        expectedRatio,
        1
      );
      expect(radii8.overpressure5psi / radii1.overpressure5psi).toBeCloseTo(
        expectedRatio,
        1
      );
      expect(radii8.overpressure1psi / radii1.overpressure1psi).toBeCloseTo(
        expectedRatio,
        1
      );
    });

    it("produces decreasing radii with pressure", () => {
      const energy = 4.184e15; // 1 Mt
      const radii = estimateBlastRadiiKm(energy);

      expect(radii.overpressure20psi).toBeLessThan(radii.overpressure10psi);
      expect(radii.overpressure10psi).toBeLessThan(radii.overpressure5psi);
      expect(radii.overpressure5psi).toBeLessThan(radii.overpressure1psi);
    });
  });

  describe("estimateCraterRadiusKm", () => {
    it("scales crater size with energy", () => {
      const energy1 = 4.184e15; // 1 Mt
      const energy8 = 8 * 4.184e15; // 8 Mt

      const crater1 = estimateCraterRadiusKm(energy1, "land");
      const crater8 = estimateCraterRadiusKm(energy8, "land");

      // Should scale as cube root
      const expectedRatio = Math.cbrt(8);
      expect(crater8 / crater1).toBeCloseTo(expectedRatio, 1);
    });

    it("varies crater size by target type", () => {
      const energy = 4.184e15; // 1 Mt

      const landCrater = estimateCraterRadiusKm(energy, "land");
      const waterCrater = estimateCraterRadiusKm(energy, "water");
      const iceCrater = estimateCraterRadiusKm(energy, "ice");

      expect(waterCrater).toBeLessThan(landCrater);
      expect(iceCrater).toBeLessThan(landCrater);
      expect(iceCrater).toBeGreaterThan(waterCrater);
    });
  });

  describe("estimateCasualties", () => {
    it("scales casualties with population density", () => {
      const blastRadii = {
        overpressure20psi: 2,
        overpressure10psi: 4,
        overpressure5psi: 6,
        overpressure1psi: 15,
      };

      const casualties1 = estimateCasualties(100, blastRadii, 0.1);
      const casualties2 = estimateCasualties(200, blastRadii, 0.1);

      expect(casualties2).toBeGreaterThan(casualties1);
      expect(casualties2 / casualties1).toBeCloseTo(2, 0.5);
    });

    it("reduces casualties with shelter factor", () => {
      const blastRadii = {
        overpressure20psi: 2,
        overpressure10psi: 4,
        overpressure5psi: 6,
        overpressure1psi: 15,
      };

      const casualtiesNoShelter = estimateCasualties(1000, blastRadii, 0);
      const casualtiesWithShelter = estimateCasualties(1000, blastRadii, 0.5);

      expect(casualtiesWithShelter).toBeLessThan(casualtiesNoShelter);
    });

    it("caps casualties at reasonable maximum", () => {
      const blastRadii = {
        overpressure20psi: 1000,
        overpressure10psi: 2000,
        overpressure5psi: 3000,
        overpressure1psi: 5000,
      };

      const casualties = estimateCasualties(1e6, blastRadii, 0);
      expect(casualties).toBeLessThanOrEqual(8e9); // World population cap
    });
  });

  describe("estimateEconomicDamageUSD", () => {
    it("scales with casualties and area", () => {
      const blastRadii = {
        overpressure20psi: 2,
        overpressure10psi: 4,
        overpressure5psi: 6,
        overpressure1psi: 15,
      };

      const damage1 = estimateEconomicDamageUSD(1000, blastRadii, 1);
      const damage2 = estimateEconomicDamageUSD(2000, blastRadii, 1);

      expect(damage2).toBeGreaterThan(damage1);
    });

    it("applies production factor", () => {
      const blastRadii = {
        overpressure20psi: 2,
        overpressure10psi: 4,
        overpressure5psi: 6,
        overpressure1psi: 15,
      };

      const damageNormal = estimateEconomicDamageUSD(1000, blastRadii, 1);
      const damageDouble = estimateEconomicDamageUSD(1000, blastRadii, 2);

      expect(damageDouble).toBeCloseTo(damageNormal * 2, -6);
    });
  });

  describe("estimateTsunami", () => {
    it("returns zero for land impacts", () => {
      const tsunami = estimateTsunami(false, 4.184e15, 4000);

      expect(tsunami.waveHeightM).toBe(0);
      expect(tsunami.travelTimeMin).toBe(0);
    });

    it("generates tsunami for water impacts", () => {
      const tsunami = estimateTsunami(true, 4.184e15, 4000);

      expect(tsunami.waveHeightM).toBeGreaterThan(0);
      expect(tsunami.travelTimeMin).toBeGreaterThan(0);
    });

    it("scales tsunami with energy", () => {
      const tsunami1 = estimateTsunami(true, 4.184e15, 4000);
      const tsunami8 = estimateTsunami(true, 8 * 4.184e15, 4000);

      expect(tsunami8.waveHeightM).toBeGreaterThan(tsunami1.waveHeightM);
      expect(tsunami8.travelTimeMin).toBeGreaterThan(tsunami1.travelTimeMin);
    });
  });

  describe("estimateClimateImpact", () => {
    it("produces cooling for large impacts", () => {
      const climate = estimateClimateImpact(1000 * 4.184e15, 1e12, 0.1); // 1000 Mt

      expect(climate.tempChangeC).toBeLessThan(0); // Cooling
      expect(climate.habitabilityLossPct).toBeGreaterThan(0);
    });

    it("scales with energy and soot", () => {
      const climate1 = estimateClimateImpact(100 * 4.184e15, 1e11, 0.05);
      const climate2 = estimateClimateImpact(1000 * 4.184e15, 1e12, 0.2);

      expect(Math.abs(climate2.tempChangeC)).toBeGreaterThan(
        Math.abs(climate1.tempChangeC)
      );
      expect(climate2.habitabilityLossPct).toBeGreaterThan(
        climate1.habitabilityLossPct
      );
    });
  });

  describe("withProvenance", () => {
    it("creates provenance metadata", () => {
      const prov = withProvenance(42, "km", {
        method: "model",
        confidence: "high",
        source: "Test calculation",
      });

      expect(prov.value).toBe(42);
      expect(prov.unit).toBe("km");
      expect(prov.method).toBe("model");
      expect(prov.confidence).toBe("high");
      expect(prov.source).toBe("Test calculation");
    });

    it("uses defaults for missing metadata", () => {
      const prov = withProvenance(100, "m");

      expect(prov.method).toBe("estimate");
      expect(prov.confidence).toBe("medium");
      expect(prov.source).toBeUndefined();
    });
  });

  describe("computeImpactBundle", () => {
    it("computes complete impact results", () => {
      const params = {
        massKg: 1e12,
        velocityMps: 20000,
        target: "land" as const,
        avgPopPerKm2: 500,
        shelterFactor: 0.15,
      };

      const bundle = computeImpactBundle(params);

      // Check all required fields exist
      expect(bundle.energyJ.value).toBeGreaterThan(0);
      expect(bundle.megatonsTNT.value).toBeGreaterThan(0);
      expect(bundle.craterRadiusKm.value).toBeGreaterThan(0);
      expect(bundle.casualties.value).toBeGreaterThan(0);
      expect(bundle.economicDamageUSD.value).toBeGreaterThan(0);

      // Check provenance metadata
      expect(bundle.energyJ.method).toBe("model");
      expect(bundle.energyJ.confidence).toBe("high");
      expect(bundle.casualties.method).toBe("probabilistic");
      expect(bundle.casualties.confidence).toBe("low");
    });

    it("handles water impacts with tsunami", () => {
      const params = {
        massKg: 1e12,
        velocityMps: 20000,
        target: "water" as const,
        avgPopPerKm2: 0,
        localWaterDepthM: 4000,
      };

      const bundle = computeImpactBundle(params);

      expect(bundle.tsunami.waveHeightM.value).toBeGreaterThan(0);
      expect(bundle.tsunami.travelTimeMin.value).toBeGreaterThan(0);
    });

    it("produces consistent energy calculations", () => {
      const params = {
        massKg: 1e10,
        velocityMps: 15000,
        target: "land" as const,
        avgPopPerKm2: 100,
      };

      const bundle = computeImpactBundle(params);
      const expectedEnergy = computeKineticEnergy(
        params.massKg,
        params.velocityMps
      );
      const expectedMt = energyToMegatonsTNT(expectedEnergy);

      expect(bundle.energyJ.value).toBe(expectedEnergy);
      expect(bundle.megatonsTNT.value).toBeCloseTo(expectedMt, 10);
    });
  });
});
