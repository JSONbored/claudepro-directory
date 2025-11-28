import type { Database } from '@heyclaude/database-types';

import type { TabConfig } from '../../../types/category.ts';

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
  Record<Database['public']['Enums']['content_category'], ReadonlyArray<TabConfig> | null>
> = {
  agents: STANDARD_TABS,
  mcp: STANDARD_TABS,
  hooks: STANDARD_TABS,
  statuslines: STANDARD_TABS,
  skills: STANDARD_TABS,
  rules: SIMPLE_TABS,
  commands: SIMPLE_TABS,
  guides: GUIDE_TABS,
  collections: COLLECTION_TABS,
  jobs: null,
  changelog: null,
} as const;

export function getTabConfigForCategory(
  categoryId: Database['public']['Enums']['content_category']
): ReadonlyArray<TabConfig> | null {
  return DEFAULT_TAB_CONFIGS[categoryId] ?? null;
}

export function categorySupportsTabbing(
  categoryId: Database['public']['Enums']['content_category']
): boolean {
  return DEFAULT_TAB_CONFIGS[categoryId] !== null;
}
