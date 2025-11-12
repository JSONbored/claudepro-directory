import type { CategoryId } from '@/src/lib/config/category-config';

/**
 * Review Item from Database
 */
export interface ReviewItem {
  id: string;
  user_id: string;
  content_type: string;
  content_slug: string;
  rating: number;
  review_text: string | null;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  user_profile?: {
    username: string | null;
    avatar_url: string | null;
  } | null;
}

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
 * Maximum review text length
 */
export const MAX_REVIEW_LENGTH = 2000;
