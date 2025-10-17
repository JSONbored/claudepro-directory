/**
 * Additional Content Types
 *
 * Supplementary types used across the codebase.
 * Extracted from barrel file to eliminate performance overhead.
 */

/**
 * Content statistics type
 * Used for tracking counts across all categories
 * Modernized: includes all 11 categories from UNIFIED_CATEGORY_REGISTRY
 */
export type ContentStats = {
  agents: number;
  mcp: number;
  rules: number;
  commands: number;
  hooks: number;
  guides: number;
  statuslines: number;
  collections: number;
  skills: number;
  jobs: number;
  changelog: number;
};
