/**
 * Default Tab Configurations for Content Detail Pages
 * Maps categories to their default tab layouts based on section availability
 */

import type { TabConfig } from '@/src/lib/types/component.types';
import type { Database } from '@/src/types/database.types';

/**
 * Standard tabs for technical content (agents, mcp, hooks, statuslines, skills)
 */
const STANDARD_TABS: ReadonlyArray<TabConfig> = [
  {
    id: 'overview',
    label: 'Overview',
    mobileLabel: 'Overview',
    sections: ['description', 'features', 'use_cases', 'requirements'],
    order: 1,
  },
  {
    id: 'installation',
    label: 'Installation & Config',
    mobileLabel: 'Setup',
    sections: ['installation', 'configuration', 'troubleshooting'],
    order: 2,
  },
  {
    id: 'examples',
    label: 'Examples',
    mobileLabel: 'Examples',
    sections: ['examples'],
    order: 3,
  },
  {
    id: 'discussion',
    label: 'Discussion',
    mobileLabel: 'Discuss',
    sections: ['reviews', 'related'],
    lazy: true,
    order: 4,
  },
] as const;

/**
 * Simplified tabs for simpler content (rules, commands)
 */
const SIMPLE_TABS: ReadonlyArray<TabConfig> = [
  {
    id: 'overview',
    label: 'Overview',
    mobileLabel: 'Overview',
    sections: ['description', 'features', 'use_cases', 'requirements'],
    order: 1,
  },
  {
    id: 'usage',
    label: 'Usage & Examples',
    mobileLabel: 'Usage',
    sections: ['examples', 'troubleshooting'],
    order: 2,
  },
  {
    id: 'discussion',
    label: 'Discussion',
    mobileLabel: 'Discuss',
    sections: ['reviews', 'related'],
    lazy: true,
    order: 3,
  },
] as const;

/**
 * Guide-specific tabs
 */
const GUIDE_TABS: ReadonlyArray<TabConfig> = [
  {
    id: 'guide',
    label: 'Guide',
    mobileLabel: 'Guide',
    sections: ['guide_sections', 'description'],
    order: 1,
  },
  {
    id: 'examples',
    label: 'Examples',
    mobileLabel: 'Examples',
    sections: ['examples', 'use_cases'],
    order: 2,
  },
  {
    id: 'discussion',
    label: 'Discussion',
    mobileLabel: 'Discuss',
    sections: ['reviews', 'related'],
    lazy: true,
    order: 3,
  },
] as const;

/**
 * Collection-specific tabs
 */
const COLLECTION_TABS: ReadonlyArray<TabConfig> = [
  {
    id: 'items',
    label: 'Collection Items',
    mobileLabel: 'Items',
    sections: ['collection_items'],
    order: 1,
  },
  {
    id: 'details',
    label: 'Details',
    mobileLabel: 'Details',
    sections: ['description', 'features', 'use_cases'],
    order: 2,
  },
  {
    id: 'discussion',
    label: 'Discussion',
    mobileLabel: 'Discuss',
    sections: ['reviews', 'related'],
    lazy: true,
    order: 3,
  },
] as const;

/**
 * Category to tab layout mapping
 */
export const DEFAULT_TAB_CONFIGS: Readonly<
  Record<Database['public']['Enums']['content_category'], ReadonlyArray<TabConfig> | null>
> = {
  // Standard technical content
  agents: STANDARD_TABS,
  mcp: STANDARD_TABS,
  hooks: STANDARD_TABS,
  statuslines: STANDARD_TABS,
  skills: STANDARD_TABS,

  // Simpler content types
  rules: SIMPLE_TABS,
  commands: SIMPLE_TABS,

  // Specialized layouts
  guides: GUIDE_TABS,
  collections: COLLECTION_TABS,

  // No tabs (keep vertical layout)
  jobs: null,
  changelog: null,
} as const;

/**
 * Get tab configuration for a category
 */
export function getTabConfigForCategory(
  categoryId: Database['public']['Enums']['content_category']
): ReadonlyArray<TabConfig> | null {
  return DEFAULT_TAB_CONFIGS[categoryId] ?? null;
}

/**
 * Check if category supports tabs
 */
export function categorySupportsTabbing(
  categoryId: Database['public']['Enums']['content_category']
): boolean {
  return DEFAULT_TAB_CONFIGS[categoryId] !== null;
}
