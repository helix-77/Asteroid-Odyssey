/**
 * Scientific Validation and Disclaimer System
 *
 * This module provides automatic disclaimer generation, validity range checking,
 * and scientific source citation for all physics models used in the application.
 *
 * References:
 * - NASA Planetary Defense Coordination Office guidelines
 * - ESA Space Situational Awareness standards
 * - IAU Commission A1 recommendations for astronomical calculations
 */

import { UncertaintyValue } from "./uncertainty";

export interface ValidityRange {
  parameter: string;
  minValue: number;
  maxValue: number;
  unit: string;
  description: string;
}

export interface ScientificReference {
  authors: string;
  title: string;
  journal?: string;
  year: number;
  doi?: string;
  url?: string;
  notes?: string;
}

export interface ModelLimitation {
  aspect: string;
  description: string;
  impact: "LOW" | "MEDIUM" | "HIGH";
  mitigation?: string;
}

export interface ScientificDisclaimer {
  level: "INFO" | "WARNING" | "CAUTION" | "CRITICAL";
  category:
    | "ACCURACY"
    | "VALIDITY"
    | "ASSUMPTION"
    | "LIMITATION"
    | "DATA_QUALITY";
  message: string;
  scientificBasis: string;
  limitations: ModelLimitation[];
  references: ScientificReference[];
  recommendations?: string[];
}

/**
 * Physics model validity ranges and limitations
 */
export const PHYSICS_MODEL_RANGES = {
  impact: {
    energy: {
      minValue: 1e12, // 1 TJ (small meteoroid)
      maxValue: 1e24, // 1000 ZJ (Chicxulub-scale)
      unit: "J",
      description: "Impact energy range for crater scaling laws",
    },
    velocity: {
      minValue: 11000, // Earth escape velocity
      maxValue: 72000, // Maximum heliocentric velocity
      unit: "m/s",
      description: "Impact velocity range for realistic asteroid encounters",
    },
    angle: {
      minValue: 0,
      maxValue: 90,
      unit: "degrees",
      description: "Impact angle from horizontal",
    },
    diameter: {
      minValue: 0.001, // 1 mm
      maxValue: 100000, // 100 km
      unit: "m",
      description: "Asteroid diameter range for impact calculations",
    },
  },
  orbital: {
    semiMajorAxis: {
      minValue: 0.1,
      maxValue: 100,
      unit: "AU",
      description: "Semi-major axis range for near-Earth objects",
    },
    eccentricity: {
      minValue: 0,
      maxValue: 0.99,
      unit: "",
      description: "Eccentricity range for bound orbits",
    },
    inclination: {
      minValue: 0,
      maxValue: 180,
      unit: "degrees",
      description: "Orbital inclination range",
    },
    timeSpan: {
      minValue: -100,
      maxValue: 100,
      unit: "years",
      description: "Time span for accurate orbital propagation",
    },
  },
  deflection: {
    deltaV: {
      minValue: 1e-6, // 1 mm/s
      maxValue: 1000, // 1 km/s
      unit: "m/s",
      description: "Delta-V range for realistic deflection missions",
    },
    leadTime: {
      minValue: 1,
      maxValue: 50,
      unit: "years",
      description: "Lead time range for deflection effectiveness",
    },
    asteroidMass: {
      minValue: 1e6, // 1000 tons
      maxValue: 1e18, // 1 billion billion kg
      unit: "kg",
      description: "Asteroid mass range for deflection calculations",
    },
  },
};

/**
 * Standard scientific references for physics models
 */
