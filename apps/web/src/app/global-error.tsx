'use client';

import {
  bgColor,
  border,
  alignItems,
  justify,
  marginBottom,
  minHeight,
  muted,
  padding,
  radius,
  size,
  textColor,
  transition,
  weight,
  flexDir,
  hoverBg,
  maxWidth,
  textAlign,
  display,
  cursor,
} from '@heyclaude/web-runtime/design-system';
import { logClientErrorBoundary } from '@heyclaude/web-runtime/logging/client';
import { useEffect } from 'react';

/**
 * Top-level error boundary that logs unhandled client errors and renders a critical fallback UI.
 *
 * Logs the error with pathname, stack, user agent, and optional `digest` for observability, and displays a resettable error screen.
 *
 * @param props.error - The caught Error object; may include a `digest` string for grouping or observability.
 * @param props.reset - Callback invoked to reset the error boundary or application state.
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
        <div className={`${display.flex} ${minHeight.screen} ${flexDir.col} ${alignItems.center} ${justify.center} ${padding.default} font-sans`}>
          <div className={`${maxWidth.md} ${radius.lg} ${border.default} ${bgColor.card} ${padding.relaxed} ${textAlign.center}`}>
            <h2 className={`${marginBottom.default} ${weight.bold} ${size['2xl']} ${textColor.destructive}`}>Application Error</h2>
            <p className={`${marginBottom.comfortable} ${muted.default}`}>
              A critical error occurred. Please refresh the page or try again later.
            </p>
            <button
              type="button"
              onClick={reset}
              className={`${cursor.pointer} ${radius.md} ${border.none} ${bgColor.primary} ${padding.xDefault} ${size.base} ${textColor.primaryForeground} ${transition.colors} ${hoverBg.primaryMax}`}
            >
              Reset Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}