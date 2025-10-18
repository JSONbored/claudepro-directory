import type { Meta, StoryObj } from '@storybook/react';
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
 * Mobile Small: 1-Column Stacked Layout (320px)
 *
 * Footer on small mobile viewport (320px - iPhone SE size).
 * All sections stack vertically for optimal mobile readability.
 *
 * Layout:
 * - About section (top)
 * - Quick Links section (middle)
 * - AI & Resources section (bottom)
 * - Bottom bar (copyright + AI link, stacked)
 *
 * Touch Optimization:
 * - Links have adequate spacing for touch targets
 * - Social icons maintain 44x44px minimum size
 * - Transitions smooth for tap interactions
 */
export const MobileSmall: Story = {
  globals: {
    viewport: { value: 'mobile1' },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Footer on small mobile (320px). Tests layout on smallest modern mobile devices with stacked vertical layout.',
      },
    },
  },
};

/**
 * Mobile Large: 1-Column Stacked Layout (414px)
 *
 * Footer on large mobile viewport (414px - iPhone Pro Max size).
 * All sections stack vertically with slightly more breathing room than small mobile.
 *
 * Layout:
 * - About section (top)
 * - Quick Links section (middle)
 * - AI & Resources section (bottom)
 * - Bottom bar (copyright + AI link, stacked)
 *
 * Touch Optimization:
 * - Links have adequate spacing for touch targets
 * - Social icons maintain 44x44px minimum size
 * - Extra horizontal space for better touch targets
 */
export const MobileLarge: Story = {
  globals: {
    viewport: { value: 'mobile2' },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Footer on large mobile (414px). Tests layout on larger modern mobile devices with more horizontal space.',
      },
    },
  },
};

/**
 * Tablet: 2-Column + Wrap Layout
 *
 * Footer on tablet viewport with 2-column grid.
 * Third column wraps to new row on smaller tablets.
 *
 * Layout (sm breakpoint):
 * - Row 1: About | Quick Links
 * - Row 2: AI & Resources (spans full width or wraps)
 *
 * Responsive Behavior:
 * - Uses GRID_RESPONSIVE_3 utility class
 * - Adapts between 1, 2, and 3 columns based on breakpoints
 */
export const Tablet: Story = {
  globals: {
    viewport: { value: 'tablet' },
  },
  parameters: {
    docs: {
      description: {
        story: 'Footer on tablet devices showing 2-column layout with responsive wrapping.',
      },
    },
  },
};

/**
 * Dark Theme
 *
 * Footer in dark mode with adjusted colors.
 * Demonstrates theme compatibility and contrast ratios.
 *
 * Dark Theme Features:
 * - Border: border-border/50 (semi-transparent)
 * - Background: bg-background/95 with backdrop-blur
 * - Text: text-muted-foreground with hover:text-foreground
 * - Social icons maintain proper contrast
 * - Open Source badge with accent colors
 */
export const DarkTheme: Story = {
  parameters: {
    globals: { theme: 'dark' },
    docs: {
      description: {
        story: 'Footer optimized for dark theme with proper contrast ratios and color adjustments.',
      },
    },
  },
};

/**
 * Light Theme
 *
 * Footer in light mode.
 * Shows default light theme styling with optimal readability.
 *
 * Light Theme Features:
 * - Clean border separation
 * - Muted text with good contrast
 * - Hover states darken text to foreground
 * - Social icons clearly visible
 */
export const LightTheme: Story = {
  parameters: {
    globals: { theme: 'light' },
    docs: {
      description: {
        story: 'Footer in light theme showing clean, readable design with proper contrast.',
      },
    },
  },
};

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
