/**
 * Product Hunt Pre-Launch Email
 * Sent: November 3rd (day before launch)
 *
 * Goal: Build excitement and ensure supporters are ready to upvote
 * Content: Launch reminder, Product Hunt link, what to expect, final prep
 */

import { Button, Hr, Section, Text } from '@react-email/components';
import type * as React from 'react';
import { addUTMToURL } from '@/src/lib/utils/email-utm';
import { EMAIL_UTM_TEMPLATES } from '@/src/lib/utils/utm-templates';
import { BaseLayout } from '../../layouts/base-layout';
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
} from '../../utils/common-styles';
import { borderRadius, brandColors, emailTheme, spacing, typography } from '../../utils/theme';

export interface PHPreLaunchProps {
  /**
   * Subscriber's email address
   */
  email: string;

  /**
   * Product Hunt launch URL
   * @default 'https://www.producthunt.com/posts/claudepro-directory'
   */
  productHuntUrl?: string;
}

/**
 * Product Hunt Pre-Launch Email Component
 * Sent 24 hours before launch to build anticipation
 */
export function PHPreLaunch({ email, productHuntUrl }: PHPreLaunchProps) {
  const baseUrl = 'https://claudepro.directory';
  const utm = EMAIL_UTM_TEMPLATES.PH_PRE_LAUNCH;
  const phUrl = productHuntUrl || 'https://www.producthunt.com/posts/claudepro-directory';

  return (
    <BaseLayout preview="Tomorrow's the day! Help us launch on Product Hunt and reach #1" utm={utm}>
      {/* Hero section */}
      <Section style={heroSection}>
        <Text style={headingStyle}>🚀 We Launch Tomorrow!</Text>
        <Text style={subheadingStyle}>November 4th at 12:01 AM PST - Mark your calendars!</Text>
        <Text style={paragraphStyle}>
          Thank you for joining our community. Tomorrow, ClaudePro Directory launches on Product
          Hunt and we need your support to reach #1 Product of the Day!
        </Text>
      </Section>

      <Hr style={dividerStyle} />

      {/* Countdown Banner */}
      <Section style={countdownSection}>
        <Text style={countdownTitleStyle}>⏰ Launch in Less Than 24 Hours</Text>
        <Text style={countdownTextStyle}>November 4, 2025 at 12:01 AM PST</Text>
        <Text style={countdownSubtextStyle}>
          Set a reminder so you can be one of the first to upvote!
        </Text>
      </Section>

      <Hr style={dividerStyle} />

      {/* What to Expect */}
      <Section style={contentSection}>
        <Text style={sectionTitleStyle}>📋 What Happens Tomorrow</Text>

        <Section style={cardStyle}>
          <Text style={stepNumberStyle}>1</Text>
          <Text style={stepTitleStyle}>We Go Live on Product Hunt</Text>
          <Text style={stepDescStyle}>
            At 12:01 AM PST, our Product Hunt page goes live. You'll receive an email with the
            direct link to support us.
          </Text>
        </Section>

        <Section style={cardStyle}>
          <Text style={stepNumberStyle}>2</Text>
          <Text style={stepTitleStyle}>Your Upvote Counts</Text>
          <Text style={stepDescStyle}>
            Every upvote in the first few hours is critical for ranking. Click the link, upvote, and
            help us reach #1 Product of the Day.
          </Text>
        </Section>

        <Section style={cardStyle}>
          <Text style={stepNumberStyle}>3</Text>
          <Text style={stepTitleStyle}>Explore & Share</Text>
          <Text style={stepDescStyle}>
            Browse 500+ free configurations, bookmark your favorites, and share with your network.
            Your participation grows the community!
          </Text>
        </Section>
      </Section>

      <Hr style={dividerStyle} />

      {/* Why Support Us */}
      <Section style={contentSection}>
        <Text style={sectionTitleStyle}>💪 Why Your Support Matters</Text>

        <ul style={listStyle}>
          <li style={listItemStyle}>
            <strong style={strongStyle}>Early Product Hunt momentum</strong> determines our ranking
            for the entire day
          </li>
          <li style={listItemStyle}>
            <strong style={strongStyle}>Higher rankings</strong> mean more developers discover
            quality Claude configurations
          </li>
          <li style={listItemStyle}>
            <strong style={strongStyle}>Community growth</strong> leads to better configurations for
            everyone
          </li>
          <li style={listItemStyle}>
            <strong style={strongStyle}>Your feedback</strong> shapes the future of the platform
          </li>
        </ul>
      </Section>

      <Hr style={dividerStyle} />

      {/* What's Available */}
      <Section style={bundleSection}>
        <Text style={bundleTitleStyle}>✨ What's Available (100% Free)</Text>
        <Text style={paragraphStyle}>
          All 500+ configurations are completely free, forever. No credit card required, no hidden
          costs.
        </Text>

        <div style={priceContainerStyle}>
          <span style={newPriceStyle}>$0</span>
        </div>

        <Text style={bundleHighlightStyle}>Free Forever • Community-Driven • Open Access</Text>

        <ul style={listStyle}>
          <li style={listItemStyle}>150+ Claude Agents for specialized tasks</li>
          <li style={listItemStyle}>50+ MCP Server integrations</li>
          <li style={listItemStyle}>200+ Rules, Commands, and Workflows</li>
          <li style={listItemStyle}>Community contributions welcome</li>
          <li style={listItemStyle}>Regular updates and new features</li>
        </ul>

        <Button
          href={addUTMToURL(`${baseUrl}/`, { ...utm, content: 'explore_directory' })}
          style={secondaryButtonStyle}
        >
          Explore the Directory
        </Button>
      </Section>

      <Hr style={dividerStyle} />

      {/* How to Support */}
      <Section style={contentSection}>
        <Text style={sectionTitleStyle}>🎯 How to Support on Launch Day</Text>

        <Section style={cardStyle}>
          <Text style={instructionNumberStyle}>✓</Text>
          <Text style={instructionTextStyle}>
            <strong style={strongStyle}>Click the Product Hunt link</strong> in tomorrow's email
            (sent at 12:01 AM PST)
          </Text>
        </Section>

        <Section style={cardStyle}>
          <Text style={instructionNumberStyle}>✓</Text>
          <Text style={instructionTextStyle}>
            <strong style={strongStyle}>Upvote our launch</strong> - it only takes one click and
            makes a huge difference
          </Text>
        </Section>

        <Section style={cardStyle}>
          <Text style={instructionNumberStyle}>✓</Text>
          <Text style={instructionTextStyle}>
            <strong style={strongStyle}>Leave a review</strong> (optional but appreciated!) - share
            your experience with Claude configurations
          </Text>
        </Section>

        <Section style={cardStyle}>
          <Text style={instructionNumberStyle}>✓</Text>
          <Text style={instructionTextStyle}>
            <strong style={strongStyle}>Share with your network</strong> - help other developers
            discover quality Claude configurations
          </Text>
        </Section>
      </Section>

      <Hr style={dividerStyle} />

      {/* Bookmark PH Link */}
      <Section style={ctaSection}>
        <Text style={ctaTitleStyle}>📌 Bookmark Our Product Hunt Page</Text>
        <Text style={paragraphStyle}>
          Want to be extra prepared? Bookmark our Product Hunt page now so you can upvote the moment
          we launch.
        </Text>

        <Button href={phUrl} style={primaryButtonStyle}>
          Visit Product Hunt Page
        </Button>

        <Text style={ctaSubtextStyle}>(The page goes live at 12:01 AM PST on November 4th)</Text>
      </Section>

      <Hr style={dividerStyle} />

      {/* Thank You */}
      <Section style={thankYouSection}>
        <Text style={thankYouTitleStyle}>Thank You! 🙏</Text>
        <Text style={paragraphStyle}>
          We're incredibly grateful for your support. Tomorrow is going to be exciting, and we
          couldn't do it without early supporters like you.
        </Text>
        <Text style={paragraphStyle}>See you at 12:01 AM PST on November 4th!</Text>
        <Text style={signatureStyle}>— The ClaudePro Directory Team</Text>
      </Section>

      <Hr style={dividerStyle} />

      {/* B2B Contact */}
      <Section style={b2bSection}>
        <Text style={b2bTitleStyle}>💼 Businesses & Organizations</Text>
        <Text style={b2bTextStyle}>
          Interested in posting job listings or featuring your Claude configurations/content?
        </Text>
        <Text style={b2bTextStyle}>
          <strong style={strongStyle}>Contact us</strong> for partnership and sponsorship
          opportunities.
        </Text>
      </Section>

      {/* Footer note */}
      <Section style={footerNoteSection}>
        <Text style={footerNoteStyle}>
          📧 <strong style={strongStyle}>{email}</strong>
        </Text>
        <Text style={footerNoteStyle}>
          You're receiving this because you joined our Product Hunt launch waitlist. Launch day
          email arrives in ~24 hours!
        </Text>
      </Section>
    </BaseLayout>
  );
}

