/**
 * Job Approved Email Template
 * Sent when a job listing is approved (payment required)
 *
 * Features:
 * - Approval confirmation
 * - Payment information
 * - Plan details
 * - Payment CTA
 * - Dark mode compatible
 */

import { Button, Section, Text } from '@react-email/components';
import React from 'react';
import { BaseLayout } from '../base-template';
import { EmailCard } from '../components/card';
import { EmailBadge } from '../components/badge';
import { brandColors, emailTheme, spacing, typography } from '../theme';
import { EMAIL_UTM_TEMPLATES } from '../utm-templates';

export interface JobApprovedEmailProps {
  /**
   * Job title
   */
  jobTitle: string;

  /**
   * Company name (optional)
   */
  company?: string;

  /**
   * Payment amount (0 if free plan)
   */
  paymentAmount: number;

  /**
   * Payment URL
   */
  paymentUrl: string;

  /**
   * Plan name (e.g., "standard", "premium")
   */
  plan: string;
}

/**
 * Job Approved Email Component
 *
 * Usage:
 * ```tsx
 * <JobApprovedEmail
 *   jobTitle="Senior AI Engineer"
 *   company="Acme Corp"
 *   paymentAmount={99}
 *   paymentUrl="https://claudepro.directory/payment/..."
 *   plan="standard"
 * />
 * ```
 */
export function JobApprovedEmail({
  jobTitle,
  company,
  paymentAmount,
  paymentUrl,
  plan,
}: JobApprovedEmailProps) {
  const utm = EMAIL_UTM_TEMPLATES.JOB_APPROVED || {
    source: 'email',
    medium: 'transactional',
    campaign: 'job-approved',
  };

  const planDisplay = plan.charAt(0).toUpperCase() + plan.slice(1);

  return (
    <BaseLayout
      preview={`Great news! Your job posting "${jobTitle}"${company ? ` at ${company}` : ''} has been approved.`}
      utm={utm}
    >
      <Section style={heroSection}>
        <Text style={heroTitleStyle}>✅ Job Approved!</Text>
        <Text style={heroSubtitleStyle}>
          Great news! Your job posting <strong>{jobTitle}</strong>
          {company ? ` at ${company}` : ''} has been approved.
        </Text>
      </Section>

      <EmailCard variant="highlight">
        <Section style={detailsSection}>
          <Text style={detailLabelStyle}>Plan:</Text>
          <EmailBadge variant="info" size="sm">
            {planDisplay}
          </EmailBadge>
        </Section>
        {paymentAmount > 0 && (
          <Section style={detailsSection}>
            <Text style={detailLabelStyle}>Amount:</Text>
            <Text style={detailValueStyle}>${paymentAmount.toLocaleString()}</Text>
          </Section>
        )}
      </EmailCard>

      <Section style={infoSection}>
        <Text style={infoTextStyle}>
          Complete your payment to make your listing live and reach thousands of Claude developers.
        </Text>
      </Section>

      <Section style={ctaSection}>
        <Button href={paymentUrl} style={primaryButtonStyle}>
          Complete Payment
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

const detailsSection: React.CSSProperties = {
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
  minWidth: '80px',
};

const detailValueStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: emailTheme.textPrimary,
  margin: 0,
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

