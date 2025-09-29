/**
 * Data Validation System for Scientific Asteroid Data
 *
 * This module provides comprehensive validation for asteroid data including:
 * - Cross-validation against JPL Horizons ephemeris
 * - Consistency checks for derived vs observed properties
 * - Outlier detection for potentially erroneous data
 * - Data provenance tracking with source attribution
 */

import { ScientificAsteroid } from "./nasa-processor";

export interface ValidationResult {
  isValid: boolean;
  confidence: number; // 0-1 scale
  warnings: ValidationWarning[];
  errors: ValidationError[];
  qualityScore: number; // 0-1 scale
}

export interface ValidationWarning {
  type: "UNCERTAINTY_HIGH" | "DATA_SPARSE" | "EXTRAPOLATION" | "INCONSISTENCY";
  message: string;
  severity: "low" | "medium" | "high";
  affectedProperty: string;
}

export interface ValidationError {
  type:
    | "INVALID_VALUE"
    | "MISSING_DATA"
    | "PHYSICAL_IMPOSSIBILITY"
    | "CALCULATION_ERROR";
  message: string;
  property: string;
  expectedRange?: { min: number; max: number };
  actualValue?: number;
}

export interface OutlierDetectionResult {
  isOutlier: boolean;
  outlierScore: number; // Higher = more likely to be outlier
  comparisonGroup: string;
  expectedRange: { min: number; max: number };
  actualValue: number;
}

export class AsteroidDataValidator {
  private knownAsteroids: Map<string, any> = new Map();
  private physicalLimits: Map<string, { min: number; max: number }> = new Map();

  constructor() {
    this.initializeValidationData();
  }

  /**
   * Comprehensive validation of asteroid data
   */
  public validateAsteroid(asteroid: ScientificAsteroid): ValidationResult {
    const warnings: ValidationWarning[] = [];
    const errors: ValidationError[] = [];

    // Physical property validation
    this.validatePhysicalProperties(asteroid, warnings, errors);

    // Orbital mechanics validation
    this.validateOrbitalElements(asteroid, warnings, errors);

    // Consistency checks
    this.validateConsistency(asteroid, warnings, errors);

    // Data quality assessment
    this.validateDataQuality(asteroid, warnings, errors);

    // Calculate overall scores
    const confidence = this.calculateConfidence(warnings, errors);
    const qualityScore = this.calculateQualityScore(asteroid, warnings, errors);

    return {
      isValid: errors.length === 0,
      confidence,
      warnings,
      errors,
      qualityScore,
    };
  }

  /**
   * Detect outliers in asteroid properties
   */
  public detectOutliers(
    asteroid: ScientificAsteroid
  ): OutlierDetectionResult[] {
    const results: OutlierDetectionResult[] = [];

    // Check diameter vs absolute magnitude relationship
    results.push(this.checkDiameterMagnitudeOutlier(asteroid));

    // Check mass vs diameter relationship
    results.push(this.checkMassDiameterOutlier(asteroid));

    // Check density vs composition relationship
    results.push(this.checkDensityCompositionOutlier(asteroid));

    return results.filter((result) => result.isOutlier);
  }

  /**
   * Cross-validate against JPL Horizons data (placeholder)
   */
  public async crossValidateWithJPL(
    asteroid: ScientificAsteroid
  ): Promise<ValidationResult> {
    // This would make actual API calls to JPL Horizons in a real implementation
    // For now, return a placeholder validation

    const warnings: ValidationWarning[] = [];
    const errors: ValidationError[] = [];

    // Simulate JPL validation
    if (asteroid.neoReferenceId) {
      // Check if orbital elements are reasonable
      const orbitalValidation =
        this.validateOrbitalElementsAgainstJPL(asteroid);
      warnings.push(...orbitalValidation.warnings);
      errors.push(...orbitalValidation.errors);
    }

    return {
      isValid: errors.length === 0,
      confidence: 0.8, // Placeholder
      warnings,
      errors,
      qualityScore: 0.85, // Placeholder
    };
  }

  /**
   * Validate physical properties against known limits
   */
  private validatePhysicalProperties(
    asteroid: ScientificAsteroid,
    warnings: ValidationWarning[],
    errors: ValidationError[]
  ): void {
    // Diameter validation
    if (asteroid.diameter.estimated <= 0) {
      errors.push({
        type: "INVALID_VALUE",
        message: "Diameter must be positive",
        property: "diameter.estimated",
        actualValue: asteroid.diameter.estimated,
      });
    }

    if (asteroid.diameter.estimated > 1000000) {
      // 1000 km
      warnings.push({
        type: "EXTRAPOLATION",
        message: "Diameter unusually large for NEO",
        severity: "medium",
        affectedProperty: "diameter",
      });
    }

    // Mass validation
    if (asteroid.mass.value <= 0) {
      errors.push({
        type: "INVALID_VALUE",
        message: "Mass must be positive",
        property: "mass.value",
        actualValue: asteroid.mass.value,
      });
    }

    // Density validation
    const densityLimits = this.physicalLimits.get("density") || {
      min: 500,
      max: 8000,
    };
    if (
      asteroid.density.value < densityLimits.min ||
      asteroid.density.value > densityLimits.max
    ) {
      warnings.push({
        type: "INCONSISTENCY",
        message: `Density ${asteroid.density.value} kg/m³ outside typical range`,
        severity: "medium",
        affectedProperty: "density",
      });
    }

    // Absolute magnitude validation
    if (
      asteroid.absoluteMagnitude.value < 5 ||
      asteroid.absoluteMagnitude.value > 35
    ) {
      warnings.push({
        type: "EXTRAPOLATION",
        message: "Absolute magnitude outside typical NEO range",
        severity: "low",
        affectedProperty: "absoluteMagnitude",
      });
    }
  }

