/**
 * Digest Preview Email Template
 * Sent to newsletter subscribers before their first weekly digest
 *
 * Features:
 * - Preview of what to expect in weekly digests
 * - Engaging list of digest features
 * - Clear call-to-action
 * - Dark mode compatible
 */

import { Link, Section, Text } from '@react-email/components';
import React from 'react';

import { BaseLayout } from '../base-template';
import { EmailCard } from '../components/card';
import { EmailFooterNote } from '../components/footer-note';
import { buildSubscriptionFooter } from '../config/footer-presets';
import { buildEmailCtaUrl } from '../cta';
import { brandColors, emailTheme, spacing, typography } from '../theme';
import { EMAIL_UTM_TEMPLATES } from '../utm-templates';

export interface DigestPreviewEmailProps {
  /**
   * Subscriber's email address
   */
  email: string;
}

const DIGEST_FEATURES = [
  {
    emoji: '🆕',
    title: 'Trending new prompts and tools',
  },
  {
    emoji: '⭐',
    title: 'Community highlights',
  },
  {
    emoji: '📰',
    title: 'Claude ecosystem news',
  },
  {
    emoji: '💡',
    title: 'Tips and tutorials',
  },
] as const;

/**
 * DigestPreviewEmail Component
 */
export function DigestPreviewEmail({ email }: DigestPreviewEmailProps) {
  const baseUrl = 'https://claudepro.directory';
  const utm = EMAIL_UTM_TEMPLATES.DRIP_DIGEST_PREVIEW;

  return (
    <BaseLayout preview="📬 Your Weekly Digest is Coming!" utm={utm}>
      <Section style={contentSectionStyle}>
        <Text style={titleStyle}>📬 Your Weekly Digest is Coming!</Text>
        <Text style={paragraphStyle}>
          Starting next week, you'll receive our weekly digest featuring:
        </Text>

        <div style={featuresContainerStyle}>
          {DIGEST_FEATURES.map((feature, index) => (
            <EmailCard key={index} variant="default" style={featureCardStyle}>
              <div style={featureHeaderStyle}>
                <span style={featureEmojiStyle}>{feature.emoji}</span>
                <Text style={featureTitleStyle}>{feature.title}</Text>
              </div>
            </EmailCard>
          ))}
        </div>

        <Text style={timingStyle}>
          The digest arrives every Tuesday morning - keep an eye on your inbox!
        </Text>

        <div style={ctaContainerStyle}>
          <Link
            href={buildEmailCtaUrl(baseUrl, utm, {
              content: 'primary_cta',
            })}
            style={primaryCtaStyle}
          >
            Browse This Week's Content
          </Link>
        </div>
      </Section>

      <EmailFooterNote lines={buildSubscriptionFooter('weeklyDigest', { email })} />
    </BaseLayout>
  );
}

/**
 * Export default for easier imports
 */
export default DigestPreviewEmail;

// ============================================================================
// Styles
// ============================================================================

const contentSectionStyle: React.CSSProperties = {
  padding: spacing.lg,
};

const titleStyle: React.CSSProperties = {
  fontSize: typography.fontSize['2xl'],
  fontWeight: typography.fontWeight.bold,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.md}`,
};

const paragraphStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  lineHeight: typography.lineHeight.relaxed,
  color: emailTheme.textSecondary,
  margin: `0 0 ${spacing.lg}`,
};

const featuresContainerStyle: React.CSSProperties = {
  margin: `${spacing.lg} 0`,
};

const featureCardStyle: React.CSSProperties = {
  marginBottom: spacing.md,
  padding: spacing.md,
};

const featureHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
};

const featureEmojiStyle: React.CSSProperties = {
  fontSize: typography.fontSize.xl,
};

const featureTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: emailTheme.textPrimary,
  margin: 0,
  lineHeight: typography.lineHeight.relaxed,
};

const timingStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  lineHeight: typography.lineHeight.relaxed,
  color: emailTheme.textSecondary,
  margin: `${spacing.lg} 0`,
  textAlign: 'center',
};

const ctaContainerStyle: React.CSSProperties = {
  margin: `${spacing.xl} 0`,
  textAlign: 'center',
};

const primaryCtaStyle: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: brandColors.primary,
  color: '#1A1B17',
  padding: '12px 24px',
  borderRadius: '9999px',
  fontWeight: typography.fontWeight.semibold,
  textDecoration: 'none',
  fontSize: typography.fontSize.base,
};
