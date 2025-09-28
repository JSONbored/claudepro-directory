import Script from 'next/script';
import { APP_CONFIG } from '@/lib/constants';
import type { RuleContent } from '@/lib/schemas/content.schema';

interface ExtendedRuleContent extends RuleContent {
  name?: string | undefined;
  title?: string | undefined;
  lastModified?: string | undefined;
  githubUrl?: string | undefined;
  documentationUrl?: string | undefined;
}

interface RuleStructuredDataProps {
  item: ExtendedRuleContent;
}

/**
 * Generate structured data for Rules
 * Optimized as TechArticle with educational metadata for AI understanding
 */
export function RuleStructuredData({ item: rule }: RuleStructuredDataProps) {
  const baseUrl = APP_CONFIG.url;

  const generateRuleSchema = () => {
    const schemas = [];

    // Main TechArticle schema for the rule
    const ruleSchema = {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      '@id': `${baseUrl}/rules/${rule.slug}`,
      headline: rule.title || rule.name,
      alternativeHeadline: rule.slug,
      description: rule.description,
      url: `${baseUrl}/rules/${rule.slug}`,
      datePublished: rule.dateAdded,
      dateModified: rule.lastModified || rule.dateAdded,

      // Article metadata
      articleSection: 'Development Rules',
      articleBody: rule.content || rule.description,
      wordCount: rule.content?.length || 0,

      // Author information
      author: {
        '@type': rule.githubUrl?.includes('github.com/anthropics') ? 'Organization' : 'Person',
        name: rule.author || 'Unknown',
        url: rule.githubUrl,
      },

      // Publisher
      publisher: {
        '@type': 'Organization',
        name: APP_CONFIG.name,
        url: baseUrl,
        logo: {
          '@type': 'ImageObject',
          url: `${baseUrl}/logo.png`,
        },
      },

      // Keywords for SEO and AI
      keywords: [
        'Claude Rules',
        'Development Guidelines',
        'Best Practices',
        rule.category || 'Guidelines',
        ...(rule.tags || []),
      ].join(', '),

      // Educational properties
      learningResourceType: 'Technical Documentation',
      educationalLevel: 'Professional',
      teaches: `Best practices for ${rule.category || 'development'}`,

      // Accessibility
      accessMode: ['textual', 'visual'],
      accessModeSufficient: {
        '@type': 'ItemList',
        itemListElement: ['textual'],
      },

      // Speakable for voice assistants
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: ['headline', 'description', 'articleBody'],
      },
    };
    schemas.push(ruleSchema);

    // Add the rule configuration/content as SoftwareSourceCode if it contains code
    if (rule.configuration || rule.content?.includes('```')) {
      const codeSchema = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareSourceCode',
        '@id': `${baseUrl}/rules/${rule.slug}#code`,
        name: `${rule.title || rule.name} - Code Examples`,
        description: 'Code examples and configurations for this rule',
        programmingLanguage: {
          '@type': 'ComputerLanguage',
          name: 'Multi-language',
        },
        codeRepository: rule.githubUrl,
        text: rule.configuration ? JSON.stringify(rule.configuration, null, 2) : rule.content,
        isPartOf: {
          '@id': `${baseUrl}/rules/${rule.slug}`,
        },
      };
      schemas.push(codeSchema);
    }

    // Add HowToGuide schema if there are examples
    if (rule.examples && rule.examples.length > 0) {
      const howToSchema = {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: `How to apply ${rule.title || rule.name}`,
        description: `Practical examples of implementing the ${rule.name} rule`,
        step: rule.examples.map(
          (
            example:
              | string
              | { title: string; description: string; prompt: string; expectedOutcome: string },
            index: number
          ) => ({
            '@type': 'HowToStep',
            position: index + 1,
            name: `Example ${index + 1}`,
            text:
              typeof example === 'string'
                ? example
                : (example as { description?: string; code?: string }).description ||
                  (example as { description?: string; code?: string }).code ||
                  JSON.stringify(example),
            ...(typeof example === 'object' &&
              'prompt' in example &&
              example.prompt && {
                itemListElement: {
                  '@type': 'SoftwareSourceCode',
                  text: example.prompt,
                },
              }),
          })
        ),
      };
      schemas.push(howToSchema);
    }

    // Add FAQ schema if troubleshooting exists
    if (rule.troubleshooting && rule.troubleshooting.length > 0) {
      const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: rule.troubleshooting.map(
          (item: string | { issue: string; solution: string }) => ({
            '@type': 'Question',
            name: typeof item === 'string' ? item : item.issue,
            acceptedAnswer: {
              '@type': 'Answer',
              text:
                typeof item === 'string'
                  ? 'Follow the rule guidelines for proper implementation'
                  : item.solution,
            },
          })
        ),
      };
      schemas.push(faqSchema);
    }

    // Add EducationalOccupationalCredential for professional development
    const credentialSchema = {
      '@context': 'https://schema.org',
      '@type': 'EducationalOccupationalCredential',
      '@id': `${baseUrl}/rules/${rule.slug}#credential`,
      name: `${rule.title || rule.name} Proficiency`,
      description: `Understanding and application of ${rule.name} best practices`,
      competencyRequired: rule.description,
      credentialCategory: 'Development Best Practices',
      educationalLevel: 'Professional Development',
    };
    schemas.push(credentialSchema);

    // Add breadcrumb navigation
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
            '@id': `${baseUrl}/rules`,
            name: 'Rules',
          },
        },
        {
          '@type': 'ListItem',
          position: 3,
          item: {
            '@id': `${baseUrl}/rules/${rule.slug}`,
            name: rule.title || rule.name,
          },
        },
      ],
    };
    schemas.push(breadcrumbSchema);

    return schemas;
  };

  const schemas = generateRuleSchema();

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
            key={`rule-${rule.slug}-${schemaId}`}
            id={`rule-structured-data-${schemaId}`}
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
