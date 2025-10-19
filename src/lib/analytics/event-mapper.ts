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

import { EVENTS, type EventName } from '@/src/lib/analytics/events.constants';
import { UNIFIED_CATEGORY_REGISTRY } from '@/src/lib/config/category-config';
import type { CategoryId } from '@/src/lib/config/category-types';

/**
 * Normalize category aliases to official CategoryId
 * Handles backward compatibility for deprecated aliases
 *
 * @param category - Category ID or alias (e.g., 'mcp-servers')
 * @returns Official CategoryId from UNIFIED_CATEGORY_REGISTRY
 */
function normalizeCategoryId(category: string): CategoryId | null {
  // Handle backward compatibility alias
  if (category === 'mcp-servers') return 'mcp';

  // Validate against official registry
  if (category in UNIFIED_CATEGORY_REGISTRY) {
    return category as CategoryId;
  }

  return null;
}

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
 * STATIC EVENTS IMPORT
 * ============================================
 *
 * EVENTS is now statically imported at top level.
 * This works in Storybook because event-mapper is mocked via subpath imports.
 * The mock file never imports EVENTS, so no circular dependency occurs.
 */

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
 * Build event mappings dynamically from category registry
 * Automatically handles all categories - zero manual maintenance
 * Derives from UNIFIED_CATEGORY_REGISTRY (single source of truth)
 */
function buildEventMappings(): Record<EventAction, Record<string, EventName>> {
  const categories = Object.keys(UNIFIED_CATEGORY_REGISTRY);

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
    }

    if (searchKey in EVENTS) {
      searchMap[categoryId] = EVENTS[searchKey] as EventName;
    }

    if (copyCodeKey in EVENTS) {
      copyCodeMap[categoryId] = EVENTS[copyCodeKey] as EventName;
    }

    if (copyMarkdownKey in EVENTS) {
      copyMarkdownMap[categoryId] = EVENTS[copyMarkdownKey] as EventName;
    }

    if (downloadMarkdownKey in EVENTS) {
      downloadMarkdownMap[categoryId] = EVENTS[downloadMarkdownKey] as EventName;
    }
  }

  // Add guides events (not in main registry)
  searchMap.guides = EVENTS.SEARCH_GUIDES;
  copyCodeMap.guides = EVENTS.COPY_CODE_GUIDE;
  copyMarkdownMap.guides = EVENTS.COPY_MARKDOWN_GUIDE;
  downloadMarkdownMap.guides = EVENTS.DOWNLOAD_MARKDOWN_GUIDE;

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
 * Lazy-loaded to avoid module initialization errors in Storybook
 * Auto-generated from category schema - zero manual maintenance
 */
let EVENT_MAPPINGS: Record<EventAction, Record<string, EventName>> | null = null;

function getEventMappings(): Record<EventAction, Record<string, EventName>> {
  if (!EVENT_MAPPINGS) {
    EVENT_MAPPINGS = buildEventMappings();
  }
  return EVENT_MAPPINGS;
}

/**
 * Fallback events for when category is not found
 * Lazy-loaded to avoid circular dependency with EVENTS in Storybook
 */
let FALLBACK_EVENTS: Record<EventAction, EventName> | null = null;

function getFallbackEvents(): Record<EventAction, EventName> {
  if (!FALLBACK_EVENTS) {
    FALLBACK_EVENTS = {
      content_view: EVENTS.CONTENT_VIEW_AGENT,
      search: EVENTS.SEARCH_GLOBAL,
      copy_code: EVENTS.COPY_CODE_AGENT,
      copy_markdown: EVENTS.COPY_MARKDOWN_AGENT,
      download_markdown: EVENTS.DOWNLOAD_MARKDOWN_AGENT,
    };
  }
  return FALLBACK_EVENTS;
}

/**
 * Get event name for a specific action and content category
 *
 * @param action - The action type (view, search, copy, etc.)
 * @param category - The content category (agents, mcp, commands, etc.) or alias (mcp-servers)
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
 * const event = getEventForCategory('search', 'mcp-servers');
 * // Returns: EVENTS.SEARCH_MCP (normalized)
 *
 * const event = getEventForCategory('copy_code', 'unknown');
 * // Returns: EVENTS.COPY_CODE_AGENT (fallback)
 * ```
 */
export function getEventForCategory(action: EventAction, category: string): EventName {
  const mappings = getEventMappings();
  const fallbacks = getFallbackEvents();
  const actionMap = mappings[action];

  if (!actionMap) {
    return fallbacks[action] || EVENTS.SEARCH_GLOBAL;
  }

  // Normalize category (handles aliases like 'mcp-servers' → 'mcp')
  const normalizedCategory = normalizeCategoryId(category);
  const lookupCategory = normalizedCategory || category;

  return actionMap[lookupCategory] || fallbacks[action];
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
  const mappings = getEventMappings();
  const actionMap = mappings[action];
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
  const mappings = getEventMappings();
  const actionMap = mappings[action];
  return actionMap ? Object.keys(actionMap) : [];
}
