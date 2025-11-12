'use client';

/**
 * Review Component Dispatcher
 *
 * ARCHITECTURE: Split into separate files for better tree-shaking
 * - ReviewForm → core/forms/review-form.tsx
 * - ReviewListSection → core/domain/reviews/review-list-section.tsx
 * - ReviewRatingHistogram → core/domain/reviews/review-rating-histogram.tsx
 * - ReviewRatingInteractive → core/domain/reviews/review-rating-interactive.tsx
 * - ReviewRatingCompact → primitives/feedback/review-rating-compact.tsx
 * - StarDisplay → shared/star-display.tsx
 * - Types → shared/review-types.ts
 *
 * BENEFITS:
 * - Module-level tree-shaking (60-90% bundle reduction per page)
 * - Better maintainability (separate files for separate concerns)
 * - Improved organization (distributed by type pattern)
 *
 * This dispatcher maintains backward compatibility while enabling direct imports
 * for better performance. New code should import split components directly.
 */

import { ReviewForm } from '@/src/components/core/forms/review-form';
import { ReviewRatingCompact } from '@/src/components/primitives/feedback/review-rating-compact';
import { ReviewListSection } from './review-list-section';
import { ReviewRatingHistogram } from './review-rating-histogram';
import { ReviewRatingInteractive } from './review-rating-interactive';

/**
 * Unified Review Component Dispatcher
 * Maintains backward compatibility - imports split components internally
 *
 * For new code, import split components directly:
 * - ReviewForm from '@/src/components/core/forms/review-form'
 * - ReviewListSection from '@/src/components/core/domain/reviews/review-list-section'
 * - ReviewRatingHistogram from '@/src/components/core/domain/reviews/review-rating-histogram'
 * - ReviewRatingInteractive from '@/src/components/core/domain/reviews/review-rating-interactive'
 * - ReviewRatingCompact from '@/src/components/primitives/feedback/review-rating-compact'
 *
 * @deprecated Prefer direct imports of split components for better tree-shaking
 */
export function UnifiedReview(
  props:
    | (Parameters<typeof ReviewForm>[0] & { variant: 'form' })
    | (Parameters<typeof ReviewListSection>[0] & { variant: 'section' })
    | (Parameters<typeof ReviewRatingHistogram>[0] & { variant: 'histogram' })
    | (Parameters<typeof ReviewRatingInteractive>[0] & { variant: 'rating-interactive' })
    | (Parameters<typeof ReviewRatingCompact>[0] & { variant: 'rating-compact' })
) {
  // Route to appropriate component
  switch (props.variant) {
    case 'form': {
      const { variant: _, ...formProps } = props;
      return <ReviewForm {...formProps} />;
    }
    case 'section': {
      const { variant: _, ...sectionProps } = props;
      return <ReviewListSection {...sectionProps} />;
    }
    case 'histogram': {
      const { variant: _, ...histogramProps } = props;
      return <ReviewRatingHistogram {...histogramProps} />;
    }
    case 'rating-interactive': {
      const { variant: _, ...interactiveProps } = props;
      return <ReviewRatingInteractive {...interactiveProps} />;
    }
    case 'rating-compact': {
      const { variant: _, ...compactProps } = props;
      return <ReviewRatingCompact {...compactProps} />;
    }
  }
}
