'use client';

/**
 * Unified Review Component - Consolidation of 4 Review Components
 *
 * REPLACES:
 * - ReviewForm (198 LOC) - Form for creating/editing reviews
 * - ReviewSection (515 LOC) - Complete section with list, pagination, sorting
 * - RatingHistogram (107 LOC) - Visual rating distribution
 * - StarRating (106 LOC) - Interactive rating + compact display
 *
 * Total: 926 LOC → ~650 LOC (estimated 30% reduction)
 *
 * Architecture:
 * - Configuration-driven with discriminated union type safety
 * - 5 variants: form, section, histogram, rating-interactive, rating-compact
 * - Client component with proper server action integration
 * - Storybook compatible
 * - Zero backward compatibility - modern patterns only
 *
 * ARCHITECTURAL ISSUES IDENTIFIED & FIXED:
 * 1. ❌ ReviewSection uses lazy-loaded RatingHistogram with SSR disabled
 *    ✅ FIX: No lazy loading needed - client component with conditional rendering
 *
 * 2. ❌ StarRating wraps shadcn Rating but adds no value - unnecessary abstraction layer
 *    ✅ FIX: Direct use of shadcn Rating with proper configuration
 *
 * 3. ❌ ReviewSection has nested ReviewCardItem component (135 LOC) - bad separation of concerns
 *    ✅ FIX: Extract to separate component for reusability and testing
 *
 * 4. ❌ ReviewForm uses any type for content_type (line 93)
 *    ✅ FIX: Proper type-safe union of valid content types
 *
 * 5. ❌ RatingHistogram creates chartData array on every render - unnecessary computation
 *    ✅ FIX: Memoize with useMemo for performance
 *
 * 6. ❌ Multiple components duplicate star rendering logic
 *    ✅ FIX: Shared StarDisplay utility component
 */

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useMemo, useState, useTransition } from 'react';
import { BaseCard } from '@/src/components/domain/base-card';
import { ChartContainer, HorizontalBarChart } from '@/src/components/domain/horizontal-bar-chart';
import { Button } from '@/src/components/primitives/button';
import { Card } from '@/src/components/primitives/card';
import { Label } from '@/src/components/primitives/label';
import { Rating, RatingButton } from '@/src/components/primitives/shadcn-io/rating';
import { Textarea } from '@/src/components/primitives/textarea';
import {
  createReview,
  deleteReview,
  getReviewsWithStats,
  markReviewHelpful,
  updateReview,
} from '@/src/lib/actions/content.actions';
import { type CategoryId, isValidCategory } from '@/src/lib/config/category-config';
import { Edit, Star, ThumbsUp, Trash } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { formatDistanceToNow } from '@/src/lib/utils/data.utils';
import { toasts } from '@/src/lib/utils/toast.utils';

// ============================================================================
// SHARED UTILITIES
// ============================================================================

/**
 * Shared Star Display Component
 * Eliminates duplicate star rendering logic across variants
 */
