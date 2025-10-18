import type { Meta, StoryObj } from '@storybook/react';
import type { ReputationBreakdown as ReputationBreakdownType } from '@/src/lib/config/reputation.config';
import { ReputationBreakdown } from './reputation-breakdown';

/**
 * Reputation Breakdown Stories
 *
 * Comprehensive showcase of the reputation breakdown component with tier system.
 * Demonstrates reputation scoring, tier progression, and activity breakdown.
 *
 * **Component Features:**
 * - Total reputation score display with tier badge
 * - Current tier indicator with icon and description
 * - Progress bar to next tier
 * - Detailed breakdown by activity type (posts, votes, comments, submissions)
 * - Horizontal bar chart visualization
 * - Activity details grid with icons
 * - Point calculation reference (collapsible)
 * - 6 reputation tiers with color coding
 *
 * **Reputation Tiers:**
 * - Newcomer (0-49 pts): 🌱 Gray - Just getting started
 * - Contributor (50-199 pts): ⭐ Blue - Regular contributor
 * - Regular (200-499 pts): 💎 Purple - Established member
 * - Expert (500-999 pts): 🔥 Orange - Expert contributor
 * - Master (1000-2499 pts): 🏆 Red - Master of the community
 * - Legend (2500+ pts): 👑 Gold - Legendary status
 *
 * **Point Values:**
 * - Create a post: +10 points
 * - Receive an upvote: +5 points
 * - Write a comment: +2 points
 * - Submission merged: +50 points
 * - Write a review: +5 points
 * - Content bookmarked: +3 points
 * - Gain a follower: +1 point
 *
 * **Production Standards:**
 * - Configuration-driven using reputation.config.ts
 * - Type-safe with Zod schemas
 * - Performance-optimized with React.memo
 * - Accessible with ARIA labels
 * - Responsive design
 */

