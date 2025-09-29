/**
 * Composition-Based Property Derivation Engine
 *
 * This module implements sophisticated composition classification and
 * property derivation based on asteroid taxonomic types, size, and
 * observational characteristics.
 */

import compositionData from "../../data/physics/composition_models.json";

export interface CompositionModel {
  type: string;
  description: string;
  density: {
    value: number;
    uncertainty: number;
    unit: string;
    source: string;
  };
  porosity: {
    value: number;
    uncertainty: number;
    description: string;
  };
  strength: {
    value: number;
    uncertainty: number;
    unit: string;
    description: string;
  };
  albedo: {
    value: number;
    uncertainty: number;
    description: string;
  };
  composition: Record<string, number>;
  examples: string[];
  spectralClass: string[];
  formationRegion: string;
}

export interface DerivedProperties {
  mass: {
    value: number;
    uncertainty: number;
    unit: string;
    derivationMethod: string;
    confidence: number;
  };
  density: {
    value: number;
    uncertainty: number;
    unit: string;
    source: string;
    confidence: number;
  };
  strength: {
    value: number;
    uncertainty: number;
    unit: string;
    description: string;
  };
  porosity: {
    value: number;
    uncertainty: number;
    description: string;
  };
  albedo: {
    value: number;
    uncertainty: number;
    description: string;
  };
}

export interface ClassificationResult {
  primaryType: string;
  confidence: number;
  alternativeTypes: Array<{
    type: string;
    probability: number;
  }>;
  classificationMethod: string;
  evidenceSources: string[];
  limitations: string[];
}

export class CompositionEngine {
  private compositionModels: Map<string, CompositionModel> = new Map();
  private validationData: Map<string, any> = new Map();

  constructor() {
    this.loadCompositionModels();
    this.loadValidationData();
  }

  /**
   * Classify asteroid composition based on available data
   */
  public classifyComposition(
    diameter: number,
    absoluteMagnitude: number,
    name: string,
    spectralType?: string
  ): ClassificationResult {
    const evidenceSources: string[] = [];
    const limitations: string[] = [];

    // Primary classification methods
    let primaryType = "S-type"; // Default
    let confidence = 0.3; // Low default confidence

    // Method 1: Spectral classification (highest confidence)
    if (spectralType) {
      const spectralResult = this.classifyBySpectralType(spectralType);
      if (spectralResult) {
        primaryType = spectralResult.type;
        confidence = spectralResult.confidence;
        evidenceSources.push("Spectroscopic observations");
      }
    } else {
      limitations.push("No spectroscopic data available");
    }

    // Method 2: Size-based statistical classification
    const sizeResult = this.classifyBySize(diameter);
    if (!spectralType) {
      primaryType = sizeResult.type;
      confidence = sizeResult.confidence;
      evidenceSources.push("Size-based statistical model");
    }

    // Method 3: Name-based heuristics (can override if high confidence)
    const nameResult = this.classifyByName(name);
    if (nameResult.confidence > 0.7 && nameResult.confidence > confidence) {
      primaryType = nameResult.type;
      confidence = nameResult.confidence;
      evidenceSources.push("Name pattern analysis");
    } else if (nameResult.confidence > confidence * 0.5) {
      evidenceSources.push("Name pattern analysis");
    }

    // Method 4: Magnitude-diameter consistency check
    const albedoConsistency = this.checkAlbedoConsistency(
      absoluteMagnitude,
      diameter,
      primaryType
    );

    if (!albedoConsistency.consistent) {
      confidence *= 0.9; // Slightly reduce confidence
      limitations.push(
        "Magnitude-diameter relationship suggests different composition"
      );
    }

    // Generate alternative classifications
    const alternativeTypes = this.generateAlternatives(
      primaryType,
      diameter,
      absoluteMagnitude,
      spectralType
    );

    return {
      primaryType,
      confidence: Math.min(confidence, 0.95), // Cap at 95%
      alternativeTypes,
      classificationMethod: evidenceSources.join(", ") || "Default heuristic",
      evidenceSources,
      limitations,
    };
  }

