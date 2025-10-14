/**
 * Inline Email CTA Component
 *
 * Reusable email capture CTA with multiple variants for different contexts.
 * Uses existing NewsletterForm component with contextual messaging.
 *
 * Variants:
 * - hero: Large, prominent (homepage, landing pages)
 * - inline: Mid-content card (detail pages, guides)
 * - minimal: Compact single-line (category pages, sidebars)
 * - card: Grid item size (browse pages with content grids)
 *
 * @module components/shared/inline-email-cta
 */

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { Mail } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';
import { NewsletterForm } from './newsletter-form';

export interface InlineEmailCTAProps {
  /**
   * Visual variant for different contexts
   */
  variant: 'hero' | 'inline' | 'minimal' | 'card';

  /**
   * Context for analytics tracking
   */
  context: string;

  /**
   * Optional content category for contextual messaging
   */
  category?: string;

  /**
   * Custom headline (overrides default)
   */
  headline?: string;

  /**
   * Custom description (overrides default)
   */
  description?: string;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Get contextual messaging based on category
 */
function getContextualMessage(category?: string): {
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
      headline: 'Stay Updated with ClaudePro',
      description: 'Get weekly updates on new tools, guides, and community highlights.',
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
 * InlineEmailCTA Component
 *
 * Displays email capture CTA with appropriate styling for context.
 *
 * @param props - Component props
 * @returns Email CTA with variant styling
 *
 * @example
 * ```tsx
 * // Hero variant (homepage)
 * <InlineEmailCTA variant="hero" context="homepage" />
 *
 * // Inline variant (content detail)
 * <InlineEmailCTA
 *   variant="inline"
 *   context="content-detail"
 *   category="agents"
 * />
 *
 * // Minimal variant (category page)
 * <InlineEmailCTA variant="minimal" context="category-page" />
 * ```
 */
export function InlineEmailCTA({
  variant,
  context: _context, // Reserved for future granular analytics tracking
  category,
  headline: customHeadline,
  description: customDescription,
  className,
}: InlineEmailCTAProps) {
  const { headline, description } = getContextualMessage(category);
  const finalHeadline = customHeadline || headline;
  const finalDescription = customDescription || description;

  // Hero Variant - Large, prominent
  if (variant === 'hero') {
    return (
      <div
        className={cn(
          'w-full bg-gradient-to-br from-primary/10 via-accent/5 to-background',
          'border border-primary/20 rounded-lg p-8 md:p-12',
          'text-center',
          className
        )}
      >
        <div className={`${UI_CLASSES.FLEX} justify-center mb-4`}>
          <div className="p-4 bg-primary/10 rounded-full">
            <Mail className="h-8 w-8 text-primary" aria-hidden="true" />
          </div>
        </div>
        <h2 className={`text-3xl md:text-4xl ${UI_CLASSES.FONT_BOLD} ${UI_CLASSES.MB_4}`}>
          {finalHeadline}
        </h2>
        <p className={`text-lg text-muted-foreground ${UI_CLASSES.MB_6} max-w-2xl mx-auto`}>
          {finalDescription}
        </p>
        <div className="max-w-md mx-auto">
          <NewsletterForm source="inline" className="w-full" />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          No spam. Unsubscribe anytime. Join 1,000+ Claude users.
        </p>
      </div>
    );
  }

  // Inline Variant - Mid-content card
  if (variant === 'inline') {
    return (
      <Card className={cn('border-primary/20 bg-card/50', className)}>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-md">
              <Mail className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <CardTitle className="text-xl">{finalHeadline}</CardTitle>
          </div>
          <CardDescription className="text-base">{finalDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <NewsletterForm source="inline" />
          <p className="mt-3 text-xs text-muted-foreground">
            Join our community of Claude power users. No spam, unsubscribe anytime.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Minimal Variant - Compact single-line
  if (variant === 'minimal') {
    return (
      <div
        className={cn(
          'flex items-center justify-between gap-4 p-4',
          'bg-accent/5 border border-border/50 rounded-lg',
          className
        )}
      >
        <div className="flex items-center gap-3 flex-1">
          <Mail className="h-4 w-4 text-primary flex-shrink-0" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{finalHeadline}</p>
            <p className="text-xs text-muted-foreground truncate">{finalDescription}</p>
          </div>
        </div>
        <NewsletterForm source="inline" className="w-[300px] flex-shrink-0" />
      </div>
    );
  }

  // Card Variant - Grid item (same size as content cards)
  if (variant === 'card') {
    return (
      <Card
        className={cn(
          'h-full flex flex-col border-primary/20 bg-gradient-to-br from-primary/5 to-background',
          className
        )}
      >
        <CardHeader className="flex-1">
          <div className="mb-4">
            <div className="inline-flex p-3 bg-primary/10 rounded-lg">
              <Mail className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
          </div>
          <CardTitle className="text-xl mb-2">{finalHeadline}</CardTitle>
          <CardDescription className="text-sm">{finalDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <NewsletterForm source="inline" />
          <p className="mt-3 text-xs text-muted-foreground text-center">Join 1,000+ subscribers</p>
        </CardContent>
      </Card>
    );
  }

  return null;
}
