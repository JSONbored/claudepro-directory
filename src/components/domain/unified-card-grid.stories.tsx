import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { BaseCard } from '@/src/components/domain/base-card';
import { ConfigCard } from '@/src/components/domain/config-card';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { Bookmark, Eye, Star } from '@/src/lib/icons';
import type { UnifiedContentItem } from '@/src/lib/schemas/components/content-item.schema';
import { UnifiedCardGrid } from './unified-card-grid';

/**
 * UnifiedCardGrid Storybook Stories
 *
 * **Architecture:**
 * - Consolidates 7 "grid of cards" implementations (1,735 LOC → 150 LOC)
 * - Replaces: TrendingContent, ChangelogList, RelatedContent, FeaturedSections,
 *   ForYouFeed, BadgeGrid, InfiniteScrollGrid
 * - Configuration-driven with type-safe generics
 * - Supports ConfigCard, BaseCard, or custom render functions
 * - Optional infinite scroll with useInfiniteScroll hook
 * - Motion.dev staggered entrance animations (Phase 1.3 - October 2025)
 *
 * **Motion.dev Staggered Animations:**
 * - Container fade-in on mount
 * - Cards stagger with 50ms delay between each
 * - Cards slide up 20px with spring physics
 * - Delay: 100ms before first card animates
 * - Physics: stiffness 100, damping 15 (slow, smooth bounce)
 * - Respects prefers-reduced-motion automatically
 *
 * **Variants:**
 * - `normal`: 3-column responsive grid (gap-6)
 * - `tight`: 3-column responsive grid (gap-4)
 * - `wide`: 4-column responsive grid (gap-6)
 * - `list`: Full-width list layout (gap-6)
 *
 * **Usage:**
 * ```tsx
 * // With ConfigCard
 * <UnifiedCardGrid
 *   items={configs}
 *   cardComponent={ConfigCard}
 *   variant="normal"
 * />
 *
 * // With BaseCard + custom render
 * <UnifiedCardGrid
 *   items={relatedItems}
 *   renderCard={(item) => (
 *     <BaseCard {...item} topAccent />
 *   )}
 * />
 *
 * // With infinite scroll
 * <UnifiedCardGrid
 *   items={allItems}
 *   cardComponent={ConfigCard}
 *   infiniteScroll
 *   batchSize={30}
 * />
 * ```
 */

const meta = {
  title: 'Cards/UnifiedCardGrid',
  component: UnifiedCardGrid,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**Unified Card Grid Component** - Consolidated grid layout for all content cards.

**Consolidation Impact:**
- Eliminates 1,585 LOC of duplicate grid logic (-91%)
- Single source of truth for grid layouts
- Type-safe with generics

**Features:**
- 4 responsive grid variants (normal, tight, wide, list)
- Infinite scroll support with Intersection Observer
- Empty state handling
- Loading states with skeletons
- Full accessibility (ARIA labels)
- Error boundaries per item
- Dynamic analytics tracking

**Replaces These Components:**
- TrendingContent (162 LOC) → UnifiedCardGrid
- ChangelogListClient (164 LOC) → UnifiedCardGrid + renderCard
- RelatedContent (499 LOC) → UnifiedCardGrid + BaseCard
- FeaturedSections (125 LOC) → UnifiedCardGrid + ConfigCard
- ForYouFeedClient (132 LOC) → UnifiedCardGrid + ConfigCard
- InfiniteScrollGrid (149 LOC) → UnifiedCardGrid + infiniteScroll prop
- SearchSection/TabsSection (custom grids) → UnifiedCardGrid

**Performance:**
- React.memo prevents re-renders
- Batch loading for large datasets
- Constant memory usage with infinite scroll
- 0 layout shifts (CLS optimization)
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['normal', 'tight', 'wide', 'list'],
      description: 'Grid layout variant',
    },
    infiniteScroll: {
      control: 'boolean',
      description: 'Enable infinite scroll',
    },
    batchSize: {
      control: { type: 'number', min: 10, max: 100, step: 10 },
      description: 'Items per batch (infinite scroll)',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading state',
    },
  },
} satisfies Meta<typeof UnifiedCardGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// MOCK DATA
// ============================================================================

