import { type Database } from '@heyclaude/database-types';

import { type TabConfig } from '../../../types/category.ts';

/**
 * Standard tabs with Examples tab - for categories WITH examples data (mcp, skills)
 */
const STANDARD_TABS: readonly TabConfig[] = [
  {
    id: 'overview',
    label: 'Overview',
    mobileLabel: 'Overview',
    order: 1,
    sections: ['content', 'description', 'features', 'use_cases', 'requirements'],
  },
  {
    id: 'installation',
    label: 'Installation & Config',
    mobileLabel: 'Setup',
    order: 2,
    sections: ['installation', 'configuration', 'troubleshooting'],
  },
  {
    id: 'examples',
    label: 'Examples',
    mobileLabel: 'Examples',
    order: 3,
    sections: ['examples'],
  },
  {
    id: 'discussion',
    label: 'Discussion',
    lazy: true,
    mobileLabel: 'Discuss',
    order: 4,
    sections: ['reviews', 'related'],
  },
] as const;

/**
 * Standard tabs WITHOUT Examples - for categories without examples data (hooks, statuslines)
 * These categories have features/use_cases but examples are embedded in content field
 */
const STANDARD_NO_EXAMPLES_TABS: readonly TabConfig[] = [
  {
    id: 'overview',
    label: 'Overview',
    mobileLabel: 'Overview',
    order: 1,
    sections: ['content', 'description', 'features', 'use_cases', 'requirements'],
  },
  {
    id: 'installation',
    label: 'Installation & Config',
    mobileLabel: 'Setup',
    order: 2,
    sections: ['installation', 'configuration', 'troubleshooting'],
  },
  {
    id: 'discussion',
    label: 'Discussion',
    lazy: true,
    mobileLabel: 'Discuss',
    order: 3,
    sections: ['reviews', 'related'],
  },
] as const;

/**
 * Agents tabs WITH Examples - for AI Agents
 * Includes examples tab and security section in Installation & Config tab
 */
const AGENTS_TABS: readonly TabConfig[] = [
  {
    id: 'overview',
    label: 'Overview',
    mobileLabel: 'Overview',
    order: 1,
    sections: ['content', 'description', 'features', 'use_cases', 'requirements'],
  },
  {
    id: 'examples',
    label: 'Examples',
    mobileLabel: 'Examples',
    order: 2,
    sections: ['examples'],
  },
  {
    id: 'installation',
    label: 'Installation & Config',
    mobileLabel: 'Setup',
    order: 3,
    sections: ['installation', 'configuration', 'security', 'troubleshooting'],
  },
  {
    id: 'discussion',
    label: 'Discussion',
    lazy: true,
    mobileLabel: 'Discuss',
    order: 4,
    sections: ['reviews', 'related'],
  },
] as const;

/**
 * Rules tabs WITH Examples - for CLAUDE.md files
 * Includes examples tab for rule usage examples
 */
const RULES_TABS: readonly TabConfig[] = [
  {
    id: 'overview',
    label: 'Overview',
    mobileLabel: 'Overview',
    order: 1,
    sections: ['content', 'description', 'features', 'use_cases', 'requirements'],
  },
  {
    id: 'examples',
    label: 'Examples',
    mobileLabel: 'Examples',
    order: 2,
    sections: ['examples'],
  },
  {
    id: 'installation',
    label: 'Installation & Config',
    mobileLabel: 'Setup',
    order: 3,
    sections: ['installation', 'configuration', 'security', 'troubleshooting'],
  },
  {
    id: 'discussion',
    label: 'Discussion',
    lazy: true,
    mobileLabel: 'Discuss',
    order: 4,
    sections: ['reviews', 'related'],
  },
] as const;

/**
 * Skills tabs WITH Examples - for Agent Skills
 * Includes examples tab and security section in Installation & Config tab
 */
