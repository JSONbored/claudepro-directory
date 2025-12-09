'use client';

import { useCopyToClipboard } from '@heyclaude/web-runtime/hooks';
import { Copy, Check } from '@heyclaude/web-runtime/icons';
import { logClientErrorBoundary } from '@heyclaude/web-runtime/logging/client';
import { UI_CLASSES, Button } from '@heyclaude/web-runtime/ui';
import { useEffect } from 'react';

/**
 * CRITICAL: Direct reference to process.env.NODE_ENV
 * Next.js inlines this at build time. Do NOT use dynamic env lookups here!
 */
// eslint-disable-next-line architectural-rules/require-env-validation-schema
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * ErrorCodeBlock component with copy-to-clipboard functionality
 * @param root0
 * @param root0.content
 
 * @returns {unknown} Description of return value*/
function ErrorCodeBlock({ content }: { content: string }) {
  const { copied, copy } = useCopyToClipboard({
    context: { component: 'GlobalError', action: 'copy-error' },
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
 * Top-level error boundary component that logs unhandled errors and renders a critical fallback UI.
 *
 * @param error - The caught Error object; may include an optional `digest` string used for observability.
 * @param error.error
 * @param reset - Callback to reset the error boundary and attempt to recover the application.
 * @param error.reset
 * @returns The fallback React element displayed when a global unhandled error occurs.
 *
 * @see {@link logClientErrorBoundary}
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log critical global errors with digest for Vercel observability
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
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 font-sans">
          <div className="border-border bg-card max-w-md rounded-lg border p-8 text-center">
            <h2 className="text-destructive mb-4 text-2xl font-bold">Application Error</h2>
            <p className="text-muted-foreground mb-6">
              A critical error occurred. Please refresh the page or try again later.
            </p>
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
            <button
              type="button"
              onClick={reset}
              className={`bg-primary cursor-pointer rounded-md border-none ${UI_CLASSES.CONTAINER_PADDING_SM} text-primary-foreground hover:bg-primary/90 text-base transition-colors`}
            >
              Reset Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
