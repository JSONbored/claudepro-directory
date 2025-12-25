/**
 * Job Expiring Email Template
 * Sent when a job listing is about to expire
 *
 * Features:
 * - Expiration warning
 * - Days remaining count
 * - Renewal CTA
 * - Urgency messaging
 * - Dark mode compatible
 */

import { Button, Section, Text } from '@react-email/components';
import React from 'react';
import { BaseLayout } from '../base-template';
import { EmailCard } from '../components/card';
import { EmailBadge } from '../components/badge';
import { brandColors, emailTheme, spacing, typography } from '../theme';
import { EMAIL_UTM_TEMPLATES } from '../utm-templates';

export interface JobExpiringEmailProps {
  /**
   * Job title
   */
  jobTitle: string;

  /**
   * Days remaining until expiration
   */
  daysRemaining: number;

  /**
   * Renewal URL
   */
  renewalUrl: string;
}

/**
 * Job Expiring Email Component
 *
 * Usage:
 * ```tsx
 * <JobExpiringEmail
 *   jobTitle="Senior AI Engineer"
 *   daysRemaining={7}
 *   renewalUrl="https://claudepro.directory/account/jobs/renew/..."
 * />
 * ```
 */
export function JobExpiringEmail({ jobTitle, daysRemaining, renewalUrl }: JobExpiringEmailProps) {
  const utm = EMAIL_UTM_TEMPLATES.JOB_EXPIRING || {
    source: 'email',
    medium: 'transactional',
    campaign: 'job-expiring',
  };

  const daysText = daysRemaining === 1 ? 'day' : 'days';

  return (
    <BaseLayout
      preview={`Your job posting "${jobTitle}" will expire in ${daysRemaining} ${daysText}.`}
      utm={utm}
    >
      <Section style={heroSection}>
        <Text style={heroTitleStyle}>⏰ Your Listing is Expiring Soon</Text>
        <Text style={heroSubtitleStyle}>
          Your job posting <strong>{jobTitle}</strong> will expire in{' '}
          <strong>
            {daysRemaining} {daysText}
          </strong>
          .
        </Text>
      </Section>

      <EmailCard variant="bordered">
        <Section style={urgencySection}>
          <EmailBadge variant="warning" size="default">
            {daysRemaining} {daysText} remaining
          </EmailBadge>
        </Section>
      </EmailCard>

      <Section style={infoSection}>
        <Text style={infoTextStyle}>
          Renew now to keep your listing active and continue reaching qualified candidates.
        </Text>
      </Section>

      <Section style={ctaSection}>
        <Button href={renewalUrl} style={primaryButtonStyle}>
          Renew Listing
        </Button>
      </Section>
    </BaseLayout>
  );
}

// Styles
const heroSection: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: spacing.xl,
};

const heroTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize['2xl'],
  fontWeight: typography.fontWeight.bold,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.md} 0`,
};

const heroSubtitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: emailTheme.textSecondary,
  lineHeight: typography.lineHeight.relaxed,
  margin: 0,
};

const urgencySection: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: spacing.sm,
};

const infoSection: React.CSSProperties = {
  marginTop: spacing.lg,
  marginBottom: spacing.lg,
};

const infoTextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: emailTheme.textSecondary,
  lineHeight: typography.lineHeight.relaxed,
  margin: 0,
  textAlign: 'center',
};

const ctaSection: React.CSSProperties = {
  textAlign: 'center',
  marginTop: spacing.xl,
  marginBottom: spacing.xl,
};

const primaryButtonStyle: React.CSSProperties = {
  backgroundColor: brandColors.primary,
  color: emailTheme.textInverse,
  fontWeight: typography.fontWeight.semibold,
  fontSize: typography.fontSize.base,
  padding: `${spacing.md} ${spacing.xl}`,
  borderRadius: '6px',
  textDecoration: 'none',
  display: 'inline-block',
};
