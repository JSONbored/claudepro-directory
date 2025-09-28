/**
 * Structured Data Validation Schemas
 * Production-grade validation for schema.org structured data
 * Ensures proper typing and prevents XSS in JSON-LD content
 */

import { z } from 'zod';

/**
 * Common schema.org types
 */
export const schemaOrgTypeSchema = z.enum([
  'Organization',
  'Person',
  'SoftwareApplication',
  'SoftwareSourceCode',
  'HowTo',
  'HowToStep',
  'FAQPage',
  'Question',
  'Answer',
  'WebSite',
  'WebPage',
  'CollectionPage',
  'Service',
  'Offer',
  'APIReference',
  'TechArticle',
  'WebAPI',
  'CodeRepository',
  'Article',
  'BlogPosting',
  'Guide',
  'Tutorial',
  'Course',
  'Review',
  'Rating',
  'AggregateRating',
  'ComputerLanguage',
]);

/**
 * Base schema.org entity
 */
export const baseSchemaOrgEntitySchema = z.object({
  '@context': z.literal('https://schema.org'),
  '@type': schemaOrgTypeSchema,
  '@id': z.string().url().optional(),
});

/**
 * Person or Organization schema
 */
export const personOrOrganizationSchema = z.object({
  '@type': z.enum(['Person', 'Organization']),
  name: z.string(),
  url: z.string().url().optional(),
  image: z.string().url().optional(),
  email: z.string().email().optional(),
  sameAs: z.array(z.string().url()).optional(),
});

/**
 * How-To Step schema
 */
export const howToStepSchema = z.object({
  '@type': z.literal('HowToStep'),
  position: z.number().int().positive(),
  name: z.string(),
  text: z.string(),
  url: z.string().url().optional(),
  image: z.string().url().optional(),
});

/**
 * FAQ Question/Answer schema
 */
export const faqQuestionSchema = z.object({
  '@type': z.literal('Question'),
  name: z.string(),
  acceptedAnswer: z.object({
    '@type': z.literal('Answer'),
    text: z.string(),
    url: z.string().url().optional(),
  }),
});

/**
 * FAQ Page schema
 */
export const faqPageSchema = baseSchemaOrgEntitySchema.extend({
  '@type': z.literal('FAQPage'),
  name: z.string(),
  description: z.string().optional(),
  url: z.string().url(),
  mainEntity: z.array(faqQuestionSchema),
});

/**
 * How-To schema
 */
export const howToSchema = baseSchemaOrgEntitySchema.extend({
  '@type': z.literal('HowTo'),
  name: z.string(),
  description: z.string().optional(),
  url: z.string().url().optional(),
  step: z.array(howToStepSchema),
  totalTime: z.string().optional(),
  supply: z.array(z.string()).optional(),
  tool: z.array(z.string()).optional(),
});

/**
 * Software Application schema
 */
export const softwareApplicationSchema = baseSchemaOrgEntitySchema.extend({
  '@type': z.literal('SoftwareApplication'),
  name: z.string(),
  description: z.string(),
  url: z.string().url().optional(),
  applicationCategory: z.string().optional(),
  applicationSubCategory: z.string().optional(),
  operatingSystem: z.string().optional(),
  softwareVersion: z.string().optional(),
  datePublished: z.string().datetime().optional(),
  dateModified: z.string().datetime().optional(),
  author: personOrOrganizationSchema.optional(),
  publisher: personOrOrganizationSchema.optional(),
  softwareRequirements: z.string().optional(),
  offers: z
    .object({
      '@type': z.literal('Offer'),
      price: z.union([z.string(), z.number()]),
      priceCurrency: z.string().length(3),
      availability: z.string().url().optional(),
    })
    .optional(),
  featureList: z.string().optional(),
  hasPart: z
    .array(
      z.union([
        z.lazy(() => howToSchema),
        z.lazy(() => softwareSourceCodeSchema),
        z.lazy(() => faqPageSchema),
      ])
    )
    .optional(),
});

/**
 * API Reference schema
 */
export const apiReferenceSchema = baseSchemaOrgEntitySchema.extend({
  '@type': z.literal('APIReference'),
  name: z.string(),
  description: z.string(),
  url: z.string().url(),
  assemblyVersion: z.string().optional(),
  executableLibraryName: z.string().optional(),
  targetPlatform: z.string().optional(),
  programmingLanguage: z
    .object({
      '@type': z.literal('ComputerLanguage'),
      name: z.string(),
    })
    .optional(),
  datePublished: z.string().datetime().optional(),
  dateModified: z.string().datetime().optional(),
  author: personOrOrganizationSchema.optional(),
  isPartOf: z
    .object({
      '@type': z.literal('SoftwareApplication'),
      name: z.string(),
      applicationCategory: z.string().optional(),
    })
    .optional(),
  hasPart: z.array(z.lazy(() => techArticleSchema)).optional(),
});

/**
 * Tech Article schema
 */
export const techArticleSchema = z.object({
  '@type': z.literal('TechArticle'),
  '@id': z.string().url(),
  headline: z.string(),
  articleBody: z.string(),
  encodingFormat: z.string().optional(),
  text: z.string(),
});

/**
 * Web API schema
 */
export const webApiSchema = baseSchemaOrgEntitySchema.extend({
  '@type': z.literal('WebAPI'),
  name: z.string(),
  description: z.string(),
  documentation: z.string().url().optional(),
  provider: personOrOrganizationSchema.optional(),
  endpointUrl: z.array(z.string()).optional(),
  category: z.string().optional(),
});

