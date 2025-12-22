/**
 * Email Badge Component
 *
 * Reusable badge component for labels, tags, and status indicators in emails.
 * Supports semantic variants (success, warning, error, info) and custom variants.
 *
 * Features:
 * - Email-safe inline styles
 * - Dark mode compatible
 * - Consistent with theme system
 * - Semantic color variants
 *
 * @example
 * ```tsx
 * <EmailBadge variant="success">New</EmailBadge>
 * <EmailBadge variant="primary">Featured</EmailBadge>
 * ```
 */

import type React from 'react';
import { Text } from '@react-email/components';
import { borderRadius, brandColors, emailTheme, spacing, typography } from '../theme';

export type EmailBadgeVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'secondary'
  | 'muted';

export interface EmailBadgeProps {
  /**
   * Badge text content
   */
  children: React.ReactNode;

  /**
   * Badge variant (determines color)
   * @default 'primary'
   */
  variant?: EmailBadgeVariant;

  /**
   * Badge size
   * @default 'default'
   */
  size?: 'sm' | 'default' | 'lg';

  /**
   * Additional inline styles (merged with base styles)
   */
  style?: React.CSSProperties;
}

/**
 * EmailBadge Component
 */
export function EmailBadge({
  children,
  variant = 'primary',
  size = 'default',
  style,
}: EmailBadgeProps) {
  // Base badge style
  const baseStyle: React.CSSProperties = {
    fontSize:
      size === 'sm'
        ? typography.fontSize.xs
        : size === 'lg'
          ? typography.fontSize.base
          : typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    padding:
      size === 'sm'
        ? `${spacing.xs} ${spacing.sm}`
        : size === 'lg'
          ? `${spacing.sm} ${spacing.md}`
          : `${spacing.xs} ${spacing.sm}`,
    borderRadius: borderRadius.full,
    display: 'inline-block',
    marginBottom: spacing.sm,
    marginRight: spacing.xs,
  };

  // Variant-specific colors
  const variantStyles: Record<EmailBadgeVariant, React.CSSProperties> = {
    primary: {
      backgroundColor: brandColors.primary,
      color: emailTheme.textInverse,
    },
    success: {
      backgroundColor: brandColors.success,
      color: emailTheme.textInverse,
    },
    warning: {
      backgroundColor: brandColors.warning,
      color: emailTheme.textInverse,
    },
    error: {
      backgroundColor: brandColors.error,
      color: emailTheme.textInverse,
    },
    info: {
      backgroundColor: brandColors.info,
      color: emailTheme.textInverse,
    },
    secondary: {
      backgroundColor: emailTheme.bgTertiary,
      color: emailTheme.textPrimary,
      border: `1px solid ${emailTheme.borderDefault}`,
    },
    muted: {
      backgroundColor: emailTheme.bgTertiary,
      color: emailTheme.textSecondary,
    },
  };

  const badgeStyle: React.CSSProperties = {
    ...baseStyle,
    ...variantStyles[variant],
    ...style,
  };

  return <Text style={badgeStyle}>{children}</Text>;
}

