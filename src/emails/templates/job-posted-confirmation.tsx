/**
 * Job Posted Confirmation Email Template
 * Sent when a job posting is successfully created
 *
 * Features:
 * - Job details summary
 * - Post confirmation
 * - Edit and management links
 * - Tips for getting more applicants
 * - Engagement tracking
 */

import { Button, Hr, Section, Text } from '@react-email/components';
import type * as React from 'react';
import { BaseLayout } from '../layouts/base-layout';
import {
  dividerStyle,
  headingStyle,
  heroSection,
  labelCellStyle,
  paragraphStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  sectionTitleStyle,
  strongStyle,
  subheadingStyle,
  successBadgeStyle,
  tipsItemStyle,
  tipsListStyle,
  tipsTitleStyle,
  valueCellStyle,
} from '../utils/common-styles';
import { borderRadius, brandColors, emailTheme, spacing, typography } from '../utils/theme';

/**
 * Job type/category
 */
export type JobType = 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship';

/**
 * Job experience level
 */
export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead' | 'executive';

/**
 * Props for JobPostedConfirmation email
 */
export interface JobPostedConfirmationProps {
  /**
   * Employer's email address
   */
  email: string;

  /**
   * Job title
   */
  jobTitle: string;

  /**
   * Brief job description (first 200 chars)
   */
  jobDescription: string;

  /**
   * Company/organization name
   */
  companyName: string;

  /**
   * Job location (e.g., "Remote", "San Francisco, CA", "Hybrid - NYC")
   */
  location: string;

  /**
   * Job type
   */
  jobType: JobType;

  /**
   * Experience level required
   */
  experienceLevel?: ExperienceLevel;

  /**
   * Salary range (optional)
   */
  salaryRange?: string;

  /**
   * Date the job was posted (ISO string or formatted)
   */
  postedDate: string;

  /**
   * Date the job listing expires (optional)
   */
  expiresDate?: string;

  /**
   * Public URL to view the job posting
   */
  jobUrl: string;

  /**
   * URL to edit the job posting
   */
  editJobUrl: string;

  /**
   * URL to manage applications
   */
  manageApplicationsUrl?: string;

  /**
   * Job posting ID for reference
   */
  jobId: string;
}

/**
 * JobPostedConfirmation Email Component
 *
 * Confirmation email sent after successfully posting a job.
 *
 * @example
 * ```tsx
 * <JobPostedConfirmation
 *   email="employer@example.com"
 *   jobTitle="Senior React Developer"
 *   jobDescription="We're looking for an experienced React developer..."
 *   companyName="Acme Corp"
 *   location="Remote"
 *   jobType="full-time"
 *   postedDate="2025-10-06"
 *   jobUrl="https://claudepro.directory/jobs/senior-react-dev"
 *   editJobUrl="https://claudepro.directory/jobs/senior-react-dev/edit"
 *   jobId="JOB-001234"
 * />
 * ```
 */
