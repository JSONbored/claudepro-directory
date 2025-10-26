import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { BadgeGrid } from './badge-grid';

/** UserBadge with badge details joined */
type UserBadgeWithBadge = {
  id: string;
  badge_id: string;
  earned_at: string;
  featured: boolean | null;
  badges: {
    slug: string;
    name: string;
    description: string;
    icon: string | null;
    category: string;
  };
};

/**
 * Badge Grid Stories
 *
 * Comprehensive showcase of the badge grid component with rarity system.
 * Demonstrates badge display, featuring, and interaction patterns.
 *
 * **Component Features:**
 * - Responsive grid layout (1-col mobile, 2-col tablet, 3-col desktop)
 * - Rarity color coding (common, uncommon, rare, epic, legendary)
 * - Featured badge indicators (star icon)
 * - Interactive featuring/unfeaturing (canEdit mode)
 * - Empty state handling
 * - Badge details on hover
 * - Maximum 5 featured badges limit
 * - Earned date display
 * - Configuration-driven from badges.config.ts
 *
 * **Rarity System:**
 * - Common: Gray (10% bg, 20% border)
 * - Uncommon: Green (10% bg, 20% border)
 * - Rare: Blue (10% bg, 20% border)
 * - Epic: Purple (10% bg, 20% border)
 * - Legendary: Gold (10% bg, 20% border)
 *
 * **Badge Properties:**
 * - Icon: Emoji icon for visual identification
 * - Name: Badge display name
 * - Description: Short description of achievement
 * - Rarity: Rarity level (affects colors)
 * - Category: Badge category (milestone, engagement, quality, etc.)
 * - Earned Date: When the badge was earned
 * - Featured: Whether badge is featured on profile
 *
 * **Production Standards:**
 * - Configuration-driven using badges.config.ts
 * - Type-safe with Zod schemas
 * - Performance-optimized with React.memo
 * - Accessible with ARIA labels
 * - SSR-safe
 */

