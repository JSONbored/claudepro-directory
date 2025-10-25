/**
 * Onboarding Email 3: Power User Tips
 * Sent 5 days after signup
 *
 * Goal: Deepen engagement with advanced features
 * Content: Advanced Claude features, MCP integration, custom rules, best practices
 */

import { Button, Hr, Section, Text } from '@react-email/components';
import type * as React from 'react';
import { addUTMToURL } from '@/src/lib/utils/email-utm';
import { EMAIL_UTM_TEMPLATES } from '@/src/lib/utils/utm-templates';
import { BaseLayout } from '../layouts/base-layout';
import {
  cardStyle,
  contentSection,
  ctaSection,
  ctaTitleStyle,
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
  const baseUrl = 'https://claudepro.directory';
  const utm = EMAIL_UTM_TEMPLATES.ONBOARDING_POWER_TIPS;

  return (
    <BaseLayout preview="Power User Tips - Advanced Claude Techniques & Best Practices" utm={utm}>
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

        <Section style={cardStyle}>
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

        <Section style={cardStyle}>
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

        <Section style={cardStyle}>
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

        <Button
          href={addUTMToURL(`${baseUrl}/mcp`, { ...utm, content: 'mcp_cta' })}
          style={primaryButtonStyle}
        >
          Browse MCP Servers
        </Button>

        <Button
          href={addUTMToURL(`${baseUrl}/hooks`, { ...utm, content: 'hooks_cta' })}
          style={secondaryButtonStyle}
        >
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
        <Text style={footerNoteStyle}>This is part 3 of your 5-email onboarding series.</Text>
      </Section>
    </BaseLayout>
  );
}

/**
 * Template-specific custom styles
 * (Styles specific to tip card patterns and teaser sections)
 */

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

/**
 * Export default for easier imports
 */
export default OnboardingPowerTips;
