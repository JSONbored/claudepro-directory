/**
 * Onboarding Email 4: Community Spotlight
 * Sent 9 days after signup
 *
 * Goal: Build community connection
 * Content: Community contributions, how to submit, success stories
 */

import { Button, Hr, Section, Text } from '@react-email/components';
import type * as React from 'react';
import { BaseLayout } from '../layouts/base-layout';
import { borderRadius, brandColors, emailTheme, spacing, typography } from '../utils/theme';

export interface OnboardingCommunityProps {
  /**
   * Subscriber's email address
   */
  email: string;
}

/**
 * Community Spotlight Email Component (Step 4 of 5)
 */
export function OnboardingCommunity({ email }: OnboardingCommunityProps) {
  return (
    <BaseLayout preview="Join the ClaudePro Community - Contribute & Connect">
      {/* Hero section */}
      <Section style={heroSection}>
        <Text style={headingStyle}>Welcome to the Community! 🤝</Text>
        <Text style={subheadingStyle}>
          Built by developers, for developers - join thousands of Claude users
        </Text>
      </Section>

      <Hr style={dividerStyle} />

      {/* Community Stats */}
      <Section style={statsSection}>
        <div style={statsGrid}>
          <div style={statCard}>
            <Text style={statNumberStyle}>1,000+</Text>
            <Text style={statLabelStyle}>Contributors</Text>
          </div>
          <div style={statCard}>
            <Text style={statNumberStyle}>500+</Text>
            <Text style={statLabelStyle}>Configurations</Text>
          </div>
          <div style={statCard}>
            <Text style={statNumberStyle}>50+</Text>
            <Text style={statLabelStyle}>MCP Servers</Text>
          </div>
        </div>
      </Section>

      <Hr style={dividerStyle} />

      {/* Why Contribute */}
      <Section style={contentSection}>
        <Text style={sectionTitleStyle}>Why Share Your Configurations?</Text>

        <ul style={listStyle}>
          <li style={listItemStyle}>
            <strong style={strongStyle}>Help Others:</strong> Your solution might be exactly what
            someone else needs
          </li>
          <li style={listItemStyle}>
            <strong style={strongStyle}>Get Feedback:</strong> Community members will test and
            improve your work
          </li>
          <li style={listItemStyle}>
            <strong style={strongStyle}>Build Reputation:</strong> Become a recognized contributor
            in the Claude ecosystem
          </li>
          <li style={listItemStyle}>
            <strong style={strongStyle}>Discover Better Ways:</strong> Learn from how others adapt
            your configurations
          </li>
        </ul>
      </Section>

      <Hr style={dividerStyle} />

      {/* How to Contribute */}
      <Section style={contentSection}>
        <Text style={sectionTitleStyle}>📝 How to Contribute</Text>

        <Section style={stepCard}>
          <Text style={stepNumberStyle}>1</Text>
          <Text style={stepDescStyle}>
            <strong style={strongStyle}>Test Your Configuration:</strong> Make sure it works
            reliably for your use case
          </Text>
        </Section>

        <Section style={stepCard}>
          <Text style={stepNumberStyle}>2</Text>
          <Text style={stepDescStyle}>
            <strong style={strongStyle}>Document It Well:</strong> Clear descriptions and examples
            help others understand
          </Text>
        </Section>

        <Section style={stepCard}>
          <Text style={stepNumberStyle}>3</Text>
          <Text style={stepDescStyle}>
            <strong style={strongStyle}>Submit via GitHub:</strong> Open a pull request or create an
            issue with your configuration
          </Text>
        </Section>

        <Button href="https://claudepro.directory/submit" style={primaryButtonStyle}>
          Submit Your Configuration
        </Button>
      </Section>

      <Hr style={dividerStyle} />

      {/* Featured Contributors */}
      <Section style={featureSection}>
        <Text style={featureTitleStyle}>🌟 Featured Community Contributions</Text>
        <Text style={paragraphStyle}>
          Recent configurations that are making waves in the community:
        </Text>

        <ul style={listStyle}>
          <li style={listItemStyle}>
            <strong style={strongStyle}>Advanced SQL Optimizer</strong> - Automatically optimizes
            complex queries
          </li>
          <li style={listItemStyle}>
            <strong style={strongStyle}>Security Audit Agent</strong> - Comprehensive security
            analysis for web apps
          </li>
          <li style={listItemStyle}>
            <strong style={strongStyle}>Documentation Generator</strong> - Creates API docs from
            code automatically
          </li>
        </ul>

        <Button href="https://claudepro.directory/community" style={secondaryButtonStyle}>
          See All Community Contributions
        </Button>
      </Section>

      <Hr style={dividerStyle} />

      {/* Connect Section */}
      <Section style={connectSection}>
        <Text style={connectTitleStyle}>Stay Connected</Text>
        <Text style={paragraphStyle}>
          Join discussions, get help, and share your experiences with other Claude users.
        </Text>

        <div style={connectLinksStyle}>
          <Button
            href="https://github.com/yourusername/claudepro-directory"
            style={linkButtonStyle}
          >
            GitHub
          </Button>
          <Button href="https://twitter.com/claudeprodirectory" style={linkButtonStyle}>
            Twitter
          </Button>
        </div>
      </Section>

      {/* Footer note */}
      <Section style={footerNoteSection}>
        <Text style={footerNoteStyle}>
          📧 <strong style={strongStyle}>{email}</strong>
        </Text>
        <Text style={footerNoteStyle}>
          This is part 4 of your 5-email onboarding series. One more to go!
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
  margin: `0 0 ${spacing.sm} 0`,
  lineHeight: typography.lineHeight.tight,
};

const subheadingStyle: React.CSSProperties = {
  fontSize: typography.fontSize.lg,
  color: emailTheme.textSecondary,
  margin: 0,
  lineHeight: typography.lineHeight.normal,
};

const statsSection: React.CSSProperties = {
  marginTop: spacing.lg,
  marginBottom: spacing.lg,
};

const statsGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: spacing.md,
};

