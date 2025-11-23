'use client';

import { logger, normalizeError } from '@heyclaude/web-runtime/core';
import { useEffect } from 'react';
import { SegmentErrorFallback } from '@/src/components/core/infra/segment-error-fallback';

export default function CategoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const normalized = normalizeError(error, 'Category listing route failed');
    logger.error('CategoryErrorBoundary: category page crashed', normalized, {
      segment: 'category',
      ...(error.digest && { digest: error.digest }),
    });
  }, [error]);

  return (
    <SegmentErrorFallback
      title="Category unavailable"
      description="We couldn’t load this category right now. Please retry or browse the full directory."
      resetText="Retry category"
      onReset={reset}
      links={[
        { href: '/', label: 'Back to directory', variant: 'default' },
        { href: '/search', label: 'Go to search', variant: 'outline' },
      ]}
      error={error}
    />
  );
}
