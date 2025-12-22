/**
 * Password Reset Email Template
 * Sent when a user requests a password reset
 *
 * Features:
 * - Security-focused messaging
 * - Clear call-to-action
 * - Expiration notice
 * - Dark mode compatible
 */

import { Button, Section, Text } from '@react-email/components';
import React from 'react';
import { BaseLayout } from '../base-template';
import { EmailCard } from '../components/card';
import { brandColors, emailTheme, spacing, typography } from '../theme';
import { EMAIL_UTM_TEMPLATES } from '../utm-templates';

export interface PasswordResetEmailProps {
  /**
   * Password reset URL
   */
  resetUrl: string;
}

/**
 * Password Reset Email Component
 *
 * Usage:
 * ```tsx
 * <PasswordResetEmail resetUrl="https://claudepro.directory/reset-password?token=..." />
 * ```
 */
export function PasswordResetEmail({ resetUrl }: PasswordResetEmailProps) {
  const utm = EMAIL_UTM_TEMPLATES.PASSWORD_RESET || {
    source: 'email',
    medium: 'transactional',
    campaign: 'password-reset',
  };

  return (
    <BaseLayout
      preview="Reset your password for Claude Pro Directory. Click the button below to create a new password."
      utm={utm}
    >
      <Section style={heroSection}>
        <Text style={heroTitleStyle}>🔐 Reset Your Password</Text>
        <Text style={heroSubtitleStyle}>
          We received a request to reset your password. Click the button below to create a new
          password.
        </Text>
      </Section>

      <EmailCard variant="highlight">
        <Text style={warningTextStyle}>
          <strong>Security Notice:</strong> If you didn't request this password reset, you can
          safely ignore this email. Your password will remain unchanged.
        </Text>
        <Text style={expirationTextStyle}>
          The reset link will expire in 24 hours for your security.
        </Text>
      </EmailCard>

      <Section style={ctaSection}>
        <Button href={resetUrl} style={primaryButtonStyle}>
          Reset Password
        </Button>
      </Section>

      <Section style={footerNoteSection}>
        <Text style={footerNoteStyle}>
          For security reasons, this link can only be used once. If you need to reset your password
          again, please request a new reset link.
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

const warningTextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textSecondary,
  lineHeight: typography.lineHeight.relaxed,
  margin: `0 0 ${spacing.sm} 0`,
};

const expirationTextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textTertiary,
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