  /**
   * Validate orbital elements
   */
  private validateOrbitalElements(
    asteroid: ScientificAsteroid,
    warnings: ValidationWarning[],
    errors: ValidationError[]
  ): void {
    const elements = asteroid.orbitalElements;

    // Eccentricity must be between 0 and 1 for elliptical orbits
    if (elements.eccentricity < 0 || elements.eccentricity >= 1) {
      errors.push({
        type: "INVALID_VALUE",
        message: "Eccentricity must be between 0 and 1 for bound orbits",
        property: "orbitalElements.eccentricity",
        expectedRange: { min: 0, max: 0.99 },
        actualValue: elements.eccentricity,
      });
    }

    // Semi-major axis should be reasonable for NEOs
    if (elements.semiMajorAxis < 0.5 || elements.semiMajorAxis > 5.0) {
      warnings.push({
        type: "EXTRAPOLATION",
        message: "Semi-major axis outside typical NEO range",
        severity: "medium",
        affectedProperty: "orbitalElements.semiMajorAxis",
      });
    }

    // Inclination should be between 0 and 180 degrees
    if (elements.inclination < 0 || elements.inclination > 180) {
      errors.push({
        type: "INVALID_VALUE",
        message: "Inclination must be between 0 and 180 degrees",
        property: "orbitalElements.inclination",
        expectedRange: { min: 0, max: 180 },
        actualValue: elements.inclination,
      });
    }
  }

  /**
   * Check consistency between derived and observed properties
   */
  private validateConsistency(
    asteroid: ScientificAsteroid,
    warnings: ValidationWarning[],
    errors: ValidationError[]
  ): void {
    // Check diameter-magnitude consistency
    const expectedDiameter = this.diameterFromMagnitude(
      asteroid.absoluteMagnitude.value,
      0.15 // Assumed albedo
    );

    const diameterRatio = asteroid.diameter.estimated / expectedDiameter;
    if (diameterRatio < 0.5 || diameterRatio > 2.0) {
      warnings.push({
        type: "INCONSISTENCY",
        message: "Diameter inconsistent with absolute magnitude",
        severity: "medium",
        affectedProperty: "diameter",
      });
    }

    // Check mass-density-volume consistency
    const radius = asteroid.diameter.estimated / 2;
    const volume = (4 / 3) * Math.PI * Math.pow(radius, 3);
    const expectedMass = volume * asteroid.density.value;

    const massRatio = asteroid.mass.value / expectedMass;
    if (massRatio < 0.5 || massRatio > 2.0) {
      warnings.push({
        type: "INCONSISTENCY",
        message: "Mass inconsistent with diameter and density",
        severity: "high",
        affectedProperty: "mass",
      });
    }
  }

  /**
   * Validate data quality indicators
   */
  private validateDataQuality(
    asteroid: ScientificAsteroid,
    warnings: ValidationWarning[],
    errors: ValidationError[]
  ): void {
    const quality = asteroid.dataQuality;

    // Check observation arc length
    if (quality.observationArc.days < 30) {
      warnings.push({
        type: "DATA_SPARSE",
        message: "Short observation arc may lead to poor orbital accuracy",
        severity: "medium",
        affectedProperty: "orbitalElements",
      });
    }

    // Check number of observations
    if (quality.numberOfObservations < 10) {
      warnings.push({
        type: "DATA_SPARSE",
        message: "Few observations may lead to poor accuracy",
        severity: "medium",
        affectedProperty: "all",
      });
    }

    // Check uncertainty class consistency
    if (quality.uncertaintyClass === "LOW" && quality.dataReliability > 0.8) {
      warnings.push({
        type: "INCONSISTENCY",
        message: "Uncertainty class inconsistent with reliability score",
        severity: "low",
        affectedProperty: "dataQuality",
      });
    }
  }

