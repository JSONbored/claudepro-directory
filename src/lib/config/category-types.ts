/**
 * Category Types - Client-Safe Exports
 *
 * This file provides type-only exports for CategoryId without importing Zod schemas.
 * This breaks the circular dependency chain:
 *   shared.schema → category-config → collection.schema → shared.schema ❌
 *
 * New architecture:
 *   shared.schema → category-types ✅ (no schema imports)
 *   category-config → all schemas (server-only)
 *
 * **Why This Exists:**
 * - Storybook and client components need CategoryId type
 * - They DON'T need Zod schema validation (server-only)
 * - Importing category-config.ts triggers ALL schema imports = circular dependency
 * - This file provides ONLY the type, no schema imports
 *
 * @module lib/config/category-types
 */

/**
 * Valid category IDs (hardcoded list - sync with UNIFIED_CATEGORY_REGISTRY)
 *
 * IMPORTANT: When adding a new category to UNIFIED_CATEGORY_REGISTRY,
 * also add it to this array to keep types in sync.
 *
 * Current categories (11):
 * - agents, mcp, commands, rules, hooks, statuslines
 * - collections, skills, guides, jobs, changelog
 */
export const VALID_CATEGORIES = [
  'agents',
  'mcp',
  'commands',
  'rules',
  'hooks',
  'statuslines',
  'skills',
  'collections',
  'guides',
  'jobs',
  'changelog',
] as const;

/**
 * CategoryId - THE ONLY category type
 *
 * Union type of all valid category IDs.
 * This is derived from VALID_CATEGORIES constant (not from schema imports).
 *
 * ONE NAME. ONE CONCEPT. NO ALIASES.
 */
export type CategoryId = (typeof VALID_CATEGORIES)[number];
