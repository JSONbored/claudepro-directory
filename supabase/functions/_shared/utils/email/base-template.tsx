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

import React from 'npm:react@18.3.1';
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
  renderAsync,
} from 'npm:@react-email/components@0.0.22';
import { addUTMToURL } from './email-utm.ts';
import type { EmailUTMParams } from './utm-templates.ts';
import { borderRadius, brandColors, emailTheme, spacing, typography } from './theme.ts';
import { HeyClaudeEmailLogo } from './components/heyclaude-logo.tsx';

export interface BaseLayoutProps {
  /**
   * Preview text shown in email client inbox (50-100 chars recommended)
   */
  preview: string;

  /**
   * Main email content
   * Provided automatically via JSX children
   */
  children?: React.ReactNode;

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
  if (!children) {
    throw new Error('BaseLayout requires children content');
  }
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
                <HeyClaudeEmailLogo size="md" />
              </Link>
              <Text style={taglineStyle}>The ultimate Claude directory</Text>
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
                      <Link href="{{{UNSUBSCRIBE_URL}}}" style={footerLinkStyle}>
                      Unsubscribe
                    </Link>
                    {' · '}
                      <Link href="{{{PREFERENCES_URL}}}" style={footerLinkStyle}>
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
 * Render any email template component or element to HTML using React Email's `renderAsync`.
 * Accepts either a component + props or a pre-constructed React element.
 */
export async function renderEmailTemplate<TProps>(
  template: React.ComponentType<TProps> | React.ReactElement,
  props?: TProps
): Promise<string> {
  if (React.isValidElement(template)) {
    return renderAsync(template);
  }

  if (!props) {
    throw new Error('renderEmailTemplate requires props when you pass a component reference.');
  }

  return renderAsync(React.createElement(template, props));
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

const taglineStyle: React.CSSProperties = {
  marginTop: spacing.sm,
  fontSize: typography.fontSize.sm,
  color: emailTheme.textSecondary,
  textTransform: 'uppercase',
  letterSpacing: '0.2em',
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
