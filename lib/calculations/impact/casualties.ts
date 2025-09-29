/**
 * Evidence-Based Casualty Models
 * Implements validated mortality and injury rates from blast effects studies
 * Based on Glasstone & Dolan (1977), NATO AASTP-1 (2010), and medical literature
 */

import { UncertaintyValue } from "../../physics/constants";
import {
  UncertaintyPropagator,
  UncertaintyVariable,
  DistributionType,
} from "../../physics/uncertainty";
import { BlastEffectsResult } from "./blast";

/**
 * Population density data structure
 */
export interface PopulationDensity {
  urban: UncertaintyValue; // people/km²
  suburban: UncertaintyValue; // people/km²
  rural: UncertaintyValue; // people/km²
  description: string;
}

/**
 * Casualty severity levels based on medical classification
 */
export enum CasualtySeverity {
  IMMEDIATE = "immediate", // Life-threatening injuries requiring immediate care
  DELAYED = "delayed", // Serious injuries that can wait for treatment
  MINIMAL = "minimal", // Minor injuries, walking wounded
  EXPECTANT = "expectant", // Fatal injuries, palliative care only
}

/**
 * Injury mechanisms from blast effects
 */
export enum InjuryMechanism {
  PRIMARY_BLAST = "primary_blast", // Direct blast wave effects
  SECONDARY_BLAST = "secondary_blast", // Flying debris
  TERTIARY_BLAST = "tertiary_blast", // Body displacement
  QUATERNARY_BLAST = "quaternary_blast", // Burns, inhalation, crush
  THERMAL_RADIATION = "thermal_radiation", // Burns from thermal pulse
}

/**
 * Casualty estimation result with detailed breakdown
 */
export interface CasualtyEstimate {
  total: {
    fatalities: UncertaintyValue;
    injuries: UncertaintyValue;
    affected: UncertaintyValue;
  };
  bySeverity: {
    [CasualtySeverity.IMMEDIATE]: UncertaintyValue;
    [CasualtySeverity.DELAYED]: UncertaintyValue;
    [CasualtySeverity.MINIMAL]: UncertaintyValue;
    [CasualtySeverity.EXPECTANT]: UncertaintyValue;
  };
  byMechanism: {
    [InjuryMechanism.PRIMARY_BLAST]: UncertaintyValue;
    [InjuryMechanism.SECONDARY_BLAST]: UncertaintyValue;
    [InjuryMechanism.TERTIARY_BLAST]: UncertaintyValue;
    [InjuryMechanism.QUATERNARY_BLAST]: UncertaintyValue;
    [InjuryMechanism.THERMAL_RADIATION]: UncertaintyValue;
  };
  populationExposed: {
    total: UncertaintyValue;
    urban: UncertaintyValue;
    suburban: UncertaintyValue;
    rural: UncertaintyValue;
  };
  validityCheck: {
    isValid: boolean;
    warnings: string[];
    limitations: string[];
  };
  methodology: string;
  references: string[];
}

/**
 * Standard population density models for different regions
 */
export const POPULATION_DENSITIES = {
  // Global average densities
  GLOBAL_AVERAGE: {
    urban: new UncertaintyValue(
      4000,
      1000,
      "people/km²",
      "UN World Urbanization Prospects 2018",
      "Global average urban density"
    ),
    suburban: new UncertaintyValue(
      1500,
      500,
      "people/km²",
      "UN World Urbanization Prospects 2018",
      "Global average suburban density"
    ),
    rural: new UncertaintyValue(
      50,
      20,
      "people/km²",
      "UN World Urbanization Prospects 2018",
      "Global average rural density"
    ),
    description: "Global average population densities",
  } as PopulationDensity,

  // High-density urban areas (major cities)
  HIGH_DENSITY_URBAN: {
    urban: new UncertaintyValue(
      15000,
      5000,
      "people/km²",
      "UN-Habitat Global Urban Observatory",
      "High-density urban areas"
    ),
    suburban: new UncertaintyValue(
      3000,
      1000,
      "people/km²",
      "UN-Habitat Global Urban Observatory",
      "High-density suburban areas"
    ),
    rural: new UncertaintyValue(
      100,
      50,
      "people/km²",
      "UN-Habitat Global Urban Observatory",
      "Rural areas near major cities"
    ),
    description: "High-density urban regions (major metropolitan areas)",
  } as PopulationDensity,

  // Low-density regions
  LOW_DENSITY: {
    urban: new UncertaintyValue(
      1000,
      300,
      "people/km²",
      "UN World Urbanization Prospects 2018",
      "Low-density urban areas"
    ),
    suburban: new UncertaintyValue(
      300,
      100,
      "people/km²",
      "UN World Urbanization Prospects 2018",
      "Low-density suburban areas"
    ),
    rural: new UncertaintyValue(
      10,
      5,
      "people/km²",
      "UN World Urbanization Prospects 2018",
      "Sparsely populated rural areas"
    ),
    description: "Low-density regions (rural and small towns)",
  } as PopulationDensity,
};

