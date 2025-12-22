/**
 * Job Rejected Email Template
 * Sent when a job listing needs revisions
 *
 * Features:
 * - Rejection notification
 * - Feedback/reason display
 * - Edit CTA
 * - Encouragement message
 * - Dark mode compatible
 */

import { Button, Section, Text } from '@react-email/components';
import React from 'react';
import { BaseLayout } from '../base-template';
import { EmailCard } from '../components/card';
import { brandColors, emailTheme, spacing, typography } from '../theme';
import { EMAIL_UTM_TEMPLATES } from '../utm-templates';

export interface JobRejectedEmailProps {
  /**
   * Job title
   */
  jobTitle: string;

  /**
   * Rejection reason/feedback
   */
  rejectionReason: string;

  /**
   * Job ID (for edit URL)
   */
  jobId: string;

  /**
   * Base URL for links
   */
  baseUrl?: string;
}

/**
 * Job Rejected Email Component
 *
 * Usage:
 * ```tsx
 * <JobRejectedEmail
 *   jobTitle="Senior AI Engineer"
 *   rejectionReason="Please provide more details about the role requirements."
 *   jobId="job_123"
 * />
 * ```
 */
export function JobRejectedEmail({
  jobTitle,
  rejectionReason,
  jobId,
  baseUrl = 'https://claudepro.directory',
}: JobRejectedEmailProps) {
  const utm = EMAIL_UTM_TEMPLATES.JOB_REJECTED || {
    source: 'email',
    medium: 'transactional',
    campaign: 'job-rejected',
  };
  const editUrl = `${baseUrl}/account/jobs/${encodeURIComponent(jobId)}/edit`;

  return (
    <BaseLayout
      preview={`Your job posting "${jobTitle}" needs some updates before it can go live.`}
      utm={utm}
    >
      <Section style={heroSection}>
        <Text style={heroTitleStyle}>📝 Revisions Needed</Text>
        <Text style={heroSubtitleStyle}>
          Your job posting <strong>{jobTitle}</strong> needs some updates before it can go live.
        </Text>
      </Section>

      <EmailCard variant="bordered">
        <Section style={feedbackSection}>
          <Text style={feedbackLabelStyle}>Feedback:</Text>
          <Text style={feedbackTextStyle}>{rejectionReason}</Text>
        </Section>
      </EmailCard>

      <Section style={ctaSection}>
        <Button href={editUrl} style={primaryButtonStyle}>
          Edit Your Listing
        </Button>
      </Section>

      <Section style={footerNoteSection}>
        <Text style={footerNoteStyle}>
          Once you've made the changes, resubmit and we'll review it again quickly.
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

const feedbackSection: React.CSSProperties = {
  backgroundColor: emailTheme.bgTertiary,
  borderRadius: '8px',
  padding: spacing.md,
  borderLeft: `4px solid ${brandColors.warning}`,
};

const feedbackLabelStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  fontWeight: typography.fontWeight.semibold,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.xs} 0`,
};

const feedbackTextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: emailTheme.textPrimary,
  lineHeight: typography.lineHeight.relaxed,
  margin: 0,
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

