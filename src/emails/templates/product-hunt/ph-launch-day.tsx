/**
 * Product Hunt Launch Day Email
 * Sent: November 4th at 12:01 AM PST (launch moment)
 *
 * Goal: Drive immediate upvotes and community engagement
 * Content: We're live announcement, Product Hunt link, community CTA, excitement
 */

import { Button, Hr, Section, Text } from '@react-email/components';
import type * as React from 'react';
import { addUTMToURL } from '@/src/lib/utils/email-utm';
import { EMAIL_UTM_TEMPLATES } from '@/src/lib/utils/utm-templates';
import { BaseLayout } from '../../layouts/base-layout';
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
  sectionTitleStyle,
  strongStyle,
  subheadingStyle,
} from '../../utils/common-styles';
import { borderRadius, brandColors, emailTheme, spacing, typography } from '../../utils/theme';

export interface PHLaunchDayProps {
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
 * Product Hunt Launch Day Email Component
 * Sent immediately at launch to drive upvotes and engagement
 */
export function PHLaunchDay({ email, productHuntUrl }: PHLaunchDayProps) {
  const baseUrl = 'https://claudepro.directory';
  const utm = EMAIL_UTM_TEMPLATES.PH_LAUNCH_DAY;
  const phUrl = productHuntUrl || 'https://www.producthunt.com/posts/claudepro-directory';

  return (
    <BaseLayout preview="🚀 We're LIVE on Product Hunt! Support us with your upvote" utm={utm}>
      {/* Hero section */}
      <Section style={heroSection}>
        <Text style={liveIndicatorStyle}>🔴 LIVE NOW</Text>
        <Text style={headingStyle}>We're Launching on Product Hunt!</Text>
        <Text style={subheadingStyle}>
          The moment you've been waiting for - we're officially live! 🎉
        </Text>
      </Section>

      <Hr style={dividerStyle} />

      {/* Urgent CTA - Upvote */}
      <Section style={urgentSection}>
        <Text style={urgentTitleStyle}>⚡ Your Support Needed NOW</Text>
        <Text style={urgentTextStyle}>
          The first few hours determine our Product Hunt ranking for the entire day. Click below to
          support us!
        </Text>

        <Button href={phUrl} style={urgentButtonStyle}>
          🚀 Upvote on Product Hunt
        </Button>

        <Text style={urgentSubtextStyle}>Takes 5 seconds • Makes a huge difference</Text>
      </Section>

      <Hr style={dividerStyle} />

      {/* What's Available - Free Forever */}
      <Section style={bundleSection}>
        <Text style={bundleTitleStyle}>✨ Explore 500+ Free Configurations</Text>
        <Text style={bundleSubtitleStyle}>
          100% Free • Community-Driven • No Credit Card Required
        </Text>

        <div style={priceContainerStyle}>
          <span style={newPriceStyle}>$0</span>
        </div>

        <div style={savingsBoxStyle}>
          <Text style={savingsTextStyle}>Free Forever</Text>
        </div>

        <Section style={includesBoxStyle}>
          <Text style={includesTitleStyle}>What's Available:</Text>
          <ul style={compactListStyle}>
            <li style={compactListItemStyle}>✓ 150+ Claude Agents for specialized tasks</li>
            <li style={compactListItemStyle}>✓ 50+ MCP Server integrations</li>
            <li style={compactListItemStyle}>✓ 200+ Rules, Commands, and Workflows</li>
            <li style={compactListItemStyle}>✓ Regular updates and new features</li>
            <li style={compactListItemStyle}>✓ Community contributions welcome</li>
            <li style={compactListItemStyle}>✓ Early access to beta features</li>
            <li style={compactListItemStyle}>✓ Use in personal and commercial projects</li>
          </ul>
        </Section>

        <Button
          href={addUTMToURL(`${baseUrl}/`, { ...utm, content: 'explore_directory' })}
          style={primaryButtonStyle}
        >
          Explore the Directory
        </Button>

        <Text style={guaranteeTextStyle}>
          ✓ Instant Access • ✓ No Registration Required • ✓ 100% Free
        </Text>
      </Section>

      <Hr style={dividerStyle} />

      {/* Why This Matters */}
      <Section style={contentSection}>
        <Text style={sectionTitleStyle}>💡 Why Your Support Matters</Text>

        <Section style={cardStyle}>
          <Text style={timingTitleStyle}>⚡ Early Momentum is Critical</Text>
          <Text style={timingDescStyle}>
            The first few hours determine our Product Hunt ranking for the entire day. Your upvote
            right now makes the biggest impact.
          </Text>
        </Section>

        <Section style={cardStyle}>
          <Text style={timingTitleStyle}>🌍 Help Developers Worldwide</Text>
          <Text style={timingDescStyle}>
            Higher visibility means more developers discover quality, battle-tested Claude
            configurations. Your support helps the entire community.
          </Text>
        </Section>

        <Section style={cardStyle}>
          <Text style={timingTitleStyle}>📈 Product Hunt Ranking Updates Every Hour</Text>
          <Text style={timingDescStyle}>
            Every upvote matters. Share your Claude experience, leave a review, and help us reach #1
            Product of the Day!
          </Text>
        </Section>
      </Section>

      <Hr style={dividerStyle} />

      {/* Social Proof */}
      <Section style={contentSection}>
        <Text style={sectionTitleStyle}>🌟 Join 1,000+ Claude Power Users</Text>

        <ul style={listStyle}>
          <li style={listItemStyle}>
            <strong style={strongStyle}>500+ Production Configurations</strong> battle-tested by the
            community
          </li>
          <li style={listItemStyle}>
            <strong style={strongStyle}>50+ MCP Integrations</strong> connecting Claude to your
            favorite tools
          </li>
          <li style={listItemStyle}>
            <strong style={strongStyle}>4.9/5 Average Rating</strong> from developers and AI
            professionals
          </li>
          <li style={listItemStyle}>
            <strong style={strongStyle}>Daily Updates</strong> with new configurations and
            improvements
          </li>
        </ul>
      </Section>

      <Hr style={dividerStyle} />

      {/* Two-Step Action Plan */}
      <Section style={actionPlanSection}>
        <Text style={actionPlanTitleStyle}>🎯 Your 2-Minute Action Plan</Text>

        <div style={actionStepsStyle}>
          <div style={actionStepStyle}>
            <Text style={actionStepNumberStyle}>1</Text>
            <Text style={actionStepTextStyle}>
              <strong style={strongStyle}>Upvote on Product Hunt</strong>
              <br />
              Help us reach #1 Product of the Day
            </Text>
            <Button href={phUrl} style={actionStepButtonStyle}>
              Upvote Now
            </Button>
          </div>

          <div style={actionStepDividerStyle} />

          <div style={actionStepStyle}>
            <Text style={actionStepNumberStyle}>2</Text>
            <Text style={actionStepTextStyle}>
              <strong style={strongStyle}>Explore Configurations</strong>
              <br />
              Browse 500+ free Claude resources
            </Text>
            <Button
              href={addUTMToURL(`${baseUrl}/`, { ...utm, content: 'explore_configs' })}
              style={actionStepButtonStyle}
            >
              Explore Now
            </Button>
          </div>
        </div>
      </Section>

      <Hr style={dividerStyle} />

      {/* Thank You */}
      <Section style={thankYouSection}>
        <Text style={thankYouTitleStyle}>Thank You for Your Support! 🙏</Text>
        <Text style={paragraphStyle}>
          This launch wouldn't be possible without early supporters like you. Whether you upvote,
          explore configurations, or simply share with your network - every bit of support makes a
          difference.
        </Text>
        <Text style={paragraphStyle}>Let's make this an amazing launch day together!</Text>
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
          Thank you for being part of our Product Hunt launch! Every upvote helps us reach more
          developers and grow our community.
        </Text>
      </Section>
    </BaseLayout>
  );
}

/**
 * Template-specific custom styles
 */

const liveIndicatorStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  fontWeight: typography.fontWeight.bold,
  color: '#ef4444',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: spacing.md,
  display: 'inline-block',
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  padding: `${spacing.xs} ${spacing.md}`,
  borderRadius: borderRadius.sm,
};