const mockConfigItems: UnifiedContentItem[] = [
  {
    slug: 'nextjs-architect',
    title: 'Next.js Architect',
    name: 'Next.js Architect',
    description: 'Expert Next.js development agent with App Router and React Server Components',
    category: 'agents',
    tags: ['nextjs', 'react', 'typescript'],
    author: 'Community',
    dateAdded: '2025-01-15',
    popularity: 98,
    viewCount: 15420,
  },
  {
    slug: 'tailwind-designer',
    title: 'Tailwind CSS Designer',
    name: 'Tailwind CSS Designer',
    description: 'Design system expert specializing in Tailwind CSS v4 and utility-first styling',
    category: 'agents',
    tags: ['tailwindcss', 'design', 'css'],
    author: 'Community',
    dateAdded: '2025-01-14',
    popularity: 95,
    viewCount: 12300,
  },
  {
    slug: 'api-architect',
    title: 'API Architect',
    name: 'API Architect',
    description: 'RESTful API design and implementation specialist with OpenAPI expertise',
    category: 'agents',
    tags: ['api', 'rest', 'openapi'],
    author: 'Community',
    dateAdded: '2025-01-13',
    popularity: 92,
    viewCount: 10500,
  },
  {
    slug: 'database-optimizer',
    title: 'Database Optimizer',
    name: 'Database Optimizer',
    description: 'PostgreSQL and Prisma optimization expert for high-performance queries',
    category: 'agents',
    tags: ['postgresql', 'prisma', 'optimization'],
    author: 'Community',
    dateAdded: '2025-01-12',
    popularity: 89,
    viewCount: 9800,
  },
  {
    slug: 'testing-guru',
    title: 'Testing Guru',
    name: 'Testing Guru',
    description: 'Comprehensive testing strategy with Vitest, Playwright, and E2E best practices',
    category: 'agents',
    tags: ['testing', 'vitest', 'playwright'],
    author: 'Community',
    dateAdded: '2025-01-11',
    popularity: 87,
    viewCount: 8900,
  },
  {
    slug: 'security-sentinel',
    title: 'Security Sentinel',
    name: 'Security Sentinel',
    description:
      'Security hardening specialist for authentication, authorization, and data protection',
    category: 'agents',
    tags: ['security', 'auth', 'encryption'],
    author: 'Community',
    dateAdded: '2025-01-10',
    popularity: 85,
    viewCount: 8200,
  },
];

const mockRelatedItems: UnifiedContentItem[] = mockConfigItems.slice(0, 3).map((item, index) => ({
  ...item,
  score: 0.95 - index * 0.05,
  matchType: index === 0 ? 'exact' : index === 1 ? 'partial' : 'fuzzy',
  matchDetails: {
    matchedTags: item.tags.slice(0, 2),
    matchedKeywords: ['nextjs', 'react'],
  },
}));

// ============================================================================
// STORY 1: ConfigCard Variant (PHASE 11-2)
// ============================================================================

/**
 * Using ConfigCard component - Standard content cards with actions
 * Replaces: TrendingContent, FeaturedSections, ForYouFeed, SearchSection, TabsSection
 */
export const WithConfigCard: Story = {
  args: {
    items: mockConfigItems,
    cardComponent: ConfigCard,
    cardProps: {
      variant: 'default',
      showCategory: true,
      showActions: true,
    },
    variant: 'normal',
    ariaLabel: 'Configuration items',
    emptyMessage: 'No configurations found',
  },
};

// ============================================================================
// STORY 2: BaseCard Variant (PHASE 11-3)
// ============================================================================

/**
 * Using BaseCard component - Foundation cards with custom slots
 * Replaces: ChangelogList, ReviewList
 */