const SKILLS_TABS: readonly TabConfig[] = [
  {
    id: 'overview',
    label: 'Overview',
    mobileLabel: 'Overview',
    order: 1,
    sections: ['content', 'description', 'features', 'use_cases', 'requirements'],
  },
  {
    id: 'installation',
    label: 'Installation & Config',
    mobileLabel: 'Setup',
    order: 2,
    sections: ['installation', 'configuration', 'security', 'troubleshooting'],
  },
  {
    id: 'examples',
    label: 'Examples',
    mobileLabel: 'Examples',
    order: 3,
    sections: ['examples'],
  },
  {
    id: 'discussion',
    label: 'Discussion',
    lazy: true,
    mobileLabel: 'Discuss',
    order: 4,
    sections: ['reviews', 'related'],
  },
] as const;

/**
 * Commands tabs WITH Examples - for commands
 * Includes examples tab for command invocation examples
 */
const COMMANDS_TABS: readonly TabConfig[] = [
  {
    id: 'overview',
    label: 'Overview',
    mobileLabel: 'Overview',
    order: 1,
    sections: ['content', 'description', 'features', 'use_cases', 'requirements'],
  },
  {
    id: 'examples',
    label: 'Examples',
    mobileLabel: 'Examples',
    order: 2,
    sections: ['examples'],
  },
  {
    id: 'usage',
    label: 'Usage Tips',
    mobileLabel: 'Usage',
    order: 3,
    sections: ['troubleshooting'],
  },
  {
    id: 'discussion',
    label: 'Discussion',
    lazy: true,
    mobileLabel: 'Discuss',
    order: 4,
    sections: ['reviews', 'related'],
  },
] as const;

/**
 * Guide tabs - rich content via metadata.sections, no separate examples
 */
const GUIDE_TABS: readonly TabConfig[] = [
  {
    id: 'guide',
    label: 'Guide',
    mobileLabel: 'Guide',
    order: 1,
    sections: ['guide_sections', 'description'],
  },
  {
    id: 'discussion',
    label: 'Discussion',
    lazy: true,
    mobileLabel: 'Discuss',
    order: 2,
    sections: ['reviews', 'related'],
  },
] as const;

const COLLECTION_TABS: readonly TabConfig[] = [
  {
    id: 'items',
    label: 'Collection Items',
    mobileLabel: 'Items',
    order: 1,
    sections: ['collection_items'],
  },
  {
    id: 'details',
    label: 'Details',
    mobileLabel: 'Details',
    order: 2,
    sections: ['description', 'features', 'use_cases'],
  },
  {
    id: 'discussion',
    label: 'Discussion',
    lazy: true,
    mobileLabel: 'Discuss',
    order: 3,
    sections: ['reviews', 'related'],
  },
] as const;

export const DEFAULT_TAB_CONFIGS: Readonly<
  Record<Database['public']['Enums']['content_category'], null | readonly TabConfig[]>
> = {
  agents: AGENTS_TABS,
  changelog: null,
  collections: COLLECTION_TABS,
  // Commands with Examples tab
  commands: COMMANDS_TABS,
  // Special layouts
  guides: GUIDE_TABS,
  // Categories WITHOUT structured examples → no Examples tab (examples embedded in content)
  hooks: STANDARD_NO_EXAMPLES_TABS,
  // No tabs
  jobs: null,
  // Categories WITH structured examples data → show Examples tab
  mcp: STANDARD_TABS,
  // Rules with Examples tab and full sections
  rules: RULES_TABS,
  skills: SKILLS_TABS,
  statuslines: STANDARD_NO_EXAMPLES_TABS,
} as const;

export function getTabConfigForCategory(
  categoryId: Database['public']['Enums']['content_category']
): null | readonly TabConfig[] {
  return DEFAULT_TAB_CONFIGS[categoryId] ?? null;
}

export function categorySupportsTabbing(
  categoryId: Database['public']['Enums']['content_category']
): boolean {
  return DEFAULT_TAB_CONFIGS[categoryId] !== null;
}
