import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Footer } from './footer';

/**
 * Footer Component Stories
 *
 * Site footer with navigation links, social links, and llms.txt discovery.
 * Static component with responsive 3-column grid layout.
 *
 * Features:
 * - 3-column responsive grid (GRID_RESPONSIVE_3)
 * - About section with app description
 * - Social links (GitHub, Discord, Open Source badge)
 * - Quick Links section (Guides, Collections, Changelog, Community, Submit)
 * - AI & Resources section (LLMs.txt, API Docs, Partner Program)
 * - Bottom bar with copyright and AI-optimized content link
 * - llms.txt specification compliance for AI discoverability
 *
 * Component: src/components/layout/footer.tsx (170 LOC)
 * Configuration: APP_CONFIG, ROUTES, SOCIAL_LINKS constants
 *
 * Layout:
 * - Desktop: 3 columns (About | Quick Links | AI & Resources)
 * - Tablet: 2 columns, wraps to 3rd row
 * - Mobile: 1 column, stacked vertically
 *
 * Accessibility:
 * - Semantic footer element
 * - Proper link hover states with transitions
 * - Icon-only links have aria-labels
 * - Current year auto-calculated
 *
 * @see https://llmstxt.org/ - LLMs.txt specification
 */
const meta = {
  title: 'Layout/Footer',
  component: Footer,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Site footer with navigation links, social links, and llms.txt discovery. Responsive 3-column grid layout with semantic HTML and accessibility support.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Mock main content to show footer in context */}
        <main className="flex-1 container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto space-y-8">
            <h1 className="text-4xl font-bold">Main Content Area</h1>
            <p className="text-muted-foreground">
              Scroll down to see the footer. The footer is positioned at the bottom of the page with
              a border-t separator.
            </p>
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-2">Footer Features</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>3-column responsive grid layout</li>
                <li>Social links (GitHub, Discord)</li>
                <li>Quick navigation links</li>
                <li>LLMs.txt discovery link</li>
                <li>Auto-calculated copyright year</li>
              </ul>
            </div>
          </div>
        </main>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default: Desktop 3-Column Layout
 *
 * Standard footer with full 3-column grid on desktop.
 * Shows all sections: About, Quick Links, AI & Resources.
 *
 * Columns:
 * 1. About - App name, description, social links, Open Source badge
 * 2. Quick Links - Guides, Collections, Changelog, Community, Submit
 * 3. AI & Resources - LLMs.txt (with Sparkles icon), API Docs, Partner Program
 *
 * Bottom Bar:
 * - Copyright notice with current year
 * - AI-optimized content link with Sparkles icon
 */
export const Default: Story = {};

/**
 * Focus States
 *
 * Demonstrates focus indicators for keyboard navigation.
 * All links have proper focus states for accessibility.
 *
 * Accessibility Features:
 * - Tab through all footer links
 * - Focus indicators on all interactive elements
 * - Social icon links have aria-labels
 * - LLMs.txt link has descriptive aria-label
 * - Transition durations match (transition-colors-smooth)
 *
 * Test:
 * Press Tab to navigate through all footer links.
 * Focus indicators should be clearly visible.
 */
export const FocusStates: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Footer with focus states demonstration. Press Tab to navigate through links and see focus indicators.',
      },
    },
  },
};

/**
 * Hover Effects
 *
 * Interactive demonstration of hover states.
 * All links transition from muted-foreground to foreground on hover.
 *
 * Hover Patterns:
 * - Text links: text-muted-foreground → text-foreground
 * - Social icons: Same color transition
 * - Transition class: transition-colors-smooth
 * - Consistent timing across all links
 *
 * Test:
 * Hover over any link to see smooth color transition.
 */
export const HoverEffects: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Hover over footer links to see smooth color transitions from muted to foreground colors.',
      },
    },
  },
};

/**
 * LLMs.txt Specification
 *
 * Highlights the LLMs.txt discovery feature.
 * Two links to /llms.txt for AI assistant discoverability.
 *
 * LLMs.txt Links:
 * 1. AI & Resources section - Primary link with Sparkles icon
 * 2. Bottom bar - Secondary "AI-optimized content available" link
 *
 * Specification Compliance:
 * - Follows https://llmstxt.org/ standard
 * - Makes content discoverable to AI assistants
 * - Both links point to ROUTES.LLMS_TXT
 * - Sparkles icon indicates AI-related feature
 *
 * Purpose:
 * Allows AI assistants to discover and index site content
 * in an optimized format.
 */
