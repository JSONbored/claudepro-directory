/**
 * Changelog Structured Data Generators
 *
 * Builds Schema.org JSON-LD structured data for changelog pages.
 * Optimized for SEO and AI crawler discovery (Google, Bing, Perplexity, ChatGPT).
 *
 * @module lib/changelog/structured-data
 *
 * Schemas Generated:
 * - Blog: Main changelog list page
 * - TechArticle: Individual changelog entries
 * - BreadcrumbList: Navigation breadcrumbs
 *
 * Production Standards:
 * - Full Schema.org compliance
 * - AI citation optimized
 * - Type-safe with TypeScript
 * - Follows existing structured-data patterns
 */

import { formatChangelogDateISO8601, getChangelogUrl } from '@/src/lib/changelog/utils';
import { APP_CONFIG } from '@/src/lib/constants';
import type { ChangelogEntry } from '@/src/lib/schemas/changelog.schema';

/**
 * Base schema context
 */
const SCHEMA_CONTEXT = 'https://schema.org' as const;

/**
 * Schema object type
 */
export type SchemaObject = Record<string, unknown>;

/**
 * Build Blog schema for main changelog page
 *
 * @param entries - All changelog entries (for recent posts)
 * @returns Blog schema JSON-LD object
 *
 * @example
 * ```typescript
 * const schema = buildChangelogBlogSchema(entries);
 * // <script type="application/ld+json">{JSON.stringify(schema)}</script>
 * ```
 */
export function buildChangelogBlogSchema(entries: ChangelogEntry[]): SchemaObject {
  // Get latest 10 entries for blogPost list
  const recentEntries = entries.slice(0, 10);

  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'Blog',
    '@id': `${APP_CONFIG.url}/changelog`,
    name: `${APP_CONFIG.name} Changelog`,
    description: `Track all platform updates, new features, bug fixes, and improvements to ${APP_CONFIG.name}.`,
    url: `${APP_CONFIG.url}/changelog`,
    inLanguage: 'en-US',
    publisher: {
      '@type': 'Organization',
      name: APP_CONFIG.author,
      url: APP_CONFIG.url,
      logo: {
        '@type': 'ImageObject',
        url: `${APP_CONFIG.url}/icon.svg`,
      },
    },
    blogPost: recentEntries.map((entry) => ({
      '@type': 'BlogPosting',
      '@id': getChangelogUrl(entry.slug),
      headline: entry.title,
      description: entry.tldr || entry.content.slice(0, 200),
      url: getChangelogUrl(entry.slug),
      datePublished: formatChangelogDateISO8601(entry.date),
      dateModified: formatChangelogDateISO8601(entry.date),
      author: {
        '@type': 'Organization',
        name: APP_CONFIG.author,
      },
    })),
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          item: {
            '@id': APP_CONFIG.url,
            name: 'Home',
          },
        },
        {
          '@type': 'ListItem',
          position: 2,
          item: {
            '@id': `${APP_CONFIG.url}/changelog`,
            name: 'Changelog',
          },
        },
      ],
    },
  };
}

/**
 * Build TechArticle schema for individual changelog entry
 *
 * @param entry - Changelog entry
 * @returns TechArticle schema JSON-LD object
 *
 * @example
 * ```typescript
 * const schema = buildChangelogArticleSchema(entry);
 * // <script type="application/ld+json">{JSON.stringify(schema)}</script>
 * ```
 */
export function buildChangelogArticleSchema(entry: ChangelogEntry): SchemaObject {
  const entryUrl = getChangelogUrl(entry.slug);

  // Build category tags
  const categories = [];
  if (entry.categories.Added.length > 0) categories.push('New Features');
  if (entry.categories.Changed.length > 0) categories.push('Improvements');
  if (entry.categories.Fixed.length > 0) categories.push('Bug Fixes');
  if (entry.categories.Security.length > 0) categories.push('Security Updates');
  if (entry.categories.Deprecated.length > 0) categories.push('Deprecations');
  if (entry.categories.Removed.length > 0) categories.push('Removals');

  // Build description from TL;DR or content
  const description = entry.tldr || entry.content.slice(0, 300);

  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'TechArticle',
    '@id': entryUrl,
    headline: entry.title,
    description,
    url: entryUrl,
    datePublished: formatChangelogDateISO8601(entry.date),
    dateModified: formatChangelogDateISO8601(entry.date),
    author: {
      '@type': 'Organization',
      name: APP_CONFIG.author,
      url: APP_CONFIG.url,
    },
    publisher: {
      '@type': 'Organization',
      name: APP_CONFIG.author,
      url: APP_CONFIG.url,
      logo: {
        '@type': 'ImageObject',
        url: `${APP_CONFIG.url}/icon.svg`,
      },
    },
    inLanguage: 'en-US',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': entryUrl,
    },
    about: {
      '@type': 'SoftwareApplication',
      name: APP_CONFIG.name,
      applicationCategory: 'DeveloperApplication',
    },
    keywords: ['changelog', 'updates', 'release notes', APP_CONFIG.name, ...categories].join(', '),
    articleSection: 'Product Updates',
    isPartOf: {
      '@type': 'Blog',
      '@id': `${APP_CONFIG.url}/changelog`,
      name: `${APP_CONFIG.name} Changelog`,
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          item: {
            '@id': APP_CONFIG.url,
            name: 'Home',
          },
        },
        {
          '@type': 'ListItem',
          position: 2,
          item: {
            '@id': `${APP_CONFIG.url}/changelog`,
            name: 'Changelog',
          },
        },
        {
          '@type': 'ListItem',
          position: 3,
          item: {
            '@id': entryUrl,
            name: entry.title,
          },
        },
      ],
    },
  };
}

/**
 * Build standalone BreadcrumbList schema
 *
 * @param entry - Optional changelog entry (for entry pages)
 * @returns BreadcrumbList schema JSON-LD object
 */
export function buildChangelogBreadcrumb(entry?: ChangelogEntry): SchemaObject {
  const items = [
    {
      '@type': 'ListItem' as const,
      position: 1,
      item: {
        '@id': APP_CONFIG.url,
        name: 'Home',
      },
    },
    {
      '@type': 'ListItem' as const,
      position: 2,
      item: {
        '@id': `${APP_CONFIG.url}/changelog`,
        name: 'Changelog',
      },
    },
  ];

  if (entry) {
    items.push({
      '@type': 'ListItem' as const,
      position: 3,
      item: {
        '@id': getChangelogUrl(entry.slug),
        name: entry.title,
      },
    });
  }

  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}
