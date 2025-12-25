/**
 * Email Change Confirmation Template
 * Sent when a user requests to change their email address
 *
 * Features:
 * - Security-focused messaging
 * - Clear confirmation action
 * - New email display
 * - Dark mode compatible
 */

import { Button, Section, Text } from '@react-email/components';
import React from 'react';
import { BaseLayout } from '../base-template';
import { EmailCard } from '../components/card';
import { brandColors, emailTheme, spacing, typography } from '../theme';
import { EMAIL_UTM_TEMPLATES } from '../utm-templates';

export interface EmailChangeEmailProps {
  /**
   * Email change confirmation URL
   */
  confirmUrl: string;

  /**
   * New email address
   */
  newEmail: string;
}

/**
 * Email Change Confirmation Component
 *
 * Usage:
 * ```tsx
 * <EmailChangeEmail
 *   confirmUrl="https://claudepro.directory/confirm-email?token=..."
 *   newEmail="newemail@example.com"
 * />
 * ```
 */
export function EmailChangeEmail({ confirmUrl, newEmail }: EmailChangeEmailProps) {
  const utm = EMAIL_UTM_TEMPLATES.EMAIL_CHANGE || {
    source: 'email',
    medium: 'transactional',
    campaign: 'email-change',
  };

  return (
    <BaseLayout
      preview={`Confirm email change to ${newEmail}. Click the button below to confirm your new email address.`}
      utm={utm}
    >
      <Section style={heroSection}>
        <Text style={heroTitleStyle}>📧 Confirm Email Change</Text>
        <Text style={heroSubtitleStyle}>
          We received a request to change your email address to <strong>{newEmail}</strong>.
        </Text>
      </Section>

      <EmailCard variant="highlight">
        <Text style={cardTitleStyle}>Email Change Details</Text>
        <Text style={paragraphStyle}>
          <strong>New Email:</strong> {newEmail}
        </Text>
        <Text style={warningTextStyle}>
          <strong>Important:</strong> If you didn't request this change, please contact support
          immediately to secure your account.
        </Text>
      </EmailCard>

      <Section style={ctaSection}>
        <Button href={confirmUrl} style={primaryButtonStyle}>
          Confirm Email Change
        </Button>
      </Section>

      <Section style={footerNoteSection}>
        <Text style={footerNoteStyle}>
          This confirmation link will expire in 24 hours. If you didn't request this change, please
          contact our support team immediately.
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

const warningTextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textSecondary,
  lineHeight: typography.lineHeight.relaxed,
  margin: `${spacing.md} 0 0 0`,
  padding: spacing.md,
  backgroundColor: emailTheme.bgTertiary,
  borderRadius: '4px',
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
