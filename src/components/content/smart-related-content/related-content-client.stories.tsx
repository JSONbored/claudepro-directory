import type { Meta, StoryObj } from '@storybook/react';
import { RelatedContentClient } from './related-content-client';

/**
 * RelatedContentClient Component Stories
 *
 * Modern client-side related content component with AI-powered recommendations.
 * Uses UnifiedCardGrid and BaseCard for consistent, accessible UI.
 *
 * Architecture:
 * - Client component (browser-compatible)
 * - Async data fetching with useEffect
 * - Mock service in Storybook (real service in production)
 * - Dynamic analytics imports for Storybook compatibility
 * - Loading states, error handling, empty states
 *
 * Component: src/components/content/smart-related-content/related-content-client.tsx (267 LOC)
 * Usage: 21 MDX files across codebase
 * Service Mock: src/lib/related-content/service.mock.ts
 *
 * Storybook Note:
 * Stories use mock relatedContentService configured via package.json imports.
 * Service automatically switches to mock in Storybook environment.
 *
 * Mock Data Control:
 * Use `exclude` prop with special flags to control mock data:
 * - exclude: ['__EMPTY__'] - Empty results
 * - exclude: ['__SINGLE__'] - Single item
 * - exclude: ['__TRENDING__'] - Trending items
 * - exclude: ['__TAG_MATCH__'] - Tag-matched items
 * - exclude: ['__SAME_CATEGORY__'] - Same category items
 * - exclude: ['__LONG_DESC__'] - Long descriptions
 */
const meta = {
  title: 'Content/RelatedContentClient',
  component: RelatedContentClient,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'AI-powered related content recommendations with UnifiedCardGrid. Fetches data on mount, handles loading/error/empty states.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    pathname: {
      control: 'text',
      description: 'Current page path (used for context)',
    },
    limit: {
      control: { type: 'number', min: 1, max: 20 },
      description: 'Maximum number of items to show',
    },
    title: {
      control: 'text',
      description: 'Section title',
    },
    showTitle: {
      control: 'boolean',
      description: 'Show/hide title section',
    },
    trackingEnabled: {
      control: 'boolean',
      description: 'Enable analytics tracking',
    },
    featured: {
      control: 'object',
      description: 'Slug array for featured items (prioritized)',
    },
    exclude: {
      control: 'object',
      description: 'Slug array for excluded items (or mock control flags)',
    },
    currentTags: {
      control: 'object',
      description: 'Tags from current content (for matching)',
    },
    currentKeywords: {
      control: 'object',
      description: 'Keywords from current content (for matching)',
    },
  },
} satisfies Meta<typeof RelatedContentClient>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default: 3 Related Items
 *
 * Standard use case with 3 related items (default limit).
 * Shows mix of same_category, tag_match, and keyword_match types.
 *
 * Usage in MDX:
 * ```mdx
 * <RelatedContentClient
 *   pathname="/agents/code-reviewer"
 *   currentTags={['typescript', 'code-review']}
 * />
 * ```
 */
export const Default: Story = {
  args: {
    pathname: '/agents/code-reviewer',
    currentTags: ['typescript', 'code-review'],
    limit: 3,
  },
};

/**
 * Loading State
 *
 * Shows loading skeleton while fetching data.
 * UnifiedCardGrid displays "Finding related content..." message.
 *
 * Note: Mock service has 300ms delay to demonstrate loading state.
 * Refresh story to see loading animation.
 */
export const LoadingState: Story = {
  args: {
    pathname: '/guides/getting-started',
    currentTags: ['tutorial'],
    limit: 3,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates loading state during initial fetch. Refresh to see animation (300ms mock delay).',
      },
    },
  },
};

/**
 * Same Category Matches
 *
 * All related items from the same category.
 * Shows "Related" badge on all items.
 *
 * Useful when you want to show similar content types.
 *
 * Usage in MDX:
 * ```mdx
 * <RelatedContentClient
 *   pathname="/agents/code-reviewer"
 *   exclude={['__SAME_CATEGORY__']}
 * />
 * ```
 */
