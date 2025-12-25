'use client';

/**
 * Category Newsletter CTA
 *
 * Displays a category-specific newsletter CTA on category list pages.
 * Uses contextual messaging based on the content category.
 *
 * Best practices:
 * - Contextual messaging increases relevance
 * - Category-specific value proposition
 * - Non-intrusive, inline with page flow
 */

import type { newsletter_source } from '@prisma/client';
import { NewsletterCTAVariant } from './newsletter-cta-variants';

export interface CategoryNewsletterCTAProps {
  /**
   * Content category for contextual messaging
   */
  category: string;

  /**
   * Newsletter source identifier
   */
  source: newsletter_source;

  /**
   * Optional className for styling
   */
  className?: string;
}

/**
 * Category Newsletter CTA Component
 *
 * Renders a category-specific newsletter CTA optimized for category list pages.
 * Uses contextual messaging based on the category to increase relevance and conversion.
 */
export function CategoryNewsletterCTA({ category, source, className }: CategoryNewsletterCTAProps) {
  // Category-specific messaging
  const categoryMessages: Record<
    string,
    {
      headline: string;
      description: string;
      ctaText: string;
    }
  > = {
    agents: {
      headline: 'Stay updated on the latest AI agents',
      description:
        'Get weekly updates on new agents, updates to existing ones, and tips for getting the most out of your AI workflow.',
      ctaText: 'Subscribe to agent updates',
    },
    mcp: {
      headline: 'Never miss a new MCP server',
      description:
        'We curate the best MCP servers and send you weekly updates on new releases, updates, and integration tips.',
      ctaText: 'Subscribe to MCP updates',
    },
    rules: {
      headline: 'Get the latest Claude rules & prompts',
      description:
        'Stay ahead with weekly updates on new rules, prompt engineering techniques, and optimization tips.',
      ctaText: 'Subscribe to rules updates',
    },
    commands: {
      headline: 'Master Claude commands & shortcuts',
      description:
        'Learn new commands, shortcuts, and productivity tips delivered to your inbox every week.',
      ctaText: 'Subscribe to command updates',
    },
    hooks: {
      headline: 'Level up with Claude hooks & integrations',
      description:
        'Get weekly updates on new hooks, integration patterns, and advanced workflow techniques.',
      ctaText: 'Subscribe to hooks updates',
    },
    statuslines: {
      headline: 'Discover new statusline configurations',
      description:
        'Stay updated on the latest statusline themes, configurations, and customization tips.',
      ctaText: 'Subscribe to statusline updates',
    },
    guides: {
      headline: 'Master Claude with our guides',
      description:
        'Get weekly updates on new guides, tutorials, and best practices to help you master Claude.',
      ctaText: 'Subscribe to guide updates',
    },
    jobs: {
      headline: 'Find your next AI job',
      description:
        'Get weekly updates on new job listings, career tips, and industry insights delivered to your inbox.',
      ctaText: 'Subscribe to job updates',
    },
    changelog: {
      headline: 'Stay updated on Claude Pro Directory',
      description: 'Get notified when we release new features, improvements, and platform updates.',
      ctaText: 'Subscribe to updates',
    },
    collections: {
      headline: 'Discover curated collections',
      description:
        'Get weekly updates on new collections, curated content, and community highlights.',
      ctaText: 'Subscribe to collection updates',
    },
    skills: {
      headline: 'Master Claude skills',
      description:
        'Stay ahead with weekly updates on new skills, techniques, and advanced usage patterns.',
      ctaText: 'Subscribe to skills updates',
    },
  };

  const messages = categoryMessages[category] ?? categoryMessages['agents'];
  if (!messages) {
    return null;
  }

  return (
    <div className={className}>
      <NewsletterCTAVariant
        variant="card"
        source={source}
        category={category}
        headline={messages.headline}
        description={messages.description}
      />
    </div>
  );
}
