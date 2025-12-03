'use client';

/**
 * UseCountBadge Component
 *
 * Compact badge showing "X use this" count for content cards.
 * Replaces the star rating display with social proof.
 */

import { Zap } from '../../../icons.tsx';
import { cluster, display } from '../../../design-system/styles/layout.ts';
import { iconSize } from '../../../design-system/styles/icons.ts';
import { size as textSize, weight, muted } from '../../../design-system/styles/typography.ts';

export interface UseCountBadgeProps {
  /** Number of users who marked "I use this" */
  count: number;
  /** Size variant */
  size?: 'sm' | 'default';
  /** Whether to show the icon */
  showIcon?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Compact badge showing use count
 * Displays social proof in a subtle, non-intrusive way
 */
export function UseCountBadge({
  count,
  size = 'sm',
  showIcon = true,
  className = '',
}: UseCountBadgeProps) {
  // Don't show if no one has used this yet
  if (count <= 0) return null;

  const sizeClasses = {
    sm: textSize.xs,
    default: textSize.sm,
  };

  const iconSizes = {
    sm: iconSize.xs,
    default: iconSize.xsPlus,
  };

  // Format count for display (e.g., 1.2k for 1200)
  const formatCount = (n: number): string => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  };

  return (
    <div
      className={`
        ${cluster.tight}
        ${sizeClasses[size]}
        ${muted.default}
        ${className}
      `}
      title={`${count} ${count === 1 ? 'person uses' : 'people use'} this`}
    >
      {showIcon && (
        <Zap 
          className={`${iconSizes[size]} text-emerald-500`} 
          aria-hidden="true" 
        />
      )}
      <span className={weight.medium}>
        {formatCount(count)}
      </span>
      <span className={`${display.none} sm:${display.inline}`}>
        {count === 1 ? 'uses this' : 'use this'}
      </span>
    </div>
  );
}

/**
 * Format large numbers for display
 */
function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

/**
 * Inline version for tight spaces (just icon + number)
 */
export function UseCountBadgeCompact({
  count,
  className = '',
}: Pick<UseCountBadgeProps, 'count' | 'className'>) {
  if (count <= 0) return null;

  return (
    <div
      className={`${cluster.tight} ${textSize.xs} ${muted.default} ${className}`}
      title={`${count} ${count === 1 ? 'person uses' : 'people use'} this`}
    >
      <Zap className={`${iconSize.xs} text-emerald-500`} aria-hidden="true" />
      <span className={weight.medium}>{formatCount(count)}</span>
    </div>
  );
}
