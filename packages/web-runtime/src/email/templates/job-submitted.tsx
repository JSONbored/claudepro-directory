/**
 * Job Submitted Email Template
 * Sent when a job listing is submitted for review
 *
 * Features:
 * - Confirmation message
 * - Job ID display
 * - Review timeline information
 * - Link to edit submission
 * - Dark mode compatible
 */

import { Button, Section, Text } from '@react-email/components';
import React from 'react';
import { BaseLayout } from '../base-template';
import { EmailCard } from '../components/card';
import { buildEmailCtaUrl } from '../cta';
import { emailTheme, spacing, typography } from '../theme';
import { EMAIL_UTM_TEMPLATES } from '../utm-templates';

export interface JobSubmittedEmailProps {
  /**
   * Job title
   */
  jobTitle: string;

  /**
   * Company name (optional)
   */
  company?: string;

  /**
   * Job ID
   */
  jobId: string;

  /**
   * Base URL for links
   */
  baseUrl?: string;
}

/**
 * Job Submitted Email Component
 *
 * Usage:
 * ```tsx
 * <JobSubmittedEmail
 *   jobTitle="Senior AI Engineer"
 *   company="Acme Corp"
 *   jobId="job_123"
 * />
 * ```
 */
export function JobSubmittedEmail({
  jobTitle,
  company,
  jobId,
  baseUrl = 'https://claudepro.directory',
}: JobSubmittedEmailProps) {
  const utm = EMAIL_UTM_TEMPLATES.JOB_SUBMITTED || {
    source: 'email',
    medium: 'transactional',
    campaign: 'job-submitted',
  };
  const editUrl = buildEmailCtaUrl(`${baseUrl}/account/jobs`, utm, {
    content: 'edit_job_link',
  });

  return (
    <BaseLayout
      preview={`We've received your job posting "${jobTitle}"${company ? ` at ${company}` : ''}.`}
      utm={utm}
    >
      <Section style={heroSection}>
        <Text style={heroTitleStyle}>📝 Job Submitted for Review</Text>
        <Text style={heroSubtitleStyle}>
          We've received your job posting <strong>{jobTitle}</strong>
          {company ? ` at ${company}` : ''}.
        </Text>
      </Section>

      <EmailCard variant="default">
        <Text style={infoTextStyle}>
          Our team will review your listing within 24-48 hours. You'll receive an email once it's
          approved.
        </Text>

        <Section style={jobIdSection}>
          <Text style={jobIdLabelStyle}>Job ID:</Text>
          <Text style={jobIdValueStyle}>{jobId}</Text>
        </Section>
      </EmailCard>

      <Section style={ctaSection}>
        <Button href={editUrl} style={secondaryButtonStyle}>
          Edit Your Submission
        </Button>
      </Section>

      <Section style={footerNoteSection}>
        <Text style={footerNoteStyle}>
          Need to make changes? You can edit your submission from your account dashboard.
        </Text>
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

const infoTextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: emailTheme.textPrimary,
  lineHeight: typography.lineHeight.relaxed,
  margin: `0 0 ${spacing.md} 0`,
};

const jobIdSection: React.CSSProperties = {
  backgroundColor: emailTheme.bgTertiary,
  borderRadius: '8px',
  padding: spacing.md,
  marginTop: spacing.md,
};

const jobIdLabelStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  fontWeight: typography.fontWeight.semibold,
  color: emailTheme.textSecondary,
  margin: `0 0 ${spacing.xs} 0`,
};

const jobIdValueStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textPrimary,
  fontFamily: typography.fontFamily.mono,
  margin: 0,
};

const ctaSection: React.CSSProperties = {
  textAlign: 'center',
  marginTop: spacing.xl,
  marginBottom: spacing.xl,
};

const secondaryButtonStyle: React.CSSProperties = {
  backgroundColor: emailTheme.bgSecondary,
  color: emailTheme.textPrimary,
  fontWeight: typography.fontWeight.semibold,
  fontSize: typography.fontSize.base,
  padding: `${spacing.md} ${spacing.xl}`,
  borderRadius: '6px',
  textDecoration: 'none',
  display: 'inline-block',
  border: `1px solid ${emailTheme.borderDefault}`,
};

const footerNoteSection: React.CSSProperties = {
  marginTop: spacing.lg,
};

const footerNoteStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textTertiary,
  lineHeight: typography.lineHeight.relaxed,
  textAlign: 'center',
  margin: 0,
};