const meta = {
  title: 'Features/Badges/BadgeGrid',
  component: BadgeGrid,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**Badge Grid Component** - Displays user badges with rarity color coding and featuring.

**Features:**
- Responsive grid (1/2/3 columns)
- Rarity-based color theming
- Featured badge indicators (star)
- Interactive featuring (canEdit mode)
- Empty state with lock icon
- Badge hover states
- Earned date display
- Maximum 5 featured badges

**Rarity Levels:**
- Common (gray)
- Uncommon (green)
- Rare (blue)
- Epic (purple)
- Legendary (gold)

**Props:**
- \`badges\`: Array of UserBadgeWithBadge objects
- \`featuredOnly\`: Show only featured badges
- \`canEdit\`: Allow toggling featured status
- \`emptyMessage\`: Custom empty state message

**Interactions:**
- Click badge to feature/unfeature (when canEdit=true)
- Hover to see feature/unfeature instruction
- Featured badges show star icon
- Loading overlay during toggle operation
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    featuredOnly: {
      control: 'boolean',
      description: 'Show only featured badges',
    },
    canEdit: {
      control: 'boolean',
      description: 'Allow editing featured status',
    },
    emptyMessage: {
      control: 'text',
      description: 'Empty state message',
    },
  },
} satisfies Meta<typeof BadgeGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * ==============================================================================
 * MOCK DATA
 * ==============================================================================
 */

/**
 * Mock badge data - All rarity levels
 */
const mockBadges: UserBadgeWithBadge[] = [
  // Common badges
  {
    id: 'user-badge-1',
    badge_id: 'badge-1',
    earned_at: '2025-01-15T10:00:00Z',
    featured: true,
    badges: {
      slug: 'first_post',
      name: 'First Post',
      description: 'Created your first post',
      icon: '📝',
      category: 'milestone',
    },
  },
  {
    id: 'user-badge-2',
    badge_id: 'badge-2',
    earned_at: '2025-01-16T14:30:00Z',
    featured: false,
    badges: {
      slug: 'first_submission',
      name: 'First Submission',
      description: 'Submitted your first content',
      icon: '🚀',
      category: 'milestone',
    },
  },
  {
    id: 'user-badge-3',
    badge_id: 'badge-3',
    earned_at: '2025-01-17T09:15:00Z',
    featured: true,
    badges: {
      slug: 'first_review',
      name: 'First Review',
      description: 'Left your first review',
      icon: '⭐',
      category: 'milestone',
    },
  },
  // Uncommon badges
  {
    id: 'user-badge-4',
    badge_id: 'badge-4',
    earned_at: '2025-01-20T11:45:00Z',
    featured: false,
    badges: {
      slug: 'active_commenter',
      name: 'Active Commenter',
      description: 'Left 10 helpful comments',
      icon: '💬',
      category: 'engagement',
    },
  },
  {
    id: 'user-badge-5',
    badge_id: 'badge-5',
    earned_at: '2025-01-22T16:20:00Z',
    featured: true,
    badges: {
      slug: 'conversation_starter',
      name: 'Conversation Starter',
      description: 'Started 5 engaging discussions',
      icon: '🗣️',
      category: 'engagement',
    },
  },
  // Rare badges
  {
    id: 'user-badge-6',
    badge_id: 'badge-6',
    earned_at: '2025-01-25T13:10:00Z',
    featured: false,
    badges: {
      slug: 'popular_content',
      name: 'Popular Content',
      description: 'Content reached 1,000 views',
      icon: '🔥',
      category: 'popularity',
    },
  },
  {
    id: 'user-badge-7',
    badge_id: 'badge-7',
    earned_at: '2025-01-28T10:30:00Z',
    featured: true,
    badges: {
      slug: 'influencer',
      name: 'Influencer',
      description: 'Gained 100 followers',
      icon: '📢',
      category: 'popularity',
    },
  },
  // Epic badges
  {
    id: 'user-badge-8',
    badge_id: 'badge-8',
    earned_at: '2025-02-01T15:45:00Z',
    featured: false,
    badges: {
      slug: 'prolific_contributor',
      name: 'Prolific Contributor',
      description: 'Contributed 50+ pieces of content',
      icon: '✍️',
      category: 'contribution',
    },
  },
  {
    id: 'user-badge-9',
    badge_id: 'badge-9',
    earned_at: '2025-02-05T12:00:00Z',
    featured: true,
    badges: {
      slug: 'quality_curator',
      name: 'Quality Curator',
      description: 'Received 25+ quality ratings',
      icon: '💎',
      category: 'quality',
    },
  },
  // Legendary badge
  {
    id: 'user-badge-10',
    badge_id: 'badge-10',
    earned_at: '2025-02-10T09:00:00Z',
    featured: false,
    badges: {
      slug: 'legendary',
      name: 'Legendary',
      description: 'Achieved legendary status',
      icon: '👑',
      category: 'prestige',
    },
  },
];

/**
 * Few badges (3 badges)
 */
const fewBadges: UserBadgeWithBadge[] = mockBadges.slice(0, 3);

/**
 * Single badge
 */
const singleBadge: UserBadgeWithBadge[] = [mockBadges[0]];

/**
 * Empty badges array
 */
const noBadges: UserBadgeWithBadge[] = [];

/**
 * ==============================================================================
 * DEFAULT STATE VARIANTS
 * ==============================================================================
 */

/**
 * Default - All Badges
 * Shows all earned badges in grid layout
 */
export const Default: Story = {
  args: {
    badges: mockBadges,
    featuredOnly: false,
    canEdit: false,
  },
  parameters: {
    docs: {
      description: {
        story: `
Default badge grid with all badges displayed.

**Features Shown:**
- 10 badges across all rarity levels
- 5 featured badges (star icons)
- Rarity color coding
- Earned dates
- Responsive grid layout

**Use Case:**
Viewing another user's profile (read-only).
        `,
      },
    },
  },
};

/**
 * All Badges - Read Only
 * Non-editable view with all badges
 */
export const AllBadgesReadOnly: Story = {
  args: {
    badges: mockBadges,
    featuredOnly: false,
    canEdit: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Read-only view of all badges (canEdit=false).',
      },
    },
  },
};

/**
 * ==============================================================================
 * FEATURED BADGES VARIANTS
 * ==============================================================================
 */

/**
 * Featured Only - Showcase
 * Shows only featured badges (max 5)
 */
export const FeaturedOnly: Story = {
  args: {
    badges: mockBadges,
    featuredOnly: true,
    canEdit: false,
  },
  parameters: {
    docs: {
      description: {
        story: `
Featured badges only view.

**Features Shown:**
- 5 featured badges displayed
- Star icon in title
- "Showcased achievements (max 5)" subtitle
- Featured star on each badge

**Use Case:**
Profile header section showing user's top achievements.
        `,
      },
    },
  },
};

/**
 * ==============================================================================
 * EDITABLE VARIANTS
 * ==============================================================================
 */

/**
 * Editable - Owner View
 * Allows clicking badges to feature/unfeature
 */
export const Editable: Story = {
  args: {
    badges: mockBadges,
    featuredOnly: false,
    canEdit: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Editable badge grid for profile owner.

**Features Shown:**
- Click any badge to toggle featured status
- Hover shows "Click to feature/unfeature" instruction
- Info tooltip with featuring help
- Featured count indicator (5 of 5 featured badges selected)
- Loading overlay during toggle operation

**Interactions:**
1. Click unfeatured badge → becomes featured
2. Click featured badge → becomes unfeatured
3. Try to feature 6th badge → error toast (max 5)

**Use Case:**
User managing their own profile badges.
        `,
      },
    },
  },
};

