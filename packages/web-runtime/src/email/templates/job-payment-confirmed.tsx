/**
 * Job Payment Confirmed Email Template
 * Sent when payment is confirmed and job goes live
 *
 * Features:
 * - Payment confirmation
 * - Job live notification
 * - Payment details
 * - Expiration date
 * - View listing CTA
 * - Dark mode compatible
 */

import { Button, Section, Text } from '@react-email/components';
import React from 'react';
import { BaseLayout } from '../base-template';
import { EmailCard } from '../components/card';
import { EmailBadge } from '../components/badge';
import { buildEmailCtaUrl } from '../cta';
import { brandColors, emailTheme, spacing, typography } from '../theme';
import { EMAIL_UTM_TEMPLATES } from '../utm-templates';

export interface JobPaymentConfirmedEmailProps {
  /**
   * Job title
   */
  jobTitle: string;

  /**
   * Company name (optional)
   */
  company?: string;

  /**
   * Job slug (for URL generation)
   */
  jobSlug: string;

  /**
   * Payment amount (0 if free)
   */
  paymentAmount: number;

  /**
   * Expiration date (formatted string)
   */
  expiresDate: string;

  /**
   * Base URL for links
   */
  baseUrl?: string;
}

/**
 * Job Payment Confirmed Email Component
 *
 * Usage:
 * ```tsx
 * <JobPaymentConfirmedEmail
 *   jobTitle="Senior AI Engineer"
 *   company="Acme Corp"
 *   jobSlug="senior-ai-engineer"
 *   paymentAmount={99}
 *   expiresDate="January 15, 2025"
 * />
 * ```
 */
export function JobPaymentConfirmedEmail({
  jobTitle,
  company,
  jobSlug,
  paymentAmount,
  expiresDate,
  baseUrl = 'https://claudepro.directory',
}: JobPaymentConfirmedEmailProps) {
  const utm = EMAIL_UTM_TEMPLATES.JOB_PAYMENT_CONFIRMED || {
    source: 'email',
    medium: 'transactional',
    campaign: 'job-payment-confirmed',
  };
  const jobUrl = buildEmailCtaUrl(`${baseUrl}/jobs/${jobSlug}`, utm, {
    content: 'view_job_button',
  });
  const dashboardUrl = buildEmailCtaUrl(`${baseUrl}/account/jobs`, utm, {
    content: 'dashboard_link',
  });

  return (
    <BaseLayout
      preview={`Payment confirmed! Your job posting "${jobTitle}"${company ? ` at ${company}` : ''} is now live.`}
      utm={utm}
    >
      <Section style={heroSection}>
        <Text style={heroTitleStyle}>🎉 Your Job is Live!</Text>
        <Text style={heroSubtitleStyle}>
          Payment confirmed! Your job posting <strong>{jobTitle}</strong>
          {company ? ` at ${company}` : ''} is now live.
        </Text>
      </Section>

      <EmailCard variant="highlight">
        <Section style={detailsRow}>
          {paymentAmount > 0 && (
            <>
              <Text style={detailLabelStyle}>Payment:</Text>
              <Text style={detailValueStyle}>${paymentAmount.toLocaleString()}</Text>
            </>
          )}
        </Section>
        {expiresDate !== 'TBD' && (
          <Section style={detailsRow}>
            <Text style={detailLabelStyle}>Expires:</Text>
            <EmailBadge variant="info" size="sm">
              {expiresDate}
            </EmailBadge>
          </Section>
        )}
      </EmailCard>

      <Section style={ctaSection}>
        <Button href={jobUrl} style={primaryButtonStyle}>
          View Your Listing
        </Button>
      </Section>

      <Section style={footerNoteSection}>
        <Text style={footerNoteStyle}>
          Track your listing's performance in your{' '}
          <a href={dashboardUrl} style={linkStyle}>
            account dashboard
          </a>
          .
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

const detailsRow: React.CSSProperties = {
  marginBottom: spacing.sm,
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
};

const detailLabelStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  fontWeight: typography.fontWeight.semibold,
  color: emailTheme.textPrimary,
  margin: 0,
  minWidth: '100px',
};

const detailValueStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: emailTheme.textPrimary,
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

const linkStyle: React.CSSProperties = {
  color: brandColors.primary,
  textDecoration: 'underline',
};

