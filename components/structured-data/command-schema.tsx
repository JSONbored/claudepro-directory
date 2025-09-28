import Script from 'next/script';
import { APP_CONFIG } from '@/lib/constants';

interface CommandStructuredDataProps {
  item: {
    slug: string;
    title?: string | undefined;
    name?: string | undefined;
    description: string;
    author?: string | undefined;
    category?: string | undefined;
    tags?: string[] | undefined;
    githubUrl?: string | undefined;
    documentationUrl?: string | undefined;
    examples?: string[] | undefined;
    configuration?: unknown;
    content?: string | undefined;
    dateAdded?: string | undefined;
    lastModified?: string | undefined;
    [key: string]: unknown;
  };
}

import { jsonLdSafeSchema } from '@/lib/schemas/form.schema';

/**
 * Generate rich structured data for Commands
 * Makes command syntax and configurations directly parseable by AI systems
 */
export function CommandStructuredData({ item: command }: CommandStructuredDataProps) {
  const baseUrl = APP_CONFIG.url;

  const generateCommandSchema = () => {
    const schemas = [];

    // Main SoftwareSourceCode schema for the command
    const commandSchema = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareSourceCode',
      '@id': `${baseUrl}/commands/${command.slug}`,
      name: command.title || command.name,
      description: command.description,
      programmingLanguage: {
        '@type': 'ComputerLanguage',
        name: 'Claude Command',
      },
      codeRepository: command.githubUrl,
      url: `${baseUrl}/commands/${command.slug}`,
      datePublished: command.dateAdded,
      dateModified: command.lastModified || command.dateAdded,
      keywords: ['Claude Command', 'AI Assistant Command', ...(command.tags || [])].join(', '),

      // The actual command content/syntax
      text: command.content || `/${command.slug}`,

      // Author information
      author: {
        '@type': command.githubUrl?.includes('github.com/anthropics') ? 'Organization' : 'Person',
        name: command.author || 'Unknown',
        url: command.githubUrl,
      },

      // License information
      license: 'https://opensource.org/licenses/MIT',

      // Educational properties for AI understanding
      learningResourceType: 'Command Reference',
      educationalLevel: 'Professional',
      teaches: `How to use the ${command.name} command in Claude`,
    };

    schemas.push(commandSchema);

    // Add HowTo schema if we have usage examples
    if (command.examples && Array.isArray(command.examples) && command.examples.length > 0) {
      const howToSchema = {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: `How to use ${command.title || command.name} command`,
        description: `Learn how to use the ${command.name} command with Claude`,
        step: command.examples.map(
          (example: string | { description?: string; code?: string }, index: number) => ({
            '@type': 'HowToStep',
            position: index + 1,
            name: `Example ${index + 1}`,
            text:
              typeof example === 'string'
                ? example
                : (example as { description?: string; code?: string }).description ||
                  (example as { description?: string; code?: string }).code ||
                  JSON.stringify(example),
            // Include the actual command syntax if available
            ...(typeof example === 'object' &&
              (example as { code?: string }).code && {
                itemListElement: {
                  '@type': 'SoftwareSourceCode',
                  text: (example as { code: string }).code,
                  programmingLanguage: 'Claude Command',
                },
              }),
          })
        ),
      };
      schemas.push(howToSchema);
    }

    // Add configuration as SoftwareSourceCode if present
    if (command.configuration) {
      const configSchema = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareSourceCode',
        '@id': `${baseUrl}/commands/${command.slug}#configuration`,
        name: `${command.title || command.name} - Configuration`,
        description: 'Command configuration settings',
        programmingLanguage: {
          '@type': 'ComputerLanguage',
          name: 'JSON',
        },
        text: JSON.stringify(command.configuration, null, 2),
        encodingFormat: 'application/json',
        isPartOf: {
          '@id': `${baseUrl}/commands/${command.slug}`,
        },
      };
      schemas.push(configSchema);
    }

    // Add TechArticle schema for documentation aspect
    const techArticleSchema = {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      '@id': `${baseUrl}/commands/${command.slug}#article`,
      headline: command.title || command.name,
      description: command.description,
      url: `${baseUrl}/commands/${command.slug}`,
      datePublished: command.dateAdded,
      dateModified: command.lastModified || command.dateAdded,
      author: {
        '@type': command.githubUrl?.includes('github.com/anthropics') ? 'Organization' : 'Person',
        name: command.author || 'Unknown',
      },
      publisher: {
        '@type': 'Organization',
        name: APP_CONFIG.name,
        url: baseUrl,
      },
      keywords: command.tags?.join(', '),
      articleSection: 'Commands',

      // Speakable specification for voice assistants
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: ['description', 'headline'],
      },
    };
    schemas.push(techArticleSchema);

    // Add breadcrumb for better navigation
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
            '@id': `${baseUrl}/commands`,
            name: 'Commands',
          },
        },
        {
          '@type': 'ListItem',
          position: 3,
          item: {
            '@id': `${baseUrl}/commands/${command.slug}`,
            name: command.title || command.name,
          },
        },
      ],
    };
    schemas.push(breadcrumbSchema);

    return schemas;
  };

  const schemas = generateCommandSchema();

  // Sanitize each schema through Zod to prevent XSS
  const safeSchemas = schemas.map((schema) => jsonLdSafeSchema.parse(schema));

  return (
    <>
      {safeSchemas.map((schema) => {
        const schemaId = `${schema['@type']}-${command.slug}`;
        return (
          <Script
            key={schemaId}
            id={`command-structured-data-${schemaId}`}
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
