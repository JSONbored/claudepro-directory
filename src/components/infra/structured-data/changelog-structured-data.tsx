/**
 * Changelog Structured Data Components
 *
 * Renders Schema.org JSON-LD structured data for changelog pages.
 * Follows Next.js 15 patterns with CSP nonce support.
 *
 * @module components/structured-data/changelog-structured-data
 */

import Script from 'next/script';
import type { ChangelogEntry } from '@/src/lib/changelog/loader';
import {
  buildChangelogArticleSchema,
  buildChangelogBlogSchema,
} from '@/src/lib/changelog/structured-data';
import { serializeJsonLd } from '@/src/lib/utils/jsonld.utils';

/**
 * Changelog List Page Structured Data
 *
 * Renders Blog schema for the main /changelog page.
 *
 * @param props - Component props
 * @param props.entries - All changelog entries
 * @returns Script tag with JSON-LD
 */
export async function ChangelogBlogStructuredData({ entries }: { entries: ChangelogEntry[] }) {
  const schema = buildChangelogBlogSchema(entries);
  const schemaId = 'structured-data-changelog-blog';

  return (
    <Script
      id={schemaId}
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data is generated from validated Zod schemas
      dangerouslySetInnerHTML={{
        __html: serializeJsonLd(schema),
      }}
      strategy="afterInteractive"
    />
  );
}

/**
 * Changelog Entry Page Structured Data
 *
 * Renders TechArticle schema for individual /changelog/[slug] pages.
 *
 * @param props - Component props
 * @param props.entry - Changelog entry
 * @returns Script tag with JSON-LD
 */
export async function ChangelogArticleStructuredData({ entry }: { entry: ChangelogEntry }) {
  const schema = buildChangelogArticleSchema(entry);
  const schemaId = `structured-data-changelog-${entry.slug}`;

  return (
    <Script
      id={schemaId}
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data is generated from validated Zod schemas
      dangerouslySetInnerHTML={{
        __html: serializeJsonLd(schema),
      }}
      strategy="afterInteractive"
    />
  );
}
