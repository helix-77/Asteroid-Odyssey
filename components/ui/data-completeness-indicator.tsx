"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Info,
  AlertTriangle,
  Database,
  CheckCircle,
  XCircle,
  Eye,
  Calculator,
} from "lucide-react";
import { UnifiedAsteroidData } from "@/lib/data/asteroid-manager";

interface DataCompletenessIndicatorProps {
  asteroid: UnifiedAsteroidData;
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * Display data completeness score with visual indicator
 */
export function DataCompletenessIndicator({
  asteroid,
  showDetails = false,
  compact = false,
  className = "",
}: DataCompletenessIndicatorProps) {
  const completeness = asteroid.dataCompleteness;
  const percentage = Math.round(completeness * 100);

  const getCompletenessConfig = (score: number) => {
    if (score >= 0.8) {
      return {
        color: "text-green-600",
        bgColor: "bg-green-100",
        borderColor: "border-green-300",
        label: "Excellent",
        icon: CheckCircle,
        description: "Comprehensive data available",
      };
    } else if (score >= 0.6) {
      return {
        color: "text-blue-600",
        bgColor: "bg-blue-100",
        borderColor: "border-blue-300",
        label: "Good",
        icon: Database,
        description: "Most key data available",
      };
    } else if (score >= 0.4) {
      return {
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
        borderColor: "border-yellow-300",
        label: "Limited",
        icon: AlertTriangle,
        description: "Some data missing or estimated",
      };
    } else {
      return {
        color: "text-red-600",
        bgColor: "bg-red-100",
        borderColor: "border-red-300",
        label: "Poor",
        icon: XCircle,
        description: "Significant data gaps",
      };
    }
  };

  const config = getCompletenessConfig(completeness);
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
              {percentage}%
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-semibold">Data Completeness: {percentage}%</p>
              <p className="text-sm">{config.description}</p>
              <p className="text-xs text-gray-600">
                Source:{" "}
                {asteroid.source === "local"
                  ? "Project Database"
                  : "NASA NEO Data"}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${config.color}`} />
          <span className="text-sm font-medium">Data Quality</span>
        </div>
        <Badge variant="outline" className={config.color}>
          {config.label}
        </Badge>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-gray-600">Completeness</span>
          <span className={`font-medium ${config.color}`}>{percentage}%</span>
        </div>
        <Progress value={percentage} className="h-2" />
        <p className="text-xs text-gray-600">{config.description}</p>
      </div>

      {showDetails && (
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Source:</span>
            <span className="font-medium">
              {asteroid.source === "local"
                ? "Project Database"
                : "NASA NEO Data"}
            </span>
          </div>

          {asteroid.estimatedFields.length > 0 && (
            <div>
              <span className="text-gray-600">Estimated fields:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {asteroid.estimatedFields.map((field) => (
                  <Badge key={field} variant="outline" className="text-xs">
                    {field}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface EstimationIndicatorProps {
  isEstimated: boolean;
  fieldName: string;
  confidence?: "high" | "medium" | "low";
  source?: string;
  className?: string;
}

/**
 * Display indicator for estimated vs measured values
 */
export function EstimationIndicator({
  isEstimated,
  fieldName,
  confidence = "medium",
  source,
  className = "",
}: EstimationIndicatorProps) {
  if (!isEstimated) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <CheckCircle className={`h-3 w-3 text-green-500 ${className}`} />
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">
              <strong>{fieldName}:</strong> Measured value
              {source && (
                <>
                  <br />
                  Source: {source}
                </>
              )}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const getConfidenceConfig = (level: string) => {
    switch (level) {
      case "high":
        return {
          color: "text-blue-500",
          label: "High confidence estimate",
          icon: Calculator,
        };
      case "medium":
        return {
          color: "text-yellow-500",
          label: "Medium confidence estimate",
          icon: Eye,
        };
      case "low":
        return {
          color: "text-red-500",
          label: "Low confidence estimate",
          icon: AlertTriangle,
        };
      default:
        return {
          color: "text-gray-500",
          label: "Estimated value",
          icon: Info,
        };
    }
  };

  const config = getConfidenceConfig(confidence);
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Icon className={`h-3 w-3 ${config.color} ${className}`} />
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="text-sm">
              <strong>{fieldName}:</strong> {config.label}
            </p>
            {source && (
              <p className="text-xs text-gray-600">
                Estimation method: {source}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface DataSourceBadgeProps {
  source: "local" | "nasa";
  className?: string;
}

/**
 * Display data source with appropriate styling
 */
export function DataSourceBadge({
  source,
  className = "",
}: DataSourceBadgeProps) {
  const config = {
    local: {
      label: "Project DB",
      color: "bg-blue-100 text-blue-800 border-blue-300",
      description: "Curated project database with comprehensive asteroid data",
    },
    nasa: {
      label: "NASA NEO",
      color: "bg-green-100 text-green-800 border-green-300",
      description: "NASA Near-Earth Object database with observational data",
    },
  };

  const sourceConfig = config[source];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`${sourceConfig.color} cursor-help ${className}`}
          >
            <Database className="w-3 h-3 mr-1" />
            {sourceConfig.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm max-w-xs">{sourceConfig.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface MissingDataWarningProps {
  missingFields: string[];
  severity: "info" | "warning" | "error";
  className?: string;
}

/**
 * Display warning when using default values for missing data
 */
export function MissingDataWarning({
  missingFields,
  severity = "warning",
  className = "",
}: MissingDataWarningProps) {
  if (missingFields.length === 0) return null;

  const getSeverityConfig = (level: string) => {
    switch (level) {
      case "info":
        return {
          color: "text-blue-600",
          bgColor: "bg-blue-900/5",
          borderColor: "border-blue-200",
          icon: Info,
        };
      case "warning":
        return {
          color: "text-yellow-600",
          bgColor: "bg-yellow-900/5",
          borderColor: "border-yellow-200",
          icon: AlertTriangle,
        };
      case "error":
        return {
          color: "text-red-600",
          bgColor: "bg-red-900/5",
          borderColor: "border-red-200",
          icon: XCircle,
        };
      default:
        return {
          color: "text-gray-600",
          bgColor: "bg-gray-900/5",
          borderColor: "border-gray-200",
          icon: Info,
        };
    }
  };

  const config = getSeverityConfig(severity);
  const Icon = config.icon;

  return (
    <Alert className={`${config.bgColor} ${config.borderColor} ${className}`}>
      <Icon className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-2">
          <p className={`text-sm font-medium ${config.color}`}>
            Using default values for missing data
          </p>
          <div className="flex flex-wrap gap-1">
            {missingFields.map((field) => (
              <Badge key={field} variant="outline" className="text-xs">
                {field}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-gray-600">
            Calculations may be less accurate. Consider using asteroids with
            more complete data for critical analyses.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
}
