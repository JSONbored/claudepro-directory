/**
 * Onboarding Email 4: Community Spotlight
 * Sent 9 days after signup
 *
 * Goal: Build community connection
 * Content: Community contributions, how to submit, success stories
 */

import { Button, Hr, Section, Text } from '@react-email/components';
import type * as React from 'react';
import { addUTMToURL } from '@/src/lib/utils/email-utm';
import { EMAIL_UTM_TEMPLATES } from '@/src/lib/utils/utm-templates';
import { BaseLayout } from '../layouts/base-layout';
import {
  cardStyle,
  contentSection,
  dividerStyle,
  footerNoteSection,
  footerNoteStyle,
  headingStyle,
  heroSection,
  listItemStyle,
  listStyle,
  paragraphStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  sectionTitleStyle,
  strongStyle,
  subheadingStyle,
} from '../utils/common-styles';
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
  const baseUrl = 'https://claudepro.directory';
  const utm = EMAIL_UTM_TEMPLATES.ONBOARDING_COMMUNITY;

  return (
    <BaseLayout preview="Join the Claude Pro Community - Contribute & Connect" utm={utm}>
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

        <Section style={cardStyle}>
          <Text style={stepNumberStyle}>1</Text>
          <Text style={stepDescStyle}>
            <strong style={strongStyle}>Test Your Configuration:</strong> Make sure it works
            reliably for your use case
          </Text>
        </Section>

        <Section style={cardStyle}>
          <Text style={stepNumberStyle}>2</Text>
          <Text style={stepDescStyle}>
            <strong style={strongStyle}>Document It Well:</strong> Clear descriptions and examples
            help others understand
          </Text>
        </Section>

        <Section style={cardStyle}>
          <Text style={stepNumberStyle}>3</Text>
          <Text style={stepDescStyle}>
            <strong style={strongStyle}>Submit via GitHub:</strong> Open a pull request or create an
            issue with your configuration
          </Text>
        </Section>

        <Button
          href={addUTMToURL(`${baseUrl}/submit`, { ...utm, content: 'submit_cta' })}
          style={primaryButtonStyle}
        >
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

        <Button
          href={addUTMToURL(`${baseUrl}/community`, { ...utm, content: 'community_cta' })}
          style={secondaryButtonStyle}
        >
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
            href={addUTMToURL('https://github.com/yourusername/claudepro-directory', {
              ...utm,
              content: 'github_link',
            })}
            style={linkButtonStyle}
          >
            GitHub
          </Button>
          <Button
            href={addUTMToURL('https://twitter.com/claudeprodirectory', {
              ...utm,
              content: 'twitter_link',
            })}
            style={linkButtonStyle}
          >
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
 * Template-specific custom styles
 * (Styles for community stats grid, steps, and connect sections)
 */

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

/**
 * Export default for easier imports
 */
export default OnboardingCommunity;
