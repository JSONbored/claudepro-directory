/**
 * Onboarding Email 5: Stay Engaged
 * Sent 14 days after signup
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
  strongStyle,
} from '../utils/email/common-styles.ts';
import { BulletListSection, HeroBlock, CardListSection } from '../utils/email/components/sections.tsx';
import { borderRadius, emailTheme, spacing, typography } from '../utils/email/theme.ts';

export interface OnboardingStayEngagedProps {
  email: string;
}

const JOURNEY_RECAP = [
  'How to use top agents and configurations',
  'Advanced MCP server integration techniques',
  'Power user tips and best practices',
  'The ClaudePro community and how to contribute',
] as const;

const WHATS_NEW = [
  {
    title: 'Weekly Digests',
    description:
      "You'll now receive a weekly email with new configurations and trending tools. Stay updated without checking the site constantly.",
  },
  {
    title: 'Enhanced Search',
    description: 'Find exactly what you need with improved search and filtering across configuration types.',
  },
  {
    title: 'More Integrations',
    description: 'New MCP servers and integrations are added regularly—check back often.',
  },
] as const;

const FEEDBACK_PROMPTS = [
  { title: 'Most valuable features', description: 'What do you rely on every week?' },
  { title: 'Improvements', description: 'Where could ClaudePro do better?' },
  { title: 'Config wishlist', description: 'What workflows need better coverage?' },
  { title: 'Success stories', description: 'Share wins so we can highlight them!' },
] as const;

export function OnboardingStayEngaged({ email }: OnboardingStayEngagedProps) {
  const baseUrl = 'https://claudepro.directory';
  const utm = EMAIL_UTM_TEMPLATES.ONBOARDING_STAY_ENGAGED;

  return (
    <BaseLayout preview="Stay Engaged with ClaudePro - Your Feedback Matters!" utm={utm}>
      <HeroBlock
        title="You're All Set! 🎉"
        subtitle="Two weeks in – let's keep the momentum going."
      />

      <Hr style={dividerStyle} />

      <Section style={journeySection}>
        <Text style={ctaTitleStyle}>Your Journey So Far</Text>
        <BulletListSection
          items={JOURNEY_RECAP.map((item) => ({
            title: item,
          }))}
        />
      </Section>

      <Hr style={dividerStyle} />

      <CardListSection title="🆕 What's New" cards={WHATS_NEW} />

      <Hr style={dividerStyle} />

      <Section style={feedbackSection}>
        <Text style={feedbackTitleStyle}>We'd Love Your Feedback! 💭</Text>
        <BulletListSection
          items={FEEDBACK_PROMPTS.map((item) => ({
            title: item.title,
            description: item.description,
          }))}
        />
        <Button
          href={addUTMToURL(`${baseUrl}/feedback`, { ...utm, content: 'feedback_cta' })}
          style={primaryButtonStyle}
        >
          Share Your Feedback
        </Button>
      </Section>

      <Hr style={dividerStyle} />

      <Section style={ctaSection}>
        <Text style={ctaTitleStyle}>Stay Connected</Text>
        <Text style={paragraphStyle}>
          Continue exploring new configurations and join our growing community.
        </Text>

        <Button
          href={addUTMToURL(baseUrl, { ...utm, content: 'browse_cta' })}
          style={secondaryButtonStyle}
        >
          Browse Directory
        </Button>

        <Button
          href={addUTMToURL(`${baseUrl}/trending`, { ...utm, content: 'trending_cta' })}
          style={secondaryButtonStyle}
        >
          View Trending
        </Button>
      </Section>

      <Hr style={dividerStyle} />

      <Section style={thankYouSection}>
        <Text style={thankYouTitleStyle}>Thank You! 🙏</Text>
        <Text style={thankYouTextStyle}>
          We're grateful to have you in the ClaudePro community. Keep building amazing things with Claude!
        </Text>
      </Section>

      <Section style={footerNoteSection}>
        <Text style={footerNoteStyle}>
          📧 <strong style={strongStyle}>{email}</strong>
        </Text>
        <Text style={footerNoteStyle}>
          This was the final email in your onboarding series. You'll continue to receive weekly digests with the latest content.
        </Text>
      </Section>
    </BaseLayout>
  );
}

const journeySection: React.CSSProperties = {
  backgroundColor: emailTheme.bgTertiary,
  padding: spacing.lg,
  borderRadius: borderRadius.md,
  marginTop: spacing.lg,
  marginBottom: spacing.lg,
};

const feedbackSection: React.CSSProperties = {
  textAlign: 'center',
  backgroundColor: emailTheme.bgTertiary,
  padding: spacing.xl,
  borderRadius: borderRadius.md,
  marginTop: spacing.lg,
  marginBottom: spacing.lg,
};

const feedbackTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize['2xl'],
  fontWeight: typography.fontWeight.bold,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.md} 0`,
};

const thankYouSection: React.CSSProperties = {
  textAlign: 'center',
  padding: spacing.lg,
  marginTop: spacing.lg,
  marginBottom: spacing.lg,
};

const thankYouTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize['2xl'],
  fontWeight: typography.fontWeight.bold,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.md} 0`,
};

const thankYouTextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: emailTheme.textSecondary,
  lineHeight: typography.lineHeight.relaxed,
  margin: `0 0 ${spacing.sm} 0`,
};

export default OnboardingStayEngaged;

export function renderOnboardingStayEngagedEmail(props: OnboardingStayEngagedProps) {
  return renderEmailTemplate(OnboardingStayEngaged, props);
}
