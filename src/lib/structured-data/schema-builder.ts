/**
 * Schema Builder Utilities
 * Shared builders for generating schema.org structured data
 */

import { APP_CONFIG } from '@/src/lib/constants';

/**
 * Base schema context
 */
const SCHEMA_CONTEXT = 'https://schema.org' as const;

/**
 * Build author/organization schema
 */
function buildAuthor(
  authorName?: string,
  githubUrl?: string,
  author_profile_url?: string
): {
  '@type': 'Person' | 'Organization';
  name: string;
  url?: string;
  sameAs?: string;
} {
  const isAnthropicOrg = githubUrl?.includes('github.com/anthropics');
  const profileUrl = author_profile_url || githubUrl;

  return {
    '@type': isAnthropicOrg ? 'Organization' : 'Person',
    name: authorName || 'Unknown',
    ...(profileUrl && { url: profileUrl, sameAs: profileUrl }),
  };
}

/**
 * Build breadcrumb list schema
 */
export function buildBreadcrumb(items: Array<{ name: string; url: string }>) {
  const baseUrl = APP_CONFIG.url;

  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'BreadcrumbList' as const,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem' as const,
      position: index + 1,
      item: {
        '@id': item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`,
        name: item.name,
      },
    })),
  };
}

/**
 * Build SoftwareApplication schema
 */
export interface SoftwareApplicationConfig {
  slug: string;
  name: string;
  description: string;
  category: string;
  applicationSubCategory: string;
  operatingSystem?: string;
  keywords: string[];
  author?: string;
  author_profile_url?: string;
  githubUrl?: string | undefined;
  date_added?: string;
  lastModified?: string | undefined;
  features?: string[] | undefined;
  requirements?: string[] | undefined;
  configuration?: unknown;
}

export function buildSoftwareApplication(config: SoftwareApplicationConfig) {
  const baseUrl = APP_CONFIG.url;

  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'SoftwareApplication' as const,
    '@id': `${baseUrl}/${config.category}/${config.slug}`,
    name: config.name,
    alternateName: config.slug,
    description: config.description,
    applicationCategory: 'DeveloperApplication',
    applicationSubCategory: config.applicationSubCategory,
    operatingSystem: config.operatingSystem || 'Claude Desktop / Claude Code',
    url: `${baseUrl}/${config.category}/${config.slug}`,
    datePublished: config.date_added,
    dateModified: config.lastModified || config.date_added,
    keywords: config.keywords.join(', '),
    author: buildAuthor(config.author, config.githubUrl, config.author_profile_url),
    featureList: config.features?.join(', '),
    softwareRequirements: config.requirements?.join(', ') || 'Claude Desktop or Claude Code',
    offers: {
      '@type': 'Offer' as const,
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    learningResourceType: 'Software Configuration',
    educationalLevel: 'Professional',
  };
}

/**
 * Build SoftwareSourceCode schema
 */
export interface SoftwareSourceCodeConfig {
  slug: string;
  category: string;
  name: string;
  description: string;
  programmingLanguage: string;
  code: string;
  encodingFormat: string;
  githubUrl?: string | undefined;
  fragmentId: string;
}

export function buildSoftwareSourceCode(config: SoftwareSourceCodeConfig) {
  const baseUrl = APP_CONFIG.url;

  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'SoftwareSourceCode' as const,
    '@id': `${baseUrl}/${config.category}/${config.slug}#${config.fragmentId}`,
    name: config.name,
    description: config.description,
    programmingLanguage: {
      '@type': 'ComputerLanguage' as const,
      name: config.programmingLanguage,
    },
    codeRepository: config.githubUrl,
    text: config.code,
    encodingFormat: config.encodingFormat,
    runtimePlatform: 'Claude AI Assistant',
    targetProduct: 'Claude Desktop / Claude Code',
    license: 'https://opensource.org/licenses/MIT',
    isPartOf: {
      '@id': `${baseUrl}/${config.category}/${config.slug}`,
    },
  };
}

/**
 * Build HowTo schema
 */
export interface HowToStepConfig {
  position: number;
  name: string;
  text: string;
  code?: string;
  programmingLanguage?: string;
}

export interface HowToConfig {
  slug: string;
  category: string;
  name: string;
  description: string;
  steps: HowToStepConfig[];
}