const meta = {
  title: 'Features/Reputation/ReputationBreakdown',
  component: ReputationBreakdown,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**Reputation Breakdown Component** - Displays user reputation with tier system and activity breakdown.

**Features:**
- Total score with tier-colored badge
- Current tier icon and description
- Progress bar to next tier
- Activity breakdown chart
- Points distribution grid
- Point calculation reference

**Tiers (6 levels):**
- Newcomer (0-49): 🌱 Gray
- Contributor (50-199): ⭐ Blue
- Regular (200-499): 💎 Purple
- Expert (500-999): 🔥 Orange
- Master (1000-2499): 🏆 Red
- Legend (2500+): 👑 Gold

**Activity Types:**
- Posts (📝): Content creation
- Votes (👍): Community appreciation
- Comments (💬): Engagement
- Submissions (⭐): Contributions

**Props:**
- \`breakdown\`: ReputationBreakdown object
- \`showDetails\`: Show/hide breakdown chart (default: true)
- \`showProgress\`: Show/hide next tier progress (default: true)

**Interactions:**
- Click "How reputation is calculated" for point values
- Progress bar animates on mount
- Responsive grid layout
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    showDetails: {
      control: 'boolean',
      description: 'Show detailed breakdown chart',
    },
    showProgress: {
      control: 'boolean',
      description: 'Show next tier progress bar',
    },
  },
} satisfies Meta<typeof ReputationBreakdown>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * ==============================================================================
 * MOCK DATA
 * ==============================================================================
 */

/**
 * Newcomer tier (0-49 pts)
 */
const newcomerBreakdown: ReputationBreakdownType = {
  from_posts: 10, // 1 post
  from_votes_received: 15, // 3 votes
  from_comments: 6, // 3 comments
  from_submissions: 0, // 0 submissions
  total: 31, // 31 total (Newcomer)
};

/**
 * Contributor tier - Low (50-199 pts)
 */
const contributorLowBreakdown: ReputationBreakdownType = {
  from_posts: 50, // 5 posts
  from_votes_received: 25, // 5 votes
  from_comments: 10, // 5 comments
  from_submissions: 0, // 0 submissions
  total: 85, // 85 total (Contributor)
};

/**
 * Contributor tier - High (approaching Regular)
 */
const contributorHighBreakdown: ReputationBreakdownType = {
  from_posts: 100, // 10 posts
  from_votes_received: 50, // 10 votes
  from_comments: 20, // 10 comments
  from_submissions: 0, // 0 submissions
  total: 170, // 170 total (Contributor, 30 pts to Regular)
};

/**
 * Regular tier (200-499 pts)
 */
const regularBreakdown: ReputationBreakdownType = {
  from_posts: 150, // 15 posts
  from_votes_received: 75, // 15 votes
  from_comments: 30, // 15 comments
  from_submissions: 50, // 1 merged submission
  total: 305, // 305 total (Regular)
};

/**
 * Expert tier (500-999 pts)
 */
const expertBreakdown: ReputationBreakdownType = {
  from_posts: 300, // 30 posts
  from_votes_received: 200, // 40 votes
  from_comments: 80, // 40 comments
  from_submissions: 100, // 2 merged submissions
  total: 680, // 680 total (Expert)
};

/**
 * Master tier (1000-2499 pts)
 */
const masterBreakdown: ReputationBreakdownType = {
  from_posts: 600, // 60 posts
  from_votes_received: 400, // 80 votes
  from_comments: 150, // 75 comments
  from_submissions: 200, // 4 merged submissions
  total: 1350, // 1350 total (Master)
};

/**
 * Legend tier (2500+ pts)
 */
const legendBreakdown: ReputationBreakdownType = {
  from_posts: 1500, // 150 posts
  from_votes_received: 1000, // 200 votes
  from_comments: 300, // 150 comments
  from_submissions: 500, // 10 merged submissions
  total: 3300, // 3300 total (Legend)
};

/**
 * Zero reputation (brand new user)
 */
const zeroBreakdown: ReputationBreakdownType = {
  from_posts: 0,
  from_votes_received: 0,
  from_comments: 0,
  from_submissions: 0,
  total: 0,
};

/**
 * Single activity type (posts only)
 */
const postsOnlyBreakdown: ReputationBreakdownType = {
  from_posts: 150,
  from_votes_received: 0,
  from_comments: 0,
  from_submissions: 0,
  total: 150,
};

/**
 * Votes dominant (high engagement)
 */
const votesDominantBreakdown: ReputationBreakdownType = {
  from_posts: 50,
  from_votes_received: 300,
  from_comments: 20,
  from_submissions: 50,
  total: 420,
};

/**
 * ==============================================================================
 * TIER VARIANTS
 * ==============================================================================
 */

/**
 * Default - Newcomer Tier
 * Brand new user starting their journey
 */
export const Default: Story = {
  args: {
    breakdown: newcomerBreakdown,
    showDetails: true,
    showProgress: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Newcomer tier (0-49 points).

**Features Shown:**
- Total: 31 points
- Tier: 🌱 Newcomer (gray badge)
- Progress to ⭐ Contributor: 62%
- Breakdown: Posts (10), Votes (15), Comments (6)
- 19 points needed for Contributor

**Use Case:**
New user who has made a few contributions.
        `,
      },
    },
  },
};

/**
 * Newcomer Tier - Fresh Start
 * Just started, minimal reputation
 */
export const NewcomerTier: Story = {
  args: {
    breakdown: newcomerBreakdown,
    showDetails: true,
    showProgress: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Newcomer tier with 31 points (🌱 gray badge).',
      },
    },
  },
};

/**
 * Contributor Tier - Active Member
 * Regular contributor, building reputation
 */
export const ContributorTier: Story = {
  args: {
    breakdown: contributorLowBreakdown,
    showDetails: true,
    showProgress: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Contributor tier (50-199 points).

**Features Shown:**
- Total: 85 points
- Tier: ⭐ Contributor (blue badge)
- Progress to 💎 Regular: 23%
- Breakdown: Posts (50), Votes (25), Comments (10)
- 115 points needed for Regular

**Use Case:**
Active community member with regular contributions.
        `,
      },
    },
  },
};

/**
 * Contributor High - Approaching Regular
 * Close to next tier advancement
 */
export const ContributorHigh: Story = {
  args: {
    breakdown: contributorHighBreakdown,
    showDetails: true,
    showProgress: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
High Contributor approaching Regular tier.

**Features Shown:**
- Total: 170 points
- Tier: ⭐ Contributor (blue badge)
- Progress to 💎 Regular: 80%
- Only 30 points needed for next tier

**Use Case:**
User about to reach next tier (motivation).
        `,
      },
    },
  },
};

/**
 * Regular Tier - Established Member
 * Consistent contributor, established reputation
 */
