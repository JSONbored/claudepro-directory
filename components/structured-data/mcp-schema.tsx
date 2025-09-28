import Script from 'next/script';
import { APP_CONFIG } from '@/lib/constants';
import type { McpContent } from '@/lib/schemas/content.schema';

interface ExtendedMcpContent extends McpContent {
  name?: string | undefined;
  title?: string | undefined;
  lastModified?: string | undefined;
  githubUrl?: string | undefined;
  documentationUrl?: string | undefined;
}

interface MCPStructuredDataProps {
  item: ExtendedMcpContent;
}

/**
 * Generate rich structured data for MCP servers
 * This helps AI systems and search engines better understand and cite MCP configurations
 */
export function MCPStructuredData({ item: mcpServer }: MCPStructuredDataProps) {
  const baseUrl = APP_CONFIG.url;

  // Generate comprehensive schema.org markup for MCP servers
  const generateMCPSchema = () => {
    const schemas = [];

    // Main SoftwareApplication schema for the MCP server
    const mcpSchema = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      '@id': `${baseUrl}/mcp/${mcpServer.slug}`,
      name: mcpServer.title || mcpServer.name || mcpServer.slug,
      description: mcpServer.description,
      applicationCategory: 'DeveloperApplication',
      applicationSubCategory: 'MCP Server',
      operatingSystem: 'Cross-platform',
      softwareVersion: '1.0.0',
      url: `${baseUrl}/mcp/${mcpServer.slug}`,
      datePublished: mcpServer.dateAdded,
      dateModified: mcpServer.lastModified || mcpServer.dateAdded,
      keywords: [
        'MCP Server',
        'Model Context Protocol',
        'Claude',
        'AI Development',
        ...(mcpServer.tags || []),
      ].join(', '),

      // Author information (simplified for JSON-LD validation)
      author: mcpServer.author || 'Unknown',

      // Software requirements
      softwareRequirements: [
        'Claude Desktop',
        'Claude Code',
        ...(('installation' in mcpServer &&
        typeof mcpServer.installation === 'object' &&
        mcpServer.installation &&
        'requirements' in mcpServer.installation &&
        Array.isArray(mcpServer.installation.requirements)
          ? mcpServer.installation.requirements
          : []) as string[]),
      ].join(', '),

      // Offer (simplified for JSON-LD validation)
      offers: 'Free',

      // Features
      featureList: mcpServer.features?.join(', '),
    };
    schemas.push(mcpSchema);

    // Add installation instructions as separate HowTo schema
    if (mcpServer.installation?.claudeDesktop?.steps) {
      const howToSchema = {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        '@id': `${baseUrl}/mcp/${mcpServer.slug}#installation`,
        name: `Install ${mcpServer.title || mcpServer.name} MCP Server`,
        description: `Installation guide for ${mcpServer.title || mcpServer.name}`,
        step: mcpServer.installation.claudeDesktop.steps
          .map((step: string, index: number) => `Step ${index + 1}: ${step}`)
          .join(' | '),
      };
      schemas.push(howToSchema);
    }

    // Add configuration code as separate SoftwareSourceCode schemas
    if (mcpServer.configuration?.claudeDesktop) {
      const desktopConfig = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareSourceCode',
        '@id': `${baseUrl}/mcp/${mcpServer.slug}#claude-desktop-config`,
        name: `${mcpServer.title || mcpServer.name} - Claude Desktop Configuration`,
        description: 'Configuration for Claude Desktop',
        programmingLanguage: 'JSON',
        ...(mcpServer.githubUrl && { codeRepository: mcpServer.githubUrl }),
        text: JSON.stringify(mcpServer.configuration.claudeDesktop, null, 2),
        encodingFormat: 'application/json',
        copyrightNotice: 'Free to use',
        license: 'https://opensource.org/licenses/MIT',
      };
      schemas.push(desktopConfig);
    }

    if (mcpServer.configuration?.claudeCode) {
      const codeConfig = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareSourceCode',
        '@id': `${baseUrl}/mcp/${mcpServer.slug}#claude-code-config`,
        name: `${mcpServer.title || mcpServer.name} - Claude Code Configuration`,
        description: 'Configuration for Claude Code',
        programmingLanguage: 'JSON',
        ...(mcpServer.githubUrl && { codeRepository: mcpServer.githubUrl }),
        text: JSON.stringify(mcpServer.configuration.claudeCode, null, 2),
        encodingFormat: 'application/json',
        copyrightNotice: 'Free to use',
        license: 'https://opensource.org/licenses/MIT',
      };
      schemas.push(codeConfig);
    }

    // Add FAQs if we have troubleshooting info
    if (mcpServer.troubleshooting && mcpServer.troubleshooting.length > 0) {
      const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        '@id': `${baseUrl}/mcp/${mcpServer.slug}#faq`,
        name: `${mcpServer.title || mcpServer.name} FAQs`,
        description: `Frequently asked questions about ${mcpServer.title || mcpServer.name}`,
        url: `${baseUrl}/mcp/${mcpServer.slug}`,
        mainEntity: mcpServer.troubleshooting
          .map((item: string | { issue: string; solution: string }) =>
            typeof item === 'string'
              ? `Q: ${item} | A: See documentation for solution`
              : `Q: ${item.issue} | A: ${item.solution}`
          )
          .join(' || '),
      };
      schemas.push(faqSchema);
    }

    // Add breadcrumb for better SEO
    const breadcrumb = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      '@id': `${baseUrl}/mcp/${mcpServer.slug}#breadcrumb`,
      itemListElement: [
        `1. Home (${baseUrl})`,
        `2. MCP Servers (${baseUrl}/mcp)`,
        `3. ${mcpServer.title || mcpServer.name || mcpServer.slug} (${baseUrl}/mcp/${mcpServer.slug})`,
      ].join(' > '),
    };
    schemas.push(breadcrumb);

    return schemas;
  };

  const schemas = generateMCPSchema();

  // Generate clean, safe schemas at build time
  const safeSchemas = schemas;

  return (
    <>
      {safeSchemas.map((schema, index) => {
        // Use @id fragment or type + index for unique keys
        const idFragment = schema['@id'] ? schema['@id'].split('#').pop() : null;
        const schemaId = idFragment || `${schema['@type'] || 'schema'}-${index}`;
        return (
          <Script
            key={`mcp-${mcpServer.slug}-${schemaId}`}
            id={`mcp-structured-data-${schemaId}`}
            type="application/ld+json"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data is sanitized via Zod schema
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(schema),
            }}
            strategy="afterInteractive"
          />
        );
      })}
    </>
  );
}