const urgentSection: React.CSSProperties = {
  backgroundColor: brandColors.primary,
  padding: spacing.xl,
  borderRadius: borderRadius.md,
  textAlign: 'center',
  marginTop: spacing.lg,
  marginBottom: spacing.lg,
};

const urgentTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize['2xl'],
  fontWeight: typography.fontWeight.bold,
  color: '#ffffff',
  margin: `0 0 ${spacing.md} 0`,
};

const urgentTextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: 'rgba(255, 255, 255, 0.9)',
  margin: `0 0 ${spacing.lg} 0`,
  lineHeight: typography.lineHeight.relaxed,
};

const urgentButtonStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  color: brandColors.primary,
  fontWeight: typography.fontWeight.bold,
  fontSize: typography.fontSize.lg,
  padding: `${spacing.md} ${spacing.xl}`,
  borderRadius: borderRadius.md,
  textDecoration: 'none',
  display: 'inline-block',
  border: 'none',
};

const urgentSubtextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: 'rgba(255, 255, 255, 0.8)',
  marginTop: spacing.md,
  fontStyle: 'italic',
};

const bundleSection: React.CSSProperties = {
  backgroundColor: emailTheme.bgTertiary,
  padding: spacing.xl,
  borderRadius: borderRadius.md,
  border: `2px solid ${brandColors.primary}`,
  textAlign: 'center',
  marginTop: spacing.lg,
  marginBottom: spacing.lg,
};

const bundleTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize['3xl'],
  fontWeight: typography.fontWeight.bold,
  color: brandColors.primary,
  margin: `0 0 ${spacing.xs} 0`,
};

const bundleSubtitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: emailTheme.textSecondary,
  margin: `0 0 ${spacing.lg} 0`,
};

const priceContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: spacing.md,
  margin: `${spacing.lg} 0`,
};

const newPriceStyle: React.CSSProperties = {
  fontSize: typography.fontSize['4xl'],
  fontWeight: typography.fontWeight.bold,
  color: brandColors.primary,
};

const savingsBoxStyle: React.CSSProperties = {
  backgroundColor: brandColors.primary,
  padding: `${spacing.sm} ${spacing.lg}`,
  borderRadius: borderRadius.sm,
  display: 'inline-block',
  margin: `0 0 ${spacing.lg} 0`,
};

const savingsTextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.lg,
  fontWeight: typography.fontWeight.bold,
  color: '#ffffff',
  margin: 0,
};

const includesBoxStyle: React.CSSProperties = {
  backgroundColor: emailTheme.bgSecondary,
  padding: spacing.lg,
  borderRadius: borderRadius.sm,
  margin: `${spacing.lg} 0`,
  textAlign: 'left',
};

const includesTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  fontWeight: typography.fontWeight.semibold,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.md} 0`,
};

const compactListStyle: React.CSSProperties = {
  margin: 0,
  padding: `0 0 0 ${spacing.md}`,
  listStyle: 'none',
};

const compactListItemStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textSecondary,
  marginBottom: spacing.xs,
  lineHeight: typography.lineHeight.relaxed,
};

const guaranteeTextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textTertiary,
  marginTop: spacing.md,
};

const timingTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  fontWeight: typography.fontWeight.semibold,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.xs} 0`,
};

const timingDescStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textSecondary,
  lineHeight: typography.lineHeight.relaxed,
  margin: 0,
};

const actionPlanSection: React.CSSProperties = {
  backgroundColor: emailTheme.bgTertiary,
  padding: spacing.xl,
  borderRadius: borderRadius.md,
  marginTop: spacing.lg,
  marginBottom: spacing.lg,
};

const actionPlanTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize['2xl'],
  fontWeight: typography.fontWeight.bold,
  color: emailTheme.textPrimary,
  textAlign: 'center',
  margin: `0 0 ${spacing.xl} 0`,
};

const actionStepsStyle: React.CSSProperties = {
  display: 'flex',
  gap: spacing.lg,
  justifyContent: 'center',
  alignItems: 'stretch',
};

const actionStepStyle: React.CSSProperties = {
  flex: 1,
  textAlign: 'center',
  padding: spacing.lg,
  backgroundColor: emailTheme.bgSecondary,
  borderRadius: borderRadius.md,
};

const actionStepNumberStyle: React.CSSProperties = {
  fontSize: typography.fontSize['3xl'],
  fontWeight: typography.fontWeight.bold,
  color: brandColors.primary,
  margin: `0 0 ${spacing.md} 0`,
  display: 'block',
};

const actionStepTextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textSecondary,
  margin: `0 0 ${spacing.md} 0`,
  lineHeight: typography.lineHeight.relaxed,
};

const actionStepButtonStyle: React.CSSProperties = {
  backgroundColor: brandColors.primary,
  color: '#ffffff',
  fontWeight: typography.fontWeight.semibold,
  fontSize: typography.fontSize.sm,
  padding: `${spacing.sm} ${spacing.lg}`,
  borderRadius: borderRadius.sm,
  textDecoration: 'none',
  display: 'inline-block',
  border: 'none',
};

const actionStepDividerStyle: React.CSSProperties = {
  width: '2px',
  backgroundColor: emailTheme.borderDefault,
  margin: `0 ${spacing.md}`,
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
  marginTop: spacing.lg,
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
export default PHLaunchDay;
