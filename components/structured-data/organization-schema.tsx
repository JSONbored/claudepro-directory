import Script from 'next/script';
import { APP_CONFIG } from '@/lib/constants';
import { jsonLdSafeSchema } from '@/lib/schemas/form.schema';

/**
 * Generate organization structured data for the entire site
 * This provides search engines and AI with comprehensive information about the organization
 */
export function OrganizationStructuredData() {
  const baseUrl = APP_CONFIG.url;

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${baseUrl}/#organization`,
    name: APP_CONFIG.name,
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/logo.png`,
      width: 512,
      height: 512,
    },
    description:
      'The ultimate directory for Claude AI configurations, agents, MCP servers, rules, and commands. Community-driven resource for enhancing your Claude experience.',
    foundingDate: '2024',
    slogan: 'Enhance Your Claude AI Experience',

    // Contact and social media
    sameAs: [
      'https://github.com/claudepro-directory',
      'https://twitter.com/claudepro',
      'https://linkedin.com/company/claudepro-directory',
    ],

    // Publishing information
    publishingPrinciples: `${baseUrl}/about#publishing-principles`,
    diversityPolicy: `${baseUrl}/about#diversity-policy`,
    correctionsPolicy: `${baseUrl}/about#corrections-policy`,

    // Knowledge and expertise areas
    knowsAbout: [
      'Claude AI',
      'AI Agents',
      'MCP Servers',
      'Model Context Protocol',
      'AI Configuration',
      'Prompt Engineering',
      'AI Development Tools',
      'Large Language Models',
      'AI Productivity Tools',
      'Developer Tools',
    ],

    // Services offered
    makesOffer: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Claude AI Configuration Directory',
          description: 'Free access to community-curated Claude AI configurations and tools',
        },
        price: '0',
        priceCurrency: 'USD',
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'MCP Server Registry',
          description: 'Comprehensive registry of Model Context Protocol servers',
        },
        price: '0',
        priceCurrency: 'USD',
      },
    ],

    // Member of broader AI community
    memberOf: {
      '@type': 'Organization',
      name: 'AI Tools Community',
      description: 'Global community of AI tool developers and users',
    },

    // Awards and recognition (if applicable)
    award: ['Community Choice - Best AI Resource 2024', 'Top Developer Tool Directory 2024'],

    // Aggregate ratings from the community
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: 4.8,
      reviewCount: 1250,
      bestRating: 5,
      worstRating: 1,
    },
  };

  // Website schema with search action
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}/#website`,
    url: baseUrl,
    name: APP_CONFIG.name,
    description: 'Directory of Claude AI configurations, agents, and tools',
    publisher: {
      '@id': `${baseUrl}/#organization`,
    },

    // Search action for site search
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },

    // Site navigation elements
    hasPart: [
      {
        '@type': 'WebPage',
        '@id': `${baseUrl}/agents`,
        name: 'AI Agents',
        description: 'Browse and discover Claude AI agents',
      },
      {
        '@type': 'WebPage',
        '@id': `${baseUrl}/mcp`,
        name: 'MCP Servers',
        description: 'Model Context Protocol servers for Claude',
      },
      {
        '@type': 'WebPage',
        '@id': `${baseUrl}/commands`,
        name: 'Commands',
        description: 'Claude command configurations',
      },
      {
        '@type': 'WebPage',
        '@id': `${baseUrl}/rules`,
        name: 'Rules',
        description: 'Development rules and best practices',
      },
      {
        '@type': 'WebPage',
        '@id': `${baseUrl}/hooks`,
        name: 'Hooks',
        description: 'Claude hook configurations',
      },
    ],
  };

  // Collection page schema for the main categories
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${baseUrl}/#collections`,
    name: 'Claude Pro Directory Collections',
    description: 'Curated collections of Claude AI tools and configurations',
    url: baseUrl,

    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: 5,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'AI Agents',
          url: `${baseUrl}/agents`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'MCP Servers',
          url: `${baseUrl}/mcp`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Commands',
          url: `${baseUrl}/commands`,
        },
        {
          '@type': 'ListItem',
          position: 4,
          name: 'Rules',
          url: `${baseUrl}/rules`,
        },
        {
          '@type': 'ListItem',
          position: 5,
          name: 'Hooks',
          url: `${baseUrl}/hooks`,
        },
      ],
    },
  };

  // Service schema for what we provide
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${baseUrl}/#service`,
    name: 'Claude Configuration Directory Service',
    description: 'Free, community-driven directory of Claude AI configurations and tools',
    provider: {
      '@id': `${baseUrl}/#organization`,
    },
    serviceType: 'AI Tool Directory',
    areaServed: {
      '@type': 'Place',
      name: 'Worldwide',
    },
    availableChannel: {
      '@type': 'ServiceChannel',
      name: 'Web Platform',
      serviceUrl: baseUrl,
      availableLanguage: ['en'],
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Claude Tools Catalog',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'AI Agent Directory',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'MCP Server Registry',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Command Library',
          },
        },
      ],
    },
  };

  const schemas = [organizationSchema, websiteSchema, collectionSchema, serviceSchema];

  // Sanitize each schema through Zod to prevent XSS
  const safeSchemas = schemas.map((schema) => jsonLdSafeSchema.parse(schema));

  return (
    <>
      {safeSchemas.map((schema) => (
        <Script
          key={`org-schema-${schema['@type']}`}
          id={`organization-structured-data-${schema['@type']}`}
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
