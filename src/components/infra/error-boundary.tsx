'use client';

import { useCallback } from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { Button } from '@/src/components/primitives/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/card';
import { createErrorBoundaryFallback } from '@/src/lib/error-handler/client';
import { AlertTriangle, Home, RefreshCw } from '@/src/lib/icons';
import type { ErrorBoundaryProps, ErrorFallbackProps } from '@/src/lib/types/component.types';
import { UI_CLASSES } from '@/src/lib/ui-constants';

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
    <div className={'flex min-h-screen items-center justify-center bg-background p-4'}>
      <Card className={'w-full max-w-2xl'}>
        <CardHeader>
          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_3}>
            <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
            <CardTitle as="h1" className="text-2xl">
              Something went wrong
            </CardTitle>
          </div>
          <CardDescription className="mt-2">
            An unexpected error occurred. The error has been logged and we&apos;ll look into it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDevelopment && error && (
            <div className={'space-y-2 rounded-lg bg-muted p-4'}>
              <p className={'font-semibold text-sm'}>Error Details:</p>
              <pre className={'overflow-auto text-xs'}>{error.toString()}</pre>
              {error.stack && (
                <details className="text-xs">
                  <summary className="cursor-pointer font-semibold">Stack Trace</summary>
                  <pre className={'mt-2 overflow-auto'}>{error.stack}</pre>
                </details>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={handleReset} variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button onClick={handleGoHome} variant="outline">
              <Home className="mr-2 h-4 w-4" />
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

    // Track error boundary triggers in Umami
    if (window?.umami) {
      window.umami.track('error_boundary_triggered', {
        error_type: error.name || 'Unknown',
        error_message: error.message?.substring(0, 100) || 'No message',
        page: window.location.pathname,
        component_stack_depth: errorInfo.componentStack?.split('\n').length || 0,
        request_id: errorResponse.requestId || null,
      });
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
