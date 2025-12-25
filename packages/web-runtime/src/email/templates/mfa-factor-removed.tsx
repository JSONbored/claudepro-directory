/**
 * MFA Factor Removed Email Template
 * Sent when a user removes an MFA factor from their account
 *
 * Features:
 * - Security-focused messaging
 * - Factor type indicator (TOTP, Phone, etc.)
 * - Timestamp of removal
 * - Warning if account security is reduced
 * - Action guidance (what to do if unauthorized)
 * - Dark mode compatible
 */

import { Section, Text } from '@react-email/components';
import React from 'react';

import { BaseLayout } from '../base-template';
import { EmailBadge } from '../components/badge';
import { EmailCard } from '../components/card';
import { EmailFooterNote } from '../components/footer-note';
import { brandColors, emailTheme, spacing, typography, borderRadius } from '../theme';
import { EMAIL_UTM_TEMPLATES } from '../utm-templates';

export interface MFAFactorRemovedEmailProps {
  /**
   * Type of MFA factor removed (e.g., 'totp', 'phone')
   */
  factorType: 'totp' | 'phone';

  /**
   * Friendly name of the factor (e.g., "iPhone Authenticator", "Backup Phone")
   */
  factorName?: string | null;

  /**
   * Timestamp when the factor was removed
   */
  removedAt: string;

  /**
   * User's email address (for personalization)
   */
  userEmail: string;

  /**
   * Number of remaining MFA factors after this removal
   */
  remainingFactorsCount: number;
}

/**
 * Format factor type for display
 */
function formatFactorType(factorType: 'totp' | 'phone'): string {
  switch (factorType) {
    case 'totp':
      return 'Authenticator App';
    case 'phone':
      return 'SMS/Phone';
    default:
      return 'MFA Factor';
  }
}

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: 'UTC',
    });
  } catch {
    return timestamp;
  }
}

/**
 * MFA Factor Removed Email Component
 *
 * Usage:
 * ```tsx
 * <MFAFactorRemovedEmail
 *   factorType="totp"
 *   factorName="iPhone Authenticator"
 *   removedAt="2025-12-06T12:00:00Z"
 *   userEmail="user@example.com"
 *   remainingFactorsCount={1}
 * />
 * ```
 */
export function MFAFactorRemovedEmail({
  factorType,
  factorName,
  removedAt,
  userEmail,
  remainingFactorsCount,
}: MFAFactorRemovedEmailProps) {
  const utm = EMAIL_UTM_TEMPLATES.TRANSACTIONAL_MFA_FACTOR_REMOVED || {
    source: 'email',
    medium: 'transactional',
    campaign: 'mfa',
    content: 'factor_removed',
  };

  const factorTypeDisplay = formatFactorType(factorType);
  const removedAtDisplay = formatTimestamp(removedAt);
  const displayName = factorName || factorTypeDisplay;
  const isLowSecurity = remainingFactorsCount === 0;

  return (
    <BaseLayout
      preview={`${factorTypeDisplay} removed from your account on ${removedAtDisplay}`}
      utm={utm}
    >
      <Section style={heroSection}>
        <Text style={heroTitleStyle}>Two-Factor Authentication Method Removed</Text>
        <Text style={heroSubtitleStyle}>An MFA factor was removed from your account</Text>
      </Section>

      <EmailCard>
        <Section style={cardContentSection}>
          <Text style={introTextStyle}>Hello,</Text>

          <Text style={bodyTextStyle}>
            A two-factor authentication method was removed from your account:
          </Text>

          <Section style={factorDetailsSection}>
            <div style={detailRowStyle}>
              <Text style={detailLabelStyle}>Factor Type:</Text>
              <EmailBadge variant="primary" size="default">
                {factorTypeDisplay}
              </EmailBadge>
            </div>

            {factorName && (
              <div style={detailRowStyle}>
                <Text style={detailLabelStyle}>Name:</Text>
                <Text style={detailValueStyle}>{displayName}</Text>
              </div>
            )}

            <div style={detailRowStyle}>
              <Text style={detailLabelStyle}>Removed On:</Text>
              <Text style={detailValueStyle}>{removedAtDisplay} UTC</Text>
            </div>

            <div style={detailRowStyle}>
              <Text style={detailLabelStyle}>Remaining Factors:</Text>
              <Text style={detailValueStyle}>{remainingFactorsCount}</Text>
            </div>
          </Section>

          {isLowSecurity && (
            <Section style={warningSection}>
              <Text style={warningTitleStyle}>⚠️ Security Warning</Text>
              <Text style={warningTextStyle}>
                Your account no longer has any two-factor authentication methods enabled. We
                strongly recommend adding a new MFA factor to keep your account secure.
              </Text>
            </Section>
          )}

          <Section style={securitySection}>
            <Text style={securityTitleStyle}>🔒 Security Information</Text>
            <Text style={securityTextStyle}>
              If you didn't remove this authentication method, please secure your account
              immediately:
            </Text>
            <ul style={securityListStyle}>
              <li style={securityListItemStyle}>
                Review your account settings for unauthorized changes
              </li>
              <li style={securityListItemStyle}>
                Change your password if you suspect unauthorized access
              </li>
              <li style={securityListItemStyle}>
                Add a new MFA factor to restore two-factor authentication
              </li>
              <li style={securityListItemStyle}>Review your recent account activity</li>
              <li style={securityListItemStyle}>Contact support if you need assistance</li>
            </ul>
          </Section>

          <EmailFooterNote
            lines={[
              {
                type: 'text',
                text: `This email was sent to ${userEmail}. If you didn't make this change, please secure your account immediately.`,
              },
            ]}
          />
        </Section>
      </EmailCard>
    </BaseLayout>
  );
}

