'use client';

import { cluster } from '@heyclaude/web-runtime/design-system';
import { Star } from '@heyclaude/web-runtime/icons';
import type { ReviewRatingInteractiveProps } from '@heyclaude/web-runtime/types/component.types';
import { Rating, RatingButton } from '@heyclaude/web-runtime/ui';

/**
 * Interactive star rating input component
 * Used for collecting user ratings
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
