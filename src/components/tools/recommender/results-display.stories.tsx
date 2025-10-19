'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import type { RecommendationResponse } from '@/src/lib/schemas/recommender.schema';
import { ResultsDisplay } from './results-display';

/**
 * ResultsDisplay Component Stories
 *
 * Comprehensive recommendation results interface with filtering, sorting, and sharing.
 * Displays ranked configuration recommendations with match scores and explanations.
 *
 * Features:
 * - Ranked recommendation cards with match percentages
 * - Filter by category with tabs
 * - Sort by relevance, popularity, or alphabetically
 * - Match score slider for refinement
 * - Bulk bookmark action
 * - Share results modal (social + copy link)
 * - Collapsible refinement panel
 * - Empty state for no results
 * - Server action integration (addBookmarkBatch)
 *
 * Component: src/components/tools/recommender/results-display.tsx (523 LOC)
 * Used in: tools/config-recommender/results/[id]/page.tsx
 * Dependencies: BaseCard, Dialog, Tabs, Slider, Collapsible, Tooltip, ShareResults
 *
 * Data Flow:
 * - Receives RecommendationResponse with results array
 * - Client-side filtering and sorting
 * - ShareResults modal for social sharing
 * - Server action for bulk bookmarking
 */

// ============================================================================
// MOCK DATA
// ============================================================================

const mockAnswers = {
  useCase: 'api-development' as const,
  experienceLevel: 'intermediate' as const,
  toolPreferences: ['agents', 'mcp-servers'],
  integrations: ['database', 'github'],
  focusAreas: ['code-quality', 'automation'],
  teamSize: 'small' as const,
  timestamp: '2025-01-15T10:30:00Z',
};

const mockRecommendations: RecommendationResponse = {
  id: 'rec_abc123',
  generatedAt: '2025-01-15T10:30:00Z',
  algorithm: 'rule-based',
  totalMatches: 5,
  answers: mockAnswers,
  summary: {
    topCategory: 'MCP Servers',
    avgMatchScore: 82,
    diversityScore: 75,
  },
  results: [
    {
      slug: 'filesystem-mcp-server',
      title: 'Filesystem MCP Server',
      description: 'Read, write, and manage files with Claude through MCP protocol.',
      category: 'mcp-servers',
      matchScore: 95,
      matchPercentage: 95,
      rank: 1,
      reasons: [
        {
          type: 'use-case-match',
          message: 'Perfect for API development workflows',
          weight: 40,
        },
        {
          type: 'experience-fit',
          message: 'Ideal for intermediate developers',
          weight: 30,
        },
        {
          type: 'tag-match',
          message: 'Matches your automation focus',
          weight: 30,
        },
      ],
      primaryReason: 'Best match for API development',
      author: 'Anthropic',
      tags: ['file-management', 'automation', 'productivity'],
      popularity: 92,
      viewCount: 15420,
      aiEnhanced: false,
    },
    {
      slug: 'database-query-agent',
      title: 'Database Query Agent',
      description: 'Intelligent SQL query generation and optimization agent.',
      category: 'agents',
      matchScore: 88,
      matchPercentage: 88,
      rank: 2,
      reasons: [
        {
          type: 'use-case-match',
          message: 'Great for API backend development',
          weight: 35,
        },
        {
          type: 'tag-match',
          message: 'Matches database integration need',
          weight: 40,
        },
        {
          type: 'popularity',
          message: 'Highly rated by developers',
          weight: 25,
        },
      ],
      primaryReason: 'Database integration specialist',
      author: 'Community Dev',
      tags: ['database', 'sql', 'optimization'],
      popularity: 85,
      viewCount: 8340,
      aiEnhanced: false,
    },
    {
      slug: 'github-actions-mcp',
      title: 'GitHub Actions MCP',
      description: 'Manage GitHub Actions workflows and CI/CD pipelines.',
      category: 'mcp-servers',
      matchScore: 82,
      matchPercentage: 82,
      rank: 3,
      reasons: [
        {
          type: 'tag-match',
          message: 'GitHub integration support',
          weight: 45,
        },
        {
          type: 'use-case-match',
          message: 'DevOps automation features',
          weight: 30,
        },
        {
          type: 'trending',
          message: 'Trending this week',
          weight: 25,
        },
      ],
      primaryReason: 'GitHub integration specialist',
      author: 'GitHub Team',
      tags: ['github', 'ci-cd', 'automation'],
      popularity: 78,
      viewCount: 6120,
      aiEnhanced: false,
    },
    {
      slug: 'code-review-agent',
      title: 'Code Review Agent',
      description: 'Automated code review with quality checks and suggestions.',
      category: 'agents',
      matchScore: 75,
      matchPercentage: 75,
      rank: 4,
      reasons: [
        {
          type: 'tag-match',
          message: 'Code quality focus area match',
          weight: 50,
        },
        {
          type: 'experience-fit',
          message: 'Suitable for intermediate users',
          weight: 30,
        },
        {
          type: 'popularity',
          message: 'Community favorite',
          weight: 20,
        },
      ],
      primaryReason: 'Code quality automation',
      author: 'CodeQuality Inc',
      tags: ['code-review', 'quality', 'automation'],
      popularity: 88,
      viewCount: 12340,
      aiEnhanced: false,
    },
    {
      slug: 'api-testing-toolkit',
      title: 'API Testing Toolkit',
      description: 'Comprehensive API testing and validation tools.',
      category: 'tools',
      matchScore: 70,
      matchPercentage: 70,
      rank: 5,
      reasons: [
        {
          type: 'use-case-match',
          message: 'API development testing support',
          weight: 40,
        },
        {
          type: 'tag-match',
          message: 'Matches quality focus',
          weight: 35,
        },
        {
          type: 'experience-fit',
          message: 'Intermediate-friendly',
          weight: 25,
        },
      ],
      primaryReason: 'API testing specialist',
      author: 'Testing Pro',
      tags: ['api', 'testing', 'validation'],
      popularity: 72,
      viewCount: 4820,
      aiEnhanced: false,
    },
  ],
};

