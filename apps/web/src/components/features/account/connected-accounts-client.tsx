'use client';

/**
 * Connected Accounts Client - OAuth provider management UI
 * Database-first: displays data from get_user_identities() RPC
 */

import type { Database } from '@heyclaude/database-types';
import { unlinkOAuthProvider } from '@heyclaude/web-runtime';
import {
  AlertTriangle,
  CheckCircle,
  DiscordBrandIcon,
  GithubBrandIcon,
  GoogleBrandIcon,
} from '@heyclaude/web-runtime/icons';
import {
  bgColor,
  cluster,
  gap,
  hoverBg,
  iconSize,
  alignItems,
  justify,
  marginBottom,
  marginTop,
  muted,
  padding,
  radius,
  size,
  spaceY,
  transition,
  weight,
  display,
  textColor,
} from '@heyclaude/web-runtime/design-system';
import { errorToasts, successToasts } from '@heyclaude/web-runtime/ui';
import { type ComponentType, useState, useTransition } from 'react';
import { UnifiedBadge } from '@heyclaude/web-runtime/ui';
import { Button } from '@heyclaude/web-runtime/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@heyclaude/web-runtime/ui';

type Identity = NonNullable<
  Database['public']['Functions']['get_user_identities']['Returns']['identities']
>[number];

interface ConnectedAccountsClientProps {
  identities: Identity[];
}

const PROVIDER_CONFIG: Record<
  Database['public']['Enums']['oauth_provider'],
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

/**
 * Renders the Connected Accounts UI for viewing, linking, and unlinking OAuth providers.
 *
 * Displays each supported provider with its connection state, linked account details (email and last sign-in),
 * and actions to link or unlink accounts. Prevents unlinking when it would remove the last remaining connected provider,
 * and shows a confirmation dialog before performing an unlink operation.
 *
 * @param identities - Array of user identity records (may include null entries) returned by the server's get_user_identities RPC; used to determine which providers are connected and to show provider-specific account details.
 * @returns The connected-accounts management React element containing provider rows, informational copy, and an unlink confirmation dialog.
 *
 * @see PROVIDER_CONFIG
 * @see unlinkOAuthProvider
 * @see successToasts
 * @see errorToasts
 */
export function ConnectedAccountsClient({ identities }: ConnectedAccountsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [unlinkDialogOpen, setUnlinkDialogOpen] = useState(false);
  const [providerToUnlink, setProviderToUnlink] = useState<
    Database['public']['Enums']['oauth_provider'] | null
  >(null);

  const connectedProviders = new Set(
    identities
      .filter(
        (i): i is NonNullable<typeof i> & { provider: string } => i !== null && i.provider !== null
      )
      .map((i) => i.provider)
  );
  const availableProviders = Object.entries(PROVIDER_CONFIG) as [
    Database['public']['Enums']['oauth_provider'],
    (typeof PROVIDER_CONFIG)[Database['public']['Enums']['oauth_provider']],
  ][];

  const handleLinkProvider = (provider: Database['public']['Enums']['oauth_provider']) => {
    const config = PROVIDER_CONFIG[provider];
    if (!config) return;
    window.location.href = config.linkUrl;
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
    <div className={spaceY.comfortable}>
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
            className={`${display.flex} ${alignItems.center} ${justify.between} ${radius.lg} border ${padding.default} ${transition.colors} ${hoverBg.subtle}`}
          >
            <div className={cluster.comfortable}>
              <div className={`${radius.full} border ${bgColor['accent/5']} ${padding.compact}`}>
                <IconComponent className={iconSize.lg} />
              </div>
              <div>
                <div className={cluster.compact}>
                  <h3 className={weight.medium}>{config.label}</h3>
                  {isConnected && (
                    <UnifiedBadge variant="base" style="default" className={`${gap.tight}`}>
                      <CheckCircle className={iconSize.xs} />
                      Connected
                    </UnifiedBadge>
                  )}
                </div>
                {identity && (
                  <div className={`${marginTop.tight} ${muted.sm}`}>
                    <p>{identity.email ?? 'No email'}</p>
                    <p className={size.xs}>
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
                    className={`${textColor.destructive} ${hoverBg.destructive}`}
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

      <div className={`${marginTop.comfortable} ${radius.lg} border ${bgColor['muted/30']} ${padding.default}`}>
        <h4 className={`${marginBottom.tight} ${weight.medium} ${size.sm}`}>How it works</h4>
        <ul className={`${spaceY.tight} ${muted.sm}`}>
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
            <DialogTitle className={cluster.compact}>
              <AlertTriangle className={textColor.destructive} />
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