'use client';

/**
 * Review Section Component
 * Complete reviews UI with histogram, list, pagination, and form
 *
 * Production Features:
 * - Server-side data fetching with pagination
 * - Sorting (recent, helpful, rating high/low)
 * - Rating histogram with shadcn charts
 * - Optimistic UI updates
 * - Authentication-aware (sign in prompts)
 * - Accessible controls
 * - SEO-friendly semantic HTML
 * - No fake data - shows empty states
 */

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useState, useTransition } from 'react';
import { StarRating } from '@/src/components/features/reviews/star-rating';
import { BaseCard } from '@/src/components/shared/base-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { Badge } from '@/src/components/ui/badge';
import { markReviewHelpful } from '@/src/lib/actions/content.actions';
import { ThumbsUp } from '@/src/lib/icons';
import { formatDistanceToNow } from '@/src/lib/utils/data.utils';
import { toasts } from '@/src/lib/utils/toast.utils';

// Lazy load RatingHistogram component with recharts dependency (~100KB)
// SSR disabled: Charts are visual decorations, not critical for SEO/accessibility
// This prevents lodash (via recharts) from bloating the initial bundle
const RatingHistogram = dynamic(
  () =>
    import('@/src/components/features/reviews/rating-histogram').then((mod) => ({
      default: mod.RatingHistogram,
    })),
  {
    loading: () => <div className="h-64 bg-muted/50 animate-pulse rounded-xl" />,
    ssr: false, // Client-only: Prevents 100KB+ recharts/lodash in initial bundle
  }
);

import { ReviewForm } from '@/src/components/features/reviews/review-form';
import { Button } from '@/src/components/ui/button';
import { Card } from '@/src/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { deleteReview, getAggregateRating, getReviews } from '@/src/lib/actions/content.actions';
import { ChevronDown, Edit, Loader2, MessageCircle } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';

/**
 * Review item type matching database schema
 */
interface ReviewItem {
  id: string;
  rating: number;
  review_text: string | null;
  helpful_count: number;
  created_at: string;
  user_has_voted_helpful?: boolean | undefined;
  users: {
    slug: string;
    name: string | null;
    image: string | null;
    reputation_score: number;
    tier: string;
  } | null;
}

interface ReviewSectionProps {
  contentType: string;
  contentSlug: string;
  currentUserId?: string | undefined;
  initialReviewData?:
    | {
        reviews: ReviewItem[];
        total: number;
        hasMore: boolean;
      }
    | undefined;
  initialAggregateData?:
    | {
        average: number;
        count: number;
        distribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
      }
    | undefined;
}

type SortOption = 'recent' | 'helpful' | 'rating_high' | 'rating_low';

/**
 * Individual Review Card Item - uses BaseCard directly for optimal tree shaking
 */
