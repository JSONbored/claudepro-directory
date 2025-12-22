/**
 * Contact User Confirmation Email Template
 * Sent to user confirming their contact form submission was received
 *
 * Features:
 * - Personalized greeting
 * - Category confirmation
 * - Response time expectation
 * - Friendly, professional tone
 * - Dark mode compatible
 */

import { Section, Text } from '@react-email/components';
import React from 'react';

import { BaseLayout } from '../base-template';
import { EmailBadge } from '../components/badge';
import { EmailCard } from '../components/card';
import { EmailFooterNote } from '../components/footer-note';
import { buildSubscriptionFooter } from '../config/footer-presets';
import { emailTheme, spacing, typography } from '../theme';
import { EMAIL_UTM_TEMPLATES } from '../utm-templates';

export interface ContactUserConfirmationEmailProps {
  /**
   * User's name
   */
  name: string;

  /**
   * Contact category
   */
  category: 'bug' | 'feature' | 'partnership' | 'general' | 'other';

  /**
   * User's email address (for footer)
   */
  email: string;
}

const CATEGORY_LABELS: Record<ContactUserConfirmationEmailProps['category'], string> = {
  bug: 'Bug Report',
  feature: 'Feature Request',
  partnership: 'Partnership',
  general: 'General Inquiry',
  other: 'Other',
};

/**
 * ContactUserConfirmationEmail Component
 */
export function ContactUserConfirmationEmail({
  name,
  category,
  email,
}: ContactUserConfirmationEmailProps) {
  const utm = EMAIL_UTM_TEMPLATES.CONTACT_USER_CONFIRMATION;

  return (
    <BaseLayout
      preview={`Thanks for reaching out, ${name}!`}
      utm={utm}
    >
      <Section style={contentSectionStyle}>
        <Text style={titleStyle}>Thanks for reaching out, {name}!</Text>

        <EmailCard variant="default" style={confirmationCardStyle}>
          <div style={confirmationHeaderStyle}>
            <Text style={confirmationTextStyle}>
              We've received your{' '}
              <EmailBadge variant="secondary" size="sm">
                {CATEGORY_LABELS[category]}
              </EmailBadge>
              {' '}message and will get back to you as soon as possible.
            </Text>
          </div>
        </EmailCard>

        <Text style={responseTimeStyle}>
          Our team typically responds within 24-48 hours during business days.
        </Text>
      </Section>

      <EmailFooterNote lines={buildSubscriptionFooter('weeklyDigest', { email })} />
    </BaseLayout>
  );
}

/**
 * Export default for easier imports
 */
export default ContactUserConfirmationEmail;

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
  margin: `0 0 ${spacing.lg}`,
};

const confirmationCardStyle: React.CSSProperties = {
  padding: spacing.lg,
  marginBottom: spacing.lg,
};

const confirmationHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
  flexWrap: 'wrap',
};

const confirmationTextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  lineHeight: typography.lineHeight.relaxed,
  color: emailTheme.textPrimary,
  margin: 0,
};

const responseTimeStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  lineHeight: typography.lineHeight.relaxed,
  color: emailTheme.textSecondary,
  margin: 0,
  textAlign: 'center',
  fontStyle: 'italic',
};

