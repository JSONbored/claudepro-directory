import type { Meta, StoryObj } from '@storybook/react';
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

/**
 * MobileSmall: Small Mobile Viewport (320px)
 * Tests component on smallest modern mobile devices
 */
export const MobileSmall: Story = {
  globals: {
    viewport: { value: 'mobile1' },
  },
};

/**
 * MobileLarge: Large Mobile Viewport (414px)
 * Tests component on larger modern mobile devices
 */
export const MobileLarge: Story = {
  globals: {
    viewport: { value: 'mobile2' },
  },
};

/**
 * Tablet: Tablet Viewport (834px)
 * Tests component on tablet devices
 */
export const Tablet: Story = {
  globals: {
    viewport: { value: 'tablet' },
  },
};

/**
 * DarkTheme: Dark Mode Theme
 * Tests component appearance in dark mode
 */
export const DarkTheme: Story = {
  globals: {
    theme: 'dark',
  },
};

/**
 * LightTheme: Light Mode Theme
 * Tests component appearance in light mode
 */
export const LightTheme: Story = {
  globals: {
    theme: 'light',
  },
};
