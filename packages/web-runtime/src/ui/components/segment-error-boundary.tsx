'use client';

/**
 * Segment Error Boundary Factory
 *
 * Creates consistent error boundary components for Next.js route segments.
 * Eliminates duplication across 14+ error.tsx files while maintaining
 * segment-specific messaging and logging.
 *
 * Usage:
 * ```tsx
 * // In error.tsx
 * export { createSegmentErrorBoundary({
 *   segment: 'jobs',
 *   title: 'Jobs page unavailable',
 *   description: 'We ran into an issue loading the latest roles.',
 *   links: [
 *     { href: '/jobs', label: 'View jobs', variant: 'default' },
 *     { href: '/', label: 'Back to home', variant: 'outline' },
 *   ],
 * }) as default };
 * ```
 */

import { isDevelopment } from '@heyclaude/shared-runtime/schemas/env';

import { logClientErrorBoundary, logClientWarn } from '../../utils/client-logger.ts';
import { usePulse } from '../../hooks/use-pulse.ts';
// Design System imports
import { responsive, padding, marginTop, marginBottom } from '../../design-system/styles/layout.ts';
import { size as textSize } from '../../design-system/styles/typography.ts';
import { radius } from '../../design-system/styles/radius.ts';
import { Button } from './button.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './card.tsx';
import Link from 'next/link';
import { useCallback, useEffect } from 'react';

/**
 * Link configuration for error fallback navigation
 */
export interface SegmentErrorLink {
  href: string;
  label: string;
  variant?: 'default' | 'outline' | 'ghost';
}

/**
 * Configuration for creating a segment error boundary
 */
export interface SegmentErrorBoundaryConfig {
  /** Unique segment identifier for logging (e.g., 'jobs', 'account', 'search') */
  segment: string;
  /** User-facing title displayed in the error card */
  title: string;
  /** User-facing description explaining what went wrong */
  description: string;
  /** Text for the reset/retry button (default: 'Try again') */
  resetText?: string;
  /** Navigation links to show in the error UI */
  links?: SegmentErrorLink[];
}

/**
 * Props passed to Next.js error boundary components
 */
export interface NextErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Internal component that renders the error UI
 */
function SegmentErrorFallbackUI({
  config,
  error,
  reset,
}: {
  config: SegmentErrorBoundaryConfig;
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { segment, title, description, resetText = 'Try again', links = [] } = config;
  const pulse = usePulse();

  /**
   * Handle reset with recovery tracking.
   * Tracks the error boundary recovery event before calling reset.
   */
  const handleReset = useCallback(() => {
    // Track recovery attempt via click interaction
    pulse
      .click({
        category: null, // Not content-specific
        slug: null,
        metadata: {
          action: 'error_boundary_recovery',
          segment,
          errorDigest: error.digest ?? 'unknown',
          route: globalThis.location.pathname,
        },
      })
      .catch((trackingError: unknown) => {
        logClientWarn(
          'Error boundary recovery tracking failed',
          trackingError,
          'SegmentErrorBoundary.handleReset'
        );
      });

    // Proceed with reset
    reset();
  }, [pulse, segment, error.digest, reset]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className={textSize['2xl']}>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleReset} className="w-full sm:w-auto">
            {resetText}
          </Button>

          {links.length > 0 && (
            <div className={responsive.smRowGap}>
              {links.map((link) => (
                <Button
                  key={`${link.href}-${link.label}`}
                  asChild={true}
                  variant={link.variant ?? 'outline'}
                  className="w-full sm:w-auto"
                >
                  <Link href={link.href}>{link.label}</Link>
                </Button>
              ))}
            </div>
          )}

          {isDevelopment && error && (
            <div className={`${radius.lg} border border-muted-foreground/30 border-dashed bg-muted/30 ${padding.default}`}>
              <p className={`${marginBottom.compact} font-semibold text-muted-foreground ${textSize.sm}`}>
                Error details
              </p>
              <pre className={`wrap-break-word whitespace-pre-wrap text-destructive ${textSize.xs}`}>
                {error.message}
              </pre>
              {error.digest && (
                <p className={`${marginTop.compact} font-mono text-muted-foreground ${textSize.xs}`}>
                  Digest: {error.digest}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Creates a segment-specific error boundary component for Next.js route segments.
 *
 * This factory function generates consistent error boundary components that:
 * - Log errors with segment-specific context
 * - Display user-friendly error messages
 * - Provide navigation options to recover
 * - Show debug info in development mode
 *
 * @param config - Configuration for the error boundary
 * @returns A React component suitable for use as a Next.js error.tsx default export
 *
 * @example
 * ```tsx
 * // apps/web/src/app/jobs/error.tsx
 * import { createSegmentErrorBoundary } from '@heyclaude/web-runtime/ui';
 *
 * export default createSegmentErrorBoundary({
 *   segment: 'jobs',
 *   title: 'Jobs page unavailable',
 *   description: 'We ran into an issue loading the latest roles.',
 *   resetText: 'Retry jobs',
 *   links: [
 *     { href: '/jobs', label: 'View jobs', variant: 'default' },
 *     { href: '/', label: 'Back to home', variant: 'outline' },
 *   ],
 * });
 * ```
 */
export function createSegmentErrorBoundary(config: SegmentErrorBoundaryConfig) {
  const { segment } = config;

  // Return a named component for better debugging
  function SegmentErrorBoundary({ error, reset }: NextErrorBoundaryProps) {
    useEffect(() => {
      logClientErrorBoundary(
        `${segment} error boundary triggered`,
        error,
        globalThis.location.pathname,
        error.stack ?? '',
        {
          errorDigest: error.digest,
          userAgent: globalThis.navigator.userAgent,
          url: globalThis.location.href,
          segment,
        }
      );
    }, [error]);

    return <SegmentErrorFallbackUI config={config} error={error} reset={reset} />;
  }

  // Set display name for React DevTools
  SegmentErrorBoundary.displayName = `${segment.charAt(0).toUpperCase() + segment.slice(1)}ErrorBoundary`;

  return SegmentErrorBoundary;
}

/**
 * Pre-configured error boundary for generic segments
 * Can be used directly when no customization is needed
 */
export const GenericSegmentError = createSegmentErrorBoundary({
  segment: 'page',
  title: 'Page unavailable',
  description: 'We encountered an unexpected issue. Please try again.',
  links: [{ href: '/', label: 'Back to home', variant: 'outline' }],
});