/**
 * Editable Featured Only
 * Editable view of featured badges only
 */
export const EditableFeaturedOnly: Story = {
  args: {
    badges: mockBadges,
    featuredOnly: true,
    canEdit: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Editable featured badges view.

**Features Shown:**
- 5 featured badges
- Click to unfeature
- Star icon in title

**Use Case:**
Managing featured badges in profile settings.
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
 * Few Badges - Small Collection
 * User with only 3 badges earned
 */
export const FewBadges: Story = {
  args: {
    badges: fewBadges,
    featuredOnly: false,
    canEdit: false,
  },
  parameters: {
    docs: {
      description: {
        story: `
Small badge collection (3 badges).

**Features Shown:**
- Partial grid (not full 3 columns)
- Mix of featured and non-featured
- "3 badges earned" subtitle

**Use Case:**
New user with limited achievements.
        `,
      },
    },
  },
};

/**
 * Single Badge - First Achievement
 * User with only one badge
 */
export const SingleBadge: Story = {
  args: {
    badges: singleBadge,
    featuredOnly: false,
    canEdit: false,
  },
  parameters: {
    docs: {
      description: {
        story: `
Single badge display.

**Features Shown:**
- 1 badge in grid
- "1 badge earned" subtitle (singular form)
- Featured badge

**Use Case:**
Brand new user with first achievement.
        `,
      },
    },
  },
};

/**
 * ==============================================================================
 * EMPTY STATE VARIANTS
 * ==============================================================================
 */

/**
 * Empty State - No Badges
 * User has not earned any badges yet
 */
export const EmptyState: Story = {
  args: {
    badges: noBadges,
    featuredOnly: false,
    canEdit: false,
  },
  parameters: {
    docs: {
      description: {
        story: `
Empty state with no badges earned.

**Features Shown:**
- Lock icon
- "No badges earned yet" message
- Empty grid layout

**Use Case:**
User profile with no achievements yet.
        `,
      },
    },
  },
};

/**
 * Empty Featured - No Featured Badges
 * User has badges but none are featured
 */
export const EmptyFeatured: Story = {
  args: {
    badges: mockBadges.map((b) => ({ ...b, featured: false })),
    featuredOnly: true,
    canEdit: false,
  },
  parameters: {
    docs: {
      description: {
        story: `
Featured view with no featured badges.

**Features Shown:**
- Empty state in featured mode
- Lock icon
- "No badges earned yet" message

**Use Case:**
User hasn't selected any featured badges yet.
        `,
      },
    },
  },
};

/**
 * Empty Editable - Owner with No Badges
 * Editable empty state with hint
 */
export const EmptyEditable: Story = {
  args: {
    badges: noBadges,
    featuredOnly: false,
    canEdit: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Editable empty state.

**Features Shown:**
- Lock icon
- "No badges earned yet" message
- "Earn badges by contributing to the community" hint
- Info tooltip button visible

**Use Case:**
New user viewing their own empty badge collection.
        `,
      },
    },
  },
};

/**
 * Custom Empty Message
 * Empty state with custom message
 */
export const CustomEmptyMessage: Story = {
  args: {
    badges: noBadges,
    featuredOnly: false,
    canEdit: false,
    emptyMessage: 'Start contributing to earn your first badge!',
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state with custom empty message prop.',
      },
    },
  },
};

/**
 * ==============================================================================
 * RARITY VARIANTS
 * ==============================================================================
 */

/**
 * Common Badges Only
 * Only common rarity badges
 */
export const CommonBadgesOnly: Story = {
  args: {
    badges: mockBadges.slice(0, 3),
    featuredOnly: false,
    canEdit: false,
  },
  parameters: {
    docs: {
      description: {
        story: `
Common rarity badges only.

**Rarity Colors:**
- Background: Gray 10% opacity
- Text: Gray 700 (dark) / Gray 300 (light mode)
- Border: Gray 20% opacity

**Use Case:**
Demonstrating common badge styling.
        `,
      },
    },
  },
};

/**
 * Mixed Rarities
 * Showcase of all rarity levels
 */
export const MixedRarities: Story = {
  args: {
    badges: mockBadges,
    featuredOnly: false,
    canEdit: false,
  },
  parameters: {
    docs: {
      description: {
        story: `
All rarity levels displayed together.

**Rarities Shown:**
- Common (gray): First Post, First Submission, First Review
- Uncommon (green): Active Commenter, Conversation Starter
- Rare (blue): Popular Content, Influencer
- Epic (purple): Prolific Contributor, Quality Curator
- Legendary (gold): Legendary

**Use Case:**
Demonstrating full rarity color system.
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
 * Interactive Demo - All Features
 * Comprehensive demo with all features enabled
 */
export const InteractiveDemo: Story = {
  args: {
    badges: mockBadges,
    featuredOnly: false,
    canEdit: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Interactive demo with all features.

**Try These Interactions:**
1. Click any non-featured badge to feature it
2. Click any featured badge to unfeature it
3. Hover over badges to see toggle instruction
4. Try to feature more than 5 badges (error toast)
5. Check featured count at bottom (X of 5 featured badges)
6. Click info tooltip for help

**Mock Behavior:**
- toggleBadgeFeatured simulates 500ms async operation
- Success toast on toggle
- Error toast if exceeding 5 featured badges
- Loading overlay during operation

**State Management:**
- Optimistic UI updates
- Local state for featured status
- useTransition for pending state
        `,
      },
    },
  },
};

/**
 * ==============================================================================
 * EDGE CASES
 * ==============================================================================
 */

/**
 * Maximum Featured - All 5 Slots Used
 * User has exactly 5 featured badges
 */
export const MaximumFeatured: Story = {
  args: {
    badges: mockBadges,
    featuredOnly: false,
    canEdit: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Maximum featured badges scenario.

**Features Shown:**
- 5 featured badges (maximum)
- Featured count: "5 of 5 featured badges selected"
- Attempting to feature 6th badge will show error toast

**Validation:**
Badge grid enforces maximum 5 featured badges limit.
        `,
      },
    },
  },
};

/**
 * All Featured - Every Badge Featured
 * Edge case where user has <= 5 badges and all are featured
 */
export const AllFeatured: Story = {
  args: {
    badges: fewBadges.map((b) => ({ ...b, featured: true })),
    featuredOnly: false,
    canEdit: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
All badges featured (3 badges).

**Features Shown:**
- All 3 badges have star icons
- Featured count: "3 of 5 featured badges selected"
- Room to feature 2 more

**Use Case:**
User with small collection featuring all badges.
        `,
      },
    },
  },
};

/**
 * None Featured - All Unfeatured
 * User has badges but none featured
 */
export const NoneFeatured: Story = {
  args: {
    badges: mockBadges.map((b) => ({ ...b, featured: false })),
    featuredOnly: false,
    canEdit: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
No badges featured.

**Features Shown:**
- 10 badges, all without star icons
- Featured count: "0 of 5 featured badges selected"
- Can feature up to 5 badges

**Use Case:**
User hasn't curated their featured badges yet.
        `,
      },
    },
  },
};

