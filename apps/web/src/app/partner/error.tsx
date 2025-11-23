'use client';

import { logger, normalizeError } from '@heyclaude/web-runtime';
import { useEffect } from 'react';
import { SegmentErrorFallback } from '@/src/components/core/infra/segment-error-fallback';

export default function PartnerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const normalized = normalizeError(error, 'Partner route rendering failed');
    logger.error('PartnerErrorBoundary: partner page crashed', normalized, {
      segment: 'partner',
      ...(error.digest && { digest: error.digest }),
    });
  }, [error]);

  return (
    <SegmentErrorFallback
      title="Partner page unavailable"
      description="We couldn’t load the partner details right now. Please retry or reach out later."
      resetText="Retry partner page"
      onReset={reset}
      links={[
        { href: '/partner', label: 'View partner options', variant: 'default' },
        { href: '/', label: 'Back to home', variant: 'outline' },
      ]}
      error={error}
    />
  );
}