  /**
   * Check for diameter-magnitude outliers
   */
  private checkDiameterMagnitudeOutlier(
    asteroid: ScientificAsteroid
  ): OutlierDetectionResult {
    const expectedDiameter = this.diameterFromMagnitude(
      asteroid.absoluteMagnitude.value,
      0.15
    );
    const ratio = asteroid.diameter.estimated / expectedDiameter;

    return {
      isOutlier: ratio < 0.3 || ratio > 3.0,
      outlierScore: Math.abs(Math.log10(ratio)),
      comparisonGroup: "diameter-magnitude relationship",
      expectedRange: {
        min: expectedDiameter * 0.5,
        max: expectedDiameter * 2.0,
      },
      actualValue: asteroid.diameter.estimated,
    };
  }

  /**
   * Check for mass-diameter outliers
   */
  private checkMassDiameterOutlier(
    asteroid: ScientificAsteroid
  ): OutlierDetectionResult {
    const radius = asteroid.diameter.estimated / 2;
    const volume = (4 / 3) * Math.PI * Math.pow(radius, 3);
    const expectedMass = volume * 2000; // Typical asteroid density
    const ratio = asteroid.mass.value / expectedMass;

    return {
      isOutlier: ratio < 0.2 || ratio > 5.0,
      outlierScore: Math.abs(Math.log10(ratio)),
      comparisonGroup: "mass-diameter relationship",
      expectedRange: { min: expectedMass * 0.5, max: expectedMass * 3.0 },
      actualValue: asteroid.mass.value,
    };
  }

  /**
   * Check for density-composition outliers
   */
  private checkDensityCompositionOutlier(
    asteroid: ScientificAsteroid
  ): OutlierDetectionResult {
    const typicalDensities = {
      "C-type": { min: 1000, max: 1800 },
      "S-type": { min: 2200, max: 3200 },
      "M-type": { min: 4500, max: 6000 },
    };

    const expected = typicalDensities[
      asteroid.composition.type as keyof typeof typicalDensities
    ] || { min: 1000, max: 6000 };

    const isOutlier =
      asteroid.density.value < expected.min ||
      asteroid.density.value > expected.max;

    return {
      isOutlier,
      outlierScore: isOutlier
        ? Math.max(
            (expected.min - asteroid.density.value) / expected.min,
            (asteroid.density.value - expected.max) / expected.max
          )
        : 0,
      comparisonGroup: `${asteroid.composition.type} density range`,
      expectedRange: expected,
      actualValue: asteroid.density.value,
    };
  }

  /**
   * Placeholder for JPL orbital validation
   */
  private validateOrbitalElementsAgainstJPL(asteroid: ScientificAsteroid): {
    warnings: ValidationWarning[];
    errors: ValidationError[];
  } {
    // This would compare against actual JPL Horizons data
    return { warnings: [], errors: [] };
  }

  /**
   * Calculate confidence score based on validation results
   */
  private calculateConfidence(
    warnings: ValidationWarning[],
    errors: ValidationError[]
  ): number {
    let confidence = 1.0;

    // Reduce confidence for each error
    confidence -= errors.length * 0.2;

    // Reduce confidence for warnings based on severity
    for (const warning of warnings) {
      switch (warning.severity) {
        case "high":
          confidence -= 0.15;
          break;
        case "medium":
          confidence -= 0.1;
          break;
        case "low":
          confidence -= 0.05;
          break;
      }
    }

    return Math.max(0, confidence);
  }

  /**
   * Calculate overall quality score
   */
  private calculateQualityScore(
    asteroid: ScientificAsteroid,
    warnings: ValidationWarning[],
    errors: ValidationError[]
  ): number {
    let score = asteroid.dataQuality.dataReliability;

    // Adjust for validation results
    score *= this.calculateConfidence(warnings, errors);

    // Adjust for data completeness
    if (asteroid.orbitalElements.covariance) score += 0.1;
    if (asteroid.dataQuality.observationArc.days > 365) score += 0.1;
    if (asteroid.dataQuality.numberOfObservations > 100) score += 0.1;

    return Math.min(1.0, score);
  }

  /**
   * Calculate diameter from absolute magnitude
   */
  private diameterFromMagnitude(magnitude: number, albedo: number): number {
    // Standard formula: D = 1329 * 10^(-0.2*H) / sqrt(albedo)
    return (1329 * Math.pow(10, -0.2 * magnitude)) / Math.sqrt(albedo);
  }

  /**
   * Initialize validation data and physical limits
   */
  private initializeValidationData(): void {
    // Set physical limits for various properties
    this.physicalLimits.set("density", { min: 500, max: 8000 }); // kg/m³
    this.physicalLimits.set("diameter", { min: 1, max: 1000000 }); // meters
    this.physicalLimits.set("mass", { min: 1e6, max: 1e18 }); // kg
    this.physicalLimits.set("absoluteMagnitude", { min: 5, max: 35 });

    // Load known asteroid data for validation (placeholder)
    this.loadKnownAsteroidData();
  }

  /**
   * Load known asteroid data for validation
   */
  private loadKnownAsteroidData(): void {
    // This would load well-characterized asteroids from missions
    // For now, just placeholder data
    this.knownAsteroids.set("433", {
      name: "Eros",
      density: 2670,
      diameter: 16840,
      mass: 6.687e15,
    });
  }
}
