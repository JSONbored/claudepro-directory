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

import { jsonLdSafeSchema } from '@/lib/schemas/form.schema';
import {
  type FAQPage,
  faqPageSchema,
  type HowTo,
  type HowToStep,
  howToSchema,
  howToStepSchema,
  type SoftwareApplication,
  type SoftwareSourceCode,
  softwareApplicationSchema,
  softwareSourceCodeSchema,
} from '@/lib/schemas/structured-data.schema';

/**
 * Generate rich structured data for MCP servers
 * This helps AI systems and search engines better understand and cite MCP configurations
 */
export function MCPStructuredData({ item: mcpServer }: MCPStructuredDataProps) {
  const baseUrl = APP_CONFIG.url;

  // Generate comprehensive schema.org markup for MCP servers
  const generateMCPSchema = () => {
    const schemaData: SoftwareApplication = softwareApplicationSchema.parse({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      '@id': `${baseUrl}/mcp/${mcpServer.slug}`,
      name: mcpServer.title || mcpServer.name,
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

      // Author information
      author: {
        '@type': mcpServer.githubUrl?.includes('github.com/anthropics') ? 'Organization' : 'Person',
        name: mcpServer.author || 'Unknown',
        url: mcpServer.githubUrl,
      },

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

      // Offer (free)
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },

      // How-to install (this is key for AI citations)
      hasPart: [],
    });

    // Add installation instructions as HowTo schema
    if (mcpServer.installation) {
      const steps: HowToStep[] = [];

      // Add Claude Desktop installation steps if available
      if (mcpServer.installation.claudeDesktop?.steps) {
        mcpServer.installation.claudeDesktop.steps.forEach((step: string, index: number) => {
          const stepData: HowToStep = howToStepSchema.parse({
            '@type': 'HowToStep',
            position: index + 1,
            name: `Step ${index + 1}`,
            text: String(step),
          });
          steps.push(stepData);
        });
      }

      if (steps.length > 0) {
        const installationHowTo: HowTo = howToSchema.parse({
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: `Install ${mcpServer.title || mcpServer.name} MCP Server`,
          description: `Installation guide for ${mcpServer.title || mcpServer.name}`,
          step: steps,
        });
        // Type assertion is safe here as we know it's a valid HowTo schema
        if (schemaData.hasPart) {
          schemaData.hasPart.push(installationHowTo);
        }
      }
    }

    // Add configuration code as SoftwareSourceCode (crucial for AI understanding)
    const configurationSchemas: SoftwareSourceCode[] = [];

    if (mcpServer.configuration?.claudeDesktop) {
      const desktopConfig: SoftwareSourceCode = softwareSourceCodeSchema.parse({
        '@type': 'SoftwareSourceCode',
        '@id': `${baseUrl}/mcp/${mcpServer.slug}#claude-desktop-config`,
        name: `${mcpServer.title || mcpServer.name} - Claude Desktop Configuration`,
        description: 'Configuration for Claude Desktop',
        programmingLanguage: {
          '@type': 'ComputerLanguage',
          name: 'JSON',
        },
        codeRepository: mcpServer.githubUrl,
        text: JSON.stringify(mcpServer.configuration.claudeDesktop, null, 2),
        encodingFormat: 'application/json',
        copyrightNotice: 'Free to use',
        license: 'https://opensource.org/licenses/MIT',
      });
      configurationSchemas.push(desktopConfig);
    }

    if (mcpServer.configuration?.claudeCode) {
      const codeConfig: SoftwareSourceCode = softwareSourceCodeSchema.parse({
        '@type': 'SoftwareSourceCode',
        '@id': `${baseUrl}/mcp/${mcpServer.slug}#claude-code-config`,
        name: `${mcpServer.title || mcpServer.name} - Claude Code Configuration`,
        description: 'Configuration for Claude Code',
        programmingLanguage: {
          '@type': 'ComputerLanguage',
          name: 'JSON',
        },
        codeRepository: mcpServer.githubUrl,
        text: JSON.stringify(mcpServer.configuration.claudeCode, null, 2),
        encodingFormat: 'application/json',
        copyrightNotice: 'Free to use',
        license: 'https://opensource.org/licenses/MIT',
      });
      configurationSchemas.push(codeConfig);
    }

    // Add configurations to schema
    if (configurationSchemas.length > 0) {
      // Add configurations safely
      if (schemaData.hasPart) {
        schemaData.hasPart.push(...configurationSchemas);
      }
    }

    // Add features as aggregate rating (helps with rich snippets)
    if (mcpServer.features && mcpServer.features.length > 0) {
      schemaData.featureList = mcpServer.features.join(', ');
    }

    // Add FAQs if we have troubleshooting info
    if (mcpServer.troubleshooting && mcpServer.troubleshooting.length > 0) {
      const faqData: FAQPage = faqPageSchema.parse({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        name: `${mcpServer.title || mcpServer.name} FAQs`,
        description: `Frequently asked questions about ${mcpServer.title || mcpServer.name}`,
        url: `${baseUrl}/mcp/${mcpServer.slug}`,
        mainEntity: mcpServer.troubleshooting.map(
          (item: string | { issue: string; solution: string }) => ({
            '@type': 'Question',
            name: typeof item === 'string' ? item : item.issue,
            acceptedAnswer: {
              '@type': 'Answer',
              text: typeof item === 'string' ? 'See documentation for solution' : item.solution,
            },
          })
        ),
      });
      // Add FAQ data safely
      if (schemaData.hasPart) {
        schemaData.hasPart.push(faqData);
      }
    }

    // Add breadcrumb for better SEO
    const breadcrumb = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          item: {
            '@id': baseUrl,
            name: 'Home',
          },
        },
        {
          '@type': 'ListItem',
          position: 2,
          item: {
            '@id': `${baseUrl}/mcp`,
            name: 'MCP Servers',
          },
        },
        {
          '@type': 'ListItem',
          position: 3,
          item: {
            '@id': `${baseUrl}/mcp/${mcpServer.slug}`,
            name: mcpServer.title || mcpServer.name,
          },
        },
      ],
    };

    return [schemaData, breadcrumb];
  };

  const schemas = generateMCPSchema();

  // Sanitize each schema through Zod to prevent XSS
  const safeSchemas = schemas.map((schema) => jsonLdSafeSchema.parse(schema));

  return (
    <>
      {safeSchemas.map((schema) => {
        const schemaId = schema['@type'] || 'schema';
        return (
          <Script
            key={`mcp-structured-data-${schemaId}`}
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
