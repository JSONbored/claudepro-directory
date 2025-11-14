/**
 * Onboarding Email 3: Power User Tips
 * Sent 5 days after signup
 *
 * Goal: Deepen engagement with advanced features
 * Content: Advanced Claude features, MCP integration, custom rules, best practices
 */

import React from 'npm:react@18.3.1';
import { Button, Hr, Section, Text } from 'npm:@react-email/components@0.0.22';
import { addUTMToURL } from '../utils/email/email-utm.ts';
import { EMAIL_UTM_TEMPLATES } from '../utils/email/utm-templates.ts';
import { BaseLayout, renderEmailTemplate } from '../utils/email/base-template.tsx';
import {
  contentSection,
  ctaSection,
  ctaTitleStyle,
  dividerStyle,
  footerNoteSection,
  footerNoteStyle,
  paragraphStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  sectionTitleStyle,
  strongStyle,
} from '../utils/email/common-styles.ts';
import { BulletListSection, HeroBlock, CardListSection } from '../utils/email/components/sections.tsx';
import { borderRadius, emailTheme, spacing, typography } from '../utils/email/theme.ts';

export interface OnboardingPowerTipsProps {
  /**
   * Subscriber's email address
   */
  email: string;
}

const POWER_TIPS = [
  {
    emoji: '🔌',
    title: 'Combine Multiple MCP Servers',
    description:
      'Stack GitHub + Filesystem + Database MCP for a full-stack workspace. Pro tip: start with 2-3 servers, then add more as you master each one.',
  },
  {
    emoji: '📝',
    title: 'Create Custom Rule Sets',
    description:
      'Define coding standards, response formats, and best practices once and let Claude follow them automatically.',
  },
  {
    emoji: '🎯',
    title: 'Master Context Windows',
    description:
      'Use hooks and commands to inject relevant files and dependencies so Claude always knows your project state.',
  },
] as const;

const BEST_PRACTICES = [
  { title: 'Start Small', description: 'Master one configuration before combining multiple tools.' },
  { title: 'Document Everything', description: 'Keep notes on which setups work best for each task.' },
  { title: 'Iterate Often', description: 'Refine prompts and rules based on real results.' },
  { title: 'Share Back', description: 'Submit your winning configurations to help the community.' },
] as const;

/**
 * Power User Tips Email Component (Step 3 of 5)
 */
export function OnboardingPowerTips({ email }: OnboardingPowerTipsProps) {
  const baseUrl = 'https://claudepro.directory';
  const utm = EMAIL_UTM_TEMPLATES.ONBOARDING_POWER_TIPS;

  return (
    <BaseLayout preview="Power User Tips - Advanced Claude Techniques & Best Practices" utm={utm}>
      <HeroBlock
        title="Level Up Your Claude Game 💪"
        subtitle="Advanced techniques to get the most out of your AI assistant."
      />

      <Hr style={dividerStyle} />

      <CardListSection
        title="🚀 Power User Tips"
        cards={POWER_TIPS.map((tip) => ({
          title: `${tip.emoji} ${tip.title}`,
          description: tip.description,
        }))}
      />

      <Hr style={dividerStyle} />

      <Section style={contentSection}>
        <Text style={sectionTitleStyle}>✨ Best Practices from the Community</Text>
      </Section>

      <BulletListSection
        items={BEST_PRACTICES.map((item) => ({
          title: item.title,
          description: item.description,
        }))}
      />

      <Hr style={dividerStyle} />

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

      <Section style={teaserSection}>
        <Text style={teaserTitleStyle}>Coming Up Next...</Text>
        <Text style={teaserDescStyle}>
          In our next email, we'll introduce you to the ClaudePro community and show you how to contribute your own configurations. Stay tuned! 🎉
        </Text>
      </Section>

      <Section style={footerNoteSection}>
        <Text style={footerNoteStyle}>
          📧 <strong style={strongStyle}>{email}</strong>
        </Text>
        <Text style={footerNoteStyle}>This is part 3 of your 5-email onboarding series.</Text>
      </Section>
    </BaseLayout>
  );
}

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
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.sm} 0`,
};

const teaserDescStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: emailTheme.textSecondary,
  lineHeight: typography.lineHeight.relaxed,
  margin: 0,
};

export default OnboardingPowerTips;

export function renderOnboardingPowerTipsEmail(props: OnboardingPowerTipsProps) {
  return renderEmailTemplate(OnboardingPowerTips, props);
}