export const SCIENTIFIC_REFERENCES: Record<string, ScientificReference> = {
  holsapple2007: {
    authors: "Holsapple, K. A., & Housen, K. R.",
    title: "A crater and its ejecta: An interpretation of Deep Impact",
    journal: "Icarus",
    year: 2007,
    doi: "10.1016/j.icarus.2006.10.031",
    notes: "Crater scaling laws for impact calculations",
  },
  collins2005: {
    authors: "Collins, G. S., Melosh, H. J., & Marcus, R. A.",
    title:
      "Earth Impact Effects Program: A Web-based computer program for calculating the regional environmental consequences of a meteoroid impact on Earth",
    journal: "Meteoritics & Planetary Science",
    year: 2005,
    doi: "10.1111/j.1945-5100.2005.tb00157.x",
    notes: "Comprehensive impact effects modeling",
  },
  glasstone1977: {
    authors: "Glasstone, S., & Dolan, P. J.",
    title: "The Effects of Nuclear Weapons",
    year: 1977,
    url: "https://www.fourmilab.ch/etexts/www/effects/",
    notes: "Nuclear effects scaling for airburst modeling",
  },
  benMenahem1975: {
    authors: "Ben-Menahem, A.",
    title: "Source parameters from spectra of long-period seismic body waves",
    journal: "Journal of Geophysical Research",
    year: 1975,
    doi: "10.1029/JB080i026p03815",
    notes: "Seismic magnitude scaling for impact events",
  },
  meeus1998: {
    authors: "Meeus, J.",
    title: "Astronomical Algorithms",
    year: 1998,
    notes: "Standard reference for astronomical calculations",
  },
  standish1998: {
    authors: "Standish, E. M.",
    title: "JPL Planetary and Lunar Ephemerides",
    year: 1998,
    url: "https://ssd.jpl.nasa.gov/planets/eph_export.html",
    notes: "JPL ephemeris standards and accuracy",
  },
  ahrens1992: {
    authors: "Ahrens, T. J., & Harris, A. W.",
    title: "Deflection and fragmentation of near-Earth asteroids",
    journal: "Nature",
    year: 1992,
    doi: "10.1038/360429a0",
    notes: "Nuclear deflection physics and effectiveness",
  },
};

/**
 * Scientific Disclaimer Generator
 */
export class ScientificValidator {
  /**
   * Validate parameter against known physics model ranges
   */
  validateParameter(
    category: keyof typeof PHYSICS_MODEL_RANGES,
    parameter: string,
    value: number,
    unit?: string
  ): { isValid: boolean; disclaimer?: ScientificDisclaimer } {
    const ranges = PHYSICS_MODEL_RANGES[category];
    const range = ranges[parameter as keyof typeof ranges] as ValidityRange;

    if (!range) {
      return {
        isValid: false,
        disclaimer: {
          level: "WARNING",
          category: "VALIDITY",
          message: `Unknown parameter "${parameter}" for ${category} calculations`,
          scientificBasis: "Parameter not defined in validation ranges",
          limitations: [
            {
              aspect: "Parameter validation",
              description:
                "Parameter not included in standard validation ranges",
              impact: "MEDIUM",
            },
          ],
          references: [],
        },
      };
    }

    const isValid = value >= range.minValue && value <= range.maxValue;

    if (!isValid) {
      const disclaimer: ScientificDisclaimer = {
        level:
          value < range.minValue * 0.1 || value > range.maxValue * 10
            ? "CRITICAL"
            : "CAUTION",
        category: "VALIDITY",
        message: `Parameter ${parameter} (${value} ${
          unit || range.unit
        }) is outside validated range [${range.minValue}, ${range.maxValue}] ${
          range.unit
        }`,
        scientificBasis: range.description,
        limitations: [
          {
            aspect: "Model validity",
            description: `Physics models may not be accurate outside validated parameter ranges`,
            impact: "HIGH",
            mitigation:
              "Use results with extreme caution and consider alternative approaches",
          },
        ],
        references: this.getRelevantReferences(category),
        recommendations: [
          "Verify input parameters are physically reasonable",
          "Consider using alternative calculation methods for extreme cases",
          "Consult scientific literature for specialized scenarios",
        ],
      };

      return { isValid: false, disclaimer };
    }

    return { isValid: true };
  }

  /**
   * Generate disclaimer for simplified models and assumptions
   */
  generateModelDisclaimer(
    modelType: "impact" | "orbital" | "deflection",
    assumptions: string[],
    limitations: ModelLimitation[]
  ): ScientificDisclaimer {
    const levelMap = {
      impact: "WARNING" as const,
      orbital: "INFO" as const,
      deflection: "CAUTION" as const,
    };

    const messages = {
      impact:
        "Impact calculations use simplified models with several assumptions",
      orbital: "Orbital mechanics calculations include standard approximations",
      deflection:
        "Deflection effectiveness estimates are based on idealized scenarios",
    };

    return {
      level: levelMap[modelType],
      category: "ASSUMPTION",
      message: messages[modelType],
      scientificBasis: `Standard ${modelType} physics models with documented limitations`,
      limitations,
      references: this.getRelevantReferences(modelType),
      recommendations: [
        "Results should be interpreted as estimates with inherent uncertainties",
        "For critical applications, consult detailed mission studies",
        "Consider multiple calculation methods for cross-validation",
      ],
    };
  }

