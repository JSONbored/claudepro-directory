'use client';

import { createReview, updateReview } from '@heyclaude/web-runtime/actions';
import { between, cluster, spaceY, marginBottom, marginTop, helper, muted ,size, paddingTop, display, textColor, weight } from '@heyclaude/web-runtime/design-system';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks';
import {
  MAX_REVIEW_LENGTH,
  type ReviewFormProps,
} from '@heyclaude/web-runtime/types/component.types';
import { toasts } from '@heyclaude/web-runtime/ui';
import { useRouter } from 'next/navigation';
import { useId, useState, useTransition } from 'react';
import { ReviewRatingInteractive } from '@/src/components/core/domain/reviews/review-rating-interactive';
import { Button } from '@heyclaude/web-runtime/ui';
import { Label } from '@heyclaude/web-runtime/ui';
import { Textarea } from '@heyclaude/web-runtime/ui';

/**
 * Render a form for creating or editing a review for a content item.
 *
 * Displays a star rating control, an optional text review textarea with live character count and validation
 * against MAX_REVIEW_LENGTH, and action buttons to submit or cancel. When submitted, the form will call
 * createReview or updateReview, show contextual toasts, refresh the router, and invoke the optional
 * onSuccess callback.
 *
 * @param contentType - The content type identifier for the item being reviewed (used when creating a review)
 * @param contentSlug - The slug/identifier for the content item being reviewed (used when creating a review)
 * @param existingReview - Optional existing review object; when provided the form is initialized for editing
 * @param onSuccess - Optional callback invoked after a successful create or update operation
 * @param onCancel - Optional callback invoked when the user cancels the form (shown only when provided)
 * @returns The rendered review form element
 *
 * @see ReviewRatingInteractive
 * @see createReview
 * @see updateReview
 * @see MAX_REVIEW_LENGTH
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
    <form onSubmit={handleSubmit} className={spaceY.comfortable}>
      {/* Star Rating Input */}
      <div>
        <Label htmlFor="rating" className={`${marginBottom.tight} ${display.block}`}>
          Your Rating <span className={textColor.destructive}>*</span>
        </Label>
        <div className={marginTop.compact}>
          <ReviewRatingInteractive
            value={rating}
            onChange={setRating}
            size="md"
            showValue={true}
            {...(showRatingError ? { 'aria-describedby': ratingErrorId } : {})}
            {...(showRatingError ? { 'aria-invalid': 'true' as const } : {})}
          />
        </div>
        {rating === 0 && !showRatingError && (
          <p className={`${marginTop.tight} ${muted.default} ${size.xs}`}>Click a star to rate</p>
        )}
        {showRatingError && (
          <p id={ratingErrorId} className={`${marginTop.tight} ${helper.destructive}`} role="alert">
            Please select a star rating before submitting
          </p>
        )}
      </div>

      {/* Review Text */}
      <div>
        <Label htmlFor={textareaId} className={`${marginBottom.tight} ${display.block}`}>
          Your Review <span className={`${weight.normal} ${muted.default} ${size.xs}`}>(optional)</span>
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
          <p id={textareaErrorId} className={`${marginTop.tight} ${helper.destructive}`} role="alert">
            Review text cannot exceed {MAX_REVIEW_LENGTH} characters
          </p>
        )}
        <div className={`${between.center} ${marginTop.tight}`}>
          <p className={`${muted.default} ${size.xs}`}>
            Help others by sharing details about your experience
          </p>
          <p
            className={`${size.xs} ${charactersRemaining < 100 ? textColor.destructive : muted.default}`}
          >
            {charactersRemaining} characters remaining
          </p>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className={`${cluster.compact} ${paddingTop.compact}`}>
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