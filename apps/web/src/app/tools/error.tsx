'use client';

import { logClientErrorBoundary } from '@heyclaude/web-runtime/logging/client';
import { useEffect } from 'react';

import { SegmentErrorFallback } from '@/src/components/core/infra/segment-error-fallback';

/**
 * Tools Segment Error Boundary
 * 
 * Client-side error boundary for tools routes.
 * Logs errors using standardized client-side error boundary logging.
 * 
 * @see {@link @heyclaude/web-runtime/logging/client.logClientErrorBoundary | logClientErrorBoundary} - Error boundary logging utility
 */
export default function ToolsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In client components, window is always defined
    const route = globalThis.location.pathname;
    const componentStack = error.stack ?? '';
    
    logClientErrorBoundary(
      'Tools error boundary triggered',
      error,
      route,
      componentStack,
      {
        errorDigest: error.digest ?? 'no-digest',
        digestAvailable: Boolean(error.digest),
        userAgent: globalThis.navigator.userAgent,
        url: globalThis.location.href,
        segment: 'tools',
      }
    );
  }, [error]);

  return (
    <SegmentErrorFallback
      title="Tools page unavailable"
      description="We couldn’t load the tools catalog right now. Please retry or check out the directory."
      resetText="Retry tools"
      onReset={reset}
      links={[
        { href: '/tools', label: 'View tools', variant: 'default' },
        { href: '/', label: 'Back to home', variant: 'outline' },
      ]}
      error={error}
    />
  );
}
