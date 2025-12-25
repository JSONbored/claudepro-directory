/**
 * Email Card Component
 *
 * Reusable card component for email templates with consistent styling.
 * Supports variants, optional header/footer, and custom content.
 *
 * Features:
 * - Email-safe inline styles
 * - Dark mode compatible
 * - Consistent with theme system
 * - Flexible content layout
 *
 * @example
 * ```tsx
 * <EmailCard>
 *   <Text>Card content here</Text>
 * </EmailCard>
 * ```
 *
 * @example
 * ```tsx
 * <EmailCard variant="highlight" header="Important">
 *   <Text>Highlighted card content</Text>
 * </EmailCard>
 * ```
 */

import type React from 'react';
import { Section, Text } from '@react-email/components';
import { borderRadius, brandColors, emailTheme, spacing, typography } from '../theme';

export type EmailCardVariant = 'default' | 'highlight' | 'subtle' | 'bordered';

export interface EmailCardProps {
  /**
   * Card content
   */
  children: React.ReactNode;

  /**
   * Card variant style
   * @default 'default'
   */
  variant?: EmailCardVariant;

  /**
   * Optional card header/title
   */
  header?: string;

  /**
   * Optional card footer/meta text
   */
  footer?: string;

  /**
   * Additional inline styles (merged with base styles)
   */
  style?: React.CSSProperties;
}

/**
 * EmailCard Component
 */
export function EmailCard({
  children,
  variant = 'default',
  header,
  footer,
  style,
}: EmailCardProps) {
  const baseCardStyle: React.CSSProperties = {
    backgroundColor: emailTheme.bgSecondary,
    border: `1px solid ${emailTheme.borderDefault}`,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  };

  // Variant-specific styles
  const variantStyles: Record<EmailCardVariant, React.CSSProperties> = {
    default: {},
    highlight: {
      backgroundColor: emailTheme.bgTertiary,
      border: `2px solid ${brandColors.primary}`,
    },
    subtle: {
      backgroundColor: emailTheme.bgTertiary,
      border: `1px solid ${emailTheme.borderLight}`,
    },
    bordered: {
      backgroundColor: emailTheme.bgSecondary,
      border: `2px solid ${emailTheme.borderMedium}`,
    },
  };

  const cardStyle: React.CSSProperties = {
    ...baseCardStyle,
    ...variantStyles[variant],
    ...style,
  };

  const headerStyle: React.CSSProperties = {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: emailTheme.textPrimary,
    margin: `0 0 ${spacing.md} 0`,
  };

  const footerStyle: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: emailTheme.textTertiary,
    margin: `${spacing.md} 0 0 0`,
    paddingTop: spacing.md,
    borderTop: `1px solid ${emailTheme.borderDefault}`,
  };

  return (
    <Section style={cardStyle}>
      {header ? <Text style={headerStyle}>{header}</Text> : null}
      {children}
      {footer ? <Text style={footerStyle}>{footer}</Text> : null}
    </Section>
  );
}
