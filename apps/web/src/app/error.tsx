'use client';

import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { useCopyToClipboard } from '@heyclaude/web-runtime/hooks';
import { AlertCircle, Check, Copy, Home, RefreshCw, Search } from '@heyclaude/web-runtime/icons';
import { logClientErrorBoundary } from '@heyclaude/web-runtime/logging/client';
import { Button, Card, UI_CLASSES } from '@heyclaude/web-runtime/ui';
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
 * ErrorCodeBlock component with copy-to-clipboard functionality
 * @param root0
 * @param root0.content
 
 * @returns {unknown} Description of return value*/
function ErrorCodeBlock({ content }: { content: string }) {
  const { copied, copy } = useCopyToClipboard({
    context: { action: 'copy-error', component: 'ErrorBoundary' },
  });

  return (
    <div className="relative">
      <pre className="text-destructive bg-background/50 border-border max-w-full rounded border p-3 pr-10 font-mono text-xs break-all whitespace-pre-wrap">
        {content}
      </pre>
      <Button
        aria-label={copied ? 'Copied!' : 'Copy error message'}
        className="absolute top-2 right-2 h-6 w-6 p-0"
        onClick={() => {
          void copy(content);
        }}
        size="sm"
        variant="ghost"
      >
        {copied ? (
          <Check aria-hidden="true" className="h-3 w-3 text-green-500" />
        ) : (
          <Copy aria-hidden="true" className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
}

/**
 * Render a full-screen error UI for uncaught client-side errors and log the error to the monitoring backend.
 *
 * Shows a generic message with action buttons, and when NODE_ENV is "development" displays the error message and optional digest for debugging.
 *
 * @param error - The caught error object; may include an optional `digest` string used for diagnostic correlation.
 * @param error.error
 * @param reset - Callback invoked to attempt recovery (for example, retry or re-render) when the user clicks "Try Again".
 * @param error.reset
 * @returns A React element presenting the error boundary UI.
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
        segment: 'global-error',
        url: globalThis.location.href,
        userAgent: globalThis.navigator.userAgent,
      }
    );
  }, [error]);

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-lg p-8 text-center">
        <div className="mb-6">
          <div className="mb-4 flex justify-center">
            <div className="bg-destructive/10 rounded-full p-3">
              <AlertCircle aria-hidden="true" className="text-destructive h-12 w-12" />
            </div>
          </div>
          <h1 className="mb-2 text-2xl font-bold">Something went wrong</h1>
          <p className="text-muted-foreground">
            An unexpected error occurred. We&apos;ve logged the issue and will investigate it
            shortly.
          </p>
        </div>

        {isDevelopment && error.message ? (
          <div className="bg-muted mb-6 rounded-md p-4 text-left">
            <ErrorCodeBlock content={error.message} />
            {error.stack ? (
              <details className="mt-2 text-xs">
                <summary className="cursor-pointer font-semibold">► Stack Trace</summary>
                <div className="mt-2">
                  <ErrorCodeBlock content={error.stack} />
                </div>
              </details>
            ) : null}
            {error.digest ? (
              <p className="text-muted-foreground mt-2 font-mono text-xs break-words">
                Digest: {error.digest}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className={UI_CLASSES.FLEX_COL_SM_ROW_GAP_3}>
          <Button size="lg" onClick={reset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Link href={ROUTES.HOME}>
            <Button size="lg" variant="outline">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="text-muted-foreground mt-8 text-sm">
          <p className="mb-2">Or explore:</p>
          <div className={`flex ${UI_CLASSES.FLEX_WRAP_GAP_2} justify-center`}>
            <Link className="hover:text-primary" href={ROUTES.AGENTS}>
              Agents
            </Link>
            <span>•</span>
            <Link className="hover:text-primary" href={ROUTES.MCP}>
              MCP Servers
            </Link>
            <span>•</span>
            <Link className="hover:text-primary" href={ROUTES.GUIDES}>
              <Search className="mr-1 inline h-3 w-3" />
              Guides
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