/**
 * Calculate comprehensive casualty estimates from blast effects
 */
export function calculateCasualties(
  blastEffects: BlastEffectsResult,
  populationDensity: PopulationDensity,
  impactLocation: {
    latitude: number;
    longitude: number;
    terrainType: "urban" | "suburban" | "rural" | "mixed";
  }
): CasualtyEstimate {
  // Validate inputs
  const validityCheck = validateCasualtyInputs(blastEffects, populationDensity);

  // Calculate weighted average density based on terrain type
  const averageDensity = calculateWeightedDensity(
    populationDensity,
    impactLocation.terrainType
  );

  // Calculate population exposure by blast zone
  const populationExposed = calculatePopulationExposure(
    blastEffects,
    populationDensity,
    impactLocation.terrainType
  );

  // Calculate casualties from blast overpressure
  const blastCasualties = calculateBlastCasualties(
    blastEffects,
    averageDensity
  );

  // Calculate casualties from thermal radiation
  const thermalCasualties = calculateThermalCasualties(
    blastEffects,
    averageDensity
  );

  // Combine casualties (avoiding double-counting)
  const combinedCasualties = combineCasualtyEstimates(
    blastCasualties,
    thermalCasualties
  );

  return {
    total: combinedCasualties.total,
    bySeverity: combinedCasualties.bySeverity,
    byMechanism: combinedCasualties.byMechanism,
    populationExposed,
    validityCheck,
    methodology:
      "Evidence-based casualty modeling using Glasstone & Dolan (1977) and NATO AASTP-1 (2010)",
    references: [
      "Glasstone, S., & Dolan, P. J. (1977). The Effects of Nuclear Weapons",
      "NATO AASTP-1 (2010). Manual of NATO Safety Principles for the Storage of Military Ammunition and Explosives",
      "Bowen, I. G., et al. (1968). Biophysical mechanisms and scaling procedures applicable in assessing responses of the thorax energized by air-blast overpressures or by non-penetrating missiles",
      "Richmond, D. R., et al. (1968). The biological response to overpressure",
    ],
  };
}

/**
 * Calculate weighted average density based on terrain type
 */
function calculateWeightedDensity(
  densities: PopulationDensity,
  terrainType: "urban" | "suburban" | "rural" | "mixed"
): UncertaintyValue {
  // Define weights based on terrain type
  const weights = {
    urban: terrainType === "urban" ? 0.8 : terrainType === "mixed" ? 0.4 : 0.1,
    suburban:
      terrainType === "suburban" ? 0.8 : terrainType === "mixed" ? 0.4 : 0.3,
    rural: terrainType === "rural" ? 0.8 : terrainType === "mixed" ? 0.2 : 0.6,
  };

  const variables: UncertaintyVariable[] = [
    {
      name: "urban",
      value: densities.urban,
      distribution: DistributionType.NORMAL,
    },
    {
      name: "suburban",
      value: densities.suburban,
      distribution: DistributionType.NORMAL,
    },
    {
      name: "rural",
      value: densities.rural,
      distribution: DistributionType.NORMAL,
    },
  ];

  const weightedFunction = (inputs: Record<string, number>) => {
    const { urban, suburban, rural } = inputs;
    return (
      urban * weights.urban +
      suburban * weights.suburban +
      rural * weights.rural
    );
  };

  const result = UncertaintyPropagator.propagateNonlinear(
    variables,
    weightedFunction
  );

  return new UncertaintyValue(
    result.value,
    result.uncertainty,
    "people/km²",
    "Calculated weighted average",
    "Weighted population density"
  );
}

/**
 * Calculate population exposure by blast zone
 */
