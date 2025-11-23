'use client';

import { logger, normalizeError } from '@heyclaude/web-runtime';
import { useEffect } from 'react';
import { SegmentErrorFallback } from '@/src/components/core/infra/segment-error-fallback';

export default function SubmitError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const normalized = normalizeError(error, 'Submit route rendering failed');
    logger.error('SubmitErrorBoundary: submit page crashed', normalized, {
      segment: 'submit',
      ...(error.digest && { digest: error.digest }),
    });
  }, [error]);

  return (
    <SegmentErrorFallback
      title="Submission form unavailable"
      description="We couldn’t load the submission form right now. Please retry or return to the directory."
      resetText="Retry submission"
      onReset={reset}
      links={[
        { href: '/submit', label: 'Open submission form', variant: 'default' },
        { href: '/', label: 'Back to home', variant: 'outline' },
      ]}
      error={error}
    />
  );
}
