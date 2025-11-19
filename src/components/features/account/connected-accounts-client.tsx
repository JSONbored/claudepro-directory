'use client';

/**
 * Connected Accounts Client - OAuth provider management UI
 * Database-first: displays data from get_user_identities() RPC
 */

import { type ComponentType, useState, useTransition } from 'react';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { Button } from '@/src/components/primitives/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/primitives/ui/dialog';
import { unlinkOAuthProvider } from '@/src/lib/actions/user.actions';
import {
  AlertTriangle,
  CheckCircle,
  DiscordBrandIcon,
  GithubBrandIcon,
  GoogleBrandIcon,
} from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { errorToasts, successToasts } from '@/src/lib/utils/toast.utils';

import type { Database } from '@/src/types/database.types';

type Identity = NonNullable<
  Database['public']['Functions']['get_user_identities']['Returns']['identities']
>[number];

interface ConnectedAccountsClientProps {
  identities: Identity[];
}

const PROVIDER_CONFIG: Record<
  string,
  {
    label: string;
    icon: ComponentType<{ className?: string }>;
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

export function ConnectedAccountsClient({ identities }: ConnectedAccountsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [unlinkDialogOpen, setUnlinkDialogOpen] = useState(false);
  const [providerToUnlink, setProviderToUnlink] = useState<string | null>(null);

  const connectedProviders = new Set(
    identities
      .filter(
        (i): i is NonNullable<typeof i> & { provider: string } => i !== null && i.provider !== null
      )
      .map((i) => i.provider)
  );
  const availableProviders = Object.entries(PROVIDER_CONFIG);

  const handleLinkProvider = (provider: string) => {
    const config = PROVIDER_CONFIG[provider];
    if (!config) return;
    window.location.href = config.linkUrl;
  };

  const openUnlinkDialog = (provider: string) => {
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
        const identity = identities.find(
          (i): i is NonNullable<typeof i> & { provider: string } =>
            i !== null && i.provider === provider
        );
        const isConnected = connectedProviders.has(provider);
        const IconComponent = config.icon;

        return (
          <div
            key={provider}
            className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent/5"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-full border bg-accent/5 p-3">
                <IconComponent className={UI_CLASSES.ICON_LG} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{config.label}</h3>
                  {isConnected && (
                    <UnifiedBadge variant="base" style="default" className="gap-1">
                      <CheckCircle className={UI_CLASSES.ICON_XS} />
                      Connected
                    </UnifiedBadge>
                  )}
                </div>
                {identity && (
                  <div className="mt-1 text-muted-foreground text-sm">
                    <p>{identity.email ?? 'No email'}</p>
                    <p className="text-xs">
                      {identity.last_sign_in_at
                        ? `Last sign-in: ${new Date(identity.last_sign_in_at).toLocaleDateString()}`
                        : 'Never signed in'}
                    </p>
                  </div>
                )}
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

      <div className="mt-6 rounded-lg border bg-muted/30 p-4">
        <h4 className="mb-2 font-medium text-sm">How it works</h4>
        <ul className="space-y-1 text-muted-foreground text-sm">
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
              Unlink {providerToUnlink && PROVIDER_CONFIG[providerToUnlink]?.label} Account?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to unlink your{' '}
              {providerToUnlink && PROVIDER_CONFIG[providerToUnlink]?.label} account? You will no
              longer be able to sign in using this provider.
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