export function buildHowTo(config: HowToConfig) {
  const baseUrl = APP_CONFIG.url;

  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'HowTo' as const,
    '@id': `${baseUrl}/${config.category}/${config.slug}#howto`,
    name: `How to use ${config.name}`,
    description: config.description,
    estimatedCost: {
      '@type': 'MonetaryAmount' as const,
      currency: 'USD',
      value: '0',
    },
    step: config.steps.map((step) => ({
      '@type': 'HowToStep' as const,
      position: step.position,
      name: step.name,
      text: step.text,
      ...(step.code && {
        itemListElement: {
          '@type': 'SoftwareSourceCode' as const,
          text: step.code,
          programmingLanguage: step.programmingLanguage || 'json',
        },
      }),
    })),
  };
}

/**
 * Build CreativeWork schema (for prompts/content)
 */
export interface CreativeWorkConfig {
  slug: string;
  category: string;
  name: string;
  description: string;
  content: string;
  author?: string;
}

export function buildCreativeWork(config: CreativeWorkConfig) {
  const baseUrl = APP_CONFIG.url;

  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'CreativeWork' as const,
    '@id': `${baseUrl}/${config.category}/${config.slug}#content`,
    name: `${config.name} - Content Template`,
    description: config.description,
    text: config.content,
    inLanguage: 'en',
    encodingFormat: 'text/plain',
    creator: {
      '@type': 'Person' as const,
      name: config.author || 'Unknown',
    },
    isPartOf: {
      '@id': `${baseUrl}/${config.category}/${config.slug}`,
    },
    learningResourceType: 'Template',
    educationalUse: 'Professional Development',
  };
}

/**
 * Build WebPage schema with speakable
 */
export function buildWebPageSpeakable(slug: string, category: string) {
  const baseUrl = APP_CONFIG.url;

  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'WebPage' as const,
    '@id': `${baseUrl}/${category}/${slug}#webpage`,
    url: `${baseUrl}/${category}/${slug}`,
    speakable: {
      '@type': 'SpeakableSpecification' as const,
      cssSelector: ['description', 'headline', '.features'],
      xpath: ['/html/head/title', '/html/head/meta[@name="description"]/@content'],
    },
  };
}

/**
 * Build FAQPage schema from troubleshooting
 */
export interface FAQItem {
  issue: string;
  solution: string;
}

export function buildFAQPage(
  slug: string,
  category: string,
  name: string,
  troubleshooting: FAQItem[]
) {
  const baseUrl = APP_CONFIG.url;

  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'FAQPage' as const,
    '@id': `${baseUrl}/${category}/${slug}#faq`,
    name: `${name} - Troubleshooting`,
    description: `Frequently asked questions and troubleshooting for ${name}`,
    url: `${baseUrl}/${category}/${slug}`,
    mainEntity: troubleshooting.map((item) => ({
      '@type': 'Question' as const,
      name: item.issue,
      acceptedAnswer: {
        '@type': 'Answer' as const,
        text: item.solution,
      },
    })),
  };
}

/**
 * Build Review schema for user reviews
 */
export interface ReviewConfig {
  slug: string;
  category: string;
  itemName: string;
  reviewBody: string;
  rating: number;
  author: string;
  datePublished?: string;
}

export function buildReviewSchema(config: ReviewConfig) {
  const baseUrl = APP_CONFIG.url;

  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'Review' as const,
    '@id': `${baseUrl}/${config.category}/${config.slug}#review`,
    itemReviewed: {
      '@type': 'SoftwareApplication' as const,
      name: config.itemName,
    },
    reviewRating: {
      '@type': 'Rating' as const,
      ratingValue: config.rating,
      bestRating: 5,
      worstRating: 1,
    },
    author: {
      '@type': 'Person' as const,
      name: config.author,
    },
    reviewBody: config.reviewBody,
    datePublished: config.datePublished || new Date().toISOString().split('T')[0],
  };
}

/**
 * Build AggregateRating schema for rating snippets
 */
export interface AggregateRatingConfig {
  slug: string;
  category: string;
  itemName: string;
  ratingValue: number;
  reviewCount: number;
  bestRating?: number;
  worstRating?: number;
}

export function buildAggregateRatingSchema(config: AggregateRatingConfig) {
  const baseUrl = APP_CONFIG.url;

  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'SoftwareApplication' as const,
    '@id': `${baseUrl}/${config.category}/${config.slug}#aggregaterating`,
    name: config.itemName,
    aggregateRating: {
      '@type': 'AggregateRating' as const,
      ratingValue: config.ratingValue,
      reviewCount: config.reviewCount,
      bestRating: config.bestRating || 5,
      worstRating: config.worstRating || 1,
    },
  };
}

/**
 * Build VideoObject schema for tutorial videos
 */
export interface VideoObjectConfig {
  slug: string;
  category: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration?: string; // ISO 8601 duration format (e.g., PT1M30S)
  contentUrl?: string;
  embedUrl?: string;
}

