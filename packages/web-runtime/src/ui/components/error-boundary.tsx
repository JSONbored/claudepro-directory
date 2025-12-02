'use client';

/**
 * ErrorBoundary Component
 *
 * Generic error boundary with structured logging
 * Uses web-runtime UI primitives directly
 */

import { isDevelopment } from '@heyclaude/shared-runtime/schemas/env';

import { AlertTriangle, Home, RefreshCw } from '../../icons.tsx';
import type { ErrorBoundaryProps } from '../../types/component.types.ts';
import { createErrorBoundaryFallback } from '../../client/error-handler.ts';
// Design System imports
import { cluster, gap, padding, marginTop } from '../../design-system/styles/layout.ts';
import { iconSize, iconLeading } from '../../design-system/styles/icons.ts';
import { size } from '../../design-system/styles/typography.ts';
import { radius } from '../../design-system/styles/radius.ts';
import { Button } from './button.tsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card.tsx';
import { ErrorBoundary as ReactErrorBoundary, type FallbackProps } from 'react-error-boundary';
import type { ReactNode } from 'react';
import { useCallback } from 'react';

/**
 * ErrorFallback component using web-runtime UI primitives
 */
function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const handleGoHome = useCallback(() => {
    resetErrorBoundary();
    window.location.href = '/';
  }, [resetErrorBoundary]);

  const handleReset = useCallback(() => {
    resetErrorBoundary();
    window.location.reload();
  }, [resetErrorBoundary]);

  return (
    <div className={`flex min-h-screen items-center justify-center bg-background ${padding.default}`}>
      <Card className={'w-full max-w-2xl'}>
        <CardHeader>
          <div className={cluster.default}>
            <AlertTriangle
              className={`${iconSize.xl} text-destructive`}
              aria-hidden="true"
            />
            <CardTitle as="h1" className={size['2xl']}>
              Something went wrong
            </CardTitle>
          </div>
          <CardDescription className={marginTop.compact}>
            An unexpected error occurred. The error has been logged and we&apos;ll look into it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDevelopment && error && (
            <div className={`space-y-2 ${radius.lg} bg-muted ${padding.default}`}>
              <p className={`font-semibold ${size.sm}`}>Error Details:</p>
              <pre className={`overflow-auto ${size.xs}`}>{error.toString()}</pre>
              {error.stack && (
                <details className={size.xs}>
                  <summary className="cursor-pointer font-semibold">Stack Trace</summary>
                  <pre className={`${marginTop.compact} overflow-auto`}>{error.stack}</pre>
                </details>
              )}
            </div>
          )}

          <div className={`flex ${gap.default}`}>
            <Button onClick={handleReset} variant="default">
              <RefreshCw className={iconLeading.sm} />
              Try Again
            </Button>
            <Button onClick={handleGoHome} variant="outline">
              <Home className={iconLeading.sm} />
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
 * 
 * Note: Type cast is needed for react-error-boundary v6 compatibility with React 19.
 * This is a known temporary issue as the library updates its types for React 19.
 */
export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps): ReactNode {
  const handleError = useCallback(
    (error: Error, errorInfo: { componentStack?: string | null }) => {
      // Use centralized error handler for consistent logging and tracking
      createErrorBoundaryFallback(error, {
        componentStack: errorInfo.componentStack || '',
      });
    },
    []
  );

  const FallbackComponent = (fallback as React.ComponentType<FallbackProps>) ?? ErrorFallback;

  // Cast to work around react-error-boundary v6 / React 19 type incompatibility
  // The component works correctly at runtime; only the types need this workaround
  const BoundaryComponent = ReactErrorBoundary as unknown as React.ComponentType<{
    FallbackComponent: React.ComponentType<FallbackProps>;
    onError: (error: Error, errorInfo: { componentStack?: string | null }) => void;
    children: ReactNode;
  }>;

  return (
    <BoundaryComponent
      FallbackComponent={FallbackComponent}
      onError={handleError}
    >
      {children}
    </BoundaryComponent>
  );
}
