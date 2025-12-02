'use client';

import { cluster, muted, weight , gap } from '@heyclaude/web-runtime/design-system';
import { Star } from '@heyclaude/web-runtime/icons';
import type { ReviewRatingInteractiveProps } from '@heyclaude/web-runtime/types/component.types';
import { Rating, RatingButton } from '@heyclaude/web-runtime/ui';

/**
 * Render an interactive star rating control that lets users select and optionally view a numeric rating.
 *
 * @param value - Current rating value displayed and used as the selected value
 * @param max - Maximum number of stars to render
 * @param onChange - Callback invoked with the new rating value when the selection changes
 * @param size - Visual size preset for the star icons; one of `"sm"`, `"md"`, or `"lg"`
 * @param showValue - When true, displays the numeric rating value alongside the stars
 * @param className - Additional CSS classes applied to the component wrapper
 * @param ariaDescribedby - ID reference for an element that describes this control (forwarded to the underlying rating)
 * @param ariaInvalid - Indicates whether the current value is invalid for accessibility (forwarded to the underlying rating)
 * @returns The rendered star rating React element
 *
 * @see Rating
 * @see RatingButton
 * @see Star
 */
export function ReviewRatingInteractive({
  value,
  max = 5,
  onChange,
  size = 'md',
  showValue = false,
  className = '',
  'aria-describedby': ariaDescribedby,
  'aria-invalid': ariaInvalid,
}: Omit<ReviewRatingInteractiveProps, 'variant'>) {
  const sizeMap = {
    sm: 14,
    md: 16,
    lg: 20,
  };

  const iconSize = sizeMap[size];

  return (
    <div className={`${cluster.tight} ${className}`}>
      <Rating
        value={value}
        onValueChange={onChange}
        readOnly={false}
        className={`${gap.tight}`}
        aria-describedby={ariaDescribedby}
        aria-invalid={ariaInvalid}
      >
        {Array.from({ length: max }, (_, i) => (
          <RatingButton key={`star-${i + 1}`} size={iconSize} icon={<Star />} />
        ))}
      </Rating>
      {showValue && (
        <span className={`ml-1 ${weight.medium} ${muted.sm}`}>{value.toFixed(1)}</span>
      )}
    </div>
  );
}