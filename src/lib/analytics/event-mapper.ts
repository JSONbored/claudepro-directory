/**
 * Centralized Event Mapper Utility - Configuration-Driven
 *
 * Auto-generates analytics event mappings from unified category registry.
 * Zero hardcoded category lists - automatically stays in sync.
 *
 * Modern 2025 Architecture:
 * - Configuration-driven: Mappings derived from UNIFIED_CATEGORY_REGISTRY
 * - Type-safe with branded EventName types
 * - Automated: Adding category to registry automatically creates event mappings
 * - Validated category mappings
 * - Fallback to generic events
 * - Zero runtime errors with exhaustive checks
 *
 * @see lib/config/category-config.ts - Single source of truth for categories
 * @module lib/analytics/event-mapper
 */

import type { EventName } from '@/src/lib/analytics/events.config';
import { EVENTS } from '@/src/lib/analytics/events.config';
import { getAllCategoryIds } from '@/src/lib/config/category-config';
import type { ContentCategory as SharedContentCategory } from '@/src/lib/schemas/shared.schema';

/**
 * Content categories supported by the event mapper
 * Extends shared ContentCategory to include aliases (mcp-servers)
 */
export type ContentCategory = SharedContentCategory | 'mcp-servers';

/**
 * Action types for event mapping
 */
export type EventAction =
  | 'content_view'
  | 'search'
  | 'copy_code'
  | 'copy_markdown'
  | 'download_markdown';

/**
 * ============================================
 * DYNAMIC EVENT MAPPING GENERATION
 * ============================================
 *
 * Builds event mappings from category registry using naming convention.
 * Convention: {ACTION}_{CATEGORY_UPPER} (e.g., CONTENT_VIEW_AGENT)
 */

/**
 * Convert category ID to event constant suffix
 * agents → AGENT, mcp → MCP, statuslines → STATUSLINE
 */
function categoryToEventSuffix(categoryId: string): string {
  // Special cases
  if (categoryId === 'statuslines') return 'STATUSLINE';
  if (categoryId === 'mcp') return 'MCP';

  // Remove trailing 's' for singular form
  const singular = categoryId.replace(/s$/, '');
  return singular.toUpperCase();
}

/**
 * Build event mappings dynamically from registry
 * Automatically handles all categories - zero manual maintenance
 */
function buildEventMappings(): Record<EventAction, Record<string, EventName>> {
  const categories = getAllCategoryIds();

  const contentViewMap: Record<string, EventName> = {};
  const searchMap: Record<string, EventName> = { global: EVENTS.SEARCH_GLOBAL };
  const copyCodeMap: Record<string, EventName> = {};
  const copyMarkdownMap: Record<string, EventName> = {};
  const downloadMarkdownMap: Record<string, EventName> = {};

  for (const categoryId of categories) {
    const suffix = categoryToEventSuffix(categoryId);

    // Build event constant names following convention
    const contentViewKey = `CONTENT_VIEW_${suffix}` as keyof typeof EVENTS;
    const searchKey = `SEARCH_${categoryId.toUpperCase()}` as keyof typeof EVENTS;
    const copyCodeKey = `COPY_CODE_${suffix}` as keyof typeof EVENTS;
    const copyMarkdownKey = `COPY_MARKDOWN_${suffix}` as keyof typeof EVENTS;
    const downloadMarkdownKey = `DOWNLOAD_MARKDOWN_${suffix}` as keyof typeof EVENTS;

    // Map to actual event constants if they exist
    if (contentViewKey in EVENTS) {
      contentViewMap[categoryId] = EVENTS[contentViewKey] as EventName;
      contentViewMap['mcp-servers'] = EVENTS[contentViewKey] as EventName; // Alias
    }

    if (searchKey in EVENTS) {
      searchMap[categoryId] = EVENTS[searchKey] as EventName;
      searchMap['mcp-servers'] = EVENTS[searchKey] as EventName; // Alias
    }

    if (copyCodeKey in EVENTS) {
      copyCodeMap[categoryId] = EVENTS[copyCodeKey] as EventName;
      copyCodeMap['mcp-servers'] = EVENTS[copyCodeKey] as EventName; // Alias
    }

    if (copyMarkdownKey in EVENTS) {
      copyMarkdownMap[categoryId] = EVENTS[copyMarkdownKey] as EventName;
      copyMarkdownMap['mcp-servers'] = EVENTS[copyMarkdownKey] as EventName; // Alias
    }

    if (downloadMarkdownKey in EVENTS) {
      downloadMarkdownMap[categoryId] = EVENTS[downloadMarkdownKey] as EventName;
      downloadMarkdownMap['mcp-servers'] = EVENTS[downloadMarkdownKey] as EventName; // Alias
    }
  }

  // Add guides event (not in main registry)
  searchMap.guides = EVENTS.SEARCH_GUIDES;
  copyCodeMap.guides = EVENTS.COPY_CODE_GUIDE;

  // Skills fallbacks (reuse similar events)
  if (!('skills' in contentViewMap)) contentViewMap.skills = EVENTS.CONTENT_VIEW_RULE;
  if (!('skills' in searchMap)) searchMap.skills = EVENTS.SEARCH_RULES;
  if (!('skills' in copyCodeMap)) copyCodeMap.skills = EVENTS.COPY_CODE_GUIDE;
  if (!('skills' in copyMarkdownMap)) copyMarkdownMap.skills = EVENTS.COPY_MARKDOWN_OTHER;
  if (!('skills' in downloadMarkdownMap))
    downloadMarkdownMap.skills = EVENTS.DOWNLOAD_MARKDOWN_OTHER;

  return {
    content_view: contentViewMap,
    search: searchMap,
    copy_code: copyCodeMap,
    copy_markdown: copyMarkdownMap,
    download_markdown: downloadMarkdownMap,
  };
}

