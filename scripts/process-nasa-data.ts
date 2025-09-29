#!/usr/bin/env tsx

/**
 * NASA Data Processing Pipeline Script
 *
 * This script processes the raw NASA NEO data and creates enhanced
 * scientific asteroid data with proper uncertainties and validation.
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import {
  NASADataProcessor,
  ScientificAsteroid,
} from "../lib/data/nasa-processor";
import { AsteroidDataValidator } from "../lib/data/validation";

interface ProcessingStats {
  totalProcessed: number;
  successfullyProcessed: number;
  validationPassed: number;
  warnings: number;
  errors: number;
  outliers: number;
}

async function main() {
  console.log("🚀 Starting NASA asteroid data processing pipeline...\n");

  const processor = new NASADataProcessor();
  const validator = new AsteroidDataValidator();

  // Load raw NASA data
  console.log("📥 Loading raw NASA NEO data...");
  const rawDataPath = join(process.cwd(), "data", "neo_sample.json");
  const rawData = JSON.parse(readFileSync(rawDataPath, "utf-8"));
  console.log(`   Loaded ${rawData.length} raw asteroid records\n`);

  // Process data in batches to avoid memory issues
  const batchSize = 100;
  const processedAsteroids: ScientificAsteroid[] = [];
  const stats: ProcessingStats = {
    totalProcessed: 0,
    successfullyProcessed: 0,
    validationPassed: 0,
    warnings: 0,
    errors: 0,
    outliers: 0,
  };

  console.log("⚙️  Processing asteroid data...");

  for (let i = 0; i < rawData.length; i += batchSize) {
    const batch = rawData.slice(i, i + batchSize);
    console.log(
      `   Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
        rawData.length / batchSize
      )} (${batch.length} asteroids)`
    );

    // Process batch
    const batchProcessed = processor.processNASAData(batch);
    stats.totalProcessed += batch.length;
    stats.successfullyProcessed += batchProcessed.length;

    // Validate each asteroid in the batch
    for (const asteroid of batchProcessed) {
      const validation = validator.validateAsteroid(asteroid);

      if (validation.isValid) {
        stats.validationPassed++;
      }

      stats.warnings += validation.warnings.length;
      stats.errors += validation.errors.length;

      // Check for outliers
      const outliers = validator.detectOutliers(asteroid);
      if (outliers.length > 0) {
        stats.outliers++;

        // Add outlier information to metadata
        asteroid.metadata.processingNotes.push(
          `Outlier detected: ${outliers
            .map((o) => o.comparisonGroup)
            .join(", ")}`
        );
      }

      // Add validation results to metadata
      asteroid.metadata.processingNotes.push(
        `Validation: ${
          validation.isValid ? "PASSED" : "FAILED"
        } (confidence: ${validation.confidence.toFixed(2)})`
      );

      processedAsteroids.push(asteroid);
    }
  }

  console.log("\n✅ Data processing complete!\n");

  // Print statistics
  console.log("📊 Processing Statistics:");
  console.log(`   Total records processed: ${stats.totalProcessed}`);
  console.log(
    `   Successfully processed: ${stats.successfullyProcessed} (${(
      (stats.successfullyProcessed / stats.totalProcessed) *
      100
    ).toFixed(1)}%)`
  );
  console.log(
    `   Validation passed: ${stats.validationPassed} (${(
      (stats.validationPassed / stats.successfullyProcessed) *
      100
    ).toFixed(1)}%)`
  );
  console.log(`   Total warnings: ${stats.warnings}`);
  console.log(`   Total errors: ${stats.errors}`);
  console.log(`   Outliers detected: ${stats.outliers}\n`);

  // Sort by threat level and close approach distance
  console.log("🔄 Sorting asteroids by threat assessment...");
  processedAsteroids.sort((a, b) => {
    const threatOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const aThreat = threatOrder[a.threatAssessment.threatLevel];
    const bThreat = threatOrder[b.threatAssessment.threatLevel];

    if (aThreat !== bThreat) {
      return bThreat - aThreat; // Higher threat first
    }

    // If same threat level, sort by close approach distance
    return a.closeApproach.missDistance.au - b.closeApproach.missDistance.au;
  });

  // Create enhanced dataset
  const enhancedDataset = {
    metadata: {
      version: "1.0.0",
      generatedAt: new Date().toISOString(),
      source: "NASA JPL Small-Body Database",
      processingPipeline: "Scientific Accuracy Enhancement Pipeline v1.0",
      totalAsteroids: processedAsteroids.length,
      dataQualityDistribution: {
        high: processedAsteroids.filter(
          (a) => a.dataQuality.uncertaintyClass === "HIGH"
        ).length,
        medium: processedAsteroids.filter(
          (a) => a.dataQuality.uncertaintyClass === "MEDIUM"
        ).length,
        low: processedAsteroids.filter(
          (a) => a.dataQuality.uncertaintyClass === "LOW"
        ).length,
      },
      threatLevelDistribution: {
        critical: processedAsteroids.filter(
          (a) => a.threatAssessment.threatLevel === "critical"
        ).length,
        high: processedAsteroids.filter(
          (a) => a.threatAssessment.threatLevel === "high"
        ).length,
        medium: processedAsteroids.filter(
          (a) => a.threatAssessment.threatLevel === "medium"
        ).length,
        low: processedAsteroids.filter(
          (a) => a.threatAssessment.threatLevel === "low"
        ).length,
      },
      processingStats: stats,
    },
    asteroids: processedAsteroids,
  };

  // Save enhanced dataset
  console.log("💾 Saving enhanced asteroid dataset...");
  const outputPath = join(process.cwd(), "data", "enhanced_asteroids.json");
  writeFileSync(outputPath, JSON.stringify(enhancedDataset, null, 2));
  console.log(`   Saved to: ${outputPath}\n`);

  // Create summary report
  console.log("📋 Generating summary report...");
  const reportPath = join(process.cwd(), "data", "processing_report.md");
  const report = generateProcessingReport(enhancedDataset, stats);
  writeFileSync(reportPath, report);
  console.log(`   Report saved to: ${reportPath}\n`);

  // Show top threats
  console.log("⚠️  Top 10 Potentially Hazardous Asteroids:");
  const topThreats = processedAsteroids
    .filter((a) => a.threatAssessment.isPotentiallyHazardous)
    .slice(0, 10);

  for (let i = 0; i < topThreats.length; i++) {
    const asteroid = topThreats[i];
    console.log(`   ${i + 1}. ${asteroid.name}`);
    console.log(
      `      Diameter: ${asteroid.diameter.estimated.toFixed(
        0
      )}m (±${asteroid.diameter.uncertainty.toFixed(0)}m)`
    );
    console.log(
      `      Close approach: ${
        asteroid.closeApproach.date
      } (${asteroid.closeApproach.missDistance.au.toFixed(4)} AU)`
    );
    console.log(
      `      Threat level: ${asteroid.threatAssessment.threatLevel.toUpperCase()}`
    );
    console.log(
      `      Data quality: ${asteroid.dataQuality.uncertaintyClass}\n`
    );
  }

  console.log("🎉 Processing pipeline completed successfully!");
}

function generateProcessingReport(
  dataset: any,
  stats: ProcessingStats
): string {
  const report = `# NASA Asteroid Data Processing Report

Generated: ${new Date().toISOString()}

## Overview

This report summarizes the processing of NASA JPL Small-Body Database records into scientifically enhanced asteroid data with proper uncertainty quantification and validation.

## Processing Statistics

- **Total Records Processed**: ${stats.totalProcessed}
- **Successfully Processed**: ${stats.successfullyProcessed} (${(
    (stats.successfullyProcessed / stats.totalProcessed) *
    100
  ).toFixed(1)}%)
- **Validation Passed**: ${stats.validationPassed} (${(
    (stats.validationPassed / stats.successfullyProcessed) *
    100
  ).toFixed(1)}%)
- **Warnings Generated**: ${stats.warnings}
- **Errors Detected**: ${stats.errors}
- **Outliers Identified**: ${stats.outliers}

## Data Quality Distribution

- **High Quality**: ${dataset.metadata.dataQualityDistribution.high} asteroids
- **Medium Quality**: ${
    dataset.metadata.dataQualityDistribution.medium
  } asteroids
- **Low Quality**: ${dataset.metadata.dataQualityDistribution.low} asteroids

## Threat Level Distribution

- **Critical**: ${dataset.metadata.threatLevelDistribution.critical} asteroids
- **High**: ${dataset.metadata.threatLevelDistribution.high} asteroids
- **Medium**: ${dataset.metadata.threatLevelDistribution.medium} asteroids
- **Low**: ${dataset.metadata.threatLevelDistribution.low} asteroids

## Enhancements Applied

1. **Physical Property Derivation**
   - Mass calculated from diameter and composition-based density
   - Uncertainty propagation through all calculations
   - Composition classification based on size and spectral type heuristics

2. **Data Quality Assessment**
   - Uncertainty classification (HIGH/MEDIUM/LOW)
   - Data reliability scoring
   - Observation arc and data completeness evaluation

3. **Validation and Quality Control**
   - Physical property range validation
   - Consistency checks between derived and observed properties
   - Outlier detection using statistical methods

4. **Scientific Accuracy Markers**
   - Source attribution for all data
   - Uncertainty quantification for derived properties
   - Processing notes and validation results

## Data Structure Enhancements

The enhanced dataset includes:
- Comprehensive uncertainty information
- Data provenance tracking
- Validation results and quality scores
- Composition-based property derivation
- Threat assessment with scientific basis

## Recommendations

1. **High Priority Asteroids**: Focus on the ${
    dataset.metadata.threatLevelDistribution.critical +
    dataset.metadata.threatLevelDistribution.high
  } asteroids with critical or high threat levels
2. **Data Improvement**: Consider additional observations for the ${
    dataset.metadata.dataQualityDistribution.low
  } low-quality asteroids
3. **Validation**: Cross-validate ${
    stats.outliers
  } identified outliers with additional data sources

## Technical Notes

- All physical properties include uncertainty estimates
- Composition classification uses heuristic methods pending spectroscopic data
- Orbital elements are placeholders pending integration with JPL Horizons API
- Validation system includes comprehensive error checking and outlier detection

---

*This report was generated by the Scientific Accuracy Enhancement Pipeline v1.0*
`;

  return report;
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

export { main as processNASAData };