  /**
   * Generate data quality disclaimer
   */
  generateDataQualityDisclaimer(
    dataSource: string,
    uncertaintyLevel: "HIGH" | "MEDIUM" | "LOW",
    lastUpdated?: Date
  ): ScientificDisclaimer {
    const levelMap = {
      HIGH: "CRITICAL" as const,
      MEDIUM: "CAUTION" as const,
      LOW: "INFO" as const,
    };

    const messages = {
      HIGH: "Input data has high uncertainty or limited observational basis",
      MEDIUM:
        "Input data has moderate uncertainty typical of astronomical observations",
      LOW: "Input data is well-constrained with low uncertainty",
    };

    const limitations: ModelLimitation[] = [
      {
        aspect: "Data quality",
        description: `${dataSource} data has ${uncertaintyLevel.toLowerCase()} uncertainty`,
        impact:
          uncertaintyLevel === "HIGH"
            ? "HIGH"
            : uncertaintyLevel === "MEDIUM"
            ? "MEDIUM"
            : "LOW",
        mitigation:
          uncertaintyLevel === "HIGH"
            ? "Obtain additional observations or use conservative estimates"
            : undefined,
      },
    ];

    if (
      lastUpdated &&
      Date.now() - lastUpdated.getTime() > 365 * 24 * 60 * 60 * 1000
    ) {
      limitations.push({
        aspect: "Data currency",
        description: "Data may be outdated and not reflect recent observations",
        impact: "MEDIUM",
        mitigation: "Check for updated data from original sources",
      });
    }

    return {
      level: levelMap[uncertaintyLevel],
      category: "DATA_QUALITY",
      message: messages[uncertaintyLevel],
      scientificBasis: `Data quality assessment based on ${dataSource} standards`,
      limitations,
      references: [SCIENTIFIC_REFERENCES.standish1998],
      recommendations: [
        "Consider uncertainty ranges in all calculations",
        "Cross-reference with multiple data sources when possible",
        "Update data regularly from authoritative sources",
      ],
    };
  }

  /**
   * Generate accuracy disclaimer for calculation results
   */
  generateAccuracyDisclaimer(
    calculationType: string,
    expectedAccuracy: number,
    uncertaintyPropagation: boolean = false
  ): ScientificDisclaimer {
    const level =
      expectedAccuracy > 50
        ? "CRITICAL"
        : expectedAccuracy > 20
        ? "CAUTION"
        : "INFO";

    return {
      level,
      category: "ACCURACY",
      message: `${calculationType} results have estimated accuracy of ±${expectedAccuracy}%`,
      scientificBasis:
        "Accuracy estimate based on model validation and uncertainty analysis",
      limitations: [
        {
          aspect: "Calculation accuracy",
          description: `Results may vary by up to ${expectedAccuracy}% from actual values`,
          impact: expectedAccuracy > 20 ? "HIGH" : "MEDIUM",
          mitigation: uncertaintyPropagation
            ? "Uncertainty propagation included in results"
            : "Consider additional uncertainty analysis",
        },
      ],
      references: this.getValidationReferences(),
      recommendations: [
        "Use results as estimates rather than precise predictions",
        "Consider accuracy limitations in decision-making",
        "Validate against independent calculations when possible",
      ],
    };
  }

  /**
   * Combine multiple disclaimers into a comprehensive warning
   */
  combineDisclaimers(
    disclaimers: ScientificDisclaimer[]
  ): ScientificDisclaimer {
    if (disclaimers.length === 0) {
      return {
        level: "INFO",
        category: "ACCURACY",
        message: "Calculations performed within validated parameter ranges",
        scientificBasis: "Standard physics models applied correctly",
        limitations: [],
        references: [],
      };
    }

    if (disclaimers.length === 1) {
      return disclaimers[0];
    }

    // Determine highest severity level
    const levelPriority = { INFO: 1, WARNING: 2, CAUTION: 3, CRITICAL: 4 };
    const highestLevel = disclaimers.reduce(
      (max, d) => (levelPriority[d.level] > levelPriority[max] ? d.level : max),
      "INFO" as const
    );

    // Combine all limitations
    const allLimitations = disclaimers.flatMap((d) => d.limitations);
    const uniqueLimitations = allLimitations.filter(
      (limitation, index, array) =>
        array.findIndex((l) => l.aspect === limitation.aspect) === index
    );

    // Combine all references
    const allReferences = disclaimers.flatMap((d) => d.references);
    const uniqueReferences = allReferences.filter(
      (ref, index, array) =>
        array.findIndex((r) => r.title === ref.title) === index
    );

    // Combine recommendations
    const allRecommendations = disclaimers.flatMap(
      (d) => d.recommendations || []
    );
    const uniqueRecommendations = [...new Set(allRecommendations)];

    return {
      level: highestLevel,
      category: "LIMITATION",
      message: `Multiple limitations apply to these calculations (${disclaimers.length} issues identified)`,
      scientificBasis:
        "Combined assessment of model limitations and data quality",
      limitations: uniqueLimitations,
      references: uniqueReferences,
      recommendations: uniqueRecommendations,
    };
  }

