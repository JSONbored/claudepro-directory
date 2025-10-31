/**
 * Schema-to-Metadata Adapter - Database-First
 * Derives SEO metadata from category_configs table and content schemas.
 */

import type { CategoryId } from '@/src/lib/schemas/shared.schema';

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Metadata Derivation Rule
 * Defines how to extract metadata from a content schema
 */
export interface MetadataDerivationRule {
  /** Content category this rule applies to */
  category: CategoryId;

  /** How to derive the title from schema */
  titleField: string | ((schema: Record<string, unknown>) => string);

  /** How to derive the description from schema */
  descriptionField: string | ((schema: Record<string, unknown>) => string);

  /** How to derive keywords from schema */
  keywordsField?: string | ((schema: Record<string, unknown>) => string[]);

  /** Schema.org type for structured data */
  schemaType: 'WebPage' | 'Article' | 'SoftwareApplication' | 'TechArticle';

  /** Whether to use Article schema (better for AI citations) */
  useArticleSchema: boolean;
}

// ============================================
// METADATA DERIVATION RULES
// ============================================

/**
 * Category-specific metadata derivation rules
 * Maps each content category to its derivation logic
 *
 * NOTE: Subcategories (tutorials, workflows, etc.) are handled by the 'guides' rule
 */
export const CATEGORY_METADATA_RULES: Record<CategoryId, MetadataDerivationRule> = {
  // Core content types
  agents: {
    category: 'agents',
    titleField: 'name',
    descriptionField: 'description',
    keywordsField: 'tags',
    schemaType: 'SoftwareApplication',
    useArticleSchema: false,
  },
  mcp: {
    category: 'mcp',
    titleField: 'name',
    descriptionField: 'description',
    keywordsField: 'tags',
    schemaType: 'SoftwareApplication',
    useArticleSchema: false,
  },
  rules: {
    category: 'rules',
    titleField: 'title',
    descriptionField: 'description',
    keywordsField: 'tags',
    schemaType: 'TechArticle',
    useArticleSchema: true,
  },
  commands: {
    category: 'commands',
    titleField: 'title',
    descriptionField: 'description',
    keywordsField: 'tags',
    schemaType: 'TechArticle',
    useArticleSchema: true,
  },
  hooks: {
    category: 'hooks',
    titleField: 'title',
    descriptionField: 'description',
    keywordsField: 'tags',
    schemaType: 'TechArticle',
    useArticleSchema: true,
  },
  statuslines: {
    category: 'statuslines',
    titleField: 'title',
    descriptionField: 'description',
    keywordsField: 'tags',
    schemaType: 'TechArticle',
    useArticleSchema: true,
  },
  collections: {
    category: 'collections',
    titleField: 'name',
    descriptionField: 'description',
    keywordsField: 'tags',
    schemaType: 'Article',
    useArticleSchema: true,
  },

  skills: {
    category: 'skills',
    titleField: 'title',
    descriptionField: 'description',
    keywordsField: 'tags',
    schemaType: 'TechArticle',
    useArticleSchema: true,
  },

  // SEO content types
  // Guides category - handles all guide subcategories (tutorials, workflows, etc.)
  guides: {
    category: 'guides',
    titleField: 'title',
    descriptionField: 'description',
    keywordsField: 'keywords',
    schemaType: 'Article',
    useArticleSchema: true,
  },

  // Special types
  jobs: {
    category: 'jobs',
    titleField: 'title',
    descriptionField: 'description',
    keywordsField: 'skills',
    schemaType: 'Article',
    useArticleSchema: false,
  },
  changelog: {
    category: 'changelog',
    titleField: 'title',
    descriptionField: 'summary',
    keywordsField: (schema) => {
      const categories = schema.categories as string[] | undefined;
      return categories || [];
    },
    schemaType: 'Article',
    useArticleSchema: true,
  },
};

// ============================================
// METADATA DERIVATION FUNCTIONS
// ============================================

/**
 * Main function: Derive metadata from any content schema
 * Routes to category-specific derivation function
 */
export function deriveMetadataFromSchema(
  category: CategoryId,
  schema: Record<string, unknown>
): { title: string; description: string; keywords: string[] } | null {
  const rule = CATEGORY_METADATA_RULES[category];
  if (!rule) return null;

  // Extract title
  const title =
    typeof rule.titleField === 'function'
      ? rule.titleField(schema)
      : (schema[rule.titleField] as string);

  // Extract description
  const description =
    typeof rule.descriptionField === 'function'
      ? rule.descriptionField(schema)
      : (schema[rule.descriptionField] as string);

  // Extract keywords
  let keywords: string[] = [];
  if (rule.keywordsField) {
    keywords =
      typeof rule.keywordsField === 'function'
        ? rule.keywordsField(schema)
        : (schema[rule.keywordsField] as string[]) || [];
  }

  // Validate required fields
  if (!(title && description)) return null;

  return { title, description, keywords };
}