export const RegularTier: Story = {
  args: {
    breakdown: regularBreakdown,
    showDetails: true,
    showProgress: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Regular tier (200-499 points).

**Features Shown:**
- Total: 305 points
- Tier: 💎 Regular (purple badge)
- Progress to 🔥 Expert: 35%
- Breakdown includes first merged submission (50 pts)

**Use Case:**
Established community member with consistent activity.
        `,
      },
    },
  },
};

/**
 * Expert Tier - Advanced Contributor
 * Expert-level contributor with deep engagement
 */
export const ExpertTier: Story = {
  args: {
    breakdown: expertBreakdown,
    showDetails: true,
    showProgress: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Expert tier (500-999 points).

**Features Shown:**
- Total: 680 points
- Tier: 🔥 Expert (orange badge)
- Progress to 🏆 Master: 36%
- Balanced activity across all types

**Use Case:**
Expert contributor recognized for quality and consistency.
        `,
      },
    },
  },
};

/**
 * Master Tier - Community Leader
 * Master-level contributor leading the community
 */
export const MasterTier: Story = {
  args: {
    breakdown: masterBreakdown,
    showDetails: true,
    showProgress: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Master tier (1000-2499 points).

**Features Shown:**
- Total: 1350 points
- Tier: 🏆 Master (red badge)
- Progress to 👑 Legend: 23%
- High-value submissions (200 pts total)

**Use Case:**
Master contributor who mentors and leads the community.
        `,
      },
    },
  },
};

/**
 * Legend Tier - Legendary Status
 * Achieved legendary status (highest tier)
 */
export const LegendTier: Story = {
  args: {
    breakdown: legendBreakdown,
    showDetails: true,
    showProgress: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Legend tier (2500+ points) - Highest tier!

**Features Shown:**
- Total: 3300 points
- Tier: 👑 Legend (gold badge)
- No next tier (already at top)
- Progress bar hidden (no further tiers)
- Massive contribution across all activities

**Use Case:**
Legendary contributor who has achieved the highest recognition.
        `,
      },
    },
  },
};

/**
 * ==============================================================================
 * DISPLAY VARIANTS
 * ==============================================================================
 */

/**
 * With Details - Full Breakdown
 * Shows all details including chart and activity grid
 */
export const WithDetails: Story = {
  args: {
    breakdown: regularBreakdown,
    showDetails: true,
    showProgress: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Full details mode (showDetails=true).

**Features Shown:**
- Horizontal bar chart
- Activity grid with icons
- Point calculation reference (collapsible)
- All visual elements

**Use Case:**
Profile page or reputation details view.
        `,
      },
    },
  },
};

/**
 * Without Details - Compact View
 * Shows only total, tier, and progress
 */
export const WithoutDetails: Story = {
  args: {
    breakdown: regularBreakdown,
    showDetails: false,
    showProgress: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Compact mode (showDetails=false).

**Features Shown:**
- Total reputation score
- Current tier badge
- Progress bar
- No breakdown chart or grid

**Use Case:**
Compact profile card or sidebar widget.
        `,
      },
    },
  },
};

/**
 * Without Progress - No Next Tier
 * Hides progress bar (useful for Legend tier or compact views)
 */
export const WithoutProgress: Story = {
  args: {
    breakdown: regularBreakdown,
    showDetails: true,
    showProgress: false,
  },
  parameters: {
    docs: {
      description: {
        story: `
No progress mode (showProgress=false).

**Features Shown:**
- Total reputation score
- Current tier badge
- Breakdown details
- No progress bar

**Use Case:**
When progress to next tier is not relevant (e.g., Legend tier or static displays).
        `,
      },
    },
  },
};

/**
 * Minimal - No Details, No Progress
 * Most compact view (score and tier only)
 */
export const Minimal: Story = {
  args: {
    breakdown: expertBreakdown,
    showDetails: false,
    showProgress: false,
  },
  parameters: {
    docs: {
      description: {
        story: `
Minimal mode (both flags false).

**Features Shown:**
- Total reputation score
- Current tier badge with icon
- Tier description

**Use Case:**
Ultra-compact display in user cards or profile headers.
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
 * Zero Reputation - Brand New User
 * User with no reputation yet
 */
export const ZeroReputation: Story = {
  args: {
    breakdown: zeroBreakdown,
    showDetails: true,
    showProgress: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Zero reputation (brand new user).

**Features Shown:**
- Total: 0 points
- Tier: 🌱 Newcomer
- Progress to ⭐ Contributor: 0%
- No breakdown chart (hidden when total=0)
- Point calculation reference still shown

**Use Case:**
First-time user who hasn't earned any points yet.
        `,
      },
    },
  },
};

