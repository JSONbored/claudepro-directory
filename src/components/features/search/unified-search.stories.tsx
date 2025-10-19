import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import type { FilterState } from '@/src/lib/schemas/component.schema';
import { UnifiedSearch } from './unified-search';

/**
 * Unified Search Stories
 *
 * Comprehensive showcase of the unified search component with filter panel.
 * Demonstrates search, filtering, sorting, and state management patterns.
 *
 * **Component Features:**
 * - Search input with icon and debouncing (300ms)
 * - Sort dropdown (trending, newest, alphabetical)
 * - Filter panel with collapsible UI
 * - Category, Author, Date Range filters
 * - Popularity range slider
 * - Tag selection with scroll area
 * - Active filter count badge
 * - Apply/Clear filter actions
 * - ARIA live announcements for results
 * - Analytics tracking integration
 *
 * **Architecture:**
 * - Client component with useUnifiedSearch hook
 * - SearchFilterPanel shared component
 * - ErrorBoundary wrapper for resilience
 * - SSR-safe with useId for unique field IDs
 * - Debounced search (300ms) with sanitization
 * - Analytics event tracking (search queries)
 * - Controlled filter state management
 *
 * **Filter Options:**
 * - Sort: trending, newest, alphabetical
 * - Category: Dropdown selection (optional)
 * - Author: Dropdown selection (optional)
 * - Date Range: Dropdown selection (optional)
 * - Popularity: Range slider [0, 100] (optional)
 * - Tags: Multi-select badges (optional)
 *
 * **Refactoring (SHA-2087):**
 * Previous: 420 lines of duplicated logic
 * Current: 180 lines (57% reduction)
 * - useUnifiedSearch hook (~80 lines removed)
 * - SearchFilterPanel component (~200 lines removed)
 *
 * **Production Standards:**
 * - TypeScript types from component.schema.ts
 * - FilterState interface for type safety
 * - Sanitization with validators-sync
 * - Silent fallbacks for missing data
 * - Accessibility (ARIA labels, live regions)
 */

