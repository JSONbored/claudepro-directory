'use client';

import {
  createWebAppContextWithId,
  generateRequestId,
  logger,
  normalizeError,
} from '@heyclaude/web-runtime/core';
import { useEffect } from 'react';

import { SegmentErrorFallback } from '@/src/components/core/infra/segment-error-fallback';

export default function ContactError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const requestId = generateRequestId();
    const route = globalThis.location.pathname;
    const normalized = normalizeError(error, 'Contact route rendering failed');
    const logContext = createWebAppContextWithId(requestId, route, 'ContactErrorBoundary', {
      segment: 'contact',
      ...(error.digest && { digest: error.digest }),
      userAgent: globalThis.navigator.userAgent,
      url: globalThis.location.href,
    });
    logger.error('Contact error boundary triggered', normalized, logContext);
  }, [error]);

  return (
    <SegmentErrorFallback
      title="Contact page unavailable"
      description="We couldn't load the contact page right now. Please try again or use one of the alternative contact methods below."
      resetText="Retry contact"
      onReset={reset}
      links={[
        { href: '/contact', label: 'Go to contact', variant: 'default' },
        { href: '/', label: 'Back to home', variant: 'outline' },
      ]}
      error={error}
    />
  );
}
