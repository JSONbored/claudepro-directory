'use client';

import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import {
  bgColor,
  gap,
  iconSize,
  alignItems,
  justify,
  marginBottom,
  marginTop,
  maxWidth,
  minHeight,
  muted,
  padding,
  radius,
  responsive,
  size,
  textColor,
  weight,
  flexWrap,
} from '@heyclaude/web-runtime/design-system';
import { AlertCircle, Home, RefreshCw, Search } from '@heyclaude/web-runtime/icons';
import { logClientErrorBoundary } from '@heyclaude/web-runtime/logging/client';
import { Button, Card } from '@heyclaude/web-runtime/ui';
import Link from 'next/link';
import { useEffect } from 'react';

/**
 * CRITICAL: Direct reference to process.env.NODE_ENV
 * Next.js inlines this at build time. Do NOT use dynamic env lookups here!
 * The shared-runtime isDevelopment uses dynamic lookup which doesn't work client-side.
 */
// eslint-disable-next-line architectural-rules/require-env-validation-schema -- NODE_ENV is inlined by Next.js at build time, not a runtime lookup
const isDevelopment = process.env.NODE_ENV === 'development';


/**
 * Renders a full-screen error UI shown when an uncaught client-side error occurs and logs the error to the monitoring backend.
 *
 * Displays a descriptive message, development-only error details (when NODE_ENV is "development"), action buttons to retry or go home, and quick links to key sections.
 *
 * @param props.error - The caught error object; may include an optional `digest` string used for diagnostic correlation.
 * @param props.reset - Callback invoked to attempt recovery (e.g., retry or re-render) when the user clicks "Try Again".
 * @returns The error boundary React element to present to the user.
 *
 * @see logClientErrorBoundary
 * @see Card
 * @see ROUTES
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logClientErrorBoundary(
      'Global error boundary triggered',
      error,
      globalThis.location.pathname,
      error.stack ?? '',
      {
        errorDigest: error.digest,
        userAgent: globalThis.navigator.userAgent,
        url: globalThis.location.href,
        segment: 'global-error',
      }
    );
  }, [error]);

  return (
    <div className={`flex ${minHeight.screen} ${alignItems.center} ${justify.center} ${bgColor.background} ${padding.xDefault}`}>
      <Card className={`w-full ${maxWidth.lg} ${padding.relaxed} text-center`}>
        <div className={marginBottom.comfortable}>
          <div className={`${marginBottom.default} flex ${justify.center}`}>
            <div className={`${radius.full} ${bgColor['destructive/10']} ${padding.compact}`}>
              <AlertCircle className={`${iconSize['3xl']} ${textColor.destructive}`} aria-hidden="true" />
            </div>
          </div>
          <h1 className={`${marginBottom.tight} ${weight.bold} ${size['2xl']}`}>Something went wrong</h1>
          <p className={muted.default}>
            An unexpected error occurred. We've logged the issue and will investigate it shortly.
          </p>
        </div>

        {isDevelopment && error.message ? <div className={`${marginBottom.comfortable} ${radius.md} ${bgColor.muted} ${padding.default} text-left`}>
            <p className={`font-mono ${textColor.destructive} ${size.xs}`}>{error.message}</p>
            {error.digest ? <p className={`${marginTop.compact} font-mono ${muted.xs}`}>Digest: {error.digest}</p> : null}
          </div> : null}

        <div className={responsive.smRowGap}>
          <Button onClick={reset} size="lg">
            <RefreshCw className={`mr-2 ${iconSize.sm}`} />
            Try Again
          </Button>
          <Link href={ROUTES.HOME}>
            <Button variant="outline" size="lg">
              <Home className={`mr-2 ${iconSize.sm}`} />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className={`${marginTop.relaxed} ${muted.sm}`}>
          <p className={marginBottom.tight}>Or explore:</p>
          <div className={`flex ${flexWrap.wrap} ${gap.compact} ${justify.center}`}>
            <Link href={ROUTES.AGENTS} className="hover:text-primary">
              Agents
            </Link>
            <span>•</span>
            <Link href={ROUTES.MCP} className="hover:text-primary">
              MCP Servers
            </Link>
            <span>•</span>
            <Link href={ROUTES.GUIDES} className="hover:text-primary">
              <Search className={`mr-1 inline ${iconSize.xs}`} />
              Guides
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}