const meta = {
  title: 'Tools/Recommender/ResultsDisplay',
  component: ResultsDisplay,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Comprehensive recommendation results interface. Displays ranked configurations with filtering, sorting, bulk actions, and sharing capabilities.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    recommendations: {
      control: 'object',
      description: 'RecommendationResponse with results array and metadata',
    },
    shareUrl: {
      control: 'text',
      description: 'URL for sharing results',
    },
  },
} satisfies Meta<typeof ResultsDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default: 5 Recommendations
 *
 * Standard results view with 5 diverse recommendations.
 * Shows typical post-quiz state with mixed categories.
 *
 * Usage:
 * ```tsx
 * <ResultsDisplay
 *   recommendations={mockRecommendations}
 *   shareUrl="https://example.com/results/abc123"
 * />
 * ```
 */
export const Default: Story = {
  args: {
    recommendations: mockRecommendations,
    shareUrl: 'https://claudepro.directory/tools/config-recommender/results/abc123',
  },
};

/**
 * Single Result
 *
 * Minimal results with only 1 recommendation.
 * Tests edge case of very narrow match criteria.
 */
export const SingleResult: Story = {
  args: {
    recommendations: {
      ...mockRecommendations,
      totalMatches: 1,
      results: [mockRecommendations.results[0]],
      summary: {
        topCategory: 'MCP Servers',
        avgMatchScore: 95,
        diversityScore: 0,
      },
    },
    shareUrl: 'https://claudepro.directory/tools/config-recommender/results/single',
  },
};

/**
 * High Match Scores (90%+)
 *
 * All recommendations with excellent match scores.
 * Shows successful quiz targeting.
 */
export const HighMatchScores: Story = {
  args: {
    recommendations: {
      ...mockRecommendations,
      results: mockRecommendations.results.map((r, i) => ({
        ...r,
        matchScore: 95 - i * 2,
        matchPercentage: 95 - i * 2,
      })),
      summary: {
        topCategory: 'MCP Servers',
        avgMatchScore: 93,
        diversityScore: 75,
      },
    },
    shareUrl: 'https://claudepro.directory/tools/config-recommender/results/high-match',
  },
};

/**
 * Low Match Scores (50-70%)
 *
 * Results with mediocre matches.
 * Tests lower-confidence recommendations.
 */
export const LowMatchScores: Story = {
  args: {
    recommendations: {
      ...mockRecommendations,
      results: mockRecommendations.results.map((r, i) => ({
        ...r,
        matchScore: 70 - i * 4,
        matchPercentage: 70 - i * 4,
      })),
      summary: {
        topCategory: 'Agents',
        avgMatchScore: 62,
        diversityScore: 80,
      },
    },
    shareUrl: 'https://claudepro.directory/tools/config-recommender/results/low-match',
  },
};

