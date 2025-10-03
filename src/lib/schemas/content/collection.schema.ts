/**
 * Collection Content Schema
 * Defines the structure for content collections (bundles of related configurations)
 *
 * Collections enable sharing multiple related content items together in a unified,
 * organized manner. Each collection can include items from any content category.
 *
 * Uses Zod v4 shape destructuring pattern for composition with base content schema.
 * This approach is more tsc-efficient than .extend() and follows Zod best practices.
 */

import { z } from 'zod';
import { baseContentMetadataSchema } from '@/src/lib/schemas/content/base-content.schema';
import { limitedMediumStringArray } from '@/src/lib/schemas/primitives/base-arrays';
import { mediumString, shortString } from '@/src/lib/schemas/primitives/base-strings';

/**
 * Collection Item Reference Schema
 *
 * References a specific content item by category and slug.
 * Build-time validation ensures all referenced items exist.
 */
const collectionItemReferenceSchema = z
  .object({
    category: z
      .enum(['agents', 'mcp', 'rules', 'commands', 'hooks', 'statuslines'])
      .describe('Content category of the referenced item'),
    slug: shortString.describe('Unique slug identifier of the referenced item'),
    reason: mediumString
      .optional()
      .describe(
        'Optional explanation for why this item is included in the collection (displayed in UI)'
      ),
  })
  .describe(
    'Reference to a content item included in the collection. Build-time validation ensures item exists.'
  );

export type CollectionItemReference = z.infer<typeof collectionItemReferenceSchema>;

/**
 * Collection Compatibility Schema
 *
 * Defines which Claude platforms this collection supports.
 */
const collectionCompatibilitySchema = z
  .object({
    claudeDesktop: z
      .boolean()
      .default(true)
      .describe('Whether collection is compatible with Claude Desktop'),
    claudeCode: z
      .boolean()
      .default(true)
      .describe('Whether collection is compatible with Claude Code CLI'),
  })
  .describe('Platform compatibility information for the collection');

export type CollectionCompatibility = z.infer<typeof collectionCompatibilitySchema>;

/**
 * Collection content schema - organized bundles of related configurations
 *
 * Inherits common fields from baseContentMetadataSchema via shape destructuring:
 * - slug, description, author, dateAdded, tags, content
 * - title, source, documentationUrl, features, useCases
 *
 * Collection-specific additions:
 * - category: 'collections' literal
 * - collectionType: Type of collection (starter-kit, workflow, etc.)
 * - difficulty: Difficulty level for users
 * - items: Array of content item references (2-20 items)
 * - installationOrder: Optional ordered list of slugs for installation sequence
 * - prerequisites: Optional requirements before installing collection
 * - estimatedSetupTime: Optional time estimate (e.g., "15 minutes", "1 hour")
 * - compatibility: Platform compatibility flags
 */
export const collectionContentSchema = z
  .object({
    // Inherit all base content metadata fields using shape destructuring (Zod v4 best practice)
    ...baseContentMetadataSchema.shape,

    // Collection-specific required fields
    category: z
      .literal('collections')
      .describe('Content category literal identifier: "collections"'),

    collectionType: z
      .enum(['starter-kit', 'workflow', 'advanced-system', 'use-case'])
      .describe(
        'Type of collection: starter-kit (beginner bundles), workflow (task-specific), advanced-system (complex setups), use-case (solution-oriented)'
      ),

    difficulty: z
      .enum(['beginner', 'intermediate', 'advanced'])
      .describe('Difficulty level indicating complexity and user experience requirements'),

    items: z
      .array(collectionItemReferenceSchema)
      .min(2, 'Collections must include at least 2 items')
      .max(20, 'Collections limited to 20 items for maintainability')
      .describe(
        'Array of content item references included in this collection (minimum 2, maximum 20 items)'
      ),

    // Collection-specific optional fields
    installationOrder: z
      .array(shortString)
      .optional()
      .describe(
        'Optional ordered array of item slugs defining recommended installation sequence. If not provided, items can be installed in any order.'
      ),

    prerequisites: limitedMediumStringArray
      .optional()
      .describe(
        'Optional list of prerequisites required before installing this collection (e.g., "Node.js 18+", "API key from service X")'
      ),

    estimatedSetupTime: shortString
      .optional()
      .describe(
        'Optional human-readable time estimate for complete setup (e.g., "15 minutes", "1 hour", "2-3 hours")'
      ),

    compatibility: collectionCompatibilitySchema
      .optional()
      .describe(
        'Optional platform compatibility information. Defaults to supporting both Claude Desktop and Claude Code.'
      ),
  })
  .describe(
    'Collection content schema for organized bundles of related configurations. Collections enable sharing multiple content items (agents, MCP servers, commands, etc.) together as a unified, curated package. Inherits base content metadata and adds collection-specific fields for item references, installation guidance, and compatibility.'
  );

export type CollectionContent = z.infer<typeof collectionContentSchema>;
