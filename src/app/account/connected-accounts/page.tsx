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

export const metadata = generatePageMetadata('/account/connected-accounts');

export default async function ConnectedAccountsPage() {
  const result = await getUserIdentities();

  if (!result.data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="mb-2 font-bold text-3xl">Connected Accounts</h1>
          <p className="text-muted-foreground">Manage your OAuth provider connections</p>
        </div>
        <div className="text-destructive">
          Failed to load connected accounts. Please try again later.
        </div>
      </div>
    );
  }

  const identities = result.data.identities || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 font-bold text-3xl">Connected Accounts</h1>
        <p className="text-muted-foreground">Manage your OAuth provider connections</p>
      </div>

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
