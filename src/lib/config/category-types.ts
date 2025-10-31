/**
 * Category Types - Client-Safe Exports (Database-First)
 * Auto-generated from category_configs table in PostgreSQL.
 * Provides type-only exports without schema imports to prevent circular dependencies.
 */

/** Valid category IDs - Auto-generated from category_configs table */
export const VALID_CATEGORIES = [
  'agents',
  'mcp',
  'commands',
  'rules',
  'hooks',
  'statuslines',
  'collections',
  'skills',
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
