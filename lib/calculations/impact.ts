// Impact physics calculations

export interface ImpactParameters {
  asteroidMass: number // kg
  velocity: number // m/s
  angle: number // degrees from horizontal
  density: number // kg/m³
  diameter: number // meters
}

export interface ImpactResults {
  kineticEnergy: number // Joules
  tntEquivalent: number // kilotons
  crater: {
    diameter: number // meters
    depth: number // meters
    volume: number // cubic meters
  }
  effects: {
    fireballRadius: number // km
    airblastRadius: number // km
    thermalRadiation: number // km
    seismicMagnitude: number
  }
  casualties: {
    immediate: number
    injured: number
    displaced: number
  }
  economicImpact: number // USD
}

// Standard asteroid densities by composition
export const ASTEROID_DENSITIES = {
  stony: 2700, // kg/m³
  metallic: 7800,
  carbonaceous: 1400,
  "stony-iron": 5300,
  basaltic: 2900,
}

// Calculate kinetic energy of impact
export function calculateKineticEnergy(mass: number, velocity: number): number {
  return 0.5 * mass * velocity * velocity
}

// Convert energy to TNT equivalent
export function energyToTNT(energy: number): number {
  const TNT_ENERGY = 4.184e9 // Joules per kiloton of TNT
  return energy / TNT_ENERGY
}

// Calculate crater dimensions using scaling laws
export function calculateCrater(
  energy: number,
  angle: number,
  targetDensity = 2700,
): { diameter: number; depth: number; volume: number } {
  // Holsapple & Housen scaling laws
  const gravity = 9.81 // m/s²
  const K1 = 1.88 // Scaling constant for diameter
  const K2 = 0.13 // Scaling constant for depth

  // Angle correction factor
  const angleRad = (angle * Math.PI) / 180
  const angleFactor = Math.pow(Math.sin(angleRad), 1 / 3)

  // Crater diameter
  const diameter = K1 * Math.pow(energy / (targetDensity * gravity), 0.22) * angleFactor

  // Crater depth (typically 1/5 to 1/10 of diameter)
  const depth = diameter * K2

  // Crater volume (simplified as cone)
  const volume = (Math.PI / 3) * Math.pow(diameter / 2, 2) * depth

  return { diameter, depth, volume }
}

// Calculate blast effects
export function calculateBlastEffects(energy: number): {
  fireballRadius: number
  airblastRadius: number
  thermalRadiation: number
  seismicMagnitude: number
} {
  const tntEquivalent = energyToTNT(energy)

  // Fireball radius (km) - empirical formula
  const fireballRadius = (0.28 * Math.pow(tntEquivalent, 0.4)) / 1000

  // Airblast radius for 1 psi overpressure (km)
  const airblastRadius = (2.2 * Math.pow(tntEquivalent, 0.33)) / 1000

  // Thermal radiation radius for 1st degree burns (km)
  const thermalRadiation = (1.9 * Math.pow(tntEquivalent, 0.41)) / 1000

  // Seismic magnitude (Richter scale)
  const seismicMagnitude = 0.67 * Math.log10(energy) - 5.87

  return {
    fireballRadius,
    airblastRadius,
    thermalRadiation,
    seismicMagnitude: Math.max(0, seismicMagnitude),
  }
}

// Estimate casualties based on population density and blast effects
export function estimateCasualties(
  effects: ReturnType<typeof calculateBlastEffects>,
  populationDensity: number, // people per km²
  totalPopulation: number,
): { immediate: number; injured: number; displaced: number } {
  const { fireballRadius, airblastRadius, thermalRadiation } = effects

  // Areas of effect
  const fireballArea = Math.PI * fireballRadius * fireballRadius
  const airblastArea = Math.PI * airblastRadius * airblastRadius
  const thermalArea = Math.PI * thermalRadiation * thermalRadiation

  // Population in each zone
  const fireballPop = Math.min(fireballArea * populationDensity, totalPopulation)
  const airblastPop = Math.min(airblastArea * populationDensity, totalPopulation) - fireballPop
  const thermalPop = Math.min(thermalArea * populationDensity, totalPopulation) - fireballPop - airblastPop

  // Casualty rates by zone
  const immediate = Math.floor(
    fireballPop * 0.95 + // 95% fatality in fireball
      airblastPop * 0.15 + // 15% fatality in airblast
      thermalPop * 0.05, // 5% fatality in thermal zone
  )

  const injured = Math.floor(
    fireballPop * 0.05 + // 5% injured in fireball (survivors)
      airblastPop * 0.6 + // 60% injured in airblast
      thermalPop * 0.3, // 30% injured in thermal zone
  )

  const displaced = Math.floor(
    (fireballPop + airblastPop + thermalPop) * 1.5, // 150% of affected population displaced
  )

  return { immediate, injured, displaced }
}

// Calculate economic impact
export function calculateEconomicImpact(
  crater: ReturnType<typeof calculateCrater>,
  effects: ReturnType<typeof calculateBlastEffects>,
  gdpPerCapita = 65000, // USD
  infrastructureValue = 1e12, // USD
): number {
  const { airblastRadius } = effects
  const affectedArea = Math.PI * airblastRadius * airblastRadius // km²

  // Economic damage factors
  const directDamage = infrastructureValue * 0.3 // 30% of infrastructure value
  const indirectDamage = directDamage * 0.5 // 50% additional indirect costs
  const businessInterruption = gdpPerCapita * affectedArea * 1000 * 0.1 // 10% of annual GDP for affected area

  return directDamage + indirectDamage + businessInterruption
}

// Main impact calculation function
export function calculateImpact(
  params: ImpactParameters,
  location: {
    populationDensity: number
    totalPopulation: number
    gdpPerCapita?: number
    infrastructureValue?: number
  },
): ImpactResults {
  const { asteroidMass, velocity, angle } = params
  const { populationDensity, totalPopulation, gdpPerCapita = 65000, infrastructureValue = 1e12 } = location

  // Calculate energy
  const kineticEnergy = calculateKineticEnergy(asteroidMass, velocity)
  const tntEquivalent = energyToTNT(kineticEnergy)

  // Calculate crater
  const crater = calculateCrater(kineticEnergy, angle)

  // Calculate effects
  const effects = calculateBlastEffects(kineticEnergy)

  // Calculate casualties
  const casualties = estimateCasualties(effects, populationDensity, totalPopulation)

  // Calculate economic impact
  const economicImpact = calculateEconomicImpact(crater, effects, gdpPerCapita, infrastructureValue)

  return {
    kineticEnergy,
    tntEquivalent,
    crater: {
      diameter: crater.diameter,
      depth: crater.depth,
      volume: crater.volume,
    },
    effects: {
      fireballRadius: effects.fireballRadius,
      airblastRadius: effects.airblastRadius,
      thermalRadiation: effects.thermalRadiation,
      seismicMagnitude: effects.seismicMagnitude,
    },
    casualties,
    economicImpact,
  }
}
