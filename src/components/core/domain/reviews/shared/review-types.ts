import { getFormConfig } from '@/src/lib/actions/feature-flags.actions';
import type { CategoryId } from '@/src/lib/data/config/category';
import { logClientWarning } from '@/src/lib/utils/error.utils';

export type { ReviewItem } from '@/src/types/database-overrides';

/**
 * Props for review form variant
 */
export interface ReviewFormProps {
  variant: 'form';
  contentType: CategoryId;
  contentSlug: string;
  existingReview?: {
    id: string;
    rating: number;
    review_text: string | null;
  };
  onSuccess?: (() => void) | undefined;
  onCancel?: (() => void) | undefined;
}

/**
 * Props for review section variant
 */
export interface ReviewSectionProps {
  variant: 'section';
  contentType: CategoryId;
  contentSlug: string;
  currentUserId?: string | undefined;
}

/**
 * Props for review histogram variant
 */
export interface ReviewHistogramProps {
  variant: 'histogram';
  distribution: Record<string, number>;
  totalReviews: number;
  averageRating: number;
}

/**
 * Props for interactive rating variant
 */
export interface ReviewRatingInteractiveProps {
  variant: 'rating-interactive';
  value: number;
  max?: number;
  onChange: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean | 'true' | 'false';
}

/**
 * Props for compact rating display variant
 */
export interface ReviewRatingCompactProps {
  variant: 'rating-compact';
  average: number;
  count: number;
  size?: 'sm' | 'md';
}

/**
 * Discriminated Union for Review Components
 */
export type ReviewProps =
  | ReviewFormProps
  | ReviewSectionProps
  | ReviewHistogramProps
  | ReviewRatingInteractiveProps
  | ReviewRatingCompactProps;

/**
 * Maximum review text length (loaded from Dynamic Config)
 */
export let MAX_REVIEW_LENGTH = 2000;

// Load config from Statsig on module initialization
getFormConfig({})
  .then((result) => {
    if (result?.data) {
      MAX_REVIEW_LENGTH = result.data['form.max_review_length'];
    }
  })
  .catch((error) => {
    logClientWarning('ReviewTypes: failed to load form config', error);
  });
