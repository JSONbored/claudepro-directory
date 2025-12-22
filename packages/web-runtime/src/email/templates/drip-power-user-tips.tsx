/**
 * Power User Tips Email Template
 * Sent to engaged newsletter subscribers after they click a link
 *
 * Features:
 * - Tip cards with actionable advice
 * - Clear call-to-action
 * - Modern card-based layout
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

export interface PowerUserTipsEmailProps {
  /**
   * Subscriber's email address
   */
  email: string;
}

const TIPS = [
  {
    title: 'Bookmark Your Favorites',
    description: 'Save prompts, rules, and MCP servers to your personal library for quick access.',
  },
  {
    title: 'Explore Categories',
    description: 'We have specialized content for coding, writing, analysis, and more.',
  },
  {
    title: 'Submit Your Own Content',
    description: 'Share your best prompts and get featured in the community.',
  },
] as const;

/**
 * PowerUserTipsEmail Component
 */
export function PowerUserTipsEmail({ email }: PowerUserTipsEmailProps) {
  const baseUrl = 'https://claudepro.directory';
  const utm = EMAIL_UTM_TEMPLATES.DRIP_POWER_USER_TIPS;

  return (
    <BaseLayout
      preview="🚀 Pro tips for getting the most out of Claude"
      utm={utm}
    >
      <Section style={contentSectionStyle}>
        <Text style={titleStyle}>🚀 Pro Tips for Claude Power Users</Text>
        <Text style={paragraphStyle}>
          Since you're actively exploring Claude Pro Directory, here are some tips to get even more value:
        </Text>

        <div style={tipsContainerStyle}>
          {TIPS.map((tip, index) => (
            <EmailCard key={index} variant="default" style={tipCardStyle}>
              <Text style={tipNumberStyle}>{index + 1}.</Text>
              <Text style={tipTitleStyle}>{tip.title}</Text>
              <Text style={tipDescriptionStyle}>{tip.description}</Text>
            </EmailCard>
          ))}
        </div>

        <div style={ctaContainerStyle}>
          <Link
            href={buildEmailCtaUrl(baseUrl, utm, {
              content: 'primary_cta',
            })}
            style={primaryCtaStyle}
          >
            Explore More
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
export default PowerUserTipsEmail;

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

const tipsContainerStyle: React.CSSProperties = {
  margin: `${spacing.lg} 0`,
};

const tipCardStyle: React.CSSProperties = {
  marginBottom: spacing.md,
  padding: spacing.md,
};

const tipNumberStyle: React.CSSProperties = {
  fontSize: typography.fontSize.xl,
  fontWeight: typography.fontWeight.bold,
  color: brandColors.primary,
  margin: `0 0 ${spacing.xs}`,
};

const tipTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  fontWeight: typography.fontWeight.semibold,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.xs}`,
};

const tipDescriptionStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textSecondary,
  margin: 0,
  lineHeight: typography.lineHeight.relaxed,
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