/**
 * Template-specific custom styles
 */

const countdownSection: React.CSSProperties = {
  backgroundColor: emailTheme.bgTertiary,
  padding: spacing.xl,
  borderRadius: borderRadius.md,
  textAlign: 'center',
  border: `2px solid ${brandColors.primary}`,
  marginTop: spacing.lg,
  marginBottom: spacing.lg,
};

const countdownTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize['2xl'],
  fontWeight: typography.fontWeight.bold,
  color: brandColors.primary,
  margin: `0 0 ${spacing.sm} 0`,
};

const countdownTextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.xl,
  fontWeight: typography.fontWeight.semibold,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.xs} 0`,
};

const countdownSubtextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textSecondary,
  margin: 0,
};

const stepNumberStyle: React.CSSProperties = {
  fontSize: typography.fontSize['2xl'],
  fontWeight: typography.fontWeight.bold,
  color: brandColors.primary,
  margin: `0 0 ${spacing.xs} 0`,
  display: 'block',
};

const stepTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.lg,
  fontWeight: typography.fontWeight.semibold,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.sm} 0`,
};

const stepDescStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textSecondary,
  lineHeight: typography.lineHeight.relaxed,
  margin: 0,
};

const bundleSection: React.CSSProperties = {
  backgroundColor: emailTheme.bgTertiary,
  padding: spacing.xl,
  borderRadius: borderRadius.md,
  textAlign: 'center',
  marginTop: spacing.lg,
  marginBottom: spacing.lg,
};

const bundleTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize['2xl'],
  fontWeight: typography.fontWeight.bold,
  color: brandColors.primary,
  margin: `0 0 ${spacing.md} 0`,
};

const priceContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: spacing.md,
  margin: `${spacing.md} 0`,
};

const newPriceStyle: React.CSSProperties = {
  fontSize: typography.fontSize['4xl'],
  fontWeight: typography.fontWeight.bold,
  color: brandColors.primary,
};

const bundleHighlightStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: brandColors.primary,
  fontWeight: typography.fontWeight.semibold,
  margin: `0 0 ${spacing.lg} 0`,
};

const instructionNumberStyle: React.CSSProperties = {
  fontSize: typography.fontSize.xl,
  color: brandColors.primary,
  margin: `0 ${spacing.sm} 0 0`,
  flexShrink: 0,
};

const instructionTextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: emailTheme.textSecondary,
  lineHeight: typography.lineHeight.relaxed,
  margin: 0,
};

const ctaSubtextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textTertiary,
  fontStyle: 'italic',
  marginTop: spacing.md,
};

const thankYouSection: React.CSSProperties = {
  textAlign: 'center',
  padding: spacing.lg,
  marginTop: spacing.xl,
  marginBottom: spacing.lg,
};

const thankYouTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize['2xl'],
  fontWeight: typography.fontWeight.bold,
  color: brandColors.primary,
  margin: `0 0 ${spacing.md} 0`,
};

const signatureStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: emailTheme.textSecondary,
  fontStyle: 'italic',
  marginTop: spacing.md,
};

const b2bSection: React.CSSProperties = {
  backgroundColor: emailTheme.bgTertiary,
  padding: spacing.lg,
  borderRadius: borderRadius.md,
  textAlign: 'center',
  marginTop: spacing.lg,
  marginBottom: spacing.lg,
  border: `1px solid ${emailTheme.borderDefault}`,
};

const b2bTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.lg,
  fontWeight: typography.fontWeight.semibold,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.sm} 0`,
};

const b2bTextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textSecondary,
  lineHeight: typography.lineHeight.relaxed,
  margin: `${spacing.xs} 0`,
};

/**
 * Export default for easier imports
 */
export default PHPreLaunch;