export const SameCategoryMatches: Story = {
  args: {
    pathname: '/agents/code-reviewer',
    currentTags: ['typescript'],
    exclude: ['__SAME_CATEGORY__'], // Mock control flag
    limit: 3,
  },
};

/**
 * Tag Matches
 *
 * Items matched by shared tags.
 * Shows "Similar Topics" badge.
 *
 * Demonstrates cross-category recommendations based on tags.
 *
 * Usage in MDX:
 * ```mdx
 * <RelatedContentClient
 *   currentTags={['react', 'best-practices']}
 *   exclude={['__TAG_MATCH__']}
 * />
 * ```
 */
export const TagMatches: Story = {
  args: {
    pathname: '/guides/react-patterns',
    currentTags: ['react', 'best-practices'],
    exclude: ['__TAG_MATCH__'], // Mock control flag
    limit: 2,
  },
};

/**
 * Trending Content
 *
 * Popular/trending items with high engagement.
 * Shows "Trending" badge and featured flag.
 *
 * Perfect for homepage or high-traffic pages.
 *
 * Usage in MDX:
 * ```mdx
 * <RelatedContentClient
 *   title="Trending Now"
 *   exclude={['__TRENDING__']}
 *   limit={3}
 * />
 * ```
 */
export const TrendingContent: Story = {
  args: {
    pathname: '/',
    title: 'Trending Now',
    exclude: ['__TRENDING__'], // Mock control flag
    limit: 3,
  },
};

/**
 * Empty State
 *
 * No related content available.
 * Shows "No related content available" message.
 *
 * Handles edge case gracefully with empty results.
 *
 * Usage in MDX:
 * ```mdx
 * <RelatedContentClient
 *   pathname="/rare-topic"
 *   exclude={['__EMPTY__']}
 * />
 * ```
 */
export const EmptyState: Story = {
  args: {
    pathname: '/rare-topic',
    exclude: ['__EMPTY__'], // Mock control flag
  },
};

/**
 * Single Item
 *
 * Edge case: Only one related item found.
 * UnifiedCardGrid adapts layout for single card.
 *
 * Usage in MDX:
 * ```mdx
 * <RelatedContentClient
 *   exclude={['__SINGLE__']}
 *   limit={1}
 * />
 * ```
 */
export const SingleItem: Story = {
  args: {
    pathname: '/niche-topic',
    exclude: ['__SINGLE__'], // Mock control flag
    limit: 1,
  },
};

/**
 * Custom Title
 *
 * Demonstrates custom title text.
 * Title appears in prominent header with Sparkles icon.
 *
 * Usage in MDX:
 * ```mdx
 * <RelatedContentClient
 *   title="Recommended for You"
 *   currentTags={['advanced']}
 * />
 * ```
 */
export const CustomTitle: Story = {
  args: {
    pathname: '/guides/advanced-patterns',
    title: 'Recommended for You',
    currentTags: ['advanced'],
    limit: 3,
  },
};

/**
 * No Title (showTitle=false)
 *
 * Hides title section completely.
 * Shows only card grid without header.
 *
 * Useful for embedded contexts or sidebars.
 *
 * Usage in MDX:
 * ```mdx
 * <RelatedContentClient
 *   showTitle={false}
 *   limit={3}
 * />
 * ```
 */
export const NoTitle: Story = {
  args: {
    pathname: '/guides/quick-tip',
    showTitle: false,
    limit: 3,
  },
};

/**
 * Long Descriptions
 *
 * Tests layout with very long item descriptions.
 * Validates text wrapping and card height consistency.
 *
 * Usage in MDX:
 * ```mdx
 * <RelatedContentClient
 *   exclude={['__LONG_DESC__']}
 * />
 * ```
 */
export const LongDescriptions: Story = {
  args: {
    pathname: '/guides/comprehensive',
    exclude: ['__LONG_DESC__'], // Mock control flag
    limit: 2,
  },
};

