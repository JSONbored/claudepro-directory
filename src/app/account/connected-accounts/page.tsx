import { ConnectedAccountsClient } from '@/src/components/features/account/connected-accounts-client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/card';
import { getUserIdentities } from '@/src/lib/actions/user.actions';

/**
 * Connected Accounts Page - OAuth provider management
 * Single RPC call via get_user_identities() for minimal egress
 */

import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return await generatePageMetadata('/account/connected-accounts');
}

export default async function ConnectedAccountsPage() {
  const result = await getUserIdentities();

  const pageHeader = (
    <div>
      <h1 className="mb-2 font-bold text-3xl">Connected Accounts</h1>
      <p className="text-muted-foreground">Manage your OAuth provider connections</p>
    </div>
  );

  if (!result.data || result.serverError) {
    // Extract readable error message - handle both string and object cases
    const errorMessage = result.serverError
      ? typeof result.serverError === 'string'
        ? result.serverError
        : (result.serverError as { message?: string }).message ||
          String(result.serverError) ||
          'Failed to load connected accounts. Please try again later.'
      : 'Failed to load connected accounts. Please try again later.';

    return (
      <div className="space-y-6">
        {pageHeader}
        <div className="text-destructive">{errorMessage}</div>
      </div>
    );
  }

  const identities = result.data.identities || [];

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
