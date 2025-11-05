/**
 * Base Email Layout Component
 * Provides consistent structure and branding for all emails
 *
 * Features:
 * - Responsive design (mobile-first)
 * - Claude brand styling
 * - Email client compatibility (Gmail, Outlook, Apple Mail)
 * - Dark theme optimized
 * - Accessibility features
 */

import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22';
import type * as React from 'react';
import { addUTMToURL } from '../utils/email-utm.ts';
import type { EmailUTMParams } from '../utils/utm-templates.ts';
import { borderRadius, brandColors, emailTheme, spacing, typography } from '../utils/theme.ts';

export interface BaseLayoutProps {
  /**
   * Preview text shown in email client inbox (50-100 chars recommended)
   */
  preview: string;

  /**
   * Main email content
   */
  children: React.ReactNode;

  /**
   * Whether to show footer with unsubscribe link
   * @default true
   */
  showFooter?: boolean;

  /**
   * Custom footer content (overrides default footer)
   */
  customFooter?: React.ReactNode;

  /**
   * UTM parameters for email tracking
   * Used to add UTM tags to footer links
   */
  utm?: EmailUTMParams;
}

/**
 * BaseLayout Component
 * Wraps all email templates with consistent structure
 *
 * Usage:
 * ```tsx
 * <BaseLayout preview="Welcome to ClaudePro Directory!">
 *   <YourEmailContent />
 * </BaseLayout>
 * ```
 */
export function BaseLayout({
  preview,
  children,
  showFooter = true,
  customFooter,
  utm,
}: BaseLayoutProps) {
  const baseUrl = 'https://claudepro.directory';

  // Helper to add UTM to URL if utm params are provided
  const utmLink = (url: string, contentId: string) => {
    if (!utm) return url;
    return addUTMToURL(url, { ...utm, content: contentId });
  };

  return (
    <Html lang="en" dir="ltr">
      <Head>
        <meta name="color-scheme" content="dark light" />
        <meta name="supported-color-schemes" content="dark light" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header with Claude branding */}
          <Section style={headerStyle}>
            <Link href={utmLink(baseUrl, 'header_logo')} style={logoLinkStyle}>
              <Text style={logoTextStyle}>
                <span style={logoClaudeStyle}>Claude</span>
                <span style={logoProStyle}>Pro</span>
              </Text>
            </Link>
          </Section>

          {/* Main content area */}
          <Section style={contentStyle}>{children}</Section>

          {/* Footer */}
          {showFooter && (
            <>
              <Hr style={dividerStyle} />
              {customFooter || (
                <Section style={footerStyle}>
                  <Text style={footerTextStyle}>
                    You received this email because you subscribed to{' '}
                    <Link href={utmLink(baseUrl, 'footer_home')} style={footerLinkStyle}>
                      ClaudePro Directory
                    </Link>
                    .
                  </Text>
                  <Text style={footerTextStyle}>
                    <Link href="{{unsubscribe_url}}" style={footerLinkStyle}>
                      Unsubscribe
                    </Link>
                    {' · '}
                    <Link href="{{preferences_url}}" style={footerLinkStyle}>
                      Email Preferences
                    </Link>
                    {' · '}
                    <Link
                      href={utmLink(`${baseUrl}/privacy`, 'footer_privacy')}
                      style={footerLinkStyle}
                    >
                      Privacy Policy
                    </Link>
                  </Text>
                  <Text style={footerCopyrightStyle}>
                    © {new Date().getFullYear()} ClaudePro Directory. All rights reserved.
                  </Text>
                </Section>
              )}
            </>
          )}
        </Container>
      </Body>
    </Html>
  );
}

/**
 * Email-safe inline styles
 * CSS classes don't work reliably across email clients
 */

const bodyStyle: React.CSSProperties = {
  backgroundColor: emailTheme.bgPrimary,
  fontFamily: typography.fontFamily.sans,
  fontSize: typography.fontSize.base,
  lineHeight: typography.lineHeight.normal,
  color: emailTheme.textPrimary,
  margin: 0,
  padding: 0,
  width: '100%',
};

const containerStyle: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: `${spacing.lg} ${spacing.md}`,
};

const headerStyle: React.CSSProperties = {
  paddingBottom: spacing.lg,
  textAlign: 'center',
};

const logoLinkStyle: React.CSSProperties = {
  textDecoration: 'none',
  display: 'inline-block',
};

const logoTextStyle: React.CSSProperties = {
  fontSize: typography.fontSize['2xl'],
  fontWeight: typography.fontWeight.bold,
  letterSpacing: '-0.02em',
  margin: 0,
};

const logoClaudeStyle: React.CSSProperties = {
  color: emailTheme.textPrimary,
};

const logoProStyle: React.CSSProperties = {
  color: brandColors.primary,
};

const contentStyle: React.CSSProperties = {
  backgroundColor: emailTheme.bgSecondary,
  borderRadius: borderRadius.lg,
  padding: spacing.xl,
  border: `1px solid ${emailTheme.borderDefault}`,
};

const dividerStyle: React.CSSProperties = {
  borderColor: emailTheme.borderDefault,
  marginTop: spacing.xl,
  marginBottom: spacing.lg,
};

const footerStyle: React.CSSProperties = {
  paddingTop: spacing.lg,
};

const footerTextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textSecondary,
  lineHeight: typography.lineHeight.relaxed,
  margin: `${spacing.sm} 0`,
  textAlign: 'center' as const,
};

const footerLinkStyle: React.CSSProperties = {
  color: brandColors.primary,
  textDecoration: 'none',
};

const footerCopyrightStyle: React.CSSProperties = {
  fontSize: typography.fontSize.xs,
  color: emailTheme.textTertiary,
  marginTop: spacing.md,
  textAlign: 'center' as const,
};

/**
 * Export default for easier imports
 */
export default BaseLayout;