export const LLMsTxtDiscovery: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Footer includes two LLMs.txt links for AI assistant discoverability per llmstxt.org specification. Sparkles icon indicates AI-optimized content.',
      },
    },
  },
};

/**
 * Social Links
 *
 * Demonstrates social link integration.
 * Shows GitHub and Discord links with icons.
 *
 * Social Links Features:
 * - GitHub link (opens in new tab)
 * - Discord link (opens in new tab)
 * - Icons: Github and DiscordIcon components (h-5 w-5)
 * - rel="noopener noreferrer" for security
 * - aria-label on icon-only links
 * - Hover transitions
 *
 * Configuration:
 * Links pulled from SOCIAL_LINKS constant.
 */
export const SocialLinks: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Footer social links to GitHub and Discord with proper icons, security attributes, and accessibility labels.',
      },
    },
  },
};

/**
 * Open Source Badge
 *
 * Highlights the Open Source badge.
 * Shows UnifiedBadge with ExternalLink icon.
 *
 * Badge Features:
 * - variant="base" style="outline"
 * - Colors: border-accent/20 bg-accent/5 text-accent
 * - ExternalLink icon (h-3 w-3 mr-1)
 * - Text: "Open Source"
 * - Non-interactive (display only)
 *
 * Purpose:
 * Indicates project is open source without requiring a link.
 */
export const OpenSourceBadge: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Footer includes an "Open Source" badge to indicate the project is open source. Badge uses accent colors and outline style.',
      },
    },
  },
};

/**
 * Current Year Display
 *
 * Demonstrates auto-calculated copyright year.
 * Year updates automatically via JavaScript Date object.
 *
 * Implementation:
 * ```tsx
 * const currentYear = new Date().getFullYear();
 * // Used in: © {currentYear} {APP_CONFIG.author}
 * ```
 *
 * Test:
 * Check that copyright shows current year (not hardcoded).
 */
export const CurrentYearDisplay: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Copyright notice includes automatically calculated current year using new Date().getFullYear().',
      },
    },
  },
};

/**
 * All Links Functional
 *
 * Story confirming all footer links are properly configured.
 * Tests that ROUTES constants are correctly imported and used.
 *
 * Link Inventory:
 * - Guides: ROUTES.GUIDES
 * - Collections: ROUTES.COLLECTIONS
 * - Changelog: ROUTES.CHANGELOG
 * - Community: ROUTES.COMMUNITY
 * - Submit: ROUTES.SUBMIT
 * - LLMs.txt: ROUTES.LLMS_TXT (×2)
 * - API Docs: ROUTES.API_DOCS
 * - Partner: ROUTES.PARTNER
 * - GitHub: SOCIAL_LINKS.github
 * - Discord: SOCIAL_LINKS.discord
 *
 * Test:
 * Click each link to verify correct routing.
 */
export const AllLinksFunctional: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'All footer links are properly configured using ROUTES and SOCIAL_LINKS constants. Click links to verify routing.',
      },
    },
  },
};

// ============================================================================
// PLAY FUNCTION TESTS
// ============================================================================

/**
 * Footer Structure Test
 * Tests basic footer structure and semantic HTML
 */
export const FooterStructureTest: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Tests footer semantic HTML structure and main sections.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify footer element is rendered', async () => {
      const footer = canvasElement.querySelector('footer');
      await expect(footer).toBeInTheDocument();
    });

    await step('Verify footer has border-t styling', async () => {
      const footer = canvasElement.querySelector('footer');
      await expect(footer).toHaveClass('border-t');
    });
  },
};

/**
 * Navigation Links Test
 * Tests all footer navigation links are present
 */
export const NavigationLinksTest: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Tests that all footer navigation links are rendered correctly.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify Quick Links section exists', async () => {
      const quickLinksHeading = canvas.getByText(/quick links/i);
      await expect(quickLinksHeading).toBeInTheDocument();
    });

    await step('Verify Guides link is present', async () => {
      const guidesLink = canvas.getByRole('link', { name: /guides/i });
      await expect(guidesLink).toBeInTheDocument();
    });

    await step('Verify Changelog link is present', async () => {
      const changelogLink = canvas.getByRole('link', { name: /changelog/i });
      await expect(changelogLink).toBeInTheDocument();
    });

    await step('Verify Community link is present', async () => {
      const communityLink = canvas.getByRole('link', { name: /community/i });
      await expect(communityLink).toBeInTheDocument();
    });
  },
};

