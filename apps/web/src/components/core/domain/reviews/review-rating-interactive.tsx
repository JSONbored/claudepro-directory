'use client';

import { cluster } from '@heyclaude/web-runtime/design-system';
import { Star } from '@heyclaude/web-runtime/icons';
import type { ReviewRatingInteractiveProps } from '@heyclaude/web-runtime/types/component.types';
import { Rating, RatingButton } from '@heyclaude/web-runtime/ui';

/**
 * Renders an interactive star-based rating input allowing users to select a rating.
 *
 * @param value - Current rating value (displayed and used as the selected value)
 * @param max - Maximum number of stars to render
 * @param onChange - Callback invoked with the new rating value when the selection changes
 * @param size - Visual size preset for the star icons; one of "sm", "md", or "lg"
 * @param showValue - When true, displays the numeric rating value alongside the stars
 * @param className - Additional CSS classes applied to the component wrapper
 * @param aria-describedby - ID reference for an element that describes this control
 * @param aria-invalid - Indicates whether the current value is invalid for accessibility
 * @returns The rendered star rating UI element
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
        className="gap-1"
        aria-describedby={ariaDescribedby}
        aria-invalid={ariaInvalid}
      >
        {Array.from({ length: max }, (_, i) => (
          <RatingButton key={`star-${i + 1}`} size={iconSize} icon={<Star />} />
        ))}
      </Rating>
      {showValue && (
        <span className="ml-1 font-medium text-muted-foreground text-sm">{value.toFixed(1)}</span>
      )}
    </div>
  );
}