/**
 * Event mapping configuration
 * Auto-generated from category registry - zero manual maintenance
 */
const EVENT_MAPPINGS: Record<EventAction, Record<string, EventName>> = buildEventMappings();

/**
 * Fallback events for when category is not found
 */
const FALLBACK_EVENTS: Record<EventAction, EventName> = {
  content_view: EVENTS.CONTENT_VIEW_AGENT, // Default to agent
  search: EVENTS.SEARCH_GLOBAL,
  copy_code: EVENTS.COPY_CODE_OTHER,
  copy_markdown: EVENTS.COPY_MARKDOWN_OTHER,
  download_markdown: EVENTS.DOWNLOAD_MARKDOWN_OTHER,
};

/**
 * Get event name for a specific action and content category
 *
 * @param action - The action type (view, search, copy, etc.)
 * @param category - The content category (agents, mcp, commands, etc.)
 * @returns The specific EventName for tracking
 *
 * @example
 * ```typescript
 * const event = getEventForCategory('copy_markdown', 'agents');
 * // Returns: EVENTS.COPY_MARKDOWN_AGENT
 *
 * const event = getEventForCategory('search', 'mcp');
 * // Returns: EVENTS.SEARCH_MCP
 *
 * const event = getEventForCategory('copy_code', 'unknown');
 * // Returns: EVENTS.COPY_CODE_OTHER (fallback)
 * ```
 */
export function getEventForCategory(action: EventAction, category: string): EventName {
  const actionMap = EVENT_MAPPINGS[action];

  if (!actionMap) {
    return FALLBACK_EVENTS[action] || EVENTS.SEARCH_GLOBAL;
  }

  return actionMap[category] || FALLBACK_EVENTS[action];
}

/**
 * Get content view event for a specific category
 * Convenience wrapper for getEventForCategory with 'content_view' action
 *
 * @param category - The content category
 * @returns The specific content view EventName
 *
 * @example
 * ```typescript
 * const event = getContentViewEvent('agents');
 * // Returns: EVENTS.CONTENT_VIEW_AGENT
 * ```
 */
export function getContentViewEvent(category: string): EventName {
  return getEventForCategory('content_view', category);
}

/**
 * Get search event for a specific category
 * Convenience wrapper for getEventForCategory with 'search' action
 *
 * @param category - The content category
 * @returns The specific search EventName
 *
 * @example
 * ```typescript
 * const event = getSearchEvent('commands');
 * // Returns: EVENTS.SEARCH_COMMANDS
 * ```
 */
export function getSearchEvent(category: string): EventName {
  return getEventForCategory('search', category);
}

/**
 * Get copy code event for a specific category
 * Convenience wrapper for getEventForCategory with 'copy_code' action
 *
 * @param category - The content category
 * @returns The specific copy code EventName
 *
 * @example
 * ```typescript
 * const event = getCopyCodeEvent('rules');
 * // Returns: EVENTS.COPY_CODE_RULE
 * ```
 */
export function getCopyCodeEvent(category: string): EventName {
  return getEventForCategory('copy_code', category);
}

/**
 * Get copy markdown event for a specific category
 * Convenience wrapper for getEventForCategory with 'copy_markdown' action
 *
 * @param category - The content category
 * @returns The specific copy markdown EventName
 *
 * @example
 * ```typescript
 * const event = getCopyMarkdownEvent('hooks');
 * // Returns: EVENTS.COPY_MARKDOWN_HOOK
 * ```
 */
export function getCopyMarkdownEvent(category: string): EventName {
  return getEventForCategory('copy_markdown', category);
}

/**
 * Get download markdown event for a specific category
 * Convenience wrapper for getEventForCategory with 'download_markdown' action
 *
 * @param category - The content category
 * @returns The specific download markdown EventName
 *
 * @example
 * ```typescript
 * const event = getDownloadMarkdownEvent('statuslines');
 * // Returns: EVENTS.DOWNLOAD_MARKDOWN_STATUSLINE
 * ```
 */
export function getDownloadMarkdownEvent(category: string): EventName {
  return getEventForCategory('download_markdown', category);
}

/**
 * Check if a category is valid for a given action
 *
 * @param action - The action type
 * @param category - The content category to validate
 * @returns True if the category is valid for this action
 *
 * @example
 * ```typescript
 * isValidCategory('search', 'agents'); // true
 * isValidCategory('search', 'invalid'); // false
 * ```
 */
export function isValidCategory(action: EventAction, category: string): boolean {
  const actionMap = EVENT_MAPPINGS[action];
  return actionMap ? category in actionMap : false;
}

/**
 * Get all valid categories for a specific action
 *
 * @param action - The action type
 * @returns Array of valid category strings
 *
 * @example
 * ```typescript
 * getValidCategories('copy_code');
 * // Returns: ['agents', 'mcp', 'mcp-servers', 'commands', 'rules', 'hooks', 'statuslines', 'guides']
 * ```
 */
export function getValidCategories(action: EventAction): string[] {
  const actionMap = EVENT_MAPPINGS[action];
  return actionMap ? Object.keys(actionMap) : [];
}
