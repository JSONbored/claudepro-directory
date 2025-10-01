'use client';

import { useCallback } from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createErrorBoundaryFallback } from '@/lib/error-handler';
import { AlertTriangle, Home, RefreshCw } from '@/lib/icons';
import { umamiEventDataSchema } from '@/lib/schemas/analytics.schema';
import type { ErrorBoundaryProps, ErrorFallbackProps } from '@/lib/schemas/component.schema';

// Client-safe environment check - doesn't trigger server env validation
const isDevelopment = process.env.NODE_ENV === 'development';

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  const handleGoHome = useCallback(() => {
    resetErrorBoundary();
    window.location.href = '/';
  }, [resetErrorBoundary]);

  const handleReset = useCallback(() => {
    resetErrorBoundary();
    window.location.reload();
  }, [resetErrorBoundary]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <CardTitle className="text-2xl">Something went wrong</CardTitle>
          </div>
          <CardDescription className="mt-2">
            An unexpected error occurred. The error has been logged and we&apos;ll look into it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDevelopment && error && (
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <p className="font-semibold text-sm">Error Details:</p>
              <pre className="text-xs overflow-auto">{error.toString()}</pre>
              {error.stack && (
                <details className="text-xs">
                  <summary className="cursor-pointer font-semibold">Stack Trace</summary>
                  <pre className="mt-2 overflow-auto">{error.stack}</pre>
                </details>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={handleReset} variant="default">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={handleGoHome} variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  const handleError = useCallback((error: Error, errorInfo: { componentStack?: string | null }) => {
    // Use centralized error handler for consistent logging and tracking
    const errorResponse = createErrorBoundaryFallback(error, {
      componentStack: errorInfo.componentStack || '',
    });

    // Track error boundary triggers in Umami with validated data
    if (window?.umami) {
      const eventData = umamiEventDataSchema.safeParse({
        error_type: error.name || 'Unknown',
        error_message: error.message?.substring(0, 100) || 'No message',
        page: window.location.pathname,
        component_stack_depth: errorInfo.componentStack?.split('\n').length || 0,
        request_id: errorResponse.requestId || null,
      });

      if (eventData.success) {
        window.umami?.track('error_boundary_triggered', eventData.data);
      }
    }
  }, []);

  return (
    <ReactErrorBoundary
      FallbackComponent={fallback ? () => <>{fallback}</> : ErrorFallback}
      onError={handleError}
    >
      {children}
    </ReactErrorBoundary>
  );
}

// Custom hook for manually triggering error boundaries
// Note: For manual error throwing, use the standard React pattern:
// throw new Error('message') inside components to trigger the boundary
