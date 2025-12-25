/**
 * Job Confirmation Email Template (Drip Campaign)
 * Sent to employers when their job posting goes live (part of drip campaign)
 *
 * Features:
 * - Confirmation message
 * - Next steps to maximize visibility
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

export interface JobConfirmationDripEmailProps {
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

const NEXT_STEPS = [
  'Share on LinkedIn, Twitter, and relevant communities',
  "Add to your company's careers page",
  'Consider upgrading to Featured for 3x more views',
] as const;

/**
 * JobConfirmationDripEmail Component
 */
export function JobConfirmationDripEmail({
  jobTitle,
  jobSlug,
  name,
  email,
}: JobConfirmationDripEmailProps) {
  const baseUrl = 'https://claudepro.directory';
  const utm = EMAIL_UTM_TEMPLATES.DRIP_JOB_CONFIRMATION;
  const jobUrl = `${baseUrl}/jobs/${jobSlug}`;

  return (
    <BaseLayout preview={`✅ Your Job is Live! - ${jobTitle}`} utm={utm}>
      <Section style={contentSectionStyle}>
        <Text style={titleStyle}>✅ Your Job is Live!</Text>
        <Text style={greetingStyle}>Hi {name},</Text>
        <Text style={paragraphStyle}>
          Great news! Your job posting <strong>"{jobTitle}"</strong> is now live on Claude Pro
          Directory.
        </Text>

        <EmailCard variant="default" style={nextStepsCardStyle}>
          <Text style={nextStepsTitleStyle}>
            <strong>Next steps to maximize visibility:</strong>
          </Text>
          <ul style={nextStepsListStyle}>
            {NEXT_STEPS.map((step, index) => (
              <li key={index} style={nextStepsListItemStyle}>
                {step}
              </li>
            ))}
          </ul>
        </EmailCard>

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

        <Text style={helpTextStyle}>Questions? Just reply to this email.</Text>
      </Section>

      <EmailFooterNote lines={buildSubscriptionFooter('weeklyDigest', { email })} />
    </BaseLayout>
  );
}

/**
 * Export default for easier imports
 */
export default JobConfirmationDripEmail;

// ============================================================================
// Styles
// ============================================================================

const contentSectionStyle: React.CSSProperties = {
  padding: spacing.lg,
};

const titleStyle: React.CSSProperties = {
  fontSize: typography.fontSize['2xl'],
  fontWeight: typography.fontWeight.bold,
  color: '#22c55e',
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

const nextStepsCardStyle: React.CSSProperties = {
  padding: spacing.md,
  marginBottom: spacing.lg,
  backgroundColor: '#f0fdf4',
  borderLeft: '4px solid #22c55e',
};

const nextStepsTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  fontWeight: typography.fontWeight.semibold,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.sm}`,
};

const nextStepsListStyle: React.CSSProperties = {
  margin: `${spacing.sm} 0 0`,
  paddingLeft: spacing.lg,
  color: emailTheme.textSecondary,
};

const nextStepsListItemStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  lineHeight: typography.lineHeight.relaxed,
  marginBottom: spacing.xs,
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

const helpTextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textSecondary,
  margin: `${spacing.lg} 0 0`,
  textAlign: 'center',
};
