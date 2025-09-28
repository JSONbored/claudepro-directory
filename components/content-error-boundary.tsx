'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  resetTimeoutId: number | null;
}

export class ContentErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      resetTimeoutId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    logger.error('Content Error Boundary caught an error', error, {
      componentStack: errorInfo.componentStack || 'Unknown',
      errorBoundary: true,
    });

    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Auto-reset after 10 seconds to attempt recovery
    this.resetTimeoutId = window.setTimeout(() => {
      this.resetErrorBoundary();
    }, 10000) as unknown as number;
  }

  componentDidUpdate(prevProps: Props) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error boundary when resetKeys change
    if (hasError && resetOnPropsChange && resetKeys) {
      const prevResetKeys = prevProps.resetKeys || [];
      const hasResetKeyChanged = resetKeys.some((resetKey, idx) => prevResetKeys[idx] !== resetKey);

      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      resetTimeoutId: null,
    });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Custom fallback UI
      if (fallback) {
        return fallback;
      }

      // Default fallback UI
      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.98-.833-2.75 0L3.732 19c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          <h3 className="mb-2 text-lg font-semibold text-red-900">Content Loading Error</h3>

          <p className="mb-4 text-sm text-red-700">
            {error?.message || 'An unexpected error occurred while loading content.'}
          </p>

          <div className="flex gap-2">
            <button
              onClick={this.resetErrorBoundary}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              type="button"
            >
              Try Again
            </button>

            <button
              onClick={() => window.location.reload()}
              className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              type="button"
            >
              Reload Page
            </button>
          </div>

          <p className="mt-4 text-xs text-red-600">
            This page will automatically retry in a few seconds.
          </p>
        </div>
      );
    }

    return children;
  }
}

/**
 * HOC for wrapping components with content error boundary
 */
export function withContentErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ContentErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ContentErrorBoundary>
  );

  WrappedComponent.displayName = `withContentErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Functional component wrapper for content error boundary
 */
interface ContentErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export function ContentErrorFallback({ error, resetErrorBoundary }: ContentErrorFallbackProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
      <div className="mb-6">
        <svg
          className="mx-auto h-16 w-16 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.469-1.009-5.927-2.616M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      </div>

      <h2 className="mb-3 text-xl font-semibold text-gray-900">Content Temporarily Unavailable</h2>

      <p className="mb-6 max-w-md text-gray-600">
        We're experiencing issues loading the content. This could be due to a temporary network
        issue or server maintenance.
      </p>

      <div className="mb-4 rounded-md bg-gray-100 p-3 text-left">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
          Error Details
        </p>
        <p className="text-sm text-gray-700 font-mono">{error.message}</p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={resetErrorBoundary}
          className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          type="button"
        >
          Retry Loading
        </button>

        <button
          onClick={() => {
            window.location.href = '/';
          }}
          className="rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          type="button"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}
