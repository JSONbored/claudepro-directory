/**
 * Star Rating Display Component
 *
 * Visual star rating display used across review variants.
 * Renders filled/empty stars based on the rating value.
 *
 * @module web-runtime/ui/components/feedback/star-display
 *
 * @example Basic usage
 * ```tsx
 * <StarDisplay rating={4.5} />
 * ```
 *
 * @example With custom size
 * ```tsx
 * <StarDisplay rating={3} size="lg" maxStars={5} />
 * ```
 *
 * @example Empty stars only
 * ```tsx
 * <StarDisplay rating={0} showFilled={false} />
 * ```
 */

import { Star } from '../../../icons.tsx';
import { iconSize } from '../../../design-system/styles/icons.ts';

/** Size variants for star icons */
export type StarSize = 'sm' | 'md' | 'lg';

/** Props for StarDisplay component */
export interface StarDisplayProps {
  /** Current rating value (0-maxStars) */
  rating: number;
  /** Maximum number of stars to display */
  maxStars?: number;
  /** Size variant for star icons */
  size?: StarSize;
  /** Whether to show filled stars based on rating */
  showFilled?: boolean;
}

const SIZE_CLASSES: Record<StarSize, string> = {
  sm: iconSize.xsPlus,
  md: iconSize.md,
  lg: iconSize.lg,
};

/**
 * StarDisplay Component
 *
 * Renders a row of star icons representing a rating.
 * Stars are filled based on the rating value.
 */
export function StarDisplay({
  rating,
  maxStars = 5,
  size = 'md',
  showFilled = true,
}: StarDisplayProps) {
  return (
    <>
      {Array.from({ length: maxStars }, (_, i) => (
        <Star
          key={`star-${i + 1}`}
          className={`${SIZE_CLASSES[size]} ${
            showFilled && i < Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'fill-none text-muted-foreground/30'
          }`}
          aria-hidden="true"
        />
      ))}
    </>
  );
}
