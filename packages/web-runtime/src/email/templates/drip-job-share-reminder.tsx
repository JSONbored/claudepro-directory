/**
 * Job Share Reminder Email Template
 * Sent to employers who haven't viewed their job posting
 *
 * Features:
 * - Reminder to share job posting
 * - Quick share options with pre-filled links
 * - Statistics on sharing impact
 * - Clear call-to-action
 * - Dark mode compatible
 */

import { Link, Section, Text } from '@react-email/components';
import React from 'react';

import { BaseLayout } from '../base-template';
import { EmailCard } from '../components/card';
import { EmailFooterNote } from '../components/footer-note';
import { buildSubscriptionFooter } from '../config/footer-presets';
import { buildEmailCtaUrl } from '../cta';
import { brandColors, emailTheme, spacing, typography } from '../theme';
import { EMAIL_UTM_TEMPLATES } from '../utm-templates';

export interface JobShareReminderEmailProps {
  /**
   * Job title
   */
  jobTitle: string;

  /**
   * Job slug for URL generation
   */
  jobSlug: string;

  /**
   * Employer's name
   */
  name: string;

  /**
   * Employer's email address
   */
  email: string;
}

/**
 * JobShareReminderEmail Component
 */
export function JobShareReminderEmail({
  jobTitle,
  jobSlug,
  name,
  email,
}: JobShareReminderEmailProps) {
  const baseUrl = 'https://claudepro.directory';
  const utm = EMAIL_UTM_TEMPLATES.DRIP_JOB_SHARE_REMINDER;
  const jobUrl = `${baseUrl}/jobs/${jobSlug}`;

  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(jobUrl)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(jobUrl)}&text=${encodeURIComponent(`We're hiring! ${jobTitle}`)}`;

  return (
    <BaseLayout
      preview={`📣 Boost visibility for "${jobTitle}" - share your posting`}
      utm={utm}
    >
      <Section style={contentSectionStyle}>
        <Text style={titleStyle}>📣 Boost Your Job Visibility</Text>
        <Text style={greetingStyle}>Hi {name},</Text>
        <Text style={paragraphStyle}>
          Your job posting <strong>"{jobTitle}"</strong> is live, but sharing it can significantly increase applications!
        </Text>

        <EmailCard variant="default" style={statCardStyle}>
          <Text style={statTitleStyle}>
            <strong>📊 Did you know?</strong>
          </Text>
          <Text style={statDescriptionStyle}>
            Shared job postings receive 4x more applications on average.
          </Text>
        </EmailCard>

        <Text style={sectionTitleStyle}>
          <strong>Quick share options:</strong>
        </Text>
        <ul style={shareListStyle}>
          <li style={shareListItemStyle}>
            <Link href={linkedInUrl} style={shareLinkStyle}>
              Share on LinkedIn
            </Link>
          </li>
          <li style={shareListItemStyle}>
            <Link href={twitterUrl} style={shareLinkStyle}>
              Share on Twitter/X
            </Link>
          </li>
        </ul>

        <div style={ctaContainerStyle}>
          <Link
            href={buildEmailCtaUrl(jobUrl, utm, {
              content: 'primary_cta',
            })}
            style={primaryCtaStyle}
          >
            View Your Posting
          </Link>
        </div>
      </Section>

      <EmailFooterNote lines={buildSubscriptionFooter('weeklyDigest', { email })} />
    </BaseLayout>
  );
}

/**
 * Export default for easier imports
 */
export default JobShareReminderEmail;

// ============================================================================
// Styles
// ============================================================================

const contentSectionStyle: React.CSSProperties = {
  padding: spacing.lg,
};

const titleStyle: React.CSSProperties = {
  fontSize: typography.fontSize['2xl'],
  fontWeight: typography.fontWeight.bold,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.md}`,
};

const greetingStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.md}`,
};

const paragraphStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  lineHeight: typography.lineHeight.relaxed,
  color: emailTheme.textSecondary,
  margin: `0 0 ${spacing.lg}`,
};

const statCardStyle: React.CSSProperties = {
  padding: spacing.md,
  marginBottom: spacing.lg,
  backgroundColor: '#fef3c7',
  borderLeft: '4px solid #f59e0b',
};

const statTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  fontWeight: typography.fontWeight.semibold,
  color: emailTheme.textPrimary,
  margin: 0,
};

const statDescriptionStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textSecondary,
  margin: `${spacing.xs} 0 0`,
  lineHeight: typography.lineHeight.relaxed,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  fontWeight: typography.fontWeight.semibold,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.sm}`,
};

const shareListStyle: React.CSSProperties = {
  margin: `0 0 ${spacing.lg}`,
  paddingLeft: spacing.lg,
  color: emailTheme.textSecondary,
};

const shareListItemStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  lineHeight: typography.lineHeight.relaxed,
  marginBottom: spacing.xs,
};

const shareLinkStyle: React.CSSProperties = {
  color: brandColors.primary,
  textDecoration: 'none',
};

const ctaContainerStyle: React.CSSProperties = {
  margin: `${spacing.xl} 0`,
  textAlign: 'center',
};

const primaryCtaStyle: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: brandColors.primary,
  color: '#1A1B17',
  padding: '12px 24px',
  borderRadius: '9999px',
  fontWeight: typography.fontWeight.semibold,
  textDecoration: 'none',
  fontSize: typography.fontSize.base,
};