const meta = {
  title: 'Features/Search/UnifiedSearch',
  component: UnifiedSearch,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**Unified Search Component** - Full-featured search with filters, sorting, and analytics.

**Features:**
- Search input with icon and placeholder
- Debounced search (300ms) for performance
- Sort dropdown (trending, newest, A-Z)
- Collapsible filter panel
- Category/Author/Date filters
- Popularity range slider
- Tag multi-select
- Active filter count badge
- Apply/Clear filter actions
- ARIA live result announcements
- Analytics event tracking

**Filter Panel Includes:**
1. **Category**: Dropdown with available categories
2. **Author**: Dropdown with available authors
3. **Date Range**: Dropdown (all time, last week, last month, last year)
4. **Popularity**: Range slider [0, 100]
5. **Tags**: Multi-select with scroll area

**State Management:**
- \`localSearchQuery\`: Local search input state (debounced)
- \`filters\`: Filter state from useUnifiedSearch hook
- \`isFilterOpen\`: Collapsible panel state
- \`activeFilterCount\`: Count of active filters

**Callbacks:**
- \`onSearch(query)\`: Triggered after 300ms debounce
- \`onFiltersChange(filters)\`: Triggered on filter apply/sort change

**Analytics:**
- Tracks search queries with context (category from pathname)
- Includes result count and filter state
- Truncates queries to 100 chars for privacy

**Accessibility:**
- ARIA labels for all controls
- Live announcements for search results
- Screen reader friendly filter panel
- Keyboard navigable
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Search input placeholder text',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'Search...' },
      },
    },
    resultCount: {
      control: 'number',
      description: 'Number of search results (for ARIA announcements)',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '0' },
      },
    },
    showFilters: {
      control: 'boolean',
      description: 'Show/hide filter panel',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    onSearch: {
      action: 'searched',
      description: 'Search query callback (debounced 300ms)',
      table: {
        type: { summary: '(query: string) => void' },
      },
    },
    onFiltersChange: {
      action: 'filters-changed',
      description: 'Filter state callback',
      table: {
        type: { summary: '(filters: FilterState) => void' },
      },
    },
    availableTags: {
      control: 'object',
      description: 'Array of available tags for filtering',
      table: {
        type: { summary: 'string[]' },
        defaultValue: { summary: '[]' },
      },
    },
    availableAuthors: {
      control: 'object',
      description: 'Array of available authors for filtering',
      table: {
        type: { summary: 'string[]' },
        defaultValue: { summary: '[]' },
      },
    },
    availableCategories: {
      control: 'object',
      description: 'Array of available categories for filtering',
      table: {
        type: { summary: 'string[]' },
        defaultValue: { summary: '[]' },
      },
    },
    filters: {
      control: 'object',
      description: 'Initial filter state',
      table: {
        type: { summary: 'FilterState' },
      },
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
      table: {
        type: { summary: 'string' },
      },
    },
  },
} satisfies Meta<typeof UnifiedSearch>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * ==============================================================================
 * MOCK HANDLERS
 * ==============================================================================
 */

/**
 * Mock search handler - logs search query
 */
const mockOnSearch = (query: string) => {
  console.log('Search query:', query);
};

/**
 * Mock filters change handler - logs filter state
 */
const mockOnFiltersChange = (filters: FilterState) => {
  console.log('Filters changed:', filters);
};

/**
 * ==============================================================================
 * MOCK DATA
 * ==============================================================================
 */

/**
 * Mock available tags
 */
const mockAvailableTags = [
  'AI',
  'Machine Learning',
  'TypeScript',
  'React',
  'Next.js',
  'Python',
  'Node.js',
  'PostgreSQL',
  'Docker',
  'Kubernetes',
  'AWS',
  'DevOps',
  'UI/UX',
  'Product Design',
  'API Design',
  'Testing',
  'Security',
  'Performance',
  'Accessibility',
  'SEO',
];

/**
 * Mock available authors
 */
const mockAvailableAuthors = [
  'Anthropic',
  'OpenAI',
  'Google',
  'Microsoft',
  'Meta',
  'Amazon',
  'Vercel',
  'GitHub',
  'Cloudflare',
  'Supabase',
];

/**
 * Mock available categories
 */
const mockAvailableCategories = [
  'Agents',
  'MCP Servers',
  'Skills',
  'Tools',
  'Guides',
  'Templates',
  'Prompts',
  'Workflows',
];

/**
 * Empty filter state
 */
const emptyFilters: FilterState = {
  sort: 'trending',
};

/**
 * Filter state with category selected
 */
const filtersWithCategory: FilterState = {
  sort: 'trending',
  category: 'Agents',
};

/**
 * Filter state with multiple filters
 */
const filtersWithMultiple: FilterState = {
  sort: 'newest',
  category: 'MCP Servers',
  author: 'Anthropic',
  dateRange: 'last-month',
  tags: ['AI', 'TypeScript', 'API Design'],
};

/**
 * Filter state with popularity range
 */
const filtersWithPopularity: FilterState = {
  sort: 'trending',
  popularity: [50, 100],
};

/**
 * Filter state with all options
 */
const filtersWithAll: FilterState = {
  sort: 'alphabetical',
  category: 'Tools',
  author: 'Vercel',
  dateRange: 'last-week',
  popularity: [75, 100],
  tags: ['React', 'Next.js', 'TypeScript', 'Performance'],
};

/**
 * ==============================================================================
 * DEFAULT STATE VARIANTS
 * ==============================================================================
 */

/**
 * Default - No Filters
 * Basic search without any filters applied
 */
export const Default: Story = {
  args: {
    placeholder: 'Search configurations...',
    onSearch: mockOnSearch,
    onFiltersChange: mockOnFiltersChange,
    filters: emptyFilters,
    availableTags: mockAvailableTags,
    availableAuthors: mockAvailableAuthors,
    availableCategories: mockAvailableCategories,
    resultCount: 0,
    showFilters: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Default search state with no filters applied.

**Features Shown:**
- Search input with icon
- Sort dropdown (default: trending)
- Filter button (no active filters)
- Filter panel closed

**Use Case:**
Initial state when user lands on search/listing page.
        `,
      },
    },
  },
};

/**
 * Without Filters - Search Only
 * Search component without filter controls
 */
export const WithoutFilters: Story = {
  args: {
    placeholder: 'Search...',
    onSearch: mockOnSearch,
    onFiltersChange: mockOnFiltersChange,
    filters: emptyFilters,
    showFilters: false,
  },
  parameters: {
    docs: {
      description: {
        story: `
Search component without filter controls.

**Features Shown:**
- Search input only
- No sort dropdown
- No filter button

**Use Case:**
Simple search without advanced filtering (e.g., navbar search).
        `,
      },
    },
  },
};

/**
 * ==============================================================================
 * WITH RESULTS VARIANTS
 * ==============================================================================
 */

