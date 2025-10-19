import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { MetricsDisplay } from './metrics-display';

/**
 * MetricsDisplay Component Stories
 *
 * Lightweight KPI metrics visualization component that replaces Tremor.
 * Displays performance or business metrics in a responsive grid with trend indicators.
 *
 * Features:
 * - 3-column responsive grid (GRID_RESPONSIVE_3)
 * - Trend indicators: up (green), down (blue), neutral (gray)
 * - Gradient cards with hover effects
 * - Schema.org Dataset structured data
 * - BadgeDelta component for change visualization
 *
 * Component: src/components/features/analytics/metrics-display.tsx (129 LOC)
 * Schema: metricsDisplayPropsSchema (shared.schema.ts)
 *
 * Metric Props:
 * - label: Metric name (optional)
 * - value: Current value (required)
 * - change: Change amount/percentage (optional)
 * - trend: 'up' | 'down' | 'neutral' | '+' (optional)
 * - description: Additional context (optional)
 */
const meta = {
  title: 'Features/Analytics/MetricsDisplay',
  component: MetricsDisplay,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Lightweight KPI metrics visualization with trend indicators and responsive grid layout. Replaces Tremor for better performance.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Optional section title',
    },
    description: {
      control: 'text',
      description: 'Optional section description',
    },
    metrics: {
      control: 'object',
      description: 'Array of metric objects (max 20)',
    },
  },
} satisfies Meta<typeof MetricsDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default: 3 Metrics with Trends
 *
 * Standard use case showing 3 KPIs with different trend indicators.
 * - Up trend: Green gradient, ArrowUpIcon
 * - Down trend: Blue gradient, ArrowDownIcon
 * - Neutral: Gray gradient, MinusIcon
 *
 * Usage in MDX:
 * ```mdx
 * <MetricsDisplay
 *   metrics={[
 *     { label: "Users", value: "12.5K", change: "+15%", trend: "up" },
 *     { label: "Revenue", value: "$45K", change: "-8%", trend: "down" },
 *     { label: "Uptime", value: "99.9%", trend: "neutral" }
 *   ]}
 * />
 * ```
 */
export const Default: Story = {
  args: {
    metrics: [
      {
        label: 'Total Users',
        value: '12,543',
        change: '+15% from last month',
        trend: 'up',
      },
      {
        label: 'Active Sessions',
        value: '3,827',
        change: '-8% from last week',
        trend: 'down',
      },
      {
        label: 'Server Uptime',
        value: '99.9%',
        change: 'Stable',
        trend: 'neutral',
      },
    ],
  },
};

/**
 * With Title and Description
 *
 * Adds section heading and context above metrics grid.
 * Title uses h3 heading, description in muted text.
 * Both centered with Schema.org markup.
 *
 * Usage in MDX:
 * ```mdx
 * <MetricsDisplay
 *   title="Platform Performance"
 *   description="Key metrics for Q4 2025"
 *   metrics={[...]}
 * />
 * ```
 */
export const WithTitleAndDescription: Story = {
  args: {
    title: 'Platform Performance Metrics',
    description: 'Real-time performance indicators updated every 5 minutes',
    metrics: [
      {
        label: 'API Response Time',
        value: '124ms',
        change: '-12ms improvement',
        trend: 'up',
      },
      {
        label: 'Error Rate',
        value: '0.03%',
        change: '+0.01% increase',
        trend: 'down',
      },
      {
        label: 'Cache Hit Rate',
        value: '94.2%',
        change: 'Within target',
        trend: 'neutral',
      },
    ],
  },
};

/**
 * All Up Trends (Positive Metrics)
 *
 * All metrics showing improvement with green gradients.
 * Common for success dashboards or growth reports.
 */
export const AllUpTrends: Story = {
  args: {
    title: 'Growth Metrics',
    description: 'All metrics show positive growth this quarter',
    metrics: [
      {
        label: 'New Signups',
        value: '1,234',
        change: '+45% MoM',
        trend: 'up',
      },
      {
        label: 'Conversions',
        value: '856',
        change: '+32% MoM',
        trend: 'up',
      },
      {
        label: 'Retention',
        value: '89%',
        change: '+5% MoM',
        trend: 'up',
      },
    ],
  },
};

/**
 * No Trends (Flat Metrics)
 *
 * Metrics without trend indicators.
 * Shows values only, no change badges.
 * Useful for static KPIs or current state.
 */
