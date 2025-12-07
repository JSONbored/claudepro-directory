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
import { useCopyToClipboard } from '@heyclaude/web-runtime/hooks';
import { Copy, Check } from '@heyclaude/web-runtime/icons';
import Link from 'next/link';

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
      <pre className="text-destructive text-xs max-w-full break-all whitespace-pre-wrap bg-background/50 rounded border border-border p-3 pr-10">
        {content}
      </pre>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-6 w-6 p-0"
        onClick={() => copy(content)}
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
          {onReset ? (
            <Button onClick={onReset} className="w-full sm:w-auto">
              {resetText}
            </Button>
          ) : null}
          {links.length > 0 && (
            <div className={`${UI_CLASSES.FLEX_COL_SM_ROW_GAP_3}`}>
              {links.map((link) => (
                <Button
                  key={`${link.href}-${link.label}`}
                  asChild
                  variant={link.variant ?? 'outline'}
                  className="w-full sm:w-auto"
                >
                  <Link href={link.href}>{link.label}</Link>
                </Button>
              ))}
            </div>
          )}
          {isDevelopment && error ? (
            <div className="border-muted-foreground/30 bg-muted/30 rounded-lg border border-dashed p-4">
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
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
