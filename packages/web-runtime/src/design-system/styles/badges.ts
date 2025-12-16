/**
 * Badge CSS Class Utilities
 * Category badge class patterns
 * 
 * Maps existing CSS badge classes from globals.css to semantic utilities.
 * These classes use CSS variables for category-specific colors.
 * 
 * @example
 * ```tsx
 * import { badge } from '@heyclaude/web-runtime/design-system';
 * 
 * <span className={badge.category.agents}>Agents</span>
 * <span className={badge.category.mcp}>MCP</span>
 * ```
 */

export const badge = {
  /**
   * Category badge utilities
   * Each badge uses transparent background with category-specific text and border colors
   */
  category: {
    agents: 'badge-category-agents',
    mcp: 'badge-category-mcp',
    rules: 'badge-category-rules',
    commands: 'badge-category-commands',
    hooks: 'badge-category-hooks',
    statuslines: 'badge-category-statuslines',
    collections: 'badge-category-collections',
    guides: 'badge-category-guides',
    skills: 'badge-category-skills',
  },
} as const;
