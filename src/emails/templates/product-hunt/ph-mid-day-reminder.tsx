/**
 * Product Hunt Mid-Day Reminder Email
 * Sent: November 4th at 12:00 PM PST (12 hours into launch)
 *
 * Goal: Re-engage community members to help push for #1 Product of the Day
 * Content: Launch momentum, community stats, upvote urgency, engagement opportunities
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
  primaryButtonStyle,
  secondaryButtonStyle,
  sectionTitleStyle,
  strongStyle,
  subheadingStyle,
} from '../../utils/common-styles';
import { borderRadius, brandColors, emailTheme, spacing, typography } from '../../utils/theme';

export interface PHMidDayReminderProps {
  /**
   * Subscriber's email address
   */
  email: string;

  /**
   * Product Hunt launch URL
   * @default 'https://www.producthunt.com/posts/claudepro-directory'
   */
  productHuntUrl?: string;

  /**
   * Current Product Hunt ranking
   * @default '#3'
   */
  currentRanking?: string;

  /**
   * Number of upvotes received
   * @default 250
   */
  upvotesCount?: number;

  /**
   * Number of new community members today
   * @default 150
   */
  newMembers?: number;
}

/**
 * Product Hunt Mid-Day Reminder Email Component
 * Final push for community members to help reach #1 Product of the Day
 */