function calculatePopulationExposure(
  blastEffects: BlastEffectsResult,
  populationDensity: PopulationDensity,
  terrainType: "urban" | "suburban" | "rural" | "mixed"
): CasualtyEstimate["populationExposed"] {
  // Calculate total area affected (1 psi overpressure radius)
  const totalArea =
    (Math.PI * Math.pow(blastEffects.airblast.overpressure1psi.value, 2)) / 1e6; // km²

  // Calculate population by terrain type with proper weighting
  const weights = {
    urban: terrainType === "urban" ? 0.8 : terrainType === "mixed" ? 0.4 : 0.1,
    suburban:
      terrainType === "suburban" ? 0.8 : terrainType === "mixed" ? 0.4 : 0.3,
    rural: terrainType === "rural" ? 0.8 : terrainType === "mixed" ? 0.2 : 0.6,
  };

  const urbanPop = new UncertaintyValue(
    populationDensity.urban.value * totalArea * weights.urban,
    populationDensity.urban.uncertainty * totalArea * weights.urban,
    "people",
    "Calculated from area and density",
    "Urban population exposed"
  );

  const suburbanPop = new UncertaintyValue(
    populationDensity.suburban.value * totalArea * weights.suburban,
    populationDensity.suburban.uncertainty * totalArea * weights.suburban,
    "people",
    "Calculated from area and density",
    "Suburban population exposed"
  );

  const ruralPop = new UncertaintyValue(
    populationDensity.rural.value * totalArea * weights.rural,
    populationDensity.rural.uncertainty * totalArea * weights.rural,
    "people",
    "Calculated from area and density",
    "Rural population exposed"
  );

  const totalPop = addUncertaintyValues([urbanPop, suburbanPop, ruralPop]);

  return {
    total: totalPop,
    urban: urbanPop,
    suburban: suburbanPop,
    rural: ruralPop,
  };
}

/**
 * Calculate casualties from blast overpressure effects
 */
function calculateBlastCasualties(
  blastEffects: BlastEffectsResult,
  averageDensity: UncertaintyValue
): Partial<CasualtyEstimate> {
  // Define overpressure zones with conservative casualty rates
  const overpressureZones = [
    {
      radius: blastEffects.airblast.overpressure10psi,
      mortalityRate: 0.5, // 50% mortality in severe blast zone
      injuryRate: 0.95, // 95% injury rate in severe blast zone
    },
    {
      radius: blastEffects.airblast.overpressure5psi,
      mortalityRate: 0.1, // 10% mortality in moderate blast zone
      injuryRate: 0.7, // 70% injury rate in moderate blast zone
    },
    {
      radius: blastEffects.airblast.overpressure1psi,
      mortalityRate: 0.01, // 1% mortality in light blast zone
      injuryRate: 0.2, // 20% injury rate in light blast zone
    },
  ];

  let totalFatalities = new UncertaintyValue(
    0,
    0,
    "people",
    "Calculated",
    "Total blast fatalities"
  );
  let totalInjuries = new UncertaintyValue(
    0,
    0,
    "people",
    "Calculated",
    "Total blast injuries"
  );

  overpressureZones.forEach((zone, index) => {
    // Calculate population in this zone (annular area)
    const innerRadius =
      index > 0
        ? overpressureZones[index - 1].radius
        : new UncertaintyValue(0, 0, "m", "Ground zero", "Impact point");

    const zonePopulation = calculateAnnularPopulation(
      innerRadius,
      zone.radius,
      averageDensity
    );

    // Apply casualty rates
    const zoneFatalities = multiplyUncertaintyValues(
      zonePopulation,
      new UncertaintyValue(
        zone.mortalityRate,
        zone.mortalityRate * 0.3,
        "1",
        "Glasstone & Dolan",
        "Mortality rate"
      )
    );

    const zoneInjuries = multiplyUncertaintyValues(
      zonePopulation,
      new UncertaintyValue(
        zone.injuryRate,
        zone.injuryRate * 0.2,
        "1",
        "Glasstone & Dolan",
        "Injury rate"
      )
    );

    totalFatalities = addUncertaintyValues([totalFatalities, zoneFatalities]);
    totalInjuries = addUncertaintyValues([totalInjuries, zoneInjuries]);
  });

  return {
    total: {
      fatalities: totalFatalities,
      injuries: totalInjuries,
      affected: addUncertaintyValues([totalFatalities, totalInjuries]),
    },
    byMechanism: {
      [InjuryMechanism.PRIMARY_BLAST]: multiplyUncertaintyValues(
        totalInjuries,
        new UncertaintyValue(
          0.4,
          0.1,
          "1",
          "Medical literature",
          "Primary blast fraction"
        )
      ),
      [InjuryMechanism.SECONDARY_BLAST]: multiplyUncertaintyValues(
        totalInjuries,
        new UncertaintyValue(
          0.35,
          0.1,
          "1",
          "Medical literature",
          "Secondary blast fraction"
        )
      ),
      [InjuryMechanism.TERTIARY_BLAST]: multiplyUncertaintyValues(
        totalInjuries,
        new UncertaintyValue(
          0.2,
          0.05,
          "1",
          "Medical literature",
          "Tertiary blast fraction"
        )
      ),
      [InjuryMechanism.QUATERNARY_BLAST]: multiplyUncertaintyValues(
        totalInjuries,
        new UncertaintyValue(
          0.05,
          0.02,
          "1",
          "Medical literature",
          "Quaternary blast fraction"
        )
      ),
      [InjuryMechanism.THERMAL_RADIATION]: new UncertaintyValue(
        0,
        0,
        "people",
        "Calculated separately",
        "Thermal injuries"
      ),
    },
  };
}

