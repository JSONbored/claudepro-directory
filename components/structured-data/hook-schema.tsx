import Script from 'next/script';
import { APP_CONFIG } from '@/lib/constants';
import type { HookContent } from '@/lib/schemas/content.schema';

interface ExtendedHookContent extends HookContent {
  name?: string | undefined;
  title?: string | undefined;
  lastModified?: string | undefined;
  githubUrl?: string | undefined;
  documentationUrl?: string | undefined;
}

interface HookStructuredDataProps {
  item: ExtendedHookContent;
}

/**
 * Generate rich structured data for Hooks
 * Makes hook configurations and scripts directly parseable by AI systems
 */
export function HookStructuredData({ item: hook }: HookStructuredDataProps) {
  const baseUrl = APP_CONFIG.url;

  const generateHookSchema = () => {
    const schemas = [];

    // Main SoftwareApplication schema for the hook
    const hookSchema = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      '@id': `${baseUrl}/hooks/${hook.slug}`,
      name: hook.title || hook.name || hook.slug,
      description: hook.description,
      applicationCategory: 'DeveloperApplication',
      applicationSubCategory: `${hook.hookType || 'Hook'} - Claude Hook`,
      operatingSystem: 'Cross-platform',
      url: `${baseUrl}/hooks/${hook.slug}`,
      datePublished: new Date(hook.dateAdded).toISOString(),
      dateModified: new Date(hook.lastModified || hook.dateAdded).toISOString(),
      keywords: [
        'Claude Hook',
        hook.hookType || 'Hook',
        'AI Development',
        'Automation',
        ...(hook.tags || []),
      ].join(', '),

      // Author information
      author: {
        '@type': hook.githubUrl?.includes('github.com/anthropics') ? 'Organization' : 'Person',
        name: hook.author || 'Unknown',
        ...(hook.githubUrl && { url: hook.githubUrl }),
      },

      // Software requirements
      softwareRequirements: ['Claude Desktop or Claude Code', ...(hook.requirements || [])].join(
        ', '
      ),

      // Features
      featureList: hook.features?.join(', '),

      // Offer (free)
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
    };
    schemas.push(hookSchema);

    // Add the hook script as SoftwareSourceCode (crucial for AI understanding)
    if (hook.configuration?.scriptContent) {
      const scriptSchema = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareSourceCode',
        '@id': `${baseUrl}/hooks/${hook.slug}#script`,
        name: `${hook.title || hook.name} - Hook Script`,
        description: `${hook.hookType || 'Hook'} script for Claude`,
        programmingLanguage: {
          '@type': 'ComputerLanguage',
          name: 'Shell Script',
        },
        ...(hook.githubUrl && { codeRepository: hook.githubUrl }),
        text: hook.configuration.scriptContent,
        encodingFormat: 'text/x-shellscript',
        license: 'https://opensource.org/licenses/MIT',
        runtimePlatform: 'Claude Desktop / Claude Code',
      };
      schemas.push(scriptSchema);
    }

    // Add hook configuration as separate SoftwareSourceCode
    if (hook.configuration?.hookConfig) {
      const configSchema = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareSourceCode',
        '@id': `${baseUrl}/hooks/${hook.slug}#config`,
        name: `${hook.title || hook.name} - Hook Configuration`,
        description: 'Configuration for Claude hooks system',
        programmingLanguage: {
          '@type': 'ComputerLanguage',
          name: 'JSON',
        },
        text: JSON.stringify(hook.configuration.hookConfig, null, 2),
        encodingFormat: 'application/json',
        isPartOf: {
          '@id': `${baseUrl}/hooks/${hook.slug}`,
        },
      };
      schemas.push(configSchema);
    }

    // Add HowTo schema for installation
    if (hook.installation || hook.configuration) {
      const howToSchema = {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: `Install ${hook.title || hook.name} Hook`,
        description: `Step-by-step guide to install the ${hook.name} hook in Claude`,
        estimatedCost: {
          '@type': 'MonetaryAmount',
          currency: 'USD',
          value: '0',
        },
        supply: [
          {
            '@type': 'HowToSupply',
            name: 'Claude Desktop or Claude Code',
          },
        ],
        step: [
          {
            '@type': 'HowToStep',
            position: 1,
            name: 'Create hooks directory',
            text: "Create the ~/.claude/hooks/ directory if it doesn't exist",
            itemListElement: {
              '@type': 'SoftwareSourceCode',
              text: 'mkdir -p ~/.claude/hooks',
              programmingLanguage: 'bash',
            },
          },
          {
            '@type': 'HowToStep',
            position: 2,
            name: 'Create hook script',
            text: `Create the hook script file at ~/.claude/hooks/${hook.slug}.sh`,
            itemListElement: {
              '@type': 'SoftwareSourceCode',
              text: hook.configuration?.scriptContent || '# Hook script content',
              programmingLanguage: 'bash',
            },
          },
          {
            '@type': 'HowToStep',
            position: 3,
            name: 'Make executable',
            text: 'Make the script executable',
            itemListElement: {
              '@type': 'SoftwareSourceCode',
              text: `chmod +x ~/.claude/hooks/${hook.slug}.sh`,
              programmingLanguage: 'bash',
            },
          },
          {
            '@type': 'HowToStep',
            position: 4,
            name: 'Configure in Claude',
            text: 'Add the hook configuration to Claude settings',
            itemListElement: {
              '@type': 'SoftwareSourceCode',
              text: JSON.stringify(hook.configuration?.hookConfig || {}, null, 2),
              programmingLanguage: 'json',
            },
          },
        ],
      };
      schemas.push(howToSchema);
    }

    // Add troubleshooting as FAQPage
    if (hook.troubleshooting && hook.troubleshooting.length > 0) {
      const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: hook.troubleshooting.map(
          (item: string | { issue: string; solution: string }) => ({
            '@type': 'Question',
            name: typeof item === 'string' ? item : item.issue,
            acceptedAnswer: {
              '@type': 'Answer',
              text: typeof item === 'string' ? 'Check documentation for solution' : item.solution,
            },
          })
        ),
      };
      schemas.push(faqSchema);
    }

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
            '@id': `${baseUrl}/hooks`,
            name: 'Hooks',
          },
        },
        {
          '@type': 'ListItem',
          position: 3,
          item: {
            '@id': `${baseUrl}/hooks/${hook.slug}`,
            name: hook.title || hook.name || hook.slug,
          },
        },
      ],
    };
    schemas.push(breadcrumbSchema);

    return schemas;
  };

  const schemas = generateHookSchema();

  // Generate clean, safe schemas at build time
  const safeSchemas = schemas;

  return (
    <>
      {safeSchemas.map((schema, index) => {
        // Use @id fragment or type + index for unique keys
        const schemaWithId = schema as { '@id'?: string; '@type'?: string };
        const idFragment = schemaWithId['@id'] ? schemaWithId['@id'].split('#').pop() : null;
        const schemaId = idFragment || `${schemaWithId['@type'] || 'schema'}-${index}`;
        return (
          <Script
            key={`hook-${hook.slug}-${schemaId}`}
            id={`hook-structured-data-${schemaId}`}
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
