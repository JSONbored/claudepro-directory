/**
 * Centralized Event Mapper Utility
 *
 * Maps content categories to their specific analytics event names.
 * Eliminates duplicate mapping logic across components.
 *
 * October 2025 Production Standards:
 * - Type-safe with branded EventName types
 * - Centralized single source of truth
 * - Validated category mappings
 * - Fallback to generic events
 * - Zero runtime errors with exhaustive checks
 *
 * @module lib/analytics/event-mapper
 */

import type { EventName } from '@/src/lib/analytics/events.config';
import { EVENTS } from '@/src/lib/analytics/events.config';

/**
 * Content categories supported by the event mapper
 */
export type ContentCategory =
  | 'agents'
  | 'mcp'
  | 'mcp-servers'
  | 'commands'
  | 'rules'
  | 'hooks'
  | 'statuslines'
  | 'collections'
  | 'guides';

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
 * Event mapping configuration
 * Maps action + category to specific event name
 */
const EVENT_MAPPINGS: Record<EventAction, Record<string, EventName>> = {
  content_view: {
    agents: EVENTS.CONTENT_VIEW_AGENT,
    mcp: EVENTS.CONTENT_VIEW_MCP,
    'mcp-servers': EVENTS.CONTENT_VIEW_MCP,
    commands: EVENTS.CONTENT_VIEW_COMMAND,
    rules: EVENTS.CONTENT_VIEW_RULE,
    hooks: EVENTS.CONTENT_VIEW_HOOK,
    statuslines: EVENTS.CONTENT_VIEW_STATUSLINE,
    collections: EVENTS.CONTENT_VIEW_COLLECTION,
  },
  search: {
    global: EVENTS.SEARCH_GLOBAL,
    agents: EVENTS.SEARCH_AGENTS,
    mcp: EVENTS.SEARCH_MCP,
    'mcp-servers': EVENTS.SEARCH_MCP,
    commands: EVENTS.SEARCH_COMMANDS,
    rules: EVENTS.SEARCH_RULES,
    hooks: EVENTS.SEARCH_HOOKS,
    statuslines: EVENTS.SEARCH_STATUSLINES,
    collections: EVENTS.SEARCH_COLLECTIONS,
    guides: EVENTS.SEARCH_GUIDES,
  },
  copy_code: {
    agents: EVENTS.COPY_CODE_AGENT,
    mcp: EVENTS.COPY_CODE_MCP,
    'mcp-servers': EVENTS.COPY_CODE_MCP,
    commands: EVENTS.COPY_CODE_COMMAND,
    rules: EVENTS.COPY_CODE_RULE,
    hooks: EVENTS.COPY_CODE_HOOK,
    statuslines: EVENTS.COPY_CODE_STATUSLINE,
    guides: EVENTS.COPY_CODE_GUIDE,
  },
  copy_markdown: {
    agents: EVENTS.COPY_MARKDOWN_AGENT,
    mcp: EVENTS.COPY_MARKDOWN_MCP,
    'mcp-servers': EVENTS.COPY_MARKDOWN_MCP,
    commands: EVENTS.COPY_MARKDOWN_COMMAND,
    rules: EVENTS.COPY_MARKDOWN_RULE,
    hooks: EVENTS.COPY_MARKDOWN_HOOK,
    statuslines: EVENTS.COPY_MARKDOWN_STATUSLINE,
    collections: EVENTS.COPY_MARKDOWN_COLLECTION,
  },
  download_markdown: {
    agents: EVENTS.DOWNLOAD_MARKDOWN_AGENT,
    mcp: EVENTS.DOWNLOAD_MARKDOWN_MCP,
    'mcp-servers': EVENTS.DOWNLOAD_MARKDOWN_MCP,
    commands: EVENTS.DOWNLOAD_MARKDOWN_COMMAND,
    rules: EVENTS.DOWNLOAD_MARKDOWN_RULE,
    hooks: EVENTS.DOWNLOAD_MARKDOWN_HOOK,
    statuslines: EVENTS.DOWNLOAD_MARKDOWN_STATUSLINE,
    collections: EVENTS.DOWNLOAD_MARKDOWN_COLLECTION,
  },
};

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
