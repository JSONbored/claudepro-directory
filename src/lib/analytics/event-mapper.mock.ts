/**
 * Event Mapper Mock for Storybook
 *
 * Provides mock implementations of event mapping functions for Storybook.
 * Returns static event names without loading the actual EVENTS constants.
 * Completely standalone - NO imports from events.constants.ts to avoid circular deps.
 */

/**
 * Mock EventName type - string literal for Storybook
 */
type EventName = string;

/**
 * Action types for event mapping (duplicated from real event-mapper to avoid imports)
 */
export type EventAction =
  | 'content_view'
  | 'search'
  | 'copy_code'
  | 'copy_markdown'
  | 'download_markdown';

/**
 * Content categories (duplicated from real event-mapper to avoid imports)
 */
export type CategoryId =
  | 'agents'
  | 'mcp'
  | 'mcp-servers'
  | 'commands'
  | 'rules'
  | 'hooks'
  | 'statuslines'
  | 'skills'
  | 'collections';

/**
 * Mock event names for Storybook
 */
const MOCK_EVENTS = {
  CONTENT_VIEW_AGENT: 'content_view_agent',
  SEARCH_GLOBAL: 'search_global',
  COPY_CODE_AGENT: 'copy_code_agent',
  COPY_MARKDOWN_AGENT: 'copy_markdown_agent',
  DOWNLOAD_MARKDOWN_AGENT: 'download_markdown_agent',
} as const;

export function getEventForCategory(_action: EventAction, _category: string): EventName {
  return MOCK_EVENTS.CONTENT_VIEW_AGENT;
}

export function getContentViewEvent(_category: string): EventName {
  return MOCK_EVENTS.CONTENT_VIEW_AGENT;
}

export function getSearchEvent(_category: string): EventName {
  return MOCK_EVENTS.SEARCH_GLOBAL;
}

export function getCopyCodeEvent(_category: string): EventName {
  return MOCK_EVENTS.COPY_CODE_AGENT;
}

export function getCopyMarkdownEvent(_category: string): EventName {
  return MOCK_EVENTS.COPY_MARKDOWN_AGENT;
}

export function getDownloadMarkdownEvent(_category: string): EventName {
  return MOCK_EVENTS.DOWNLOAD_MARKDOWN_AGENT;
}

export function isValidCategory(_action: EventAction, _category: string): boolean {
  return true;
}

export function getValidCategories(_action: EventAction): string[] {
  return ['agents', 'mcp', 'commands', 'rules', 'hooks', 'statuslines', 'guides'];
}
