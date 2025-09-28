import Script from 'next/script';
import { APP_CONFIG } from '@/lib/constants';

interface APIReferenceStructuredDataProps {
  item: {
    slug: string;
    title?: string;
    name?: string;
    description: string;
    author?: string;
    dateAdded?: string;
    lastModified?: string;
    githubUrl?: string;
    documentationUrl?: string;
    configuration?: unknown;
    syntax?: unknown;
    script?: unknown;
    [key: string]: unknown;
  };
  type?: string;
  endpoints?: Record<string, unknown>[];
}

import { jsonLdSafeSchema } from '@/lib/schemas/form.schema';
import {
  type APIReference,
  apiReferenceSchema,
  type CodeRepository,
  codeRepositorySchema,
  type TechArticle,
  techArticleSchema,
  type WebAPI,
  webApiSchema,
} from '@/lib/schemas/structured-data.schema';

/**
 * Generate APIReference structured data for tool documentation
 * This helps AI and search engines understand API endpoints and technical documentation
 */
export function APIReferenceStructuredData({ item, type }: APIReferenceStructuredDataProps) {
  const baseUrl = APP_CONFIG.url;

  // Determine if this item has API-like properties
  const hasAPI = 'configuration' in item || 'syntax' in item || 'script' in item;

  if (!hasAPI) {
    return null;
  }

  const apiReferenceData: APIReference = apiReferenceSchema.parse({
    '@context': 'https://schema.org',
    '@type': 'APIReference',
    '@id': `${baseUrl}/${type}/${item.slug}#api`,
    name: `${item.title || item.name} API Reference`,
    description: `Technical documentation and API reference for ${item.name}`,
    url: `${baseUrl}/${type}/${item.slug}`,

    // Assembly and platform information
    assemblyVersion: '1.0.0',
    executableLibraryName: item.name,
    targetPlatform: 'Claude AI',

    // Programming language
    programmingLanguage: {
      '@type': 'ComputerLanguage',
      name:
        type === 'mcp'
          ? 'JSON Configuration'
          : type === 'commands'
            ? 'Command Syntax'
            : 'Shell Script',
    },

    // Documentation metadata
    datePublished: item.dateAdded,
    dateModified: item.lastModified || item.dateAdded,

    // Author information
    author: {
      '@type': item.githubUrl?.includes('github.com/anthropics') ? 'Organization' : 'Person',
      name: item.author || 'Unknown',
      url: item.githubUrl,
    },

    // Related software application
    isPartOf: {
      '@type': 'SoftwareApplication',
      name: 'Claude AI',
      applicationCategory: 'AI Assistant',
    },

    // Documentation sections
    hasPart: [] as Array<TechArticle>,
  });

  // Add configuration documentation for MCP servers
  if (type === 'mcp' && 'configuration' in item) {
    const techArticle: TechArticle = techArticleSchema.parse({
      '@type': 'TechArticle',
      '@id': `${baseUrl}/${type}/${item.slug}#config-docs`,
      headline: 'Configuration Documentation',
      articleBody: 'Complete configuration reference for Claude Desktop integration',
      encodingFormat: 'application/json',
      text: JSON.stringify(item.configuration, null, 2),
    });
    apiReferenceData.hasPart?.push(techArticle);
  }

  // Add syntax documentation for commands
  if (type === 'commands' && 'syntax' in item && typeof item.syntax === 'string') {
    const syntaxArticle: TechArticle = techArticleSchema.parse({
      '@type': 'TechArticle',
      '@id': `${baseUrl}/${type}/${item.slug}#syntax-docs`,
      headline: 'Command Syntax Documentation',
      articleBody: `Syntax reference: ${item.syntax}`,
      encodingFormat: 'text/plain',
      text: item.syntax,
    });
    apiReferenceData.hasPart?.push(syntaxArticle);

    // Add parameters documentation if available
    if ('parameters' in item && item.parameters) {
      const paramsArticle: TechArticle = techArticleSchema.parse({
        '@type': 'TechArticle',
        '@id': `${baseUrl}/${type}/${item.slug}#params-docs`,
        headline: 'Parameters Documentation',
        articleBody: 'Complete parameter reference for this command',
        text: JSON.stringify(item.parameters, null, 2),
      });
      apiReferenceData.hasPart?.push(paramsArticle);
    }
  }

  // Add script documentation for hooks
  if (type === 'hooks' && 'script' in item && typeof item.script === 'string') {
    const scriptArticle: TechArticle = techArticleSchema.parse({
      '@type': 'TechArticle',
      '@id': `${baseUrl}/${type}/${item.slug}#script-docs`,
      headline: 'Hook Script Documentation',
      articleBody: 'Complete script reference and implementation details',
      encodingFormat: 'application/x-sh',
      text: item.script,
    });
    apiReferenceData.hasPart?.push(scriptArticle);
  }

  // Add WebAPI schema for endpoint-like functionality
  const webAPIData: WebAPI = webApiSchema.parse({
    '@context': 'https://schema.org',
    '@type': 'WebAPI',
    '@id': `${baseUrl}/${type}/${item.slug}#webapi`,
    name: `${item.title || item.name} Integration API`,
    description: `Integration points and API surface for ${item.name}`,
    documentation: `${baseUrl}/${type}/${item.slug}`,

    // Provider
    provider: {
      '@type': 'Organization',
      name: item.author || 'Claude Pro Directory',
    },

    // API endpoints (conceptual for our tools)
    endpointUrl: [
      type === 'mcp'
        ? `mcp://${item.slug}`
        : type === 'commands'
          ? `claude://command/${item.slug}`
          : `claude://hook/${item.slug}`,
    ],

    // API category
    category:
      type === 'mcp'
        ? 'Model Context Protocol'
        : type === 'commands'
          ? 'Command Interface'
          : 'Event Hook',
  });

  // Add CodeRepository schema if GitHub URL exists
  const schemas: Array<APIReference | WebAPI | CodeRepository> = [apiReferenceData, webAPIData];

  if (item.githubUrl) {
    const codeRepoData: CodeRepository = codeRepositorySchema.parse({
      '@context': 'https://schema.org',
      '@type': 'CodeRepository',
      '@id': `${baseUrl}/${type}/${item.slug}#repo`,
      name: `${item.title || item.name} Repository`,
      description: `Source code repository for ${item.name}`,
      url: item.githubUrl,
      codeRepository: item.githubUrl,

      // Programming language based on type
      programmingLanguage: {
        '@type': 'ComputerLanguage',
        name: type === 'mcp' ? 'TypeScript' : type === 'commands' ? 'JSON' : 'Shell',
      },

      // Link to main documentation
      mainEntityOfPage: {
        '@id': `${baseUrl}/${type}/${item.slug}`,
      },
    });
    schemas.push(codeRepoData);
  }

  // Sanitize each schema through Zod to prevent XSS
  const safeSchemas = schemas.map((schema) => jsonLdSafeSchema.parse(schema));

  return (
    <>
      {safeSchemas.map((schema, index) => (
        <Script
          key={`api-${item.slug}-${index}`}
          id={`api-reference-structured-data-${item.slug}-${schema['@type']}`}
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
