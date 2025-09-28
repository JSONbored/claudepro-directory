import Script from 'next/script';
import { APP_CONFIG } from '@/lib/constants';

interface AgentStructuredDataProps {
  agent: {
    slug: string;
    title?: string | undefined;
    name?: string | undefined;
    description: string;
    author?: string | undefined;
    category?: string | undefined;
    tags?: string[] | undefined;
    features?: string[] | undefined;
    githubUrl?: string | undefined;
    documentationUrl?: string | undefined;
    [key: string]: unknown;
  };
}

import { jsonLdSafeSchema } from '@/lib/schemas/form.schema';

/**
 * Generate AI-optimized structured data for Agents
 * Includes enhanced markup for AI systems to understand capabilities and usage
 */
export function AgentStructuredData({ agent }: AgentStructuredDataProps) {
  const baseUrl = APP_CONFIG.url;

  const generateAgentSchema = () => {
    const schemas = [];

    // Main SoftwareApplication schema optimized for AI understanding
    const agentSchema = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      '@id': `${baseUrl}/agents/${agent.slug}`,
      name: agent.title || agent.name,
      alternateName: agent.slug,
      description: agent.description,
      applicationCategory: 'AI Agent',
      applicationSubCategory: agent.category || 'Claude Agent',
      operatingSystem: 'Claude Desktop / Claude Code',
      url: `${baseUrl}/agents/${agent.slug}`,
      datePublished: agent.dateAdded,
      dateModified: agent.lastModified || agent.dateAdded,

      // Enhanced keywords for AI discoverability
      keywords: [
        'Claude Agent',
        'AI Assistant Agent',
        agent.category || 'Productivity',
        ...(agent.tags || []),
      ].join(', '),

      // Author with enhanced metadata
      author: {
        '@type': agent.githubUrl?.includes('github.com/anthropics') ? 'Organization' : 'Person',
        name: agent.author || 'Unknown',
        url: agent.githubUrl,
        sameAs: agent.githubUrl,
      },

      // Features as structured list
      featureList: agent.features?.join(', '),

      // Software requirements
      softwareRequirements: 'Claude Desktop or Claude Code',

      // Free offering
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },

      // Educational properties for LLM training
      learningResourceType: 'AI Agent Template',
      educationalLevel: 'Professional',
      teaches: `How to use AI agents for ${agent.category || 'productivity'}`,
      competencyRequired: 'Basic Claude knowledge',
    };
    schemas.push(agentSchema);

    // Add configuration as SoftwareSourceCode (critical for AI understanding)
    if (agent.configuration) {
      const configSchema = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareSourceCode',
        '@id': `${baseUrl}/agents/${agent.slug}#configuration`,
        name: `${agent.title || agent.name} - Agent Configuration`,
        description: 'Complete agent configuration for Claude',
        programmingLanguage: {
          '@type': 'ComputerLanguage',
          name: 'JSON',
        },
        codeRepository: agent.githubUrl,
        text: JSON.stringify(agent.configuration, null, 2),
        encodingFormat: 'application/json',
        runtimePlatform: 'Claude AI Assistant',
        targetProduct: 'Claude Desktop / Claude Code',
        isPartOf: {
          '@id': `${baseUrl}/agents/${agent.slug}`,
        },
      };
      schemas.push(configSchema);
    }

    // Add content/prompts as CreativeWork for AI citation
    if (agent.content) {
      const promptSchema = {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        '@id': `${baseUrl}/agents/${agent.slug}#prompt`,
        name: `${agent.title || agent.name} - Agent Prompt Template`,
        description: 'Agent system prompt and instructions',
        text: agent.content,
        inLanguage: 'en',
        encodingFormat: 'text/plain',
        creator: {
          '@type': 'Person',
          name: agent.author || 'Unknown',
        },
        isPartOf: {
          '@id': `${baseUrl}/agents/${agent.slug}`,
        },
        // AI-specific metadata
        learningResourceType: 'Prompt Template',
        educationalUse: 'AI Agent Development',
      };
      schemas.push(promptSchema);
    }

    // Add HowTo schema for usage instructions
    if (agent.installation || agent.examples) {
      const howToSchema = {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: `How to use ${agent.title || agent.name} Agent`,
        description: `Step-by-step guide to implement the ${agent.name} agent in Claude`,
        estimatedCost: {
          '@type': 'MonetaryAmount',
          currency: 'USD',
          value: '0',
        },
        step: [
          {
            '@type': 'HowToStep',
            position: 1,
            name: 'Open Claude Desktop or Claude Code',
            text: 'Launch your Claude application',
          },
          {
            '@type': 'HowToStep',
            position: 2,
            name: 'Create new agent',
            text: 'Create a new agent or modify existing configuration',
          },
          {
            '@type': 'HowToStep',
            position: 3,
            name: 'Apply configuration',
            text: 'Copy and apply the agent configuration',
            itemListElement: {
              '@type': 'SoftwareSourceCode',
              text: JSON.stringify(agent.configuration || {}, null, 2),
              programmingLanguage: 'json',
            },
          },
        ],
      };

      // Add examples as additional steps if available
      if (agent.examples && Array.isArray(agent.examples)) {
        agent.examples.forEach(
          (example: string | { description?: string; code?: string }, index: number) => {
            howToSchema.step.push({
              '@type': 'HowToStep',
              position: howToSchema.step.length + 1,
              name: `Example ${index + 1}`,
              text:
                typeof example === 'string'
                  ? example
                  : (example as { description?: string; code?: string }).description ||
                    (example as { description?: string; code?: string }).code ||
                    JSON.stringify(example),
            });
          }
        );
      }

      schemas.push(howToSchema);
    }

    // Add Dataset schema for agent collection (helps AI understand context)
    const datasetSchema = {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      '@id': `${baseUrl}/agents#dataset`,
      name: 'Claude Agent Templates Collection',
      description: 'Curated collection of AI agent templates for Claude',
      includedInDataCatalog: {
        '@type': 'DataCatalog',
        name: APP_CONFIG.name,
        url: baseUrl,
      },
      distribution: {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: `${baseUrl}/api/agents`,
      },
      hasPart: {
        '@id': `${baseUrl}/agents/${agent.slug}`,
      },
    };
    schemas.push(datasetSchema);

    // Add speakable properties for voice search
    const speakableSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${baseUrl}/agents/${agent.slug}#webpage`,
      url: `${baseUrl}/agents/${agent.slug}`,
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: ['description', 'headline', '.features'],
        xpath: ['/html/head/title', '/html/head/meta[@name="description"]/@content'],
      },
    };
    schemas.push(speakableSchema);

    // Add breadcrumb
    const breadcrumbSchema = {
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
            '@id': `${baseUrl}/agents`,
            name: 'Agents',
          },
        },
        {
          '@type': 'ListItem',
          position: 3,
          item: {
            '@id': `${baseUrl}/agents/${agent.slug}`,
            name: agent.title || agent.name,
          },
        },
      ],
    };
    schemas.push(breadcrumbSchema);

    return schemas;
  };

  const schemas = generateAgentSchema();

  // Sanitize each schema through Zod to prevent XSS
  const safeSchemas = schemas.map((schema) => jsonLdSafeSchema.parse(schema));

  return (
    <>
      {safeSchemas.map((schema) => {
        const schemaId = `${schema['@type']}-${agent.slug}`;
        return (
          <Script
            key={schemaId}
            id={`agent-structured-data-${schemaId}`}
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