  /**
   * Derive physical properties from composition classification
   */
  public deriveProperties(
    diameter: number,
    compositionType: string,
    confidence: number
  ): DerivedProperties {
    const model = this.compositionModels.get(compositionType);
    if (!model) {
      throw new Error(`Unknown composition type: ${compositionType}`);
    }

    // Apply size-dependent corrections
    const correctedDensity = this.applySizeCorrections(diameter, model);
    const correctedStrength = this.applyStrengthScaling(diameter, model);
    const correctedPorosity = this.applyPorosityScaling(diameter, model);

    // Calculate mass from corrected properties
    const radius = diameter / 2;
    const volume = (4 / 3) * Math.PI * Math.pow(radius, 3);
    const bulkDensity = correctedDensity.value * (1 - correctedPorosity.value);
    const mass = volume * bulkDensity;

    // Uncertainty propagation
    const massUncertainty = this.propagateMassUncertainty(
      diameter,
      correctedDensity,
      correctedPorosity
    );

    return {
      mass: {
        value: mass,
        uncertainty: massUncertainty,
        unit: "kg",
        derivationMethod: `Volume × bulk density (${compositionType} model with size corrections)`,
        confidence: confidence * 0.9, // Slightly reduce for derived property
      },
      density: {
        value: correctedDensity.value,
        uncertainty: correctedDensity.uncertainty,
        unit: "kg/m³",
        source: `${compositionType} composition model with size corrections`,
        confidence: confidence,
      },
      strength: {
        value: correctedStrength.value,
        uncertainty: correctedStrength.uncertainty,
        unit: "Pa",
        description: correctedStrength.description,
      },
      porosity: {
        value: correctedPorosity.value,
        uncertainty: correctedPorosity.uncertainty,
        description: correctedPorosity.description,
      },
      albedo: {
        value: model.albedo.value,
        uncertainty: model.albedo.uncertainty,
        description: model.albedo.description,
      },
    };
  }

  /**
   * Validate derived properties against known measurements
   */
  public validateProperties(
    asteroidName: string,
    derivedProperties: DerivedProperties
  ): {
    isValid: boolean;
    validationResults: Array<{
      property: string;
      measured?: number;
      derived: number;
      agreement: "good" | "fair" | "poor";
      notes: string;
    }>;
  } {
    const validationResults: any[] = [];
    let isValid = true;

    const knownData = this.validationData.get(
      asteroidName.replace(/\s+/g, "_")
    );

    if (knownData) {
      // Validate density
      if (knownData.density) {
        const agreement = this.assessAgreement(
          knownData.density.value,
          derivedProperties.density.value,
          knownData.density.uncertainty,
          derivedProperties.density.uncertainty
        );

        validationResults.push({
          property: "density",
          measured: knownData.density.value,
          derived: derivedProperties.density.value,
          agreement,
          notes: `Measured: ${knownData.density.value}±${knownData.density.uncertainty} kg/m³`,
        });

        if (agreement === "poor") isValid = false;
      }

      // Validate porosity
      if (knownData.porosity) {
        const agreement = this.assessAgreement(
          knownData.porosity.value,
          derivedProperties.porosity.value,
          knownData.porosity.uncertainty,
          derivedProperties.porosity.uncertainty
        );

        validationResults.push({
          property: "porosity",
          measured: knownData.porosity.value,
          derived: derivedProperties.porosity.value,
          agreement,
          notes: `Measured: ${knownData.porosity.value}±${knownData.porosity.uncertainty}`,
        });

        if (agreement === "poor") isValid = false;
      }
    } else {
      validationResults.push({
        property: "all",
        derived: 0,
        agreement: "fair" as const,
        notes: "No validation data available for this asteroid",
      });
    }

    return { isValid, validationResults };
  }

