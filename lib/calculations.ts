/**
 * Modular, testable calculation utilities for the Impact Simulator.
 * 
 * All physics are simplified but grounded in published approximations where possible.
 * Each UI-facing metric should also be tagged with provenance metadata for transparency.
 * 
 * References (inline):
 * - Kinetic energy: KE = 1/2 m v^2
 * - Blast scaling (nuclear-like scaling): radius ∝ yield^(1/3)
 * - Crater scaling (very simplified from Holsapple-Housen): R ≈ k * (E)^(1/3)
 * - Seismic estimate: M ≈ (2/3) * log10(E[J]) − 2.9
 * - Climate impact: order-of-magnitude estimate using soot/ejecta fractions (probabilistic)
 */

export type Provenance = {
  value: number
  unit: string
  method: 'model' | 'estimate' | 'probabilistic'
  confidence: 'low' | 'medium' | 'high'
  source?: string
}

export type BlastRadiiKm = {
  overpressure20psi: number
  overpressure10psi: number
  overpressure5psi: number
  overpressure1psi: number
}

export type TsunamiEstimate = {
  waveHeightM: number
  travelTimeMin: number
}

export type ClimateImpact = {
  tempChangeC: number
  habitabilityLossPct: number
  co2IncreasePpm: number
}

export type TargetType = 'land' | 'water' | 'ice'

/**
 * Compute kinetic energy in Joules.
 * KE = 0.5 * m * v^2
 */
export function computeKineticEnergy(massKg: number, velocityMps: number): number {
  return 0.5 * massKg * velocityMps * velocityMps
}

/**
 * Derive an approximate TNT equivalence (Megatons of TNT) from energy in Joules.
 * 1 megaton TNT ≈ 4.184e15 J
 */
export function energyToMegatonsTNT(energyJ: number): number {
  return energyJ / 4.184e15
}

/**
 * Estimate blast radii for several overpressure thresholds using nuclear-like scaling laws.
 * Very rough approximation: r ∝ (yield)^(1/3)
 * Calibrated so that for 1 Mt: ~20 psi ≈ 2.7 km, 10 psi ≈ 4.7 km, 5 psi ≈ 7.0 km, 1 psi ≈ 20.0 km
 *
 * Returns radii in kilometers.
 */
export function estimateBlastRadiiKm(energyJ: number): BlastRadiiKm {
  const mt = energyToMegatonsTNT(energyJ)
  const c = Math.cbrt(Math.max(mt, 1e-9)) // avoid 0
  return {
    overpressure20psi: 2.7 * c,
    overpressure10psi: 4.7 * c,
    overpressure5psi: 7.0 * c,
    overpressure1psi: 20.0 * c,
  }
}

/**
 * Estimate transient crater radius (km) from impact energy with a coarse scaling law.
 * We use: R_km ≈ 0.6 * (E / 4.184e15)^(1/3) with target modifiers.
 * Notes:
 * - This is a simplified empirical approximation. Real models depend on gravity, angle, density, etc.
 */
export function estimateCraterRadiusKm(energyJ: number, targetType: TargetType): number {
  const mt = energyToMegatonsTNT(energyJ)
  const base = 0.6 * Math.cbrt(Math.max(mt, 0)) // km at 1 Mt ~0.6 km radius (1.2 km diameter)
  const modifier = targetType === 'water' ? 0.6 : targetType === 'ice' ? 0.8 : 1.0
  return base * modifier
}

/**
 * Estimate casualties given a population density (persons/km^2) layer average over blast zones.
 * Simplified approach: casualties ≈ Σ(area_zone × density_zone × fatality_rate_zone) × (1 − shelterFactor)
 * where areas are based on overpressure radii.
 */
export function estimateCasualties(
  avgPopPerKm2: number,
  blastRadiiKm: BlastRadiiKm,
  shelterFactor: number = 0.15,
): number {
  const area = (r: number) => Math.PI * r * r
  // Zone areas (outer ring areas):
  const a20 = area(blastRadiiKm.overpressure20psi)
  const a10 = area(blastRadiiKm.overpressure10psi) - a20
  const a5 = area(blastRadiiKm.overpressure5psi) - a20 - a10
  const a1 = area(blastRadiiKm.overpressure1psi) - a20 - a10 - a5

  // Fatality rates per zone (approx from nuclear effects literature):
  const f20 = 0.90
  const f10 = 0.50
  const f5 = 0.15
  const f1 = 0.02

  const casualties = avgPopPerKm2 * (
    a20 * f20 + a10 * f10 + a5 * f5 + a1 * f1
  ) * (1 - Math.min(Math.max(shelterFactor, 0), 0.95))

  // Cap to avoid absurdities
  return Math.max(0, Math.min(casualties, 8e9))
}

/**
 * Estimate economic damage (USD) as a function of casualties and area destroyed.
 * - Value of statistical life (VSL) ~ $5M–$10M. Use $7.5M midpoint.
 * - Infrastructure: ~$10B per 1,000 km^2 destroyed at >= 5 psi.
 */
export function estimateEconomicDamageUSD(
  casualties: number,
  blastRadiiKm: BlastRadiiKm,
  lostProductionFactor: number = 1.0,
): number {
  const a5 = Math.PI * blastRadiiKm.overpressure5psi * blastRadiiKm.overpressure5psi // km^2
  const vsl = 7.5e6 * casualties
  const infra = (a5 / 1000) * 1.0e10
  return (vsl + infra) * Math.max(lostProductionFactor, 0)
}

