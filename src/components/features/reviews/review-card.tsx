'use client';

/**
 * Review Card Component
 * Displays a single user review with helpful voting
 *
 * Features:
 * - User avatar, name, and reputation tier
 * - Star rating display
 * - Review text with "Read more" expansion
 * - Helpful voting button
 * - Relative timestamps
 * - Edit/Delete for review author
 */

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { StarRating } from '@/src/components/features/reviews/star-rating';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { markReviewHelpful } from '@/src/lib/actions/review-actions';
import { ThumbsUp } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { formatDistanceToNow } from '@/src/lib/utils/date-helpers';

interface ReviewCardProps {
  review: {
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
  };
  currentUserId?: string | undefined;
  onEdit?: (() => void) | undefined;
  onDelete?: (() => void) | undefined;
}

export function ReviewCard({ review, currentUserId, onEdit, onDelete }: ReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasVoted, setHasVoted] = useState(review.user_has_voted_helpful ?? false);
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const user = review.users;
  const displayName = user?.name || 'Anonymous';
  const isOwnReview = currentUserId && user && currentUserId === user.slug;

  // Truncate long review text
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
          toast.success(hasVoted ? 'Vote removed' : 'Marked as helpful');
          router.refresh();
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('signed in')) {
          toast.error('Please sign in to vote on reviews', {
            action: {
              label: 'Sign In',
              onClick: () => router.push(`/login?redirect=${window.location.pathname}`),
            },
          });
        } else {
          toast.error(error instanceof Error ? error.message : 'Failed to update vote');
        }
      }
    });
  };

  return (
    <div className={`p-4 rounded-lg border ${UI_CLASSES.BG_CARD}`}>
      {/* Header: User info + Rating */}
      <div className={`${UI_CLASSES.FLEX_ITEMS_START_JUSTIFY_BETWEEN} mb-3`}>
        <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_3}>
          <Avatar>
            {user?.image && <AvatarImage src={user.image} alt={displayName} />}
            <AvatarFallback>{displayName[0]?.toUpperCase() || '?'}</AvatarFallback>
          </Avatar>
          <div>
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <span className={`${UI_CLASSES.TEXT_SM} font-semibold`}>{displayName}</span>
              {user?.tier && user.tier !== 'free' && (
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

        {/* Edit/Delete buttons for own reviews */}
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

      {/* Review Text */}
      {reviewText && (
        <div className="mb-3">
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
        </div>
      )}

      {/* Footer: Helpful button */}
      <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
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
      </div>
    </div>
  );
}
