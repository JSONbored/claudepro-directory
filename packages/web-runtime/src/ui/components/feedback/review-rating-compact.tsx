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
import { iconSize, iconFill } from '../../../design-system/styles/icons.ts';
import { size as textSize, weight, muted } from '../../../design-system/styles/typography.ts';
import { textColor } from '../../../design-system/styles/colors.ts';

export function ReviewRatingCompact({
  average,
  count,
  size = 'sm',
}: Omit<ReviewRatingCompactProps, 'variant'>) {
  return (
    <div className={cluster.tight}>
      <Star
        className={`${size === 'sm' ? iconSize.xsPlus : iconSize.sm} ${iconFill.amber400} ${textColor.amber400}`}
        aria-hidden="true"
      />
      <span className={`${size === 'sm' ? textSize.xs : textSize.sm} ${weight.medium}`}>
        {average.toFixed(1)}
      </span>
      <span className={`${size === 'sm' ? textSize.xs : textSize.sm} ${muted.default}`}>
        ({count})
      </span>
    </div>
  );
}
