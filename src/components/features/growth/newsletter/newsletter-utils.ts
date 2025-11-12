import { newsletterConfigs } from '@/src/lib/flags';
import { NEWSLETTER_CTA_CONFIG } from '@/src/lib/config/category-config';

/**
 * Newsletter config type from Statsig
 */
type NewsletterConfig = Record<string, unknown>;

/**
 * Format subscriber count for social proof display
 * Rounds to nearest friendly number (14 → "14+", 1,234 → "1.2k+")
 */
export function formatSubscriberCount(count: number | null): string {
  if (!count || count === 0) return '10+'; // Minimum social proof

  if (count < 100) return `${count}+`;
  if (count < 1000) return `${Math.floor(count / 10) * 10}+`;
  if (count < 10000) return `${(count / 1000).toFixed(1)}k+`;
  return `${Math.floor(count / 1000)}k+`;
}

/**
 * CTA copy variants for A/B testing
 * Returns headline/description based on experiment variant
 * Accepts optional Statsig config for dynamic copy
 */
export function getCTAVariantCopy(
  variant: 'aggressive' | 'social_proof' | 'value_focused',
  subscriberCount: string,
  config?: NewsletterConfig
): {
  headline: string;
  description: string;
} {
  // Use Statsig config if provided, otherwise fall back to hardcoded defaults
  const variants = {
    aggressive: {
      headline:
        (config?.['newsletter.cta.aggressive.headline'] as string) ||
        `🚀 Join ${subscriberCount === '10+' ? '10,000+' : subscriberCount} Claude Power Users`,
      description:
        (config?.['newsletter.cta.aggressive.description'] as string) ||
        'Get exclusive tips, tools, and strategies before everyone else. Level up your Claude game.',
    },
    social_proof: {
      headline:
        (config?.['newsletter.cta.social_proof.headline'] as string) ||
        `${subscriberCount} subscribers already crushing it`,
      description:
        (config?.['newsletter.cta.social_proof.description'] as string) ||
        'Join the community getting weekly Claude updates, tools, and insider tips.',
    },
    value_focused: {
      headline:
        (config?.['newsletter.cta.value_focused.headline'] as string) ||
        'Save 5 Hours/Week with Claude Tips',
      description:
        (config?.['newsletter.cta.value_focused.description'] as string) ||
        'Get actionable Claude workflows, tools, and productivity hacks delivered weekly.',
    },
  };

  return variants[variant];
}

/**
 * Get contextual newsletter message based on category
 * Accepts optional Statsig config for dynamic copy
 */
export function getContextualMessage(
  category?: string,
  config?: NewsletterConfig
): {
  headline: string;
  description: string;
} {
  const messages = {
    agents: {
      headline:
        (config?.['newsletter.contextual.agents.headline'] as string) || 'Get New AI Agents Weekly',
      description:
        (config?.['newsletter.contextual.agents.description'] as string) ||
        'Discover powerful Claude agents delivered to your inbox every week.',
    },
    mcp: {
      headline:
        (config?.['newsletter.contextual.mcp.headline'] as string) || 'New MCP Servers Weekly',
      description:
        (config?.['newsletter.contextual.mcp.description'] as string) ||
        'Never miss a Model Context Protocol integration. Get weekly updates.',
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
      headline:
        (config?.['newsletter.contextual.guides.headline'] as string) || 'More Guides Like This',
      description:
        (config?.['newsletter.contextual.guides.description'] as string) ||
        'Get tutorials, tips, and guides delivered to your inbox weekly.',
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

/**
 * Load newsletter config from Statsig
 * Call this once and pass to getCTAVariantCopy/getContextualMessage
 */
export async function loadNewsletterConfig(): Promise<NewsletterConfig> {
  try {
    return await newsletterConfigs();
  } catch {
    return {}; // Fall back to hardcoded defaults
  }
}
