'use client';

/**
 * Post-Content Newsletter CTA
 *
 * Displays a newsletter CTA after the main content on detail pages.
 * Uses contextual messaging based on the content category.
 *
 * Best practices:
 * - High conversion rate (user just consumed content)
 * - Contextual messaging increases relevance
 * - Non-intrusive, inline with content flow
 */

import type { newsletter_source } from '@prisma/client';
import { NewsletterCTAVariant } from './newsletter-cta-variants';

export interface PostContentNewsletterCTAProps {
  /**
   * Content category for contextual messaging
   */
  category?: string;

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
 * Post-Content Newsletter CTA Component
 *
 * Renders an inline newsletter CTA optimized for post-content placement.
 * Uses contextual messaging based on category.
 *
 * @param props.category - Content category for contextual messaging (e.g., 'mcp', 'agents')
 * @param props.source - Newsletter source identifier (e.g., 'content_page')
 * @param props.className - Optional additional CSS classes
 *
 * @example
 * ```tsx
 * <PostContentNewsletterCTA category="mcp" source="content_page" />
 * ```
 */
export function PostContentNewsletterCTA({
  category,
  source,
  className,
}: PostContentNewsletterCTAProps) {
  return (
    <div className={className}>
      <NewsletterCTAVariant
        variant="inline"
        source={source}
        {...(category ? { category } : {})}
      />
    </div>
  );
}