export function JobPostedConfirmation({
  email,
  jobTitle,
  jobDescription,
  companyName,
  location,
  jobType,
  experienceLevel,
  salaryRange,
  postedDate,
  expiresDate,
  jobUrl,
  editJobUrl,
  manageApplicationsUrl,
  jobId,
}: JobPostedConfirmationProps) {
  const formattedPostedDate = formatDate(postedDate);
  const formattedExpiresDate = expiresDate ? formatDate(expiresDate) : null;

  return (
    <BaseLayout preview={`Job Posted: ${jobTitle} at ${companyName} | ${jobId}`}>
      {/* Hero section */}
      <Section style={heroSection}>
        <Text style={successBadgeStyle}>✓ Job Posted Successfully</Text>
        <Text style={headingStyle}>Your Job is Now Live! 🎉</Text>
        <Text style={subheadingStyle}>
          Your job posting is now visible to our community of talented professionals.
        </Text>
      </Section>

      <Hr style={dividerStyle} />

      {/* Job Summary Card */}
      <Section style={jobSummaryCard}>
        <Text style={jobTitleStyle}>{jobTitle}</Text>
        <Text style={companyNameStyle}>{companyName}</Text>

        <Section style={jobMetaSection}>
          <table style={metaTableStyle}>
            <tbody>
              <tr>
                <td style={metaIconCellStyle}>📍</td>
                <td style={metaCellStyle}>{location}</td>
              </tr>
              <tr>
                <td style={metaIconCellStyle}>💼</td>
                <td style={metaCellStyle}>{formatJobType(jobType)}</td>
              </tr>
              {experienceLevel && (
                <tr>
                  <td style={metaIconCellStyle}>📊</td>
                  <td style={metaCellStyle}>{formatExperienceLevel(experienceLevel)}</td>
                </tr>
              )}
              {salaryRange && (
                <tr>
                  <td style={metaIconCellStyle}>💰</td>
                  <td style={metaCellStyle}>{salaryRange}</td>
                </tr>
              )}
            </tbody>
          </table>
        </Section>

        <Text style={jobDescriptionStyle}>
          {jobDescription.length > 200 ? `${jobDescription.substring(0, 200)}...` : jobDescription}
        </Text>

        <Button href={jobUrl} style={viewJobButtonStyle}>
          View Job Posting
        </Button>
      </Section>

      <Hr style={dividerStyle} />

      {/* Job Details */}
      <Section style={detailsSection}>
        <Text style={sectionTitleStyle}>Posting Details</Text>

        <table style={detailsTableStyle}>
          <tbody>
            <tr>
              <td style={labelCellStyle}>Job ID:</td>
              <td style={valueCellStyle}>
                <strong style={strongStyle}>{jobId}</strong>
              </td>
            </tr>
            <tr>
              <td style={labelCellStyle}>Posted Date:</td>
              <td style={valueCellStyle}>{formattedPostedDate}</td>
            </tr>
            {formattedExpiresDate && (
              <tr>
                <td style={labelCellStyle}>Expires:</td>
                <td style={valueCellStyle}>{formattedExpiresDate}</td>
              </tr>
            )}
            <tr>
              <td style={labelCellStyle}>Posted By:</td>
              <td style={valueCellStyle}>{email}</td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Hr style={dividerStyle} />

      {/* Actions */}
      <Section style={actionsSection}>
        <Text style={actionsTitleStyle}>Manage Your Posting</Text>

        <Button href={editJobUrl} style={primaryButtonStyle}>
          Edit Job Posting
        </Button>

        {manageApplicationsUrl && (
          <Button href={manageApplicationsUrl} style={secondaryButtonStyle}>
            View Applications
          </Button>
        )}

        <Button href="https://claudepro.directory/jobs/dashboard" style={secondaryButtonStyle}>
          Go to Dashboard
        </Button>
      </Section>

      <Hr style={dividerStyle} />

      {/* Tips Section */}
      <Section style={tipsSection}>
        <Text style={tipsTitleStyle}>💡 Tips for Getting More Applicants</Text>

        <ul style={tipsListStyle}>
          <li style={tipsItemStyle}>
            <strong style={strongStyle}>Add detailed requirements:</strong> Clearly outline skills,
            experience, and qualifications to attract the right candidates.
          </li>
          <li style={tipsItemStyle}>
            <strong style={strongStyle}>Include salary information:</strong> Job postings with
            salary ranges get 75% more applications.
          </li>
          <li style={tipsItemStyle}>
            <strong style={strongStyle}>Respond quickly:</strong> Fast response times increase your
            chances of hiring top talent.
          </li>
          <li style={tipsItemStyle}>
            <strong style={strongStyle}>Share your posting:</strong> Promote your job on social
            media and relevant communities to reach more candidates.
          </li>
        </ul>
      </Section>

      <Hr style={dividerStyle} />

      {/* Share Section */}
      <Section style={shareSection}>
        <Text style={shareTitleStyle}>Share Your Job Posting</Text>
        <Text style={paragraphStyle}>
          Reach more candidates by sharing your posting on social media and relevant communities.
        </Text>

        <Section style={shareButtonsSection}>
          <Button
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
              `We're hiring! ${jobTitle} at ${companyName}`
            )}&url=${encodeURIComponent(jobUrl)}`}
            style={shareButtonStyle}
          >
            Share on Twitter
          </Button>
          <Button
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(jobUrl)}`}
            style={shareButtonStyle}
          >
            Share on LinkedIn
          </Button>
        </Section>
      </Section>

      {/* Support Section */}
      <Section style={supportSection}>
        <Text style={supportTextStyle}>
          Questions or need help? Contact us at{' '}
          <a href="mailto:jobs@claudepro.directory" style={linkStyle}>
            jobs@claudepro.directory
          </a>
        </Text>
      </Section>
    </BaseLayout>
  );
}

/**
 * Helper functions
 */

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

