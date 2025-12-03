import { type PagePropsWithSearchParams } from '@heyclaude/web-runtime/core';
import { generatePageMetadata } from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { stack, size, maxWidth } from '@heyclaude/web-runtime/design-system';
import { AlertCircle } from '@heyclaude/web-runtime/icons';
import { generateRequestId, logger } from '@heyclaude/web-runtime/logging/server';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
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
 * Renders an authentication error page when an authorization code flow fails.
 *
 * This server component executes per request (dynamic = 'force-dynamic'), reads `searchParams`
 * for `code`, `provider`, and `message`, emits a redacted informational log entry, and returns
 * a centered card UI offering actions to retry sign-in or return home.
 *
 * @param properties - Next.js page props containing `searchParams` with optional `code`, `provider`, and `message` query values
 * @returns The page's JSX element displaying the authentication error and action buttons
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
    <Card className={`w-full ${maxWidth.md}`}>
      <CardHeader className="text-center">
        <div className="bg-destructive/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
          <AlertCircle className="text-destructive h-6 w-6" />
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
