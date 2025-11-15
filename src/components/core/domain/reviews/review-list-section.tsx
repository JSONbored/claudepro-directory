'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useState } from 'react';
import { BaseCard } from '@/src/components/core/domain/cards/content-card-base';
import { ReviewForm } from '@/src/components/core/forms/review-form';
import { Button } from '@/src/components/primitives/ui/button';
import { Card } from '@/src/components/primitives/ui/card';
import { Label } from '@/src/components/primitives/ui/label';
import {
  deleteReview,
  getReviewsWithStats,
  markReviewHelpful,
} from '@/src/lib/actions/content.actions';
import { isValidCategory } from '@/src/lib/data/config/category';
import { Edit, Star, ThumbsUp, Trash } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { formatDistanceToNow } from '@/src/lib/utils/data.utils';
import { logClientWarning, logUnhandledPromise } from '@/src/lib/utils/error.utils';
import { toasts } from '@/src/lib/utils/toast.utils';
import { ReviewRatingHistogram } from './review-rating-histogram';
import type { ReviewItem, ReviewSectionProps } from './shared/review-types';
import { StarDisplay } from './shared/star-display';

/**
 * Complete review section with list, pagination, and sorting
 * Displays all reviews for a piece of content with aggregate statistics
 */
export function ReviewListSection({
  contentType,
  contentSlug,
  currentUserId,
}: Omit<ReviewSectionProps, 'variant'>) {
  const sortSelectId = useId(); // Generate unique ID for sort select
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'rating_high' | 'rating_low'>(
    'recent'
  );
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [aggregateRating, setAggregateRating] = useState<{
    count: number;
    average: number;
    distribution: Record<string, number>;
  } | null>(null);
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
          const responseData = result.data as unknown as {
            reviews: ReviewItem[];
            hasMore: boolean;
            aggregateRating: {
              count: number;
              average: number;
              distribution: Record<string, number>;
            };
          };
          setReviews((prev) =>
            pageNum === 1 ? responseData.reviews : [...prev, ...responseData.reviews]
          );
          setHasMore(responseData.hasMore);

          // Also update aggregate rating (no separate call needed!)
          if (responseData.aggregateRating) {
            setAggregateRating(responseData.aggregateRating);
          }
        }
      } catch (error) {
        logClientWarning('ReviewListSection: failed to load reviews', error, {
          contentType,
          contentSlug,
          sortBy: sort,
          page: pageNum,
        });
        toasts.error.reviewActionFailed('load');
      } finally {
        setIsLoading(false);
      }
    },
    [contentType, contentSlug]
  );

  // Initial load - useEffect for async operations (fire-and-forget pattern)
  useEffect(() => {
    loadReviewsWithStats(1, sortBy).catch((error) => {
      logUnhandledPromise('ReviewListSection initial load', error, {
        contentType,
        contentSlug,
      });
    });
  }, [contentSlug, contentType, loadReviewsWithStats, sortBy]);

  // Handle sort change
  const handleSortChange = (newSort: typeof sortBy) => {
    setSortBy(newSort);
    setPage(1);
    loadReviewsWithStats(1, newSort).catch((error) => {
      logUnhandledPromise('ReviewListSection sort change', error, {
        contentType,
        contentSlug,
        newSort,
      });
    });
  };

  // Handle load more
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadReviewsWithStats(nextPage, sortBy).catch((error) => {
      logUnhandledPromise('ReviewListSection load more', error, {
        contentType,
        contentSlug,
        nextPage,
        sortBy,
      });
    });
  };

  // Handle delete
  const handleDelete = async (reviewId: string) => {
    try {
      const result = await deleteReview({ review_id: reviewId });
      if (result?.data?.success) {
        toasts.success.itemDeleted('Review');
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
        // Refresh stats after deletion
        loadReviewsWithStats(1, sortBy).catch((error) => {
          logUnhandledPromise('ReviewListSection refresh after delete', error, {
            contentType,
            contentSlug,
          });
        });
        router.refresh();
      }
    } catch (error) {
      logClientWarning('ReviewListSection: delete failed', error, {
        reviewId,
        contentType,
        contentSlug,
      });
      toasts.error.reviewActionFailed('delete');
    }
  };

  return (
    <div className="space-y-6">
      {/* Aggregate Rating + Histogram */}
      {aggregateRating && aggregateRating.count > 0 && (
        <ReviewRatingHistogram
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
 * Displays an individual review with actions
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
        <ReviewForm
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
            {/* Helpful Button */}
            {!isOwnReview && (
              <Button
                variant="ghost"
                size="sm"
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    await markReviewHelpful({ review_id: review.id, helpful: true });
                    toasts.success.actionCompleted('mark as helpful');
                  } catch (error) {
                    logClientWarning('ReviewListSection: markReviewHelpful failed', error, {
                      reviewId: review.id,
                    });
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
