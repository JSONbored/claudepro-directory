'use client';

import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { SPRING, stack, wrap, gap, size, weight, padding, paddingX, marginBottom, spaceY, marginTop, marginRight } from '@heyclaude/web-runtime/design-system';
import { useBoolean, useCopyToClipboard } from '@heyclaude/web-runtime/hooks';
import { AlertCircle, Check, Copy, Home, RefreshCw, Search } from '@heyclaude/web-runtime/icons';
import { logClientErrorBoundary } from '@heyclaude/web-runtime/logging/client';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useEffect } from 'react';

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
      <pre className={`text-destructive bg-background/50 border-border max-w-full rounded border p-3 pr-10 font-mono ${size.xs} break-all whitespace-pre-wrap`}>
        {content}
      </pre>
      <Button
        aria-label={copied ? 'Copied!' : 'Copy error message'}
        className={`absolute top-2 right-2 h-6 w-6 ${padding.default}`}
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
  const { setTrue: setIsResettingTrue, value: isResetting } = useBoolean();

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
    setIsResettingTrue();
    reset();
  };

  return (
    <motion.div
      animate={{ opacity: 1 }}
      className={`bg-background flex min-h-screen items-center justify-center ${paddingX.default}`}
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
            <div className={`${marginBottom.default} flex justify-center`}>
              <motion.div
                animate={{ rotate: 0, scale: 1 }}
                className={`bg-destructive/10 rounded-full ${padding.compact}`}
                initial={{ rotate: -180, scale: 0 }}
                transition={{ ...SPRING.bouncy, delay: 0.1 }}
              >
                <AlertCircle aria-hidden="true" className="text-destructive h-12 w-12" />
              </motion.div>
            </div>
            <CardTitle className={`${size['2xl']}`}>Something went wrong</CardTitle>
            <CardDescription>
              An unexpected error occurred. We&apos;ve logged the issue and will investigate it
              shortly.
            </CardDescription>
          </CardHeader>
          <CardContent className={`${spaceY.comfortable}`}>
            {isDevelopment && error.message ? (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className={`bg-muted rounded-md ${padding.default} text-left`}
                initial={{ opacity: 0, y: 10 }}
                transition={{ ...SPRING.smooth, delay: 0.2 }}
              >
                <ErrorCodeBlock content={error.message} />
                {error.stack ? (
                  <details className={`${marginTop.compact} ${size.xs}`}>
                    <summary className={`cursor-pointer ${weight.semibold}`}>► Stack Trace</summary>
                    <div className={`${marginTop.compact}`}>
                      <ErrorCodeBlock content={error.stack} />
                    </div>
                  </details>
                ) : null}
                {error.digest ? (
                  <p className={`text-muted-foreground ${marginTop.compact} font-mono ${size.xs} break-words`}>
                    Digest: {error.digest}
                  </p>
                ) : null}
              </motion.div>
            ) : null}

            <motion.div
              animate={{ opacity: 1 }}
              className={`${stack.default} sm:flex-row sm:${gap.comfortable}`}
              initial={{ opacity: 0 }}
              transition={{ ...SPRING.smooth, delay: 0.3 }}
            >
              <Button disabled={isResetting} onClick={handleReset} size="lg">
                <RefreshCw className={`mr-2 h-4 w-4 ${isResetting ? 'animate-spin' : ''}`} />
                {isResetting ? 'Retrying...' : 'Try Again'}
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={ROUTES.HOME}>
                  <Home className={`${marginRight.tight} h-4 w-4`} />
                  Back to Home
                </Link>
              </Button>
            </motion.div>

            <motion.div
              animate={{ opacity: 1 }}
              className={`text-muted-foreground ${size.sm}`}
              initial={{ opacity: 0 }}
              transition={{ ...SPRING.smooth, delay: 0.4 }}
            >
              <p className={`${marginBottom.compact}`}>Or explore:</p>
              <div className={`flex ${wrap} ${gap.compact} justify-center`}>
                <Link className="hover:text-primary transition-colors" href={ROUTES.AGENTS}>
                  Agents
                </Link>
                <span>•</span>
                <Link className="hover:text-primary transition-colors" href={ROUTES.MCP}>
                  MCP Servers
                </Link>
                <span>•</span>
                <Link className="hover:text-primary transition-colors" href={ROUTES.GUIDES}>
                  <Search className={`${marginRight.micro} inline h-3 w-3`} />
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
