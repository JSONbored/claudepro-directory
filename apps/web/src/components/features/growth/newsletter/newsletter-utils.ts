import { NEWSLETTER_BEHAVIOR, NEWSLETTER_CTA } from '@heyclaude/web-runtime/config/unified-config';
import { ensureString, NEWSLETTER_CTA_CONFIG } from '@heyclaude/web-runtime/core';

/**
 * Newsletter config type
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
 * Accepts optional config for dynamic copy
 */
export function getCTAVariantCopy(
  variant: 'aggressive' | 'social_proof' | 'value_focused',
  subscriberCount: string,
  config?: NewsletterConfig
): {
  headline: string;
  description: string;
} {
  const variants = {
    aggressive: {
      headline: ensureString(
        config?.['newsletter.cta.aggressive.headline'],
        `🚀 Join ${subscriberCount === '10+' ? '10,000+' : subscriberCount} Claude Power Users`
      ),
      description: ensureString(
        config?.['newsletter.cta.aggressive.description'],
        'Get exclusive tips, tools, and strategies before everyone else. Level up your Claude game.'
      ),
    },
    social_proof: {
      headline: ensureString(
        config?.['newsletter.cta.social_proof.headline'],
        `${subscriberCount} subscribers already crushing it`
      ),
      description: ensureString(
        config?.['newsletter.cta.social_proof.description'],
        'Join the community getting weekly Claude updates, tools, and insider tips.'
      ),
    },
    value_focused: {
      headline: ensureString(
        config?.['newsletter.cta.value_focused.headline'],
        'Save 5 Hours/Week with Claude Tips'
      ),
      description: ensureString(
        config?.['newsletter.cta.value_focused.description'],
        'Get actionable Claude workflows, tools, and productivity hacks delivered weekly.'
      ),
    },
  };

  return variants[variant];
}

/**
 * Get contextual newsletter message based on category
 * Accepts optional config for dynamic copy
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
      headline: ensureString(
        config?.['newsletter.contextual.agents.headline'],
        'Get New AI Agents Weekly'
      ),
      description: ensureString(
        config?.['newsletter.contextual.agents.description'],
        'Discover powerful Claude agents delivered to your inbox every week.'
      ),
    },
    mcp: {
      headline: ensureString(
        config?.['newsletter.contextual.mcp.headline'],
        'New MCP Servers Weekly'
      ),
      description: ensureString(
        config?.['newsletter.contextual.mcp.description'],
        'Never miss a Model Context Protocol integration. Get weekly updates.'
      ),
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
      headline: ensureString(
        config?.['newsletter.contextual.guides.headline'],
        'More Guides Like This'
      ),
      description: ensureString(
        config?.['newsletter.contextual.guides.description'],
        'Get tutorials, tips, and guides delivered to your inbox weekly.'
      ),
    },
    default: {
      headline: NEWSLETTER_CTA_CONFIG.headline,
      description: NEWSLETTER_CTA_CONFIG.description,
    },
  } as const satisfies Record<string, { headline: string; description: string }>;

  if (!(category && category in messages)) {
    return messages.default;
  }

  return messages[category as keyof typeof messages];
}

/**
 * Load newsletter config from unified-config
 * Call this once and pass to getCTAVariantCopy/getContextualMessage
 * Returns legacy-compatible format for backward compatibility
 */
export async function loadNewsletterConfig(): Promise<NewsletterConfig> {
  // Build legacy-compatible config from unified-config
  return {
    'newsletter.cta.aggressive.headline': NEWSLETTER_CTA['aggressive.headline'],
    'newsletter.cta.social_proof.headline': NEWSLETTER_CTA['social_proof.headline'],
    'newsletter.cta.value_focused.headline': NEWSLETTER_CTA['value_focused.headline'],
    'newsletter.cta.aggressive.description': NEWSLETTER_CTA['aggressive.description'],
    'newsletter.cta.social_proof.description': NEWSLETTER_CTA['social_proof.description'],
    'newsletter.cta.value_focused.description': NEWSLETTER_CTA['value_focused.description'],
    'newsletter.contextual.agents.headline': NEWSLETTER_CTA['contextual.agents.headline'],
    'newsletter.contextual.agents.description': NEWSLETTER_CTA['contextual.agents.description'],
    'newsletter.contextual.mcp.headline': NEWSLETTER_CTA['contextual.mcp.headline'],
    'newsletter.contextual.mcp.description': NEWSLETTER_CTA['contextual.mcp.description'],
    'newsletter.contextual.guides.headline': NEWSLETTER_CTA['contextual.guides.headline'],
    'newsletter.contextual.guides.description': NEWSLETTER_CTA['contextual.guides.description'],
    'newsletter.footer_text': NEWSLETTER_CTA.footer_text,
    'newsletter.show_subscriber_count': NEWSLETTER_BEHAVIOR.show_subscriber_count,
    'newsletter.footer_bar.show_after_delay_ms': NEWSLETTER_BEHAVIOR.footer_bar_show_after_delay_ms,
    'newsletter.scroll_trigger.min_scroll_height_px': NEWSLETTER_BEHAVIOR.scroll_trigger_min_scroll_height_px,
    'newsletter.max_retries': NEWSLETTER_BEHAVIOR.max_retries,
    'newsletter.initial_retry_delay_ms': NEWSLETTER_BEHAVIOR.initial_retry_delay_ms,
    'newsletter.retry_backoff_multiplier': NEWSLETTER_BEHAVIOR.retry_backoff_multiplier,
    'newsletter.show_footer_bar': NEWSLETTER_BEHAVIOR.show_footer_bar,
    'newsletter.show_scroll_trigger': NEWSLETTER_BEHAVIOR.show_scroll_trigger,
  } as NewsletterConfig;
}
