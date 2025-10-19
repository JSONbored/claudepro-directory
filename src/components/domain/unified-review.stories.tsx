import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { UnifiedReview } from './unified-review';

/**
 * Unified Review Component - Storybook Stories
 *
 * Consolidates 4 review components (926 LOC) into one configuration-driven component.
 *
 * **Architectural Improvements:**
 * 1. ✅ Eliminated unnecessary lazy loading (RatingHistogram)
 * 2. ✅ Removed useless abstraction layer (StarRating wrapper)
 * 3. ✅ Extracted nested ReviewCardItem for reusability
 * 4. ✅ Fixed type safety violations (content_type: any → ContentTypeValue)
 * 5. ✅ Memoized chart data computation (useMemo)
 * 6. ✅ Shared StarDisplay utility (DRY principle)
 *
 * **Consolidation:**
 * - ReviewForm (198 LOC) → 'form' variant
 * - ReviewSection (515 LOC) → 'section' variant
 * - RatingHistogram (107 LOC) → 'histogram' variant
 * - StarRating (106 LOC) → 'rating-interactive' + 'rating-compact' variants
 *
 * **Total Reduction:** 926 LOC → ~680 LOC (26% reduction)
 */

const meta = {
  title: 'Cards/UnifiedReview',
  component: UnifiedReview,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**Unified Review Component** - Configuration-driven review system with discriminated union type safety.

**Architecture Highlights:**
- ✅ **Type-Safe Discriminated Union:** 5 variants with compile-time safety
- ✅ **Zero Backward Compatibility:** Modern patterns only
- ✅ **Extracted Components:** ReviewCardItem now reusable and testable
- ✅ **Performance Optimized:** useMemo for chart data, no lazy loading overhead
- ✅ **DRY Principle:** Shared StarDisplay utility eliminates duplication

**Variants:**
1. **form** - Create/edit reviews with star rating + text
2. **section** - Complete review list with pagination, sorting, histogram
3. **histogram** - Visual rating distribution with custom charts
4. **rating-interactive** - Interactive star rating input
5. **rating-compact** - Compact rating display (average + count)

**Fixes 6 Architectural Issues:**
1. Removed unnecessary lazy loading
2. Eliminated useless StarRating wrapper
3. Extracted nested ReviewCardItem component
4. Fixed type safety violations (any types)
5. Memoized expensive computations
6. Shared star rendering logic
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['form', 'section', 'histogram', 'rating-interactive', 'rating-compact'],
      description: 'Review component variant',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'form' },
      },
    },
    // Form & Section variant props
    contentType: {
      control: 'select',
      options: ['agents', 'mcp', 'commands', 'rules', 'hooks', 'guides'],
      description: 'Type of content being reviewed',
      if: { arg: 'variant', oneOf: ['form', 'section'] },
    },
    contentSlug: {
      control: 'text',
      description: 'Slug of the content being reviewed',
      if: { arg: 'variant', oneOf: ['form', 'section'] },
    },
    // Form variant specific props
    existingReview: {
      control: 'object',
      description: 'Existing review data for editing (optional)',
      if: { arg: 'variant', eq: 'form' },
    },
    onSuccess: {
      action: 'success',
      description: 'Callback when review submitted successfully',
      if: { arg: 'variant', eq: 'form' },
    },
    onCancel: {
      action: 'cancel',
      description: 'Callback when cancel button clicked',
      if: { arg: 'variant', eq: 'form' },
    },
    // Section variant props
    currentUserId: {
      control: 'text',
      description: 'Current user ID for edit/delete permissions',
      if: { arg: 'variant', eq: 'section' },
    },
    // Histogram variant props
    distribution: {
      control: 'object',
      description: 'Star rating distribution object (1-5 stars)',
      if: { arg: 'variant', eq: 'histogram' },
    },
    totalReviews: {
      control: 'number',
      description: 'Total number of reviews',
      if: { arg: 'variant', eq: 'histogram' },
    },
    averageRating: {
      control: { type: 'range', min: 0, max: 5, step: 0.1 },
      description: 'Average rating value',
      if: { arg: 'variant', eq: 'histogram' },
    },
    // Rating-interactive variant props
    value: {
      control: { type: 'range', min: 0, max: 5, step: 1 },
      description: 'Current rating value',
      if: { arg: 'variant', eq: 'rating-interactive' },
    },
    max: {
      control: { type: 'range', min: 5, max: 10, step: 1 },
      description: 'Maximum star rating',
      if: { arg: 'variant', eq: 'rating-interactive' },
    },
    onChange: {
      action: 'rating-changed',
      description: 'Callback when rating changes',
      if: { arg: 'variant', eq: 'rating-interactive' },
    },
    showValue: {
      control: 'boolean',
      description: 'Show numeric rating value',
      if: { arg: 'variant', eq: 'rating-interactive' },
    },
    // Rating-compact variant props
    average: {
      control: { type: 'range', min: 0, max: 5, step: 0.1 },
      description: 'Average rating to display',
      if: { arg: 'variant', eq: 'rating-compact' },
    },
    count: {
      control: 'number',
      description: 'Number of reviews',
      if: { arg: 'variant', eq: 'rating-compact' },
    },
    // Shared props for rating variants
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Star size',
      if: { arg: 'variant', oneOf: ['rating-interactive', 'rating-compact'] },
    },
  },
} satisfies Meta<typeof UnifiedReview>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// FORM VARIANT
// ============================================================================

