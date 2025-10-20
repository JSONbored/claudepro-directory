import Script from 'next/script';
import { SEO_CONFIG } from '@/src/lib/config/seo-config';
import { APP_CONFIG } from '@/src/lib/constants';
import { serializeJsonLd } from '@/src/lib/schemas/form.schema';
import type { CategoryId } from '@/src/lib/schemas/shared.schema';
import { getContentItemUrl } from '@/src/lib/utils/content.utils';

interface StructuredDataProps {
  type?: string;
  data?: {
    slug?: string;
    author?: string;
    dateAdded?: string;
    lastModified?: string;
    tags?: string[];
    category?: string;
    [key: string]: unknown;
  };
  pageTitle?: string;
  pageDescription?: string;
  imageUrl?: string;
  publishDate?: string;
  breadcrumbs?: Array<{ name: string; url: string }>;
}

export function StructuredData({
  type = 'website',
  data,
  pageTitle,
  pageDescription,
}: StructuredDataProps) {
  // JSON-LD is structured data, not executable code - no CSP nonce needed

  const generateLD = () => {
    const baseUrl = APP_CONFIG.url;

    switch (type) {
      case 'website':
        return {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: APP_CONFIG.name,
          description: SEO_CONFIG.defaultDescription,
          url: baseUrl,
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${baseUrl}/search?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
          },
          publisher: {
            '@type': 'Organization',
            name: APP_CONFIG.name,
            url: baseUrl,
          },
        };

      case 'softwareApplication':
        if (!data || Array.isArray(data)) return null;
        return {
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: data.title || data.name || 'Unknown',
          description: data.description,
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
          author: {
            '@type': 'Person',
            name: data.author,
          },
          datePublished: data.dateAdded,
          dateModified: data.lastModified || data.dateAdded,
          keywords: data.tags?.join(', '),
          url: `${baseUrl}${getContentItemUrl({ category: (data.category as CategoryId) || 'agents', slug: data.slug || '' })}`,
        };

      case 'itemList':
        if (!Array.isArray(data)) return null;
        return {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: pageTitle || 'Content List',
          description: pageDescription,
          numberOfItems: data.length,
          itemListElement: data.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'SoftwareApplication',
              name: item.title || item.name || 'Unknown',
              description: item.description,
              url: `${baseUrl}${getContentItemUrl({ category: (item.category as CategoryId) || 'agents', slug: item.slug || '' })}`,
              author: {
                '@type': 'Person',
                name: item.author,
              },
            },
          })),
        };

      case 'article':
        if (!data || Array.isArray(data)) return null;
        return {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: data.title || data.name || 'Unknown',
          description: data.description,
          author: {
            '@type': 'Person',
            name: data.author,
          },
          datePublished: data.dateAdded,
          dateModified: data.lastModified || data.dateAdded,
          publisher: {
            '@type': 'Organization',
            name: APP_CONFIG.name,
            url: baseUrl,
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${baseUrl}${getContentItemUrl({ category: (data.category as CategoryId) || 'agents', slug: data.slug || '' })}`,
          },
          keywords: data.tags?.join(', '),
        };

      default:
        return null;
    }
  };

  const jsonLd = generateLD();

  if (!jsonLd) return null;

  return (
    <>
      {/* biome-ignore lint/correctness/useUniqueElementIds: Script tag needs consistent ID for Next.js */}
      <Script
        id="structured-data"
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD per Next.js official pattern with XSS escaping
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(jsonLd),
        }}
        strategy="afterInteractive"
      />
    </>
  );
}
