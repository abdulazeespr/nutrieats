"use client";

import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

/**
 * React class-based error boundary.
 * Wrap any subtree that should degrade gracefully:
 *
 *   <ErrorBoundary>
 *     <SomeComponent />
 *   </ErrorBoundary>
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production you would send this to an error-tracking service
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: "" });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return <>{this.props.fallback}</>;

      return (
        <div
          role="alert"
          className="flex flex-col items-center justify-center min-h-[30vh] px-4 text-center"
        >
          <span className="text-5xl mb-4 select-none" aria-hidden="true">
            😕
          </span>
          <h2 className="text-lg font-semibold text-gray-800">
            Something went wrong
          </h2>
          {this.state.message && (
            <p className="text-sm text-gray-500 mt-1 max-w-xs">
              {this.state.message}
            </p>
          )}
          <button
            onClick={this.handleReset}
            className="mt-6 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