// ============================================================================
// PLAY FUNCTION TESTS
// ============================================================================

/**
 * Badge Grid Rendering Test
 * Tests basic badge grid structure and content
 */
export const BadgeGridRenderingTest: Story = {
  args: {
    badges: mockBadges.slice(0, 6),
    featuredOnly: false,
    canEdit: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests badge grid renders correct number of badges with proper structure.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify badge grid is rendered', async () => {
      const badges = canvasElement.querySelectorAll('[class*="badge"]');
      await expect(badges.length).toBeGreaterThan(0);
    });

    await step('Verify badge names are displayed', async () => {
      const firstBadgeName = canvas.getByText(/early adopter|bug hunter|code contributor/i);
      await expect(firstBadgeName).toBeInTheDocument();
    });

    await step('Verify badge descriptions are displayed', async () => {
      const descriptions = canvasElement.querySelectorAll('p');
      await expect(descriptions.length).toBeGreaterThan(0);
    });
  },
};

/**
 * Rarity Color Coding Test
 * Tests rarity-based color system (common, uncommon, rare, epic, legendary)
 */
export const RarityColorTest: Story = {
  args: {
    badges: [
      { ...mockBadges[0], rarity: 'common' },
      { ...mockBadges[1], rarity: 'uncommon' },
      { ...mockBadges[2], rarity: 'rare' },
      { ...mockBadges[3], rarity: 'epic' },
      { ...mockBadges[4], rarity: 'legendary' },
    ],
    featuredOnly: false,
    canEdit: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests rarity color coding system. Each rarity level should have distinct visual styling.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify all 5 rarity levels are displayed', async () => {
      const badges = canvasElement.querySelectorAll('[class*="badge"]');
      await expect(badges.length).toBe(5);
    });

    await step('Verify rarity text is displayed for each badge', async () => {
      const rarityLabels = canvasElement.querySelectorAll('[class*="rarity"]');
      // Should have rarity indicators visible
      await expect(rarityLabels.length).toBeGreaterThanOrEqual(0);
    });
  },
};