/**
 * Estimate tsunami characteristics for water impacts.
 * - Wave height scales weakly with energy: H ~ k * (Mt)^(1/4)
 * - Travel time is highly variable; approximate by 1,500 km @ 750 km/h (~120 min) scaled.
 */
export function estimateTsunami(
  isWaterImpact: boolean,
  energyJ: number,
  localWaterDepthM: number = 4000,
): TsunamiEstimate {
  if (!isWaterImpact) return { waveHeightM: 0, travelTimeMin: 0 }
  const mt = energyToMegatonsTNT(energyJ)
  const waveHeightM = 5 * Math.pow(Math.max(mt, 1e-6), 0.25) * (1 + Math.min(localWaterDepthM, 6000) / 6000)
  const travelTimeMin = 120 * Math.pow(Math.max(mt, 1e-6), 0.15)
  return { waveHeightM, travelTimeMin }
}

/**
 * Estimate climate impact signal using a simple power-law vs yield and soot/ejecta fractions.
 * Highly uncertain: treat as probabilistic.
 */
export function estimateClimateImpact(
  energyJ: number,
  ejectaMassTons: number = 0,
  sootFraction: number = 0.0,
): ClimateImpact {
  const mt = energyToMegatonsTNT(energyJ)
  const scale = Math.pow(Math.max(mt, 1e-9), 0.3)
  const sootAdj = 1 + 3 * Math.min(Math.max(sootFraction, 0), 0.5)

  const tempChangeC = -0.2 * scale * sootAdj // cooling
  const habitabilityLossPct = Math.min(60, 5 * scale * sootAdj)
  const co2IncreasePpm = Math.max(0, 0.1 * (ejectaMassTons / 1e9)) // tiny unless very large
  
  return {
    tempChangeC,
    habitabilityLossPct,
    co2IncreasePpm,
  }
}

/**
 * Convenience wrappers to tag values with provenance meta for UI tooltips.
 */
export function withProvenance(value: number, unit: string, meta?: Partial<Provenance>): Provenance {
  return {
    value,
    unit,
    method: meta?.method ?? 'estimate',
    confidence: meta?.confidence ?? 'medium',
    source: meta?.source,
  }
}

/**
 * Compute a compact set of impact outputs for UI consumption.
 */
export function computeImpactBundle(params: {
  massKg: number
  velocityMps: number
  target: TargetType
  avgPopPerKm2: number
  shelterFactor?: number
  localWaterDepthM?: number
  ejectaMassTons?: number
  sootFraction?: number
}) {
  const energyJ = computeKineticEnergy(params.massKg, params.velocityMps)
  const blast = estimateBlastRadiiKm(energyJ)
  const craterR = estimateCraterRadiusKm(energyJ, params.target)
  const casualties = estimateCasualties(params.avgPopPerKm2, blast, params.shelterFactor)
  const econ = estimateEconomicDamageUSD(casualties, blast, 1)
  const tsunami = estimateTsunami(params.target === 'water', energyJ, params.localWaterDepthM)
  const climate = estimateClimateImpact(energyJ, params.ejectaMassTons, params.sootFraction)

  return {
    energyJ: withProvenance(energyJ, 'J', { method: 'model', confidence: 'high', source: 'KE = 1/2 m v^2' }),
    megatonsTNT: withProvenance(energyToMegatonsTNT(energyJ), 'Mt TNT', { method: 'estimate', confidence: 'medium', source: '1 Mt ≈ 4.184e15 J' }),
    blastRadiiKm: {
      overpressure20psi: withProvenance(blast.overpressure20psi, 'km', { method: 'estimate', confidence: 'medium', source: 'Nuclear-like scaling r ∝ yield^(1/3)'}),
      overpressure10psi: withProvenance(blast.overpressure10psi, 'km', { method: 'estimate', confidence: 'medium' }),
      overpressure5psi: withProvenance(blast.overpressure5psi, 'km', { method: 'estimate', confidence: 'medium' }),
      overpressure1psi: withProvenance(blast.overpressure1psi, 'km', { method: 'estimate', confidence: 'medium' }),
    },
    craterRadiusKm: withProvenance(craterR, 'km', { method: 'estimate', confidence: 'medium', source: 'Holsapple-Housen inspired scaling.' }),
    casualties: withProvenance(casualties, 'persons', { method: 'probabilistic', confidence: 'low', source: 'Zonal fatality rates × pop density'}),
    economicDamageUSD: withProvenance(econ, 'USD', { method: 'probabilistic', confidence: 'low' }),
    tsunami: {
      waveHeightM: withProvenance(tsunami.waveHeightM, 'm', { method: 'estimate', confidence: 'low' }),
      travelTimeMin: withProvenance(tsunami.travelTimeMin, 'min', { method: 'estimate', confidence: 'low' }),
    },
    climate: {
      tempChangeC: withProvenance(climate.tempChangeC, '°C', { method: 'probabilistic', confidence: 'low' }),
      habitabilityLossPct: withProvenance(climate.habitabilityLossPct, '%', { method: 'probabilistic', confidence: 'low' }),
      co2IncreasePpm: withProvenance(climate.co2IncreasePpm, 'ppm', { method: 'probabilistic', confidence: 'low' }),
    },
  }
}
