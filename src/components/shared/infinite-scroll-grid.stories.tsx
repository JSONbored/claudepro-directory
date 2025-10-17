'use client';

import type { Meta, StoryObj } from '@storybook/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { InfiniteScrollGrid } from './infinite-scroll-grid';

// Mock data item type
interface MockItem {
  id: number;
  title: string;
  description: string;
}

// Generate mock items
const generateMockItems = (count: number): MockItem[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    title: `Item ${i + 1}`,
    description: `This is the description for item ${i + 1}. It contains some sample text to demonstrate the content.`,
  }));
};

// Simple card renderer
const renderCard = (item: MockItem) => (
  <Card>
    <CardHeader>
      <CardTitle>{item.title}</CardTitle>
      <CardDescription>{item.description}</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">ID: {item.id}</p>
    </CardContent>
  </Card>
);

const meta = {
  title: 'Shared/InfiniteScrollGrid',
  component: InfiniteScrollGrid,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Production-grade infinite scroll grid using Intersection Observer. Optimized for 10,000+ items with constant memory usage. Features responsive CSS Grid, error boundaries per item, and configurable batch loading.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    items: {
      control: false,
      description: 'Array of items to display',
    },
    renderItem: {
      control: false,
      description: 'Function to render each item',
    },
    gap: {
      control: 'number',
      description: 'Gap between grid items in pixels',
    },
    batchSize: {
      control: 'number',
      description: 'Number of items to load per batch',
    },
    emptyMessage: {
      control: 'text',
      description: 'Message shown when no items exist',
    },
    loadingMessage: {
      control: 'text',
      description: 'Message shown while loading more items',
    },
    rootMargin: {
      control: 'text',
      description: 'Root margin for intersection observer',
    },
    threshold: {
      control: 'number',
      description: 'Threshold for intersection observer',
    },
  },
} satisfies Meta<typeof InfiniteScrollGrid<MockItem>>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default infinite scroll with 100 items
 */
export const Default: Story = {
  render: () => (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6">Infinite Scroll Grid</h1>
        <InfiniteScrollGrid<MockItem>
          items={generateMockItems(100)}
          renderItem={renderCard}
          keyExtractor={(item) => item.id}
          gap={24}
          batchSize={30}
        />
      </div>
    </div>
  ),
};

/**
 * Small batch size (10 items per load)
 */
export const SmallBatchSize: Story = {
  render: () => (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6">Small Batch Size (10 items)</h1>
        <p className="text-muted-foreground mb-4">
          Demonstrates more frequent loading with smaller batches.
        </p>
        <InfiniteScrollGrid<MockItem>
          items={generateMockItems(50)}
          renderItem={renderCard}
          keyExtractor={(item) => item.id}
          gap={24}
          batchSize={10}
        />
      </div>
    </div>
  ),
};

/**
 * Large dataset (1000 items)
 */
export const LargeDataset: Story = {
  render: () => (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6">Large Dataset (1000 items)</h1>
        <p className="text-muted-foreground mb-4">
          Demonstrates performance with a large number of items. Memory usage remains constant.
        </p>
        <InfiniteScrollGrid<MockItem>
          items={generateMockItems(1000)}
          renderItem={renderCard}
          keyExtractor={(item) => item.id}
          gap={24}
          batchSize={30}
        />
      </div>
    </div>
  ),
};

/**
 * Empty state
 */
export const EmptyState: Story = {
  render: () => (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6">Empty State</h1>
        <InfiniteScrollGrid<MockItem>
          items={[]}
          renderItem={renderCard}
          keyExtractor={(item) => item.id}
          gap={24}
          emptyMessage="No items found. Try adjusting your filters."
        />
      </div>
    </div>
  ),
};

/**
 * Custom gap spacing
 */
export const CustomGap: Story = {
  render: () => (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6">Custom Gap (48px)</h1>
        <InfiniteScrollGrid<MockItem>
          items={generateMockItems(60)}
          renderItem={renderCard}
          keyExtractor={(item) => item.id}
          gap={48}
          batchSize={20}
        />
      </div>
    </div>
  ),
};

/**
 * Compact spacing
 */
export const CompactSpacing: Story = {
  render: () => (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6">Compact Spacing (12px)</h1>
        <InfiniteScrollGrid<MockItem>
          items={generateMockItems(60)}
          renderItem={renderCard}
          keyExtractor={(item) => item.id}
          gap={12}
          batchSize={20}
        />
      </div>
    </div>
  ),
};

/**
 * Custom loading message
 */
export const CustomLoadingMessage: Story = {
  render: () => (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6">Custom Loading Message</h1>
        <InfiniteScrollGrid<MockItem>
          items={generateMockItems(100)}
          renderItem={renderCard}
          keyExtractor={(item) => item.id}
          gap={24}
          batchSize={15}
          loadingMessage="Fetching more items..."
        />
      </div>
    </div>
  ),
};

/**
 * Simple item renderer
 */
export const SimpleItems: Story = {
  render: () => (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6">Simple Items</h1>
        <InfiniteScrollGrid<MockItem>
          items={generateMockItems(200)}
          renderItem={(item) => (
            <div className="p-6 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
              <h3 className="font-semibold text-lg">{item.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
            </div>
          )}
          keyExtractor={(item) => item.id}
          gap={16}
          batchSize={24}
        />
      </div>
    </div>
  ),
};

/**
 * With colored items
 */
export const ColoredItems: Story = {
  render: () => {
    const colors = ['bg-red-50', 'bg-blue-50', 'bg-green-50', 'bg-yellow-50', 'bg-purple-50'];
    const items = generateMockItems(150);

    return (
      <div className="min-h-screen bg-background p-8">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-6">Colored Items</h1>
          <InfiniteScrollGrid<MockItem>
            items={items}
            renderItem={(item) => (
              <div
                className={`p-6 border rounded-lg ${colors[item.id % colors.length]} dark:opacity-80`}
              >
                <h3 className="font-semibold text-lg">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
              </div>
            )}
            keyExtractor={(item) => item.id}
            gap={20}
            batchSize={30}
          />
        </div>
      </div>
    );
  },
};

/**
 * Performance showcase with 5000 items
 */
export const PerformanceShowcase: Story = {
  render: () => (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6">Performance: 5000 Items</h1>
        <p className="text-muted-foreground mb-4">
          This grid contains 5000 items but only renders what's visible. Memory usage remains
          constant regardless of total items.
        </p>
        <InfiniteScrollGrid<MockItem>
          items={generateMockItems(5000)}
          renderItem={(item) => (
            <div className="p-4 border rounded-lg bg-card">
              <p className="font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-1">ID: {item.id}</p>
            </div>
          )}
          keyExtractor={(item) => item.id}
          gap={16}
          batchSize={50}
        />
      </div>
    </div>
  ),
};
