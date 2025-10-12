'use client';

/**
 * Review Form Component
 * Form for creating/editing reviews with star rating and text
 *
 * Production Features:
 * - Type-safe with Zod validation
 * - Rate limiting via server actions
 * - Optimistic UI updates
 * - Accessible form controls
 * - Character count for review text
 * - Error handling with toast notifications
 */

import { useRouter } from 'next/navigation';
import { useId, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { StarRating } from '@/src/components/features/reviews/star-rating';
import { Button } from '@/src/components/ui/button';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { createReview, updateReview } from '@/src/lib/actions/content.actions';
import { UI_CLASSES } from '@/src/lib/ui-constants';

interface ReviewFormProps {
  contentType: string;
  contentSlug: string;
  existingReview?:
    | {
        id: string;
        rating: number;
        review_text: string | null;
      }
    | undefined;
  onSuccess?: (() => void) | undefined;
  onCancel?: (() => void) | undefined;
}

const MAX_REVIEW_LENGTH = 2000;

export function ReviewForm({
  contentType,
  contentSlug,
  existingReview,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
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
  const isValid = rating > 0; // At minimum, must have a rating
  const hasTextError = reviewText.length > MAX_REVIEW_LENGTH;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      setShowRatingError(true);
      toast.error('Please select a star rating');
      return;
    }

    setShowRatingError(false);

    startTransition(async () => {
      try {
        if (isEditing) {
          // Update existing review
          const result = await updateReview({
            review_id: existingReview.id,
            rating,
            review_text: reviewText.trim() || undefined,
          });

          if (result?.data?.success) {
            toast.success('Review updated successfully');
            router.refresh();
            onSuccess?.();
          }
        } else {
          // Create new review
          const result = await createReview({
            // biome-ignore lint/suspicious/noExplicitAny: validated by server action
            content_type: contentType as any,
            content_slug: contentSlug,
            rating,
            review_text: reviewText.trim() || undefined,
          });

          if (result?.data?.success) {
            toast.success('Review submitted successfully');
            setRating(0);
            setReviewText('');
            router.refresh();
            onSuccess?.();
          }
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('signed in')) {
          toast.error('Please sign in to write a review', {
            action: {
              label: 'Sign In',
              onClick: () => router.push(`/login?redirect=${window.location.pathname}`),
            },
          });
        } else if (error instanceof Error && error.message.includes('already reviewed')) {
          toast.error('You have already reviewed this content');
        } else {
          toast.error(error instanceof Error ? error.message : 'Failed to submit review');
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
        <StarRating
          value={rating}
          interactive
          onChange={setRating}
          size="lg"
          showValue
          className="mt-2"
          aria-describedby={showRatingError ? ratingErrorId : undefined}
          aria-invalid={showRatingError ? 'true' : undefined}
        />
        {rating === 0 && !showRatingError && (
          <p className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} mt-1`}>
            Click a star to rate
          </p>
        )}
        {showRatingError && (
          <p
            id={ratingErrorId}
            className={`${UI_CLASSES.TEXT_SM} text-destructive mt-1`}
            role="alert"
          >
            Please select a star rating before submitting
          </p>
        )}
      </div>

      {/* Review Text (Optional) */}
      <div>
        <Label htmlFor={textareaId} className="mb-2 block">
          Your Review{' '}
          <span className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} font-normal`}>
            (optional)
          </span>
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
          <p
            id={textareaErrorId}
            className={`${UI_CLASSES.TEXT_SM} text-destructive mt-1`}
            role="alert"
          >
            Review text cannot exceed {MAX_REVIEW_LENGTH} characters
          </p>
        )}
        <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} mt-1`}>
          <p className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
            Help others by sharing details about your experience
          </p>
          <p
            className={`${UI_CLASSES.TEXT_XS} ${charactersRemaining < 100 ? 'text-destructive' : UI_CLASSES.TEXT_MUTED_FOREGROUND}`}
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