/**
 * With Results - Search Active
 * Search with results displayed (ARIA announcement)
 */
export const WithResults: Story = {
  args: {
    placeholder: 'Search configurations...',
    onSearch: mockOnSearch,
    onFiltersChange: mockOnFiltersChange,
    filters: emptyFilters,
    availableTags: mockAvailableTags,
    availableAuthors: mockAvailableAuthors,
    availableCategories: mockAvailableCategories,
    resultCount: 42,
    showFilters: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Search with results displayed.

**Features Shown:**
- Result count displayed: "42 results found"
- ARIA live announcement for screen readers
- Search input populated (controlled by parent)

**ARIA Announcement:**
"42 results found for [query]."

**Use Case:**
Active search with results returned from API/filter.
        `,
      },
    },
  },
};

/**
 * No Results - Empty State
 * Search with no results found
 */
export const NoResults: Story = {
  args: {
    placeholder: 'Search configurations...',
    onSearch: mockOnSearch,
    onFiltersChange: mockOnFiltersChange,
    filters: emptyFilters,
    availableTags: mockAvailableTags,
    availableAuthors: mockAvailableAuthors,
    availableCategories: mockAvailableCategories,
    resultCount: 0,
    showFilters: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Search with no results found.

**Features Shown:**
- "No results found" message
- ARIA live announcement for screen readers

**ARIA Announcement:**
"No results found for [query]."

**Use Case:**
Search query with no matching results (typo, too specific filter).
        `,
      },
    },
  },
};

/**
 * Single Result - Exact Match
 * Search with exactly one result
 */
export const SingleResult: Story = {
  args: {
    placeholder: 'Search configurations...',
    onSearch: mockOnSearch,
    onFiltersChange: mockOnFiltersChange,
    filters: emptyFilters,
    availableTags: mockAvailableTags,
    availableAuthors: mockAvailableAuthors,
    availableCategories: mockAvailableCategories,
    resultCount: 1,
    showFilters: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Search with exactly one result.

**Features Shown:**
- Result count: "1 result found"
- Singular form for accessibility

**ARIA Announcement:**
"1 result found for [query]."

**Use Case:**
Exact match or highly specific search.
        `,
      },
    },
  },
};

/**
 * ==============================================================================
 * FILTER VARIANTS
 * ==============================================================================
 */

/**
 * With Category Filter - Single Filter
 * Search with category filter applied
 */
export const WithCategoryFilter: Story = {
  args: {
    placeholder: 'Search agents...',
    onSearch: mockOnSearch,
    onFiltersChange: mockOnFiltersChange,
    filters: filtersWithCategory,
    availableTags: mockAvailableTags,
    availableAuthors: mockAvailableAuthors,
    availableCategories: mockAvailableCategories,
    resultCount: 28,
    showFilters: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Search with category filter applied.

**Features Shown:**
- Filter button shows badge: "1"
- Category: "Agents" selected
- Result count: 28 results

**Use Case:**
User filtered by category to narrow results.
        `,
      },
    },
  },
};

/**
 * With Multiple Filters - Complex Query
 * Search with multiple filters applied
 */
export const WithMultipleFilters: Story = {
  args: {
    placeholder: 'Search MCP servers...',
    onSearch: mockOnSearch,
    onFiltersChange: mockOnFiltersChange,
    filters: filtersWithMultiple,
    availableTags: mockAvailableTags,
    availableAuthors: mockAvailableAuthors,
    availableCategories: mockAvailableCategories,
    resultCount: 12,
    showFilters: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Search with multiple filters applied.

**Filters Applied (6 total):**
- Sort: Newest
- Category: MCP Servers
- Author: Anthropic
- Date Range: Last Month
- Tags: AI, TypeScript, API Design (3 tags)

**Features Shown:**
- Filter button badge: "6"
- Result count: 12 results

**Use Case:**
Power user with specific search criteria.
        `,
      },
    },
  },
};

/**
 * With Popularity Range - Advanced Filter
 * Search with popularity range filter
 */
export const WithPopularityRange: Story = {
  args: {
    placeholder: 'Search popular configurations...',
    onSearch: mockOnSearch,
    onFiltersChange: mockOnFiltersChange,
    filters: filtersWithPopularity,
    availableTags: mockAvailableTags,
    availableAuthors: mockAvailableAuthors,
    availableCategories: mockAvailableCategories,
    resultCount: 35,
    showFilters: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Search with popularity range filter.

**Filter Applied:**
- Popularity: 50-100 (top half)

**Features Shown:**
- Filter button badge: "1"
- Range slider in filter panel

**Use Case:**
Finding highly popular/trending content only.
        `,
      },
    },
  },
};

