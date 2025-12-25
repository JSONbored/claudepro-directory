/**
 * Job Expiration Reminder Email Template
 * Sent to employers 5 days before job posting expires
 *
 * Features:
 * - Expiration warning
 * - Renewal call-to-action
 * - Clear urgency message
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

export interface JobExpirationReminderEmailProps {
  /**
   * Job title
   */
  jobTitle: string;

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
 * JobExpirationReminderEmail Component
 */
export function JobExpirationReminderEmail({
  jobTitle,
  name,
  email,
}: JobExpirationReminderEmailProps) {
  const baseUrl = 'https://claudepro.directory';
  const utm = EMAIL_UTM_TEMPLATES.DRIP_JOB_EXPIRATION_REMINDER;
  const manageJobsUrl = `${baseUrl}/account/jobs`;

  return (
    <BaseLayout preview={`⏰ Your job posting expires in 5 days - renew now?`} utm={utm}>
      <Section style={contentSectionStyle}>
        <Text style={titleStyle}>⏰ Your Job Posting Expires in 5 Days</Text>
        <Text style={greetingStyle}>Hi {name},</Text>
        <Text style={paragraphStyle}>
          Your job posting <strong>"{jobTitle}"</strong> will expire in 5 days.
        </Text>

        <EmailCard variant="default" style={renewalCardStyle}>
          <Text style={renewalTitleStyle}>
            <strong>Still hiring?</strong>
          </Text>
          <Text style={renewalDescriptionStyle}>
            Renew your listing to keep it visible to qualified candidates.
          </Text>
        </EmailCard>

        <div style={ctaContainerStyle}>
          <Link
            href={buildEmailCtaUrl(manageJobsUrl, utm, {
              content: 'primary_cta',
            })}
            style={primaryCtaStyle}
          >
            Manage Your Postings
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
export default JobExpirationReminderEmail;

// ============================================================================
// Styles
// ============================================================================

const contentSectionStyle: React.CSSProperties = {
  padding: spacing.lg,
};

const titleStyle: React.CSSProperties = {
  fontSize: typography.fontSize['2xl'],
  fontWeight: typography.fontWeight.bold,
  color: '#f59e0b',
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

const renewalCardStyle: React.CSSProperties = {
  padding: spacing.md,
  marginBottom: spacing.lg,
  backgroundColor: '#fef3c7',
  borderLeft: '4px solid #f59e0b',
};

const renewalTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  fontWeight: typography.fontWeight.semibold,
  color: emailTheme.textPrimary,
  margin: 0,
};

const renewalDescriptionStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textSecondary,
  margin: `${spacing.xs} 0 0`,
  lineHeight: typography.lineHeight.relaxed,
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
