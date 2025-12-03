import  { type PagePropsWithSearchParams } from '@heyclaude/web-runtime/core';
import { generatePageMetadata } from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import {
  alignItems,
  bgColor,
  display,
  iconSize,
  justify,
  marginBottom,
  marginX,
  maxWidth,
  radius,
  size,
  stack,
  textAlign,
  textColor,
  width,
} from '@heyclaude/web-runtime/design-system';
import { AlertCircle } from '@heyclaude/web-runtime/icons';
import {
  generateRequestId,
  logger,
} from '@heyclaude/web-runtime/logging/server';
import { Button ,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle } from '@heyclaude/web-runtime/ui';
import  { type Metadata } from 'next';
import Link from 'next/link';

const AUTH_CODE_ERROR_PATH = ROUTES.AUTH_AUTH_CODE_ERROR;

export const dynamic = 'force-dynamic';

/**
 * Produce the page metadata for the authentication code error route.
 *
 * @returns Metadata for the auth code error page
 * @see generatePageMetadata
 * @see AUTH_CODE_ERROR_PATH
 * @see {@link https://nextjs.org/docs/app/building-your-application/metadata Metadata (Next.js)}
 */
export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata(AUTH_CODE_ERROR_PATH);
}

/**
 * Render the authentication error page shown when an authorization-code sign-in flow fails.
 *
 * This server component runs per request (dynamic = 'force-dynamic'), reads `searchParams` for
 * optional `code`, `provider`, and `message` query values, emits a redacted informational log entry,
 * and renders a centered card offering actions to retry sign-in or return home.
 *
 * @param properties - Next.js page props with `searchParams` that may include `code`, `provider`, and `message`
 * @returns The JSX element for the authentication error page with action buttons
 *
 * @see ROUTES
 * @see generateRequestId
 * @see logger
 */
export default async function AuthCodeError(properties: PagePropsWithSearchParams) {
  // Generate single requestId for this page request
  const requestId = generateRequestId();
  const operation = 'AuthCodeErrorPage';
  const route = AUTH_CODE_ERROR_PATH;
  const module = 'apps/web/src/app/(auth)/auth-code-error/page';

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation,
    route,
    module,
  });

  const searchParameters = await properties.searchParams;

  const rawCode = searchParameters?.['code'];
  const rawProvider = searchParameters?.['provider'];
  const rawMessage = searchParameters?.['message'];

  // Handle array or string, and ensure we get a string or default
  const code = (Array.isArray(rawCode) ? rawCode[0] : rawCode) ?? 'unknown';
  const provider = (Array.isArray(rawProvider) ? rawProvider[0] : rawProvider) ?? 'unknown';
  const message = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;

  // Log page render (informational)
  reqLogger.info('AuthCodeErrorPage rendered', {
    // Redact sensitive code/provider values
    hasCode: Boolean(code && code !== 'unknown'),
    provider: provider === 'unknown' ? 'unknown' : 'redacted',
    hasMessage: Boolean(message),
    hasSearchParams: Boolean(searchParameters),
  });

  return (
    <Card className={`${width.full} ${maxWidth.md}`}>
      <CardHeader className={textAlign.center}>
        <div
          className={`${marginX.auto} ${marginBottom.default} ${display.flex} ${iconSize['3xl']} ${alignItems.center} ${justify.center} ${radius.full} ${bgColor['destructive/10']}`}
        >
          <AlertCircle className={`${iconSize.lg} ${textColor.destructive}`} />
        </div>
        <CardTitle className={`${size['2xl']}`}>Authentication Error</CardTitle>
        <CardDescription>
          There was a problem signing you in. This could be due to an invalid or expired link.
        </CardDescription>
      </CardHeader>
      <CardContent className={stack.compact}>
        <Button asChild>
          <Link href={ROUTES.LOGIN}>Try Again</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={ROUTES.HOME}>Return Home</Link>
        </Button>
      </CardContent>
    </Card>
  );
}