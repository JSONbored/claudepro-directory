'use client';

import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { SPRING } from '@heyclaude/web-runtime/design-system';
import { useCopyToClipboard } from '@heyclaude/web-runtime/hooks';
import { AlertCircle, Check, Copy, Home, RefreshCw, Search } from '@heyclaude/web-runtime/icons';
import { logClientErrorBoundary } from '@heyclaude/web-runtime/logging/client';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  UI_CLASSES,
} from '@heyclaude/web-runtime/ui';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * CRITICAL: Direct reference to process.env.NODE_ENV
 * Next.js inlines this at build time. Do NOT use dynamic env lookups here!
 * The shared-runtime isDevelopment uses dynamic lookup which doesn't work client-side.
 *
 * HMR Issue: The process polyfill can cause HMR errors. Next.js should inline this,
 * but if HMR errors occur, it may be a Turbopack/webpack configuration issue.
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
        size="sm"
        variant="ghost"
        onClick={() => {
          void copy(content);
        }}
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
  const [isResetting, setIsResetting] = useState(false);

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

  const handleReset = () => {
    setIsResetting(true);
    reset();
  };

  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="bg-background flex min-h-screen items-center justify-center px-4"
      initial={{ opacity: 0 }}
      transition={SPRING.smooth}
    >
      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        initial={{ opacity: 0, scale: 0.95 }}
        transition={SPRING.smooth}
      >
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <div className="mb-4 flex justify-center">
              <motion.div
                animate={{ rotate: 0, scale: 1 }}
                className="bg-destructive/10 rounded-full p-3"
                initial={{ rotate: -180, scale: 0 }}
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
            {isDevelopment && error.message ? (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="bg-muted rounded-md p-4 text-left"
                initial={{ opacity: 0, y: 10 }}
                transition={{ ...SPRING.smooth, delay: 0.2 }}
              >
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
              </motion.div>
            ) : null}

            <motion.div
              animate={{ opacity: 1 }}
              className={UI_CLASSES.FLEX_COL_SM_ROW_GAP_3}
              initial={{ opacity: 0 }}
              transition={{ ...SPRING.smooth, delay: 0.3 }}
            >
              <Button disabled={isResetting} onClick={handleReset} size="lg">
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

            <motion.div
              animate={{ opacity: 1 }}
              className="text-muted-foreground text-sm"
              initial={{ opacity: 0 }}
              transition={{ ...SPRING.smooth, delay: 0.4 }}
            >
              <p className="mb-2">Or explore:</p>
              <div className={`flex ${UI_CLASSES.FLEX_WRAP_GAP_2} justify-center`}>
                <Link className="hover:text-primary transition-colors" href={ROUTES.AGENTS}>
                  Agents
                </Link>
                <span>•</span>
                <Link className="hover:text-primary transition-colors" href={ROUTES.MCP}>
                  MCP Servers
                </Link>
                <span>•</span>
                <Link className="hover:text-primary transition-colors" href={ROUTES.GUIDES}>
                  <Search className="mr-1 inline h-3 w-3" />
                  Guides
                </Link>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
