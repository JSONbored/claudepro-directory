/**
 * Test Helpers for API Route Unit Tests
 *
 * Provides utilities for testing Next.js API routes created with createApiRoute factory.
 * These helpers mock NextRequest and provide convenient test utilities.
 */

import { NextRequest, NextResponse } from 'next/server';
import { expect } from '@jest/globals';

/**
 * Creates a mock NextRequest for testing API routes
 *
 * @param options - Request configuration
 * @param options.method
 * @param options.url
 * @param options.query
 * @param options.body
 * @param options.headers
 * @returns Mocked NextRequest
 */
export function createMockRequest(options: {
  body?: unknown;
  headers?: Record<string, string>;
  method?: string;
  query?: Record<string, string>;
  url?: string;
}): NextRequest {
  const {
    body,
    headers = {},
    method = 'GET',
    query = {},
    url = 'http://localhost:3000/api/test',
  } = options;

  // Build URL with query parameters
  const urlWithQuery = new URL(url);
  for (const [key, value] of Object.entries(query)) {
    urlWithQuery.searchParams.set(key, value);
  }

  // Create mock NextRequest
  // Build request options conditionally to avoid type issues with RequestInit
  // With exactOptionalPropertyTypes, we can't include body: undefined
  const baseOptions = {
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    method,
  } as const;

  // Only include body if it's defined
  return body === undefined
    ? new NextRequest(urlWithQuery.toString(), baseOptions)
    : new NextRequest(urlWithQuery.toString(), {
        ...baseOptions,
        body: typeof body === 'string' ? body : JSON.stringify(body),
      });
}

/**
 * Extracts JSON response body from NextResponse
 *
 * @param response - NextResponse from route handler
 * @returns Parsed JSON response
 */
export async function getResponseBody(response: NextResponse): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Asserts response status code
 *
 * @param response - NextResponse
 * @param expectedStatus - Expected status code
 */
export function expectStatus(response: NextResponse, expectedStatus: number): void {
  expect(response.status).toBe(expectedStatus);
}

/**
 * Asserts response has CORS headers
 *
 * @param response - NextResponse
 */
export function expectCorsHeaders(response: NextResponse): void {
  const headers = response.headers;
  expect(headers.get('access-control-allow-origin')).toBeTruthy();
}

/**
 * Asserts response has cache headers
 *
 * @param response - NextResponse
 * @param optional - If true, doesn't fail if cache headers are missing (for test environments)
 */
export function expectCacheHeaders(response: NextResponse, optional = false): void {
  const headers = response.headers;
  const cacheControl = headers.get('cache-control');
  if (optional && !cacheControl) {
    // In test environments, cache headers may not be set by Next.js Cache Components
    return;
  }
  expect(cacheControl).toBeTruthy();
  if (cacheControl) {
    expect(cacheControl).toContain('public');
  }
}

/**
 * Asserts response has error structure
 *
 * @param body - Response body
 */
export function expectErrorResponse(body: unknown): void {
  expect(body).toHaveProperty('error');
  if (typeof body === 'object' && body !== null) {
    const errorBody = body as { error: string; message?: string };
    expect(typeof errorBody.error).toBe('string');
  }
}

/**
 * Asserts response has success structure
 *
 * @param body - Response body
 */
export function expectSuccessResponse(body: unknown): void {
  expect(body).not.toHaveProperty('error');
}
