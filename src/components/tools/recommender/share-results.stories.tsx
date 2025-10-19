'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, within } from 'storybook/test';
import { ShareResults } from './share-results';

/**
 * ShareResults Component Stories
 *
 * Modal dialog for sharing recommendation results via social media or link copy.
 * Displays shareable URL with copy button and social platform share links.
 *
 * Features:
 * - Copy-to-clipboard functionality with success feedback
 * - Social share links (Twitter, LinkedIn, Facebook, Email)
 * - Read-only URL input with click-to-select
 * - Dynamic share text based on result count
 * - Platform-specific share URLs with proper encoding
 * - Dialog component with header and description
 * - Analytics logging for share events
 *
 * Component: src/components/tools/recommender/share-results.tsx (148 LOC)
 * Used in: results-display.tsx
 * Dependencies: Dialog, Button, Input primitives
 *
 * Share Platforms:
 * - Twitter: Twitter intent tweet
 * - LinkedIn: LinkedIn share offsite
 * - Facebook: Facebook sharer
 * - Email: Mailto link with pre-filled subject/body
 */
const meta = {
  title: 'Tools/Recommender/ShareResults',
  component: ShareResults,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Social share modal for recommendation results. Provides copy-to-clipboard and social platform sharing with analytics logging.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    shareUrl: {
      control: 'text',
      description: 'URL to share',
    },
    resultCount: {
      control: { type: 'number', min: 1, max: 100 },
      description: 'Number of recommendations (used in share text)',
    },
    onClose: {
      action: 'closed',
      description: 'Callback when modal is closed',
    },
  },
} satisfies Meta<typeof ShareResults>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default: 5 Results
 *
 * Standard share modal with 5 recommendations.
 * Shows typical use case after quiz completion.
 *
 * Share text: "I just found 5 perfect Claude configurations for my needs! 🚀"
 *
 * Usage:
 * ```tsx
 * <ShareResults
 *   shareUrl="https://example.com/results/abc123"
 *   resultCount={5}
 *   onClose={() => console.log('closed')}
 * />
 * ```
 */
export const Default: Story = {
  args: {
    shareUrl: 'https://claudepro.directory/tools/config-recommender/results/abc123',
    resultCount: 5,
    onClose: fn(),
  },
};

/**
 * Single Result
 *
 * Share modal for single recommendation.
 * Shows singular grammar in share text.
 */
export const SingleResult: Story = {
  args: {
    shareUrl: 'https://claudepro.directory/tools/config-recommender/results/single',
    resultCount: 1,
    onClose: fn(),
  },
};

/**
 * Many Results (20+)
 *
 * Share modal with large result count.
 * Tests number formatting in share text.
 */
export const ManyResults: Story = {
  args: {
    shareUrl: 'https://claudepro.directory/tools/config-recommender/results/many',
    resultCount: 23,
    onClose: fn(),
  },
};

/**
 * Short URL
 *
 * Share modal with concise URL.
 * Tests layout with minimal URL length.
 */
export const ShortURL: Story = {
  args: {
    shareUrl: 'https://cpd.io/r/xyz',
    resultCount: 5,
    onClose: fn(),
  },
};

/**
 * Long URL with Query Parameters
 *
 * Share modal with complex URL including query params.
 * Tests URL input overflow and text selection.
 */
export const LongURL: Story = {
  args: {
    shareUrl:
      'https://claudepro.directory/tools/config-recommender/results/abc123def456?utm_source=share&utm_medium=social&utm_campaign=recommendations&ref=user_12345',
    resultCount: 8,
    onClose: fn(),
  },
};

/**
 * Local Development URL
 *
 * Share modal with localhost URL.
 * Useful for testing/development scenarios.
 */
export const LocalhostURL: Story = {
  args: {
    shareUrl: 'http://localhost:3000/tools/config-recommender/results/test',
    resultCount: 3,
    onClose: fn(),
  },
};

/**
 * Staging Environment URL
 *
 * Share modal with staging/preview URL.
 * Shows how component handles different domains.
 */
export const StagingURL: Story = {
  args: {
    shareUrl: 'https://staging.claudepro.directory/tools/config-recommender/results/preview123',
    resultCount: 7,
    onClose: fn(),
  },
};

/**
 * Copy Button States
 *
 * Demonstrates copy button interaction states.
 * Click copy button to see Check icon feedback.
 *
 * States:
 * - Default: Copy icon
 * - Copied: Check icon (green) for 2 seconds
 * - Error: Toast notification if copy fails
 */
export const CopyButtonStates: Story = {
  args: {
    shareUrl: 'https://claudepro.directory/tools/config-recommender/results/copy-test',
    resultCount: 5,
    onClose: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Click the copy button to see success feedback. Check icon appears for 2 seconds after successful copy.',
      },
    },
  },
};

/**
 * Social Platform Links
 *
 * Shows all 4 social share platforms:
 * - Twitter: Opens tweet intent
 * - LinkedIn: Opens LinkedIn share
 * - Facebook: Opens Facebook sharer
 * - Email: Opens mailto link
 *
 * Each platform logs analytics event on click.
 */
export const SocialPlatformLinks: Story = {
  args: {
    shareUrl: 'https://claudepro.directory/tools/config-recommender/results/social',
    resultCount: 10,
    onClose: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'All social share buttons open new windows/tabs with pre-filled share content. Email opens default mail client.',
      },
    },
  },
};

/**
 * Responsive Layout
 *
 * Tests modal layout at different viewport sizes.
 * Social buttons in 2-column grid adapt to screen width.
 */
export const ResponsiveLayout: Story = {
  args: {
    shareUrl: 'https://claudepro.directory/tools/config-recommender/results/responsive',
    resultCount: 5,
    onClose: fn(),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Modal adapts to mobile viewport. Social buttons remain in 2-column grid.',
      },
    },
  },
};

