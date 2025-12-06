'use client';

/**
 * Connected Accounts Client - OAuth provider management UI
 * Database-first: displays data from get_user_identities() RPC
 */

import { type Database } from '@heyclaude/database-types';
import { unlinkOAuthProvider } from '@heyclaude/web-runtime';
import {
  AlertTriangle,
  CheckCircle,
  DiscordBrandIcon,
  GithubBrandIcon,
  GoogleBrandIcon,
} from '@heyclaude/web-runtime/icons';
import {
  errorToasts,
  successToasts,
  UI_CLASSES,
  UnifiedBadge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@heyclaude/web-runtime/ui';
import { type ComponentType, useState, useTransition } from 'react';

type Identity = NonNullable<
  Database['public']['Functions']['get_user_identities']['Returns']['identities']
>[number];

interface ConnectedAccountsClientProps {
  identities: Identity[];
}

const PROVIDER_CONFIG: Record<
  Database['public']['Enums']['oauth_provider'],
  {
    icon: ComponentType<{ className?: string }>;
    label: string;
    linkUrl: string;
    unlinkable: boolean;
  }
> = {
  github: {
    label: 'GitHub',
    icon: GithubBrandIcon,
    linkUrl: '/auth/link/github',
    unlinkable: true,
  },
  google: {
    label: 'Google',
    icon: GoogleBrandIcon,
    linkUrl: '/auth/link/google',
    unlinkable: true,
  },
  discord: {
    label: 'Discord',
    icon: DiscordBrandIcon,
    linkUrl: '/auth/link/discord',
    unlinkable: true,
  },
};

/**
 * Renders UI for viewing, linking, and unlinking the user's connected OAuth providers.
 *
 * Displays each configured provider (GitHub, Google, Discord), shows connection status and identity info,
 * allows starting the OAuth linking flow, and provides a confirmation dialog to unlink a provider.
 * The component prevents unlinking when only one provider remains connected.
 *
 * @param identities - Array of identity records returned by `get_user_identities()`. Entries may be `null`
 *   and identity objects may have a `provider` or `email` that is `null`. Provider comparisons are performed
 *   after normalizing provider values to lowercase and trimming whitespace.
 * @returns The React element that manages connected OAuth providers for the current user.
 *
 * @see PROVIDER_CONFIG
 * @see unlinkOAuthProvider
 */
export function ConnectedAccountsClient({ identities }: ConnectedAccountsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [unlinkDialogOpen, setUnlinkDialogOpen] = useState(false);
  const [providerToUnlink, setProviderToUnlink] = useState<
    Database['public']['Enums']['oauth_provider'] | null
  >(null);

  // Normalize provider values to lowercase for consistent comparison
  // Database returns provider as text, enum values are lowercase strings
  const connectedProviders = new Set(
    identities
      .filter(
        (i): i is NonNullable<typeof i> & { provider: string } => i !== null && i.provider !== null
      )
      .map((i) => i.provider.toLowerCase().trim())
  );
  const availableProviders = Object.entries(PROVIDER_CONFIG) as [
    Database['public']['Enums']['oauth_provider'],
    (typeof PROVIDER_CONFIG)[Database['public']['Enums']['oauth_provider']],
  ][];

  const handleLinkProvider = (provider: Database['public']['Enums']['oauth_provider']) => {
    const config = PROVIDER_CONFIG[provider];
    if (!config) return;
    globalThis.location.href = config.linkUrl;
  };

  const openUnlinkDialog = (provider: Database['public']['Enums']['oauth_provider']) => {
    if (connectedProviders.size <= 1) {
      errorToasts.actionFailed(
        'unlink provider',
        'You must keep at least one connected account to maintain access.'
      );
      return;
    }
    setProviderToUnlink(provider);
    setUnlinkDialogOpen(true);
  };

  const handleUnlinkConfirm = () => {
    if (!providerToUnlink) return;

    startTransition(async () => {
      const result = await unlinkOAuthProvider({ provider: providerToUnlink });

      if (result?.data?.success) {
        successToasts.actionCompleted('Provider unlinked');
        setUnlinkDialogOpen(false);
        setProviderToUnlink(null);
        // Page will auto-revalidate via server action
      } else {
        errorToasts.actionFailed(
          'unlink provider',
          result?.data?.error || 'An unexpected error occurred'
        );
      }
    });
  };

  return (
    <div className="space-y-4">
      {availableProviders.map(([provider, config]) => {
        // Normalize provider for comparison (database returns text, enum is lowercase)
        // Use same normalization as connectedProviders (toLowerCase().trim())
        const normalizedProvider = provider.toLowerCase().trim();
        const identity = identities.find(
          (i): i is NonNullable<typeof i> & { provider: string } =>
            i !== null &&
            i.provider !== null &&
            i.provider.toLowerCase().trim() === normalizedProvider
        );
        const isConnected = connectedProviders.has(normalizedProvider);
        const IconComponent = config.icon;

        return (
          <div
            key={provider}
            className="hover:bg-accent/5 flex items-center justify-between rounded-lg border p-4 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="bg-accent/5 rounded-full border p-3">
                <IconComponent className={UI_CLASSES.ICON_LG} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{config.label}</h3>
                  {isConnected ? (
                    <UnifiedBadge variant="base" style="default" className="gap-1">
                      <CheckCircle className={UI_CLASSES.ICON_XS} />
                      Connected
                    </UnifiedBadge>
                  ) : null}
                </div>
                {identity ? (
                  <div className="text-muted-foreground mt-1 text-sm">
                    <p>{identity.email ?? 'No email'}</p>
                    <p className="text-xs">
                      {identity.last_sign_in_at
                        ? `Last sign-in: ${new Date(identity.last_sign_in_at).toLocaleDateString()}`
                        : 'Never signed in'}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            <div>
              {isConnected ? (
                config.unlinkable && connectedProviders.size > 1 ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openUnlinkDialog(provider)}
                    disabled={isPending}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    Unlink
                  </Button>
                ) : (
                  <UnifiedBadge variant="base" style="secondary">
                    Primary
                  </UnifiedBadge>
                )
              ) : (
                <Button variant="outline" size="sm" onClick={() => handleLinkProvider(provider)}>
                  Link Account
                </Button>
              )}
            </div>
          </div>
        );
      })}

      <div className="bg-muted/30 mt-6 rounded-lg border p-4">
        <h4 className="mb-2 text-sm font-medium">How it works</h4>
        <ul className="text-muted-foreground space-y-1 text-sm">
          <li>• Link multiple OAuth providers to your account</li>
          <li>• Sign in with any connected provider to access the same account</li>
          <li>• Your data stays unified across all login methods</li>
          <li>• Keep at least one provider connected to maintain access</li>
        </ul>
      </div>

      {/* Unlink Confirmation Dialog */}
      <Dialog open={unlinkDialogOpen} onOpenChange={setUnlinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-destructive" />
              Unlink {providerToUnlink ? PROVIDER_CONFIG[providerToUnlink]?.label : null} Account?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to unlink your{' '}
              {providerToUnlink ? PROVIDER_CONFIG[providerToUnlink]?.label : null} account? You will
              no longer be able to sign in using this provider.
              <br />
              <br />
              You can re-link it later if needed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUnlinkDialogOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleUnlinkConfirm} disabled={isPending}>
              {isPending ? 'Unlinking...' : 'Unlink Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
