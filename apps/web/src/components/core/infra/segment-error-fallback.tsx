'use client';

import { UI_CLASSES } from '@heyclaude/web-runtime';
import Link from 'next/link';
import { Button } from '@/src/components/primitives/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';

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
  const isDev = process.env.NODE_ENV === 'development';

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
          {isDev && error && (
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
