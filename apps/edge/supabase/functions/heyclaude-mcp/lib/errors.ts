/**
 * Structured Error Codes and Error Handling
 *
 * Provides standardized error codes, messages, and error response formatting
 * for consistent error handling across all MCP tools.
 */

/**
 * Error codes for different error types
 */
export enum McpErrorCode {
  // Authentication & Authorization
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  TOKEN_AUDIENCE_MISMATCH = 'TOKEN_AUDIENCE_MISMATCH',
  AUTHORIZATION_FAILED = 'AUTHORIZATION_FAILED',

  // Content Not Found
  CONTENT_NOT_FOUND = 'CONTENT_NOT_FOUND',
  CATEGORY_NOT_FOUND = 'CATEGORY_NOT_FOUND',
  SLUG_NOT_FOUND = 'SLUG_NOT_FOUND',

  // Validation Errors
  INVALID_INPUT = 'INVALID_INPUT',
  INVALID_CATEGORY = 'INVALID_CATEGORY',
  INVALID_SLUG = 'INVALID_SLUG',
  INVALID_EMAIL = 'INVALID_EMAIL',
  INVALID_PROVIDER = 'INVALID_PROVIDER',
  INVALID_SUBMISSION_TYPE = 'INVALID_SUBMISSION_TYPE',
  INVALID_PLATFORM = 'INVALID_PLATFORM',
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_URI = 'INVALID_URI',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // External Service Errors
  INNGEST_ERROR = 'INNGEST_ERROR',
  API_ROUTE_ERROR = 'API_ROUTE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',

  // Timeout Errors
  REQUEST_TIMEOUT = 'REQUEST_TIMEOUT',
  OPERATION_TIMEOUT = 'OPERATION_TIMEOUT',

