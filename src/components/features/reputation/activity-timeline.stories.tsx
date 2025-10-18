import type { Meta, StoryObj } from '@storybook/react';
import type { Activity } from '@/src/lib/schemas/activity.schema';
import { ActivityTimeline } from './activity-timeline';

/**
 * ActivityTimeline Component Stories
 *
 * Displays user activity history with filtering by type.
 * Shows posts, comments, votes, and submissions with status badges.
 *
 * Features:
 * - Filter tabs (All, Posts, Comments, Votes, Submissions)
 * - 4 activity types with icons (FileText, MessageSquare, ThumbsUp, GitPullRequest)
 * - Date formatting (today, yesterday, weeks/months/years ago)
 * - Submission status badges (merged, pending, approved, rejected)
 * - Empty states for each filter type
 * - Hover effects on cards
 * - External links for posts and PRs
 *
 * Component: src/components/features/reputation/activity-timeline.tsx (264 LOC)
 * Schema: activity.schema.ts (discriminated union)
 *
 * Activity Types:
 * - PostActivity: title, url, vote_count, comment_count
 * - CommentActivity: content, post_id, post_title
 * - VoteActivity: post_id, post_title
 * - SubmissionActivity: content_type, content_name, status, pr_url
 */
const meta = {
  title: 'Features/Reputation/ActivityTimeline',
  component: ActivityTimeline,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'User activity feed with filtering capabilities. Shows posts, comments, votes, and submissions with relative timestamps and status badges.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    initialActivities: {
      control: 'object',
      description: 'Array of Activity union type (discriminated by type field)',
    },
    summary: {
      control: 'object',
      description: 'Activity summary counts for filter tabs',
    },
  },
} satisfies Meta<typeof ActivityTimeline>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data helpers
const createMockActivity = {
  post: (overrides: Partial<Activity> = {}): Activity => ({
    id: crypto.randomUUID(),
    type: 'post',
    title: 'How to use TypeScript with React',
    url: 'https://example.com/article',
    vote_count: 42,
    comment_count: 15,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    ...overrides,
  }),

  comment: (overrides: Partial<Activity> = {}): Activity => ({
    id: crypto.randomUUID(),
    type: 'comment',
    content: 'Great article! This really helped me understand the concepts better.',
    post_id: crypto.randomUUID(),
    post_title: 'Introduction to Next.js App Router',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    ...overrides,
  }),

  vote: (overrides: Partial<Activity> = {}): Activity => ({
    id: crypto.randomUUID(),
    type: 'vote',
    post_id: crypto.randomUUID(),
    post_title: 'Building Scalable React Applications',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    ...overrides,
  }),

  submission: (overrides: Partial<Activity> = {}): Activity => ({
    id: crypto.randomUUID(),
    type: 'submission',
    content_type: 'MCP Server',
    content_name: 'GitHub Integration MCP',
    status: 'merged',
    pr_url: 'https://github.com/owner/repo/pull/123',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
    ...overrides,
  }),
};

/**
 * Default: All Activity Types
 *
 * Shows mix of all 4 activity types with "All" filter selected.
 * Demonstrates filtering UI and different activity card layouts.
 *
 * Filter tabs show counts: All (8), Posts (2), Comments (2), Votes (2), Submissions (2)
 */