export function PHMidDayReminder({
  email,
  productHuntUrl,
  currentRanking = '#3',
  upvotesCount = 250,
  newMembers = 150,
}: PHMidDayReminderProps) {
  const baseUrl = 'https://claudepro.directory';
  const utm = EMAIL_UTM_TEMPLATES.PH_MID_DAY_REMINDER;
  const phUrl = productHuntUrl || 'https://www.producthunt.com/posts/claudepro-directory';
  const hoursLeft = 12;

  return (
    <BaseLayout preview="⏰ 12 hours left! Help us reach #1 Product of the Day" utm={utm}>
      {/* Hero section */}
      <Section style={heroSection}>
        <Text style={urgencyBadgeStyle}>⏰ FINAL HOURS</Text>
        <Text style={headingStyle}>Only {hoursLeft} Hours Left!</Text>
        <Text style={subheadingStyle}>
          Help us reach #1 Product of the Day - every upvote counts!
        </Text>
      </Section>

      <Hr style={dividerStyle} />

      {/* Launch Stats */}
      <Section style={statsSection}>
        <Text style={statsTitleStyle}>🚀 Launch Day Momentum</Text>
        <div style={statsGridStyle}>
          <div style={statBoxStyle}>
            <Text style={statNumberStyle}>{currentRanking}</Text>
            <Text style={statLabelStyle}>Current Ranking</Text>
          </div>
          <div style={statBoxStyle}>
            <Text style={statNumberStyle}>{upvotesCount}+</Text>
            <Text style={statLabelStyle}>Upvotes</Text>
          </div>
          <div style={statBoxStyle}>
            <Text style={statNumberStyle}>{newMembers}+</Text>
            <Text style={statLabelStyle}>New Members Today</Text>
          </div>
        </div>
        <Text style={statsSubtextStyle}>Amazing community support! Let's push to #1 together</Text>
      </Section>

      <Hr style={dividerStyle} />

      {/* Community Engagement */}
      <Section style={communitySection}>
        <Text style={communityTitleStyle}>🌟 Join the Growing Community</Text>
        <Text style={communityTextStyle}>
          {newMembers}+ developers have already joined today! Create your profile, bookmark
          configurations, and start contributing to the community.
        </Text>

        <div style={engagementBoxStyle}>
          <Text style={engagementTextStyle}>
            ✓ Create a free profile
            <br />✓ Bookmark your favorite configurations
            <br />✓ Contribute your own Claude setups
            <br />✓ Connect with other Claude power users
          </Text>
        </div>

        <Button
          href={addUTMToURL(`${baseUrl}/`, { ...utm, content: 'community_join' })}
          style={primaryButtonStyle}
        >
          Explore the Directory
        </Button>

        <Text style={guaranteeTextStyle}>100% Free • No Credit Card Required • Instant Access</Text>
      </Section>

      <Hr style={dividerStyle} />

      {/* Free Configurations Showcase */}
      <Section style={bundleSection}>
        <Text style={bundleTitleStyle}>✨ 500+ Free Configurations Available</Text>

        <div style={priceContainerStyle}>
          <span style={newPriceStyle}>$0</span>
        </div>

        <Text style={savingsHighlightStyle}>Free Forever • Community-Driven</Text>

        <ul style={compactListStyle}>
          <li style={compactListItemStyle}>✓ 150+ Claude Agents for specialized tasks</li>
          <li style={compactListItemStyle}>✓ 50+ MCP Server integrations</li>
          <li style={compactListItemStyle}>✓ 200+ Rules, Commands, and Workflows</li>
          <li style={compactListItemStyle}>✓ Regular updates and new features</li>
          <li style={compactListItemStyle}>✓ Community contributions welcome</li>
        </ul>

        <Button
          href={addUTMToURL(`${baseUrl}/`, { ...utm, content: 'explore_configs' })}
          style={primaryButtonStyle}
        >
          Browse Configurations
        </Button>

        <Text style={guaranteeTextStyle}>Free for personal and commercial use • Open access</Text>
      </Section>

      <Hr style={dividerStyle} />

      {/* What Happens After Today */}
      <Section style={contentSection}>
        <Text style={sectionTitleStyle}>📅 What Happens After Launch Day?</Text>

        <Section style={cardStyle}>
          <Text style={afterTitleStyle}>✓ Community Keeps Growing</Text>
          <Text style={afterDescStyle}>
            Launch day is just the beginning! We'll continue adding new configurations, improving
            existing ones, and building features based on community feedback.
          </Text>
        </Section>

        <Section style={cardStyle}>
          <Text style={afterTitleStyle}>✓ Early Members Get Recognition</Text>
          <Text style={afterDescStyle}>
            Community members who join during launch week get a special "Founding Member" badge and
            early access to new features as we roll them out.
          </Text>
        </Section>

        <Section style={cardStyle}>
          <Text style={afterTitleStyle}>✓ Everything Stays Free</Text>
          <Text style={afterDescStyle}>
            All 500+ configurations remain completely free, forever. We're building a sustainable
            community-driven platform that benefits all Claude users.
          </Text>
        </Section>
      </Section>

      <Hr style={dividerStyle} />

      {/* Social Proof - Community Feedback */}
      <Section style={contentSection}>
        <Text style={sectionTitleStyle}>💬 What Community Members Are Saying</Text>

        <Section style={testimonialStyle}>
          <Text style={testimonialQuoteStyle}>
            "Just discovered this directory - the MCP configurations alone saved me hours of setup.
            Already bookmarked 5 agents for my workflow!"
          </Text>
          <Text style={testimonialAuthorStyle}>— Launch Day Visitor</Text>
        </Section>

        <Section style={testimonialStyle}>
          <Text style={testimonialQuoteStyle}>
            "The quality of these configurations is incredible. Can't believe this is all free.
            Already shared with my team and upvoted on Product Hunt!"
          </Text>
          <Text style={testimonialAuthorStyle}>— Community Member</Text>
        </Section>

        <Section style={testimonialStyle}>
          <Text style={testimonialQuoteStyle}>
            "Finally, a curated directory of battle-tested Claude setups. Creating my profile now so
            I can contribute my own configurations back to the community."
          </Text>
          <Text style={testimonialAuthorStyle}>— Claude Power User</Text>
        </Section>
      </Section>

      <Hr style={dividerStyle} />

      {/* Two Actions */}
      <Section style={ctaSection}>
        <Text style={ctaTitleStyle}>⚡ Two Ways to Support in the Next {hoursLeft} Hours</Text>

        <div style={dualCtaContainerStyle}>
          <div style={ctaBoxStyle}>
            <Text style={ctaBoxTitleStyle}>Upvote on Product Hunt</Text>
            <Text style={ctaBoxDescStyle}>
              We're currently {currentRanking} - help us reach #1!
            </Text>
            <Button href={phUrl} style={primaryButtonStyle}>
              Upvote Now
            </Button>
          </div>

          <div style={ctaBoxStyle}>
            <Text style={ctaBoxTitleStyle}>Explore & Bookmark</Text>
            <Text style={ctaBoxDescStyle}>Browse 500+ free configurations</Text>
            <Button
              href={addUTMToURL(`${baseUrl}/`, { ...utm, content: 'explore_directory' })}
              style={secondaryButtonStyle}
            >
              Explore Directory
            </Button>
          </div>
        </div>
      </Section>

      <Hr style={dividerStyle} />

      {/* FAQ - Common Questions */}
      <Section style={contentSection}>
        <Text style={sectionTitleStyle}>❓ Quick Answers</Text>

        <ul style={listStyle}>
          <li style={listItemStyle}>
            <strong style={strongStyle}>Is everything really free?</strong> Yes! All 500+
            configurations are 100% free, forever. No credit card required.
          </li>
          <li style={listItemStyle}>
            <strong style={strongStyle}>Can I use these commercially?</strong> Absolutely! All
            configurations are free for both personal and commercial use.
          </li>
          <li style={listItemStyle}>
            <strong style={strongStyle}>How do I contribute my own configurations?</strong> Create a
            free profile and you'll be able to submit your own Claude setups for the community.
          </li>
          <li style={listItemStyle}>
            <strong style={strongStyle}>When does Product Hunt voting end?</strong> Product Hunt
            voting runs for 24 hours - until 11:59 PM PST tonight. Every upvote helps!
          </li>
        </ul>
      </Section>

      <Hr style={dividerStyle} />

      {/* Final Push */}
      <Section style={finalPushSection}>
        <Text style={finalPushTitleStyle}>⏰ Help Us Reach #1 in the Final Hours</Text>
        <Text style={finalPushTextStyle}>
          We're so close to #1 Product of the Day! With {hoursLeft} hours left, every upvote and
          share makes a real difference.
        </Text>
        <Text style={finalPushTextStyle}>
          Join the {newMembers}+ community members who've already discovered the directory today.
          Together, we're building the best resource for Claude configurations.
        </Text>

        <Button href={phUrl} style={finalPushButtonStyle}>
          Upvote on Product Hunt
        </Button>

        <Text style={finalPushSubtextStyle}>
          Takes 5 seconds • Makes a huge impact • Helps developers worldwide
        </Text>
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
          Final reminder: Product Hunt voting ends tonight at 11:59 PM PST. Thank you for your
          support!
        </Text>
      </Section>
    </BaseLayout>
  );
}

