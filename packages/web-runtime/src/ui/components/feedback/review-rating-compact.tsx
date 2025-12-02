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
import { iconSize } from '../../../design-system/styles/icons.ts';
import { size as textSize } from '../../../design-system/styles/typography.ts';

export function ReviewRatingCompact({
  average,
  count,
  size = 'sm',
}: Omit<ReviewRatingCompactProps, 'variant'>) {
  return (
    <div className={cluster.tight}>
      <Star
        className={`${size === 'sm' ? iconSize.xsPlus : iconSize.sm} fill-amber-400 text-amber-400`}
        aria-hidden="true"
      />
      <span className={`${size === 'sm' ? textSize.xs : textSize.sm} font-medium`}>
        {average.toFixed(1)}
      </span>
      <span className={`${size === 'sm' ? textSize.xs : textSize.sm} text-muted-foreground`}>
        ({count})
      </span>
    </div>
  );
}
