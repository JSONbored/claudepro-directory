/**
 * Onboarding Email 3: Power User Tips
 * Sent 5 days after signup
 *
 * Goal: Deepen engagement with advanced features
 * Content: Advanced Claude features, MCP integration, custom rules, best practices
 */

import { Button, Hr, Section, Text } from '@react-email/components';
import type * as React from 'react';
import { BaseLayout } from '../layouts/base-layout';
import { borderRadius, brandColors, emailTheme, spacing, typography } from '../utils/theme';

export interface OnboardingPowerTipsProps {
  /**
   * Subscriber's email address
   */
  email: string;
}

/**
 * Power User Tips Email Component (Step 3 of 5)
 */
export function OnboardingPowerTips({ email }: OnboardingPowerTipsProps) {
  return (
    <BaseLayout preview="Power User Tips - Advanced Claude Techniques & Best Practices">
      {/* Hero section */}
      <Section style={heroSection}>
        <Text style={headingStyle}>Level Up Your Claude Game 💪</Text>
        <Text style={subheadingStyle}>
          Advanced techniques to get the most out of your AI assistant
        </Text>
      </Section>

      <Hr style={dividerStyle} />

      {/* Power Tips */}
      <Section style={contentSection}>
        <Text style={sectionTitleStyle}>🚀 Power User Tips</Text>

        <Section style={tipCard}>
          <Text style={tipIconStyle}>🔌</Text>
          <Text style={tipTitleStyle}>Combine Multiple MCP Servers</Text>
          <Text style={tipDescStyle}>
            Stack MCP servers for powerful workflows. For example: GitHub MCP + Filesystem MCP +
            Database MCP = Complete full-stack development environment.
          </Text>
          <Text style={tipCodeStyle}>
            💡 Pro Tip: Start with 2-3 servers, then add more as you master each one.
          </Text>
        </Section>

        <Section style={tipCard}>
          <Text style={tipIconStyle}>📝</Text>
          <Text style={tipTitleStyle}>Create Custom Rule Sets</Text>
          <Text style={tipDescStyle}>
            Build project-specific rules that define your coding standards, response formats, and
            best practices. Claude will automatically apply them to every interaction.
          </Text>
          <Text style={tipCodeStyle}>
            💡 Pro Tip: Use rules for code style guides, security requirements, and team
            conventions.
          </Text>
        </Section>

        <Section style={tipCard}>
          <Text style={tipIconStyle}>🎯</Text>
          <Text style={tipTitleStyle}>Master Context Windows</Text>
          <Text style={tipDescStyle}>
            Use hooks and commands to automatically inject relevant context. This keeps Claude
            informed about your project structure, dependencies, and requirements.
          </Text>
          <Text style={tipCodeStyle}>
            💡 Pro Tip: Create hooks that run on project load to set up your ideal Claude
            environment.
          </Text>
        </Section>
      </Section>

      <Hr style={dividerStyle} />

      {/* Best Practices */}
      <Section style={contentSection}>
        <Text style={sectionTitleStyle}>✨ Best Practices from the Community</Text>

        <ul style={listStyle}>
          <li style={listItemStyle}>
            <strong style={strongStyle}>Start Small:</strong> Master one configuration before
            combining multiple tools
          </li>
          <li style={listItemStyle}>
            <strong style={strongStyle}>Document Everything:</strong> Keep notes on which
            configurations work best for different tasks
          </li>
          <li style={listItemStyle}>
            <strong style={strongStyle}>Iterate Often:</strong> Refine your prompts and rules based
            on results
          </li>
          <li style={listItemStyle}>
            <strong style={strongStyle}>Share Back:</strong> Submit your successful configurations
            to help others
          </li>
        </ul>
      </Section>

      <Hr style={dividerStyle} />

      {/* Advanced Resources */}
      <Section style={ctaSection}>
        <Text style={ctaTitleStyle}>Explore Advanced Features</Text>
        <Text style={paragraphStyle}>
          Dive deeper into MCP servers, custom hooks, and advanced automation techniques.
        </Text>

        <Button href="https://claudepro.directory/mcp" style={primaryButtonStyle}>
          Browse MCP Servers
        </Button>

        <Button href="https://claudepro.directory/hooks" style={secondaryButtonStyle}>
          Explore Hooks
        </Button>
      </Section>

      <Hr style={dividerStyle} />

      {/* Community Spotlight Teaser */}
      <Section style={teaserSection}>
        <Text style={teaserTitleStyle}>Coming Up Next...</Text>
        <Text style={teaserDescStyle}>
          In our next email, we'll introduce you to the ClaudePro community and show you how to
          contribute your own configurations. Stay tuned! 🎉
        </Text>
      </Section>

      {/* Footer note */}
      <Section style={footerNoteSection}>
        <Text style={footerNoteStyle}>
          📧 <strong style={strongStyle}>{email}</strong>
        </Text>
        <Text style={footerNoteStyle}>
          This is part 3 of your 5-email onboarding series.
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

const tipCard: React.CSSProperties = {
  backgroundColor: emailTheme.bgTertiary,
  border: `1px solid ${emailTheme.borderDefault}`,
  borderRadius: borderRadius.md,
  padding: spacing.lg,
  marginBottom: spacing.md,
};

const tipIconStyle: React.CSSProperties = {
  fontSize: typography.fontSize['2xl'],
  margin: `0 0 ${spacing.xs} 0`,
  display: 'block',
};

const tipTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.lg,
  fontWeight: typography.fontWeight.semibold,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.sm} 0`,
};

const tipDescStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: emailTheme.textSecondary,
  lineHeight: typography.lineHeight.relaxed,
  margin: `0 0 ${spacing.sm} 0`,
};

const tipCodeStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: brandColors.primary,
  fontStyle: 'italic',
  lineHeight: typography.lineHeight.relaxed,
  margin: 0,
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
  marginTop: spacing.sm,
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
  marginBottom: spacing.sm,
  marginLeft: spacing.sm,
  marginRight: spacing.sm,
  border: `1px solid ${emailTheme.borderDefault}`,
};

const teaserSection: React.CSSProperties = {
  backgroundColor: emailTheme.bgTertiary,
  padding: spacing.lg,
  borderRadius: borderRadius.md,
  textAlign: 'center',
  marginTop: spacing.lg,
  marginBottom: spacing.lg,
};

const teaserTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.xl,
  fontWeight: typography.fontWeight.semibold,
  color: brandColors.primary,
  margin: `0 0 ${spacing.sm} 0`,
};

const teaserDescStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: emailTheme.textSecondary,
  lineHeight: typography.lineHeight.relaxed,
  margin: 0,
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
export default OnboardingPowerTips;