/**
 * Template-specific custom styles
 */

const urgencyBadgeStyle: React.CSSProperties = {
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
  border: '2px solid #ef4444',
};

const statsSection: React.CSSProperties = {
  backgroundColor: emailTheme.bgTertiary,
  padding: spacing.xl,
  borderRadius: borderRadius.md,
  textAlign: 'center',
  marginTop: spacing.lg,
  marginBottom: spacing.lg,
};

const statsTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.xl,
  fontWeight: typography.fontWeight.bold,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.lg} 0`,
};

const statsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: spacing.md,
  marginBottom: spacing.md,
};

const statBoxStyle: React.CSSProperties = {
  padding: spacing.md,
};

const statNumberStyle: React.CSSProperties = {
  fontSize: typography.fontSize['3xl'],
  fontWeight: typography.fontWeight.bold,
  color: brandColors.primary,
  display: 'block',
  margin: `0 0 ${spacing.xs} 0`,
};

const statLabelStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textSecondary,
  display: 'block',
};

const statsSubtextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textTertiary,
  fontStyle: 'italic',
};

const communitySection: React.CSSProperties = {
  backgroundColor: emailTheme.bgTertiary,
  padding: spacing.xl,
  borderRadius: borderRadius.md,
  border: `2px solid ${brandColors.primary}`,
  textAlign: 'center',
  marginTop: spacing.lg,
  marginBottom: spacing.lg,
};

const communityTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize['2xl'],
  fontWeight: typography.fontWeight.bold,
  color: brandColors.primary,
  margin: `0 0 ${spacing.md} 0`,
};

const communityTextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: emailTheme.textSecondary,
  lineHeight: typography.lineHeight.relaxed,
  margin: `0 0 ${spacing.lg} 0`,
};

const engagementBoxStyle: React.CSSProperties = {
  backgroundColor: emailTheme.bgSecondary,
  padding: spacing.lg,
  borderRadius: borderRadius.sm,
  margin: `0 0 ${spacing.lg} 0`,
  textAlign: 'left',
  display: 'inline-block',
};

const engagementTextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textSecondary,
  lineHeight: typography.lineHeight.relaxed,
  margin: 0,
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
  fontSize: typography.fontSize['2xl'],
  fontWeight: typography.fontWeight.bold,
  color: brandColors.primary,
  margin: `0 0 ${spacing.lg} 0`,
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

const savingsHighlightStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: '#ef4444',
  fontWeight: typography.fontWeight.semibold,
  margin: `0 0 ${spacing.lg} 0`,
};

const compactListStyle: React.CSSProperties = {
  margin: `0 0 ${spacing.lg} 0`,
  padding: 0,
  listStyle: 'none',
  textAlign: 'left',
  display: 'inline-block',
};

const compactListItemStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textSecondary,
  marginBottom: spacing.xs,
};

const guaranteeTextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textTertiary,
  marginTop: spacing.md,
};

const afterTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  fontWeight: typography.fontWeight.semibold,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.xs} 0`,
};

const afterDescStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textSecondary,
  lineHeight: typography.lineHeight.relaxed,
  margin: 0,
};

const testimonialStyle: React.CSSProperties = {
  backgroundColor: emailTheme.bgTertiary,
  padding: spacing.lg,
  borderRadius: borderRadius.md,
  marginBottom: spacing.md,
  borderLeft: `4px solid ${brandColors.primary}`,
};

const testimonialQuoteStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: emailTheme.textSecondary,
  fontStyle: 'italic',
  lineHeight: typography.lineHeight.relaxed,
  margin: `0 0 ${spacing.sm} 0`,
};

const testimonialAuthorStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textTertiary,
  fontWeight: typography.fontWeight.medium,
  margin: 0,
};

const dualCtaContainerStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: spacing.lg,
  marginTop: spacing.lg,
};

const ctaBoxStyle: React.CSSProperties = {
  padding: spacing.lg,
  backgroundColor: emailTheme.bgTertiary,
  borderRadius: borderRadius.md,
  textAlign: 'center',
};

const ctaBoxTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.lg,
  fontWeight: typography.fontWeight.semibold,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.sm} 0`,
};

const ctaBoxDescStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textSecondary,
  margin: `0 0 ${spacing.md} 0`,
};

const finalPushSection: React.CSSProperties = {
  backgroundColor: brandColors.primary,
  padding: spacing.xl,
  borderRadius: borderRadius.md,
  textAlign: 'center',
  marginTop: spacing.xl,
  marginBottom: spacing.lg,
};

const finalPushTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize['2xl'],
  fontWeight: typography.fontWeight.bold,
  color: '#ffffff',
  margin: `0 0 ${spacing.md} 0`,
};

const finalPushTextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: 'rgba(255, 255, 255, 0.9)',
  lineHeight: typography.lineHeight.relaxed,
  margin: `0 0 ${spacing.md} 0`,
};

const finalPushButtonStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  color: brandColors.primary,
  fontWeight: typography.fontWeight.bold,
  fontSize: typography.fontSize.lg,
  padding: `${spacing.md} ${spacing.xl}`,
  borderRadius: borderRadius.md,
  textDecoration: 'none',
  display: 'inline-block',
  border: 'none',
  margin: `${spacing.lg} 0 ${spacing.md} 0`,
};

const finalPushSubtextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: 'rgba(255, 255, 255, 0.8)',
  fontStyle: 'italic',
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
export default PHMidDayReminder;