  /**
   * Classify by spectral type
   */
  private classifyBySpectralType(
    spectralType: string
  ): { type: string; confidence: number } | null {
    const spectralMap: Record<string, { type: string; confidence: number }> = {
      C: { type: "C-type", confidence: 0.9 },
      B: { type: "C-type", confidence: 0.85 },
      F: { type: "C-type", confidence: 0.8 },
      G: { type: "C-type", confidence: 0.8 },
      S: { type: "S-type", confidence: 0.9 },
      Q: { type: "S-type", confidence: 0.85 },
      V: { type: "S-type", confidence: 0.8 },
      M: { type: "M-type", confidence: 0.85 },
      X: { type: "X-type", confidence: 0.7 },
      E: { type: "M-type", confidence: 0.75 },
    };

    const upperType = spectralType.toUpperCase().charAt(0);
    return spectralMap[upperType] || null;
  }

  /**
   * Classify by size using statistical distributions
   */
  private classifyBySize(diameter: number): {
    type: string;
    confidence: number;
  } {
    // Based on statistical analysis of asteroid populations
    if (diameter > 1000) {
      return { type: "C-type", confidence: 0.7 }; // Large asteroids tend to be carbonaceous
    } else if (diameter > 100) {
      return { type: "S-type", confidence: 0.6 }; // Medium asteroids mixed but S-type common
    } else {
      return { type: "S-type", confidence: 0.65 }; // Small asteroids tend to be stony
    }
  }

  /**
   * Classify by name patterns
   */
  private classifyByName(name: string): { type: string; confidence: number } {
    const lowerName = name.toLowerCase();

    // Known metallic asteroids
    if (lowerName.includes("psyche") || lowerName.includes("kleopatra")) {
      return { type: "M-type", confidence: 0.8 };
    }

    // Known carbonaceous asteroids
    if (lowerName.includes("ceres") || lowerName.includes("pallas")) {
      return { type: "C-type", confidence: 0.8 };
    }

    // Known stony asteroids
    if (
      lowerName.includes("vesta") ||
      lowerName.includes("eros") ||
      lowerName.includes("itokawa")
    ) {
      return { type: "S-type", confidence: 0.8 };
    }

    return { type: "S-type", confidence: 0.3 }; // Default with low confidence
  }

  /**
   * Check albedo consistency with magnitude-diameter relationship
   */
  private checkAlbedoConsistency(
    absoluteMagnitude: number,
    diameter: number,
    compositionType: string
  ): { consistent: boolean; expectedAlbedo: number; impliedAlbedo: number } {
    const model = this.compositionModels.get(compositionType);
    const expectedAlbedo = model?.albedo.value || 0.15;

    // Calculate implied albedo from magnitude-diameter relationship
    // D = 1329 * 10^(-0.2*H) / sqrt(albedo)
    // albedo = (1329 * 10^(-0.2*H) / D)^2
    const impliedAlbedo = Math.pow(
      (1329 * Math.pow(10, -0.2 * absoluteMagnitude)) / diameter,
      2
    );

    const ratio = impliedAlbedo / expectedAlbedo;
    const consistent = ratio > 0.3 && ratio < 3.0; // Within factor of 3

    return { consistent, expectedAlbedo, impliedAlbedo };
  }

  /**
   * Generate alternative composition classifications
   */
  private generateAlternatives(
    primaryType: string,
    diameter: number,
    absoluteMagnitude: number,
    spectralType?: string
  ): Array<{ type: string; probability: number }> {
    const alternatives: Array<{ type: string; probability: number }> = [];

    // If primary is C-type, consider S-type and X-type
    if (primaryType === "C-type") {
      alternatives.push({ type: "S-type", probability: 0.2 });
      alternatives.push({ type: "X-type", probability: 0.1 });
    }

    // If primary is S-type, consider C-type and M-type
    if (primaryType === "S-type") {
      alternatives.push({ type: "C-type", probability: 0.15 });
      alternatives.push({ type: "M-type", probability: 0.05 });
    }

    // If primary is M-type, consider X-type and S-type
    if (primaryType === "M-type") {
      alternatives.push({ type: "X-type", probability: 0.3 });
      alternatives.push({ type: "S-type", probability: 0.1 });
    }

    return alternatives.sort((a, b) => b.probability - a.probability);
  }