function ReviewCardItem({
  review,
  currentUserId,
  onEdit,
  onDelete,
}: {
  review: ReviewItem;
  currentUserId?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasVoted, setHasVoted] = useState(review.user_has_voted_helpful ?? false);
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const user = review.users;
  const displayName = user?.name || 'Anonymous';
  const isOwnReview = currentUserId && user && currentUserId === user.slug;
  const reviewText = review.review_text || '';
  const shouldTruncate = reviewText.length > 300;
  const displayText = shouldTruncate && !isExpanded ? `${reviewText.slice(0, 300)}...` : reviewText;

  const handleHelpfulClick = async () => {
    startTransition(async () => {
      try {
        const result = await markReviewHelpful({
          review_id: review.id,
          helpful: !hasVoted,
        });

        if (result?.data?.success) {
          setHasVoted(!hasVoted);
          setHelpfulCount((prev) => (hasVoted ? prev - 1 : prev + 1));
          toasts.success.actionCompleted(hasVoted ? 'Vote removed' : 'Marked as helpful');
          router.refresh();
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('signed in')) {
          toasts.raw.error('Please sign in to vote on reviews', {
            action: {
              label: 'Sign In',
              onClick: () => router.push(`/login?redirect=${window.location.pathname}`),
            },
          });
        } else {
          toasts.error.voteUpdateFailed();
        }
      }
    });
  };

  if (!user) return null;

  return (
    <BaseCard
      variant="review"
      displayTitle={displayName}
      ariaLabel={`Review by ${displayName} - ${review.rating} stars`}
      disableNavigation
      showAuthor={false}
      renderHeader={() => (
        <div className={`${UI_CLASSES.FLEX_ITEMS_START_JUSTIFY_BETWEEN} mb-3`}>
          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_3}>
            <Avatar>
              {user.image && <AvatarImage src={user.image} alt={displayName} />}
              <AvatarFallback>{displayName[0]?.toUpperCase() || '?'}</AvatarFallback>
            </Avatar>
            <div>
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                <span className={`${UI_CLASSES.TEXT_SM} font-semibold`}>{displayName}</span>
                {user.tier && user.tier !== 'free' && (
                  <Badge variant="secondary" className="text-xs capitalize">
                    {user.tier}
                  </Badge>
                )}
              </div>
              <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} mt-1`}>
                <StarRating value={review.rating} size="sm" />
                <span className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
                  {formatDistanceToNow(new Date(review.created_at))}
                </span>
              </div>
            </div>
          </div>
          {isOwnReview && (
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              {onEdit && (
                <Button variant="ghost" size="sm" onClick={onEdit}>
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button variant="ghost" size="sm" onClick={onDelete}>
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      )}
      renderContent={() =>
        reviewText ? (
          <>
            <p
              className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} whitespace-pre-wrap`}
            >
              {displayText}
            </p>
            {shouldTruncate && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className={`${UI_CLASSES.TEXT_XS} text-primary hover:underline mt-1`}
              >
                {isExpanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </>
        ) : null
      }
      renderActions={() => (
        <Button
          variant={hasVoted ? 'default' : 'outline'}
          size="sm"
          onClick={handleHelpfulClick}
          disabled={isPending || !!isOwnReview}
          className="gap-1.5"
        >
          <ThumbsUp
            className={`h-3.5 w-3.5 ${hasVoted ? 'fill-current' : ''}`}
            aria-hidden="true"
          />
          <span className={UI_CLASSES.TEXT_XS}>
            Helpful {helpfulCount > 0 && `(${helpfulCount})`}
          </span>
        </Button>
      )}
    />
  );
}