// Styles
const heroSection: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: spacing['2xl'],
};

const heroTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize['2xl'],
  fontWeight: typography.fontWeight.bold,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.sm} 0`,
  lineHeight: typography.lineHeight.tight,
};

const heroSubtitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: emailTheme.textSecondary,
  margin: 0,
  lineHeight: typography.lineHeight.normal,
};

const cardContentSection: React.CSSProperties = {
  padding: spacing.lg,
};

const introTextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.lg} 0`,
  lineHeight: typography.lineHeight.relaxed,
};

const bodyTextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.lg} 0`,
  lineHeight: typography.lineHeight.relaxed,
};

const factorDetailsSection: React.CSSProperties = {
  backgroundColor: emailTheme.bgSecondary,
  borderRadius: borderRadius.md,
  padding: spacing.lg,
  margin: `${spacing.lg} 0`,
  border: `1px solid ${emailTheme.borderDefault}`,
};

const detailRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: spacing.md,
  gap: spacing.lg,
};

const detailLabelStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  fontWeight: typography.fontWeight.semibold,
  color: emailTheme.textSecondary,
  margin: 0,
  flex: '0 0 auto',
};

const detailValueStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textPrimary,
  margin: 0,
  textAlign: 'right',
  flex: '1 1 auto',
};

const warningSection: React.CSSProperties = {
  backgroundColor: `${brandColors.warning}20`, // 20% opacity
  border: `1px solid ${brandColors.warning}`,
  borderRadius: borderRadius.md,
  padding: spacing.lg,
  margin: `${spacing.lg} 0`,
};

const warningTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  fontWeight: typography.fontWeight.semibold,
  color: brandColors.warning,
  margin: `0 0 ${spacing.sm} 0`,
  lineHeight: typography.lineHeight.tight,
};

const warningTextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textPrimary,
  margin: 0,
  lineHeight: typography.lineHeight.relaxed,
};

const securitySection: React.CSSProperties = {
  marginTop: spacing['2xl'],
  paddingTop: spacing['2xl'],
  borderTop: `1px solid ${emailTheme.borderDefault}`,
};

const securityTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.lg,
  fontWeight: typography.fontWeight.semibold,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.sm} 0`,
  lineHeight: typography.lineHeight.tight,
};

const securityTextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.md} 0`,
  lineHeight: typography.lineHeight.relaxed,
};

const securityListStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: spacing.xl,
  color: emailTheme.textPrimary,
};

const securityListItemStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textPrimary,
  marginBottom: spacing.sm,
  lineHeight: typography.lineHeight.relaxed,
};
