'use client';

import { logger, normalizeError } from '@heyclaude/web-runtime/core';
import { useEffect } from 'react';
import { SegmentErrorFallback } from '@/src/components/core/infra/segment-error-fallback';

export default function CommunityError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const normalized = normalizeError(error, 'Community route rendering failed');
    logger.error('CommunityErrorBoundary: community page crashed', normalized, {
      segment: 'community',
      ...(error.digest && { digest: error.digest }),
    });
  }, [error]);

  return (
    <SegmentErrorFallback
      title="Community page unavailable"
      description="The community hub hit an unexpected issue. Please try again or jump back to the directory."
      resetText="Retry community"
      onReset={reset}
      links={[{ href: '/', label: 'Back to home', variant: 'outline' }]}
      error={error}
    />
  );
}