export function buildVideoObjectSchema(config: VideoObjectConfig) {
  const baseUrl = APP_CONFIG.url;

  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'VideoObject' as const,
    '@id': `${baseUrl}/${config.category}/${config.slug}#video`,
    name: config.name,
    description: config.description,
    thumbnailUrl: config.thumbnailUrl,
    uploadDate: config.uploadDate,
    ...(config.duration && { duration: config.duration }),
    ...(config.contentUrl && { contentUrl: config.contentUrl }),
    ...(config.embedUrl && { embedUrl: config.embedUrl }),
  };
}

/**
 * Build Course schema for educational guides
 */
export interface CourseConfig {
  slug: string;
  category: string;
  name: string;
  description: string;
  provider: string;
  educationalLevel?: string;
  timeRequired?: string; // ISO 8601 duration format
  courseCode?: string;
}

export function buildCourseSchema(config: CourseConfig) {
  const baseUrl = APP_CONFIG.url;

  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'Course' as const,
    '@id': `${baseUrl}/${config.category}/${config.slug}#course`,
    name: config.name,
    description: config.description,
    provider: {
      '@type': 'Organization' as const,
      name: config.provider,
    },
    educationalLevel: config.educationalLevel || 'Professional',
    ...(config.timeRequired && { timeRequired: config.timeRequired }),
    ...(config.courseCode && { courseCode: config.courseCode }),
    hasCourseInstance: {
      '@type': 'CourseInstance' as const,
      courseMode: 'online',
      courseWorkload: config.timeRequired,
    },
  };
}

/**
 * Build JobPosting schema for jobs
 */
export interface JobPostingConfig {
  slug: string;
  title: string;
  description: string;
  hiringOrganization: string;
  datePosted: string;
  validThrough?: string;
  employmentType?: string;
  jobLocation?: {
    city?: string;
    state?: string;
    country?: string;
    remote?: boolean;
  };
  baseSalary?: {
    currency: string;
    value: number;
    unitText: string;
  };
}

export function buildJobPostingSchema(config: JobPostingConfig) {
  const baseUrl = APP_CONFIG.url;

  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'JobPosting' as const,
    '@id': `${baseUrl}/jobs/${config.slug}#jobposting`,
    title: config.title,
    description: config.description,
    datePosted: config.datePosted,
    ...(config.validThrough && { validThrough: config.validThrough }),
    hiringOrganization: {
      '@type': 'Organization' as const,
      name: config.hiringOrganization,
    },
    ...(config.employmentType && { employmentType: config.employmentType }),
    ...(config.jobLocation && {
      jobLocation: config.jobLocation.remote
        ? {
            '@type': 'Place' as const,
            address: {
              '@type': 'PostalAddress' as const,
              addressCountry: 'Remote',
            },
          }
        : {
            '@type': 'Place' as const,
            address: {
              '@type': 'PostalAddress' as const,
              ...(config.jobLocation.city && { addressLocality: config.jobLocation.city }),
              ...(config.jobLocation.state && { addressRegion: config.jobLocation.state }),
              ...(config.jobLocation.country && { addressCountry: config.jobLocation.country }),
            },
          },
    }),
    ...(config.baseSalary && {
      baseSalary: {
        '@type': 'MonetaryAmount' as const,
        currency: config.baseSalary.currency,
        value: {
          '@type': 'QuantitativeValue' as const,
          value: config.baseSalary.value,
          unitText: config.baseSalary.unitText,
        },
      },
    }),
  };
}

/**
 * Build CollectionPage schema for collections
 */
export interface CollectionPageConfig {
  slug: string;
  name: string;
  description: string;
  items: Array<{
    name: string;
    url: string;
    description?: string;
  }>;
  collectionSize?: number;
}

export function buildCollectionPageSchema(config: CollectionPageConfig) {
  const baseUrl = APP_CONFIG.url;

  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'CollectionPage' as const,
    '@id': `${baseUrl}/collections/${config.slug}#collection`,
    name: config.name,
    description: config.description,
    mainEntity: {
      '@type': 'ItemList' as const,
      numberOfItems: config.collectionSize || config.items.length,
      itemListElement: config.items.map((item, index) => ({
        '@type': 'ListItem' as const,
        position: index + 1,
        item: {
          '@type': 'Thing' as const,
          name: item.name,
          url: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`,
          ...(item.description && { description: item.description }),
        },
      })),
    },
  };
}

/**
 * Type helper for schema objects
 */
export type SchemaObject = Record<string, unknown>;
