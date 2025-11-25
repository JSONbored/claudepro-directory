import { getUserIdentities } from '@heyclaude/web-runtime';
import {
  createWebAppContextWithId,
  generateRequestId,
  hashUserId,
  logger,
  normalizeError,
} from '@heyclaude/web-runtime/core';
import { generatePageMetadata, getAuthenticatedUser } from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ConnectedAccountsClient } from '@/src/components/features/account/connected-accounts-client';
import { Button } from '@/src/components/primitives/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';

/**
 * Dynamic Rendering Required
 * Authenticated user connections
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function generateMetadata(): Promise<Metadata> {
  return await generatePageMetadata('/account/connected-accounts');
}

export default async function ConnectedAccountsPage() {
  // Generate single requestId for this page request
  const requestId = generateRequestId();
  const baseLogContext = createWebAppContextWithId(
    requestId,
    '/account/connected-accounts',
    'ConnectedAccountsPage'
  );

  const { user } = await getAuthenticatedUser({ context: 'ConnectedAccountsPage' });

  if (!user) {
    logger.warn(
      'ConnectedAccountsPage: unauthenticated access attempt detected',
      undefined,
      baseLogContext
    );
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Sign in required</CardTitle>
            <CardDescription>Please sign in to manage your connected accounts.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild={true}>
              <Link href={ROUTES.LOGIN}>Go to login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userIdHash = hashUserId(user.id);
  const logContext = { ...baseLogContext, userIdHash };

  let result: Awaited<ReturnType<typeof getUserIdentities>> | { data: null; serverError: string };
  try {
    result = await getUserIdentities();
  } catch (error) {
    const normalized = normalizeError(error, 'getUserIdentities invocation failed');
    logger.error('ConnectedAccountsPage: getUserIdentities threw', normalized, logContext);
    result = { data: null, serverError: normalized.message };
  }

  const pageHeader = (
    <div>
      <h1 className="mb-2 font-bold text-3xl">Connected Accounts</h1>
      <p className="text-muted-foreground">Manage your OAuth provider connections</p>
    </div>
  );

  if (!result.data || result.serverError) {
    if (result.serverError) {
      const normalized = normalizeError(result.serverError, 'Connected accounts server error');
      logger.error(
        'ConnectedAccountsPage: getUserIdentities returned serverError',
        normalized,
        logContext
      );
    } else {
      logger.warn(
        'ConnectedAccountsPage: getUserIdentities returned no data',
        undefined,
        logContext
      );
    }

    const errorMessage =
      result.serverError && typeof result.serverError === 'string'
        ? result.serverError
        : 'Failed to load connected accounts. Please try again later.';

    return (
      <div className="space-y-6">
        {pageHeader}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Connected accounts unavailable</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild={true} variant="outline">
              <Link href={ROUTES.ACCOUNT_SETTINGS}>Go to settings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const identities =
    result.data?.identities?.filter((i): i is NonNullable<typeof i> => i !== null) ?? [];
  if (identities.length === 0) {
    logger.info('ConnectedAccountsPage: no OAuth identities found', logContext);
  }

  return (
    <div className="space-y-6">
      {pageHeader}

      <Card>
        <CardHeader>
          <CardTitle>OAuth Providers</CardTitle>
          <CardDescription>
            Link multiple accounts to sign in with any provider. Your data stays unified across all
            login methods.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConnectedAccountsClient identities={identities} />
        </CardContent>
      </Card>
    </div>
  );
}