  // Server Errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

/**
 * User-friendly error messages
 */
export const ERROR_MESSAGES: Record<McpErrorCode, string> = {
  AUTHENTICATION_REQUIRED: 'Authentication required. Please provide a valid JWT token in the Authorization header.',
  TOKEN_INVALID: 'Invalid or expired authentication token.',
  TOKEN_AUDIENCE_MISMATCH: 'Token audience mismatch. Token was not issued for this resource.',
  AUTHORIZATION_FAILED: 'Authorization failed. You do not have permission to perform this action.',

  CONTENT_NOT_FOUND: 'The requested content item was not found.',
  CATEGORY_NOT_FOUND: 'The specified category does not exist.',
  SLUG_NOT_FOUND: 'The specified content slug does not exist in this category.',

  INVALID_INPUT: 'Invalid input provided. Please check your request parameters.',
  INVALID_CATEGORY: 'Invalid category specified. Please use a valid category name.',
  INVALID_SLUG: 'Invalid slug format. Slugs must be alphanumeric with hyphens.',
  INVALID_EMAIL: 'Invalid email address format.',
  INVALID_PROVIDER: 'Invalid OAuth provider. Supported providers: GitHub, Google, Discord.',
  INVALID_SUBMISSION_TYPE: 'Invalid submission type. Please use a valid submission type.',
  INVALID_PLATFORM: 'Invalid platform specified. Supported platforms: claude-code, cursor, chatgpt-codex, generic.',
  INVALID_FORMAT: 'Invalid format specified. Please use a supported format.',
  INVALID_URI: 'Invalid resource URI format.',

  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please try again later.',

  INNGEST_ERROR: 'Failed to process newsletter subscription. Please try again later.',
  API_ROUTE_ERROR: 'Failed to fetch content from API. Please try again later.',
  DATABASE_ERROR: 'Database operation failed. Please try again later.',

  REQUEST_TIMEOUT: 'Request timed out. The operation took too long to complete.',
  OPERATION_TIMEOUT: 'Operation timed out. Please try again with a simpler request.',

  INTERNAL_ERROR: 'An internal server error occurred. Please try again later.',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable. Please try again later.',
};

/**
 * Error recovery suggestions with actionable steps
 */
export const ERROR_RECOVERY: Partial<Record<McpErrorCode, string[]>> = {
  CONTENT_NOT_FOUND: [
    'Try searching for similar content with searchContent tool',
    'Check if the category is correct with listCategories tool',
    'Use getRecent to see recently added content',
    'Try getTrending to see popular content',
  ],
  CATEGORY_NOT_FOUND: [
    'Use listCategories tool to see available categories',
    'Check the category name spelling',
  ],
  SLUG_NOT_FOUND: [
    'Verify the slug is correct',
    'Search for the content by name using searchContent',
    'Check the category with listCategories',
  ],
  INVALID_CATEGORY: [
    'Use listCategories tool to see valid category names',
    'Check the category spelling',
  ],
  INVALID_SLUG: [
    'Slugs must be alphanumeric with hyphens, underscores, or dots',
    'Check the slug format and try again',
  ],
  INVALID_EMAIL: [
    'Ensure the email address is properly formatted (e.g., user@example.com)',
    'Check for typos in the email address',
  ],
  INVALID_PROVIDER: [
    'Use one of the supported providers: github, google, or discord',
    'Check the provider name spelling',
  ],
  INVALID_PLATFORM: [
    'Supported platforms: claude-code, cursor, chatgpt-codex, generic',
    'Check the platform name spelling',
  ],
  INVALID_FORMAT: [
    'Check the format parameter',
    'Use a supported format for the requested resource',
  ],
  RATE_LIMIT_EXCEEDED: [
    'Wait a moment before making another request',
    'Reduce the frequency of requests',
  ],
  REQUEST_TIMEOUT: [
    'Try breaking your request into smaller parts',
    'Use more specific filters to reduce result size',
    'Try again with a simpler query',
  ],
  API_ROUTE_ERROR: [
    'The content may be temporarily unavailable',
    'Try again in a few moments',
    'Check if the resource URI is correct',
  ],
  DATABASE_ERROR: [
    'The database may be temporarily unavailable',
    'Try again in a few moments',
  ],
};

/**
 * Structured error response
 */
export interface McpErrorResponse {
  code: McpErrorCode;
  message: string;
  details?: string;
  recovery?: string; // Can be string or array joined with ' | '
  suggestions?: string[]; // Actionable suggestions for fixing the error
  requestId?: string;
}

/**
 * Create a structured error response with actionable suggestions
 */
export function createErrorResponse(
  code: McpErrorCode | string,
  details?: string,
  requestId?: string
): McpErrorResponse {
  // Handle string error codes (for backward compatibility)
  const errorCode = typeof code === 'string' 
    ? (Object.values(McpErrorCode).includes(code as McpErrorCode) ? code as McpErrorCode : McpErrorCode.INTERNAL_ERROR)
    : code;

  const response: McpErrorResponse = {
    code: errorCode,
    message: ERROR_MESSAGES[errorCode] || 'An error occurred',
  };

  if (details) {
    response.details = details;
  }

  // Include recovery suggestions (now an array)
  const recovery = ERROR_RECOVERY[errorCode];
  if (recovery) {
    if (Array.isArray(recovery)) {
      response.recovery = recovery.join(' | ');
      response.suggestions = recovery; // Also include as array for structured access
    } else {
      response.recovery = recovery;
    }
  }

  if (requestId) {
    response.requestId = requestId;
  }

  return response;
}

/**
 * Convert error to MCP error response
 */
export function errorToMcpError(
  error: unknown,
  defaultCode: McpErrorCode = McpErrorCode.INTERNAL_ERROR,
  requestId?: string
): McpErrorResponse {
  if (error instanceof Error) {
    // Check for specific error patterns
    if (error.message.includes('not found') || error.message.includes('does not exist')) {
      return createErrorResponse(McpErrorCode.CONTENT_NOT_FOUND, error.message, requestId);
    }
    if (error.message.includes('invalid') || error.message.includes('Invalid')) {
      return createErrorResponse(McpErrorCode.INVALID_INPUT, error.message, requestId);
    }
    if (error.message.includes('timeout') || error.message.includes('timed out')) {
      return createErrorResponse(McpErrorCode.REQUEST_TIMEOUT, error.message, requestId);
    }
    if (error.message.includes('rate limit')) {
      return createErrorResponse(McpErrorCode.RATE_LIMIT_EXCEEDED, error.message, requestId);
    }

    return createErrorResponse(defaultCode, error.message, requestId);
  }

  return createErrorResponse(defaultCode, 'An unknown error occurred', requestId);
}