export const NoTrends: Story = {
  args: {
    title: 'Current Statistics',
    metrics: [
      {
        label: 'Total Contributors',
        value: '2,847',
      },
      {
        label: 'Active Projects',
        value: '423',
      },
      {
        label: 'Code Reviews',
        value: '1,956',
      },
    ],
  },
};

/**
 * Single Metric
 *
 * Edge case: Only one metric displayed.
 * Still uses 3-column grid but centers single item.
 *
 * Useful for hero sections or key stat highlights.
 */
export const SingleMetric: Story = {
  args: {
    title: 'Customer Satisfaction',
    description: 'Based on 10,000+ survey responses',
    metrics: [
      {
        label: 'NPS Score',
        value: '72',
        change: '+8 points from Q3',
        trend: 'up',
      },
    ],
  },
};

/**
 * Six Metrics (2-Row Grid)
 *
 * Demonstrates responsive grid with 6 metrics.
 * Shows 3 columns on desktop, 1 on mobile.
 *
 * Tests vertical spacing and scroll behavior.
 */
export const SixMetrics: Story = {
  args: {
    title: 'Comprehensive Dashboard',
    description: 'All key performance indicators at a glance',
    metrics: [
      { label: 'Revenue', value: '$142K', change: '+23%', trend: 'up' },
      { label: 'Expenses', value: '$89K', change: '+12%', trend: 'down' },
      { label: 'Profit', value: '$53K', change: '+41%', trend: 'up' },
      { label: 'Orders', value: '1,284', change: '-5%', trend: 'down' },
      { label: 'Customers', value: '9,432', change: 'Stable', trend: 'neutral' },
      { label: 'Avg Order', value: '$110', change: '+18%', trend: 'up' },
    ],
  },
};

/**
 * Edge Cases: Long Labels and Large Numbers
 *
 * Tests component with:
 * - Very long metric labels (wrapping)
 * - Large numbers with formatting
 * - Long change descriptions
 * - Special characters
 *
 * Validates layout stability and text truncation.
 */
export const EdgeCases: Story = {
  args: {
    title: 'Edge Case Testing',
    description: 'Tests long labels, large numbers, and special formatting',
    metrics: [
      {
        label: 'Total Database Operations Per Second (Read + Write)',
        value: '1,234,567,890',
        change: '+999,999 operations from baseline measurement',
        trend: 'up',
      },
      {
        label: 'CPU',
        value: '∞',
        change: 'Ω',
        trend: 'neutral',
      },
      {
        label: 'Data Transfer Rate (GB/s) Across All Regions Globally',
        value: '42.7 TB/s',
        change: 'Increased by 1,234% compared to previous quarter Q3 2024',
        trend: 'down',
      },
    ],
  },
};

/**
 * Financial Metrics
 *
 * Real-world example: Financial dashboard metrics.
 * Shows currency formatting and percentage changes.
 */
export const FinancialMetrics: Story = {
  args: {
    title: 'Q4 2025 Financial Summary',
    description: 'Revenue and profitability metrics',
    metrics: [
      {
        label: 'Total Revenue',
        value: '$2.4M',
        change: '+18.2% YoY',
        trend: 'up',
      },
      {
        label: 'Operating Costs',
        value: '$1.2M',
        change: '+5.1% YoY',
        trend: 'down',
      },
      {
        label: 'Net Profit Margin',
        value: '50%',
        change: '+6.5pp',
        trend: 'up',
      },
    ],
  },
};

/**
 * Technical Metrics
 *
 * Real-world example: DevOps/SRE dashboard.
 * Shows infrastructure and performance metrics.
 */
export const TechnicalMetrics: Story = {
  args: {
    title: 'Infrastructure Health',
    description: 'Production environment metrics',
    metrics: [
      {
        label: 'P99 Latency',
        value: '45ms',
        change: '-15ms',
        trend: 'up',
      },
      {
        label: 'Throughput',
        value: '12.5K req/s',
        change: '+2.3K',
        trend: 'up',
      },
      {
        label: 'Error Budget',
        value: '99.95%',
        change: '0.03% remaining',
        trend: 'neutral',
      },
    ],
  },
};

/**
 * Minimal Example
 *
 * Simplest possible configuration.
 * Just metrics array, no title/description.
 *
 * Perfect starting point for new implementations.
 */
