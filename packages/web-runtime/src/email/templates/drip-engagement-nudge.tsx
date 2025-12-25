/**
 * Engagement Nudge Email Template
 * Sent to newsletter subscribers who haven't clicked any links
 *
 * Features:
 * - List of value propositions
 * - Clear call-to-action
 * - Modern, friendly tone
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

export interface EngagementNudgeEmailProps {
  /**
   * Subscriber's email address
   */
  email: string;
}

const VALUE_PROPOSITIONS = [
  {
    title: 'Curated Prompts',
    description: 'Expert-crafted prompts for every use case',
  },
  {
    title: 'MCP Servers',
    description: "Extend Claude's capabilities with custom tools",
  },
  {
    title: 'Cursor Rules',
    description: 'Optimize your AI-powered coding experience',
  },
  {
    title: 'Skills Library',
    description: 'Downloadable skill packs for Claude Desktop',
  },
  {
    title: 'Community Submissions',
    description: 'Fresh content added daily',
  },
] as const;

/**
 * EngagementNudgeEmail Component
 */
export function EngagementNudgeEmail({ email }: EngagementNudgeEmailProps) {
  const baseUrl = 'https://claudepro.directory';
  const utm = EMAIL_UTM_TEMPLATES.DRIP_ENGAGEMENT_NUDGE;

  return (
    <BaseLayout preview="Did you know? 5 ways to supercharge your Claude experience" utm={utm}>
      <Section style={contentSectionStyle}>
        <Text style={titleStyle}>Did you know? 5 ways to supercharge your Claude experience</Text>
        <Text style={paragraphStyle}>
          We noticed you might not have had a chance to explore yet. Here's what you're missing:
        </Text>

        <div style={listContainerStyle}>
          {VALUE_PROPOSITIONS.map((item, index) => (
            <EmailCard key={index} variant="default" style={listCardStyle}>
              <Text style={listNumberStyle}>{index + 1}.</Text>
              <div style={listContentStyle}>
                <Text style={listTitleStyle}>
                  <strong>{item.title}</strong>
                </Text>
                <Text style={listDescriptionStyle}> - {item.description}</Text>
              </div>
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
            Start Exploring
          </Link>
        </div>

        <Text style={helpTextStyle}>If you have any questions, just reply to this email!</Text>
      </Section>

      <EmailFooterNote lines={buildSubscriptionFooter('weeklyDigest', { email })} />
    </BaseLayout>
  );
}

/**
 * Export default for easier imports
 */
export default EngagementNudgeEmail;

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

const listContainerStyle: React.CSSProperties = {
  margin: `${spacing.lg} 0`,
};

const listCardStyle: React.CSSProperties = {
  marginBottom: spacing.sm,
  padding: spacing.md,
  display: 'flex',
  alignItems: 'flex-start',
  gap: spacing.sm,
};

const listNumberStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  fontWeight: typography.fontWeight.bold,
  color: emailTheme.textPrimary,
  margin: 0,
  minWidth: '24px',
};

const listContentStyle: React.CSSProperties = {
  flex: 1,
};

const listTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  fontWeight: typography.fontWeight.semibold,
  color: emailTheme.textPrimary,
  margin: 0,
  display: 'inline',
};

const listDescriptionStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: emailTheme.textSecondary,
  margin: 0,
  display: 'inline',
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

const helpTextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textSecondary,
  margin: `${spacing.lg} 0 0`,
  textAlign: 'center',
  fontStyle: 'italic',
};
