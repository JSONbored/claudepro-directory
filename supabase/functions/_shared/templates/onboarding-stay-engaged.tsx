/**
 * Onboarding Email 5: Stay Engaged
 * Sent 14 days after signup
 *
 * Goal: Long-term retention and feedback
 * Content: Recap of journey, new features, feedback request, continued engagement
 */

import { Button, Hr, Section, Text } from 'npm:@react-email/components@0.0.22';
import type * as React from 'react';
import { addUTMToURL } from '../utils/email-utm.ts';
import { EMAIL_UTM_TEMPLATES } from '../utils/utm-templates.ts';
import { BaseLayout } from '../layouts/base-layout.tsx';
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
} from '../utils/common-styles.ts';
import { borderRadius, brandColors, emailTheme, spacing, typography } from '../utils/theme.ts';

export interface OnboardingStayEngagedProps {
  /**
   * Subscriber's email address
   */
  email: string;
}

/**
 * Stay Engaged Email Component (Step 5 of 5)
 */
export function OnboardingStayEngaged({ email }: OnboardingStayEngagedProps) {
  const baseUrl = 'https://claudepro.directory';
  const utm = EMAIL_UTM_TEMPLATES.ONBOARDING_STAY_ENGAGED;

  return (
    <BaseLayout preview="Stay Engaged with ClaudePro - Your Feedback Matters!" utm={utm}>
      {/* Hero section */}
      <Section style={heroSection}>
        <Text style={headingStyle}>You're All Set! 🎉</Text>
        <Text style={subheadingStyle}>Two weeks in - let's keep the momentum going</Text>
      </Section>

      <Hr style={dividerStyle} />

      {/* Journey Recap */}
      <Section style={recapSection}>
        <Text style={sectionTitleStyle}>Your Journey So Far</Text>
        <Text style={paragraphStyle}>Over the past two weeks, you've discovered:</Text>

        <div style={checklistStyle}>
          <div style={checkItemStyle}>
            <Text style={checkIconStyle}>✓</Text>
            <Text style={checkTextStyle}>How to use top agents and configurations</Text>
          </div>
          <div style={checkItemStyle}>
            <Text style={checkIconStyle}>✓</Text>
            <Text style={checkTextStyle}>Advanced MCP server integration techniques</Text>
          </div>
          <div style={checkItemStyle}>
            <Text style={checkIconStyle}>✓</Text>
            <Text style={checkTextStyle}>Power user tips and best practices</Text>
          </div>
          <div style={checkItemStyle}>
            <Text style={checkIconStyle}>✓</Text>
            <Text style={checkTextStyle}>The ClaudePro community and how to contribute</Text>
          </div>
        </div>
      </Section>

      <Hr style={dividerStyle} />

      {/* What's New */}
      <Section style={contentSection}>
        <Text style={sectionTitleStyle}>🆕 What's New</Text>

        <Section style={cardStyle}>
          <Text style={newsTitleStyle}>Weekly Digests</Text>
          <Text style={newsDescStyle}>
            You'll now receive a weekly email with new configurations and trending tools. Stay
            updated without having to check the site constantly.
          </Text>
        </Section>

        <Section style={cardStyle}>
          <Text style={newsTitleStyle}>Enhanced Search</Text>
          <Text style={newsDescStyle}>
            Find exactly what you need with improved search and filtering across all configuration
            types.
          </Text>
        </Section>

        <Section style={cardStyle}>
          <Text style={newsTitleStyle}>More Integrations</Text>
          <Text style={newsDescStyle}>
            New MCP servers and integrations are added regularly. Check back often for the latest
            tools.
          </Text>
        </Section>
      </Section>

      <Hr style={dividerStyle} />

      {/* Feedback Request */}
      <Section style={feedbackSection}>
        <Text style={feedbackTitleStyle}>We'd Love Your Feedback! 💭</Text>
        <Text style={paragraphStyle}>
          Your input helps us make ClaudePro Directory better for everyone. Tell us:
        </Text>

        <ul style={listStyle}>
          <li style={listItemStyle}>What features do you find most valuable?</li>
          <li style={listItemStyle}>What could we improve?</li>
          <li style={listItemStyle}>What configurations are you looking for?</li>
          <li style={listItemStyle}>Any success stories to share?</li>
        </ul>

        <Button
          href={addUTMToURL(`${baseUrl}/feedback`, { ...utm, content: 'feedback_cta' })}
          style={primaryButtonStyle}
        >
          Share Your Feedback
        </Button>
      </Section>

      <Hr style={dividerStyle} />

      {/* Stay Connected */}
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

      {/* Thank You */}
      <Section style={thankYouSection}>
        <Text style={thankYouTitleStyle}>Thank You! 🙏</Text>
        <Text style={thankYouTextStyle}>
          We're grateful to have you in the ClaudePro community. Whether you're just browsing or
          actively contributing, you're helping make Claude more powerful for everyone.
        </Text>
        <Text style={thankYouTextStyle}>Keep building amazing things with Claude!</Text>
      </Section>

      {/* Footer note */}
      <Section style={footerNoteSection}>
        <Text style={footerNoteStyle}>
          📧 <strong style={strongStyle}>{email}</strong>
        </Text>
        <Text style={footerNoteStyle}>
          This was the final email in your onboarding series. You'll continue to receive weekly
          digests with the latest content.
        </Text>
      </Section>
    </BaseLayout>
  );
}

/**
 * Template-specific custom styles
 * (Styles for recap checklist, news cards, feedback section, and thank-you section)
 */

const recapSection: React.CSSProperties = {
  backgroundColor: emailTheme.bgTertiary,
  padding: spacing.lg,
  borderRadius: borderRadius.md,
  marginTop: spacing.lg,
  marginBottom: spacing.lg,
};

const checklistStyle: React.CSSProperties = {
  marginTop: spacing.md,
};

const checkItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: spacing.sm,
  marginBottom: spacing.sm,
};

const checkIconStyle: React.CSSProperties = {
  fontSize: typography.fontSize.lg,
  color: brandColors.primary,
  fontWeight: typography.fontWeight.bold,
  flexShrink: 0,
  margin: 0,
};

const checkTextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: emailTheme.textSecondary,
  lineHeight: typography.lineHeight.relaxed,
  margin: 0,
};

const newsTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.lg,
  fontWeight: typography.fontWeight.semibold,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.xs} 0`,
};

const newsDescStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textSecondary,
  lineHeight: typography.lineHeight.relaxed,
  margin: 0,
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
  color: brandColors.primary,
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
  color: brandColors.primary,
  margin: `0 0 ${spacing.md} 0`,
};

const thankYouTextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: emailTheme.textSecondary,
  lineHeight: typography.lineHeight.relaxed,
  margin: `0 0 ${spacing.sm} 0`,
};

/**
 * Export default for easier imports
 */
export default OnboardingStayEngaged;
