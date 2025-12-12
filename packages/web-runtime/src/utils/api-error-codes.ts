/**
 * Standardized API Error Codes
 * 
 * Provides consistent error codes for API responses to enable better client-side error handling.
 * 
 * @module web-runtime/utils/api-error-codes
 */

/**
 * Standard error codes for API responses
 */
export enum ApiErrorCode {
  // Validation Errors (400)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_PARAMETER = 'INVALID_PARAMETER',
  INVALID_CATEGORY = 'INVALID_CATEGORY',
  INVALID_SLUG = 'INVALID_SLUG',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // Not Found Errors (404)
  NOT_FOUND = 'NOT_FOUND',
  CONTENT_NOT_FOUND = 'CONTENT_NOT_FOUND',
  COMPANY_NOT_FOUND = 'COMPANY_NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  
  // Authentication Errors (401)
  UNAUTHORIZED = 'UNAUTHORIZED',
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  INVALID_SECRET = 'INVALID_SECRET',
  
  // Rate Limiting (429)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Server Errors (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  
  // Service Unavailable (503)
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

/**
 * Map HTTP status codes to default error codes
 */
export const STATUS_TO_ERROR_CODE: Record<number, ApiErrorCode> = {
  400: ApiErrorCode.VALIDATION_ERROR,
  401: ApiErrorCode.UNAUTHORIZED,
  404: ApiErrorCode.NOT_FOUND,
  429: ApiErrorCode.RATE_LIMIT_EXCEEDED,
  500: ApiErrorCode.INTERNAL_ERROR,
  503: ApiErrorCode.SERVICE_UNAVAILABLE,
};

/**
 * Determine error code from error type and context
 */
export function determineErrorCode(
  error: unknown,
  statusCode: number = 500
): ApiErrorCode {
  // Use status code mapping if available
  if (statusCode in STATUS_TO_ERROR_CODE) {
    const mappedCode = STATUS_TO_ERROR_CODE[statusCode];
    if (mappedCode) {
      return mappedCode;
    }
  }
  
  // Check error message for specific patterns
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('not found') || message.includes('does not exist')) {
      return ApiErrorCode.NOT_FOUND;
    }
    
    if (message.includes('unauthorized') || message.includes('authentication')) {
      return ApiErrorCode.UNAUTHORIZED;
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return ApiErrorCode.VALIDATION_ERROR;
    }
    
    if (message.includes('rate limit')) {
      return ApiErrorCode.RATE_LIMIT_EXCEEDED;
    }
  }
  
  // Default based on status code
  return statusCode >= 500
    ? ApiErrorCode.INTERNAL_ERROR
    : statusCode === 404
    ? ApiErrorCode.NOT_FOUND
    : ApiErrorCode.VALIDATION_ERROR;
}
