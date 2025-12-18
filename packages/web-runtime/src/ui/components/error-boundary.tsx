'use client';

/**
 * ErrorBoundary Component
 *
 * Generic error boundary with structured logging
 * Uses web-runtime UI primitives directly
 * Matches design system with Motion.dev animations
 */

import { isDevelopment } from '@heyclaude/shared-runtime/schemas/env';

import { AlertCircle, Home, RefreshCw, Copy, Check } from '../../icons.tsx';
import type {
  ErrorBoundaryProps,
  ErrorFallbackProps,
} from '../../types/component.types.ts';
import { createErrorBoundaryFallback } from '../../client/error-handler.ts';
// Removed deprecated responsive utility - using direct Tailwind classes
import { useCopyToClipboard } from '../../hooks/index.ts';
import { Button } from './button.tsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card.tsx';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import type { FallbackProps } from 'react-error-boundary';
import { SPRING } from '../../design-system/index.ts';
import { motion } from 'motion/react';
import { useCallback } from 'react';
import type { ComponentType } from 'react';
import { useBoolean } from '../../hooks/index.ts';
import Link from 'next/link';
import { ROUTES } from '@heyclaude/shared-runtime';

/**
 * ErrorCodeBlock component with copy-to-clipboard functionality
 */
function ErrorCodeBlock({ content }: { content: string }) {
  const { copied, copy } = useCopyToClipboard({
    context: { component: 'ErrorBoundary', action: 'copy-error' },
  });

  return (
    <div className="relative">
      <pre className="text-destructive bg-background/50 border-border max-w-full rounded border p-3 pr-10 font-mono text-xs break-all whitespace-pre-wrap">
        {content}
      </pre>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-6 w-6 p-0"
        onClick={() => {
          void copy(content);
        }}
        aria-label={copied ? 'Copied!' : 'Copy error message'}
      >
        {copied ? (
          <Check className="h-3 w-3 text-green-500" aria-hidden="true" />
        ) : (
          <Copy className="h-3 w-3" aria-hidden="true" />
        )}
      </Button>
    </div>
  );
}

/**
 * ErrorFallback component using web-runtime UI primitives
 * Matches design system with Motion.dev animations and consistent styling
 */
function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  const { value: isResetting, setTrue: setIsResettingTrue } = useBoolean();

  const handleReset = useCallback(() => {
    setIsResettingTrue();
    resetErrorBoundary();
    window.location.reload();
  }, [resetErrorBoundary, setIsResettingTrue]);

  return (
    <motion.div
      className="bg-background flex min-h-screen items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={SPRING.smooth}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={SPRING.smooth}
      >
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <div className="mb-4 flex justify-center">
              <motion.div
                className="bg-destructive/10 rounded-full p-3"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ ...SPRING.bouncy, delay: 0.1 }}
              >
                <AlertCircle aria-hidden="true" className="text-destructive h-12 w-12" />
              </motion.div>
            </div>
            <CardTitle className="text-2xl">Something went wrong</CardTitle>
            <CardDescription>
              An unexpected error occurred. We&apos;ve logged the issue and will investigate it
              shortly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isDevelopment && error && (
              <motion.div
                className="bg-muted rounded-md p-4 text-left"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...SPRING.smooth, delay: 0.2 }}
              >
                <ErrorCodeBlock content={error.toString()} />
                {error.stack && (
                  <details className="mt-2 text-xs">
                    <summary className="cursor-pointer font-semibold">► Stack Trace</summary>
                    <div className="mt-2">
                      <ErrorCodeBlock content={error.stack} />
                    </div>
                  </details>
                )}
              </motion.div>
            )}

            <motion.div
              className="flex flex-col gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...SPRING.smooth, delay: 0.3 }}
            >
              <Button onClick={handleReset} size="lg" disabled={isResetting}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isResetting ? 'animate-spin' : ''}`} />
                {isResetting ? 'Retrying...' : 'Try Again'}
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={ROUTES.HOME}>
                  <Home className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
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

  const Fallback = fallback || ErrorFallback;

  // Type assertion needed due to React 19 compatibility issue with react-error-boundary types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ErrorBoundaryComponent = ReactErrorBoundary as any as ComponentType<{
    fallbackRender: (props: FallbackProps) => React.ReactElement;
    onError: (error: Error, errorInfo: { componentStack?: string | null }) => void;
    children: React.ReactNode;
  }>;

  return (
    <ErrorBoundaryComponent
      fallbackRender={({ error, resetErrorBoundary }: FallbackProps) => (
        <Fallback error={error} resetErrorBoundary={resetErrorBoundary} />
      )}
      onError={handleError}
    >
      {children}
    </ErrorBoundaryComponent>
  );
}
