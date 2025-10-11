/**
 * Breadcrumb Structured Data Component
 *
 * Generates Schema.org BreadcrumbList JSON-LD for detail pages.
 * Improves SEO and AI citation by providing clear page hierarchy.
 *
 * October 2025 SEO Optimization:
 * - BreadcrumbList schema for better SERP display
 * - Enables Google breadcrumb rich snippets
 * - Helps AI understand content hierarchy
 * - Server-side only (AI bots skip client-side JavaScript)
 * - CSP nonce support for security
 *
 * @module components/structured-data/breadcrumb-schema
 */

import { headers } from 'next/headers';
import Script from 'next/script';
import { APP_CONFIG } from '@/src/lib/constants';
import { serializeJsonLd } from '@/src/lib/schemas/form.schema';

export interface BreadcrumbItem {
  /** Display name for breadcrumb */
  name: string;
  /** Full URL to the page */
  url: string;
}

export interface BreadcrumbSchemaProps {
  /** Array of breadcrumb items in order (Home is added automatically) */
  items: BreadcrumbItem[];
}

/**
 * Generate BreadcrumbList JSON-LD schema
 *
 * @param props - Breadcrumb items (Home is automatically prepended)
 * @returns Script tag with JSON-LD schema
 *
 * @example
 * ```tsx
 * <BreadcrumbSchema
 *   items={[
 *     { name: "MCP Servers", url: "https://claudepro.directory/mcp" },
 *     { name: "GitHub MCP Server", url: "https://claudepro.directory/mcp/github-mcp-server" }
 *   ]}
 * />
 * ```
 */
export async function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  // Extract nonce from CSP header for script security
  const headersList = await headers();
  const cspHeader = headersList.get('content-security-policy');
  const nonce = cspHeader?.match(/nonce-([a-zA-Z0-9+/=]+)/)?.[1];

  // Always include Home as first breadcrumb
  const homeItem: BreadcrumbItem = {
    name: 'Home',
    url: APP_CONFIG.url,
  };

  const allItems = [homeItem, ...items];

  const breadcrumbList = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: allItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@id': item.url,
        name: item.name,
      },
    })),
  };

  return (
    <Script
      id={`breadcrumb-schema-${items[items.length - 1]?.url.split('/').pop() || 'default'}`}
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data is generated from validated schema
      dangerouslySetInnerHTML={{
        __html: serializeJsonLd(breadcrumbList),
      }}
      strategy="afterInteractive"
      nonce={nonce}
    />
  );
}
