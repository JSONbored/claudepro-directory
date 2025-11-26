'use client';

import { VALID_PROVIDERS } from '@heyclaude/web-runtime';
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

interface LoginPanelClientProperties {
  redirectTo?: string | undefined;
}

export function LoginPanelClient({ redirectTo }: LoginPanelClientProperties) {
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

  const tileProperties = useMemo(() => {
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
    ].filter(Boolean);
    const tileSafety = ensureString(
      newsletterConfig['newsletter.login_tile.safety'],
      'No spam. Unsubscribe anytime.'
    );
    const badgePrefix = ensureString(
      newsletterConfig['newsletter.login_tile.badge_prefix'],
      '✨ Trusted by'
    );
    return { tileHeadline, tileDescription, tileBenefits, tileSafety, badgePrefix };
  }, [newsletterConfig]);

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
          headline={tileProperties.tileHeadline}
          description={tileProperties.tileDescription}
          benefits={tileProperties.tileBenefits}
          safetyCopy={tileProperties.tileSafety}
          badgePrefix={tileProperties.badgePrefix}
        />
      }
    >
      {VALID_PROVIDERS.map((provider) => (
        <OAuthProviderButton
          key={provider}
          provider={provider}
          redirectTo={redirectTo}
          newsletterOptIn={newsletterOptIn}
        />
      ))}
    </AuthFormPanel>
  );
}
