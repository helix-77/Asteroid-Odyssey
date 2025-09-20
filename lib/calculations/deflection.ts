// Deflection strategy calculations

export interface DeflectionStrategy {
  id: string
  name: string
  deltaV: number // m/s velocity change
  leadTime: number // years
  cost: number // USD
  successRate: number // 0-1
  massRequired: number // kg
}

export interface DeflectionResult {
  trajectoryChange: number // degrees
  impactProbabilityReduction: number // 0-1
  missionSuccess: boolean
  costEffectiveness: number // impact reduction per dollar
  timeToImplement: number // years
  riskFactors: string[]
}

// Calculate trajectory change from velocity change
export function calculateTrajectoryChange(
  deltaV: number, // m/s
  asteroidVelocity: number, // m/s
  distanceToEarth: number, // AU
  timeToImpact: number, // years
): number {
  // Convert units
  const distanceM = distanceToEarth * 1.496e11 // meters
  const timeS = timeToImpact * 365.25 * 24 * 3600 // seconds

  // Small angle approximation for trajectory change
  const angleChange = (deltaV / asteroidVelocity) * ((timeS * asteroidVelocity) / distanceM)

  // Convert to degrees
  return angleChange * (180 / Math.PI)
}

// Calculate impact probability reduction
export function calculateImpactReduction(
  trajectoryChange: number, // degrees
  originalProbability: number, // 0-1
  earthCrossSection = 6371000, // Earth radius in meters
): number {
  // Simplified model: larger trajectory changes reduce impact probability more
  const reductionFactor = Math.min(1, trajectoryChange / 0.1) // 0.1 degree change = 100% reduction
  return originalProbability * reductionFactor
}

// Assess mission success probability
export function assessMissionSuccess(
  strategy: DeflectionStrategy,
  leadTime: number, // years available
  asteroidSize: number, // meters
  asteroidMass: number, // kg
): { success: boolean; factors: string[] } {
  const factors: string[] = []
  let successProbability = strategy.successRate

  // Lead time factor
  if (leadTime < strategy.leadTime) {
    successProbability *= 0.5
    factors.push("Insufficient lead time")
  }

  // Asteroid size factor
  if (asteroidSize > 200) {
    successProbability *= 0.8
    factors.push("Large asteroid size")
  }

  // Mass requirement factor
  const requiredDeltaV = (strategy.deltaV * asteroidMass) / strategy.massRequired
  if (requiredDeltaV > strategy.deltaV * 2) {
    successProbability *= 0.7
    factors.push("Insufficient spacecraft mass")
  }

  // Technology readiness (simplified)
  if (strategy.id === "ion_beam" || strategy.id === "solar_sail") {
    successProbability *= 0.9
    factors.push("Unproven technology")
  }

  return {
    success: successProbability > 0.7,
    factors,
  }
}

// Calculate cost effectiveness
export function calculateCostEffectiveness(
  impactReduction: number, // 0-1
  cost: number, // USD
  economicImpactPrevented: number, // USD
): number {
  if (cost === 0) return Number.POSITIVE_INFINITY
  return (impactReduction * economicImpactPrevented) / cost
}

// Main deflection calculation
export function calculateDeflection(
  strategy: DeflectionStrategy,
  asteroid: {
    mass: number // kg
    velocity: number // m/s
    size: number // meters
    distanceToEarth: number // AU
    impactProbability: number // 0-1
  },
  timeToImpact: number, // years
  economicImpactAtRisk = 1e12, // USD
): DeflectionResult {
  // Calculate trajectory change
  const trajectoryChange = calculateTrajectoryChange(
    strategy.deltaV,
    asteroid.velocity,
    asteroid.distanceToEarth,
    timeToImpact,
  )

  // Calculate impact probability reduction
  const impactProbabilityReduction = calculateImpactReduction(trajectoryChange, asteroid.impactProbability)

  // Assess mission success
  const missionAssessment = assessMissionSuccess(strategy, timeToImpact, asteroid.size, asteroid.mass)

  // Calculate cost effectiveness
  const costEffectiveness = calculateCostEffectiveness(impactProbabilityReduction, strategy.cost, economicImpactAtRisk)

  return {
    trajectoryChange,
    impactProbabilityReduction,
    missionSuccess: missionAssessment.success,
    costEffectiveness,
    timeToImplement: strategy.leadTime,
    riskFactors: missionAssessment.factors,
  }
}

// Compare multiple deflection strategies
export function compareStrategies(
  strategies: DeflectionStrategy[],
  asteroid: Parameters<typeof calculateDeflection>[1],
  timeToImpact: number,
  economicImpactAtRisk?: number,
): Array<DeflectionResult & { strategy: DeflectionStrategy }> {
  return strategies
    .map((strategy) => ({
      strategy,
      ...calculateDeflection(strategy, asteroid, timeToImpact, economicImpactAtRisk),
    }))
    .sort((a, b) => b.costEffectiveness - a.costEffectiveness) // Sort by cost effectiveness
}

// Calculate optimal launch window
export function calculateLaunchWindow(
  strategy: DeflectionStrategy,
  timeToImpact: number, // years
): { earliestLaunch: Date; latestLaunch: Date; optimal: Date } {
  const now = new Date()
  const impactDate = new Date(now.getTime() + timeToImpact * 365.25 * 24 * 60 * 60 * 1000)

  // Calculate launch windows
  const leadTimeMs = strategy.leadTime * 365.25 * 24 * 60 * 60 * 1000
  const earliestLaunch = new Date(impactDate.getTime() - leadTimeMs * 1.5) // 150% of lead time
  const latestLaunch = new Date(impactDate.getTime() - leadTimeMs * 0.8) // 80% of lead time
  const optimal = new Date(impactDate.getTime() - leadTimeMs) // Exactly lead time

  return { earliestLaunch, latestLaunch, optimal }
}