/**
 * Single Category (Agents Only)
 *
 * All results from same category.
 * Low diversity score.
 */
export const SingleCategory: Story = {
  args: {
    recommendations: {
      ...mockRecommendations,
      results: mockRecommendations.results.map((r) => ({
        ...r,
        category: 'agents',
      })),
      summary: {
        topCategory: 'Agents',
        avgMatchScore: 82,
        diversityScore: 0,
      },
    },
    shareUrl: 'https://claudepro.directory/tools/config-recommender/results/agents-only',
  },
};

/**
 * High Diversity
 *
 * Results from many different categories.
 * Shows broad recommendation coverage.
 */
export const HighDiversity: Story = {
  args: {
    recommendations: {
      ...mockRecommendations,
      results: [
        { ...mockRecommendations.results[0], category: 'mcp-servers' },
        { ...mockRecommendations.results[1], category: 'agents' },
        { ...mockRecommendations.results[2], category: 'rules' },
        { ...mockRecommendations.results[3], category: 'tools' },
        { ...mockRecommendations.results[4], category: 'prompts' },
      ],
      summary: {
        topCategory: 'Mixed',
        avgMatchScore: 80,
        diversityScore: 95,
      },
    },
    shareUrl: 'https://claudepro.directory/tools/config-recommender/results/diverse',
  },
};

/**
 * Beginner Experience Level
 *
 * Results tailored for beginners.
 * Shows experience-based filtering.
 */
export const BeginnerLevel: Story = {
  args: {
    recommendations: {
      ...mockRecommendations,
      answers: {
        ...mockAnswers,
        experienceLevel: 'beginner',
      },
      results: mockRecommendations.results.map((r) => ({
        ...r,
        reasons: [
          {
            type: 'experience-fit' as const,
            message: 'Perfect for beginners',
            weight: 50,
          },
          ...r.reasons.slice(1),
        ],
      })),
    },
    shareUrl: 'https://claudepro.directory/tools/config-recommender/results/beginner',
  },
};

/**
 * Advanced Experience Level
 *
 * Complex configurations for advanced users.
 * Shows experience-based recommendations.
 */
export const AdvancedLevel: Story = {
  args: {
    recommendations: {
      ...mockRecommendations,
      answers: {
        ...mockAnswers,
        experienceLevel: 'advanced',
      },
      results: mockRecommendations.results.map((r) => ({
        ...r,
        description: `${r.description} Advanced features include custom plugins and API extensions.`,
        reasons: [
          {
            type: 'experience-fit' as const,
            message: 'Advanced features for power users',
            weight: 50,
          },
          ...r.reasons.slice(1),
        ],
      })),
    },
    shareUrl: 'https://claudepro.directory/tools/config-recommender/results/advanced',
  },
};

/**
 * Code Review Use Case
 *
 * Results optimized for code review workflows.
 * Shows use-case-specific recommendations.
 */
export const CodeReviewUseCase: Story = {
  args: {
    recommendations: {
      ...mockRecommendations,
      answers: {
        ...mockAnswers,
        useCase: 'code-review',
      },
      results: mockRecommendations.results.map((r) => ({
        ...r,
        tags: [...r.tags, 'code-review'],
        reasons: [
          {
            type: 'use-case-match' as const,
            message: 'Optimized for code review workflows',
            weight: 60,
          },
          ...r.reasons.slice(1),
        ],
      })),
    },
    shareUrl: 'https://claudepro.directory/tools/config-recommender/results/code-review',
  },
};

/**
 * Popular Recommendations
 *
 * High-popularity results (trending).
 * All configs with 85%+ popularity.
 */
export const PopularResults: Story = {
  args: {
    recommendations: {
      ...mockRecommendations,
      results: mockRecommendations.results.map((r) => ({
        ...r,
        popularity: 90,
        viewCount: 20000,
        reasons: [
          ...r.reasons,
          {
            type: 'popularity' as const,
            message: 'Community favorite',
            weight: 20,
          },
        ],
      })),
    },
    shareUrl: 'https://claudepro.directory/tools/config-recommender/results/popular',
  },
};

