'use client';

import { SPRING, size, weight, padding, spaceY, marginTop, marginBottom } from '@heyclaude/web-runtime/design-system';
import { useBoolean, useCopyToClipboard } from '@heyclaude/web-runtime/hooks';
import { AlertCircle, Check, Copy, RefreshCw } from '@heyclaude/web-runtime/icons';
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
import { useEffect } from 'react';

/**
 * CRITICAL: Direct reference to process.env.NODE_ENV
 * Next.js inlines this at build time. Do NOT use dynamic env lookups here!
 *
 * HMR Issue: The process polyfill can cause HMR errors. Next.js should inline this,
 * but if HMR errors occur, it may be a Turbopack/webpack configuration issue.
 */
// eslint-disable-next-line architectural-rules/require-env-validation-schema -- NODE_ENV is inlined by Next.js at build time
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * ErrorCodeBlock component with copy-to-clipboard functionality
 * @param root0
 * @param root0.content
 
 * @returns {unknown} Description of return value*/
function ErrorCodeBlock({ content }: { content: string }) {
  const { copied, copy } = useCopyToClipboard({
    context: { action: 'copy-error', component: 'GlobalError' },
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
  const { setTrue: setIsResettingTrue, value: isResetting } = useBoolean();

  useEffect(() => {
    // Log critical global errors with digest for Vercel observability
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
    <html lang="en">
      <body>
        <motion.div
          animate={{ opacity: 1 }}
          className={`flex min-h-screen flex-col items-center justify-center p-4 font-sans`}
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
                <CardTitle className={`${size['2xl']}`}>Application Error</CardTitle>
                <CardDescription>
                  A critical error occurred. Please refresh the page or try again later.
                </CardDescription>
              </CardHeader>
              <CardContent className={`${spaceY.comfortable}`}>
                {isDevelopment && error.message ? (
                  <div className={`bg-muted rounded-md ${padding.default} text-left`}>
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
                  </div>
                ) : null}
                <Button className="w-full" disabled={isResetting} size="lg" onClick={handleReset}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${isResetting ? 'animate-spin' : ''}`} />
                  {isResetting ? 'Resetting...' : 'Reset Application'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </body>
    </html>
  );
}
