/**
 * Event Mapper Mock for Storybook
 *
 * Provides mock implementations of event mapping functions for Storybook.
 * Returns static event names without loading the actual EVENTS constants.
 * Completely standalone - NO imports from events.constants.ts to avoid circular deps.
 *
 * NOTE: This is a .js file (not .ts) to avoid TypeScript compilation issues in Storybook.
 */

/**
 * Mock event names for Storybook
 */
const MOCK_EVENTS = {
  CONTENT_VIEW_AGENT: 'content_view_agent',
  SEARCH_GLOBAL: 'search_global',
  COPY_CODE_AGENT: 'copy_code_agent',
  COPY_MARKDOWN_AGENT: 'copy_markdown_agent',
  DOWNLOAD_MARKDOWN_AGENT: 'download_markdown_agent',
};

/**
 * @param {string} _action
 * @param {string} _category
 * @returns {string}
 */
export function getEventForCategory(_action, _category) {
  return MOCK_EVENTS.CONTENT_VIEW_AGENT;
}

/**
 * @param {string} _category
 * @returns {string}
 */
export function getContentViewEvent(_category) {
  return MOCK_EVENTS.CONTENT_VIEW_AGENT;
}

/**
 * @param {string} _category
 * @returns {string}
 */
export function getSearchEvent(_category) {
  return MOCK_EVENTS.SEARCH_GLOBAL;
}

/**
 * @param {string} _category
 * @returns {string}
 */
export function getCopyCodeEvent(_category) {
  return MOCK_EVENTS.COPY_CODE_AGENT;
}

/**
 * @param {string} _category
 * @returns {string}
 */
export function getCopyMarkdownEvent(_category) {
  return MOCK_EVENTS.COPY_MARKDOWN_AGENT;
}

/**
 * @param {string} _category
 * @returns {string}
 */
export function getDownloadMarkdownEvent(_category) {
  return MOCK_EVENTS.DOWNLOAD_MARKDOWN_AGENT;
}

/**
 * @param {string} _action
 * @param {string} _category
 * @returns {boolean}
 */
export function isValidCategory(_action, _category) {
  return true;
}

/**
 * @param {string} _action
 * @returns {string[]}
 */
export function getValidCategories(_action) {
  // All 11 categories from UNIFIED_CATEGORY_REGISTRY
  return [
    'agents',
    'mcp',
    'commands',
    'rules',
    'hooks',
    'statuslines',
    'collections',
    'skills',
    'guides',
    'jobs',
    'changelog',
  ];
}