export const Default: Story = {
  args: {
    initialActivities: [
      createMockActivity.post({
        title: 'Getting Started with Claude Code',
        vote_count: 128,
        comment_count: 34,
        created_at: new Date().toISOString(), // Today
      }),
      createMockActivity.comment({
        content: 'This is exactly what I was looking for! Thanks for sharing.',
        post_title: 'Best Practices for MCP Server Development',
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      }),
      createMockActivity.vote({
        post_title: 'Understanding Anthropic API Rate Limits',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Yesterday
      }),
      createMockActivity.submission({
        content_type: 'Agent',
        content_name: 'TypeScript Code Analyzer',
        status: 'merged',
        pr_url: 'https://github.com/owner/repo/pull/456',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      }),
      createMockActivity.post({
        title: 'How I Built a Custom MCP Server',
        url: null, // Text-only post
        vote_count: 67,
        comment_count: 21,
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      }),
      createMockActivity.comment({
        content:
          'Could you explain more about the authentication flow? I am having trouble implementing it.',
        post_title: 'Secure Authentication Patterns',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
      }),
      createMockActivity.vote({
        post_title: 'Community Guidelines Update',
        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks ago
      }),
      createMockActivity.submission({
        content_type: 'Command',
        content_name: 'Git Integration Command',
        status: 'pending',
        pr_url: null,
        created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(), // 3 weeks ago
      }),
    ],
    summary: {
      total_posts: 2,
      total_comments: 2,
      total_votes: 2,
      total_submissions: 2,
    },
  },
};

/**
 * Filter: Posts Only
 *
 * Shows only post activities.
 * Demonstrates:
 * - Post with URL (external link icon)
 * - Post without URL (text-only)
 * - Vote and comment counts
 * - "Posted" badge
 */