  /**
   * Apply size-dependent density corrections
   */
  private applySizeCorrections(diameter: number, model: CompositionModel) {
    // Larger asteroids may have undergone more compaction
    const sizeCorrection = diameter > 1000 ? 1.1 : diameter < 100 ? 0.9 : 1.0;

    return {
      value: model.density.value * sizeCorrection,
      uncertainty:
        model.density.uncertainty * Math.abs(sizeCorrection - 1.0) +
        model.density.uncertainty,
    };
  }

  /**
   * Apply strength scaling with size
   */
  private applyStrengthScaling(diameter: number, model: CompositionModel) {
    // Strength decreases with size due to scale effects
    const strengthScaling = Math.pow(100 / Math.max(diameter, 1), 0.2);

    return {
      value: model.strength.value * strengthScaling,
      uncertainty: model.strength.uncertainty * strengthScaling,
      description: `${model.strength.description} (size-corrected)`,
    };
  }

  /**
   * Apply porosity scaling with size
   */
  private applyPorosityScaling(diameter: number, model: CompositionModel) {
    // Porosity may increase with decreasing size for rubble piles
    const porosityScaling =
      diameter < 1000 ? 1 + 0.5 * (1000 / diameter) ** 0.3 : 1.0;

    return {
      value: Math.min(model.porosity.value * porosityScaling, 0.8), // Cap at 80%
      uncertainty: model.porosity.uncertainty * porosityScaling,
      description: `${model.porosity.description} (size-corrected)`,
    };
  }

  /**
   * Propagate uncertainty in mass calculation
   */
  private propagateMassUncertainty(
    diameter: number,
    density: { value: number; uncertainty: number },
    porosity: { value: number; uncertainty: number }
  ): number {
    // Simplified uncertainty propagation
    const radius = diameter / 2;
    const volume = (4 / 3) * Math.PI * Math.pow(radius, 3);

    // Assume 5% uncertainty in diameter measurement
    const diameterUncertainty = diameter * 0.05;
    const volumeUncertainty = 3 * volume * (diameterUncertainty / diameter);

    const bulkDensity = density.value * (1 - porosity.value);
    const bulkDensityUncertainty = Math.sqrt(
      Math.pow(density.uncertainty * (1 - porosity.value), 2) +
        Math.pow(density.value * porosity.uncertainty, 2)
    );

    const mass = volume * bulkDensity;
    const massUncertainty = Math.sqrt(
      Math.pow(volumeUncertainty * bulkDensity, 2) +
        Math.pow(volume * bulkDensityUncertainty, 2)
    );

    return massUncertainty;
  }

  /**
   * Assess agreement between measured and derived values
   */
  private assessAgreement(
    measured: number,
    derived: number,
    measuredUncertainty: number,
    derivedUncertainty: number
  ): "good" | "fair" | "poor" {
    const difference = Math.abs(measured - derived);
    const combinedUncertainty = Math.sqrt(
      measuredUncertainty ** 2 + derivedUncertainty ** 2
    );

    if (difference <= combinedUncertainty) return "good";
    if (difference <= 2 * combinedUncertainty) return "fair";
    return "poor";
  }

  /**
   * Load composition models from JSON data
   */
  private loadCompositionModels(): void {
    const data = compositionData as any;

    for (const [key, model] of Object.entries(data.asteroid_compositions)) {
      this.compositionModels.set(key, model as CompositionModel);
    }
  }

  /**
   * Load validation data for well-characterized asteroids
   */
  private loadValidationData(): void {
    const data = compositionData as any;

    if (data.validation_data?.well_characterized_asteroids) {
      for (const [key, asteroid] of Object.entries(
        data.validation_data.well_characterized_asteroids
      )) {
        this.validationData.set(key, asteroid);
      }
    }
  }
}
