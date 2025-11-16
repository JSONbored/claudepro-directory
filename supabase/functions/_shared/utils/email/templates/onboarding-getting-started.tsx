/**
 * Onboarding Email 2: Getting Started
 * Sent 2 days after signup
 *
 * Goal: Drive first interaction with the directory
 * Content: How to use configurations, top agents, quick start guide
 */

import React from 'npm:react@18.3.1';
import { Button, Hr, Section, Text } from 'npm:@react-email/components@0.0.22';
import { buildEmailCtaUrl } from '../cta.ts';
import { EMAIL_UTM_TEMPLATES } from '../utm-templates.ts';
import { BaseLayout, renderEmailTemplate } from '../base-template.tsx';
import {
  contentSection,
  dividerStyle,
  footerNoteSection,
  footerNoteStyle,
  paragraphStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  sectionTitleStyle,
  strongStyle,
} from '../common-styles.ts';
import { BulletListSection, HeroBlock, StepCardList } from '../components/sections.tsx';
import { borderRadius, emailTheme, spacing, typography } from '../theme.ts';
import { EmailFooterNote } from '../components/footer-note.tsx';
import { buildOnboardingFooter } from '../config/footer-presets.ts';
import { EmailCtaSection } from '../components/cta.tsx';

export interface OnboardingGettingStartedProps {
  /**
   * Subscriber's email address
   */
  email: string;
}

/**
 * Getting Started Email Component (Step 2 of 5)
 */
export function OnboardingGettingStarted({ email }: OnboardingGettingStartedProps) {
  const baseUrl = 'https://claudepro.directory';
  const utm = EMAIL_UTM_TEMPLATES.ONBOARDING_GETTING_STARTED;

  const quickStartSteps: Array<{
    step: number;
    title: string;
    description: string;
    cta: { label: string; href: string };
  }> = [
    {
      step: 1,
      title: 'Browse Top Agents',
      description:
        'Start with our most popular AI agents for code review, API building, and documentation.',
      cta: {
        label: 'View Top Agents',
        href: buildEmailCtaUrl(`${baseUrl}/agents`, utm, { content: 'step_1_agents' }),
      },
    },
    {
      step: 2,
      title: 'Try MCP Servers',
      description:
        "Extend Claude's capabilities with Model Context Protocol servers for real-time data and workflows.",
      cta: {
        label: 'Explore MCP Servers',
        href: buildEmailCtaUrl(`${baseUrl}/mcp`, utm, { content: 'step_2_mcp' }),
      },
    },
    {
      step: 3,
      title: 'Add Custom Rules',
      description:
        "Define coding standards, response formats, and project guidelines so Claude understands your workflow.",
      cta: {
        label: 'Browse Rules',
        href: buildEmailCtaUrl(`${baseUrl}/rules`, utm, { content: 'step_3_rules' }),
      },
    },
  ];

  const featuredItems = [
    {
      title: 'API Builder Agent',
      description: 'Generate REST APIs with best practices baked in.',
    },
    {
      title: 'Code Reviewer',
      description: 'Automated code review with security checks.',
    },
    {
      title: 'Database Specialist',
      description: 'SQL optimization and schema design guidance.',
    },
  ] as const;

  return (
    <BaseLayout
      preview="Getting Started with Claude Pro Directory - Your Quick Start Guide"
      utm={utm}
    >
      <HeroBlock
        title="Ready to Supercharge Claude? 🚀"
        subtitle="Let's get you started with the best configurations and tools."
      />

      <Hr style={dividerStyle} />

      <StepCardList title="Quick Start in 3 Steps" steps={quickStartSteps} />

      <Hr style={dividerStyle} />

      <Section style={contentSection}>
        <Text style={sectionTitleStyle}>🌟 Start With These</Text>
        <Text style={paragraphStyle}>Our community's most loved configurations for beginners:</Text>
      </Section>

      <BulletListSection
        items={featuredItems.map((item) => ({
          title: item.title,
          description: item.description,
        }))}
      />

        <EmailCtaSection
          utm={utm}
          buttons={[
            {
              preset: 'viewTrending',
              variant: 'primary',
              overrides: { label: 'See All Trending' },
            },
          ]}
        />

      <Hr style={dividerStyle} />

      <Section style={helpSection}>
        <Text style={helpTitleStyle}>Need Help Getting Started?</Text>
        <Text style={paragraphStyle}>
          Check out our tutorials and guides for step-by-step instructions on using Claude configurations effectively.
        </Text>
        <Button
          href={buildEmailCtaUrl(`${baseUrl}/guides/tutorials`, utm, { content: 'tutorials_cta' })}
          style={secondaryButtonStyle}
        >
          View Tutorials
        </Button>
      </Section>

        <EmailFooterNote lines={buildOnboardingFooter('step2', { email })} />
    </BaseLayout>
  );
}

const helpSection: React.CSSProperties = {
  textAlign: 'center',
  backgroundColor: emailTheme.bgTertiary,
  padding: spacing.lg,
  borderRadius: borderRadius.md,
  marginTop: spacing.lg,
  marginBottom: spacing.lg,
};

const helpTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.xl,
  fontWeight: typography.fontWeight.semibold,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.sm} 0`,
};

export default OnboardingGettingStarted;

export async function renderOnboardingGettingStartedEmail(
  props: OnboardingGettingStartedProps
): Promise<string> {
  return renderEmailTemplate(OnboardingGettingStarted, props);
}