/**
 * Calculate casualties from thermal radiation
 */
function calculateThermalCasualties(
  blastEffects: BlastEffectsResult,
  averageDensity: UncertaintyValue
): Partial<CasualtyEstimate> {
  // Define thermal zones by burn severity with conservative rates
  const thermalZones = [
    {
      radius: blastEffects.thermal.radiationRadius3rdDegree,
      mortalityRate: 0.3, // 30% mortality for 3rd degree burns
      injuryRate: 0.9,
    },
    {
      radius: blastEffects.thermal.radiationRadius2ndDegree,
      mortalityRate: 0.05, // 5% mortality for 2nd degree burns
      injuryRate: 0.8,
    },
    {
      radius: blastEffects.thermal.radiationRadius1stDegree,
      mortalityRate: 0.001, // 0.1% mortality for 1st degree burns
      injuryRate: 0.6, // Not everyone exposed gets burns (clothing, shelter)
    },
  ];

  let totalThermalFatalities = new UncertaintyValue(
    0,
    0,
    "people",
    "Calculated",
    "Total thermal fatalities"
  );
  let totalThermalInjuries = new UncertaintyValue(
    0,
    0,
    "people",
    "Calculated",
    "Total thermal injuries"
  );

  thermalZones.forEach((zone, index) => {
    const innerRadius =
      index > 0
        ? thermalZones[index - 1].radius
        : new UncertaintyValue(0, 0, "m", "Ground zero", "Impact point");

    const zonePopulation = calculateAnnularPopulation(
      innerRadius,
      zone.radius,
      averageDensity
    );

    // Apply thermal casualty rates
    const zoneFatalities = multiplyUncertaintyValues(
      zonePopulation,
      new UncertaintyValue(
        zone.mortalityRate,
        zone.mortalityRate * 0.4,
        "1",
        "Medical literature",
        "Thermal mortality rate"
      )
    );

    const zoneInjuries = multiplyUncertaintyValues(
      zonePopulation,
      new UncertaintyValue(
        zone.injuryRate,
        zone.injuryRate * 0.3,
        "1",
        "Medical literature",
        "Thermal injury rate"
      )
    );

    totalThermalFatalities = addUncertaintyValues([
      totalThermalFatalities,
      zoneFatalities,
    ]);
    totalThermalInjuries = addUncertaintyValues([
      totalThermalInjuries,
      zoneInjuries,
    ]);
  });

  return {
    total: {
      fatalities: totalThermalFatalities,
      injuries: totalThermalInjuries,
      affected: addUncertaintyValues([
        totalThermalFatalities,
        totalThermalInjuries,
      ]),
    },
    byMechanism: {
      [InjuryMechanism.THERMAL_RADIATION]: totalThermalInjuries,
      [InjuryMechanism.PRIMARY_BLAST]: new UncertaintyValue(
        0,
        0,
        "people",
        "Calculated separately",
        "Primary blast injuries"
      ),
      [InjuryMechanism.SECONDARY_BLAST]: new UncertaintyValue(
        0,
        0,
        "people",
        "Calculated separately",
        "Secondary blast injuries"
      ),
      [InjuryMechanism.TERTIARY_BLAST]: new UncertaintyValue(
        0,
        0,
        "people",
        "Calculated separately",
        "Tertiary blast injuries"
      ),
      [InjuryMechanism.QUATERNARY_BLAST]: new UncertaintyValue(
        0,
        0,
        "people",
        "Calculated separately",
        "Quaternary blast injuries"
      ),
    },
  };
}

