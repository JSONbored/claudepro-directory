'use client';

import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { AlertCircle, Home, RefreshCw, Search } from '@heyclaude/web-runtime/icons';
import { logClientErrorBoundary } from '@heyclaude/web-runtime/logging/client';
import { UI_CLASSES, Button , Card  } from '@heyclaude/web-runtime/ui';
import Link from 'next/link';
import { useEffect } from 'react';

/**
 * CRITICAL: Direct reference to process.env.NODE_ENV
 * Next.js inlines this at build time. Do NOT use dynamic env lookups here!
 * The shared-runtime isDevelopment uses dynamic lookup which doesn't work client-side.
 */
// eslint-disable-next-line architectural-rules/require-env-validation-schema -- NODE_ENV is inlined by Next.js at build time, not a runtime lookup
const isDevelopment = process.env.NODE_ENV === 'development';


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
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-lg p-8 text-center">
        <div className="mb-6">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertCircle className="h-12 w-12 text-destructive" aria-hidden="true" />
            </div>
          </div>
          <h1 className="mb-2 font-bold text-2xl">Something went wrong</h1>
          <p className="text-muted-foreground">
            An unexpected error occurred. We've logged the issue and will investigate it shortly.
          </p>
        </div>

        {isDevelopment && error.message ? <div className="mb-6 rounded-md bg-muted p-4 text-left">
            <p className="font-mono text-destructive text-xs">{error.message}</p>
            {error.digest ? <p className="mt-2 font-mono text-muted-foreground text-xs">Digest: {error.digest}</p> : null}
          </div> : null}

        <div className={UI_CLASSES.FLEX_COL_SM_ROW_GAP_3}>
          <Button onClick={reset} size="lg">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Link href={ROUTES.HOME}>
            <Button variant="outline" size="lg">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="mt-8 text-muted-foreground text-sm">
          <p className="mb-2">Or explore:</p>
          <div className={`flex ${UI_CLASSES.FLEX_WRAP_GAP_2} justify-center`}>
            <Link href={ROUTES.AGENTS} className="hover:text-primary">
              Agents
            </Link>
            <span>•</span>
            <Link href={ROUTES.MCP} className="hover:text-primary">
              MCP Servers
            </Link>
            <span>•</span>
            <Link href={ROUTES.GUIDES} className="hover:text-primary">
              <Search className="mr-1 inline h-3 w-3" />
              Guides
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
