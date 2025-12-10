'use client';

import { type Database } from '@heyclaude/database-types';
import {
  deleteReview,
  getReviewsWithStats,
  markReviewHelpful,
} from '@heyclaude/web-runtime/actions';
import { formatDistanceToNow, logUnhandledPromise } from '@heyclaude/web-runtime/core';
import { useAuthenticatedUser } from '@heyclaude/web-runtime/hooks';
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
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useState } from 'react';

import { useAuthModal } from '@/src/hooks/use-auth-modal';
import { ReviewForm } from '@/src/components/core/forms/review-form';

import { ReviewRatingHistogram } from './review-rating-histogram';

/**
 * Render a reviews section with aggregate statistics, sorting controls, pagination, and per-review actions.
 *
 * @param contentType - Content category used to fetch reviews (e.g., article, product)
 * @param contentSlug - Content identifier (slug) used to scope fetched reviews
 * @param currentUserId - Optional ID of the current user to enable edit/delete actions for their reviews
 * @returns A React element containing the reviews UI, including histogram, sort controls, review list, and load-more controls.
 *
 * @see ReviewCardItem
 * @see ReviewRatingHistogram
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
  const pathname = usePathname();
  const { user, status } = useAuthenticatedUser({ context: 'ReviewListSection' });
  const { openAuthModal } = useAuthModal();

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
    [contentType, contentSlug, sortBy]
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
  const handleDelete = useCallback(async (reviewId: string) => {
    // Proactive auth check - show modal before attempting action
    if (status === 'loading') {
      // Wait for auth check to complete
      return;
    }

    if (!user) {
      // User is not authenticated - show auth modal
      openAuthModal({
        valueProposition: 'Sign in to interact with reviews',
        redirectTo: pathname ?? undefined,
      });
      return;
    }

    // User is authenticated - proceed with delete action
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
      // Check if error is auth-related and show modal if so
      const errorMessage = normalized.message;
      if (errorMessage.includes('signed in') || errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {
        openAuthModal({
          valueProposition: 'Sign in to interact with reviews',
          redirectTo: pathname ?? undefined,
        });
      } else {
        // Non-auth errors - show toast with retry option
        toasts.raw.error('Failed to delete review', {
          action: {
            label: 'Retry',
            onClick: () => {
              handleDelete(reviewId);
            },
          },
        });
      }
    }
  }, [user, status, openAuthModal, pathname, sortBy, contentType, contentSlug, router, loadReviewsWithStats]);

  // Handle mark helpful
  const handleMarkHelpful = useCallback(async (reviewId: string) => {
    // Proactive auth check - show modal before attempting action
    if (status === 'loading') {
      // Wait for auth check to complete
      return;
    }

    if (!user) {
      // User is not authenticated - show auth modal
      openAuthModal({
        valueProposition: 'Sign in to interact with reviews',
        redirectTo: pathname ?? undefined,
      });
      return;
    }

    // User is authenticated - proceed with mark helpful action
    try {
      await markReviewHelpful({ review_id: reviewId, helpful: true });
      toasts.success.actionCompleted('mark as helpful');
      // Refresh reviews to update helpful count
      loadReviewsWithStats(page, sortBy).catch((error) => {
        logUnhandledPromise('ReviewListSection refresh after mark helpful', error, {
          contentType,
          contentSlug,
        });
      });
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
          reviewId,
        }
      );
      // Check if error is auth-related and show modal if so
      const errorMessage = normalized.message;
      if (errorMessage.includes('signed in') || errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {
        openAuthModal({
          valueProposition: 'Sign in to interact with reviews',
          redirectTo: pathname ?? undefined,
        });
      } else {
        // Non-auth errors - show toast with retry option
        toasts.raw.error('Failed to mark review as helpful', {
          action: {
            label: 'Retry',
            onClick: () => {
              handleMarkHelpful(reviewId);
            },
          },
        });
      }
    }
  }, [user, status, openAuthModal, pathname, page, sortBy, contentType, contentSlug, loadReviewsWithStats]);

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
              onCancelEdit={() => {
                setEditingReviewId(null);
                // Refresh reviews after successful edit to show updated content
                loadReviewsWithStats(1, sortBy).catch((error) => {
                  logUnhandledPromise('ReviewListSection refresh after edit', error, {
                    contentType,
                    contentSlug,
                  });
                });
              }}
              onMarkHelpful={(reviewId: string) => handleMarkHelpful(reviewId)}
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
 * Renders a single review card with rating, text, and contextual actions.
 *
 * Displays the reviewer's name, star rating, relative creation time, review text (with truncation and "Read more"/"Show less" toggle),
 * a "Helpful" action for other users, and Edit/Delete actions for the review owner. When `isEditing` is true for the owner's review,
 * renders an inline ReviewForm to edit the review.
 *
 * @param props.review - The review object with stats and user information to display.
 * @param props.currentUserId - ID of the currently authenticated user; used to determine ownership for edit/delete actions.
 * @param props.contentType - Content category for the review (used when rendering or editing the review).
 * @param props.contentSlug - Content identifier slug for the review (used when rendering or editing the review).
 * @param props.onEdit - Callback invoked when the owner clicks the Edit button.
 * @param props.onDelete - Callback invoked when the owner clicks the Delete button.
 * @param props.isEditing - When true and the current user owns the review, the component renders the inline edit form.
 * @param props.onCancelEdit - Callback invoked when the inline edit form is cancelled or successfully saved.
 *
 * @returns A JSX element rendering the review card, or `null` when required review fields are missing.
 *
 * @see ReviewForm
 * @see ReviewListSection
 * @see BaseCard
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
  onMarkHelpful,
}: {
  contentSlug: string;
  contentType: Database['public']['Enums']['content_category'];
  currentUserId?: string;
  isEditing?: boolean;
  onCancelEdit?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onMarkHelpful: (reviewId: string) => void;
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
                onClick={(e) => {
                  e.stopPropagation();
                  if (review.id) {
                    onMarkHelpful(review.id);
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