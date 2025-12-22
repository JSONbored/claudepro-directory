/**
 * MFA Factor Added Email Template
 * Sent when a user successfully enrolls and verifies a new MFA factor
 *
 * Features:
 * - Security-focused messaging
 * - Factor type indicator (TOTP, Phone, etc.)
 * - Timestamp of enrollment
 * - Action guidance (what to do if unauthorized)
 * - Dark mode compatible
 */

import { Section, Text } from '@react-email/components';
import React from 'react';

import { BaseLayout } from '../base-template';
import { EmailBadge } from '../components/badge';
import { EmailCard } from '../components/card';
import { EmailFooterNote } from '../components/footer-note';
import { emailTheme, spacing, typography, borderRadius } from '../theme';
import { EMAIL_UTM_TEMPLATES } from '../utm-templates';

export interface MFAFactorAddedEmailProps {
  /**
   * Type of MFA factor added (e.g., 'totp', 'phone')
   */
  factorType: 'totp' | 'phone';

  /**
   * Friendly name of the factor (e.g., "iPhone Authenticator", "Backup Phone")
   */
  factorName?: string | null;

  /**
   * Timestamp when the factor was added
   */
  addedAt: string;

  /**
   * User's email address (for personalization)
   */
  userEmail: string;
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
 * MFA Factor Added Email Component
 *
 * Usage:
 * ```tsx
 * <MFAFactorAddedEmail
 *   factorType="totp"
 *   factorName="iPhone Authenticator"
 *   addedAt="2025-12-06T12:00:00Z"
 *   userEmail="user@example.com"
 * />
 * ```
 */
export function MFAFactorAddedEmail({
  factorType,
  factorName,
  addedAt,
  userEmail,
}: MFAFactorAddedEmailProps) {
  const utm = EMAIL_UTM_TEMPLATES.TRANSACTIONAL_MFA_FACTOR_ADDED || {
    source: 'email',
    medium: 'transactional',
    campaign: 'mfa',
    content: 'factor_added',
  };

  const factorTypeDisplay = formatFactorType(factorType);
  const addedAtDisplay = formatTimestamp(addedAt);
  const displayName = factorName || factorTypeDisplay;

  return (
    <BaseLayout
      preview={`New ${factorTypeDisplay} added to your account on ${addedAtDisplay}`}
      utm={utm}
    >
      <Section style={heroSection}>
        <Text style={heroTitleStyle}>New Two-Factor Authentication Method Added</Text>
        <Text style={heroSubtitleStyle}>A new MFA factor was added to your account</Text>
      </Section>

      <EmailCard>
        <Section style={cardContentSection}>
          <Text style={introTextStyle}>
            Hello,
          </Text>

          <Text style={bodyTextStyle}>
            A new two-factor authentication method was successfully added to your account:
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
              <Text style={detailLabelStyle}>Added On:</Text>
              <Text style={detailValueStyle}>{addedAtDisplay} UTC</Text>
            </div>
          </Section>

          <Section style={securitySection}>
            <Text style={securityTitleStyle}>🔒 Security Information</Text>
            <Text style={securityTextStyle}>
              If you didn't add this authentication method, please secure your account immediately:
            </Text>
            <ul style={securityListStyle}>
              <li style={securityListItemStyle}>
                Remove the unauthorized factor from your account settings
              </li>
              <li style={securityListItemStyle}>
                Change your password if you suspect unauthorized access
              </li>
              <li style={securityListItemStyle}>
                Review your recent account activity
              </li>
              <li style={securityListItemStyle}>
                Contact support if you need assistance
              </li>
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