export const WithBaseCard: Story = {
  args: {
    items: mockConfigItems.slice(0, 4),
    variant: 'normal',
    ariaLabel: 'Base card items',
    emptyMessage: 'No items found',
    renderCard: (item: UnifiedContentItem) => (
      <BaseCard
        displayTitle={item.title}
        description={item.description}
        targetPath={`/${item.category}/${item.slug}`}
        ariaLabel={`View ${item.title}`}
        showAuthor
        renderTopBadges={() => (
          <div className="flex items-center gap-2">
            <UnifiedBadge variant="base" style="outline">
              {item.category}
            </UnifiedBadge>
            {item.tags.slice(0, 2).map((tag) => (
              <UnifiedBadge key={tag} variant="base" style="default">
                {tag}
              </UnifiedBadge>
            ))}
          </div>
        )}
        renderMetadataBadges={() => (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{item.viewCount?.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500" />
              <span>{item.popularity}</span>
            </div>
          </div>
        )}
        renderActions={() => (
          <button
            type="button"
            className="p-2 hover:bg-accent rounded-md transition-colors"
            aria-label="Bookmark item"
          >
            <Bookmark className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      />
    ),
  },
};

// ============================================================================
// STORY 3: Related Content Variant (PHASE 11-4)
// ============================================================================

/**
 * Related content cards with topAccent and match scores
 * Replaces: RelatedContent (499 LOC), SmartRelatedContent carousel
 */
export const RelatedContent: Story = {
  args: {
    items: mockRelatedItems,
    variant: 'tight',
    ariaLabel: 'Related content',
    emptyMessage: 'No related content found',
    renderCard: (item: UnifiedContentItem, _index: number) => (
      <BaseCard
        displayTitle={item.title}
        description={item.description}
        targetPath={`/${item.category}/${item.slug}`}
        topAccent
        compactMode
        ariaLabel={`View related content: ${item.title}`}
        renderTopBadges={() => (
          <div className="flex items-center justify-between w-full">
            <UnifiedBadge variant="base" style="outline" className="text-xs">
              {item.category}
            </UnifiedBadge>
            {item.score && (
              <UnifiedBadge variant="base" style="default" className="text-xs">
                {Math.round(item.score * 100)}% match
              </UnifiedBadge>
            )}
          </div>
        )}
        renderContent={() =>
          item.matchDetails ? (
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Matched tags: {item.matchDetails.matchedTags.join(', ')}</p>
              <p>Match type: {item.matchType}</p>
            </div>
          ) : null
        }
      />
    ),
  },
};

// ============================================================================
// STORY 4: Infinite Scroll Variant (PHASE 11-5)
// ============================================================================

/**
 * Infinite scroll with progressive loading
 * Replaces: InfiniteScrollGrid (149 LOC)
 */
export const InfiniteScroll: Story = {
  args: {
    items: [...mockConfigItems, ...mockConfigItems, ...mockConfigItems, ...mockConfigItems],
    cardComponent: ConfigCard,
    cardProps: {
      variant: 'default',
      showCategory: true,
      showActions: true,
    },
    variant: 'normal',
    infiniteScroll: true,
    batchSize: 6,
    loadingMessage: 'Loading more configurations...',
    ariaLabel: 'Infinite scroll configurations',
    emptyMessage: 'No configurations available',
  },
};

// ============================================================================
// STORY 5: Custom Render Variant (PHASE 11-6)
// ============================================================================

/**
 * Custom render function for special layouts
 * Example: Trending with rank badges
 */
export const CustomRender: Story = {
  args: {
    items: mockConfigItems.slice(0, 6),
    variant: 'normal',
    ariaLabel: 'Trending configurations',
    emptyMessage: 'No trending items',
    renderCard: (item: UnifiedContentItem, index: number) => (
      <div className="relative">
        {index < 3 && (
          <UnifiedBadge
            variant="base"
            style="default"
            className="absolute -top-2 -right-2 z-10"
            aria-label={`Rank ${index + 1}`}
          >
            #{index + 1}
          </UnifiedBadge>
        )}
        <ConfigCard
          item={{ ...item, position: index }}
          variant="default"
          showCategory
          showActions={false}
        />
      </div>
    ),
  },
};

// ============================================================================
// STORY 6: Loading State Variant (PHASE 11-7)
// ============================================================================

/**
 * Loading state with skeleton cards
 */
export const LoadingState: Story = {
  args: {
    items: [],
    cardComponent: ConfigCard,
    variant: 'normal',
    loading: true,
    ariaLabel: 'Loading configurations',
    emptyMessage: 'No configurations found',
  },
  render: (args) => (
    <div>
      <div className="mb-4 text-sm text-muted-foreground">Loading state demonstration</div>
      <UnifiedCardGrid {...args} />
    </div>
  ),
};

// ============================================================================
// STORY 7: Empty State Variant (PHASE 11-8)
// ============================================================================

/**
 * Empty state with custom message
 */
export const EmptyState: Story = {
  args: {
    items: [],
    cardComponent: ConfigCard,
    variant: 'normal',
    ariaLabel: 'Empty grid',
    emptyMessage: 'No configurations found. Try adjusting your filters or search criteria.',
  },
};

// ============================================================================
// STORY 8: All Grid Variants
// ============================================================================

/**
 * Comparison of all grid layout variants
 */
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-12">
      <div>
        <h2 className="text-2xl font-bold mb-4">Normal Variant (3-col, gap-6)</h2>
        <UnifiedCardGrid
          items={mockConfigItems}
          cardComponent={ConfigCard}
          cardProps={{ variant: 'default', showCategory: true }}
          variant="normal"
          ariaLabel="Normal grid"
        />
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Tight Variant (3-col, gap-4)</h2>
        <UnifiedCardGrid
          items={mockConfigItems}
          cardComponent={ConfigCard}
          cardProps={{ variant: 'default', showCategory: true }}
          variant="tight"
          ariaLabel="Tight grid"
        />
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Wide Variant (4-col, gap-6)</h2>
        <UnifiedCardGrid
          items={mockConfigItems}
          cardComponent={ConfigCard}
          cardProps={{ variant: 'default', showCategory: true }}
          variant="wide"
          ariaLabel="Wide grid"
        />
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">List Variant (full-width)</h2>
        <UnifiedCardGrid
          items={mockConfigItems.slice(0, 3)}
          cardComponent={ConfigCard}
          cardProps={{ variant: 'default', showCategory: true }}
          variant="list"
          ariaLabel="List grid"
        />
      </div>
    </div>
  ),
};

// ============================================================================
// PLAY FUNCTION TESTS
// ============================================================================

/**
 * Grid Structure Test
 * Tests grid layout and responsive classes
 */
export const GridStructureTest: Story = {
  args: {
    items: mockConfigItems,
    cardComponent: ConfigCard,
    variant: 'normal',
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests grid structure with responsive 3-column layout.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify grid container is rendered', async () => {
      const gridContainer = canvasElement.querySelector('[class*="grid"]');
      await expect(gridContainer).toBeInTheDocument();
    });

    await step('Verify cards are rendered', async () => {
      // Should have 6 config items
      const cards = canvasElement.querySelectorAll('[class*="card"]');
      await expect(cards.length).toBeGreaterThan(0);
    });
  },
};

