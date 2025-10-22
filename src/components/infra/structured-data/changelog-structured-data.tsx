/**
 * Changelog Structured Data Components
 *
 * Renders Schema.org JSON-LD structured data for changelog pages.
 * Follows Next.js 15 patterns with CSP nonce support.
 *
 * @module components/structured-data/changelog-structured-data
 */

import { headers } from 'next/headers';
import Script from 'next/script';
import {
  buildChangelogArticleSchema,
  buildChangelogBlogSchema,
} from '@/src/lib/changelog/structured-data';
import type { ChangelogEntry, ChangelogJson } from '@/src/lib/schemas/changelog.schema';
import { serializeJsonLd } from '@/src/lib/schemas/form.schema';

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
  // Extract nonce from CSP header for script security
  const headersList = await headers();
  const cspHeader = headersList.get('content-security-policy');
  const nonce = cspHeader?.match(/nonce-([a-zA-Z0-9+/=]+)/)?.[1];

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
      nonce={nonce}
    />
  );
}

/**
 * Changelog Entry Page Structured Data
 *
 * Renders TechArticle schema for individual /changelog/[slug] pages.
 * Accepts ChangelogJson format and converts to legacy format for schema builder.
 *
 * @param props - Component props
 * @param props.entry - Changelog entry (JSON format)
 * @returns Script tag with JSON-LD
 */
export async function ChangelogArticleStructuredData({ entry }: { entry: ChangelogJson }) {
  // Extract nonce from CSP header for script security
  const headersList = await headers();
  const cspHeader = headersList.get('content-security-policy');
  const nonce = cspHeader?.match(/nonce-([a-zA-Z0-9+/=]+)/)?.[1];

  // Convert ChangelogJson to legacy ChangelogEntry format for schema builder
  const legacyEntry: ChangelogEntry = {
    slug: entry.metadata.slug,
    date: entry.metadata.date,
    title: entry.metadata.title,
    tldr: entry.metadata.tldr,
    content: '', // Not needed for schema
    rawContent: '', // Not needed for schema
    categories: {
      Added: Array(entry.metadata.categories.Added).fill({ content: '' }),
      Changed: Array(entry.metadata.categories.Changed).fill({ content: '' }),
      Deprecated: Array(entry.metadata.categories.Deprecated).fill({ content: '' }),
      Removed: Array(entry.metadata.categories.Removed).fill({ content: '' }),
      Fixed: Array(entry.metadata.categories.Fixed).fill({ content: '' }),
      Security: Array(entry.metadata.categories.Security).fill({ content: '' }),
    },
  };

  const schema = buildChangelogArticleSchema(legacyEntry);
  const schemaId = `structured-data-changelog-${entry.metadata.slug}`;

  return (
    <Script
      id={schemaId}
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data is generated from validated Zod schemas
      dangerouslySetInnerHTML={{
        __html: serializeJsonLd(schema),
      }}
      strategy="afterInteractive"
      nonce={nonce}
    />
  );
}
