'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { NewsletterForm } from './newsletter-form';

const meta = {
  title: 'Shared/NewsletterForm',
  component: NewsletterForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Newsletter signup form with server action integration. Features loading states, toast notifications, error handling, and accessibility support. Uses the centralized useNewsletter hook.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    source: {
      control: 'select',
      options: ['inline', 'footer', 'homepage', 'modal', 'sidebar'],
      description: 'Newsletter source for analytics tracking',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
} satisfies Meta<typeof NewsletterForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default inline form
 */
export const Default: Story = {
  args: {
    source: 'inline',
  },
};

/**
 * Footer variant
 */
export const Footer: Story = {
  args: {
    source: 'footer',
  },
};

/**
 * Homepage variant
 */
export const Homepage: Story = {
  args: {
    source: 'homepage',
  },
};

/**
 * Modal variant
 */
export const Modal: Story = {
  args: {
    source: 'modal',
  },
};

/**
 * Sidebar variant
 */
export const Sidebar: Story = {
  args: {
    source: 'sidebar',
  },
};

/**
 * With custom width
 */
export const CustomWidth: Story = {
  args: {
    source: 'inline',
    className: 'w-[500px]',
  },
};

/**
 * In card context
 */
export const InCard: Story = {
  render: () => (
    <div className="p-6 border rounded-lg bg-card max-w-md">
      <h3 className="text-lg font-semibold mb-2">Stay Updated</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Get weekly updates on new tools and guides.
      </p>
      <NewsletterForm source="inline" />
    </div>
  ),
};

/**
 * In hero section
 */
export const InHero: Story = {
  render: () => (
    <div className="bg-gradient-to-br from-primary/10 to-accent/5 p-12 rounded-lg text-center max-w-2xl">
      <h2 className="text-3xl font-bold mb-4">Join Our Newsletter</h2>
      <p className="text-lg text-muted-foreground mb-6">
        Get the best Claude resources delivered to your inbox every week.
      </p>
      <div className="max-w-md mx-auto">
        <NewsletterForm source="homepage" className="w-full" />
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        No spam. Unsubscribe anytime. Join 1,000+ subscribers.
      </p>
    </div>
  ),
};

/**
 * In footer bar
 */
export const InFooterBar: Story = {
  render: () => (
    <div className="bg-[var(--color-bg-overlay)] backdrop-blur-xl border rounded-lg p-4 max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium">
          Get weekly updates on new tools & guides — no spam, unsubscribe anytime
        </p>
        <NewsletterForm source="footer" className="w-[400px]" />
      </div>
    </div>
  ),
};

/**
 * Mobile layout
 */
export const MobileLayout: Story = {
  render: () => (
    <div className="max-w-sm">
      <div className="p-4 border rounded-lg bg-card">
        <h3 className="font-semibold mb-2">Subscribe</h3>
        <p className="text-sm text-muted-foreground mb-3">Weekly updates on new tools</p>
        <NewsletterForm source="inline" />
      </div>
    </div>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Stacked layout
 */
export const StackedLayout: Story = {
  render: () => (
    <div className="space-y-8 max-w-md">
      <div className="p-6 border rounded-lg bg-card">
        <h3 className="text-lg font-semibold mb-2">Newsletter 1</h3>
        <p className="text-sm text-muted-foreground mb-4">AI tools and resources</p>
        <NewsletterForm source="inline" />
      </div>

      <div className="p-6 border rounded-lg bg-card">
        <h3 className="text-lg font-semibold mb-2">Newsletter 2</h3>
        <p className="text-sm text-muted-foreground mb-4">Weekly community highlights</p>
        <NewsletterForm source="inline" />
      </div>
    </div>
  ),
};

/**
 * In sidebar
 */
export const InSidebar: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl">
      <div className="md:col-span-3 p-8 border rounded-lg">
        <h1 className="text-3xl font-bold mb-4">Main Content</h1>
        <p className="text-muted-foreground">
          This is the main content area. The newsletter form is in the sidebar.
        </p>
      </div>
      <div className="space-y-4">
        <div className="p-4 border rounded-lg bg-card">
          <h3 className="font-semibold mb-2">Stay Updated</h3>
          <p className="text-xs text-muted-foreground mb-3">Weekly newsletter</p>
          <NewsletterForm source="sidebar" />
        </div>
      </div>
    </div>
  ),
};

/**
 * With icon and styling
 */
export const WithIconAndStyling: Story = {
  render: () => (
    <div className="p-8 border-2 border-primary/20 rounded-lg bg-gradient-to-br from-primary/5 to-accent/5 max-w-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-primary/10 rounded-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
          >
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold">Join Our Newsletter</h3>
          <p className="text-sm text-muted-foreground">1,000+ subscribers</p>
        </div>
      </div>
      <NewsletterForm source="inline" />
    </div>
  ),
};

/**
 * All sources showcase
 */
export const AllSources: Story = {
  render: () => (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="font-semibold mb-2">Inline Source</h3>
        <NewsletterForm source="inline" />
      </div>
      <div>
        <h3 className="font-semibold mb-2">Footer Source</h3>
        <NewsletterForm source="footer" />
      </div>
      <div>
        <h3 className="font-semibold mb-2">Homepage Source</h3>
        <NewsletterForm source="homepage" />
      </div>
      <div>
        <h3 className="font-semibold mb-2">Modal Source</h3>
        <NewsletterForm source="modal" />
      </div>
      <div>
        <h3 className="font-semibold mb-2">Sidebar Source</h3>
        <NewsletterForm source="sidebar" />
      </div>
    </div>
  ),
};

/**
 * Interactive demo
 */
export const InteractiveDemo: Story = {
  args: {
    source: 'inline',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Try entering an email and submitting. The form includes validation, loading states, and toast notifications. Server actions are mocked in Storybook.',
      },
    },
  },
};
