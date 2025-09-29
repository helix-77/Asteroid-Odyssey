"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      "Dashboard Error Boundary caught an error:",
      error,
      errorInfo
    );

    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            retry={this.handleRetry}
          />
        );
      }

      // Default error UI
      return (
        <div className="flex items-center justify-center h-full p-4">
          <Card className="bg-red-900/20 border-red-500/30 max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                Dashboard Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-red-200">
                <p className="mb-2">
                  An error occurred while loading the dashboard component.
                </p>
                {this.state.error && (
                  <details className="text-sm">
                    <summary className="cursor-pointer hover:text-red-100">
                      Error Details
                    </summary>
                    <pre className="mt-2 p-2 bg-red-950/50 rounded text-xs overflow-auto">
                      {this.state.error.message}
                    </pre>
                  </details>
                )}
              </div>
              <Button
                onClick={this.handleRetry}
                variant="outline"
                className="w-full bg-transparent border-red-500/50 text-red-300 hover:bg-red-900/30"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Specific error boundary for asteroid data operations
export function AsteroidDataErrorBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary
      fallback={({ error, retry }) => (
        <div className="p-4">
          <Card className="bg-yellow-900/20 border-yellow-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-400">
                <AlertTriangle className="h-5 w-5" />
                Asteroid Data Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-yellow-200">
                <p className="mb-2">
                  Failed to load or process asteroid data. This may be due to:
                </p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>Network connectivity issues</li>
                  <li>Corrupted data files</li>
                  <li>Invalid asteroid data format</li>
                  <li>Missing required asteroid properties</li>
                </ul>
              </div>
              <Button
                onClick={retry}
                variant="outline"
                className="w-full bg-transparent border-yellow-500/50 text-yellow-300 hover:bg-yellow-900/30"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload Asteroid Data
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      onError={(error, errorInfo) => {
        // Log asteroid data specific errors
        console.error("Asteroid Data Error:", {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// Specific error boundary for physics calculations
export function PhysicsCalculationErrorBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary
      fallback={({ error, retry }) => (
        <div className="p-4">
          <Card className="bg-orange-900/20 border-orange-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-400">
                <AlertTriangle className="h-5 w-5" />
                Physics Calculation Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-orange-200">
                <p className="mb-2">
                  An error occurred during physics calculations. This may be due
                  to:
                </p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>Invalid asteroid parameters</li>
                  <li>Missing composition data</li>
                  <li>Calculation overflow or underflow</li>
                  <li>Unsupported asteroid properties</li>
                </ul>
              </div>
              <Button
                onClick={retry}
                variant="outline"
                className="w-full bg-transparent border-orange-500/50 text-orange-300 hover:bg-orange-900/30"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Calculations
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      onError={(error, errorInfo) => {
        // Log physics calculation specific errors
        console.error("Physics Calculation Error:", {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;