function StarDisplay({
  rating,
  maxStars = 5,
  size = 'md',
  showFilled = true,
}: {
  rating: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  showFilled?: boolean;
}) {
  const sizeClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <>
      {Array.from({ length: maxStars }, (_, i) => (
        <Star
          key={`star-${i + 1}`}
          className={`${sizeClasses[size]} ${
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

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

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

// NO manual types - will use whatever the RPC returns

/**
 * Discriminated Union for Unified Review Component
 */
export type UnifiedReviewProps =
  | {
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
  | {
      variant: 'section';
      contentType: CategoryId;
      contentSlug: string;
      currentUserId?: string | undefined;
    }
  | {
      variant: 'histogram';
      distribution: Record<string, number>;
      totalReviews: number;
      averageRating: number;
    }
  | {
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
  | {
      variant: 'rating-compact';
      average: number;
      count: number;
      size?: 'sm' | 'md';
    };

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const MAX_REVIEW_LENGTH = 2000;

export function UnifiedReview(props: UnifiedReviewProps) {
  // Route to appropriate variant
  switch (props.variant) {
    case 'form':
      return <FormVariant {...props} />;
    case 'section':
      return <SectionVariant {...props} />;
    case 'histogram':
      return <HistogramVariant {...props} />;
    case 'rating-interactive':
      return <RatingInteractiveVariant {...props} />;
    case 'rating-compact':
      return <RatingCompactVariant {...props} />;
  }
}

// ============================================================================
// FORM VARIANT
// ============================================================================

function FormVariant({
  contentType,
  contentSlug,
  existingReview,
  onSuccess,
  onCancel,
}: Extract<UnifiedReviewProps, { variant: 'form' }>) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [reviewText, setReviewText] = useState(existingReview?.review_text || '');
  const [isPending, startTransition] = useTransition();
  const [showRatingError, setShowRatingError] = useState(false);
  const router = useRouter();
  const textareaId = useId();
  const ratingErrorId = useId();
  const textareaErrorId = useId();

  const isEditing = !!existingReview;
  const charactersRemaining = MAX_REVIEW_LENGTH - reviewText.length;
  const isValid = rating > 0;
  const hasTextError = reviewText.length > MAX_REVIEW_LENGTH;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      setShowRatingError(true);
      toasts.error.validation('Please select a star rating');
      return;
    }

    setShowRatingError(false);

    startTransition(async () => {
      try {
        if (isEditing) {
          const result = await updateReview({
            review_id: existingReview.id,
            rating,
            review_text: reviewText.trim() || undefined,
          });

          if (result?.data?.success) {
            toasts.success.itemUpdated('Review');
            router.refresh();
            onSuccess?.();
          }
        } else {
          const result = await createReview({
            content_type: contentType,
            content_slug: contentSlug,
            rating,
            review_text: reviewText.trim() || undefined,
          });

          if (result?.data?.success) {
            toasts.success.itemCreated('Review');
            setRating(0);
            setReviewText('');
            router.refresh();
            onSuccess?.();
          }
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('signed in')) {
          toasts.raw.error('Please sign in to write a review', {
            action: {
              label: 'Sign In',
              onClick: () => router.push(`/login?redirect=${window.location.pathname}`),
            },
          });
        } else if (error instanceof Error && error.message.includes('already reviewed')) {
          toasts.error.validation('You have already reviewed this content');
        } else {
          toasts.error.reviewActionFailed('submit');
        }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Star Rating Input */}
      <div>
        <Label htmlFor="rating" className="mb-2 block">
          Your Rating <span className="text-destructive">*</span>
        </Label>
        <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1} mt-2`}>
          <Rating
            value={rating}
            onValueChange={setRating}
            readOnly={false}
            className="gap-1"
            aria-describedby={showRatingError ? ratingErrorId : undefined}
            aria-invalid={showRatingError ? 'true' : undefined}
          >
            {Array.from({ length: 5 }, (_, i) => (
              <RatingButton key={`star-${i + 1}`} size={20} icon={<Star />} />
            ))}
          </Rating>
          {rating > 0 && (
            <span className="ml-1 font-medium text-muted-foreground text-sm">
              {rating.toFixed(1)}
            </span>
          )}
        </div>
        {rating === 0 && !showRatingError && (
          <p className="mt-1 text-muted-foreground text-xs">Click a star to rate</p>
        )}
        {showRatingError && (
          <p id={ratingErrorId} className="mt-1 text-destructive text-sm" role="alert">
            Please select a star rating before submitting
          </p>
        )}
      </div>

      {/* Review Text */}
      <div>
        <Label htmlFor={textareaId} className="mb-2 block">
          Your Review <span className="font-normal text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Textarea
          id={textareaId}
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Share your experience with this configuration..."
          maxLength={MAX_REVIEW_LENGTH}
          rows={4}
          disabled={isPending}
          error={hasTextError}
          {...(hasTextError ? { errorId: textareaErrorId } : {})}
        />
        {hasTextError && (
          <p id={textareaErrorId} className="mt-1 text-destructive text-sm" role="alert">
            Review text cannot exceed {MAX_REVIEW_LENGTH} characters
          </p>
        )}
        <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} mt-1`}>
          <p className="text-muted-foreground text-xs">
            Help others by sharing details about your experience
          </p>
          <p
            className={`text-xs ${charactersRemaining < 100 ? 'text-destructive' : 'text-muted-foreground'}`}
          >
            {charactersRemaining} characters remaining
          </p>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} pt-2`}>
        <Button type="submit" disabled={!isValid || isPending}>
          {isPending ? 'Submitting...' : isEditing ? 'Update Review' : 'Submit Review'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

// ============================================================================
// SECTION VARIANT
// ============================================================================

function SectionVariant({
  contentType,
  contentSlug,
  currentUserId,
}: Extract<UnifiedReviewProps, { variant: 'section' }>) {
  const sortSelectId = useId(); // Generate unique ID for sort select
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'rating_high' | 'rating_low'>(
    'recent'
  );
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [aggregateRating, setAggregateRating] = useState<any>(null);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const router = useRouter();

  const REVIEWS_PER_PAGE = 10;

  // Load reviews with stats - OPTIMIZED: Single RPC call
  const loadReviewsWithStats = useCallback(
    async (pageNum: number, sort: typeof sortBy) => {
      setIsLoading(true);
      try {
        const result = await getReviewsWithStats({
          content_type: contentType,
          content_slug: contentSlug,
          sort_by: sort,
          offset: (pageNum - 1) * REVIEWS_PER_PAGE,
          limit: REVIEWS_PER_PAGE,
        });

        if (result?.data) {
          const { reviews, hasMore, aggregateRating } = result.data as any;
          setReviews((prev) => (pageNum === 1 ? reviews : [...prev, ...reviews]));
          setHasMore(hasMore);

          // Also update aggregate rating (no separate call needed!)
          if (aggregateRating) {
            setAggregateRating(aggregateRating);
          }
        }
      } catch (_error) {
        toasts.error.reviewActionFailed('load');
      } finally {
        setIsLoading(false);
      }
    },
    [contentType, contentSlug]
  );

  // Initial load - useEffect for async operations (fire-and-forget pattern)
  useEffect(() => {
    // biome-ignore lint/complexity/noVoid: Intentional fire-and-forget async pattern
    void loadReviewsWithStats(1, sortBy);
  }, [loadReviewsWithStats, sortBy]);

  // Handle sort change (fire-and-forget pattern)
  const handleSortChange = (newSort: typeof sortBy) => {
    setSortBy(newSort);
    setPage(1);
    // biome-ignore lint/complexity/noVoid: Intentional fire-and-forget async pattern
    void loadReviewsWithStats(1, newSort);
  };

  // Handle load more (fire-and-forget pattern)
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    // biome-ignore lint/complexity/noVoid: Intentional fire-and-forget async pattern
    void loadReviewsWithStats(nextPage, sortBy);
  };

  // Handle delete
  const handleDelete = async (reviewId: string) => {
    try {
      const result = await deleteReview({ review_id: reviewId });
      if (result?.data?.success) {
        toasts.success.itemDeleted('Review');
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
        // Refresh stats after deletion
        // biome-ignore lint/complexity/noVoid: Intentional fire-and-forget async pattern
        void loadReviewsWithStats(1, sortBy);
        router.refresh();
      }
    } catch (_error) {
      toasts.error.reviewActionFailed('delete');
    }
  };

  // Handle helpful vote - REMOVED: Inline in ReviewCardItem for better UX

  return (
    <div className="space-y-6">
      {/* Aggregate Rating + Histogram */}
      {aggregateRating && aggregateRating.count > 0 && (
        <UnifiedReview
          variant="histogram"
          distribution={aggregateRating.distribution}
          totalReviews={aggregateRating.count}
          averageRating={aggregateRating.average}
        />
      )}

      {/* Sort Controls */}
      <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}`}>
        <h3 className="font-semibold text-lg">Reviews ({aggregateRating?.count || 0})</h3>
        <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
          <Label htmlFor={sortSelectId} className="text-muted-foreground text-sm">
            Sort by:
          </Label>
          <select
            id={sortSelectId}
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value as typeof sortBy)}
            className="rounded border px-2 py-1 text-sm"
          >
            <option value="recent">Most Recent</option>
            <option value="helpful">Most Helpful</option>
            <option value="rating_high">Highest Rating</option>
            <option value="rating_low">Lowest Rating</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      {isLoading && page === 1 ? (
        <div className="py-8 text-center">
          <p className="text-muted-foreground">Loading reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <Card className="bg-muted/50 p-8 text-center">
          <Star className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" aria-hidden="true" />
          <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCardItem
              key={review.id}
              review={review}
              {...(currentUserId && { currentUserId })}
              onEdit={() => setEditingReviewId(review.id)}
              onDelete={() => handleDelete(review.id)}
              {...(editingReviewId === review.id && { isEditing: true })}
              onCancelEdit={() => setEditingReviewId(null)}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && !isLoading && (
        <div className="pt-4 text-center">
          <Button variant="outline" onClick={handleLoadMore}>
            Load More Reviews
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Review Card Item Component
 * ARCHITECTURAL FIX: Extracted from nested component for reusability
 */
function ReviewCardItem({
  review,
  currentUserId,
  onEdit,
  onDelete,
  isEditing,
  onCancelEdit,
}: {
  review: ReviewItem;
  currentUserId?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  isEditing?: boolean;
  onCancelEdit?: () => void;
}) {
  const [showFullText, setShowFullText] = useState(false);
  const isOwnReview = currentUserId === review.user_id;
  const reviewText = review.review_text || '';
  const needsTruncation = reviewText.length > 200;
  const displayText =
    needsTruncation && !showFullText ? `${reviewText.slice(0, 200)}...` : reviewText;

  if (isEditing && isOwnReview) {
    // Type guard validation - should never fail for reviews from database
    if (!isValidCategory(review.content_type)) {
      return null;
    }

    return (
      <Card className="p-6">
        <UnifiedReview
          variant="form"
          contentType={review.content_type}
          contentSlug={review.content_slug}
          existingReview={{
            id: review.id,
            rating: review.rating,
            review_text: review.review_text,
          }}
          {...(onCancelEdit && { onSuccess: onCancelEdit, onCancel: onCancelEdit })}
        />
      </Card>
    );
  }

  return (
    <BaseCard
      displayTitle={review.user_profile?.username || 'Anonymous'}
      description=""
      author=""
      variant="review"
      showActions={false}
      disableNavigation
      ariaLabel={`Review by ${review.user_profile?.username || 'Anonymous'}`}
      renderContent={() => (
        <div className="space-y-3">
          {/* Rating + Date */}
          <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}`}>
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
              <StarDisplay rating={review.rating} size="sm" />
              <span className="ml-1 text-muted-foreground text-xs">{review.rating.toFixed(1)}</span>
            </div>
            <time className="text-muted-foreground text-xs" dateTime={review.created_at}>
              {formatDistanceToNow(new Date(review.created_at))} ago
            </time>
          </div>

          {/* Review Text */}
          {reviewText && (
            <div>
              <p className="whitespace-pre-wrap text-foreground text-sm">{displayText}</p>
              {needsTruncation && (
                <button
                  type="button"
                  onClick={() => setShowFullText(!showFullText)}
                  className="mt-1 text-primary text-xs hover:underline"
                >
                  {showFullText ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
          )}

          {/* Actions */}
          <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} pt-2`}>
            {/* Helpful Button - Simple button without UnifiedButton variant */}
            {!isOwnReview && (
              <Button
                variant="ghost"
                size="sm"
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    await markReviewHelpful({ review_id: review.id, helpful: true });
                    toasts.success.actionCompleted('mark as helpful');
                  } catch (_error) {
                    toasts.error.reviewActionFailed('vote');
                  }
                }}
                className={UI_CLASSES.BUTTON_GHOST_ICON}
              >
                <ThumbsUp className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                Helpful ({review.helpful_count})
              </Button>
            )}

            {/* Edit/Delete for own review */}
            {isOwnReview && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onEdit}
                  className={UI_CLASSES.BUTTON_GHOST_ICON}
                >
                  <Edit className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className={`${UI_CLASSES.BUTTON_GHOST_ICON} text-destructive hover:text-destructive`}
                >
                  <Trash className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    />
  );
}

// ============================================================================
// HISTOGRAM VARIANT
// ============================================================================

function HistogramVariant({
  distribution,
  totalReviews,
  averageRating,
}: Extract<UnifiedReviewProps, { variant: 'histogram' }>) {
  // ARCHITECTURAL FIX: Memoize chart data to prevent unnecessary recalculation
  const chartData = useMemo(() => {
    return [5, 4, 3, 2, 1].map((stars) => {
      const count = distribution[String(stars)] || 0;
      const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

      return {
        label: `${stars} ★`,
        value: count,
        formattedLabel: `${percentage.toFixed(1)}%`,
        fill: 'hsl(var(--chart-1))',
      };
    });
  }, [distribution, totalReviews]);

  if (totalReviews === 0) {
    return (
      <Card className="bg-muted/50 p-6">
        <div className="text-center">
          <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} mb-2 justify-center`}>
            <Star className="h-8 w-8 text-muted-foreground/30" aria-hidden="true" />
          </div>
          <p className="text-muted-foreground text-sm">No reviews yet. Be the first to review!</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {/* Header: Average Rating */}
      <div className="mb-6">
        <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_3} mb-2`}>
          <div className="font-bold text-4xl">{averageRating.toFixed(1)}</div>
          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
            <StarDisplay rating={averageRating} size="md" />
          </div>
        </div>
        <p className="text-muted-foreground text-sm">
          Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
        </p>
      </div>

      {/* Chart: Rating Distribution */}
      <div>
        <h3 className="mb-3 font-semibold text-sm">Rating Distribution</h3>
        <ChartContainer height="200px" className="w-full">
          <HorizontalBarChart
            data={chartData}
            height={200}
            labelWidth={40}
            valueWidth={60}
            barColor="hsl(var(--chart-1))"
            ariaLabel="Rating distribution chart"
            borderRadius={4}
          />
        </ChartContainer>
      </div>
    </Card>
  );
}

// ============================================================================
// RATING-INTERACTIVE VARIANT
// ============================================================================

function RatingInteractiveVariant({
  value,
  max = 5,
  onChange,
  size = 'md',
  showValue = false,
  className = '',
  'aria-describedby': ariaDescribedby,
  'aria-invalid': ariaInvalid,
}: Extract<UnifiedReviewProps, { variant: 'rating-interactive' }>) {
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

// ============================================================================
// RATING-COMPACT VARIANT
// ============================================================================

function RatingCompactVariant({
  average,
  count,
  size = 'sm',
}: Extract<UnifiedReviewProps, { variant: 'rating-compact' }>) {
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
