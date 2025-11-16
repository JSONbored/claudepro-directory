/**
 * Safe JSON body parsing utility
 * Validates body size, parses JSON, and provides type-safe results
 */

import { errorToString } from './error-handling.ts';
import { badRequestResponse, publicCorsHeaders } from './http.ts';
import { MAX_BODY_SIZE, validateBodySize } from './input-validation.ts';
import { createUtilityContext } from './logging.ts';

export interface ParseJsonBodyOptions {
  maxSize?: number;
  cors?: typeof publicCorsHeaders;
  required?: boolean;
}

export interface ParseJsonBodyResult<T> {
  success: true;
  data: T;
}

export interface ParseJsonBodyError {
  success: false;
  response: Response;
}

export type ParseJsonBodyReturn<T> = ParseJsonBodyResult<T> | ParseJsonBodyError;

/**
 * Safely parse JSON request body with size validation
 * @param req - Request object
 * @param options - Parsing options
 * @returns Parsed data or error response
 */
export async function parseJsonBody<T = unknown>(
  req: Request,
  options: ParseJsonBodyOptions = {}
): Promise<ParseJsonBodyReturn<T>> {
  const { maxSize = MAX_BODY_SIZE.default, cors = publicCorsHeaders, required = true } = options;

  // Validate body size before reading
  const contentLength = req.headers.get('content-length');
  const bodySizeValidation = validateBodySize(contentLength, maxSize);
  if (!bodySizeValidation.valid) {
    const logContext = createUtilityContext('parse-json-body', 'body-size-validation-failed', {
      content_length: contentLength,
      max_size: maxSize,
    });
    console.warn('[parse-json-body] Request body size validation failed', {
      ...logContext,
      error: bodySizeValidation.error,
    });
    return {
      success: false,
      response: badRequestResponse(bodySizeValidation.error ?? 'Request body too large', cors),
    };
  }

  // Parse JSON body
  let bodyText: string;
  try {
    bodyText = await req.text();
  } catch (error) {
    const logContext = createUtilityContext('parse-json-body', 'read-body-failed');
    console.error('[parse-json-body] Failed to read request body', {
      ...logContext,
      error: errorToString(error),
    });
    return {
      success: false,
      response: badRequestResponse('Failed to read request body', cors),
    };
  }

  // Double-check size after reading (in case Content-Length was missing/wrong)
  if (bodyText.length > maxSize) {
    const logContext = createUtilityContext('parse-json-body', 'body-size-exceeded', {
      body_size: bodyText.length,
      max_size: maxSize,
    });
    console.warn('[parse-json-body] Request body size exceeded after reading', logContext);
    return {
      success: false,
      response: badRequestResponse(`Request body too large (max ${maxSize} bytes)`, cors),
    };
  }

  // Validate non-empty body if required
  if (required && bodyText.trim().length === 0) {
    return {
      success: false,
      response: badRequestResponse('Request body is required', cors),
    };
  }

  // Parse JSON
  let data: unknown;
  try {
    data = JSON.parse(bodyText);
  } catch (error) {
    const logContext = createUtilityContext('parse-json-body', 'json-parse-failed', {
      body_preview: bodyText.slice(0, 100),
    });
    console.error('[parse-json-body] JSON parse failed', {
      ...logContext,
      error: errorToString(error),
    });
    return {
      success: false,
      response: badRequestResponse('Invalid JSON body', cors),
    };
  }

  // Validate parsed data is an object (if required)
  if (required && (data === null || typeof data !== 'object' || Array.isArray(data))) {
    return {
      success: false,
      response: badRequestResponse('Valid JSON object is required', cors),
    };
  }

  return {
    success: true,
    data: data as T,
  };
}