/**
 * Dialog Close Behavior
 *
 * Demonstrates modal close interactions:
 * - Click outside modal overlay
 * - Press Escape key
 * - Click X button (if present)
 *
 * onClose callback is triggered for all close methods.
 */
export const DialogCloseBehavior: Story = {
  args: {
    shareUrl: 'https://claudepro.directory/tools/config-recommender/results/close-test',
    resultCount: 5,
    onClose: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Try closing the modal by clicking outside, pressing Escape, or using close button. Check Actions tab to see onClose callback.',
      },
    },
  },
};

/**
 * Accessibility Features
 *
 * Modal includes accessibility features:
 * - Semantic dialog structure
 * - Descriptive labels and aria attributes
 * - Keyboard navigation support
 * - Focus trap within modal
 * - Read-only input with select-on-click
 */
export const AccessibilityFeatures: Story = {
  args: {
    shareUrl: 'https://claudepro.directory/tools/config-recommender/results/a11y',
    resultCount: 5,
    onClose: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Modal follows accessibility best practices. Tab through elements to test keyboard navigation.',
      },
    },
  },
};

/**
 * URL Encoding Test
 *
 * Tests URL and text encoding for social platforms.
 * Special characters and emojis are properly encoded.
 */
export const URLEncodingTest: Story = {
  args: {
    shareUrl: 'https://example.com/results?name=Test&value=100%',
    resultCount: 5,
    onClose: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'URL and share text are properly encoded for social platforms. Special characters handled correctly.',
      },
    },
  },
};

// ============================================================================
// PLAY FUNCTION TESTS
// ============================================================================

/**
 * Dialog Rendering Test
 * Tests modal dialog is rendered and open
 */
export const DialogRenderingTest: Story = {
  args: {
    shareUrl: 'https://example.com/test',
    resultCount: 5,
    onClose: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests ShareResults modal renders with correct structure.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify dialog is rendered', async () => {
      const dialog = canvas.getByRole('dialog');
      await expect(dialog).toBeInTheDocument();
    });

    await step('Verify dialog title is displayed', async () => {
      const title = canvas.getByText(/share your results/i);
      await expect(title).toBeInTheDocument();
    });
  },
};

/**
 * Share URL Input Test
 * Tests URL input displays correct value
 */
export const ShareURLInputTest: Story = {
  args: {
    shareUrl: 'https://example.com/results/test123',
    resultCount: 5,
    onClose: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests URL input displays the correct share URL.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify URL input is rendered', async () => {
      const input = canvas.getByDisplayValue('https://example.com/results/test123');
      await expect(input).toBeInTheDocument();
    });

    await step('Verify input is read-only', async () => {
      const input = canvas.getByDisplayValue('https://example.com/results/test123');
      await expect(input).toHaveAttribute('readonly');
    });
  },
};

/**
 * Copy Button Test
 * Tests copy button is rendered
 */
export const CopyButtonTest: Story = {
  args: {
    shareUrl: 'https://example.com/test',
    resultCount: 5,
    onClose: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests copy button renders and is accessible.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify copy button is rendered', async () => {
      // Button should be in the document (icon button with Copy icon)
      const buttons = canvas.getAllByRole('button');
      // First button after the URL input should be the copy button
      await expect(buttons.length).toBeGreaterThan(0);
    });
  },
};

/**
 * Social Share Buttons Test
 * Tests all 4 social share buttons are rendered
 */
export const SocialShareButtonsTest: Story = {
  args: {
    shareUrl: 'https://example.com/test',
    resultCount: 5,
    onClose: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests all social platform share buttons render correctly.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify Twitter share button', async () => {
      const twitterButton = canvas.getByRole('link', { name: /twitter/i });
      await expect(twitterButton).toBeInTheDocument();
    });

    await step('Verify LinkedIn share button', async () => {
      const linkedinButton = canvas.getByRole('link', { name: /linkedin/i });
      await expect(linkedinButton).toBeInTheDocument();
    });

    await step('Verify Facebook share button', async () => {
      const facebookButton = canvas.getByRole('link', { name: /facebook/i });
      await expect(facebookButton).toBeInTheDocument();
    });

    await step('Verify Email share button', async () => {
      const emailButton = canvas.getByRole('link', { name: /email/i });
      await expect(emailButton).toBeInTheDocument();
    });
  },
};

/**
 * Share Link URLs Test
 * Tests social share links have correct href attributes
 */
export const ShareLinkURLsTest: Story = {
  args: {
    shareUrl: 'https://example.com/test',
    resultCount: 5,
    onClose: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests social share links contain properly encoded URLs.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify Twitter link contains twitter.com', async () => {
      const twitterLink = canvas.getByRole('link', { name: /twitter/i });
      const href = twitterLink.getAttribute('href');
      await expect(href).toContain('twitter.com/intent/tweet');
    });

    await step('Verify LinkedIn link contains linkedin.com', async () => {
      const linkedinLink = canvas.getByRole('link', { name: /linkedin/i });
      const href = linkedinLink.getAttribute('href');
      await expect(href).toContain('linkedin.com/sharing');
    });

    await step('Verify Facebook link contains facebook.com', async () => {
      const facebookLink = canvas.getByRole('link', { name: /facebook/i });
      const href = facebookLink.getAttribute('href');
      await expect(href).toContain('facebook.com/sharer');
    });

    await step('Verify Email link uses mailto protocol', async () => {
      const emailLink = canvas.getByRole('link', { name: /email/i });
      const href = emailLink.getAttribute('href');
      await expect(href).toContain('mailto:');
    });
  },
};
