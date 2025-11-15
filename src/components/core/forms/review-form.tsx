'use client';

import { useRouter } from 'next/navigation';
import { useId, useState, useTransition } from 'react';
import {
  MAX_REVIEW_LENGTH,
  type ReviewFormProps,
} from '@/src/components/core/domain/reviews/shared/review-types';
import { Rating, RatingButton } from '@/src/components/primitives/feedback/rating';
import { Button } from '@/src/components/primitives/ui/button';
import { Label } from '@/src/components/primitives/ui/label';
import { Textarea } from '@/src/components/primitives/ui/textarea';
import { createReview, updateReview } from '@/src/lib/actions/content.actions';
import { Star } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { logClientWarning } from '@/src/lib/utils/error.utils';
import { toasts } from '@/src/lib/utils/toast.utils';

/**
 * Form for creating and editing reviews
 * Extracted from unified review component for better tree-shaking
 */
export function ReviewForm({
  contentType,
  contentSlug,
  existingReview,
  onSuccess,
  onCancel,
}: Omit<ReviewFormProps, 'variant'>) {
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
        logClientWarning('ReviewForm: submit failed', error, {
          contentType,
          contentSlug,
          isEditing,
        });
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