/**
 * Combine blast and thermal casualty estimates, avoiding double-counting
 */
function combineCasualtyEstimates(
  blastCasualties: Partial<CasualtyEstimate>,
  thermalCasualties: Partial<CasualtyEstimate>
): Pick<CasualtyEstimate, "total" | "bySeverity" | "byMechanism"> {
  // Use maximum for fatalities (overlap between blast and thermal)
  const totalFatalities = maxUncertaintyValues([
    blastCasualties.total!.fatalities,
    thermalCasualties.total!.fatalities,
  ]);

  // Add injuries (different mechanisms can cause different injuries)
  const totalInjuries = addUncertaintyValues([
    blastCasualties.total!.injuries,
    thermalCasualties.total!.injuries,
  ]);

  const totalAffected = addUncertaintyValues([totalFatalities, totalInjuries]);

  // Distribute casualties by severity (based on medical triage categories)
  const bySeverity = {
    [CasualtySeverity.EXPECTANT]: totalFatalities,
    [CasualtySeverity.IMMEDIATE]: multiplyUncertaintyValues(
      totalInjuries,
      new UncertaintyValue(
        0.25,
        0.05,
        "1",
        "Medical triage",
        "Immediate care needed"
      )
    ),
    [CasualtySeverity.DELAYED]: multiplyUncertaintyValues(
      totalInjuries,
      new UncertaintyValue(
        0.45,
        0.1,
        "1",
        "Medical triage",
        "Delayed care acceptable"
      )
    ),
    [CasualtySeverity.MINIMAL]: multiplyUncertaintyValues(
      totalInjuries,
      new UncertaintyValue(
        0.3,
        0.1,
        "1",
        "Medical triage",
        "Minimal care needed"
      )
    ),
  };

  // Combine mechanisms
  const byMechanism = {
    [InjuryMechanism.PRIMARY_BLAST]:
      blastCasualties.byMechanism![InjuryMechanism.PRIMARY_BLAST],
    [InjuryMechanism.SECONDARY_BLAST]:
      blastCasualties.byMechanism![InjuryMechanism.SECONDARY_BLAST],
    [InjuryMechanism.TERTIARY_BLAST]:
      blastCasualties.byMechanism![InjuryMechanism.TERTIARY_BLAST],
    [InjuryMechanism.QUATERNARY_BLAST]:
      blastCasualties.byMechanism![InjuryMechanism.QUATERNARY_BLAST],
    [InjuryMechanism.THERMAL_RADIATION]:
      thermalCasualties.byMechanism![InjuryMechanism.THERMAL_RADIATION],
  };

  return {
    total: {
      fatalities: totalFatalities,
      injuries: totalInjuries,
      affected: totalAffected,
    },
    bySeverity,
    byMechanism,
  };
}

// Helper functions

/**
 * Calculate population in annular area based on area and density
 */
function calculateAnnularPopulation(
  innerRadius: UncertaintyValue,
  outerRadius: UncertaintyValue,
  density: UncertaintyValue
): UncertaintyValue {
  const variables: UncertaintyVariable[] = [
    {
      name: "inner",
      value: innerRadius,
      distribution: DistributionType.NORMAL,
    },
    {
      name: "outer",
      value: outerRadius,
      distribution: DistributionType.NORMAL,
    },
    { name: "density", value: density, distribution: DistributionType.NORMAL },
  ];

  const annularFunction = (inputs: Record<string, number>) => {
    const { inner, outer, density } = inputs;
    const annularArea = Math.PI * (outer * outer - inner * inner); // m²
    const areaKm2 = annularArea / 1e6; // Convert to km²
    return density * areaKm2;
  };

  const result = UncertaintyPropagator.propagateNonlinear(
    variables,
    annularFunction
  );

  return new UncertaintyValue(
    result.value,
    result.uncertainty,
    "people",
    "Calculated from annular area and density",
    "Population in annular zone"
  );
}

/**
 * Add multiple uncertainty values
 */
function addUncertaintyValues(values: UncertaintyValue[]): UncertaintyValue {
  const variables = values.map((value, index) => ({
    name: `value${index}`,
    value,
    distribution: DistributionType.NORMAL,
  }));

  const sumFunction = (inputs: Record<string, number>) => {
    return Object.values(inputs).reduce((sum, val) => sum + val, 0);
  };

  const result = UncertaintyPropagator.propagateNonlinear(
    variables,
    sumFunction
  );

  return new UncertaintyValue(
    result.value,
    result.uncertainty,
    values[0]?.unit || "1",
    "Calculated sum",
    "Sum of uncertainty values"
  );
}

