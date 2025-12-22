/**
 * Job Expired Email Template
 * Sent when a job listing has expired
 *
 * Features:
 * - Expiration notification
 * - Performance summary (views, clicks)
 * - Repost CTA
 * - Encouragement to repost
 * - Dark mode compatible
 */

import { Button, Section, Text } from '@react-email/components';
import React from 'react';
import { BaseLayout } from '../base-template';
import { EmailCard } from '../components/card';
import { EmailMetrics } from '../components/metrics';
import { brandColors, emailTheme, spacing, typography } from '../theme';
import { EMAIL_UTM_TEMPLATES } from '../utm-templates';

export interface JobExpiredEmailProps {
  /**
   * Job title
   */
  jobTitle: string;

  /**
   * Total views
   */
  viewCount: number;

  /**
   * Total clicks
   */
  clickCount: number;

  /**
   * Repost URL
   */
  repostUrl: string;
}

/**
 * Job Expired Email Component
 *
 * Usage:
 * ```tsx
 * <JobExpiredEmail
 *   jobTitle="Senior AI Engineer"
 *   viewCount={1234}
 *   clickCount={56}
 *   repostUrl="https://claudepro.directory/account/jobs/repost/..."
 * />
 * ```
 */
export function JobExpiredEmail({
  jobTitle,
  viewCount,
  clickCount,
  repostUrl,
}: JobExpiredEmailProps) {
  const utm = EMAIL_UTM_TEMPLATES.JOB_EXPIRED || {
    source: 'email',
    medium: 'transactional',
    campaign: 'job-expired',
  };

  return (
    <BaseLayout
      preview={`Your job posting "${jobTitle}" has reached its expiration date.`}
      utm={utm}
    >
      <Section style={heroSection}>
        <Text style={heroTitleStyle}>📊 Your Listing Has Expired</Text>
        <Text style={heroSubtitleStyle}>
          Your job posting <strong>{jobTitle}</strong> has reached its expiration date.
        </Text>
      </Section>

      <EmailCard variant="default">
        <Text style={metricsTitleStyle}>Performance Summary</Text>
        <Section style={metricsSection}>
          <EmailMetrics value={viewCount.toLocaleString()} label="Views" />
          <EmailMetrics value={clickCount.toLocaleString()} label="Clicks" />
        </Section>
      </EmailCard>

      <Section style={infoSection}>
        <Text style={infoTextStyle}>
          Still hiring? Repost your listing to reach more candidates.
        </Text>
      </Section>

      <Section style={ctaSection}>
        <Button href={repostUrl} style={primaryButtonStyle}>
          Repost Listing
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

const metricsTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.lg,
  fontWeight: typography.fontWeight.semibold,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.md} 0`,
};

const metricsSection: React.CSSProperties = {
  display: 'flex',
  gap: spacing.lg,
  justifyContent: 'space-around',
  marginTop: spacing.md,
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