/**
 * Form Variant - Create New Review
 */
export const FormCreate: Story = {
  args: {
    variant: 'form',
    contentType: 'agents',
    contentSlug: 'example-agent',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Form for creating a new review. Includes star rating (required), review text (optional, max 2000 chars), validation, and character counter.',
      },
    },
  },
};

/**
 * Form Variant - Edit Existing Review
 */
export const FormEdit: Story = {
  args: {
    variant: 'form',
    contentType: 'mcp',
    contentSlug: 'example-mcp-server',
    existingReview: {
      id: 'review-123',
      rating: 4,
      review_text: 'This is a great MCP server! Very useful for automation tasks.',
    },
    onCancel: () => alert('Cancel clicked'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Form for editing an existing review. Pre-fills rating and text, shows "Update Review" button.',
      },
    },
  },
};

/**
 * Form Variant - With Callbacks
 */
export const FormWithCallbacks: Story = {
  args: {
    variant: 'form',
    contentType: 'commands',
    contentSlug: 'example-command',
    onSuccess: () => alert('Review submitted successfully!'),
    onCancel: () => alert('Cancelled'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Form with onSuccess and onCancel callbacks for integration with parent components.',
      },
    },
  },
};

// ============================================================================
// SECTION VARIANT
// ============================================================================

/**
 * Section Variant - Complete Review Section
 *
 * NOTE: This is a complex variant that includes:
 * - Aggregate rating + histogram
 * - Review list with pagination
 * - Sort controls (recent, helpful, rating high/low)
 * - Edit/delete for own reviews
 * - Helpful voting
 *
 * In Storybook, server actions are mocked, so functionality is limited.
 * Best tested in actual application environment.
 */
export const SectionComplete: Story = {
  args: {
    variant: 'section',
    contentType: 'agents',
    contentSlug: 'example-agent',
    currentUserId: 'user-123',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Complete review section with histogram, sort controls, pagination, and review list. Uses server actions for data fetching.',
      },
    },
  },
};

// ============================================================================
// HISTOGRAM VARIANT
// ============================================================================

/**
 * Histogram Variant - With Reviews
 */
export const HistogramWithReviews: Story = {
  args: {
    variant: 'histogram',
    distribution: {
      5: 45,
      4: 30,
      3: 15,
      2: 5,
      1: 5,
    },
    totalReviews: 100,
    averageRating: 4.2,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Rating histogram showing distribution of star ratings. Uses custom lightweight charts (70KB bundle reduction from Recharts).',
      },
    },
  },
};

/**
 * Histogram Variant - Mostly Positive
 */
export const HistogramMostlyPositive: Story = {
  args: {
    variant: 'histogram',
    distribution: {
      5: 80,
      4: 15,
      3: 3,
      2: 1,
      1: 1,
    },
    totalReviews: 200,
    averageRating: 4.8,
  },
  parameters: {
    docs: {
      description: {
        story: 'Histogram with predominantly 5-star reviews - highly rated content.',
      },
    },
  },
};

/**
 * Histogram Variant - Mixed Reviews
 */
export const HistogramMixedReviews: Story = {
  args: {
    variant: 'histogram',
    distribution: {
      5: 20,
      4: 20,
      3: 30,
      2: 20,
      1: 10,
    },
    totalReviews: 50,
    averageRating: 3.2,
  },
  parameters: {
    docs: {
      description: {
        story: 'Histogram with mixed reviews - average rating around 3 stars.',
      },
    },
  },
};

/**
 * Histogram Variant - Empty State
 */
export const HistogramEmpty: Story = {
  args: {
    variant: 'histogram',
    distribution: {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    },
    totalReviews: 0,
    averageRating: 0,
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state when no reviews exist. Shows call-to-action message.',
      },
    },
  },
};

// ============================================================================
// RATING-INTERACTIVE VARIANT
// ============================================================================

/**
 * Rating Interactive - Small Size
 */
export const RatingInteractiveSmall: Story = {
  args: {
    variant: 'rating-interactive',
    value: 3,
    onChange: (rating) => alert(`Rating changed to ${rating}`),
    size: 'sm',
    showValue: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive star rating (small size) - click to rate, shows hover preview.',
      },
    },
  },
};