function formatJobType(type: JobType): string {
  const types: Record<JobType, string> = {
    'full-time': 'Full-Time',
    'part-time': 'Part-Time',
    contract: 'Contract',
    freelance: 'Freelance',
    internship: 'Internship',
  };
  return types[type] || type;
}

function formatExperienceLevel(level: ExperienceLevel): string {
  const levels: Record<ExperienceLevel, string> = {
    entry: 'Entry Level',
    mid: 'Mid Level',
    senior: 'Senior Level',
    lead: 'Lead/Principal',
    executive: 'Executive',
  };
  return levels[level] || level;
}

/**
 * Email-safe inline styles
 */

const jobSummaryCard: React.CSSProperties = {
  backgroundColor: emailTheme.bgTertiary,
  border: `2px solid ${brandColors.primary}`,
  borderRadius: borderRadius.lg,
  padding: spacing.xl,
  marginTop: spacing.lg,
  marginBottom: spacing.lg,
};

const jobTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize['2xl'],
  fontWeight: typography.fontWeight.bold,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.xs} 0`,
  lineHeight: typography.lineHeight.tight,
};

const companyNameStyle: React.CSSProperties = {
  fontSize: typography.fontSize.lg,
  color: brandColors.primary,
  fontWeight: typography.fontWeight.semibold,
  margin: `0 0 ${spacing.md} 0`,
};

const jobMetaSection: React.CSSProperties = {
  marginTop: spacing.md,
  marginBottom: spacing.md,
};

const metaTableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};

const metaIconCellStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  width: '24px',
  paddingRight: spacing.sm,
  paddingTop: spacing.xs,
  paddingBottom: spacing.xs,
  verticalAlign: 'top',
};

const metaCellStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textSecondary,
  paddingTop: spacing.xs,
  paddingBottom: spacing.xs,
};

const jobDescriptionStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textPrimary,
  lineHeight: typography.lineHeight.relaxed,
  margin: `${spacing.md} 0`,
};

const viewJobButtonStyle: React.CSSProperties = {
  backgroundColor: brandColors.primary,
  color: '#ffffff',
  fontWeight: typography.fontWeight.semibold,
  fontSize: typography.fontSize.base,
  padding: `${spacing.md} ${spacing.xl}`,
  borderRadius: borderRadius.md,
  textDecoration: 'none',
  display: 'inline-block',
  marginTop: spacing.md,
  border: 'none',
  width: '100%',
  textAlign: 'center',
};

const detailsSection: React.CSSProperties = {
  marginTop: spacing.lg,
  marginBottom: spacing.lg,
};

const detailsTableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};

const actionsSection: React.CSSProperties = {
  textAlign: 'center',
  marginTop: spacing.lg,
  marginBottom: spacing.lg,
};

const actionsTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.xl,
  fontWeight: typography.fontWeight.semibold,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.md} 0`,
};

const tipsSection: React.CSSProperties = {
  backgroundColor: emailTheme.bgTertiary,
  borderRadius: borderRadius.md,
  padding: spacing.lg,
  marginTop: spacing.lg,
  marginBottom: spacing.lg,
};

const shareSection: React.CSSProperties = {
  textAlign: 'center',
  marginTop: spacing.lg,
  marginBottom: spacing.lg,
};

const shareTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.lg,
  fontWeight: typography.fontWeight.semibold,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.sm} 0`,
};

const shareButtonsSection: React.CSSProperties = {
  marginTop: spacing.md,
};

const shareButtonStyle: React.CSSProperties = {
  backgroundColor: emailTheme.bgTertiary,
  color: emailTheme.textPrimary,
  fontWeight: typography.fontWeight.medium,
  fontSize: typography.fontSize.sm,
  padding: `${spacing.sm} ${spacing.lg}`,
  borderRadius: borderRadius.md,
  textDecoration: 'none',
  display: 'inline-block',
  marginTop: spacing.sm,
  marginBottom: spacing.sm,
  marginLeft: spacing.xs,
  marginRight: spacing.xs,
  border: `1px solid ${emailTheme.borderDefault}`,
};

const supportSection: React.CSSProperties = {
  marginTop: spacing.lg,
  textAlign: 'center',
};

const supportTextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textSecondary,
  lineHeight: typography.lineHeight.relaxed,
  margin: 0,
};

const linkStyle: React.CSSProperties = {
  color: brandColors.primary,
  textDecoration: 'none',
};

/**
 * Export default for easier imports
 */
export default JobPostedConfirmation;
