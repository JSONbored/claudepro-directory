'use client';

import { logger, normalizeError } from '@heyclaude/web-runtime';
import { useEffect } from 'react';
import { SegmentErrorFallback } from '@/src/components/core/infra/segment-error-fallback';

export default function StatuslinesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const normalized = normalizeError(error, 'Statuslines route rendering failed');
    logger.error('StatuslinesErrorBoundary: statuslines page crashed', normalized, {
      segment: 'statuslines',
      ...(error.digest && { digest: error.digest }),
    });
  }, [error]);

  return (
    <SegmentErrorFallback
      title="Statuslines unavailable"
      description="We couldn’t load the statuslines gallery right now. Please try again or browse the home page."
      resetText="Retry statuslines"
      onReset={reset}
      links={[
        { href: '/statuslines', label: 'View statuslines', variant: 'default' },
        { href: '/', label: 'Back to home', variant: 'outline' },
      ]}
      error={error}
    />
  );
}
