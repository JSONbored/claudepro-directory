'use client';

import { useEffect } from 'react';
import { SegmentErrorFallback } from '@/src/components/core/infra/segment-error-fallback';
import { logger } from '@/src/lib/logger';
import { normalizeError } from '@/src/lib/utils/error.utils';

export default function SearchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const normalized = normalizeError(error, 'Search route rendering failed');
    logger.error('SearchErrorBoundary: search page crashed', normalized, {
      segment: 'search',
      ...(error.digest && { digest: error.digest }),
    });
  }, [error]);

  return (
    <SegmentErrorFallback
      title="Search is temporarily unavailable"
      description="We couldn't complete your search just now. Please retry or explore the home page."
      resetText="Retry search"
      onReset={reset}
      links={[
        { href: '/search', label: 'Open search', variant: 'default' },
        { href: '/', label: 'Back to home', variant: 'outline' },
      ]}
      error={error}
    />
  );
}