/**
 * With Featured Items
 *
 * Prioritizes specific items using featured prop.
 * Featured items appear first in results.
 *
 * Usage in MDX:
 * ```mdx
 * <RelatedContentClient
 *   featured={['typescript-analyzer', 'git-helper']}
 *   limit={3}
 * />
 * ```
 */
export const WithFeaturedItems: Story = {
  args: {
    pathname: '/guides/getting-started',
    featured: ['typescript-analyzer', 'git-helper'],
    currentTags: ['tutorial'],
    limit: 3,
  },
};

/**
 * With Excluded Items
 *
 * Excludes specific slugs from results.
 * Useful to avoid showing current item or duplicates.
 *
 * Note: Don't confuse with mock control flags (which start with __)
 *
 * Usage in MDX:
 * ```mdx
 * <RelatedContentClient
 *   exclude={['current-item-slug', 'already-shown-item']}
 * />
 * ```
 */
export const WithExcludedItems: Story = {
  args: {
    pathname: '/agents/code-reviewer',
    exclude: ['code-reviewer'], // Exclude current item
    currentTags: ['typescript'],
    limit: 3,
  },
};

/**
 * Large Limit (6 Items)
 *
 * Shows more items in responsive grid.
 * UnifiedCardGrid adapts to show 2-3 columns.
 *
 * Usage in MDX:
 * ```mdx
 * <RelatedContentClient
 *   limit={6}
 *   currentTags={['popular']}
 * />
 * ```
 */
export const LargeLimit: Story = {
  args: {
    pathname: '/guides/popular-topic',
    currentTags: ['popular'],
    limit: 6,
  },
};

/**
 * With Tags and Keywords
 *
 * Demonstrates matching with both tags and keywords.
 * Service uses both for relevance scoring.
 *
 * Usage in MDX:
 * ```mdx
 * <RelatedContentClient
 *   currentTags={['react', 'typescript']}
 *   currentKeywords={['hooks', 'components', 'state']}
 * />
 * ```
 */
export const WithTagsAndKeywords: Story = {
  args: {
    pathname: '/guides/react-typescript',
    currentTags: ['react', 'typescript'],
    currentKeywords: ['hooks', 'components', 'state'],
    limit: 3,
  },
};

/**
 * Tracking Disabled
 *
 * Disables analytics tracking for clicks and views.
 * Useful for preview pages or non-production environments.
 *
 * Usage in MDX:
 * ```mdx
 * <RelatedContentClient
 *   trackingEnabled={false}
 * />
 * ```
 */
export const TrackingDisabled: Story = {
  args: {
    pathname: '/preview/test-page',
    trackingEnabled: false,
    limit: 3,
  },
};

/**
 * Cache Hit Indicator
 *
 * Shows performance badge with cache hit status.
 * Mock service always returns cacheHit: true.
 *
 * In production, cache hit improves performance significantly.
 */
export const CacheHitIndicator: Story = {
  args: {
    pathname: '/popular-page',
    currentTags: ['cached'],
    limit: 3,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Mock service always returns cacheHit: true. In production, this indicates fast cached response.',
      },
    },
  },
};

/**
 * Minimal Example
 *
 * Simplest possible configuration.
 * Only pathname required, all other props use defaults.
 *
 * Usage in MDX:
 * ```mdx
 * <RelatedContentClient pathname="/guides/intro" />
 * ```
 */
export const Minimal: Story = {
  args: {
    pathname: '/guides/intro',
  },
};

/**
 * Interactive Demo
 *
 * Full-featured example with all customization options.
 * Demonstrates real-world usage with multiple props.
 *
 * Try clicking cards to see navigation behavior.
 */
export const InteractiveDemo: Story = {
  args: {
    pathname: '/agents/typescript-analyzer',
    title: 'You Might Also Like',
    showTitle: true,
    currentTags: ['typescript', 'code-analysis', 'productivity'],
    currentKeywords: ['ast', 'linting', 'refactoring'],
    limit: 3,
    trackingEnabled: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Full-featured example demonstrating all props. Click cards to test navigation (opens in new tab in Storybook).',
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
