import Script from 'next/script';
import { APP_CONFIG } from '@/lib/constants';
import type { DatasetStructuredDataProps } from '@/lib/schemas/component.schema';
import { jsonLdSafeSchema } from '@/lib/schemas/form.schema';

/**
 * Generate Dataset structured data for configuration collections
 * This helps AI understand our content as structured datasets
 */
export function DatasetStructuredData({
  items,
  type,
  title,
  description,
}: DatasetStructuredDataProps) {
  const baseUrl = APP_CONFIG.url;

  const datasetSchema = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': `${baseUrl}/${type}#dataset`,
    name: title,
    description: description,
    url: `${baseUrl}/${type}`,

    // Dataset metadata
    identifier: `claudepro-${type}-dataset`,
    license: 'https://creativecommons.org/licenses/by/4.0/',
    isAccessibleForFree: true,

    // Creator and publisher
    creator: {
      '@type': 'Organization',
      name: APP_CONFIG.name,
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: APP_CONFIG.name,
      url: baseUrl,
    },

    // Temporal coverage
    temporalCoverage: `2024/${new Date().getFullYear()}`,
    datePublished: '2024-01-01',
    dateModified: new Date().toISOString(),

    // Keywords for discoverability
    keywords: [
      'Claude AI',
      type,
      'configurations',
      'tools',
      'prompts',
      'MCP',
      'Model Context Protocol',
    ].join(', '),

    // Distribution information
    distribution: [
      {
        '@type': 'DataDownload',
        '@id': `${baseUrl}/api/${type}#json`,
        name: `${title} - JSON API`,
        description: `JSON API endpoint for ${type} data`,
        encodingFormat: 'application/json',
        contentUrl: `${baseUrl}/api/${type}`,
      },
      {
        '@type': 'DataDownload',
        '@id': `${baseUrl}/static-api/${type}.json`,
        name: `${title} - Static JSON`,
        description: `Pre-generated static JSON file for ${type}`,
        encodingFormat: 'application/json',
        contentUrl: `${baseUrl}/static-api/${type}.json`,
        contentSize: `${Math.round(JSON.stringify(items).length / 1024)}KB`,
      },
    ],

    // Catalog information
    includedInDataCatalog: {
      '@type': 'DataCatalog',
      name: 'Claude Pro Directory Data Catalog',
      url: baseUrl,
    },

    // Measurement and statistics
    measurementTechnique: 'Community submissions and curation',
    variableMeasured: [
      {
        '@type': 'PropertyValue',
        name: 'Total Items',
        value: items.length,
      },
      {
        '@type': 'PropertyValue',
        name: 'Categories',
        value: [...new Set(items.map((item) => item.category))].length,
      },
      {
        '@type': 'PropertyValue',
        name: 'Last Updated',
        value: new Date().toISOString(),
      },
    ],

    // Spatial coverage (worldwide)
    spatialCoverage: {
      '@type': 'Place',
      name: 'Worldwide',
    },

    // Mentions for each item in the dataset
    mentions: items.slice(0, 10).map((item) => ({
      '@type': 'SoftwareApplication',
      name: item.title || item.name || item.slug,
      url: `${baseUrl}/${type}/${item.slug}`,
      description: item.description,
    })),
  };

  // DataCatalog schema for the entire collection
  const catalogSchema = {
    '@context': 'https://schema.org',
    '@type': 'DataCatalog',
    '@id': `${baseUrl}#datacatalog`,
    name: 'Claude Pro Directory Data Catalog',
    description: 'Comprehensive catalog of Claude AI configurations and tools',
    url: baseUrl,

    // Provider information
    provider: {
      '@type': 'Organization',
      name: APP_CONFIG.name,
      url: baseUrl,
    },

    // Dataset listing
    dataset: [
      `${baseUrl}/agents#dataset`,
      `${baseUrl}/mcp#dataset`,
      `${baseUrl}/commands#dataset`,
      `${baseUrl}/hooks#dataset`,
      `${baseUrl}/rules#dataset`,
    ],

    // Search action for the catalog
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={query}&type=${type}`,
      },
      'query-input': 'required name=query',
    },
  };

  // Create a structured ItemList for better AI understanding
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${baseUrl}/${type}#itemlist`,
    name: `${title} List`,
    description: `Complete list of ${type} available in the directory`,
    numberOfItems: items.length,

    // Include a sample of items for AI context
    itemListElement: items.slice(0, 20).map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'SoftwareApplication',
        '@id': `${baseUrl}/${type}/${item.slug}`,
        name: item.title || item.name || item.slug,
        description: item.description,
        url: `${baseUrl}/${type}/${item.slug}`,
        applicationCategory:
          type === 'agents'
            ? 'AI Agent'
            : type === 'mcp'
              ? 'MCP Server'
              : type === 'commands'
                ? 'Command Configuration'
                : type === 'hooks'
                  ? 'Hook Script'
                  : 'Development Rule',
        datePublished: item.dateAdded,
        dateModified: item.lastModified || item.dateAdded,
        author: {
          '@type': item.githubUrl?.includes('github.com/anthropics') ? 'Organization' : 'Person',
          name: item.author || 'Community',
        },
      },
    })),

    // Main entity reference
    mainEntityOfPage: {
      '@id': `${baseUrl}/${type}`,
    },
  };

  const schemas = [datasetSchema, catalogSchema, itemListSchema];

  // Sanitize each schema through Zod to prevent XSS
  const safeSchemas = schemas.map((schema) => jsonLdSafeSchema.parse(schema));

  return (
    <>
      {safeSchemas.map((schema) => (
        <Script
          key={`dataset-${type}-${schema['@type']}`}
          id={`dataset-structured-data-${type}-${schema['@type']}`}
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data is sanitized via Zod schema
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema),
          }}
          strategy="afterInteractive"
        />
      ))}
    </>
  );
}
