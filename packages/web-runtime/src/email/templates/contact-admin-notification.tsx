/**
 * Contact Admin Notification Email Template
 * Sent to admin when a user submits the contact form
 *
 * Features:
 * - Category emoji indicator
 * - Submission details (ID, date, category)
 * - Message content display
 * - Reply button for quick response
 * - Dark mode compatible
 */

import { Link, Section, Text } from '@react-email/components';
import React from 'react';

import { BaseLayout } from '../base-template';
import { EmailBadge } from '../components/badge';
import { EmailCard } from '../components/card';
import { EmailFooterNote } from '../components/footer-note';
import { brandColors, emailTheme, spacing, typography } from '../theme';
import { EMAIL_UTM_TEMPLATES } from '../utm-templates';

export interface ContactAdminNotificationEmailProps {
  /**
   * Submission ID
   */
  submissionId: string;

  /**
   * User's name
   */
  name: string;

  /**
   * User's email address
   */
  email: string;

  /**
   * Contact category
   */
  category: 'bug' | 'feature' | 'partnership' | 'general' | 'other';

  /**
   * Category emoji
   */
  categoryEmoji: string;

  /**
   * User's message
   */
  message: string;

  /**
   * Submission timestamp (ISO string)
   */
  submittedAt: string;
}

const CATEGORY_LABELS: Record<ContactAdminNotificationEmailProps['category'], string> = {
  bug: 'Bug Report',
  feature: 'Feature Request',
  partnership: 'Partnership',
  general: 'General Inquiry',
  other: 'Other',
};

/**
 * ContactAdminNotificationEmail Component
 */
export function ContactAdminNotificationEmail({
  submissionId,
  name,
  email,
  category,
  categoryEmoji,
  message,
  submittedAt,
}: ContactAdminNotificationEmailProps) {
  const utm = EMAIL_UTM_TEMPLATES.CONTACT_ADMIN;
  const submittedDate = new Date(submittedAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <BaseLayout
      preview={`${categoryEmoji} New Contact Submission from ${name}`}
      utm={utm}
      showFooter={false}
    >
      <Section style={contentSectionStyle}>
        <div style={headerRowStyle}>
          <Text style={titleStyle}>
            {categoryEmoji} New Contact Submission
          </Text>
          <EmailBadge variant="secondary" size="sm">
            {CATEGORY_LABELS[category]}
          </EmailBadge>
        </div>
        <Text style={subtitleStyle}>
          Submitted via interactive terminal on {submittedDate}
        </Text>

        <EmailCard variant="default" style={detailsCardStyle}>
          <div style={detailRowStyle}>
            <Text style={detailLabelStyle}>From:</Text>
            <Text style={detailValueStyle}>{name}</Text>
          </div>
          <div style={detailRowStyle}>
            <Text style={detailLabelStyle}>Email:</Text>
            <Link href={`mailto:${email}`} style={detailLinkStyle}>
              {email}
            </Link>
          </div>
          <div style={detailRowStyle}>
            <Text style={detailLabelStyle}>Category:</Text>
            <Text style={detailValueStyle}>{CATEGORY_LABELS[category]}</Text>
          </div>
          <div style={detailRowStyle}>
            <Text style={detailLabelStyle}>Submission ID:</Text>
            <Text style={{ ...detailValueStyle, fontFamily: 'monospace', fontSize: typography.fontSize.sm }}>
              {submissionId}
            </Text>
          </div>
        </EmailCard>

        <Text style={messageLabelStyle}>Message:</Text>
        <EmailCard variant="bordered" style={messageCardStyle}>
          <Text style={messageTextStyle}>{message}</Text>
        </EmailCard>

        <div style={ctaContainerStyle}>
          <Link
            href={`mailto:${email}?subject=Re: ${CATEGORY_LABELS[category]}&body=Hi ${encodeURIComponent(name)},%0A%0A`}
            style={replyCtaStyle}
          >
            Reply to {name}
          </Link>
        </div>
      </Section>

      <EmailFooterNote lines={[
        { type: 'text', text: 'This is an automated notification from the contact form.' },
      ]} />
    </BaseLayout>
  );
}

/**
 * Export default for easier imports
 */
export default ContactAdminNotificationEmail;

// ============================================================================
// Styles
// ============================================================================

const contentSectionStyle: React.CSSProperties = {
  padding: spacing.lg,
};

const headerRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing.sm,
  marginBottom: spacing.xs,
  flexWrap: 'wrap',
};

const titleStyle: React.CSSProperties = {
  fontSize: typography.fontSize['2xl'],
  fontWeight: typography.fontWeight.bold,
  color: emailTheme.textPrimary,
  margin: 0,
};

const subtitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textSecondary,
  margin: `0 0 ${spacing.lg}`,
};

const detailsCardStyle: React.CSSProperties = {
  padding: spacing.md,
  marginBottom: spacing.lg,
};

const detailRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  marginBottom: spacing.sm,
  gap: spacing.sm,
};

const detailLabelStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  fontWeight: typography.fontWeight.semibold,
  color: emailTheme.textSecondary,
  margin: 0,
  minWidth: '100px',
};

const detailValueStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textPrimary,
  margin: 0,
  flex: 1,
};

const detailLinkStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: brandColors.primary,
  textDecoration: 'none',
  flex: 1,
};

const messageLabelStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  fontWeight: typography.fontWeight.semibold,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.sm}`,
};

const messageCardStyle: React.CSSProperties = {
  padding: spacing.md,
  marginBottom: spacing.lg,
  backgroundColor: emailTheme.bgTertiary,
};

const messageTextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  fontFamily: 'monospace',
  color: emailTheme.textPrimary,
  margin: 0,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  lineHeight: typography.lineHeight.relaxed,
};

const ctaContainerStyle: React.CSSProperties = {
  margin: `${spacing.xl} 0`,
  textAlign: 'center',
};

const replyCtaStyle: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: brandColors.primary,
  color: '#1A1B17',
  padding: '12px 24px',
  borderRadius: '9999px',
  fontWeight: typography.fontWeight.semibold,
  textDecoration: 'none',
  fontSize: typography.fontSize.base,
};