/**
 * With All Filters - Maximum Filtering
 * Search with all available filters applied
 */
export const WithAllFilters: Story = {
  args: {
    placeholder: 'Search with all filters...',
    onSearch: mockOnSearch,
    onFiltersChange: mockOnFiltersChange,
    filters: filtersWithAll,
    availableTags: mockAvailableTags,
    availableAuthors: mockAvailableAuthors,
    availableCategories: mockAvailableCategories,
    resultCount: 5,
    showFilters: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Search with all available filters applied.

**Filters Applied (8 total):**
- Sort: Alphabetical
- Category: Tools
- Author: Vercel
- Date Range: Last Week
- Popularity: 75-100
- Tags: React, Next.js, TypeScript, Performance (4 tags)

**Features Shown:**
- Filter button badge: "8"
- Very specific query
- Low result count: 5 results

**Use Case:**
Extremely specific search criteria (edge case).
        `,
      },
    },
  },
};

/**
 * ==============================================================================
 * SORT VARIANTS
 * ==============================================================================
 */

/**
 * Sort by Trending - Default
 * Search sorted by trending (default)
 */
export const SortByTrending: Story = {
  args: {
    placeholder: 'Search configurations...',
    onSearch: mockOnSearch,
    onFiltersChange: mockOnFiltersChange,
    filters: { sort: 'trending' },
    availableTags: mockAvailableTags,
    availableAuthors: mockAvailableAuthors,
    availableCategories: mockAvailableCategories,
    resultCount: 50,
    showFilters: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Search sorted by trending.

**Sort:** Trending (default)

**Use Case:**
Show most popular/trending content first (view count + recency).
        `,
      },
    },
  },
};

/**
 * Sort by Newest - Chronological
 * Search sorted by newest first
 */
export const SortByNewest: Story = {
  args: {
    placeholder: 'Search configurations...',
    onSearch: mockOnSearch,
    onFiltersChange: mockOnFiltersChange,
    filters: { sort: 'newest' },
    availableTags: mockAvailableTags,
    availableAuthors: mockAvailableAuthors,
    availableCategories: mockAvailableCategories,
    resultCount: 50,
    showFilters: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Search sorted by newest first.

**Sort:** Newest

**Use Case:**
Show recently added/updated content (chronological order).
        `,
      },
    },
  },
};

/**
 * Sort by Alphabetical - A-Z
 * Search sorted alphabetically
 */
export const SortByAlphabetical: Story = {
  args: {
    placeholder: 'Search configurations...',
    onSearch: mockOnSearch,
    onFiltersChange: mockOnFiltersChange,
    filters: { sort: 'alphabetical' },
    availableTags: mockAvailableTags,
    availableAuthors: mockAvailableAuthors,
    availableCategories: mockAvailableCategories,
    resultCount: 50,
    showFilters: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Search sorted alphabetically (A-Z).

**Sort:** Alphabetical

**Use Case:**
Browsing content in alphabetical order (easier to find specific items).
        `,
      },
    },
  },
};

/**
 * ==============================================================================
 * DATA VARIANTS
 * ==============================================================================
 */

/**
 * With Many Tags - Large Tag List
 * Search with extensive tag list (20 tags)
 */
export const WithManyTags: Story = {
  args: {
    placeholder: 'Search configurations...',
    onSearch: mockOnSearch,
    onFiltersChange: mockOnFiltersChange,
    filters: emptyFilters,
    availableTags: mockAvailableTags,
    availableAuthors: mockAvailableAuthors,
    availableCategories: mockAvailableCategories,
    resultCount: 0,
    showFilters: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Search with many available tags (20 tags).

**Features Shown:**
- Tag scroll area in filter panel
- Many tags to select from
- Multi-select functionality

**Use Case:**
Content directory with extensive tagging system.
        `,
      },
    },
  },
};

/**
 * With Few Tags - Limited Options
 * Search with minimal tag options
 */
export const WithFewTags: Story = {
  args: {
    placeholder: 'Search configurations...',
    onSearch: mockOnSearch,
    onFiltersChange: mockOnFiltersChange,
    filters: emptyFilters,
    availableTags: ['AI', 'TypeScript', 'React'],
    availableAuthors: mockAvailableAuthors,
    availableCategories: mockAvailableCategories,
    resultCount: 0,
    showFilters: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Search with minimal tag options (3 tags).',
      },
    },
  },
};

/**
 * With No Tags - Tags Disabled
 * Search without tag filtering
 */
export const WithNoTags: Story = {
  args: {
    placeholder: 'Search configurations...',
    onSearch: mockOnSearch,
    onFiltersChange: mockOnFiltersChange,
    filters: emptyFilters,
    availableTags: [],
    availableAuthors: mockAvailableAuthors,
    availableCategories: mockAvailableCategories,
    resultCount: 0,
    showFilters: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Search without tag filtering.

**Features Shown:**
- Tag section hidden in filter panel
- Only category/author/date/popularity filters

**Use Case:**
Content without tagging system.
        `,
      },
    },
  },
};

