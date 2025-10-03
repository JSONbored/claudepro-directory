'use client';

import { UI_CLASSES } from '@/src/lib/ui-constants';

export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div
          className={`${UI_CLASSES.FLEX_COL_CENTER} min-h-screen ${UI_CLASSES.JUSTIFY_CENTER} ${UI_CLASSES.P_4} font-sans`}
        >
          <div
            className={`max-w-md ${UI_CLASSES.P_8} ${UI_CLASSES.ROUNDED_LG} border border-border ${UI_CLASSES.BG_CARD} text-center`}
          >
            <h2 className="mb-4 text-2xl font-bold text-destructive">Application Error</h2>
            <p className="mb-6 text-muted-foreground">
              A critical error occurred. Please refresh the page or try again later.
            </p>
            <button
              type="button"
              onClick={reset}
              className={`px-4 ${UI_CLASSES.PY_2} ${UI_CLASSES.ROUNDED_MD} bg-primary text-primary-foreground border-none cursor-pointer text-base hover:bg-primary/90 ${UI_CLASSES.TRANSITION_COLORS}`}
            >
              Reset Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
