/**
 * 500 Error Page - Server Error
 *
 * This page is shown when a server error occurs (500 status code).
 * Next.js will automatically use this page for server errors.
 */

'use client';

import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { AlertCircle, Home, RefreshCw } from '@heyclaude/web-runtime/icons';
import { logClientError, normalizeError } from '@heyclaude/web-runtime/logging/client';
import { Button, Card } from '@heyclaude/web-runtime/ui';
import Link from 'next/link';
import { useEffect } from 'react';
import { paddingX, padding, marginBottom, gap, marginRight } from "@heyclaude/web-runtime/design-system";

/**
 * Display a client-side 500 Server Error page and log a structured client-side error on mount.
 *
 * The component shows a centered card describing the server error and provides actions to reload the page or navigate home.
 *
 * @returns The server error page as a JSX element.
 *
 * @see logClientError
 * @see ROUTES.HOME
 */
export default function ServerError() {
  useEffect(() => {
    const route = globalThis.location.pathname;
    const operation = 'ServerErrorPage';
    const serverError = new Error('Server error (500)');
    const normalized = normalizeError(serverError, 'Server error page displayed');
    logClientError('[Error] Server error page displayed', normalized, operation, {
      action: 'display-error-page',
      category: 'error',
      component: 'ServerError',
      route,
      segment: 'global',
      statusCode: 500,
      url: globalThis.location.href,
      userAgent: globalThis.navigator.userAgent,
    });
  }, []);

  return (
    <div className={`bg-background flex min-h-screen items-center justify-center ${paddingX.default}`}>
      <Card className={`w-full max-w-lg ${padding.relaxed} text-center`}>
        <div className={`${marginBottom.comfortable}`}>
          <div className={`${marginBottom.default} flex justify-center`}>
            <div className={`bg-destructive/10 rounded-full ${padding.compact}`}>
              <AlertCircle aria-hidden="true" className="text-destructive h-12 w-12" />
            </div>
          </div>
          <h1 className={`${marginBottom.compact} text-2xl font-bold`}>Server Error</h1>
          <p className="text-muted-foreground">
            We encountered an error while processing your request. Our team has been notified and is
            working on a fix.
          </p>
        </div>

        <div className={`flex flex-col sm:flex-row ${gap.compact} sm:${gap.default}`}>
          <Button size="lg" onClick={() => globalThis.location.reload()}>
            <RefreshCw className={`${marginRight.tight} h-4 w-4`} />
            Reload Page
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={ROUTES.HOME}>
              <Home className={`${marginRight.tight} h-4 w-4`} />
              Back to Home
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
