'use client';

import { AlertTriangle, Home, RefreshCw } from '@heyclaude/web-runtime/icons';
import type {
  ErrorBoundaryProps,
  ErrorFallbackProps,
} from '@heyclaude/web-runtime/types/component.types';
import { createErrorBoundaryFallback, UI_CLASSES } from '@heyclaude/web-runtime/ui';
import { useCallback } from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { Button } from '@/src/components/primitives/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';

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
            <AlertTriangle
              className={`${UI_CLASSES.ICON_XL} text-destructive`}
              aria-hidden="true"
            />
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
              <RefreshCw className={UI_CLASSES.ICON_SM_LEADING} />
              Try Again
            </Button>
            <Button onClick={handleGoHome} variant="outline">
              <Home className={UI_CLASSES.ICON_SM_LEADING} />
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
    createErrorBoundaryFallback(error, {
      componentStack: errorInfo.componentStack || '',
    });
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
