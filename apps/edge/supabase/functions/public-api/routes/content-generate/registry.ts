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
 * Retrieve the package generator associated with a content category.
 *
 * @param category - The content category to look up
 * @returns The generator instance for `category`, or `null` if no generator is registered for that category
 */
export function getGenerator(category: ContentCategory): PackageGenerator | null {
  return GENERATORS.get(category) ?? null;
}

/**
 * Lists content categories that have a registered package generator.
 *
 * @returns An array of supported content categories.
 */
export function getSupportedCategories(): ContentCategory[] {
  // Array.from returns the correct type, no assertion needed
  return Array.from(GENERATORS.keys());
}

/**
 * Determine whether a content category has a registered package generator.
 *
 * @param category - The content category to check
 * @returns `true` if the category has a registered generator, `false` otherwise.
 */
export function isCategorySupported(category: ContentCategory): boolean {
  return GENERATORS.has(category);
}