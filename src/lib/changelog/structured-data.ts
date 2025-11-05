/**
 * Changelog Structured Data - Database-First Architecture
 * Schema.org JSON-LD generators for changelog pages using database types.
 */

import type { ChangelogEntry } from '@/src/lib/changelog/loader';
import { formatChangelogDateISO8601, getChangelogUrl } from '@/src/lib/changelog/utils';
import { APP_CONFIG } from '@/src/lib/constants';

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
      datePublished: formatChangelogDateISO8601(entry.release_date),
      dateModified: formatChangelogDateISO8601(entry.release_date),
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

  const changes =
    typeof entry.changes === 'object' && entry.changes !== null
      ? (entry.changes as Record<string, unknown>)
      : {};
  const categories = [];
  if (Array.isArray(changes.Added) && changes.Added.length > 0) categories.push('New Features');
  if (Array.isArray(changes.Changed) && changes.Changed.length > 0) categories.push('Improvements');
  if (Array.isArray(changes.Fixed) && changes.Fixed.length > 0) categories.push('Bug Fixes');
  if (Array.isArray(changes.Security) && changes.Security.length > 0)
    categories.push('Security Updates');
  if (Array.isArray(changes.Deprecated) && changes.Deprecated.length > 0)
    categories.push('Deprecations');
  if (Array.isArray(changes.Removed) && changes.Removed.length > 0) categories.push('Removals');

  const description = entry.tldr || entry.content.slice(0, 300);

  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'TechArticle',
    '@id': entryUrl,
    headline: entry.title,
    description,
    url: entryUrl,
    datePublished: formatChangelogDateISO8601(entry.release_date),
    dateModified: formatChangelogDateISO8601(entry.release_date),
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
