/**
 * Newsletter Welcome Email Template
 * Sent when a user subscribes to the newsletter
 *
 * Features:
 * - Personalized greeting
 * - Clear value proposition
 * - Call-to-action buttons
 * - Responsive design
 * - Email client compatible
 */

import { Button, Hr, Section, Text } from '@react-email/components';
import type * as React from 'react';
import { BaseLayout } from '../layouts/base-layout';
import { borderRadius, brandColors, emailTheme, spacing, typography } from '../utils/theme';

export interface NewsletterWelcomeProps {
  /**
   * Subscriber's email address
   */
  email: string;

  /**
   * Source of subscription (for analytics)
   * @default 'unknown'
   */
  source?: string;
}

/**
 * NewsletterWelcome Email Component
 *
 * Usage:
 * ```tsx
 * <NewsletterWelcome
 *   email="user@example.com"
 *   source="footer"
 * />
 * ```
 */
export function NewsletterWelcome({ email }: NewsletterWelcomeProps) {
  return (
    <BaseLayout preview="Welcome to ClaudePro Directory! Get weekly updates on new tools & guides.">
      {/* Hero section */}
      <Section style={heroSection}>
        <Text style={headingStyle}>Welcome to ClaudePro Directory! 🎉</Text>
        <Text style={subheadingStyle}>
          You're now subscribed to weekly updates on the best Claude agents, MCP servers, and
          productivity tools.
        </Text>
      </Section>

      <Hr style={dividerStyle} />

      {/* What to expect section */}
      <Section style={contentSection}>
        <Text style={sectionTitleStyle}>What to Expect</Text>
        <Text style={paragraphStyle}>
          Every week, you'll receive a carefully curated email featuring:
        </Text>

        <ul style={listStyle}>
          <li style={listItemStyle}>
            <strong style={strongStyle}>🤖 New Claude Agents</strong> - Discover powerful AI
            configurations
          </li>
          <li style={listItemStyle}>
            <strong style={strongStyle}>🔌 MCP Servers</strong> - Latest Model Context Protocol
            integrations
          </li>
          <li style={listItemStyle}>
            <strong style={strongStyle}>📚 Guides & Tutorials</strong> - Learn advanced Claude
            techniques
          </li>
          <li style={listItemStyle}>
            <strong style={strongStyle}>💡 Tips & Tricks</strong> - Productivity hacks from the
            community
          </li>
        </ul>
      </Section>

      <Hr style={dividerStyle} />

      {/* Call to action */}
      <Section style={ctaSection}>
        <Text style={ctaTitleStyle}>Get Started Now</Text>
        <Text style={paragraphStyle}>
          Explore our directory and discover tools that will supercharge your Claude experience.
        </Text>

        <Button href="https://claudepro.directory" style={primaryButtonStyle}>
          Browse the Directory
        </Button>

        <Button href="https://claudepro.directory/trending" style={secondaryButtonStyle}>
          View Trending Tools
        </Button>
      </Section>

      <Hr style={dividerStyle} />

      {/* Footer note */}
      <Section style={footerNoteSection}>
        <Text style={footerNoteStyle}>
          📧 Subscribed with: <strong style={strongStyle}>{email}</strong>
        </Text>
        <Text style={footerNoteStyle}>
          You can update your email preferences or unsubscribe anytime using the links at the bottom
          of this email.
        </Text>
      </Section>
    </BaseLayout>
  );
}

/**
 * Email-safe inline styles
 */

const heroSection: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: spacing.lg,
};

const headingStyle: React.CSSProperties = {
  fontSize: typography.fontSize['3xl'],
  fontWeight: typography.fontWeight.bold,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.md} 0`,
  lineHeight: typography.lineHeight.tight,
};

const subheadingStyle: React.CSSProperties = {
  fontSize: typography.fontSize.lg,
  color: emailTheme.textSecondary,
  margin: `0 0 ${spacing.md} 0`,
  lineHeight: typography.lineHeight.normal,
};

const contentSection: React.CSSProperties = {
  marginTop: spacing.lg,
  marginBottom: spacing.lg,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.xl,
  fontWeight: typography.fontWeight.semibold,
  color: brandColors.primary,
  margin: `0 0 ${spacing.md} 0`,
};

const paragraphStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: emailTheme.textPrimary,
  lineHeight: typography.lineHeight.relaxed,
  margin: `0 0 ${spacing.md} 0`,
};

const listStyle: React.CSSProperties = {
  margin: `${spacing.md} 0`,
  paddingLeft: spacing.lg,
};

const listItemStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: emailTheme.textPrimary,
  lineHeight: typography.lineHeight.relaxed,
  marginBottom: spacing.sm,
};

const strongStyle: React.CSSProperties = {
  fontWeight: typography.fontWeight.semibold,
  color: emailTheme.textPrimary,
};

const dividerStyle: React.CSSProperties = {
  borderColor: emailTheme.borderDefault,
  margin: `${spacing.lg} 0`,
};

const ctaSection: React.CSSProperties = {
  textAlign: 'center',
  marginTop: spacing.lg,
  marginBottom: spacing.lg,
};

const ctaTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize['2xl'],
  fontWeight: typography.fontWeight.bold,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.md} 0`,
};

const primaryButtonStyle: React.CSSProperties = {
  backgroundColor: brandColors.primary,
  color: '#ffffff',
  fontWeight: typography.fontWeight.semibold,
  fontSize: typography.fontSize.base,
  padding: `${spacing.md} ${spacing.xl}`,
  borderRadius: borderRadius.md,
  textDecoration: 'none',
  display: 'inline-block',
  marginTop: spacing.md,
  marginBottom: spacing.sm,
  marginLeft: spacing.sm,
  marginRight: spacing.sm,
  border: 'none',
};

const secondaryButtonStyle: React.CSSProperties = {
  backgroundColor: emailTheme.bgTertiary,
  color: emailTheme.textPrimary,
  fontWeight: typography.fontWeight.medium,
  fontSize: typography.fontSize.base,
  padding: `${spacing.md} ${spacing.xl}`,
  borderRadius: borderRadius.md,
  textDecoration: 'none',
  display: 'inline-block',
  marginTop: spacing.sm,
  marginBottom: spacing.md,
  marginLeft: spacing.sm,
  marginRight: spacing.sm,
  border: `1px solid ${emailTheme.borderDefault}`,
};

const footerNoteSection: React.CSSProperties = {
  marginTop: spacing.lg,
};

const footerNoteStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textTertiary,
  lineHeight: typography.lineHeight.relaxed,
  margin: `${spacing.xs} 0`,
};

/**
 * Export default for easier imports
 */
export default NewsletterWelcome;