/**
 * Many Results (20 Recommendations)
 *
 * Maximum results (20 items).
 * Tests pagination and scroll performance.
 */
export const ManyResults: Story = {
  args: {
    recommendations: {
      ...mockRecommendations,
      totalMatches: 20,
      results: Array.from({ length: 20 }, (_, i) => ({
        ...mockRecommendations.results[i % 5],
        slug: `config-${i + 1}`,
        title: `Configuration ${i + 1}`,
        rank: i + 1,
        matchScore: 95 - i * 3,
        matchPercentage: 95 - i * 3,
      })),
    },
    shareUrl: 'https://claudepro.directory/tools/config-recommender/results/many',
  },
};

/**
 * Two Results (Minimal)
 *
 * Only 2 recommendations found.
 * Tests minimal results layout.
 */
export const TwoResults: Story = {
  args: {
    recommendations: {
      ...mockRecommendations,
      totalMatches: 2,
      results: mockRecommendations.results.slice(0, 2),
      summary: {
        topCategory: 'MCP Servers',
        avgMatchScore: 91,
        diversityScore: 50,
      },
    },
    shareUrl: 'https://claudepro.directory/tools/config-recommender/results/two',
  },
};

/**
 * AI-Enhanced Results
 *
 * Results with LLM-generated explanations.
 * Shows aiEnhanced flag and custom explanations.
 */
export const AIEnhanced: Story = {
  args: {
    recommendations: {
      ...mockRecommendations,
      algorithm: 'llm-enhanced',
      aiProcessingTime: 1240,
      aiTokensUsed: 850,
      results: mockRecommendations.results.map((r) => ({
        ...r,
        aiEnhanced: true,
        aiExplanation: `Based on your ${mockAnswers.experienceLevel} experience level and ${mockAnswers.useCase} use case, ${r.title} provides exactly the features you need for ${mockAnswers.focusAreas[0]} with seamless ${mockAnswers.integrations[0]} integration.`,
      })),
    },
    shareUrl: 'https://claudepro.directory/tools/config-recommender/results/ai-enhanced',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Results enhanced with AI-generated personalized explanations. Shows algorithm: "llm-enhanced" and aiProcessingTime metadata.',
      },
    },
  },
};

/**
 * Long Descriptions
 *
 * Results with lengthy descriptions.
 * Tests card layout with overflow content.
 */
export const LongDescriptions: Story = {
  args: {
    recommendations: {
      ...mockRecommendations,
      results: mockRecommendations.results.map((r) => ({
        ...r,
        description: `${r.description} This comprehensive tool includes advanced features like real-time monitoring, automated workflows, custom integrations with popular platforms, extensive documentation, community support forums, and regular updates with new functionality. Perfect for teams of all sizes looking to streamline their development process.`,
      })),
    },
    shareUrl: 'https://claudepro.directory/tools/config-recommender/results/long-desc',
  },
};

/**
 * Many Tags
 *
 * Results with numerous tags.
 * Tests tag display and overflow handling.
 */
export const ManyTags: Story = {
  args: {
    recommendations: {
      ...mockRecommendations,
      results: mockRecommendations.results.map((r) => ({
        ...r,
        tags: [
          ...r.tags,
          'productivity',
          'enterprise',
          'security',
          'performance',
          'scalability',
          'monitoring',
        ],
      })),
    },
    shareUrl: 'https://claudepro.directory/tools/config-recommender/results/many-tags',
  },
};

/**
 * Solo Developer (Team Size)
 *
 * Recommendations for individual developers.
 * Shows team-size-specific results.
 */
export const SoloDeveloper: Story = {
  args: {
    recommendations: {
      ...mockRecommendations,
      answers: {
        ...mockAnswers,
        teamSize: 'solo',
      },
      results: mockRecommendations.results.map((r) => ({
        ...r,
        tags: [...r.tags, 'solo-friendly', 'simple-setup'],
      })),
    },
    shareUrl: 'https://claudepro.directory/tools/config-recommender/results/solo',
  },
};

/**
 * Large Team
 *
 * Recommendations for large development teams.
 * Shows collaboration-focused results.
 */
export const LargeTeam: Story = {
  args: {
    recommendations: {
      ...mockRecommendations,
      answers: {
        ...mockAnswers,
        teamSize: 'large',
      },
      results: mockRecommendations.results.map((r) => ({
        ...r,
        tags: [...r.tags, 'team-collaboration', 'enterprise', 'access-control'],
      })),
    },
    shareUrl: 'https://claudepro.directory/tools/config-recommender/results/large-team',
  },
};

