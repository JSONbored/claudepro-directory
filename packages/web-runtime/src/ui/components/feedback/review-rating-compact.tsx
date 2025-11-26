'use client';

/**
 * ReviewRatingCompact Component
 *
 * Compact rating display showing average and count
 * Primitive component suitable for use anywhere ratings need to be displayed
 */

import { Star } from '../../../icons.tsx';
import type { ReviewRatingCompactProps } from '../../../types/component.types.ts';
import { UI_CLASSES } from '../../../ui/constants.ts';

export function ReviewRatingCompact({
  average,
  count,
  size = 'sm',
}: Omit<ReviewRatingCompactProps, 'variant'>) {
  return (
    <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
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
