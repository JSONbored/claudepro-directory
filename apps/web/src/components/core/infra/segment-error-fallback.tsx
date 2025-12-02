'use client';

import {
  bgColor,
  alignItems,
  justify,
  marginBottom,
  marginTop,
  maxWidth,
  muted,
  padding,
  radius,
  responsive,
  size,
  spaceY,
  textColor,
  weight,
} from '@heyclaude/web-runtime/design-system';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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

/**
 * Renders a centered fallback UI for rendering segment-related errors with optional reset and link actions.
 *
 * Shows a title and description, an optional reset button (when `onReset` is provided), optional action links, and — only in development builds — an expandable error details panel that displays `error.message` and optional `error.digest`.
 *
 * @param props.title - Primary heading text shown in the fallback card.
 * @param props.description - Secondary descriptive text shown below the title.
 * @param props.resetText - Label for the optional reset button; defaults to `"Try again"`.
 * @param props.onReset - If provided, a reset button is rendered and invoked when clicked.
 * @param props.links - Optional array of link items to render as action buttons.
 * @param props.error - Optional error object; when present in development builds its message and optional `digest` are displayed.
 * @returns The JSX element for the segment error fallback UI.
 *
 * @see FallbackLink
 * @see isDevelopment
 */
export function SegmentErrorFallback({
  title,
  description,
  resetText = 'Try again',
  onReset,
  links = [],
  error,
}: SegmentErrorFallbackProps) {
  return (
    <div className={`flex min-h-[60vh] ${alignItems.center} ${justify.center} ${padding.xDefault} ${padding.ySection}`}>
      <Card className={`w-full ${maxWidth['2xl']}`}>
        <CardHeader>
          <CardTitle className={`${size['2xl']}`}>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className={spaceY.comfortable}>
          {onReset && (
            <Button onClick={onReset} className="w-full sm:w-auto">
              {resetText}
            </Button>
          )}
          {links.length > 0 && (
            <div className={responsive.smRowGap}>
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
            <div className={`${radius.lg} border border-muted-foreground/30 border-dashed ${bgColor['muted/30']} ${padding.default}`}>
              <p className={`${marginBottom.tight} ${weight.semibold} ${muted.sm}`}>Error details</p>
              <pre className={`wrap-break-word whitespace-pre-wrap ${textColor.destructive} ${size.xs}`}>
                {error.message}
              </pre>
              {error.digest && (
                <p className={`${marginTop.compact} font-mono ${muted.default} ${size.xs}`}>
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