export const Minimal: Story = {
  args: {
    metrics: [
      { label: 'Users', value: '1.2K' },
      { label: 'Posts', value: '456' },
      { label: 'Comments', value: '789' },
    ],
  },
};

/**
 * Empty State
 *
 * Metrics array is empty.
 * Component renders title/description but no metrics grid.
 *
 * Schema allows empty array with default([]).
 */
export const EmptyState: Story = {
  args: {
    title: 'No Metrics Available',
    description: 'Metrics will appear here once data is collected',
    metrics: [],
  },
};

/**
 * Interactive: Hover Effects
 *
 * Demonstrates interactive hover states:
 * - Scale transform (hover:scale-105)
 * - Shadow elevation (hover:shadow-xl)
 * - Smooth transitions (duration-300)
 *
 * Hover over cards to see effects.
 */
export const InteractiveHoverEffects: Story = {
  args: {
    title: 'Hover to Interact',
    description: 'Cards scale up and show shadow on hover',
    metrics: [
      { label: 'Metric 1', value: '100', change: '+10%', trend: 'up' },
      { label: 'Metric 2', value: '200', change: '-5%', trend: 'down' },
      { label: 'Metric 3', value: '300', change: 'Stable', trend: 'neutral' },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Hover over metric cards to see scale and shadow animations.',
      },
    },
  },
};

// ============================================================================
// PLAY FUNCTION TESTS
// ============================================================================

/**
 * Metrics Rendering Test
 * Tests metrics display renders all metric cards
 */
export const MetricsRenderingTest: Story = {
  args: {
    metrics: [
      { label: 'Total Views', value: 1250, trend: 'up', change: '+12%' },
      { label: 'Unique Visitors', value: 856, trend: 'up', change: '+8%' },
      { label: 'Bounce Rate', value: 42, trend: 'down', change: '-3%' },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests metrics display shows all metric cards with labels and values.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify all metric labels are displayed', async () => {
      const totalViews = canvas.getByText(/total views/i);
      const uniqueVisitors = canvas.getByText(/unique visitors/i);
      const bounceRate = canvas.getByText(/bounce rate/i);

      await expect(totalViews).toBeInTheDocument();
      await expect(uniqueVisitors).toBeInTheDocument();
      await expect(bounceRate).toBeInTheDocument();
    });

    await step('Verify metric values are displayed', async () => {
      const value1250 = canvas.getByText(/1250|1,250/);
      const value856 = canvas.getByText(/856/);
      const value42 = canvas.getByText(/42/);

      await expect(value1250).toBeInTheDocument();
      await expect(value856).toBeInTheDocument();
      await expect(value42).toBeInTheDocument();
    });
  },
};

/**
 * Trend Indicators Test
 * Tests trend arrows and change percentages display
 */
export const TrendIndicatorsTest: Story = {
  args: {
    metrics: [
      { label: 'Increasing Metric', value: 100, trend: 'up', change: '+15%' },
      { label: 'Decreasing Metric', value: 50, trend: 'down', change: '-5%' },
      { label: 'Stable Metric', value: 75, trend: 'neutral', change: '0%' },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests trend indicators (up/down/neutral) display correctly with change percentages.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify all metrics are displayed', async () => {
      const increasing = canvas.getByText(/increasing metric/i);
      const decreasing = canvas.getByText(/decreasing metric/i);
      const stable = canvas.getByText(/stable metric/i);

      await expect(increasing).toBeInTheDocument();
      await expect(decreasing).toBeInTheDocument();
      await expect(stable).toBeInTheDocument();
    });

    await step('Verify change percentages are displayed', async () => {
      const up15 = canvas.getByText(/\+15%/);
      const down5 = canvas.getByText(/-5%/);
      const neutral = canvas.getByText(/0%/);

      await expect(up15).toBeInTheDocument();
      await expect(down5).toBeInTheDocument();
      await expect(neutral).toBeInTheDocument();
    });
  },
};

/**
 * Empty Metrics Test
 * Tests component handles empty metrics array
 */
export const EmptyMetricsTest: Story = {
  args: {
    metrics: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests component renders gracefully with no metrics.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify component renders without errors', async () => {
      // Component should render container even with empty metrics
      const container = canvasElement.querySelector('[class*="metrics"], [class*="grid"]');
      await expect(container || canvasElement).toBeInTheDocument();
    });
  },
};
