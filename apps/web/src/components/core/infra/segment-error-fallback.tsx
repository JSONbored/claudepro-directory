'use client';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  UI_CLASSES,
} from '@heyclaude/web-runtime/ui';
import Link from 'next/link';

/**
 * CRITICAL: Direct reference to process.env.NODE_ENV
 * Next.js inlines this at build time. Do NOT use dynamic env lookups here!
 * The shared-runtime isDevelopment uses dynamic lookup which doesn't work client-side.
 */
// eslint-disable-next-line architectural-rules/require-env-validation-schema -- NODE_ENV is inlined by Next.js at build time, not a runtime lookup
const isDevelopment = process.env.NODE_ENV === 'development';

type FallbackLink = {
  href: string;
  label: string;
  variant?: 'default' | 'outline' | 'ghost';
};

interface SegmentErrorFallbackProps {
  title: string;
  description: string;
  resetText?: string;
  onReset?: () => void;
  links?: FallbackLink[];
  error?: Error & { digest?: string };
}

export function SegmentErrorFallback({
  title,
  description,
  resetText = 'Try again',
  onReset,
  links = [],
  error,
}: SegmentErrorFallbackProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {onReset && (
            <Button onClick={onReset} className="w-full sm:w-auto">
              {resetText}
            </Button>
          )}
          {links.length > 0 && (
            <div className={`${UI_CLASSES.FLEX_COL_SM_ROW_GAP_3}`}>
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
            <div className="rounded-lg border border-muted-foreground/30 border-dashed bg-muted/30 p-4">
              <p className="mb-2 font-semibold text-muted-foreground text-sm">Error details</p>
              <pre className="wrap-break-word whitespace-pre-wrap text-destructive text-xs">
                {error.message}
              </pre>
              {error.digest && (
                <p className="mt-2 font-mono text-muted-foreground text-xs">
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
