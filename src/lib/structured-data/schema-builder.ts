/**
 * Schema Builder Utilities
 * Shared builders for generating schema.org structured data
 */

import { APP_CONFIG } from "@/src/lib/constants";

/**
 * Base schema context
 */
const SCHEMA_CONTEXT = "https://schema.org" as const;

/**
 * Build author/organization schema
 */
function buildAuthor(
  authorName?: string,
  githubUrl?: string,
): {
  "@type": "Person" | "Organization";
  name: string;
  url?: string;
  sameAs?: string;
} {
  const isAnthropicOrg = githubUrl?.includes("github.com/anthropics");

  return {
    "@type": isAnthropicOrg ? "Organization" : "Person",
    name: authorName || "Unknown",
    ...(githubUrl && { url: githubUrl, sameAs: githubUrl }),
  };
}

/**
 * Build breadcrumb list schema
 */
export function buildBreadcrumb(items: Array<{ name: string; url: string }>) {
  const baseUrl = APP_CONFIG.url;

  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "BreadcrumbList" as const,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem" as const,
      position: index + 1,
      item: {
        "@id": item.url.startsWith("http") ? item.url : `${baseUrl}${item.url}`,
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
  githubUrl?: string | undefined;
  dateAdded?: string;
  lastModified?: string | undefined;
  features?: string[] | undefined;
  requirements?: string[] | undefined;
  configuration?: unknown;
}

export function buildSoftwareApplication(config: SoftwareApplicationConfig) {
  const baseUrl = APP_CONFIG.url;

  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "SoftwareApplication" as const,
    "@id": `${baseUrl}/${config.category}/${config.slug}`,
    name: config.name,
    alternateName: config.slug,
    description: config.description,
    applicationCategory: "DeveloperApplication",
    applicationSubCategory: config.applicationSubCategory,
    operatingSystem: config.operatingSystem || "Claude Desktop / Claude Code",
    url: `${baseUrl}/${config.category}/${config.slug}`,
    datePublished: config.dateAdded,
    dateModified: config.lastModified || config.dateAdded,
    keywords: config.keywords.join(", "),
    author: buildAuthor(config.author, config.githubUrl),
    featureList: config.features?.join(", "),
    softwareRequirements:
      config.requirements?.join(", ") || "Claude Desktop or Claude Code",
    offers: {
      "@type": "Offer" as const,
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    learningResourceType: "Software Configuration",
    educationalLevel: "Professional",
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
    "@context": SCHEMA_CONTEXT,
    "@type": "SoftwareSourceCode" as const,
    "@id": `${baseUrl}/${config.category}/${config.slug}#${config.fragmentId}`,
    name: config.name,
    description: config.description,
    programmingLanguage: {
      "@type": "ComputerLanguage" as const,
      name: config.programmingLanguage,
    },
    codeRepository: config.githubUrl,
    text: config.code,
    encodingFormat: config.encodingFormat,
    runtimePlatform: "Claude AI Assistant",
    targetProduct: "Claude Desktop / Claude Code",
    license: "https://opensource.org/licenses/MIT",
    isPartOf: {
      "@id": `${baseUrl}/${config.category}/${config.slug}`,
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
    "@context": SCHEMA_CONTEXT,
    "@type": "HowTo" as const,
    "@id": `${baseUrl}/${config.category}/${config.slug}#howto`,
    name: `How to use ${config.name}`,
    description: config.description,
    estimatedCost: {
      "@type": "MonetaryAmount" as const,
      currency: "USD",
      value: "0",
    },
    step: config.steps.map((step) => ({
      "@type": "HowToStep" as const,
      position: step.position,
      name: step.name,
      text: step.text,
      ...(step.code && {
        itemListElement: {
          "@type": "SoftwareSourceCode" as const,
          text: step.code,
          programmingLanguage: step.programmingLanguage || "json",
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
    "@context": SCHEMA_CONTEXT,
    "@type": "CreativeWork" as const,
    "@id": `${baseUrl}/${config.category}/${config.slug}#content`,
    name: `${config.name} - Content Template`,
    description: config.description,
    text: config.content,
    inLanguage: "en",
    encodingFormat: "text/plain",
    creator: {
      "@type": "Person" as const,
      name: config.author || "Unknown",
    },
    isPartOf: {
      "@id": `${baseUrl}/${config.category}/${config.slug}`,
    },
    learningResourceType: "Template",
    educationalUse: "Professional Development",
  };
}

/**
 * Build WebPage schema with speakable
 */
export function buildWebPageSpeakable(slug: string, category: string) {
  const baseUrl = APP_CONFIG.url;

  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "WebPage" as const,
    "@id": `${baseUrl}/${category}/${slug}#webpage`,
    url: `${baseUrl}/${category}/${slug}`,
    speakable: {
      "@type": "SpeakableSpecification" as const,
      cssSelector: ["description", "headline", ".features"],
      xpath: [
        "/html/head/title",
        '/html/head/meta[@name="description"]/@content',
      ],
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
  troubleshooting: FAQItem[],
) {
  const baseUrl = APP_CONFIG.url;

  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "FAQPage" as const,
    "@id": `${baseUrl}/${category}/${slug}#faq`,
    name: `${name} - Troubleshooting`,
    description: `Frequently asked questions and troubleshooting for ${name}`,
    url: `${baseUrl}/${category}/${slug}`,
    mainEntity: troubleshooting.map((item) => ({
      "@type": "Question" as const,
      name: item.issue,
      acceptedAnswer: {
        "@type": "Answer" as const,
        text: item.solution,
      },
    })),
  };
}

/**
 * Type helper for schema objects
 */
export type SchemaObject = Record<string, unknown>;
