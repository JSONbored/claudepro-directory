'use client';

import { type Database } from '@heyclaude/database-types';
import {
  deleteReview,
  getReviewsWithStats,
  markReviewHelpful,
} from '@heyclaude/web-runtime/actions';
import { formatDistanceToNow, logUnhandledPromise } from '@heyclaude/web-runtime/core';
import { logClientWarn, normalizeError } from '@heyclaude/web-runtime/logging/client';
import { Edit, Star, ThumbsUp, Trash } from '@heyclaude/web-runtime/icons';
import { type ReviewSectionProps } from '@heyclaude/web-runtime/types/component.types';
import {
  toasts,
  UI_CLASSES,
  BaseCard,
  Button,
  Card,
  Label,
  StarDisplay,
} from '@heyclaude/web-runtime/ui';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useState } from 'react';

import { ReviewForm } from '@/src/components/core/forms/review-form';

import { ReviewRatingHistogram } from './review-rating-histogram';

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
  const [reviews, setReviews] = useState<
    NonNullable<Database['public']['Functions']['get_reviews_with_stats']['Returns']>['reviews']
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'helpful' | 'rating_high' | 'rating_low' | 'recent'>(
    'recent'
  );
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [aggregateRating, setAggregateRating] = useState<
    Database['public']['CompositeTypes']['review_aggregate_rating'] | null
  >(null);
  const [editingReviewId, setEditingReviewId] = useState<null | string>(null);
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
          const { reviews: nextReviews, has_more, aggregate_rating: agg } = result.data;
          setReviews((prev) =>
            pageNum === 1 ? (nextReviews ?? []) : [...(prev ?? []), ...(nextReviews ?? [])]
          );
          setHasMore(Boolean(has_more));

          if (agg) {
            setAggregateRating(agg);
          }
        }
      } catch (error) {
        const normalized = normalizeError(error, 'Failed to load reviews');
        logClientWarn(
          '[Reviews] Failed to load reviews',
          normalized,
          'ReviewListSection.loadReviewsWithStats',
          {
            component: 'ReviewListSection',
            action: 'load-reviews',
            category: 'reviews',
            contentType,
            contentSlug,
            sortBy: sort,
            page: pageNum,
          }
        );
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
      const result = await deleteReview({ delete_id: reviewId });
      if (result?.data?.success) {
        toasts.success.itemDeleted('Review');
        setReviews((prev) => (prev ?? []).filter((r) => r.id !== reviewId));
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
      const normalized = normalizeError(error, 'Failed to delete review');
      logClientWarn(
        '[Reviews] Delete failed',
        normalized,
        'ReviewListSection.handleDelete',
        {
          component: 'ReviewListSection',
          action: 'delete-review',
          category: 'reviews',
          reviewId,
          contentType,
          contentSlug,
        }
      );
      toasts.error.reviewActionFailed('delete');
    }
  };

  return (
    <div className="space-y-6">
      {/* Aggregate Rating + Histogram */}
      {aggregateRating?.count && aggregateRating.count > 0 && aggregateRating.distribution ? (
        <ReviewRatingHistogram
          distribution={{
            '1': aggregateRating.distribution.rating_1 ?? 0,
            '2': aggregateRating.distribution.rating_2 ?? 0,
            '3': aggregateRating.distribution.rating_3 ?? 0,
            '4': aggregateRating.distribution.rating_4 ?? 0,
            '5': aggregateRating.distribution.rating_5 ?? 0,
          }}
          totalReviews={aggregateRating.count}
          averageRating={aggregateRating.average ?? 0}
        />
      ) : null}

      {/* Sort Controls */}
      <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}`}>
        <h3 className="text-lg font-semibold">Reviews ({aggregateRating?.count ?? 0})</h3>
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
      ) : (reviews ?? []).length === 0 ? (
        <Card className="bg-muted/50 p-8 text-center">
          <Star className="text-muted-foreground/30 mx-auto mb-3 h-12 w-12" aria-hidden="true" />
          <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {(reviews ?? []).map((review) => (
            <ReviewCardItem
              key={review.id ?? ''}
              review={review}
              {...(currentUserId && { currentUserId })}
              contentType={contentType}
              contentSlug={contentSlug}
              onEdit={() => setEditingReviewId(review.id ?? null)}
              onDelete={() => handleDelete(review.id ?? '')}
              {...(editingReviewId === review.id && { isEditing: true })}
              onCancelEdit={() => setEditingReviewId(null)}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && !isLoading ? (
        <div className="pt-4 text-center">
          <Button variant="outline" onClick={handleLoadMore}>
            Load More Reviews
          </Button>
        </div>
      ) : null}
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
  contentType,
  contentSlug,
  onEdit,
  onDelete,
  isEditing,
  onCancelEdit,
}: {
  contentSlug: string;
  contentType: Database['public']['Enums']['content_category'];
  currentUserId?: string;
  isEditing?: boolean;
  onCancelEdit?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  review: Database['public']['CompositeTypes']['review_with_stats_item'];
}) {
  const [showFullText, setShowFullText] = useState(false);
  if (!(review.user && review.id && review.rating)) return null;

  const isOwnReview = currentUserId === review.user.id;
  const reviewText = review.review_text ?? '';
  const needsTruncation = reviewText.length > 200;
  const displayText =
    needsTruncation && !showFullText ? `${reviewText.slice(0, 200)}...` : reviewText;

  if (isEditing && isOwnReview) {
    return (
      <Card className="p-6">
        <ReviewForm
          contentType={contentType}
          contentSlug={contentSlug}
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
      displayTitle={review.user.name ?? 'Anonymous'}
      description=""
      author=""
      variant="review"
      showActions={false}
      disableNavigation
      ariaLabel={`Review by ${review.user.name ?? 'Anonymous'}`}
      renderContent={() => (
        <div className="space-y-3">
          {/* Rating + Date */}
          <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}`}>
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
              <StarDisplay rating={review.rating ?? 0} size="sm" />
              <span className="text-muted-foreground ml-1 text-xs">
                {(review.rating ?? 0).toFixed(1)}
              </span>
            </div>
            {review.created_at ? (
              <time className="text-muted-foreground text-xs" dateTime={review.created_at}>
                {formatDistanceToNow(new Date(review.created_at))} ago
              </time>
            ) : null}
          </div>

          {/* Review Text */}
          {reviewText ? (
            <div>
              <p className="text-foreground text-sm whitespace-pre-wrap">{displayText}</p>
              {needsTruncation ? (
                <button
                  type="button"
                  onClick={() => setShowFullText(!showFullText)}
                  className="text-primary mt-1 text-xs hover:underline"
                >
                  {showFullText ? 'Show less' : 'Read more'}
                </button>
              ) : null}
            </div>
          ) : null}

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
                    await markReviewHelpful({ review_id: review.id ?? '', helpful: true });
                    toasts.success.actionCompleted('mark as helpful');
                  } catch (error) {
                    const normalized = normalizeError(error, 'Failed to mark review as helpful');
                    logClientWarn(
                      '[Reviews] Mark helpful failed',
                      normalized,
                      'ReviewListSection.handleMarkHelpful',
                      {
                        component: 'ReviewListSection',
                        action: 'mark-helpful',
                        category: 'reviews',
                        reviewId: review.id ?? '',
                      }
                    );
                    toasts.error.reviewActionFailed('vote');
                  }
                }}
                className={UI_CLASSES.BUTTON_GHOST_ICON}
              >
                <ThumbsUp className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                Helpful ({review.helpful_count ?? 0})
              </Button>
            )}

            {/* Edit/Delete for own review */}
            {isOwnReview ? (
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
            ) : null}
          </div>
        </div>
      )}
    />
  );
}
