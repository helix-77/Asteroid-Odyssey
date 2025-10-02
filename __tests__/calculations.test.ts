import { describe, it, expect } from 'vitest'
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
} from '@/lib/calculations'

describe('calculations', () => {
  it('computes kinetic energy and Mt TNT correctly', () => {
    const m = 1e9 // kg
    const v = 20_000 // m/s
    const E = computeKineticEnergy(m, v)
    expect(E).toBeCloseTo(0.5 * m * v * v, 5)
    const mt = energyToMegatonsTNT(E)
    expect(mt).toBeGreaterThan(40)
    expect(mt).toBeLessThan(60)
  })

  it('blast radii scale reasonably with yield', () => {
    const E1 = 4.184e15 // 1 Mt
    const E8 = 8 * 4.184e15 // 8 Mt
    const r1 = estimateBlastRadiiKm(E1)
    const r8 = estimateBlastRadiiKm(E8)
    expect(r8.overpressure5psi).toBeGreaterThan(r1.overpressure5psi)
  })

  it('crater radius > 0 and depends on target', () => {
    const E = 10 * 4.184e15
    const land = estimateCraterRadiusKm(E, 'land')
    const water = estimateCraterRadiusKm(E, 'water')
    expect(land).toBeGreaterThan(0)
    expect(water).toBeLessThan(land)
  })

  it('casualties increase with density', () => {
    const E = 10 * 4.184e15
    const blast = estimateBlastRadiiKm(E)
    const low = estimateCasualties(10, blast, 0.1)
    const high = estimateCasualties(1000, blast, 0.1)
    expect(high).toBeGreaterThan(low)
  })

  it('economic damage increases with casualties', () => {
    const E = 4.184e15
    const blast = estimateBlastRadiiKm(E)
    const d1 = estimateEconomicDamageUSD(1e3, blast, 1)
    const d2 = estimateEconomicDamageUSD(1e5, blast, 1)
    expect(d2).toBeGreaterThan(d1)
  })

  it('tsunami only when water impact', () => {
    const E = 50 * 4.184e15
    const t1 = estimateTsunami(false, E)
    const t2 = estimateTsunami(true, E)
    expect(t1.waveHeightM).toBe(0)
    expect(t2.waveHeightM).toBeGreaterThan(0)
  })

  it('climate impact returns plausible signs', () => {
    const E = 100 * 4.184e15
    const c = estimateClimateImpact(E, 1e9, 0.2)
    expect(c.tempChangeC).toBeLessThan(0) // cooling
    expect(c.habitabilityLossPct).toBeGreaterThanOrEqual(0)
  })

  it('impact bundle aggregates provenance', () => {
    const bundle = computeImpactBundle({
      massKg: 1e10,
      velocityMps: 15_000,
      target: 'land',
      avgPopPerKm2: 300,
    })
    expect(bundle.energyJ.value).toBeGreaterThan(0)
    expect(bundle.blastRadiiKm.overpressure5psi.value).toBeGreaterThan(0)
    expect(bundle.casualties.value).toBeGreaterThanOrEqual(0)
  })
})