/**
 * Posts Only - Single Activity Type
 * Reputation from one activity type only
 */
export const PostsOnly: Story = {
  args: {
    breakdown: postsOnlyBreakdown,
    showDetails: true,
    showProgress: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Reputation from posts only.

**Features Shown:**
- Total: 150 points
- Tier: ⭐ Contributor
- Breakdown: 100% from posts
- Chart shows single dominant bar
- Other activities at 0 points

**Use Case:**
Content creator who focuses primarily on posting.
        `,
      },
    },
  },
};

/**
 * Votes Dominant - High Engagement
 * Reputation primarily from receiving votes
 */
export const VotesDominant: Story = {
  args: {
    breakdown: votesDominantBreakdown,
    showDetails: true,
    showProgress: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Reputation dominated by votes received.

**Features Shown:**
- Total: 420 points
- Tier: 💎 Regular
- Breakdown: 71% from votes (300/420)
- Chart shows votes as dominant bar
- High community appreciation

**Use Case:**
User whose content resonates strongly with the community.
        `,
      },
    },
  },
};

/**
 * Balanced Activities - Diverse Contributor
 * Reputation evenly distributed across activities
 */
export const BalancedActivities: Story = {
  args: {
    breakdown: expertBreakdown,
    showDetails: true,
    showProgress: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Balanced reputation across all activities.

**Features Shown:**
- Total: 680 points
- Tier: 🔥 Expert
- Balanced distribution: Posts (300), Votes (200), Comments (80), Submissions (100)
- Chart shows relatively even bars

**Use Case:**
Well-rounded contributor active in all areas.
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
    breakdown: regularBreakdown,
    showDetails: true,
    showProgress: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Interactive demo with all features.

**Try These Interactions:**
1. Click "How reputation is calculated" to expand/collapse point values
2. Observe progress bar animation
3. View breakdown chart with color-coded bars
4. Examine activity grid with point totals

**Features Demonstrated:**
- Total score: 305 points
- Tier: 💎 Regular (purple)
- Progress bar: 35% to Expert
- Breakdown chart with 4 activity types
- Activity grid with icons
- Point calculation reference (collapsible)

**Use Case:**
Full reputation display on user profile page.
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
 * Mobile Viewport - Compact Layout
 */
export const MobileViewport: Story = {
  args: {
    breakdown: regularBreakdown,
    showDetails: true,
    showProgress: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: `
Reputation breakdown on mobile viewport.

**Responsive Behavior:**
- Full-width card
- Activity grid stacks to single column
- Chart adjusts to container width
- Touch-friendly collapsible section
        `,
      },
    },
  },
};

/**
 * Tablet Viewport - Medium Layout
 */
export const TabletViewport: Story = {
  args: {
    breakdown: expertBreakdown,
    showDetails: true,
    showProgress: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'Reputation breakdown on tablet with optimized spacing.',
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
 * At Tier Boundary - Exactly 50 Points
 * User exactly at tier boundary
 */
export const AtTierBoundary: Story = {
  args: {
    breakdown: {
      from_posts: 30,
      from_votes_received: 15,
      from_comments: 4,
      from_submissions: 0,
      total: 49, // Exactly at Newcomer max
    },
    showDetails: true,
    showProgress: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Exactly at tier boundary (49 points).

**Features Shown:**
- Total: 49 points (max Newcomer)
- Tier: 🌱 Newcomer
- Progress to ⭐ Contributor: 98%
- 1 point needed for next tier!

**Use Case:**
User on the cusp of tier advancement.
        `,
      },
    },
  },
};

/**
 * Just Advanced - New Tier
 * User who just advanced to new tier
 */
export const JustAdvanced: Story = {
  args: {
    breakdown: {
      from_posts: 30,
      from_votes_received: 15,
      from_comments: 4,
      from_submissions: 0,
      total: 50, // Just reached Contributor
    },
    showDetails: true,
    showProgress: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Just advanced to new tier (50 points).

**Features Shown:**
- Total: 50 points
- Tier: ⭐ Contributor (just advanced!)
- Progress to 💎 Regular: 0%
- Fresh start on new tier

**Use Case:**
User who just reached new tier milestone.
        `,
      },
    },
  },
};
