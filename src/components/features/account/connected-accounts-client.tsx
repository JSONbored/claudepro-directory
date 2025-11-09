'use client';

/**
 * Connected Accounts Client - OAuth provider management UI
 * Database-first: displays data from get_user_identities() RPC
 */

import type { ComponentType } from 'react';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { Button } from '@/src/components/primitives/button';
import { CheckCircle, DiscordBrandIcon, GithubBrandIcon, GoogleBrandIcon } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';

interface Identity {
  provider: string;
  email: string;
  created_at: string;
  last_sign_in_at: string;
}

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
  const connectedProviders = new Set(identities.map((i) => i.provider));
  const availableProviders = Object.entries(PROVIDER_CONFIG);

  const handleLinkProvider = (provider: string) => {
    const config = PROVIDER_CONFIG[provider];
    if (!config) return;
    window.location.href = config.linkUrl;
  };

  const handleUnlinkProvider = async (provider: string) => {
    if (connectedProviders.size <= 1) {
      alert('You must keep at least one connected account to maintain access.');
      return;
    }

    if (
      confirm(`Are you sure you want to unlink your ${PROVIDER_CONFIG[provider]?.label} account?`)
    ) {
      // TODO: Implement unlink RPC function
      alert('Unlinking not yet implemented - requires RPC function');
    }
  };

  return (
    <div className="space-y-4">
      {availableProviders.map(([provider, config]) => {
        const identity = identities.find((i) => i.provider === provider);
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
                    <p>{identity.email}</p>
                    <p className="text-xs">
                      Last sign-in: {new Date(identity.last_sign_in_at).toLocaleDateString()}
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
                    onClick={() => handleUnlinkProvider(provider)}
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
    </div>
  );
}