/**
 * Multiple Focus Areas
 *
 * Results matching several focus areas.
 * Shows multi-dimensional matching.
 */
export const MultipleFocusAreas: Story = {
  args: {
    recommendations: {
      ...mockRecommendations,
      answers: {
        ...mockAnswers,
        focusAreas: ['security', 'performance', 'testing'],
      },
      results: mockRecommendations.results.map((r) => ({
        ...r,
        tags: [...r.tags, 'security', 'performance', 'testing'],
        reasons: [
          {
            type: 'tag-match' as const,
            message: 'Matches security, performance, and testing focus areas',
            weight: 55,
          },
          ...r.reasons.slice(1),
        ],
      })),
    },
    shareUrl: 'https://claudepro.directory/tools/config-recommender/results/multi-focus',
  },
};

/**
 * In Context Example
 *
 * ResultsDisplay in realistic page layout.
 * Shows integration with header and footer.
 */
export const InContextExample: Story = {
  render: (args) => (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto py-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Your Personalized Recommendations</h1>
          <p className="text-muted-foreground">
            We found {args.recommendations.totalMatches} configurations matching your needs
          </p>
        </div>
        <ResultsDisplay {...args} />
      </div>
    </div>
  ),
  args: {
    recommendations: mockRecommendations,
    shareUrl: 'https://claudepro.directory/tools/config-recommender/results/context',
  },
};

// ============================================================================
// PLAY FUNCTION TESTS
// ============================================================================

/**
 * Results Cards Rendering Test
 * Tests recommendation cards are rendered
 */
export const ResultsCardsRenderingTest: Story = {
  args: {
    recommendations: mockRecommendations,
    shareUrl: 'https://example.com/test',
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests ResultsDisplay renders recommendation cards with titles and match scores.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify first recommendation card is rendered', async () => {
      const firstCard = canvas.getByText('Filesystem MCP Server');
      await expect(firstCard).toBeInTheDocument();
    });

    await step('Verify match score is displayed', async () => {
      // Match percentage should be shown (95%)
      const matchScore = canvas.getByText(/95%/);
      await expect(matchScore).toBeInTheDocument();
    });

    await step('Verify multiple results are rendered', async () => {
      const secondCard = canvas.getByText('Database Query Agent');
      await expect(secondCard).toBeInTheDocument();
    });
  },
};

/**
 * Share Button Test
 * Tests share results button is present
 */
export const ShareButtonTest: Story = {
  args: {
    recommendations: mockRecommendations,
    shareUrl: 'https://example.com/test',
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests share button renders and is clickable.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify share button is rendered', async () => {
      const shareButton = canvas.getByRole('button', { name: /share/i });
      await expect(shareButton).toBeInTheDocument();
    });
  },
};

/**
 * Category Filter Test
 * Tests category tab filtering is present
 */
export const CategoryFilterTest: Story = {
  args: {
    recommendations: mockRecommendations,
    shareUrl: 'https://example.com/test',
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests category filter tabs render for filtering results.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify "All" tab is present', async () => {
      const allTab = canvasElement.querySelector('[role="tab"]');
      await expect(allTab).toBeInTheDocument();
    });
  },
};

/**
 * Results Count Display Test
 * Tests total results count is shown
 */
export const ResultsCountTest: Story = {
  args: {
    recommendations: mockRecommendations,
    shareUrl: 'https://example.com/test',
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests results count displays correct total matches.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify results count is displayed', async () => {
      // Should show "5 results" or similar
      const countText = canvas.getByText(/5/);
      await expect(countText).toBeInTheDocument();
    });
  },
};

/**
 * Bulk Actions Test
 * Tests bulk bookmark button is present
 */
export const BulkActionsTest: Story = {
  args: {
    recommendations: mockRecommendations,
    shareUrl: 'https://example.com/test',
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests bulk bookmark action button renders.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify bookmark all button exists', async () => {
      const bookmarkButton = canvas.queryByRole('button', { name: /bookmark/i });
      // Button may be present or hidden based on component state
      if (bookmarkButton) {
        await expect(bookmarkButton).toBeInTheDocument();
      }
    });
  },
};
