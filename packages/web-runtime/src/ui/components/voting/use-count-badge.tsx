'use client';

/**
 * UseCountBadge Component
 *
 * Compact badge showing "X use this" count for content cards.
 * Replaces the star rating display with social proof.
 */

import { Zap } from '../../../icons.tsx';
import { cluster } from '../../../design-system/styles/layout.ts';

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
    sm: 'text-xs',
    default: 'text-sm',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    default: 'h-3.5 w-3.5',
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
        text-muted-foreground
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
      <span className="font-medium">
        {formatCount(count)}
      </span>
      <span className="hidden sm:inline">
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
      className={`${cluster.tight} text-xs text-muted-foreground ${className}`}
      title={`${count} ${count === 1 ? 'person uses' : 'people use'} this`}
    >
      <Zap className="h-3 w-3 text-emerald-500" aria-hidden="true" />
      <span className="font-medium">{formatCount(count)}</span>
    </div>
  );
}
