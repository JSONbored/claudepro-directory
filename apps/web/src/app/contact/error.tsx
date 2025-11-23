'use client';

import { logger, normalizeError } from '@heyclaude/web-runtime/core';
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
    const normalized = normalizeError(error, 'Contact route rendering failed');
    logger.error('ContactErrorBoundary: contact page crashed', normalized, {
      segment: 'contact',
      ...(error.digest && { digest: error.digest }),
    });
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
