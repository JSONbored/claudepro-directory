'use client';

import { createReview, updateReview } from '@heyclaude/web-runtime/actions';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks';
import {
  MAX_REVIEW_LENGTH,
  type ReviewFormProps,
} from '@heyclaude/web-runtime/types/component.types';
import { toasts, UI_CLASSES, Button, Label, Textarea } from '@heyclaude/web-runtime/ui';
import { useRouter } from 'next/navigation';
import { useId, useState, useTransition } from 'react';

import { ReviewRatingInteractive } from '@/src/components/core/domain/reviews/review-rating-interactive';

/**
 * Renders a form for creating a new review or editing an existing review.
 *
 * The form manages rating and review text state, validates input, and calls the
 * appropriate API action (create or update). On success it refreshes the router
 * and invokes `onSuccess` if provided. On failure it displays contextual toasts.
 *
 * @param contentType - The content type identifier for the reviewed item
 * @param contentSlug - The slug identifying the reviewed item
 * @param existingReview - Optional existing review to edit; when provided the form initializes in edit mode
 * @param onSuccess - Optional callback invoked after a successful create or update
 * @param onCancel - Optional callback invoked when the user cancels the action
 *
 * @see ReviewRatingInteractive
 * @see createReview
 * @see updateReview
 * @see useLoggedAsync
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
  const runLoggedAsync = useLoggedAsync({
    scope: 'ReviewForm',
    defaultMessage: 'Review submission failed',
    defaultRethrow: false,
  });

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
        await runLoggedAsync(
          async () => {
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
              } else {
                throw new Error('Review update returned success: false');
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
              } else {
                throw new Error('Review creation returned success: false');
              }
            }
          },
          {
            message: isEditing ? 'Review update failed' : 'Review creation failed',
            context: {
              contentType,
              contentSlug,
              isEditing,
            },
          }
        );
      } catch (error) {
        // Error already logged by useLoggedAsync
        if (error instanceof Error && error.message.includes('signed in')) {
          toasts.raw.error('Please sign in to write a review', {
            action: {
              label: 'Sign In',
              onClick: () => router.push(`/login?redirect=${globalThis.location.pathname}`),
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
        <div className="mt-2">
          <ReviewRatingInteractive
            value={rating}
            onChange={setRating}
            size="md"
            showValue
            {...(showRatingError ? { 'aria-describedby': ratingErrorId } : {})}
            {...(showRatingError ? { 'aria-invalid': 'true' as const } : {})}
          />
        </div>
        {rating === 0 && !showRatingError && (
          <p className="text-muted-foreground mt-1 text-xs">Click a star to rate</p>
        )}
        {showRatingError ? (
          <p id={ratingErrorId} className="text-destructive mt-1 text-sm" role="alert">
            Please select a star rating before submitting
          </p>
        ) : null}
      </div>

      {/* Review Text */}
      <div>
        <Label htmlFor={textareaId} className="mb-2 block">
          Your Review <span className="text-muted-foreground text-xs font-normal">(optional)</span>
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
        {hasTextError ? (
          <p id={textareaErrorId} className="text-destructive mt-1 text-sm" role="alert">
            Review text cannot exceed {MAX_REVIEW_LENGTH} characters
          </p>
        ) : null}
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
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}