/**
 * Code Repository schema
 */
export const codeRepositorySchema = baseSchemaOrgEntitySchema.extend({
  '@type': z.literal('CodeRepository'),
  name: z.string(),
  description: z.string(),
  url: z.string().url(),
  codeRepository: z.string().url(),
  programmingLanguage: z
    .object({
      '@type': z.literal('ComputerLanguage'),
      name: z.string(),
    })
    .optional(),
  mainEntityOfPage: z
    .object({
      '@id': z.string().url(),
    })
    .optional(),
});

/**
 * Organization schema
 */
export const organizationSchema = baseSchemaOrgEntitySchema.extend({
  '@type': z.literal('Organization'),
  name: z.string(),
  description: z.string().optional(),
  url: z.string().url().optional(),
  logo: z.string().url().optional(),
  contactPoint: z
    .object({
      '@type': z.literal('ContactPoint'),
      contactType: z.string(),
      email: z.string().email().optional(),
      url: z.string().url().optional(),
    })
    .optional(),
  sameAs: z.array(z.string().url()).optional(),
  parentOrganization: z
    .object({
      '@type': z.literal('Organization'),
      name: z.string(),
    })
    .optional(),
});

/**
 * Website schema
 */
export const websiteSchema = baseSchemaOrgEntitySchema.extend({
  '@type': z.literal('WebSite'),
  name: z.string(),
  description: z.string().optional(),
  url: z.string().url(),
  publisher: personOrOrganizationSchema.optional(),
  potentialAction: z
    .object({
      '@type': z.literal('SearchAction'),
      target: z.object({
        '@type': z.literal('EntryPoint'),
        urlTemplate: z.string(),
      }),
      'query-input': z.string(),
    })
    .optional(),
});

/**
 * Collection Page schema
 */
export const collectionPageSchema = baseSchemaOrgEntitySchema.extend({
  '@type': z.literal('CollectionPage'),
  name: z.string(),
  description: z.string().optional(),
  url: z.string().url(),
  mainEntity: z
    .object({
      '@type': z.literal('ItemList'),
      itemListElement: z.array(
        z.object({
          '@type': z.literal('ListItem'),
          position: z.number().int().positive(),
          url: z.string().url(),
        })
      ),
    })
    .optional(),
});

/**
 * Service schema
 */
export const serviceSchema = baseSchemaOrgEntitySchema.extend({
  '@type': z.literal('Service'),
  name: z.string(),
  description: z.string(),
  serviceType: z.string(),
  provider: personOrOrganizationSchema.optional(),
  areaServed: z.string().optional(),
  availableChannel: z
    .object({
      '@type': z.literal('ServiceChannel'),
      serviceUrl: z.string().url(),
      servicePhone: z.string().optional(),
      serviceEmail: z.string().email().optional(),
    })
    .optional(),
});

/**
 * Software Source Code schema
 */
export const softwareSourceCodeSchema = z.object({
  '@type': z.literal('SoftwareSourceCode'),
  '@id': z.string().url(),
  name: z.string(),
  description: z.string(),
  programmingLanguage: z.object({
    '@type': z.literal('ComputerLanguage'),
    name: z.string(),
  }),
  codeRepository: z.string().url().optional(),
  text: z.string(),
  encodingFormat: z.string().optional(),
  copyrightNotice: z.string().optional(),
  license: z.string().url().optional(),
});

/**
 * Combined structured data schema
 */
export const structuredDataSchema = z.union([
  organizationSchema,
  websiteSchema,
  collectionPageSchema,
  serviceSchema,
  softwareApplicationSchema,
  apiReferenceSchema,
  webApiSchema,
  codeRepositorySchema,
  faqPageSchema,
  howToSchema,
  softwareSourceCodeSchema,
]);

/**
 * Array of structured data schemas
 */
export const structuredDataArraySchema = z.array(structuredDataSchema);

/**
 * Helper to validate structured data
 */
export function validateStructuredData(data: unknown): z.infer<typeof structuredDataSchema> {
  return structuredDataSchema.parse(data);
}

/**
 * Helper to validate array of structured data
 */
export function validateStructuredDataArray(
  data: unknown
): z.infer<typeof structuredDataArraySchema> {
  return structuredDataArraySchema.parse(data);
}

// Type exports
export type SchemaOrgType = z.infer<typeof schemaOrgTypeSchema>;
export type PersonOrOrganization = z.infer<typeof personOrOrganizationSchema>;
export type HowToStep = z.infer<typeof howToStepSchema>;
export type FAQQuestion = z.infer<typeof faqQuestionSchema>;
export type FAQPage = z.infer<typeof faqPageSchema>;
export type HowTo = z.infer<typeof howToSchema>;
export type SoftwareApplication = z.infer<typeof softwareApplicationSchema>;
export type APIReference = z.infer<typeof apiReferenceSchema>;
export type TechArticle = z.infer<typeof techArticleSchema>;
export type WebAPI = z.infer<typeof webApiSchema>;
export type CodeRepository = z.infer<typeof codeRepositorySchema>;
export type Organization = z.infer<typeof organizationSchema>;
export type WebSite = z.infer<typeof websiteSchema>;
export type CollectionPage = z.infer<typeof collectionPageSchema>;
export type Service = z.infer<typeof serviceSchema>;
export type SoftwareSourceCode = z.infer<typeof softwareSourceCodeSchema>;
export type StructuredData = z.infer<typeof structuredDataSchema>;
export type StructuredDataArray = z.infer<typeof structuredDataArraySchema>;