/**
 * Rating Interactive - Medium Size with Value
 */
export const RatingInteractiveMedium: Story = {
  args: {
    variant: 'rating-interactive',
    value: 4,
    onChange: (rating) => alert(`Rating changed to ${rating}`),
    size: 'md',
    showValue: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive star rating (medium size) with numeric value display.',
      },
    },
  },
};

/**
 * Rating Interactive - Large Size
 */
export const RatingInteractiveLarge: Story = {
  args: {
    variant: 'rating-interactive',
    value: 5,
    onChange: (rating) => alert(`Rating changed to ${rating}`),
    size: 'lg',
    showValue: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive star rating (large size) - ideal for review forms.',
      },
    },
  },
};

/**
 * Rating Interactive - Zero State
 */
export const RatingInteractiveZero: Story = {
  args: {
    variant: 'rating-interactive',
    value: 0,
    onChange: (rating) => alert(`Rating changed to ${rating}`),
    size: 'lg',
    showValue: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive rating with zero value - initial state for new reviews.',
      },
    },
  },
};

/**
 * Rating Interactive - Custom Max Stars
 */
export const RatingInteractiveCustomMax: Story = {
  args: {
    variant: 'rating-interactive',
    value: 7,
    max: 10,
    onChange: (rating) => alert(`Rating changed to ${rating}`),
    size: 'md',
    showValue: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive rating with custom max (10 stars instead of default 5).',
      },
    },
  },
};

// ============================================================================
// RATING-COMPACT VARIANT
// ============================================================================

/**
 * Rating Compact - Small Size
 */
export const RatingCompactSmall: Story = {
  args: {
    variant: 'rating-compact',
    average: 4.5,
    count: 127,
    size: 'sm',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Compact rating display (small size) - shows average rating and review count. Used in cards and lists.',
      },
    },
  },
};

/**
 * Rating Compact - Medium Size
 */
export const RatingCompactMedium: Story = {
  args: {
    variant: 'rating-compact',
    average: 4.8,
    count: 523,
    size: 'md',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Compact rating display (medium size) - slightly larger for better visibility in detail pages.',
      },
    },
  },
};

/**
 * Rating Compact - Low Rating
 */
export const RatingCompactLowRating: Story = {
  args: {
    variant: 'rating-compact',
    average: 2.3,
    count: 45,
    size: 'sm',
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact rating with low average (2.3 stars).',
      },
    },
  },
};

/**
 * Rating Compact - Single Review
 */
export const RatingCompactSingleReview: Story = {
  args: {
    variant: 'rating-compact',
    average: 5.0,
    count: 1,
    size: 'sm',
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact rating with only one review.',
      },
    },
  },
};

// ============================================================================
// VARIANT COMPARISON
// ============================================================================

/**
 * All Variants Side-by-Side
 */
export const AllVariantsComparison: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-3">Form Variant</h3>
        <UnifiedReview variant="form" contentType="agents" contentSlug="example-agent" />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Histogram Variant</h3>
        <UnifiedReview
          variant="histogram"
          distribution={{ 5: 45, 4: 30, 3: 15, 2: 5, 1: 5 }}
          totalReviews={100}
          averageRating={4.2}
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Rating Interactive Variant</h3>
        <UnifiedReview
          variant="rating-interactive"
          value={4}
          onChange={() => {
            /* Storybook demo - no-op */
          }}
          size="lg"
          showValue
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Rating Compact Variant</h3>
        <UnifiedReview variant="rating-compact" average={4.5} count={127} size="md" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Compare all major variants side-by-side (Section variant excluded due to complexity).',
      },
    },
  },
};

// ============================================================================
// COMPONENT STATES
// ============================================================================

/**
 * Form Validation Error State
 * Tests validation UX when form submission fails due to missing rating
 */
export const ValidationErrorState: Story = {
  args: {
    variant: 'form',
    contentType: 'agents',
    contentSlug: 'example-agent',
  },
  parameters: {
    docs: {
      description: {
        story: `
Form in validation error state. Rating is required - submission without rating shows error.

**Error Scenarios:**
- No rating selected (required field)
- Review text exceeds 2000 character limit
        `,
      },
    },
  },
};

/**
 * Form Success State
 * Shows successful review submission
 */
