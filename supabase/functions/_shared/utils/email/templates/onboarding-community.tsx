/**
 * Onboarding Email 4: Community Spotlight
 * Sent 9 days after signup
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
  strongStyle,
  sectionTitleStyle,
} from '../common-styles.ts';
import { BulletListSection, HeroBlock, StepCardList } from '../components/sections.tsx';
import { borderRadius, emailTheme, spacing, typography } from '../theme.ts';
import { EmailFooterNote } from '../components/footer-note.tsx';
import { buildOnboardingFooter } from '../config/footer-presets.ts';
import { EmailCtaSection } from '../components/cta.tsx';

export interface OnboardingCommunityProps {
  email: string;
}

const COMMUNITY_STATS = [
  { label: 'Contributors', value: '1,000+' },
  { label: 'Configurations', value: '500+' },
  { label: 'MCP Servers', value: '50+' },
] as const;

const CONTRIBUTION_STEPS: Array<{
  step: number;
  title: string;
  description: string;
  cta?: { label: string; href: string };
}> = [
  {
    step: 1,
    title: 'Test Your Configuration',
    description: 'Make sure it works reliably for your use case before sharing.',
  },
  {
    step: 2,
    title: 'Document It Well',
    description: 'Clear descriptions and examples help others understand and extend it.',
  },
  {
    step: 3,
    title: 'Submit via GitHub',
    description: 'Open a pull request or issue with your configuration details.',
    cta: {
      label: 'Submit Your Configuration',
      href: '#submit',
    },
  },
];

const FEATURED_ITEMS = [
  {
    title: 'Advanced SQL Optimizer',
    description: 'Automatically tunes complex queries for performance.',
  },
  {
    title: 'Security Audit Agent',
    description: 'Comprehensive security analysis for web apps.',
  },
  {
    title: 'Documentation Generator',
    description: 'Creates API docs from code automatically.',
  },
] as const;

export function OnboardingCommunity({ email }: OnboardingCommunityProps) {
  const baseUrl = 'https://claudepro.directory';
  const utm = EMAIL_UTM_TEMPLATES.ONBOARDING_COMMUNITY;

  return (
    <BaseLayout preview="Join the Claude Pro Community - Contribute & Connect" utm={utm}>
      <HeroBlock
        title="Welcome to the Community! 🤝"
        subtitle="Built by developers, for developers – join thousands of Claude users."
      />

      <Hr style={dividerStyle} />

      <Section style={statsSection}>
        <div style={statsGrid}>
          {COMMUNITY_STATS.map((stat) => (
            <div key={stat.label} style={statCard}>
              <Text style={statNumberStyle}>{stat.value}</Text>
              <Text style={statLabelStyle}>{stat.label}</Text>
            </div>
          ))}
        </div>
      </Section>

      <Hr style={dividerStyle} />

      <BulletListSection
        heading="Why Share Your Configurations?"
        items={[
          {
            title: 'Help Others',
            description: 'Your solution might be exactly what someone else needs.',
          },
          {
            title: 'Get Feedback',
            description: 'Community members will test and improve your work.',
          },
          {
            title: 'Build Reputation',
            description: 'Become a recognized contributor in the Claude ecosystem.',
          },
          {
            title: 'Discover Better Ways',
            description: 'Learn from how others adapt your configurations.',
          },
        ]}
      />

      <Hr style={dividerStyle} />

      <StepCardList title="📝 How to Contribute" steps={CONTRIBUTION_STEPS.map((step) => ({
        ...step,
        cta: step.cta
          ? {
              ...step.cta,
              href: buildEmailCtaUrl(`${baseUrl}/submit`, utm, { content: 'submit_cta' }),
            }
          : undefined,
      }))} />

      <Hr style={dividerStyle} />

      <Section style={contentSection}>
        <Text style={sectionTitleStyle}>🌟 Featured Community Contributions</Text>
        <Text style={paragraphStyle}>Recent configurations making waves in the community:</Text>
      </Section>

      <BulletListSection
        items={FEATURED_ITEMS.map((item) => ({
          title: item.title,
          description: item.description,
        }))}
      />

        <EmailCtaSection
          utm={utm}
          buttons={[
            { preset: 'communityShowcase', variant: 'secondary' },
          ]}
        />

      <Hr style={dividerStyle} />

        <Section style={connectSection}>
          <Text style={connectTitleStyle}>Stay Connected</Text>
          <Text style={paragraphStyle}>
            Join discussions, get help, and share your experiences with other Claude users.
          </Text>
          <div style={connectLinksStyle}>
            <EmailCtaSection
              utm={utm}
              buttons={[
                { preset: 'githubCommunity', variant: 'secondary' },
                { preset: 'twitterCommunity', variant: 'secondary' },
              ]}
            />
          </div>
        </Section>

        <EmailFooterNote lines={buildOnboardingFooter('step4', { email })} />
    </BaseLayout>
  );
}

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
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.xs} 0`,
  display: 'block',
};

const statLabelStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textSecondary,
  margin: 0,
  display: 'block',
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

export default OnboardingCommunity;

export async function renderOnboardingCommunityEmail(
  props: OnboardingCommunityProps
): Promise<string> {
  return renderEmailTemplate(OnboardingCommunity, props);
}

