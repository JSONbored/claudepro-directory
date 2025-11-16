/**
 * Valid content categories - single source of truth
 */

export const VALID_CONTENT_CATEGORIES = [
  'agents',
  'commands',
  'hooks',
  'mcp',
  'rules',
  'skills',
  'statuslines',
  'collections',
  'guides',
] as const;

export type ContentCategory = (typeof VALID_CONTENT_CATEGORIES)[number];
