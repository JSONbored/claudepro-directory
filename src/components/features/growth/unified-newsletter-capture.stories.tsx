import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { UnifiedNewsletterCapture } from './unified-newsletter-capture';

const meta = {
  title: 'Growth/UnifiedNewsletterCapture',
  component: UnifiedNewsletterCapture,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Consolidated newsletter capture component with 7 variants: form, hero, inline, minimal, card, footer-bar, and modal. Replaces newsletter-form, inline-email-cta, footer-newsletter-bar, and post-copy-email-modal components with a single unified API.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof UnifiedNewsletterCapture>;

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// FORM VARIANT STORIES
// =============================================================================

/**
 * Form variant - Simple email form
 */
export const FormDefault: Story = {
  args: {
    variant: 'form',
    source: 'inline',
  },
};

/**
 * Form variant for footer
 */
export const FormFooter: Story = {
  args: {
    variant: 'form',
    source: 'footer',
  },
};

/**
 * Form variant with custom width
 */
export const FormCustomWidth: Story = {
  args: {
    variant: 'form',
    source: 'inline',
    className: 'w-[500px]',
  },
};

/**
 * Form in card context
 */
export const FormInCard: Story = {
  render: () => (
    <div className="p-6 border rounded-lg bg-card max-w-md">
      <h3 className="text-lg font-semibold mb-2">Stay Updated</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Get weekly updates on new tools and guides.
      </p>
      <UnifiedNewsletterCapture variant="form" source="inline" />
    </div>
  ),
};

// =============================================================================
// HERO VARIANT STORIES
// =============================================================================

/**
 * Hero variant - Large prominent CTA
 */
export const HeroDefault: Story = {
  args: {
    variant: 'hero',
    source: 'homepage',
    context: 'homepage',
  },
};

/**
 * Hero variant with agents category
 */
export const HeroAgents: Story = {
  args: {
    variant: 'hero',
    source: 'homepage',
    context: 'agents-page',
    category: 'agents',
  },
};

/**
 * Hero variant with MCP category
 */
export const HeroMcp: Story = {
  args: {
    variant: 'hero',
    source: 'homepage',
    context: 'mcp-page',
    category: 'mcp',
  },
};

/**
 * Hero variant with commands category
 */
export const HeroCommands: Story = {
  args: {
    variant: 'hero',
    source: 'homepage',
    context: 'commands-page',
    category: 'commands',
  },
};

/**
 * Hero variant with custom content
 */
export const HeroCustom: Story = {
  args: {
    variant: 'hero',
    source: 'homepage',
    context: 'custom',
    headline: 'Never Miss an Update',
    description:
      'Subscribe to our newsletter for the latest Claude tools, guides, and community highlights delivered directly to your inbox.',
  },
};

// =============================================================================
// INLINE VARIANT STORIES
// =============================================================================

/**
 * Inline variant - Mid-content card
 */
export const InlineDefault: Story = {
  args: {
    variant: 'inline',
    source: 'content_page',
    context: 'content-detail',
  },
};

/**
 * Inline variant with agents category
 */
export const InlineAgents: Story = {
  args: {
    variant: 'inline',
    source: 'content_page',
    context: 'content-detail',
    category: 'agents',
  },
};

/**
 * Inline variant with commands category
 */
export const InlineCommands: Story = {
  args: {
    variant: 'inline',
    source: 'content_page',
    context: 'content-detail',
    category: 'commands',
  },
};

/**
 * Inline variant with guides category
 */
export const InlineGuides: Story = {
  args: {
    variant: 'inline',
    source: 'content_page',
    context: 'content-detail',
    category: 'guides',
  },
};

/**
 * Inline variant in content context
 */
export const InlineInContent: Story = {
  render: () => (
    <div className="max-w-3xl mx-auto space-y-6">
      <article className="prose dark:prose-invert">
        <h1>Getting Started with Claude Agents</h1>
        <p>
          Claude agents are powerful tools that help automate tasks and enhance your productivity.
          This guide will walk you through everything you need to know.
        </p>
        <h2>What are Claude Agents?</h2>
        <p>
          Agents are specialized configurations that give Claude specific capabilities and
          behaviors. They can help with code review, writing, research, and much more.
        </p>
      </article>

      <UnifiedNewsletterCapture
        variant="inline"
        source="content_page"
        context="guide-content"
        category="agents"
      />

      <article className="prose dark:prose-invert">
        <h2>Creating Your First Agent</h2>
        <p>To create an agent, you'll need to define its purpose, capabilities, and constraints.</p>
      </article>
    </div>
  ),
};

// =============================================================================
// MINIMAL VARIANT STORIES
// =============================================================================

/**
 * Minimal variant - Compact single-line
 */
export const MinimalDefault: Story = {
  args: {
    variant: 'minimal',
    source: 'inline',
    context: 'category-page',
  },
};

/**
 * Minimal variant with rules category
 */
export const MinimalRules: Story = {
  args: {
    variant: 'minimal',
    source: 'inline',
    context: 'category-page',
    category: 'rules',
  },
};

/**
 * Minimal variant with hooks category
 */
export const MinimalHooks: Story = {
  args: {
    variant: 'minimal',
    source: 'inline',
    context: 'category-page',
    category: 'hooks',
  },
};

// =============================================================================
// CARD VARIANT STORIES
// =============================================================================

/**
 * Card variant - Grid item size
 */
export const CardDefault: Story = {
  args: {
    variant: 'card',
    source: 'inline',
    context: 'browse-page',
  },
};

/**
 * Card variant with MCP category
 */
export const CardMcp: Story = {
  args: {
    variant: 'card',
    source: 'inline',
    context: 'browse-page',
    category: 'mcp',
  },
};

/**
 * Card variant with hooks category
 */
export const CardHooks: Story = {
  args: {
    variant: 'card',
    source: 'inline',
    context: 'browse-page',
    category: 'hooks',
  },
};

/**
 * Card variant in grid layout
 */
export const CardInGrid: Story = {
  render: () => (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Browse Collections</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 border rounded-lg bg-card">
          <h3 className="font-semibold text-lg mb-2">Collection 1</h3>
          <p className="text-sm text-muted-foreground">Sample content card</p>
        </div>
        <div className="p-6 border rounded-lg bg-card">
          <h3 className="font-semibold text-lg mb-2">Collection 2</h3>
          <p className="text-sm text-muted-foreground">Sample content card</p>
        </div>
        <UnifiedNewsletterCapture variant="card" source="inline" context="grid" category="agents" />
        <div className="p-6 border rounded-lg bg-card">
          <h3 className="font-semibold text-lg mb-2">Collection 3</h3>
          <p className="text-sm text-muted-foreground">Sample content card</p>
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// FOOTER BAR VARIANT STORIES
// =============================================================================

/**
 * Footer bar variant - Sticky footer
 */
export const FooterBarDefault: Story = {
  render: () => (
    <div className="relative h-[400px] bg-muted/20 rounded-lg overflow-hidden">
      <div className="p-8">
        <h2 className="text-2xl font-bold mb-4">Page Content</h2>
        <p className="text-muted-foreground">
          Scroll down to see the footer bar appear at the bottom (simulated in this story).
        </p>
      </div>
      {/* Simulated footer bar (not actually sticky in Storybook) */}
      <div className="absolute bottom-0 left-0 right-0">
        <UnifiedNewsletterCapture
          variant="footer-bar"
          source="footer"
          dismissible={true}
          showAfterDelay={0}
          respectInlineCTA={false}
        />
      </div>
    </div>
  ),
};

/**
 * Footer bar without dismissal
 */
export const FooterBarNoDismiss: Story = {
  render: () => (
    <div className="relative h-[400px] bg-muted/20 rounded-lg overflow-hidden">
      <div className="p-8">
        <h2 className="text-2xl font-bold mb-4">Page Content</h2>
        <p className="text-muted-foreground">Footer bar without dismiss button.</p>
      </div>
      <div className="absolute bottom-0 left-0 right-0">
        <UnifiedNewsletterCapture
          variant="footer-bar"
          source="footer"
          dismissible={false}
          showAfterDelay={0}
          respectInlineCTA={false}
        />
      </div>
    </div>
  ),
};

// =============================================================================
// MODAL VARIANT STORIES
// =============================================================================

/**
 * Modal variant - Sheet modal
 */
export const ModalDefault: Story = {
  render: function ModalDefaultStory() {
    const [open, setOpen] = useState(false);

    return (
      <div>
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          type="button"
        >
          Open Newsletter Modal
        </button>
        <UnifiedNewsletterCapture
          variant="modal"
          source="modal"
          open={open}
          onOpenChange={setOpen}
          copyType="markdown"
          category="agents"
        />
      </div>
    );
  },
};

/**
 * Modal variant for code copy
 */
export const ModalCodeCopy: Story = {
  render: function ModalCodeCopyStory() {
    const [open, setOpen] = useState(false);

    return (
      <div>
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          type="button"
        >
          Simulate Code Copy
        </button>
        <UnifiedNewsletterCapture
          variant="modal"
          source="modal"
          open={open}
          onOpenChange={setOpen}
          copyType="code"
          category="commands"
          slug="test-command"
        />
      </div>
    );
  },
};

/**
 * Modal variant for llmstxt copy
 */
export const ModalLlmstxtCopy: Story = {
  render: function ModalLlmstxtCopyStory() {
    const [open, setOpen] = useState(false);

    return (
      <div>
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          type="button"
        >
          Simulate llms.txt Copy
        </button>
        <UnifiedNewsletterCapture
          variant="modal"
          source="modal"
          open={open}
          onOpenChange={setOpen}
          copyType="llmstxt"
          category="guides"
        />
      </div>
    );
  },
};

// =============================================================================
// COMPREHENSIVE SHOWCASE STORIES
// =============================================================================

/**
 * All CTA variants showcase
 */
export const AllCTAVariants: Story = {
  render: () => (
    <div className="space-y-12 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold mb-4">Hero Variant</h2>
        <UnifiedNewsletterCapture
          variant="hero"
          source="homepage"
          context="showcase"
          category="agents"
        />
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Inline Variant</h2>
        <UnifiedNewsletterCapture
          variant="inline"
          source="content_page"
          context="showcase"
          category="mcp"
        />
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Minimal Variant</h2>
        <UnifiedNewsletterCapture
          variant="minimal"
          source="inline"
          context="showcase"
          category="commands"
        />
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Card Variant</h2>
        <div className="max-w-sm">
          <UnifiedNewsletterCapture
            variant="card"
            source="inline"
            context="showcase"
            category="guides"
          />
        </div>
      </div>
    </div>
  ),
};

/**
 * All categories showcase (inline variant)
 */
export const AllCategories: Story = {
  render: () => (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold mb-3">Agents</h2>
        <UnifiedNewsletterCapture
          variant="inline"
          source="content_page"
          context="showcase"
          category="agents"
        />
      </div>

      <div>
        <h2 className="text-xl font-bold mb-3">MCP Servers</h2>
        <UnifiedNewsletterCapture
          variant="inline"
          source="content_page"
          context="showcase"
          category="mcp"
        />
      </div>

      <div>
        <h2 className="text-xl font-bold mb-3">Commands</h2>
        <UnifiedNewsletterCapture
          variant="inline"
          source="content_page"
          context="showcase"
          category="commands"
        />
      </div>

      <div>
        <h2 className="text-xl font-bold mb-3">Rules</h2>
        <UnifiedNewsletterCapture
          variant="inline"
          source="content_page"
          context="showcase"
          category="rules"
        />
      </div>

      <div>
        <h2 className="text-xl font-bold mb-3">Hooks</h2>
        <UnifiedNewsletterCapture
          variant="inline"
          source="content_page"
          context="showcase"
          category="hooks"
        />
      </div>

      <div>
        <h2 className="text-xl font-bold mb-3">Guides</h2>
        <UnifiedNewsletterCapture
          variant="inline"
          source="content_page"
          context="showcase"
          category="guides"
        />
      </div>
    </div>
  ),
};

/**
 * All form sources showcase
 */
export const AllFormSources: Story = {
  render: () => (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h3 className="font-semibold mb-2">Inline Source</h3>
        <UnifiedNewsletterCapture variant="form" source="inline" />
      </div>
      <div>
        <h3 className="font-semibold mb-2">Footer Source</h3>
        <UnifiedNewsletterCapture variant="form" source="footer" />
      </div>
      <div>
        <h3 className="font-semibold mb-2">Homepage Source</h3>
        <UnifiedNewsletterCapture variant="form" source="homepage" />
      </div>
      <div>
        <h3 className="font-semibold mb-2">Modal Source</h3>
        <UnifiedNewsletterCapture variant="form" source="modal" />
      </div>
      <div>
        <h3 className="font-semibold mb-2">Content Page Source</h3>
        <UnifiedNewsletterCapture variant="form" source="content_page" />
      </div>
    </div>
  ),
};

/**
 * Interactive demo
 */
export const InteractiveDemo: Story = {
  render: function InteractiveDemoStory() {
    const [modalOpen, setModalOpen] = useState(false);

    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        <div>
          <h2 className="text-2xl font-bold mb-4">Try All Variants</h2>
          <p className="text-muted-foreground mb-6">
            Test the newsletter capture in different contexts. Try entering an email and submitting
            to see loading states, validation, and toast notifications.
          </p>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Simple Form</h3>
          <UnifiedNewsletterCapture variant="form" source="inline" className="max-w-md" />
        </div>

        <div>
          <h3 className="font-semibold mb-3">Inline CTA</h3>
          <UnifiedNewsletterCapture
            variant="inline"
            source="content_page"
            context="demo"
            category="agents"
          />
        </div>

        <div>
          <h3 className="font-semibold mb-3">Modal</h3>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
            type="button"
          >
            Open Modal
          </button>
          <UnifiedNewsletterCapture
            variant="modal"
            source="modal"
            open={modalOpen}
            onOpenChange={setModalOpen}
            copyType="markdown"
            category="guides"
          />
        </div>
      </div>
    );
  },
};

/**
 * Mobile responsive demo
 */
export const MobileResponsive: Story = {
  render: () => (
    <div className="max-w-sm mx-auto space-y-6">
      <div>
        <h3 className="font-semibold mb-3">Form on Mobile</h3>
        <UnifiedNewsletterCapture variant="form" source="inline" />
      </div>

      <div>
        <h3 className="font-semibold mb-3">Inline on Mobile</h3>
        <UnifiedNewsletterCapture
          variant="inline"
          source="content_page"
          context="mobile"
          category="agents"
        />
      </div>

      <div>
        <h3 className="font-semibold mb-3">Card on Mobile</h3>
        <UnifiedNewsletterCapture variant="card" source="inline" context="mobile" category="mcp" />
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
 * Custom content examples
 */
export const CustomContent: Story = {
  render: () => (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h3 className="font-semibold mb-3">Hero with Custom Content</h3>
        <UnifiedNewsletterCapture
          variant="hero"
          source="homepage"
          context="custom"
          headline="Join Our Growing Community"
          description="Get exclusive access to premium content and early feature releases."
        />
      </div>

      <div>
        <h3 className="font-semibold mb-3">Inline with Custom Content</h3>
        <UnifiedNewsletterCapture
          variant="inline"
          source="content_page"
          context="custom"
          headline="Never Miss an Update"
          description="Subscribe for the latest Claude tools, guides, and community highlights."
        />
      </div>
    </div>
  ),
};