/**
 * Social Links Test
 * Tests GitHub and Discord social links
 */
export const SocialLinksTest: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Tests social media links (GitHub, Discord) with proper attributes.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify GitHub link is present', async () => {
      const githubLink = canvas.getByRole('link', { name: /github/i });
      await expect(githubLink).toBeInTheDocument();
    });

    await step('Verify GitHub link has correct attributes', async () => {
      const githubLink = canvas.getByRole('link', { name: /github/i });
      await expect(githubLink).toHaveAttribute('target', '_blank');
      await expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    await step('Verify Discord link is present', async () => {
      const discordLink = canvas.getByRole('link', { name: /discord/i });
      await expect(discordLink).toBeInTheDocument();
    });

    await step('Verify Discord link has correct attributes', async () => {
      const discordLink = canvas.getByRole('link', { name: /discord/i });
      await expect(discordLink).toHaveAttribute('target', '_blank');
      await expect(discordLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  },
};

/**
 * LLMs.txt Links Test
 * Tests both LLMs.txt discovery links
 */
export const LLMsTxtLinksTest: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Tests LLMs.txt links for AI discoverability (llmstxt.org specification).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify primary LLMs.txt link in AI & Resources section', async () => {
      // Look for LLMs.txt link
      const llmsTxtLinks = canvas.getAllByRole('link', { name: /llms\.txt|ai.optimized/i });
      await expect(llmsTxtLinks.length).toBeGreaterThan(0);
    });

    await step('Verify LLMs.txt links point to correct route', async () => {
      const llmsTxtLinks = canvas.getAllByRole('link', { name: /llms\.txt|ai.optimized/i });
      for (const link of llmsTxtLinks) {
        const href = link.getAttribute('href');
        await expect(href).toContain('llms.txt');
      }
    });
  },
};

/**
 * Open Source Badge Test
 * Tests Open Source badge rendering
 */
export const OpenSourceBadgeTest: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Tests Open Source badge in About section.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify Open Source badge is present', async () => {
      const badge = canvas.getByText(/open source/i);
      await expect(badge).toBeInTheDocument();
    });
  },
};

/**
 * Copyright Year Test
 * Tests auto-calculated copyright year
 */
export const CopyrightYearTest: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Tests that copyright year is automatically calculated to current year.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify copyright notice is present', async () => {
      const copyright = canvas.getByText(/©/);
      await expect(copyright).toBeInTheDocument();
    });

    await step('Verify current year is displayed', async () => {
      const currentYear = new Date().getFullYear().toString();
      const yearText = canvas.getByText(new RegExp(currentYear));
      await expect(yearText).toBeInTheDocument();
    });
  },
};

/**
 * AI Resources Section Test
 * Tests AI & Resources section links
 */
export const AIResourcesSectionTest: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Tests AI & Resources section with LLMs.txt, API Docs, and Partner links.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify AI & Resources heading is present', async () => {
      const heading = canvas.getByText(/ai.*resources|resources/i);
      await expect(heading).toBeInTheDocument();
    });

    await step('Verify API Docs link is present', async () => {
      const apiDocsLink = canvas.getByRole('link', { name: /api.*docs|documentation/i });
      await expect(apiDocsLink).toBeInTheDocument();
    });
  },
};

/**
 * Responsive Grid Test
 * Tests 3-column responsive grid layout
 */
export const ResponsiveGridTest: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Tests footer uses responsive 3-column grid layout.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify footer has grid layout', async () => {
      // Footer should have a grid container
      const gridContainer = canvasElement.querySelector('[class*="grid"]');
      await expect(gridContainer).toBeInTheDocument();
    });

    await step('Verify multiple sections are present', async () => {
      // Should have About, Quick Links, and AI & Resources sections
      const headings = canvas.getAllByRole('heading', { level: 3 });
      await expect(headings.length).toBeGreaterThanOrEqual(2);
    });
  },
};
