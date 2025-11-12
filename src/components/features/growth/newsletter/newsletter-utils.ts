import { NEWSLETTER_CTA_CONFIG } from '@/src/lib/config/category-config';

export function getContextualMessage(category?: string): {
  headline: string;
  description: string;
} {
  const messages = {
    agents: {
      headline: 'Get New AI Agents Weekly',
      description: 'Discover powerful Claude agents delivered to your inbox every week.',
    },
    mcp: {
      headline: 'New MCP Servers Weekly',
      description: 'Never miss a Model Context Protocol integration. Get weekly updates.',
    },
    commands: {
      headline: 'Supercharge Your Workflow',
      description: 'Get new Claude commands and productivity tips in your inbox.',
    },
    rules: {
      headline: 'Master Claude Customization',
      description: 'Weekly updates on rules, configurations, and best practices.',
    },
    hooks: {
      headline: 'Automate with Claude Hooks',
      description: 'Get the latest automation hooks delivered weekly.',
    },
    guides: {
      headline: 'More Guides Like This',
      description: 'Get tutorials, tips, and guides delivered to your inbox weekly.',
    },
    default: {
      headline: NEWSLETTER_CTA_CONFIG.headline,
      description: NEWSLETTER_CTA_CONFIG.description,
    },
  } as const satisfies Record<string, { headline: string; description: string }>;

  if (!(category && category in messages)) {
    return messages.default;
  }

  return messages[category as keyof typeof messages] as {
    headline: string;
    description: string;
  };
}
