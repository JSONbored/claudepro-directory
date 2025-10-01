'use client';

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
        <div className="flex min-h-screen flex-col items-center justify-center p-4 font-sans">
          <div className="max-w-md p-8 rounded-lg border border-border bg-card text-center">
            <h2 className="mb-4 text-2xl font-bold text-destructive">Application Error</h2>
            <p className="mb-6 text-muted-foreground">
              A critical error occurred. Please refresh the page or try again later.
            </p>
            <button
              type="button"
              onClick={reset}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground border-none cursor-pointer text-base hover:bg-primary/90 transition-colors"
            >
              Reset Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
