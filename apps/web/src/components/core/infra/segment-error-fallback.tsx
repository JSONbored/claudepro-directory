'use client';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { useCopyToClipboard } from '@heyclaude/web-runtime/hooks/use-copy-to-clipboard';
import { Copy, Check, AlertCircle, RefreshCw } from '@heyclaude/web-runtime/icons';
import { SPRING } from '@heyclaude/web-runtime/design-system';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useBoolean } from '@heyclaude/web-runtime/hooks/use-boolean';

/**
 * CRITICAL: Direct reference to process.env.NODE_ENV
 * Next.js inlines this at build time. Do NOT use dynamic env lookups here!
 * The shared-runtime isDevelopment uses dynamic lookup which doesn't work client-side.
 */
// eslint-disable-next-line architectural-rules/require-env-validation-schema -- NODE_ENV is inlined by Next.js at build time, not a runtime lookup
const isDevelopment = process.env.NODE_ENV === 'development';

interface FallbackLink {
  href: string;
  label: string;
  variant?: 'default' | 'ghost' | 'outline';
}

interface SegmentErrorFallbackProps {
  description: string;
  error?: Error & { digest?: string };
  links?: FallbackLink[];
  onReset?: () => void;
  resetText?: string;
  title: string;
}

function ErrorCodeBlock({ content }: { content: string }) {
  const { copied, copy } = useCopyToClipboard({
    context: { component: 'SegmentErrorFallback', action: 'copy-error' },
  });

  if (!content) return null;

  return (
    <div className="relative">
      <pre className="border-border bg-background/50 text-destructive max-w-full rounded-lg border p-3 pr-10 text-xs break-all whitespace-pre-wrap">
        {content}
      </pre>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-6 w-6 p-4"
        onClick={() => copy(content)}
        aria-label={copied ? 'Copied!' : 'Copy error message'}
      >
        {copied ? (
          <Check className="h-3 w-3 text-success" aria-hidden="true" />
        ) : (
          <Copy className="h-3 w-3" aria-hidden="true" />
        )}
      </Button>
    </div>
  );
}

export function SegmentErrorFallback({
  title,
  description,
  resetText = 'Try again',
  onReset,
  links = [],
  error,
}: SegmentErrorFallbackProps) {
  const { value: isResetting, setTrue: setIsResettingTrue } = useBoolean();

  const handleReset = () => {
    setIsResettingTrue();
    onReset?.();
  };

  return (
    <motion.div
      className={`flex min-h-[60vh] items-center justify-center px-4 py-12`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
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
                <AlertCircle className="text-destructive h-12 w-12" aria-hidden="true" />
              </motion.div>
            </div>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {onReset ? (
              <motion.div
                className={`flex flex-col gap-3 sm:flex-row sm:gap-4`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ ...SPRING.smooth, delay: 0.3 }}
              >
                <Button
                  onClick={handleReset}
                  size="lg"
                  className="w-full sm:w-auto"
                  disabled={isResetting}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isResetting ? 'animate-spin' : ''}`} />
                  {isResetting ? 'Retrying...' : resetText}
                </Button>
              </motion.div>
            ) : null}
            {links.length > 0 && (
              <motion.div
                className={`flex flex-col gap-3 sm:flex-row sm:gap-4`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ ...SPRING.smooth, delay: 0.3 }}
              >
                {links.map((link, index) => (
                  <motion.div
                    key={`${link.href}-${link.label}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...SPRING.smooth, delay: 0.35 + index * 0.05 }}
                  >
                    <Button
                      asChild
                      size="lg"
                      variant={link.variant ?? 'outline'}
                      className="w-full sm:w-auto"
                    >
                      <Link href={link.href}>{link.label}</Link>
                    </Button>
                  </motion.div>
                ))}
              </motion.div>
            )}
            {isDevelopment && error ? (
              <motion.div
                className="card-base border-muted-foreground/30 bg-muted/30 border-dashed p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...SPRING.smooth, delay: 0.4 }}
              >
                <p className="text-muted-foreground mb-2 text-sm font-semibold">Error details</p>
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
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
