'use client';

import { Star } from '@heyclaude/web-runtime/icons';
import { type ReviewRatingInteractiveProps } from '@heyclaude/web-runtime/types/component.types';
import { Rating, RatingButton } from '@heyclaude/web-runtime/ui';
import { cluster, gap, marginLeft } from "@heyclaude/web-runtime/design-system";

/**
 * Interactive star rating input for collecting and editing a numeric rating.
 *
 * @param value - Current rating value
 * @param max - Maximum number of stars to display (default 5)
 * @param onChange - Callback invoked with the new rating value when the selection changes
 * @param size - Icon size preset: 'sm' | 'md' | 'lg' (default 'md')
 * @param showValue - When true, displays the numeric rating next to the stars
 * @param className - Additional container CSS classes
 * @param aria-describedby - Forwarded to the inner rating `aria-describedby`
 * @param aria-invalid - Forwarded to the inner rating `aria-invalid`
 * @returns The rendered rating input element
 *
 * @see Rating
 * @see RatingButton
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
        className={`${gap.micro}`}
        aria-describedby={ariaDescribedby}
        aria-invalid={ariaInvalid}
      >
        {Array.from({ length: max }, (_, i) => (
          <RatingButton key={`star-${i + 1}`} size={iconSize} icon={<Star />} />
        ))}
      </Rating>
      {showValue ? (
        <span className={`text-muted-foreground ${marginLeft.micro} text-sm font-medium`}>{value.toFixed(1)}</span>
      ) : null}
    </div>
  );
}