  /**
   * Format disclaimer for display
   */
  formatDisclaimer(disclaimer: ScientificDisclaimer): string {
    let formatted = `**${disclaimer.level}**: ${disclaimer.message}\n\n`;

    formatted += `**Scientific Basis**: ${disclaimer.scientificBasis}\n\n`;

    if (disclaimer.limitations.length > 0) {
      formatted += "**Limitations**:\n";
      for (const limitation of disclaimer.limitations) {
        formatted += `- **${limitation.aspect}** (${limitation.impact} impact): ${limitation.description}`;
        if (limitation.mitigation) {
          formatted += ` *Mitigation: ${limitation.mitigation}*`;
        }
        formatted += "\n";
      }
      formatted += "\n";
    }

    if (disclaimer.recommendations && disclaimer.recommendations.length > 0) {
      formatted += "**Recommendations**:\n";
      for (const rec of disclaimer.recommendations) {
        formatted += `- ${rec}\n`;
      }
      formatted += "\n";
    }

    if (disclaimer.references.length > 0) {
      formatted += "**References**:\n";
      for (const ref of disclaimer.references) {
        formatted += `- ${ref.authors} (${ref.year}). ${ref.title}`;
        if (ref.journal) formatted += `. *${ref.journal}*`;
        if (ref.doi) formatted += `. DOI: ${ref.doi}`;
        if (ref.url) formatted += `. URL: ${ref.url}`;
        if (ref.notes) formatted += `. ${ref.notes}`;
        formatted += "\n";
      }
    }

    return formatted;
  }

  /**
   * Get relevant references for a calculation category
   */
  private getRelevantReferences(category: string): ScientificReference[] {
    const referenceMap: Record<string, string[]> = {
      impact: [
        "holsapple2007",
        "collins2005",
        "glasstone1977",
        "benMenahem1975",
      ],
      orbital: ["meeus1998", "standish1998"],
      deflection: ["ahrens1992", "holsapple2007"],
    };

    const refKeys = referenceMap[category] || [];
    return refKeys.map((key) => SCIENTIFIC_REFERENCES[key]).filter(Boolean);
  }

  /**
   * Get validation-specific references
   */
  private getValidationReferences(): ScientificReference[] {
    return [
      SCIENTIFIC_REFERENCES.collins2005,
      SCIENTIFIC_REFERENCES.standish1998,
    ];
  }
}

/**
 * Create a global validator instance
 */
export const scientificValidator = new ScientificValidator();

/**
 * Convenience function to validate impact parameters
 */
export function validateImpactParameters(params: {
  energy?: number;
  velocity?: number;
  angle?: number;
  diameter?: number;
}): ScientificDisclaimer[] {
  const disclaimers: ScientificDisclaimer[] = [];

  for (const [param, value] of Object.entries(params)) {
    if (value !== undefined) {
      const result = scientificValidator.validateParameter(
        "impact",
        param,
        value
      );
      if (!result.isValid && result.disclaimer) {
        disclaimers.push(result.disclaimer);
      }
    }
  }

  return disclaimers;
}

/**
 * Convenience function to validate orbital parameters
 */
export function validateOrbitalParameters(params: {
  semiMajorAxis?: number;
  eccentricity?: number;
  inclination?: number;
  timeSpan?: number;
}): ScientificDisclaimer[] {
  const disclaimers: ScientificDisclaimer[] = [];

  for (const [param, value] of Object.entries(params)) {
    if (value !== undefined) {
      const result = scientificValidator.validateParameter(
        "orbital",
        param,
        value
      );
      if (!result.isValid && result.disclaimer) {
        disclaimers.push(result.disclaimer);
      }
    }
  }

  return disclaimers;
}

/**
 * Convenience function to validate deflection parameters
 */
export function validateDeflectionParameters(params: {
  deltaV?: number;
  leadTime?: number;
  asteroidMass?: number;
}): ScientificDisclaimer[] {
  const disclaimers: ScientificDisclaimer[] = [];

  for (const [param, value] of Object.entries(params)) {
    if (value !== undefined) {
      const result = scientificValidator.validateParameter(
        "deflection",
        param,
        value
      );
      if (!result.isValid && result.disclaimer) {
        disclaimers.push(result.disclaimer);
      }
    }
  }

  return disclaimers;
}
