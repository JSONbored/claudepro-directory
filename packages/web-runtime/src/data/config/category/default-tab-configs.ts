import { type Database } from '@heyclaude/database-types';

import { type TabConfig } from '../../../types/category.ts';

/**
 * Standard tabs with Examples tab - for categories WITH examples data (mcp, skills)
 */
const STANDARD_TABS: ReadonlyArray<TabConfig> = [
  {
    id: 'overview',
    label: 'Overview',
    mobileLabel: 'Overview',
    sections: ['content', 'description', 'features', 'use_cases', 'requirements'],
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
 * Standard tabs WITHOUT Examples - for categories without examples data (agents, hooks, statuslines)
 * These categories have features/use_cases but examples are embedded in content field
 */
const STANDARD_NO_EXAMPLES_TABS: ReadonlyArray<TabConfig> = [
  {
    id: 'overview',
    label: 'Overview',
    mobileLabel: 'Overview',
    sections: ['content', 'description', 'features', 'use_cases', 'requirements'],
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
    id: 'discussion',
    label: 'Discussion',
    mobileLabel: 'Discuss',
    sections: ['reviews', 'related'],
    lazy: true,
    order: 3,
  },
] as const;

/**
 * Simple tabs WITHOUT Examples - for rules and commands
 * These have minimal structure with content + troubleshooting
 */
const SIMPLE_TABS: ReadonlyArray<TabConfig> = [
  {
    id: 'overview',
    label: 'Overview',
    mobileLabel: 'Overview',
    sections: ['content', 'description', 'features', 'use_cases', 'requirements'],
    order: 1,
  },
  {
    id: 'usage',
    label: 'Usage Tips',
    mobileLabel: 'Usage',
    sections: ['troubleshooting'],
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
 * Guide tabs - rich content via metadata.sections, no separate examples
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
    id: 'discussion',
    label: 'Discussion',
    mobileLabel: 'Discuss',
    sections: ['reviews', 'related'],
    lazy: true,
    order: 2,
  },
] as const;

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

export const DEFAULT_TAB_CONFIGS: Readonly<
  Record<Database['public']['Enums']['content_category'], null | ReadonlyArray<TabConfig>>
> = {
  // Categories WITH structured examples data → show Examples tab
  mcp: STANDARD_TABS,
  skills: STANDARD_TABS,
  // Categories WITHOUT structured examples → no Examples tab (examples embedded in content)
  agents: STANDARD_NO_EXAMPLES_TABS,
  hooks: STANDARD_NO_EXAMPLES_TABS,
  statuslines: STANDARD_NO_EXAMPLES_TABS,
  // Simple content categories → minimal tabs
  rules: SIMPLE_TABS,
  commands: SIMPLE_TABS,
  // Special layouts
  guides: GUIDE_TABS,
  collections: COLLECTION_TABS,
  // No tabs
  jobs: null,
  changelog: null,
} as const;

export function getTabConfigForCategory(
  categoryId: Database['public']['Enums']['content_category']
): null | ReadonlyArray<TabConfig> {
  return DEFAULT_TAB_CONFIGS[categoryId] ?? null;
}

export function categorySupportsTabbing(
  categoryId: Database['public']['Enums']['content_category']
): boolean {
  return DEFAULT_TAB_CONFIGS[categoryId] !== null;
}
