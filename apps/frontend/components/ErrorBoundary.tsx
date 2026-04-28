"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error);
    console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);
  }

  handleReset() {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return (
          <div onClick={this.handleReset} className="cursor-pointer">
            {this.props.fallback}
          </div>
        );
      }

      return (
        <div
          className={cn(
            "flex flex-col items-center justify-center gap-4 rounded-[var(--r-lg)] border border-border p-8 text-center",
            "bg-surface dark:bg-gray-800"
          )}
          role="alert"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-loss-muted dark:bg-red-900/30">
            <AlertTriangle className="h-6 w-6 text-loss dark:text-red-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-text-primary dark:text-gray-100">
              Une erreur est survenue
            </h3>
            <p className="text-sm text-text-secondary dark:text-gray-400 max-w-md">
              {this.state.error?.message || "Une erreur inattendue s'est produite."}
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className={cn(
              "inline-flex items-center gap-[6px] border-none rounded-[var(--r-md)] font-medium font-sans cursor-pointer transition-all duration-150 ease-out whitespace-nowrap",
              "bg-surface-raised text-text-primary border border-border hover:bg-surface",
              "px-4 py-2 text-[14px]"
            )}
          >
            <RefreshCw className="h-4 w-4" />
            Réessayer
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