export const PostsOnly: Story = {
  args: {
    initialActivities: [
      createMockActivity.post({
        title: 'Building Production-Ready MCP Servers',
        url: 'https://example.com/mcp-guide',
        vote_count: 245,
        comment_count: 89,
        created_at: new Date().toISOString(),
      }),
      createMockActivity.post({
        title: 'Ask Me Anything: Claude Code Tips and Tricks',
        url: null,
        vote_count: 178,
        comment_count: 143,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      }),
      createMockActivity.post({
        title: 'Introducing Our New Agent Marketplace',
        url: 'https://example.com/marketplace',
        vote_count: 512,
        comment_count: 67,
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    ],
    summary: {
      total_posts: 3,
      total_comments: 0,
      total_votes: 0,
      total_submissions: 0,
    },
  },
};

/**
 * Filter: Comments Only
 *
 * Shows only comment activities.
 * Demonstrates:
 * - Comment content with line-clamp-2
 * - Related post title
 * - "Comment" badge
 */
export const CommentsOnly: Story = {
  args: {
    initialActivities: [
      createMockActivity.comment({
        content:
          'This is incredibly useful! I implemented it in my project and it works perfectly.',
        post_title: 'Advanced TypeScript Patterns',
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      }),
      createMockActivity.comment({
        content:
          'Have you considered adding support for webhooks? It would be really helpful for my use case where I need real-time notifications.',
        post_title: 'REST API Best Practices',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      }),
      createMockActivity.comment({
        content: 'Great writeup! 👍',
        post_title: 'Documentation Strategy Guide',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    ],
    summary: {
      total_posts: 0,
      total_comments: 3,
      total_votes: 0,
      total_submissions: 0,
    },
  },
};

/**
 * Filter: Votes Only
 *
 * Shows only vote activities.
 * Demonstrates:
 * - "Upvoted" text with post title
 * - "Voted" badge
 * - Simple, compact layout
 */
export const VotesOnly: Story = {
  args: {
    initialActivities: [
      createMockActivity.vote({
        post_title: 'How to Debug MCP Servers Effectively',
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
      }),
      createMockActivity.vote({
        post_title: 'Community Contribution Guidelines',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      }),
      createMockActivity.vote({
        post_title: 'Q3 Roadmap Update',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Yesterday
      }),
      createMockActivity.vote({
        post_title: 'Announcing New Features',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      }),
    ],
    summary: {
      total_posts: 0,
      total_comments: 0,
      total_votes: 4,
      total_submissions: 0,
    },
  },
};

/**
 * Filter: Submissions Only
 *
 * Shows only submission activities.
 * Demonstrates all 4 submission statuses:
 * - merged (default badge, green)
 * - pending (secondary badge)
 * - approved (secondary badge)
 * - rejected (destructive badge, red)
 *
 * Also shows:
 * - Content type badge (MCP Server, Agent, Rule, etc.)
 * - PR URL with external link
 * - No PR URL (pending submissions)
 */
export const SubmissionsOnly: Story = {
  args: {
    initialActivities: [
      createMockActivity.submission({
        content_type: 'MCP Server',
        content_name: 'Slack Integration MCP',
        status: 'merged',
        pr_url: 'https://github.com/owner/repo/pull/789',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      }),
      createMockActivity.submission({
        content_type: 'Agent',
        content_name: 'Code Review Assistant',
        status: 'pending',
        pr_url: null,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      }),
      createMockActivity.submission({
        content_type: 'Rule',
        content_name: 'TypeScript Strict Mode Rules',
        status: 'approved',
        pr_url: 'https://github.com/owner/repo/pull/654',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      }),
      createMockActivity.submission({
        content_type: 'Command',
        content_name: 'Database Migration Command',
        status: 'rejected',
        pr_url: 'https://github.com/owner/repo/pull/321',
        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    ],
    summary: {
      total_posts: 0,
      total_comments: 0,
      total_votes: 0,
      total_submissions: 4,
    },
  },
};

/**
 * Empty State: No Activity
 *
 * Shows empty state message when filter has no results.
 * Component displays: "No activity yet" (for "all" filter)
 *
 * Tests empty state UI for all filter tabs.
 */
export const EmptyState: Story = {
  args: {
    initialActivities: [],
    summary: {
      total_posts: 0,
      total_comments: 0,
      total_votes: 0,
      total_submissions: 0,
    },
  },
};

/**
 * Date Formatting Examples
 *
 * Demonstrates relative date formatting:
 * - "Today" (same day)
 * - "Yesterday" (1 day ago)
 * - "X days ago" (< 7 days)
 * - "X weeks ago" (< 30 days)
 * - "X months ago" (< 365 days)
 * - "Mon DD, YYYY" (>= 365 days)
 *
 * Tests formatDate() utility function.
 */
export const DateFormatting: Story = {
  args: {
    initialActivities: [
      createMockActivity.post({
        title: 'Posted today',
        created_at: new Date().toISOString(),
      }),
      createMockActivity.post({
        title: 'Posted yesterday',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      }),
      createMockActivity.post({
        title: 'Posted 4 days ago',
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      }),
      createMockActivity.post({
        title: 'Posted 2 weeks ago',
        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      }),
      createMockActivity.post({
        title: 'Posted 3 months ago',
        created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      }),
      createMockActivity.post({
        title: 'Posted over a year ago',
        created_at: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    ],
    summary: {
      total_posts: 6,
      total_comments: 0,
      total_votes: 0,
      total_submissions: 0,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Check timestamps to see relative date formatting in action.',
      },
    },
  },
};

/**
 * High Activity User
 *
 * Real-world example: Power user with lots of activity.
 * Shows realistic mix with high volume.
 */
export const HighActivityUser: Story = {
  args: {
    initialActivities: Array.from({ length: 15 }, (_, i) => {
      const types: Array<'post' | 'comment' | 'vote' | 'submission'> = [
        'post',
        'comment',
        'vote',
        'submission',
      ];
      const type = types[i % 4];
      return createMockActivity[type]({
        created_at: new Date(Date.now() - i * 2 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }),
    summary: {
      total_posts: 4,
      total_comments: 4,
      total_votes: 4,
      total_submissions: 3,
    },
  },
  parameters: {
    docs: {
      description: {
        story: '15 activities showing scrollable timeline with varied content.',
      },
    },
  },
};

/**
 * Interactive: Filter Switching
 *
 * Demonstrates interactive filter tabs.
 * Click tabs to filter activity types.
 * Active tab shows primary styling, counts update.
 */
export const InteractiveFiltering: Story = {
  args: Default.args,
  parameters: {
    docs: {
      description: {
        story:
          'Click filter tabs to see different activity types. Active tab highlighted in primary color.',
      },
    },
  },
};
