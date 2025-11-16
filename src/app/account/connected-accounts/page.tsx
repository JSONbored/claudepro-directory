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
import { getUserIdentities } from '@/src/lib/actions/user.actions';
import { getAuthenticatedUser } from '@/src/lib/auth/get-authenticated-user';
import { ROUTES } from '@/src/lib/data/config/constants';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { normalizeError } from '@/src/lib/utils/error.utils';

export async function generateMetadata() {
  return await generatePageMetadata('/account/connected-accounts');
}

export default async function ConnectedAccountsPage() {
  const { user } = await getAuthenticatedUser({ context: 'ConnectedAccountsPage' });

  if (!user) {
    logger.warn('ConnectedAccountsPage: unauthenticated access attempt detected');
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Sign in required</CardTitle>
            <CardDescription>Please sign in to manage your connected accounts.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={ROUTES.LOGIN}>Go to login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  let result: Awaited<ReturnType<typeof getUserIdentities>> | { data: null; serverError: string };
  try {
    result = await getUserIdentities();
  } catch (error) {
    const normalized = normalizeError(error, 'getUserIdentities invocation failed');
    logger.error('ConnectedAccountsPage: getUserIdentities threw', normalized, { userId: user.id });
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
      logger.error('ConnectedAccountsPage: getUserIdentities returned serverError', normalized, {
        userId: user.id,
      });
    } else {
      logger.warn('ConnectedAccountsPage: getUserIdentities returned no data', {
        userId: user.id,
      });
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
            <Button asChild variant="outline">
              <Link href={ROUTES.ACCOUNT_SETTINGS}>Go to settings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const identities = result.data.identities || [];
  if (identities.length === 0) {
    logger.info('ConnectedAccountsPage: no OAuth identities found', { userId: user.id });
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
