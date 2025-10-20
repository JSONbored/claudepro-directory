/**
 * ReadProgress Storybook Stories
 *
 * Visual testing for the read progress bar component.
 * Tests different variants, positions, and configurations.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ReadProgress, ReadProgressPresets } from './read-progress';

const meta: Meta<typeof ReadProgress> = {
  title: 'Content/ReadProgress',
  component: ReadProgress,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Scroll progress indicator using motion.dev for smooth 60fps animations. Respects prefers-reduced-motion.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ReadProgress>;

/**
 * Default read progress bar
 * Top position, accent color, 2px height
 */
export const Default: Story = {
  render: () => (
    <div>
      <ReadProgress />
      <div className="container mx-auto px-4 py-12 space-y-4">
        <h1 className="text-4xl font-bold">Scroll to See Progress</h1>
        <p className="text-muted-foreground">
          The progress bar at the top shows how far you've scrolled through this content.
        </p>
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">Section {i + 1}</h2>
            <p className="text-muted-foreground">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
              exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
          </div>
        ))}
      </div>
    </div>
  ),
};

/**
 * Bold variant - 4px height for more visibility
 */
export const Bold: Story = {
  render: () => (
    <div>
      <ReadProgressPresets.bold />
      <div className="container mx-auto px-4 py-12 space-y-4">
        <h1 className="text-4xl font-bold">Bold Progress Bar (4px)</h1>
        <p className="text-muted-foreground">
          Thicker progress bar for better visibility on long articles.
        </p>
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">Section {i + 1}</h2>
            <p className="text-muted-foreground">Content section...</p>
          </div>
        ))}
      </div>
    </div>
  ),
};

/**
 * Bottom position - useful if you have a sticky header
 */
export const Bottom: Story = {
  render: () => (
    <div>
      <ReadProgressPresets.bottom />
      <div className="container mx-auto px-4 py-12 space-y-4">
        <h1 className="text-4xl font-bold">Bottom Position</h1>
        <p className="text-muted-foreground">Progress bar appears at the bottom of the viewport.</p>
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">Section {i + 1}</h2>
            <p className="text-muted-foreground">Content section...</p>
          </div>
        ))}
      </div>
    </div>
  ),
};

/**
 * Subtle variant - 1px, foreground color
 * Less distracting for immersive reading
 */
export const Subtle: Story = {
  render: () => (
    <div>
      <ReadProgressPresets.subtle />
      <div className="container mx-auto px-4 py-12 space-y-4">
        <h1 className="text-4xl font-bold">Subtle Progress (1px)</h1>
        <p className="text-muted-foreground">
          Minimal visual distraction while still providing progress feedback.
        </p>
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">Section {i + 1}</h2>
            <p className="text-muted-foreground">Content section...</p>
          </div>
        ))}
      </div>
    </div>
  ),
};

/**
 * Fast animation - snappier, less springy
 */
export const Fast: Story = {
  render: () => (
    <div>
      <ReadProgressPresets.fast />
      <div className="container mx-auto px-4 py-12 space-y-4">
        <h1 className="text-4xl font-bold">Fast Animation</h1>
        <p className="text-muted-foreground">
          Scroll quickly to see the snappier, less bouncy animation.
        </p>
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">Section {i + 1}</h2>
            <p className="text-muted-foreground">Content section...</p>
          </div>
        ))}
      </div>
    </div>
  ),
};

/**
 * Custom configuration
 */
export const Custom: Story = {
  render: () => (
    <div>
      <ReadProgress
        position="top"
        color="primary"
        height={3}
        springConfig={{
          stiffness: 150,
          damping: 25,
          restDelta: 0.001,
        }}
      />
      <div className="container mx-auto px-4 py-12 space-y-4">
        <h1 className="text-4xl font-bold">Custom Configuration</h1>
        <p className="text-muted-foreground">Primary color, 3px height, custom spring physics.</p>
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">Section {i + 1}</h2>
            <p className="text-muted-foreground">Content section...</p>
          </div>
        ))}
      </div>
    </div>
  ),
};
