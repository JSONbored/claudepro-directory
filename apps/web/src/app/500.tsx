/**
 * 500 Error Page - Server Error
 * 
 * This page is shown when a server error occurs (500 status code).
 * Next.js will automatically use this page for server errors.
 */

'use client';

import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import {
  bgColor,
  iconSize,
  alignItems,
  justify,
  marginBottom,
  maxWidth,
  minHeight,
  muted,
  padding,
  radius,
  responsive,
  size,
  textColor,
  weight,
} from '@heyclaude/web-runtime/design-system';
import { AlertCircle, Home, RefreshCw } from '@heyclaude/web-runtime/icons';
import {
  generateRequestId,
  logClientError,
} from '@heyclaude/web-runtime/logging/client';
import { Button, Card } from '@heyclaude/web-runtime/ui';
import Link from 'next/link';
import { useEffect } from 'react';

/**
 * Renders a client-side 500 Server Error page with actions to reload or go home.
 *
 * The component logs a structured client-side error on mount (includes requestId, route,
 * module, userAgent, url, segment, and statusCode 500) and displays a centered card with
 * a descriptive message and two actions: reload the page or navigate to the home route.
 *
 * @returns The Server Error page as a JSX element.
 *
 * @see generateRequestId
 * @see logClientError
 * @see ROUTES.HOME
 */
export default function ServerError() {
  useEffect(() => {
    const requestId = generateRequestId();
    const route = globalThis.location.pathname;
    const operation = 'ServerErrorPage';
    const module = 'apps/web/src/app/500';
    const serverError = new Error('Server error (500)');
    logClientError('Server error page displayed', serverError, operation, {
      requestId,
      route,
      module,
      userAgent: globalThis.navigator.userAgent,
      url: globalThis.location.href,
      segment: 'global',
      statusCode: 500,
    });
  }, []);

  return (
    <div className={`flex ${minHeight.screen} ${alignItems.center} ${justify.center} ${bgColor.background} ${padding.xDefault}`}>
      <Card className={`w-full ${maxWidth.lg} ${padding.relaxed} text-center`}>
        <div className={marginBottom.comfortable}>
          <div className={`${marginBottom.default} flex ${justify.center}`}>
            <div className={`${radius.full} ${bgColor['destructive/10']} ${padding.compact}`}>
              <AlertCircle className={`${iconSize['3xl']} ${textColor.destructive}`} aria-hidden="true" />
            </div>
          </div>
          <h1 className={`${marginBottom.tight} ${weight.bold} ${size['2xl']}`}>Server Error</h1>
          <p className={muted.default}>
            We encountered an error while processing your request. Our team has been notified and is working on a fix.
          </p>
        </div>

        <div className={responsive.smRowGap}>
          <Button onClick={() => globalThis.location.reload()} size="lg">
            <RefreshCw className={`mr-2 ${iconSize.sm}`} />
            Reload Page
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href={ROUTES.HOME}>
              <Home className={`mr-2 ${iconSize.sm}`} />
              Back to Home
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}