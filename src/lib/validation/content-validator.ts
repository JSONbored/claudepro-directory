/**
 * Content Validation Utilities
 *
 * Helper functions for validating content by category.
 * Extracted from lib/schemas/content/index.ts to eliminate barrel overhead.
 *
 * @see lib/schemas/content/*.schema.ts - Individual content schemas
 */

import { agentContentSchema } from '@/src/lib/schemas/content/agent.schema';
import { collectionContentSchema } from '@/src/lib/schemas/content/collection.schema';
import { commandContentSchema } from '@/src/lib/schemas/content/command.schema';
import { guideContentSchema } from '@/src/lib/schemas/content/guide.schema';
import { hookContentSchema } from '@/src/lib/schemas/content/hook.schema';
import { mcpContentSchema } from '@/src/lib/schemas/content/mcp.schema';
import { ruleContentSchema } from '@/src/lib/schemas/content/rule.schema';
import { skillContentSchema } from '@/src/lib/schemas/content/skill.schema';
import { statuslineContentSchema } from '@/src/lib/schemas/content/statusline.schema';

/**
 * Validate content data by category
 *
 * @param data - Unknown data to validate
 * @param category - Content category to validate against
 * @returns Parsed and validated content item
 * @throws Error if category is unknown or validation fails
 */
export function validateContentByCategory(data: unknown, category: string) {
  switch (category) {
    case 'agents':
      return agentContentSchema.parse(data);
    case 'mcp':
      return mcpContentSchema.parse(data);
    case 'rules':
      return ruleContentSchema.parse(data);
    case 'commands':
      return commandContentSchema.parse(data);
    case 'hooks':
      return hookContentSchema.parse(data);
    case 'guides':
      return guideContentSchema.parse(data);
    case 'statuslines':
      return statuslineContentSchema.parse(data);
    case 'collections':
      return collectionContentSchema.parse(data);
    case 'skills':
      return skillContentSchema.parse(data);
    default:
      throw new Error(`Unknown content category: ${category}`);
  }
}
