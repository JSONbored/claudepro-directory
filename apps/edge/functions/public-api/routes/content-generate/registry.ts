/**
 * Package Generator Registry
 *
 * Maps content categories to their package generators.
 * Easy to extend: just add new generator to this map.
 */

import type { Database as DatabaseGenerated } from '@heyclaude/database-types';

import { McpGenerator } from './generators/mcp.ts';
import { SkillsGenerator } from './generators/skills.ts';
import type { PackageGenerator } from './types.ts';

type ContentCategory = DatabaseGenerated['public']['Enums']['content_category'];

/**
 * Registry of category generators
 *
 * To add a new category:
 * 1. Create generator in generators/[category].ts
 * 2. Import it above
 * 3. Add entry to this map
 */
const GENERATORS = new Map<ContentCategory, PackageGenerator>([
  ['skills', new SkillsGenerator()],
  ['mcp', new McpGenerator()],
  // Future: ['hooks', new HooksGenerator()],
  // Future: ['rules', new RulesGenerator()],
]);

/**
 * Get generator for a category
 * @param category - Content category
 * @returns Generator instance or null if not supported
 */
export function getGenerator(category: ContentCategory): PackageGenerator | null {
  return GENERATORS.get(category) ?? null;
}

/**
 * Get all supported categories
 * @returns Array of categories that support package generation
 */
export function getSupportedCategories(): ContentCategory[] {
  // Array.from returns the correct type, no assertion needed
  return Array.from(GENERATORS.keys());
}

/**
 * Check if category supports package generation
 * @param category - Content category
 * @returns true if category has a generator
 */
export function isCategorySupported(category: ContentCategory): boolean {
  return GENERATORS.has(category);
}
