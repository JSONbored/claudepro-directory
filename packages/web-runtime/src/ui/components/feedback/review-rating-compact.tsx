'use client';

/**
 * ReviewRatingCompact Component
 *
 * Compact rating display showing average and count
 * Primitive component suitable for use anywhere ratings need to be displayed
 */

import { Star } from '../../../icons.tsx';
import type { ReviewRatingCompactProps } from '../../../types/component.types.ts';
// Design System imports
import { cluster } from '../../../design-system/styles/layout.ts';

export function ReviewRatingCompact({
  average,
  count,
  size = 'sm',
}: Omit<ReviewRatingCompactProps, 'variant'>) {
  return (
    <div className={cluster.tight}>
      <Star
        className={`${size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} fill-amber-400 text-amber-400`}
        aria-hidden="true"
      />
      <span className={`${size === 'sm' ? 'text-xs' : 'text-sm'} font-medium`}>
        {average.toFixed(1)}
      </span>
      <span className={`${size === 'sm' ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
        ({count})
      </span>
    </div>
  );
}
