'use client';

/**
 * Explore Dropdown Component
 * 
 * Hover dropdown that provides access to content variants:
 * - LLMs.txt (AI-optimized plain text)
 * - Markdown export
 * - JSON export
 * - RSS/Atom feeds (for category pages)
 * - Future: AI chat integration
 */

import {
  Download,
  ExternalLink,
  FileJson,
  MessageSquare,
  Rss,
  Sparkles,
} from '@heyclaude/web-runtime/icons';
import {
  NavigationHoverCard,
  NavigationHoverCardTrigger,
  NavigationHoverCardContent,
  Button,
  cn,
} from '@heyclaude/web-runtime/ui';
import Link from 'next/link';
import { useMemo } from 'react';

interface ExploreDropdownProps {
  /** Content category (e.g., 'agents', 'mcp') */
  category?: string;
  /** Content slug (for detail pages) */
  slug?: string;
  /** Page type determines which options are available */
  pageType: 'detail' | 'category' | 'home';
  /** Optional className for styling */
  className?: string;
  /** Whether this is a changelog route */
  isChangelog?: boolean;
  /** Whether this is a tools route */
  isTools?: boolean;
}

interface ExploreItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  disabled?: boolean;
}

export function ExploreDropdown({
  category,
  slug,
  pageType,
  className,
  isChangelog,
  isTools,
}: ExploreDropdownProps) {
  const items = useMemo<ExploreItem[]>(() => {
    const baseItems: ExploreItem[] = [];

    // Handle changelog routes
    if (isChangelog) {
      if (slug && pageType === 'detail') {
        // Changelog entry detail page
        baseItems.push({
          label: 'View LLMs.txt',
          href: `/changelog/${slug}/llms.txt`,
          icon: Sparkles,
          description: 'AI-optimized plain text format',
        });
      } else if (pageType === 'category') {
        // Changelog category page
        baseItems.push({
          label: 'View LLMs.txt',
          href: '/changelog/llms.txt',
          icon: Sparkles,
          description: 'Changelog LLMs.txt export',
        });
        baseItems.push({
          label: 'RSS Feed',
          href: '/changelog/rss.xml',
          icon: Rss,
          description: 'Subscribe to RSS feed',
        });
        baseItems.push({
          label: 'Atom Feed',
          href: '/changelog/atom.xml',
          icon: Rss,
          description: 'Subscribe to Atom feed',
        });
      }
      return baseItems;
    }

    // Handle tools routes
    if (isTools && slug) {
      // Only show LLMs.txt on base tool pages (not nested routes like /results/[id])
      // Base tool pages have slugs without slashes (e.g., 'config-recommender')
      // Nested routes have slashes (e.g., 'config-recommender/results/123')
      if (!slug.includes('/')) {
        baseItems.push({
          label: 'View LLMs.txt',
          href: `/tools/${slug}/llms.txt`,
          icon: Sparkles,
          description: 'AI-optimized plain text format',
        });
      }
      return baseItems;
    }

    // Handle content category routes
    if (category) {
      // LLMs.txt (always available for detail and category pages)
      if (slug && pageType === 'detail') {
        baseItems.push({
          label: 'View LLMs.txt',
          href: `/${category}/${slug}/llms.txt`,
          icon: Sparkles,
          description: 'AI-optimized plain text format',
        });
      } else if (pageType === 'category') {
        baseItems.push({
          label: 'View LLMs.txt',
          href: `/${category}/llms.txt`,
          icon: Sparkles,
          description: 'Category LLMs.txt export',
        });
      }

      // Markdown export (detail pages only)
      if (category && slug && pageType === 'detail') {
        baseItems.push({
          label: 'Download Markdown',
          href: `/api/content/${category}/${slug}?format=markdown`,
          icon: Download,
          description: 'Download as Markdown file',
        });
      }

      // JSON export (detail pages only)
      if (category && slug && pageType === 'detail') {
        baseItems.push({
          label: 'Download JSON',
          href: `/api/content/${category}/${slug}?format=json`,
          icon: FileJson,
          description: 'Download as JSON file',
        });
      }

      // RSS/Atom feeds (category pages)
      if (category && pageType === 'category') {
        baseItems.push({
          label: 'RSS Feed',
          href: `/${category}/rss.xml`,
          icon: Rss,
          description: 'Subscribe to RSS feed',
        });
        baseItems.push({
          label: 'Atom Feed',
          href: `/${category}/atom.xml`,
          icon: Rss,
          description: 'Subscribe to Atom feed',
        });
      }
    }

    // Sitewide LLMs.txt (available on any page)
    if (pageType === 'home' || (!category && !isChangelog && !isTools)) {
      baseItems.push({
        label: 'View Site LLMs.txt',
        href: '/llms.txt',
        icon: Sparkles,
        description: 'Sitewide AI-optimized plain text format',
      });
    }

    // Future: AI Chat (placeholder for detail pages)
    if (pageType === 'detail') {
      baseItems.push({
        label: 'Ask Claude about this page',
        href: '/feedback?type=ai-chat-request',
        icon: MessageSquare,
        description: 'Coming soon: AI chat integration',
        disabled: true,
      });
    }

    return baseItems;
  }, [category, slug, pageType, isChangelog, isTools]);

  // Don't render if no items available
  if (items.length === 0) {
    return null;
  }

  return (
    <NavigationHoverCard openDelay={200} closeDelay={300}>
      <NavigationHoverCardTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('text-muted-foreground hover:text-foreground text-xs', className)}
          aria-label="Explore content variants"
        >
          <span>Explore here</span>
          <ExternalLink className="h-3 w-3 ml-1" />
        </Button>
      </NavigationHoverCardTrigger>
      <NavigationHoverCardContent align="end" className="w-56 p-2" sideOffset={8}>
        <div className="space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            if (item.disabled) {
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md opacity-50 cursor-not-allowed"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium">{item.label}</div>
                    {item.description && (
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    )}
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent/5 transition-colors group/item"
              >
                <Icon className="h-4 w-4 text-muted-foreground group-hover/item:text-foreground transition-colors" />
                <div className="flex-1">
                  <div className="font-medium">{item.label}</div>
                  {item.description && (
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </NavigationHoverCardContent>
    </NavigationHoverCard>
  );
}
