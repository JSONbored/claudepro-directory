/**
 * Transform Functions for Data->Component Mapping
 * Converts strict content schema data to flexible component interfaces
 */

import type { UnifiedContentItem } from '@/lib/schemas/components';

// Import all content types
import type { AgentContent } from '@/lib/schemas/content/agent.schema';
import type { CommandContent } from '@/lib/schemas/content/command.schema';
import type { GuideContent } from '@/lib/schemas/content/guide.schema';
import type { HookContent } from '@/lib/schemas/content/hook.schema';
import type { McpContent } from '@/lib/schemas/content/mcp.schema';
import type { RuleContent } from '@/lib/schemas/content/rule.schema';

// Union type for all content
type ContentItem =
  | AgentContent
  | McpContent
  | RuleContent
  | CommandContent
  | HookContent
  | GuideContent;

/**
 * Transform any content item to unified component interface
 */
export function transformToUnifiedContent(item: ContentItem): UnifiedContentItem {
  // Base transformation - copy all properties and convert readonly arrays to mutable
  const transformed = {
    ...item,
    tags: [...item.tags], // Convert readonly array to mutable array
    category: item.category as UnifiedContentItem['category'],
  } as UnifiedContentItem;

  // Add display properties for components
  if (!transformed.title) {
    transformed.title = generateDisplayTitle(item.slug);
  }

  if (!transformed.name) {
    transformed.name = transformed.title;
  }

  // Add type for component display logic
  transformed.type = item.category;

  return transformed;
}

/**
 * Transform array of content items
 */
export function transformContentArray(items: readonly ContentItem[]): UnifiedContentItem[] {
  return items.map(transformToUnifiedContent);
}

/**
 * Generate display title from slug
 */
function generateDisplayTitle(slug: string): string {
  return slug
    .split('-')
    .map((word) => {
      // Handle common acronyms
      const upperWord = word.toUpperCase();
      if (
        ['API', 'AWS', 'CSS', 'JSON', 'HTML', 'MCP', 'AI', 'ML', 'SQL', 'REST'].includes(upperWord)
      ) {
        return upperWord;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Transform for specific detail page props
 */
export function transformForDetailPage(
  item: ContentItem,
  relatedItems: ContentItem[] = []
): {
  item: UnifiedContentItem;
  relatedItems: UnifiedContentItem[];
} {
  return {
    item: transformToUnifiedContent(item),
    relatedItems: transformContentArray(relatedItems),
  };
}

/**
 * Transform for home page props
 * Now handles UnifiedContentItem arrays from content processor
 */
export function transformForHomePage(data: {
  rules: readonly UnifiedContentItem[];
  mcp: readonly UnifiedContentItem[];
  agents: readonly UnifiedContentItem[];
  commands: readonly UnifiedContentItem[];
  hooks: readonly UnifiedContentItem[];
  allConfigs: readonly UnifiedContentItem[];
}): {
  rules: UnifiedContentItem[];
  mcp: UnifiedContentItem[];
  agents: UnifiedContentItem[];
  commands: UnifiedContentItem[];
  hooks: UnifiedContentItem[];
  allConfigs: UnifiedContentItem[];
} {
  // Convert readonly arrays to mutable arrays for component use
  return {
    rules: [...data.rules],
    mcp: [...data.mcp],
    agents: [...data.agents],
    commands: [...data.commands],
    hooks: [...data.hooks],
    allConfigs: [...data.allConfigs],
  };
}
