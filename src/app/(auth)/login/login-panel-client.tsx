'use client';

import { useEffect, useMemo, useState } from 'react';
import { AuthFormPanel } from '@/src/components/core/auth/auth-form-panel';
import { NewsletterOptInTile } from '@/src/components/core/auth/newsletter-opt-in-tile';
import { OAuthProviderButton } from '@/src/components/core/auth/oauth-provider-button';
import {
  formatSubscriberCount,
  loadNewsletterConfig,
} from '@/src/components/features/growth/newsletter/newsletter-utils';
import { useNewsletterCount } from '@/src/hooks/use-newsletter-count';
import { logClientWarning } from '@/src/lib/utils/error.utils';

interface LoginPanelClientProps {
  redirectTo?: string | undefined;
}

export function LoginPanelClient({ redirectTo }: LoginPanelClientProps) {
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [newsletterConfig, setNewsletterConfig] = useState<Record<string, unknown>>({});
  const { count, isLoading } = useNewsletterCount();
  const subscriberCountLabel = useMemo(() => formatSubscriberCount(count), [count]);

  useEffect(() => {
    loadNewsletterConfig()
      .then((config) => setNewsletterConfig(config))
      .catch((error) => {
        logClientWarning('LoginPanelClient: failed to load newsletter config', error);
      });
  }, []);

  const tileHeadline =
    (newsletterConfig['newsletter.login_tile.headline'] as string) ||
    'Your weekly Claude upgrade drop';
  const tileDescription =
    (newsletterConfig['newsletter.login_tile.description'] as string) ||
    'New MCP servers, pro prompts, and community playbooks — no fluff, just signal.';
  const tileBenefits = [
    newsletterConfig['newsletter.login_tile.benefit_primary'] as string,
    newsletterConfig['newsletter.login_tile.benefit_secondary'] as string,
  ].filter((benefit): benefit is string => Boolean(benefit));
  const tileSafety =
    (newsletterConfig['newsletter.login_tile.safety'] as string) || 'No spam. Unsubscribe anytime.';
  const badgePrefix =
    (newsletterConfig['newsletter.login_tile.badge_prefix'] as string) || '✨ Trusted by';

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
