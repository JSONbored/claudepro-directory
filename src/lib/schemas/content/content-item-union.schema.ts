/**
 * Content Item Union Schema
 *
 * Central union type for all content schemas.
 * Extracted from index.ts barrel to eliminate barrel file overhead.
 *
 * Import this when you need the discriminated union of all content types.
 *
 * @see lib/schemas/content/*.schema.ts - Individual content schemas
 */

import { z } from 'zod';
import { agentContentSchema } from './agent.schema';
import { collectionContentSchema } from './collection.schema';
import { commandContentSchema } from './command.schema';
import { guideContentSchema } from './guide.schema';
import { hookContentSchema } from './hook.schema';
import { mcpContentSchema } from './mcp.schema';
import { ruleContentSchema } from './rule.schema';
import { skillContentSchema } from './skill.schema';
import { statuslineContentSchema } from './statusline.schema';

/**
 * Union of all content schemas
 * Allows discriminated union type checking based on content type
 */
export const contentItemSchema = z.union([
  agentContentSchema,
  mcpContentSchema,
  ruleContentSchema,
  commandContentSchema,
  hookContentSchema,
  guideContentSchema,
  statuslineContentSchema,
  collectionContentSchema,
  skillContentSchema,
]);

export type ContentItem = z.infer<typeof contentItemSchema>;
