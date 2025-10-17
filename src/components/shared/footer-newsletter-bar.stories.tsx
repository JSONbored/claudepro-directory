'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { FooterNewsletterBar } from './footer-newsletter-bar';

const meta = {
  title: 'Shared/FooterNewsletterBar',
  component: FooterNewsletterBar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Sticky footer newsletter bar that appears after 3 seconds. Features dismissible UI with localStorage persistence, backdrop blur, and responsive layout. Automatically hidden on pages with inline email CTAs.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FooterNewsletterBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default sticky footer bar
 */
export const Default: Story = {
  render: () => (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-8">
        <h1 className="text-4xl font-bold mb-4">Page Content</h1>
        <p className="text-muted-foreground mb-4">
          Scroll down to see the newsletter bar at the bottom of the page.
        </p>
        <div className="space-y-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <p key={`paragraph-${i}-${Date.now()}`} className="text-muted-foreground">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua.
            </p>
          ))}
        </div>
      </div>
      <FooterNewsletterBar />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The newsletter bar appears at the bottom after a 3 second delay. It has a backdrop blur effect and can be dismissed.',
      },
    },
  },
};

/**
 * Mobile layout preview
 */
export const MobileLayout: Story = {
  render: () => (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Mobile View</h1>
        <p className="text-sm text-muted-foreground mb-4">
          On mobile, the newsletter bar stacks vertically.
        </p>
      </div>
      <FooterNewsletterBar />
    </div>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Shows the mobile-optimized layout with stacked elements.',
      },
    },
  },
};

/**
 * Desktop layout preview
 */
export const DesktopLayout: Story = {
  render: () => (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-8">
        <h1 className="text-4xl font-bold mb-4">Desktop View</h1>
        <p className="text-muted-foreground mb-4">
          On desktop, the newsletter bar displays horizontally with the form inline.
        </p>
      </div>
      <FooterNewsletterBar />
    </div>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story: 'Shows the desktop layout with horizontal arrangement.',
      },
    },
  },
};

/**
 * With page content
 */
export const WithPageContent: Story = {
  render: () => (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-8">
        <article className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-4xl font-bold">Guide: Getting Started with Claude</h1>
          <p className="text-xl text-muted-foreground">
            Learn how to use Claude effectively in your projects.
          </p>
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Introduction</h2>
            <p>
              Claude is an advanced AI assistant created by Anthropic. It can help with a wide
              variety of tasks including writing, analysis, coding, and more.
            </p>
            <h2 className="text-2xl font-semibold">Key Features</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Natural conversation and understanding</li>
              <li>Code generation and review</li>
              <li>Content creation and editing</li>
              <li>Analysis and research</li>
            </ul>
            <h2 className="text-2xl font-semibold">Getting Started</h2>
            <p>
              To get started with Claude, you can use the web interface or integrate it into your
              applications via the API.
            </p>
            {Array.from({ length: 10 }).map((_, i) => (
              <p key={`scroll-content-${i}-${Date.now()}`}>
                This is additional content to demonstrate scrolling behavior and the sticky footer
                newsletter bar. The bar will appear at the bottom of the viewport after 3 seconds.
              </p>
            ))}
          </div>
        </article>
      </div>
      <FooterNewsletterBar />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates the newsletter bar in context with actual page content. Scroll to see the sticky behavior.',
      },
    },
  },
};

/**
 * Visual states showcase
 */
export const VisualStates: Story = {
  render: () => (
    <div className="space-y-8 p-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Newsletter Bar States</h2>
        <p className="text-muted-foreground mb-6">
          Various visual states of the newsletter bar component.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Desktop State</h3>
          <div className="border rounded-lg overflow-hidden">
            <div className="relative bg-[var(--color-bg-overlay)] backdrop-blur-xl border-t-2 border-[var(--color-border-medium)] shadow-xl">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/30 to-transparent" />
              <div className="container mx-auto px-4 py-4">
                <div className="hidden md:flex items-center justify-between gap-4">
                  <p className="text-sm font-medium">
                    Get weekly updates on{' '}
                    <span className="text-[var(--color-accent-light)]">new tools & guides</span> —
                    no spam, unsubscribe anytime
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 border rounded-md bg-muted text-sm">
                      Newsletter form here
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Mobile State</h3>
          <div className="border rounded-lg overflow-hidden max-w-sm">
            <div className="relative bg-[var(--color-bg-overlay)] backdrop-blur-xl border-t-2 border-[var(--color-border-medium)] shadow-xl">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/30 to-transparent" />
              <div className="px-4 py-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      <span className="text-[var(--color-accent-light)]">Weekly updates</span> on
                      new tools
                    </p>
                  </div>
                  <div className="px-4 py-2 border rounded-md bg-muted text-sm text-center">
                    Newsletter form here
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};