const statCard: React.CSSProperties = {
  backgroundColor: emailTheme.bgTertiary,
  padding: spacing.md,
  borderRadius: borderRadius.md,
  textAlign: 'center',
  border: `1px solid ${emailTheme.borderDefault}`,
};

const statNumberStyle: React.CSSProperties = {
  fontSize: typography.fontSize['2xl'],
  fontWeight: typography.fontWeight.bold,
  color: brandColors.primary,
  margin: `0 0 ${spacing.xs} 0`,
  display: 'block',
};

const statLabelStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textSecondary,
  margin: 0,
  display: 'block',
};

const contentSection: React.CSSProperties = {
  marginTop: spacing.lg,
  marginBottom: spacing.lg,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize['2xl'],
  fontWeight: typography.fontWeight.bold,
  color: emailTheme.textPrimary,
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

const stepCard: React.CSSProperties = {
  backgroundColor: emailTheme.bgTertiary,
  border: `1px solid ${emailTheme.borderDefault}`,
  borderRadius: borderRadius.md,
  padding: spacing.md,
  marginBottom: spacing.sm,
  display: 'flex',
  alignItems: 'flex-start',
  gap: spacing.md,
};

const stepNumberStyle: React.CSSProperties = {
  fontSize: typography.fontSize.xl,
  fontWeight: typography.fontWeight.bold,
  color: brandColors.primary,
  margin: 0,
  flexShrink: 0,
};

const stepDescStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textSecondary,
  lineHeight: typography.lineHeight.relaxed,
  margin: 0,
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
  border: `1px solid ${emailTheme.borderDefault}`,
};

const featureSection: React.CSSProperties = {
  backgroundColor: emailTheme.bgTertiary,
  padding: spacing.lg,
  borderRadius: borderRadius.md,
  marginTop: spacing.lg,
  marginBottom: spacing.lg,
};

const featureTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.xl,
  fontWeight: typography.fontWeight.semibold,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.md} 0`,
};

const connectSection: React.CSSProperties = {
  textAlign: 'center',
  marginTop: spacing.lg,
  marginBottom: spacing.lg,
};

const connectTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.xl,
  fontWeight: typography.fontWeight.semibold,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.sm} 0`,
};

const connectLinksStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: spacing.md,
  marginTop: spacing.md,
};

const linkButtonStyle: React.CSSProperties = {
  backgroundColor: emailTheme.bgTertiary,
  color: emailTheme.textPrimary,
  fontWeight: typography.fontWeight.medium,
  fontSize: typography.fontSize.sm,
  padding: `${spacing.sm} ${spacing.lg}`,
  borderRadius: borderRadius.sm,
  textDecoration: 'none',
  display: 'inline-block',
  border: `1px solid ${emailTheme.borderDefault}`,
};

const dividerStyle: React.CSSProperties = {
  borderColor: emailTheme.borderDefault,
  margin: `${spacing.xl} 0`,
};

const footerNoteSection: React.CSSProperties = {
  marginTop: spacing.lg,
  textAlign: 'center',
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
export default OnboardingCommunity;