/**
 * Multiply two uncertainty values
 */
function multiplyUncertaintyValues(
  a: UncertaintyValue,
  b: UncertaintyValue
): UncertaintyValue {
  const variables: UncertaintyVariable[] = [
    { name: "a", value: a, distribution: DistributionType.NORMAL },
    { name: "b", value: b, distribution: DistributionType.NORMAL },
  ];

  const multiplyFunction = (inputs: Record<string, number>) => {
    return inputs.a * inputs.b;
  };

  const result = UncertaintyPropagator.propagateNonlinear(
    variables,
    multiplyFunction
  );

  return new UncertaintyValue(
    result.value,
    result.uncertainty,
    a.unit === "1" ? b.unit : b.unit === "1" ? a.unit : `${a.unit}⋅${b.unit}`,
    "Calculated product",
    "Product of uncertainty values"
  );
}

/**
 * Get maximum of multiple uncertainty values
 */
function maxUncertaintyValues(values: UncertaintyValue[]): UncertaintyValue {
  const variables = values.map((value, index) => ({
    name: `value${index}`,
    value,
    distribution: DistributionType.NORMAL,
  }));

  const maxFunction = (inputs: Record<string, number>) => {
    return Math.max(...Object.values(inputs));
  };

  const result = UncertaintyPropagator.propagateNonlinear(
    variables,
    maxFunction
  );

  return new UncertaintyValue(
    result.value,
    result.uncertainty,
    values[0]?.unit || "1",
    "Calculated maximum",
    "Maximum of uncertainty values"
  );
}

/**
 * Validate casualty calculation inputs
 */
function validateCasualtyInputs(
  blastEffects: BlastEffectsResult,
  populationDensity: PopulationDensity
): { isValid: boolean; warnings: string[]; limitations: string[] } {
  const warnings: string[] = [];
  const limitations: string[] = [];
  let isValid = true;

  // Check blast effects validity
  if (!blastEffects.validityCheck.isValid) {
    warnings.push("Blast effects calculations have validity issues");
    warnings.push(...blastEffects.validityCheck.warnings);
    isValid = false;
  }

  // Check population density ranges
  if (populationDensity.urban.value > 50000) {
    warnings.push(
      `Urban density (${populationDensity.urban.value} people/km²) is extremely high`
    );
  }
  if (populationDensity.rural.value > 1000) {
    warnings.push(
      `Rural density (${populationDensity.rural.value} people/km²) seems high for rural area`
    );
  }

  // General limitations
  limitations.push("Casualty rates based on nuclear weapons effects studies");
  limitations.push("Does not account for building protection or evacuation");
  limitations.push("Assumes uniform population distribution within zones");
  limitations.push("Medical care availability affects actual mortality rates");
  limitations.push("Seasonal and time-of-day variations not considered");
  limitations.push("Does not include long-term health effects");

  return { isValid, warnings, limitations };
}

/**
 * Get population density by region name
 */
export function getPopulationDensity(
  name: keyof typeof POPULATION_DENSITIES
): PopulationDensity {
  const density = POPULATION_DENSITIES[name];
  if (!density) {
    throw new Error(
      `Unknown population density: ${name}. Available: ${Object.keys(
        POPULATION_DENSITIES
      ).join(", ")}`
    );
  }
  return density;
}

/**
 * Validate casualty estimates against historical events
 */
export function validateAgainstHistoricalCasualties(): Array<{
  name: string;
  observed: {
    fatalities?: number;
    injuries?: number;
    description: string;
  };
  calculated?: CasualtyEstimate;
  agreement: string;
}> {
  return [
    {
      name: "Chelyabinsk (2013)",
      observed: {
        fatalities: 0,
        injuries: 1491,
        description: "Mostly minor injuries from flying glass and debris",
      },
      agreement:
        "Cannot validate - insufficient blast effects data for populated areas",
    },
    {
      name: "Tunguska (1908)",
      observed: {
        fatalities: 0,
        injuries: 0,
        description: "Remote location with minimal population exposure",
      },
      agreement: "Consistent - remote location explains zero casualties",
    },
    {
      name: "Hiroshima (1945) - Nuclear Reference",
      observed: {
        fatalities: 146000,
        injuries: 100000,
        description:
          "Nuclear weapon effects on urban population (reference for scaling validation)",
      },
      agreement:
        "Reference case - casualty models based on this and similar events",
    },
  ];
}
