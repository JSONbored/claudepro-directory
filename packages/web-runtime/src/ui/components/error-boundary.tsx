'use client';

/**
 * ErrorBoundary Component
 *
 * Generic error boundary with structured logging
 * Uses web-runtime UI primitives directly
 */

import { AlertTriangle, Home, RefreshCw } from '../../icons.tsx';
import type {
  ErrorBoundaryProps,
  ErrorFallbackProps,
} from '../../types/component.types.ts';
import { createErrorBoundaryFallback } from '../../client/error-handler.ts';
import { UI_CLASSES } from '../../ui/constants.ts';
import { Button } from './button.tsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card.tsx';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { useCallback } from 'react';

// Client-safe environment check - doesn't trigger server env validation
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * ErrorFallback component using web-runtime UI primitives
 */
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

/**
 * ErrorBoundary component using web-runtime UI primitives directly
 */
export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  const handleError = useCallback(
    (error: Error, errorInfo: { componentStack?: string | null }) => {
      // Use centralized error handler for consistent logging and tracking
      createErrorBoundaryFallback(error, {
        componentStack: errorInfo.componentStack || '',
      });
    },
    []
  );

  return (
    <ReactErrorBoundary
      FallbackComponent={fallback || ErrorFallback}
      onError={handleError}
    >
      {children}
    </ReactErrorBoundary>
  );
}