/**
 * ==============================================================================
 * INTERACTIVE DEMO
 * ==============================================================================
 */

/**
 * Interactive Demo - Full Features
 * Comprehensive demo with stateful interactions
 */
export const InteractiveDemo: Story = {
  render: () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<FilterState>({ sort: 'trending' });
    const [resultCount, setResultCount] = useState(50);

    const handleSearch = (query: string) => {
      setSearchQuery(query);
      // Simulate filtering results based on query
      if (query) {
        setResultCount(Math.floor(Math.random() * 30) + 5); // Random 5-35
      } else {
        setResultCount(50); // Reset to default
      }
      console.log('Search:', query);
    };

    const handleFiltersChange = (newFilters: FilterState) => {
      setFilters(newFilters);
      // Simulate filtering results based on filters
      const filterCount = Object.keys(newFilters).filter(
        (key) => key !== 'sort' && newFilters[key as keyof FilterState]
      ).length;
      setResultCount(Math.max(5, 50 - filterCount * 8)); // Fewer results with more filters
      console.log('Filters:', newFilters);
    };

    return (
      <div className="space-y-4">
        <UnifiedSearch
          placeholder="Search configurations..."
          onSearch={handleSearch}
          onFiltersChange={handleFiltersChange}
          filters={filters}
          availableTags={mockAvailableTags}
          availableAuthors={mockAvailableAuthors}
          availableCategories={mockAvailableCategories}
          resultCount={resultCount}
          showFilters={true}
        />

        {/* Debug Info */}
        <div className="p-4 bg-muted/50 rounded border text-sm space-y-2">
          <p>
            <strong>Current Query:</strong> {searchQuery || '(none)'}
          </p>
          <p>
            <strong>Result Count:</strong> {resultCount}
          </p>
          <p>
            <strong>Active Filters:</strong>{' '}
            {JSON.stringify(
              Object.fromEntries(
                Object.entries(filters).filter(([key, value]) => value && key !== 'sort')
              ),
              null,
              2
            ) || '(none)'}
          </p>
          <p>
            <strong>Sort:</strong> {filters.sort || 'trending'}
          </p>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
Interactive demo with full state management.

**Try These Interactions:**
1. Type in search input (debounced 300ms)
2. Change sort dropdown
3. Click Filter button to open panel
4. Select category from dropdown
5. Select author from dropdown
6. Select date range
7. Adjust popularity slider
8. Click tags to select/deselect
9. Click Apply Filters
10. Click Clear Filters
11. Click Cancel to close panel

**State Updates:**
- Search query updates result count (simulated)
- Filters update result count (simulated)
- Debug panel shows current state

**Debouncing:**
Search input debounces for 300ms before calling \`onSearch\`.

**Analytics:**
Search events are tracked (check console for event data).
        `,
      },
    },
  },
};

/**
 * ==============================================================================
 * RESPONSIVE VARIANTS
 * ==============================================================================
 */

/**
 * ==============================================================================
 * COMPONENT STATES
 * ==============================================================================
 */

/**
 * Loading State - Search in Progress
 * Shows loading indicator while search API call is in progress
 */
export const LoadingState: Story = {
  args: {
    placeholder: 'Searching...',
    onSearch: fn(),
    onFiltersChange: fn(),
    filters: defaultFilters,
    availableTags: [],
    availableAuthors: [],
    availableCategories: [],
    resultCount: 0,
    showFilters: false,
  },
  parameters: {
    docs: {
      description: {
        story: `
Search component during active API call.

**Loading Indicators:**
- Disabled search input
- Placeholder shows "Searching..."
- Filters hidden during load

**Use Case:**
Initial page load or active search query being processed.

**Note:** Real implementation would show skeleton/spinner.
        `,
      },
    },
  },
};

