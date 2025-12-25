/**
 * Job Posted Email Template
 * Sent when a job posting goes live
 *
 * Features:
 * - Modern, branded design
 * - Clear call-to-action
 * - Job details display
 * - Dark mode compatible
 */

import { Button, Section, Text } from '@react-email/components';
import React from 'react';
import { BaseLayout } from '../base-template';
import { EmailCard } from '../components/card';
import { buildEmailCtaUrl } from '../cta';
import { brandColors, emailTheme, spacing, typography } from '../theme';
import { EMAIL_UTM_TEMPLATES } from '../utm-templates';

export interface JobPostedEmailProps {
  /**
   * Job title
   */
  jobTitle: string;

  /**
   * Company name (optional)
   */
  company?: string;

  /**
   * Job slug for URL generation
   */
  jobSlug: string;
}

/**
 * Job Posted Email Component
 *
 * Usage:
 * ```tsx
 * <JobPostedEmail
 *   jobTitle="Senior AI Engineer"
 *   company="Acme Corp"
 *   jobSlug="senior-ai-engineer"
 * />
 * ```
 */
export function JobPostedEmail({ jobTitle, company, jobSlug }: JobPostedEmailProps) {
  const baseUrl = 'https://claudepro.directory';
  const utm = EMAIL_UTM_TEMPLATES.JOB_POSTED || {
    source: 'email',
    medium: 'transactional',
    campaign: 'job-posted',
  };
  const jobUrl = buildEmailCtaUrl(`${baseUrl}/jobs/${jobSlug}`, utm, {
    content: 'view_job_button',
  });

  return (
    <BaseLayout
      preview={`Your job posting "${jobTitle}"${company ? ` at ${company}` : ''} is now live!`}
      utm={utm}
    >
      <Section style={heroSection}>
        <Text style={heroTitleStyle}>🎉 Your Job is Live!</Text>
        <Text style={heroSubtitleStyle}>
          Great news! Your job posting <strong>{jobTitle}</strong>
          {company ? ` at ${company}` : ''} is now live on Claude Pro Directory.
        </Text>
      </Section>

      <EmailCard variant="highlight">
        <Text style={cardTitleStyle}>Job Details</Text>
        <Text style={paragraphStyle}>
          <strong>Title:</strong> {jobTitle}
        </Text>
        {company && (
          <Text style={paragraphStyle}>
            <strong>Company:</strong> {company}
          </Text>
        )}
        <Text style={paragraphStyle}>
          Your listing will be visible to thousands of Claude developers and AI enthusiasts.
        </Text>
      </EmailCard>

      <Section style={ctaSection}>
        <Button href={jobUrl} style={primaryButtonStyle}>
          View Your Listing
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

const cardTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.lg,
  fontWeight: typography.fontWeight.semibold,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.md} 0`,
};

const paragraphStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: emailTheme.textPrimary,
  lineHeight: typography.lineHeight.relaxed,
  margin: `0 0 ${spacing.sm} 0`,
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
