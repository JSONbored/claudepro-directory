/**
 * Email Metrics Component
 *
 * Reusable metrics/stats display component for email templates.
 * Used for displaying numerical values with labels (e.g., "1,234 users", "50% growth").
 *
 * Features:
 * - Email-safe inline styles
 * - Dark mode compatible
 * - Consistent with theme system
 * - Grid layout support for multiple metrics
 *
 * @example
 * ```tsx
 * <EmailMetrics value="1,234" label="Users" />
 * ```
 *
 * @example
 * ```tsx
 * <EmailMetricsGrid>
 *   <EmailMetrics value="1,234" label="Users" />
 *   <EmailMetrics value="567" label="Posts" />
 *   <EmailMetrics value="89" label="Comments" />
 * </EmailMetricsGrid>
 * ```
 */

import type React from 'react';
import { Section, Text } from '@react-email/components';
import { borderRadius, emailTheme, spacing, typography } from '../theme';

export interface EmailMetricsProps {
  /**
   * Metric value (number, percentage, etc.)
   */
  value: string | number;

  /**
   * Metric label/description
   */
  label: string;

  /**
   * Optional prefix (e.g., "$", "+")
   */
  prefix?: string;

  /**
   * Optional suffix (e.g., "%", "K", "M")
   */
  suffix?: string;

  /**
   * Optional icon/emoji before value
   */
  icon?: string;

  /**
   * Additional inline styles (merged with base styles)
   */
  style?: React.CSSProperties;
}

/**
 * Single EmailMetrics Component
 */
export function EmailMetrics({ value, label, prefix, suffix, icon, style }: EmailMetricsProps) {
  const containerStyle: React.CSSProperties = {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    border: `1px solid ${emailTheme.borderDefault}`,
    backgroundColor: emailTheme.bgTertiary,
    textAlign: 'center',
    ...style,
  };

  const valueStyle: React.CSSProperties = {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: emailTheme.textPrimary,
    margin: 0,
    lineHeight: typography.lineHeight.tight,
  };

  const labelStyle: React.CSSProperties = {
    margin: `${spacing.xs} 0 0 0`,
    fontSize: typography.fontSize.sm,
    color: emailTheme.textSecondary,
  };

  const displayValue = `${prefix || ''}${value}${suffix || ''}`;

  return (
    <Section style={containerStyle}>
      <Text style={valueStyle}>
        {icon ? `${icon} ` : ''}
        {displayValue}
      </Text>
      <Text style={labelStyle}>{label}</Text>
    </Section>
  );
}

export interface EmailMetricsGridProps {
  /**
   * Metrics components or items
   */
  children: React.ReactNode;

  /**
   * Number of columns in grid
   * @default 3
   */
  columns?: number;

  /**
   * Additional inline styles (merged with base styles)
   */
  style?: React.CSSProperties;
}

/**
 * EmailMetricsGrid Component
 * Grid layout for multiple metrics
 */
export function EmailMetricsGrid({ children, columns = 3, style }: EmailMetricsGridProps) {
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    ...style,
  };

  return <Section style={gridStyle}>{children}</Section>;
}