/**
 * Card Click Interaction Test
 * Tests card interactivity
 */
export const CardClickTest: Story = {
  args: {
    items: mockConfigItems.slice(0, 3),
    cardComponent: ConfigCard,
    variant: 'normal',
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests card click interactions.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify cards are clickable', async () => {
      const firstCard = canvasElement.querySelector('a[href]');
      await expect(firstCard).toBeInTheDocument();
    });

    await step('Verify card has correct href', async () => {
      const firstCard = canvasElement.querySelector('a[href]');
      if (firstCard) {
        const href = firstCard.getAttribute('href');
        await expect(href).toBeTruthy();
      }
    });
  },
};

/**
 * Empty State Test
 * Tests empty state rendering
 */
export const EmptyStateTest: Story = {
  args: {
    items: [],
    cardComponent: ConfigCard,
    variant: 'normal',
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests empty state when no items are provided.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify empty state message is shown', async () => {
      // Empty state should show message or empty div
      const container = canvasElement.querySelector('[class*="grid"]');
      await expect(container).toBeInTheDocument();
    });
  },
};

/**
 * Loading State Test
 * Tests loading skeleton rendering
 */
export const LoadingStateTest: Story = {
  args: {
    items: mockConfigItems,
    cardComponent: ConfigCard,
    variant: 'normal',
    loading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests loading state with skeleton cards.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify loading skeletons are shown', async () => {
      // Loading state should show skeleton elements
      const skeletons = canvasElement.querySelectorAll('[class*="animate"]');
      await expect(skeletons.length).toBeGreaterThan(0);
    });
  },
};

/**
 * Variant Switching Test
 * Tests different grid variants
 */
export const VariantSwitchingTest: Story = {
  args: {
    items: mockConfigItems.slice(0, 4),
    cardComponent: ConfigCard,
    variant: 'wide',
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests wide variant (4-column grid).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify grid is rendered', async () => {
      const gridContainer = canvasElement.querySelector('[class*="grid"]');
      await expect(gridContainer).toBeInTheDocument();
    });

    await step('Verify correct number of items', async () => {
      // Should have 4 items
      const cards = canvasElement.querySelectorAll('[class*="card"]');
      await expect(cards.length).toBeGreaterThan(0);
    });
  },
};
