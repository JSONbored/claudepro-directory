/**
 * Job Performance Report Email Template
 * Sent to employers 7 days after job posting goes live
 *
 * Features:
 * - Performance metrics (views, clicks)
 * - Upgrade suggestion for low-performance jobs
 * - Clear call-to-action
 * - Dark mode compatible
 */

import { Link, Section, Text } from '@react-email/components';
import React from 'react';

import { BaseLayout } from '../base-template';
import { EmailCard } from '../components/card';
import { EmailMetrics } from '../components/metrics';
import { EmailFooterNote } from '../components/footer-note';
import { buildSubscriptionFooter } from '../config/footer-presets';
import { buildEmailCtaUrl } from '../cta';
import { brandColors, emailTheme, spacing, typography } from '../theme';
import { EMAIL_UTM_TEMPLATES } from '../utm-templates';

export interface JobPerformanceReportEmailProps {
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

  /**
   * Number of views
   */
  viewCount: number;

  /**
   * Number of clicks
   */
  clickCount: number;
}

/**
 * JobPerformanceReportEmail Component
 */
export function JobPerformanceReportEmail({
  jobTitle,
  jobSlug,
  name,
  email,
  viewCount,
  clickCount,
}: JobPerformanceReportEmailProps) {
  const baseUrl = 'https://claudepro.directory';
  const utm = EMAIL_UTM_TEMPLATES.DRIP_JOB_PERFORMANCE_REPORT;
  const jobUrl = `${baseUrl}/jobs/${jobSlug}`;
  const showUpgradeTip = viewCount < 50;

  return (
    <BaseLayout
      preview={`📊 Your job posting stats: ${viewCount} views`}
      utm={utm}
    >
      <Section style={contentSectionStyle}>
        <Text style={titleStyle}>📊 Your Job Posting Performance</Text>
        <Text style={greetingStyle}>Hi {name},</Text>
        <Text style={paragraphStyle}>
          Here's how <strong>"{jobTitle}"</strong> is performing after one week:
        </Text>

        <div style={metricsContainerStyle}>
          <EmailMetrics
            value={viewCount.toString()}
            label="Views"
            style={metricStyle}
          />
          <EmailMetrics
            value={clickCount.toString()}
            label="Clicks"
            style={metricStyle}
          />
        </div>

        {showUpgradeTip && (
          <EmailCard variant="default" style={tipCardStyle}>
            <Text style={tipTextStyle}>
              <strong>💡 Tip:</strong> Consider upgrading to Featured to boost visibility by 3x!
            </Text>
          </EmailCard>
        )}

        <div style={ctaContainerStyle}>
          <Link
            href={buildEmailCtaUrl(jobUrl, utm, {
              content: 'primary_cta',
            })}
            style={primaryCtaStyle}
          >
            View Full Analytics
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
export default JobPerformanceReportEmail;

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

const metricsContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: spacing.md,
  margin: `${spacing.lg} 0`,
  flexWrap: 'wrap',
};

const metricStyle: React.CSSProperties = {
  flex: '1',
  minWidth: '140px',
};

const tipCardStyle: React.CSSProperties = {
  padding: spacing.md,
  margin: `${spacing.lg} 0`,
  backgroundColor: '#fef3c7',
  borderLeft: '4px solid #f59e0b',
};

const tipTextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: emailTheme.textPrimary,
  margin: 0,
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