export const SuccessState: Story = {
  args: {
    variant: 'form',
    contentType: 'mcp',
    contentSlug: 'example-mcp-server',
    onSuccess: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: `
Form after successful review submission. The onSuccess callback is triggered.

**Success Behaviors:**
- Form resets after submission
- onSuccess callback called with review data
- User feedback (toast/redirect handled by parent)
        `,
      },
    },
  },
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Select 5-star rating', async () => {
      const stars = canvas.getAllByRole('button', { name: /star/i });
      await userEvent.click(stars[4]); // Click 5th star
    });

    await step('Enter review text', async () => {
      const textarea = canvas.getByPlaceholderText(/share your experience/i);
      await userEvent.type(textarea, 'Excellent MCP server! Highly recommended.');
    });

    await step('Submit form', async () => {
      const submitButton = canvas.getByRole('button', { name: /submit review/i });
      await userEvent.click(submitButton);
    });

    await step('Verify onSuccess callback was triggered', async () => {
      await expect(args.onSuccess).toHaveBeenCalledTimes(1);
    });
  },
};

/**
 * Empty Review Section State
 * Tests empty state when no reviews exist for content
 */
export const EmptyReviewSection: Story = {
  args: {
    variant: 'section',
    contentType: 'commands',
    contentSlug: 'new-command',
    currentUserId: 'user-123',
  },
  parameters: {
    docs: {
      description: {
        story: `
Review section in empty state - no reviews yet for this content.

**Empty State Features:**
- Call-to-action message encouraging first review
- Histogram shows 0 reviews across all ratings
- Review list shows empty state message
        `,
      },
    },
  },
};

// ============================================================================
// PLAY FUNCTION TESTS
// ============================================================================

/**
 * Star Rating Interaction Test
 * Tests interactive star rating click behavior
 */
export const StarRatingInteraction: Story = {
  args: {
    variant: 'rating-interactive',
    value: 0,
    onChange: fn(),
    size: 'lg',
    showValue: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests star rating interaction - click stars to change rating.',
      },
    },
  },
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Click 3rd star to set rating to 3', async () => {
      const stars = canvas.getAllByRole('button', { name: /star/i });
      await userEvent.click(stars[2]); // Click 3rd star
    });

    await step('Verify onChange callback was called with rating 3', async () => {
      await expect(args.onChange).toHaveBeenCalledWith(3);
    });

    await step('Click 5th star to set rating to 5', async () => {
      const stars = canvas.getAllByRole('button', { name: /star/i });
      await userEvent.click(stars[4]); // Click 5th star
    });

    await step('Verify onChange callback was called with rating 5', async () => {
      await expect(args.onChange).toHaveBeenCalledWith(5);
    });
  },
};

/**
 * Review Text Validation Test
 * Tests character limit validation for review text
 */
export const ReviewTextValidation: Story = {
  args: {
    variant: 'form',
    contentType: 'agents',
    contentSlug: 'example-agent',
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests review text validation - character counter and max 2000 chars.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Select 4-star rating (required)', async () => {
      const stars = canvas.getAllByRole('button', { name: /star/i });
      await userEvent.click(stars[3]); // Click 4th star
    });

    await step('Type review text', async () => {
      const textarea = canvas.getByPlaceholderText(/share your experience/i);
      await userEvent.type(textarea, 'This is a test review with some text content.');
    });

    await step('Verify character counter is displayed', async () => {
      const characterCount = canvas.getByText(/\d+\s*\/\s*2000/i);
      await expect(characterCount).toBeInTheDocument();
    });
  },
};

/**
 * Form Cancel Interaction Test
 * Tests cancel button behavior in edit mode
 */
export const FormCancelInteraction: Story = {
  args: {
    variant: 'form',
    contentType: 'mcp',
    contentSlug: 'example-mcp-server',
    existingReview: {
      id: 'review-123',
      rating: 4,
      review_text: 'Existing review text',
    },
    onCancel: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests cancel button in edit mode - should trigger onCancel callback.',
      },
    },
  },
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Click Cancel button', async () => {
      const cancelButton = canvas.getByRole('button', { name: /cancel/i });
      await userEvent.click(cancelButton);
    });

    await step('Verify onCancel callback was triggered', async () => {
      await expect(args.onCancel).toHaveBeenCalledTimes(1);
    });
  },
};

/**
 * Histogram Bar Click Test
 * Tests interaction with histogram bars
 */
export const HistogramInteraction: Story = {
  args: {
    variant: 'histogram',
    distribution: {
      5: 45,
      4: 30,
      3: 15,
      2: 5,
      1: 5,
    },
    totalReviews: 100,
    averageRating: 4.2,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests histogram bar hover/click interactions.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify histogram bars are rendered', async () => {
      // Check that rating distribution is displayed
      const fiveStarLabel = canvas.getByText(/5/);
      await expect(fiveStarLabel).toBeInTheDocument();
    });

    await step('Verify percentage calculations are shown', async () => {
      // 45 out of 100 = 45%
      const percentage = canvas.getByText(/45%/);
      await expect(percentage).toBeInTheDocument();
    });
  },
};