export function ReviewSection({
  contentType,
  contentSlug,
  currentUserId,
  initialReviewData,
  initialAggregateData,
}: ReviewSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState<{
    id: string;
    rating: number;
    review_text: string | null;
  } | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [reviews, setReviews] = useState(initialReviewData?.reviews || []);
  const [hasMore, setHasMore] = useState(initialReviewData?.hasMore);
  const [totalCount, setTotalCount] = useState(initialReviewData?.total || 0);
  const [aggregateData, setAggregateData] = useState(initialAggregateData);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const headingId = useId();

  // Fetch aggregate rating on mount if not provided
  useEffect(() => {
    if (!aggregateData) {
      startTransition(async () => {
        try {
          const result = await getAggregateRating({
            // biome-ignore lint/suspicious/noExplicitAny: validated by server action
            content_type: contentType as any,
            content_slug: contentSlug,
          });

          if (result?.data?.success) {
            setAggregateData({
              average: result.data.average,
              count: result.data.count,
              distribution: result.data.distribution,
            });
          }
        } catch {
          // Silent fail - will show "No reviews yet"
        }
      });
    }
  }, [aggregateData, contentType, contentSlug]);

  // Fetch reviews when sort changes
  const fetchReviews = useCallback(
    async (offset = 0, append = false) => {
      setIsLoadingMore(true);
      try {
        const result = await getReviews({
          // biome-ignore lint/suspicious/noExplicitAny: validated by server action
          content_type: contentType as any,
          content_slug: contentSlug,
          sort_by: sortBy,
          limit: 20,
          offset,
        });

        if (result?.data?.success && result.data.reviews) {
          // Map to remove extra fields not in state type (user_id, content_type, content_slug, updated_at)
          const mappedReviews = result.data.reviews.map(
            (review) =>
              ({
                id: review.id,
                rating: review.rating,
                review_text: review.review_text,
                helpful_count: review.helpful_count,
                created_at: review.created_at,
                user_has_voted_helpful: review.user_has_voted_helpful,
                users: review.users,
              }) as ReviewItem
          );

          if (append) {
            setReviews((prev) => [...prev, ...mappedReviews]);
          } else {
            setReviews(mappedReviews);
          }
          setHasMore(result.data.hasMore ?? false);
          setTotalCount(result.data.total ?? 0);
        }
      } catch {
        toasts.error.loadFailed('reviews');
      } finally {
        setIsLoadingMore(false);
      }
    },
    [contentType, contentSlug, sortBy]
  );

  // Refetch when sort changes
  useEffect(() => {
    if (!initialReviewData) {
      fetchReviews(0, false).catch(() => {
        // Error already handled in fetchReviews
      });
    }
  }, [fetchReviews, initialReviewData]);

  const handleLoadMore = () => {
    fetchReviews(reviews.length, true).catch(() => {
      // Error already handled in fetchReviews
    });
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }

    startTransition(async () => {
      try {
        const result = await deleteReview({ review_id: reviewId });

        if (result?.data?.success) {
          toasts.success.itemDeleted('Review');
          setReviews((prev) => prev.filter((r) => r.id !== reviewId));
          setTotalCount((prev) => prev - 1);
          router.refresh();
        }
      } catch {
        toasts.error.reviewActionFailed('delete');
      }
    });
  };

  const userReview = currentUserId ? reviews.find((r) => r.users?.slug === currentUserId) : null;

  return (
    <section className="space-y-6" aria-labelledby={headingId}>
      <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} flex-wrap gap-4`}>
        <h2 id={headingId} className="text-2xl font-bold">
          Reviews & Ratings
        </h2>
        {!(userReview || showForm) && (
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Write a Review
          </Button>
        )}
      </div>

      {/* Rating Histogram */}
      {aggregateData && (
        <RatingHistogram
          distribution={aggregateData.distribution}
          totalReviews={aggregateData.count}
          averageRating={aggregateData.average}
        />
      )}

      {/* Review Form */}
      {(showForm || editingReview) && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingReview ? 'Edit Your Review' : 'Write a Review'}
          </h3>
          <ReviewForm
            contentType={contentType}
            contentSlug={contentSlug}
            existingReview={editingReview ?? undefined}
            onSuccess={() => {
              setShowForm(false);
              setEditingReview(null);
              // Refetch aggregate and reviews
              fetchReviews(0, false).catch(() => {
                // Error already handled in fetchReviews
              });
              router.refresh();
            }}
            onCancel={() => {
              setShowForm(false);
              setEditingReview(null);
            }}
          />
        </Card>
      )}

      {/* Reviews List */}
      {totalCount > 0 && (
        <div className="space-y-4">
          {/* Sort Controls */}
          <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} flex-wrap gap-4`}>
            <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
              Showing {reviews.length} of {totalCount} {totalCount === 1 ? 'review' : 'reviews'}
            </p>
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <span className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
                Sort by:
              </span>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="helpful">Most Helpful</SelectItem>
                  <SelectItem value="rating_high">Highest Rating</SelectItem>
                  <SelectItem value="rating_low">Lowest Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Review Cards */}
          <div className="space-y-3">
            {reviews.map((review) => {
              const isOwnReview = review.users?.slug === currentUserId;
              return (
                <ReviewCardItem
                  key={review.id}
                  review={review}
                  {...(currentUserId && { currentUserId })}
                  {...(isOwnReview && {
                    onEdit: () => {
                      setEditingReview({
                        id: review.id,
                        rating: review.rating,
                        review_text: review.review_text,
                      });
                      setShowForm(false);
                    },
                    onDelete: () => handleDeleteReview(review.id),
                  })}
                />
              );
            })}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className={`${UI_CLASSES.FLEX} ${UI_CLASSES.JUSTIFY_CENTER} pt-4`}>
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="gap-2"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                    Load More Reviews
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {totalCount === 0 && !showForm && !aggregateData && (
        <Card className={`p-8 text-center ${UI_CLASSES.BG_MUTED_50}`}>
          <MessageCircle
            className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50"
            aria-hidden="true"
          />
          <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
          <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} mb-4`}>
            Be the first to share your experience with this configuration
          </p>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Edit className="h-4 w-4" aria-hidden="true" />
            Write the First Review
          </Button>
        </Card>
      )}
    </section>
  );
}
