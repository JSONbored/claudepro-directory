'use client';

import { useEffect } from 'react';
import { logger } from '@/src/lib/logger';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error with structured logging for better Vercel observability
    logger.error('Application error boundary triggered', error, {
      errorDigest: error.digest || '',
      userAgent: typeof window !== 'undefined' ? window.navigator?.userAgent || '' : '',
      url: typeof window !== 'undefined' ? window.location?.href || '' : '',
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <div
      className={`${UI_CLASSES.FLEX_COL_CENTER} min-h-screen ${UI_CLASSES.JUSTIFY_CENTER} ${UI_CLASSES.P_4}`}
    >
      <div
        className={`max-w-md ${UI_CLASSES.ROUNDED_LG} border border-border ${UI_CLASSES.BG_CARD} ${UI_CLASSES.P_8} text-center`}
      >
        <h2 className="mb-4 text-2xl font-bold text-destructive">Something went wrong!</h2>
        <p className="mb-6 text-muted-foreground">
          An unexpected error occurred. We've been notified and are working on a fix.
        </p>
        <button
          type="button"
          onClick={reset}
          className={`${UI_CLASSES.ROUNDED_MD} bg-primary px-4 ${UI_CLASSES.PY_2} text-primary-foreground hover:bg-primary/90 ${UI_CLASSES.TRANSITION_COLORS}`}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
