/**
 * Uncertainty Display Components
 *
 * React components for displaying confidence intervals, error bars,
 * and uncertainty information in a scientifically accurate manner.
 */

"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, AlertTriangle, AlertCircle, XCircle } from "lucide-react";
import { UncertaintyValue } from "@/lib/physics/uncertainty";
import { ScientificDisclaimer } from "@/lib/physics/validation";

interface UncertaintyDisplayProps {
  value: UncertaintyValue;
  showDetails?: boolean;
  precision?: number;
  className?: string;
}

/**
 * Display a value with its uncertainty as ± notation
 */
export function UncertaintyDisplay({
  value,
  showDetails = false,
  precision = 3,
  className = "",
}: UncertaintyDisplayProps) {
  const formatValue = (val: number, prec: number) => {
    if (Math.abs(val) >= 1e6 || Math.abs(val) <= 1e-3) {
      return val.toExponential(prec);
    }
    return val.toPrecision(prec);
  };

  const relativeUncertainty =
    value.value !== 0 ? (value.uncertainty / Math.abs(value.value)) * 100 : 0;

  const getUncertaintyColor = (relativeUncertainty: number) => {
    if (relativeUncertainty <= 5) return "text-green-600";
    if (relativeUncertainty <= 20) return "text-yellow-600";
    if (relativeUncertainty <= 50) return "text-orange-600";
    return "text-red-600";
  };

  const getUncertaintyLabel = (relativeUncertainty: number) => {
    if (relativeUncertainty <= 5) return "High precision";
    if (relativeUncertainty <= 20) return "Good precision";
    if (relativeUncertainty <= 50) return "Moderate precision";
    return "Low precision";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`font-mono ${className}`}>
            {formatValue(value.value, precision)} ±{" "}
            {formatValue(value.uncertainty, precision)} {value.unit}
            {showDetails && (
              <Badge
                variant="outline"
                className={`ml-2 ${getUncertaintyColor(relativeUncertainty)}`}
              >
                ±{relativeUncertainty.toFixed(1)}%
              </Badge>
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p>
              <strong>Value:</strong> {formatValue(value.value, precision)}{" "}
              {value.unit}
            </p>
            <p>
              <strong>Uncertainty:</strong> ±
              {formatValue(value.uncertainty, precision)} {value.unit}
            </p>
            <p>
              <strong>Relative uncertainty:</strong> ±
              {relativeUncertainty.toFixed(2)}%
            </p>
            <p>
              <strong>Quality:</strong>{" "}
              {getUncertaintyLabel(relativeUncertainty)}
            </p>
            {value.source && (
              <p>
                <strong>Source:</strong> {value.source}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface ConfidenceIntervalProps {
  value: UncertaintyValue;
  confidenceLevel?: number; // e.g., 68 for 1-sigma, 95 for 2-sigma
  showBounds?: boolean;
  className?: string;
}

/**
 * Display confidence interval with visual representation
 */
export function ConfidenceInterval({
  value,
  confidenceLevel = 68,
  showBounds = true,
  className = "",
}: ConfidenceIntervalProps) {
  // Convert confidence level to sigma multiplier
  const sigmaMultiplier =
    confidenceLevel === 68
      ? 1
      : confidenceLevel === 95
      ? 2
      : confidenceLevel === 99.7
      ? 3
      : 1;

  const lowerBound = value.value - sigmaMultiplier * value.uncertainty;
  const upperBound = value.value + sigmaMultiplier * value.uncertainty;
  const range = upperBound - lowerBound;
  const centerPosition = 50; // Center of the visual bar

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">
          {confidenceLevel}% Confidence Interval
        </span>
        <Badge variant="outline">±{sigmaMultiplier}σ</Badge>
      </div>

      <div className="relative">
        {/* Visual confidence interval bar */}
        <div className="h-6 bg-gray-200 rounded-lg relative overflow-hidden">
          <div
            className="h-full bg-blue-200 absolute"
            style={{
              left: "10%",
              width: "80%",
            }}
          />
          <div
            className="h-full w-1 bg-blue-600 absolute"
            style={{ left: `${centerPosition}%` }}
          />
        </div>

        {/* Value labels */}
        {showBounds && (
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>
              {lowerBound.toPrecision(3)} {value.unit}
            </span>
            <span className="font-semibold">
              {value.value.toPrecision(3)} {value.unit}
            </span>
            <span>
              {upperBound.toPrecision(3)} {value.unit}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

interface DataQualityIndicatorProps {
  uncertaintyLevel: "HIGH" | "MEDIUM" | "LOW";
  observationCount?: number;
  lastUpdated?: Date;
  className?: string;
}

/**
 * Display data quality indicators for asteroid selection
 */
export function DataQualityIndicator({
  uncertaintyLevel,
  observationCount,
  lastUpdated,
  className = "",
}: DataQualityIndicatorProps) {
  const getQualityConfig = (level: string) => {
    switch (level) {
      case "HIGH":
        return {
          color: "bg-red-500",
          textColor: "text-red-700",
          label: "High Uncertainty",
          description: "Limited observational data",
          progress: 25,
        };
      case "MEDIUM":
        return {
          color: "bg-yellow-500",
          textColor: "text-yellow-700",
          label: "Medium Uncertainty",
          description: "Moderate observational data",
          progress: 65,
        };
      case "LOW":
        return {
          color: "bg-green-500",
          textColor: "text-green-700",
          label: "Low Uncertainty",
          description: "Well-constrained data",
          progress: 90,
        };
      default:
        return {
          color: "bg-gray-500",
          textColor: "text-gray-700",
          label: "Unknown",
          description: "Data quality unknown",
          progress: 0,
        };
    }
  };

  const config = getQualityConfig(uncertaintyLevel);
  const isDataOld =
    lastUpdated &&
    Date.now() - lastUpdated.getTime() > 365 * 24 * 60 * 60 * 1000;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${config.color}`} />
          Data Quality
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className={`text-sm font-medium ${config.textColor}`}>
              {config.label}
            </span>
            <span className="text-xs text-gray-500">{config.progress}%</span>
          </div>
          <Progress value={config.progress} className="h-2" />
          <p className="text-xs text-gray-600 mt-1">{config.description}</p>
        </div>

        {observationCount && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Observations:</span>
            <span className="font-medium">{observationCount}</span>
          </div>
        )}

        {lastUpdated && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Last updated:</span>
            <span
              className={`font-medium ${isDataOld ? "text-orange-600" : ""}`}
            >
              {lastUpdated.toLocaleDateString()}
              {isDataOld && " ⚠️"}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface MonteCarloVisualizationProps {
  samples: number[];
  title: string;
  unit: string;
  bins?: number;
  className?: string;
}

/**
 * Display Monte Carlo result distribution
 */
export function MonteCarloVisualization({
  samples,
  title,
  unit,
  bins = 20,
  className = "",
}: MonteCarloVisualizationProps) {
  // Calculate histogram
  const min = Math.min(...samples);
  const max = Math.max(...samples);
  const binWidth = (max - min) / bins;

  const histogram = Array(bins).fill(0);
  samples.forEach((sample) => {
    const binIndex = Math.min(Math.floor((sample - min) / binWidth), bins - 1);
    histogram[binIndex]++;
  });

  const maxCount = Math.max(...histogram);
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  const variance =
    samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length;
  const stdDev = Math.sqrt(variance);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm">{title} Distribution</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Histogram */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-600">
            <span>
              {min.toPrecision(3)} {unit}
            </span>
            <span>
              {max.toPrecision(3)} {unit}
            </span>
          </div>
          <div className="flex items-end h-20 gap-px">
            {histogram.map((count, index) => (
              <div
                key={index}
                className="bg-blue-400 flex-1 min-w-0"
                style={{
                  height: `${(count / maxCount) * 100}%`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-gray-600">Mean:</span>
            <div className="font-mono font-medium">
              {mean.toPrecision(4)} {unit}
            </div>
          </div>
          <div>
            <span className="text-gray-600">Std Dev:</span>
            <div className="font-mono font-medium">
              ±{stdDev.toPrecision(3)} {unit}
            </div>
          </div>
          <div>
            <span className="text-gray-600">Samples:</span>
            <div className="font-medium">{samples.length.toLocaleString()}</div>
          </div>
          <div>
            <span className="text-gray-600">95% Range:</span>
            <div className="font-mono text-xs">
              [{(mean - 2 * stdDev).toPrecision(3)},{" "}
              {(mean + 2 * stdDev).toPrecision(3)}]
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ScientificDisclaimerDisplayProps {
  disclaimer: ScientificDisclaimer;
  compact?: boolean;
  className?: string;
}

/**
 * Display scientific disclaimers with appropriate styling
 */
export function ScientificDisclaimerDisplay({
  disclaimer,
  compact = false,
  className = "",
}: ScientificDisclaimerDisplayProps) {
  const getAlertConfig = (level: string) => {
    switch (level) {
      case "INFO":
        return {
          icon: Info,
          variant: "default" as const,
          color: "text-blue-600",
        };
      case "WARNING":
        return {
          icon: AlertTriangle,
          variant: "default" as const,
          color: "text-yellow-600",
        };
      case "CAUTION":
        return {
          icon: AlertCircle,
          variant: "destructive" as const,
          color: "text-orange-600",
        };
      case "CRITICAL":
        return {
          icon: XCircle,
          variant: "destructive" as const,
          color: "text-red-600",
        };
      default:
        return {
          icon: Info,
          variant: "default" as const,
          color: "text-gray-600",
        };
    }
  };

  const config = getAlertConfig(disclaimer.level);
  const Icon = config.icon;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={`${config.color} cursor-help ${className}`}
            >
              <Icon className="w-3 h-3 mr-1" />
              {disclaimer.level}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-sm">
            <div className="space-y-2">
              <p className="font-semibold">{disclaimer.message}</p>
              <p className="text-sm">{disclaimer.scientificBasis}</p>
              {disclaimer.limitations.length > 0 && (
                <div>
                  <p className="text-sm font-medium">Key limitations:</p>
                  <ul className="text-xs list-disc list-inside">
                    {disclaimer.limitations
                      .slice(0, 2)
                      .map((limitation, index) => (
                        <li key={index}>{limitation.description}</li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Alert variant={config.variant} className={className}>
      <Icon className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-3">
          <div>
            <p className="font-semibold">{disclaimer.message}</p>
            <p className="text-sm mt-1">{disclaimer.scientificBasis}</p>
          </div>

          {disclaimer.limitations.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1">Limitations:</p>
              <ul className="text-sm space-y-1">
                {disclaimer.limitations.map((limitation, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Badge variant="outline" className="text-xs">
                      {limitation.impact}
                    </Badge>
                    <div className="flex-1">
                      <span className="font-medium">{limitation.aspect}:</span>{" "}
                      {limitation.description}
                      {limitation.mitigation && (
                        <p className="text-xs text-gray-600 mt-1">
                          <em>Mitigation: {limitation.mitigation}</em>
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {disclaimer.recommendations &&
            disclaimer.recommendations.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-1">Recommendations:</p>
                <ul className="text-sm list-disc list-inside space-y-1">
                  {disclaimer.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

          {disclaimer.references.length > 0 && (
            <details className="text-xs">
              <summary className="cursor-pointer font-medium">
                Scientific References ({disclaimer.references.length})
              </summary>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                {disclaimer.references.map((ref, index) => (
                  <li key={index}>
                    {ref.authors} ({ref.year}). {ref.title}
                    {ref.journal && <em>. {ref.journal}</em>}
                    {ref.doi && (
                      <a
                        href={`https://doi.org/${ref.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline ml-1"
                      >
                        DOI
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

interface UncertaintyPropagationVisualizationProps {
  steps: Array<{
    name: string;
    input: UncertaintyValue;
    output: UncertaintyValue;
    operation: string;
  }>;
  className?: string;
}

/**
 * Visualize uncertainty propagation through calculation chains
 */
export function UncertaintyPropagationVisualization({
  steps,
  className = "",
}: UncertaintyPropagationVisualizationProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm">Uncertainty Propagation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Step {index + 1}
                </Badge>
                <span className="text-sm font-medium">{step.name}</span>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                <div className="text-xs">
                  <span className="text-gray-600">Operation:</span>{" "}
                  {step.operation}
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-600">Input:</span>
                    <div className="font-mono">
                      <UncertaintyDisplay value={step.input} precision={3} />
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Output:</span>
                    <div className="font-mono">
                      <UncertaintyDisplay value={step.output} precision={3} />
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-600">
                  Uncertainty change:{" "}
                  {step.input.uncertainty !== 0
                    ? `${(
                        (step.output.uncertainty / step.input.uncertainty - 1) *
                        100
                      ).toFixed(1)}%`
                    : "N/A"}
                </div>
              </div>

              {index < steps.length - 1 && (
                <div className="flex justify-center">
                  <div className="w-px h-4 bg-gray-300" />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
