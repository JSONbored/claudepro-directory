'use client';

import { ensureString, logClientWarning } from '@heyclaude/web-runtime/core';
import { useEffect, useMemo, useState } from 'react';
import { AuthFormPanel } from '@/src/components/core/auth/auth-form-panel';
import { NewsletterOptInTile } from '@/src/components/core/auth/newsletter-opt-in-tile';
import { OAuthProviderButton } from '@/src/components/core/auth/oauth-provider-button';
import {
  formatSubscriberCount,
  loadNewsletterConfig,
} from '@/src/components/features/growth/newsletter/newsletter-utils';
import { useNewsletterCount } from '@/src/hooks/use-newsletter-count';

interface LoginPanelClientProps {
  redirectTo?: string | undefined;
}

export function LoginPanelClient({ redirectTo }: LoginPanelClientProps) {
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [newsletterConfig, setNewsletterConfig] = useState<Record<string, unknown>>({});
  const { count, isLoading } = useNewsletterCount();
  const subscriberCountLabel = useMemo(() => formatSubscriberCount(count), [count]);

  useEffect(() => {
    let cancelled = false;
    loadNewsletterConfig()
      .then((config) => {
        if (!cancelled) {
          setNewsletterConfig(config);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          logClientWarning('LoginPanelClient: failed to load newsletter config', error);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const tileHeadline = ensureString(
    newsletterConfig['newsletter.login_tile.headline'],
    'Your weekly Claude upgrade drop'
  );
  const tileDescription = ensureString(
    newsletterConfig['newsletter.login_tile.description'],
    'New MCP servers, pro prompts, and community playbooks — no fluff, just signal.'
  );
  const tileBenefits = [
    ensureString(newsletterConfig['newsletter.login_tile.benefit_primary']),
    ensureString(newsletterConfig['newsletter.login_tile.benefit_secondary']),
  ].filter((benefit) => Boolean(benefit));
  const tileSafety = ensureString(
    newsletterConfig['newsletter.login_tile.safety'],
    'No spam. Unsubscribe anytime.'
  );
  const badgePrefix = ensureString(
    newsletterConfig['newsletter.login_tile.badge_prefix'],
    '✨ Trusted by'
  );

  return (
    <AuthFormPanel
      title="Sign in"
      description="Choose your preferred sign-in method"
      afterContent={
        <NewsletterOptInTile
          checked={newsletterOptIn}
          onChange={setNewsletterOptIn}
          subscriberCountLabel={subscriberCountLabel}
          isLoadingCount={isLoading}
          headline={tileHeadline}
          description={tileDescription}
          benefits={tileBenefits}
          safetyCopy={tileSafety}
          badgePrefix={badgePrefix}
        />
      }
    >
      <OAuthProviderButton
        provider="github"
        redirectTo={redirectTo}
        newsletterOptIn={newsletterOptIn}
      />
      <OAuthProviderButton
        provider="google"
        redirectTo={redirectTo}
        newsletterOptIn={newsletterOptIn}
      />
      <OAuthProviderButton
        provider="discord"
        redirectTo={redirectTo}
        newsletterOptIn={newsletterOptIn}
      />
    </AuthFormPanel>
  );
}