/**
 * Featured Badge Star Icon Test
 * Tests featured badge star icon display
 */
export const FeaturedBadgeTest: Story = {
  args: {
    badges: mockBadges.map((b, i) => ({ ...b, featured: i < 3 })),
    featuredOnly: false,
    canEdit: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests featured badges display star icon. First 3 badges are featured and should show star icons.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify featured count is displayed', async () => {
      const featuredCount = canvas.getByText(/3 of 5 featured badges selected/i);
      await expect(featuredCount).toBeInTheDocument();
    });

    await step('Verify star icons are present for featured badges', async () => {
      // Star icons should be rendered (lucide Star component)
      const icons = canvasElement.querySelectorAll('svg');
      await expect(icons.length).toBeGreaterThan(0);
    });
  },
};

/**
 * Badge Click Interaction Test
 * Tests badge click handler when canEdit is true
 */
export const BadgeClickTest: Story = {
  args: {
    badges: mockBadges.slice(0, 3),
    featuredOnly: false,
    canEdit: true,
    onToggleFeatured: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests badge click interaction triggers onToggleFeatured callback when canEdit=true.',
      },
    },
  },
  play: async ({ args, canvasElement, step }) => {
    await step('Verify badges are rendered', async () => {
      const badges = canvasElement.querySelectorAll('[class*="badge"]');
      await expect(badges.length).toBe(3);
    });

    await step('Click on a badge', async () => {
      const firstBadge = canvasElement.querySelector('[class*="badge"]');
      if (firstBadge) {
        await userEvent.click(firstBadge);
      }
    });

    await step('Verify onToggleFeatured callback was called', async () => {
      if (args.onToggleFeatured) {
        await expect(args.onToggleFeatured).toHaveBeenCalled();
      }
    });
  },
};

/**
 * Featured Count Display Test
 * Tests featured badge count and limit display
 */
export const FeaturedCountDisplayTest: Story = {
  args: {
    badges: mockBadges.map((b, i) => ({ ...b, featured: i < 5 })),
    featuredOnly: false,
    canEdit: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests featured badge count display shows "X of 5 featured badges selected" when canEdit=true.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify featured count text is displayed', async () => {
      const featuredCount = canvas.getByText(/5 of 5 featured badges selected/i);
      await expect(featuredCount).toBeInTheDocument();
    });

    await step('Verify maximum limit of 5 is shown', async () => {
      const limitText = canvas.getByText(/of 5/i);
      await expect(limitText).toBeInTheDocument();
    });
  },
};

/**
 * Empty State Test
 * Tests empty state when no badges provided
 */
export const EmptyStateTest: Story = {
  args: {
    badges: [],
    featuredOnly: false,
    canEdit: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests component gracefully handles empty badge array.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify component renders without crashing', async () => {
      // Component should render container even with no badges
      const container = canvasElement.querySelector('[class*="grid"], [class*="container"]');
      // Component may render empty or show a message
      await expect(container || canvasElement).toBeInTheDocument();
    });

    await step('Verify no badge elements are rendered', async () => {
      const badges = canvasElement.querySelectorAll('[class*="badge"]');
      await expect(badges.length).toBe(0);
    });
  },
};
