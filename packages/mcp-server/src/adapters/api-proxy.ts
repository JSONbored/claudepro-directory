/**
 * API Proxy Adapter
 *
 * Proxies MCP tool calls to existing API routes instead of direct database access.
 * This allows the self-hosted MCP server to work without requiring database credentials.
 *
 * All requests are proxied to: https://claudepro.directory/api/*
 */

/**
 * API proxy configuration
 */
export interface ApiProxyConfig {
  /**
   * Base URL for API routes (default: https://claudepro.directory)
   */
  apiBaseUrl?: string;

  /**
   * Optional API key for authentication
   */
  apiKey?: string;

  /**
   * Request timeout in milliseconds (default: 30000)
   */
  timeout?: number;
}

/**
 * Default API proxy configuration
 */
const DEFAULT_CONFIG: Required<Omit<ApiProxyConfig, 'apiKey'>> = {
  apiBaseUrl: 'https://claudepro.directory',
  timeout: 30000,
};

/**
 * Proxy a request to an API route
 *
 * @param path - API route path (e.g., '/api/search')
 * @param options - Request options (method, body, headers)
 * @param config - API proxy configuration
 * @returns Response from API route
 */
export async function proxyToApi(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {},
  config: ApiProxyConfig = {}
): Promise<Response> {
  const { apiBaseUrl, apiKey, timeout } = { ...DEFAULT_CONFIG, ...config };

  // Build full URL
  const url = `${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  // Build fetch options
  const fetchOptions: RequestInit = {
    method: options.method || 'GET',
    headers,
    signal: AbortSignal.timeout(timeout),
  };

  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  // Make request
  try {
    const response = await fetch(url, fetchOptions);
    return response;
  } catch (error) {
    // Handle timeout or network errors
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`API request timed out after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * Map MCP tool name to API route
 *
 * @param toolName - MCP tool name
 * @returns API route path
 */
export function mapToolToApiRoute(toolName: string): string {
  const routeMap: Record<string, string> = {
    searchContent: '/api/search',
    getContentDetail: '/api/content',
    getTrending: '/api/trending',
    getFeatured: '/api/content/featured',
    getPopular: '/api/content/popular',
    getRecent: '/api/content/recent',
    listCategories: '/api/categories',
    getCategoryConfigs: '/api/categories/configs',
    getTemplates: '/api/templates',
    getMcpServers: '/api/mcp-servers',
    getRelatedContent: '/api/content/related',
    getContentByTag: '/api/content/tags',
    getSearchFacets: '/api/search/facets',
    getSearchSuggestions: '/api/search/suggestions',
    getSocialProofStats: '/api/stats',
    getChangelog: '/api/changelog',
    // Tools that require special handling
    downloadContentForPlatform: '/api/content/download',
    submitContent: '/api/content/submit',
    createAccount: '/api/auth/create',
    subscribeNewsletter: '/api/newsletter/subscribe',
  };

  return routeMap[toolName] || `/api/${toolName}`;
}

/**
 * Convert MCP tool input to API request body
 *
 * @param toolName - MCP tool name
 * @param input - MCP tool input
 * @returns API request body
 */
export function convertToolInputToApiBody(_toolName: string, input: unknown): unknown {
  // Most tools can pass input directly
  // Some tools may need transformation
  // toolName parameter reserved for future tool-specific transformations
  return input;
}

/**
 * Convert API response to MCP tool output
 *
 * @param toolName - MCP tool name
 * @param response - API response
 * @returns MCP tool output
 */
export async function convertApiResponseToToolOutput(
  _toolName: string,
  response: Response
): Promise<unknown> {
  // toolName parameter reserved for future tool-specific response transformations
  if (!response.ok) {
    const error = (await response.json().catch(() => ({ error: 'Unknown error' }))) as {
      error?: string;
    };
    throw new Error(`API request failed: ${error.error || response.statusText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Execute MCP tool via API proxy
 *
 * @param toolName - MCP tool name
 * @param input - Tool input
 * @param config - API proxy configuration
 * @returns Tool output
 */
export async function executeToolViaApi(
  toolName: string,
  input: unknown,
  config: ApiProxyConfig = {}
): Promise<unknown> {
  // Map tool to API route
  const apiPath = mapToolToApiRoute(toolName);

  // Convert input to API body
  const apiBody = convertToolInputToApiBody(toolName, input);

  // Proxy request
  const response = await proxyToApi(
    apiPath,
    {
      method: 'POST',
      body: apiBody,
    },
    config
  );

  // Convert response to tool output
  return convertApiResponseToToolOutput(toolName, response);
}
