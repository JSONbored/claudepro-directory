'use client';

import type { Database } from '@heyclaude/database-types';
import {
  deleteReview,
  getReviewsWithStats,
  markReviewHelpful,
} from '@heyclaude/web-runtime/actions';
import {
  formatDistanceToNow,
  logClientWarning,
  logUnhandledPromise,
} from '@heyclaude/web-runtime/core';
import { Edit, Star, ThumbsUp, Trash } from '@heyclaude/web-runtime/icons';
import { between, cluster, buttonGhost } from '@heyclaude/web-runtime/design-system';
import type { ReviewSectionProps } from '@heyclaude/web-runtime/types/component.types';
import { toasts } from '@heyclaude/web-runtime/ui';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useState } from 'react';
import { BaseCard } from '@heyclaude/web-runtime/ui';
import { ReviewForm } from '@/src/components/core/forms/review-form';
import { Button } from '@heyclaude/web-runtime/ui';
import { Card } from '@heyclaude/web-runtime/ui';
import { Label } from '@heyclaude/web-runtime/ui';

import { StarDisplay } from '@heyclaude/web-runtime/ui';
import { ReviewRatingHistogram } from './review-rating-histogram';

/**
 * Render the reviews section for the given content, showing aggregate rating, a sortable paginated list of reviews, and per-review actions (edit, delete, mark helpful).
 *
 * This component loads review data with aggregate statistics, manages sorting and pagination state, supports inline editing for the current user's review, and exposes controls for loading more reviews. It handles API errors by logging and showing toasts and refreshes aggregate stats after changes.
 *
 * @param contentType - The content category used by the reviews API (e.g., article, product).
 * @param contentSlug - The unique slug/identifier for the content whose reviews are displayed.
 * @param currentUserId - Optional id of the currently authenticated user; used to show edit/delete controls for the user's own reviews.
 * @returns The rendered reviews section as a React element.
 *
 * @see ReviewRatingHistogram
 * @see ReviewCardItem
 * @see ReviewForm
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
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'rating_high' | 'rating_low'>(
    'recent'
  );
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [aggregateRating, setAggregateRating] = useState<
    Database['public']['CompositeTypes']['review_aggregate_rating'] | null
  >(null);
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
      {aggregateRating?.count && aggregateRating.count > 0 && aggregateRating.distribution && (
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
      )}

      {/* Sort Controls */}
      <div className={between.center}>
        <h3 className="font-semibold text-lg">Reviews ({aggregateRating?.count ?? 0})</h3>
        <div className={cluster.compact}>
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
          <Star className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" aria-hidden="true" />
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
 * Renders a single review card with rating, text, and contextual actions (helpful, edit, delete).
 *
 * Renders a read-only card for other users and an inline editable ReviewForm for the current user's review when `isEditing` is true. If required review fields are missing, returns `null`.
 *
 * @param review - Review record with aggregated stats and related user data.
 * @param currentUserId - ID of the currently authenticated user; used to determine ownership and which actions to show.
 * @param contentType - Content category for the review (used when rendering or editing).
 * @param contentSlug - Content identifier used when editing the review.
 * @param onEdit - Callback invoked when the Edit action is requested.
 * @param onDelete - Callback invoked when the Delete action is requested.
 * @param isEditing - If true and the current user owns the review, render the editable ReviewForm instead of the read-only card.
 * @param onCancelEdit - Callback invoked after a successful edit or when editing is cancelled.
 *
 * @returns A card element displaying the review and available actions, or `null` if essential review data is missing.
 *
 * @see ReviewForm
 * @see BaseCard
 * @see markReviewHelpful
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
  review: Database['public']['CompositeTypes']['review_with_stats_item'];
  currentUserId?: string;
  contentType: Database['public']['Enums']['content_category'];
  contentSlug: string;
  onEdit?: () => void;
  onDelete?: () => void;
  isEditing?: boolean;
  onCancelEdit?: () => void;
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
      disableNavigation={true}
      ariaLabel={`Review by ${review.user.name ?? 'Anonymous'}`}
      renderContent={() => (
        <div className="space-y-3">
          {/* Rating + Date */}
          <div className={between.center}>
            <div className={cluster.tight}>
              <StarDisplay rating={review.rating ?? 0} size="sm" />
              <span className="ml-1 text-muted-foreground text-xs">
                {(review.rating ?? 0).toFixed(1)}
              </span>
            </div>
            {review.created_at && (
              <time className="text-muted-foreground text-xs" dateTime={review.created_at}>
                {formatDistanceToNow(new Date(review.created_at))} ago
              </time>
            )}
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
          <div className={`${cluster.compact} pt-2`}>
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
                    logClientWarning('ReviewListSection: markReviewHelpful failed', error, {
                      reviewId: review.id ?? '',
                    });
                    toasts.error.reviewActionFailed('vote');
                  }
                }}
                className={buttonGhost.icon}
              >
                <ThumbsUp className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                Helpful ({review.helpful_count ?? 0})
              </Button>
            )}

            {/* Edit/Delete for own review */}
            {isOwnReview && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onEdit}
                  className={buttonGhost.icon}
                >
                  <Edit className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className={`${buttonGhost.icon} text-destructive hover:text-destructive`}
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