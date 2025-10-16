'use client';

/**
 * Star Rating Component (Wrapper around shadcn Rating)
 * Beautiful star ratings with hover states and keyboard navigation
 *
 * Features:
 * - Interactive mode with hover preview
 * - Read-only display mode
 * - Keyboard navigation (Arrow keys)
 * - Accessible (ARIA labels, radiogroup)
 * - Multiple size variants
 * - Optional value display
 */

import { Rating, RatingButton } from '@/src/components/ui/shadcn-io/rating';
import { Star } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';

interface StarRatingProps {
  /** Current rating value (0-5) */
  value: number;
  /** Maximum rating (default: 5) */
  max?: number | undefined;
  /** Interactive mode for user input */
  interactive?: boolean | undefined;
  /** Callback for rating change (required if interactive) */
  onChange?: ((rating: number) => void) | undefined;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | undefined;
  /** Show rating number next to stars */
  showValue?: boolean | undefined;
  /** Custom className */
  className?: string | undefined;
  /** ARIA describedby for error associations */
  'aria-describedby'?: string | undefined;
  /** ARIA invalid state for validation */
  'aria-invalid'?: boolean | 'true' | 'false' | undefined;
}

export function StarRating({
  value,
  max = 5,
  interactive = false,
  onChange,
  size = 'md',
  showValue = false,
  className = '',
  'aria-describedby': ariaDescribedby,
  'aria-invalid': ariaInvalid,
}: StarRatingProps) {
  const sizeMap = {
    sm: 14,
    md: 16,
    lg: 20,
  };

  const iconSize = sizeMap[size];

  return (
    <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1} ${className}`}>
      <Rating
        value={value}
        onValueChange={onChange}
        readOnly={!interactive}
        className={interactive ? 'gap-1' : 'gap-0.5'}
        aria-describedby={ariaDescribedby}
        aria-invalid={ariaInvalid}
      >
        {Array.from({ length: max }, (_, i) => (
          <RatingButton key={`star-${i + 1}`} size={iconSize} icon={<Star />} />
        ))}
      </Rating>
      {showValue && (
        <span className={'text-sm text-muted-foreground ml-1 font-medium'}>{value.toFixed(1)}</span>
      )}
    </div>
  );
}

/**
 * Compact Star Rating Display
 * Shows rating with count in a condensed format
 */
interface StarRatingCompactProps {
  average: number;
  count: number;
  size?: 'sm' | 'md';
}

export function StarRatingCompact({ average, count, size = 'sm' }: StarRatingCompactProps) {
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