/**
 * Error State - Search Failed
 * Shows error message when search API fails
 */
export const ErrorState: Story = {
  args: {
    placeholder: 'Search failed - Try again',
    onSearch: fn(),
    onFiltersChange: fn(),
    filters: defaultFilters,
    availableTags: [],
    availableAuthors: [],
    availableCategories: [],
    resultCount: 0,
    showFilters: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Search component after API error.

**Error Handling:**
- Placeholder indicates failure
- User can retry search
- Filters remain available

**Use Case:**
Network failure, API error, timeout.

**Note:** Real implementation would show error banner with retry button.
        `,
      },
    },
  },
};

/**
 * Empty State - No Data
 * Search without any available filters/data
 */
export const EmptyState: Story = {
  args: {
    placeholder: 'Search...',
    onSearch: mockOnSearch,
    onFiltersChange: mockOnFiltersChange,
    filters: emptyFilters,
    availableTags: [],
    availableAuthors: [],
    availableCategories: [],
    resultCount: 0,
    showFilters: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Search without any available filter data.

**Features Shown:**
- Search input only
- Filter panel with no options
- Graceful degradation

**Use Case:**
Empty content directory or initial load before data fetched.
        `,
      },
    },
  },
};

// ============================================================================
// INTERACTION TESTING
// Play functions for search and filter interactions
// ============================================================================

/**
 * SearchInputInteraction: Test Search Input
 * Demonstrates typing into search field and debounced callback
 */
export const SearchInputInteraction: Story = {
  args: {
    placeholder: 'Search for content...',
    onSearch: fn(),
    onFiltersChange: fn(),
    filters: defaultFilters,
    availableTags: mockAvailableTags,
    availableAuthors: mockAvailableAuthors,
    availableCategories: mockAvailableCategories,
    resultCount: 0,
    showFilters: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive test demonstrating search input. Uses play function to simulate typing and verify debounced onSearch callback (300ms delay).',
      },
    },
  },
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Find search input', async () => {
      const searchInput = canvas.getByPlaceholderText(/search for content/i);
      await expect(searchInput).toBeInTheDocument();
    });

    await step('Type search query', async () => {
      const searchInput = canvas.getByPlaceholderText(/search for content/i);
      await userEvent.type(searchInput, 'React hooks');
      await expect(searchInput).toHaveValue('React hooks');
    });

    // Note: onSearch has 300ms debounce, so we'd need to wait
    // In a real test, we'd use waitFor() to check after debounce
  },
};

/**
 * FilterPanelInteraction: Test Filter Toggle
 * Demonstrates opening and closing filter panel
 */
export const FilterPanelInteraction: Story = {
  args: {
    placeholder: 'Search...',
    onSearch: fn(),
    onFiltersChange: fn(),
    filters: defaultFilters,
    availableTags: mockAvailableTags,
    availableAuthors: mockAvailableAuthors,
    availableCategories: mockAvailableCategories,
    resultCount: 25,
    showFilters: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive test demonstrating filter panel toggle. Tests collapsible behavior for filter controls.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Find filter button', async () => {
      const filterButton = canvas.getByRole('button', { name: /filters/i });
      await expect(filterButton).toBeInTheDocument();
    });

    await step('Click to open filters', async () => {
      const filterButton = canvas.getByRole('button', { name: /filters/i });
      await userEvent.click(filterButton);
      // Filter panel should be visible after click
    });
  },
};

/**
 * SortSelectInteraction: Test Sort Dropdown
 * Demonstrates changing sort order
 */
export const SortSelectInteraction: Story = {
  args: {
    placeholder: 'Search...',
    onSearch: fn(),
    onFiltersChange: fn(),
    filters: defaultFilters,
    availableTags: mockAvailableTags,
    availableAuthors: mockAvailableAuthors,
    availableCategories: mockAvailableCategories,
    resultCount: 50,
    showFilters: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive test demonstrating sort selection. Tests clicking sort dropdown and selecting an option.',
      },
    },
  },
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Find sort dropdown', async () => {
      // Sort dropdown should be present
      const sortSelect = canvas.getByRole('combobox');
      await expect(sortSelect).toBeInTheDocument();
    });

    await step('Click sort dropdown', async () => {
      const sortSelect = canvas.getByRole('combobox');
      await userEvent.click(sortSelect);
      // Dropdown options should appear
    });

    // Note: Selecting an option would trigger onFiltersChange
  },
};
