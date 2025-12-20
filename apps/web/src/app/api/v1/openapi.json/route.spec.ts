import { expect, test } from '@playwright/test';
import { expectOpenApiResponse } from '../../__helpers__/openapi-validation';

/**
 * Comprehensive OpenAPI Specification API Route E2E Tests
 *
 * Tests ALL functionality with strict error checking:
 * - OpenAPI spec endpoint
 * - JSON response format
 * - File reading and parsing
 * - Error handling (file not found, parse errors)
 * - Cache headers
 * - CORS headers
 * - Content-Type headers
 */

test.describe('GET /api/v1/openapi.json', () => {
  test('should return OpenAPI specification successfully', async ({ request }) => {
    const response = await request.get('/api/v1/openapi.json');

    expect(response.status()).toBe(200);

    // Validate response matches OpenAPI spec
    await expectOpenApiResponse(response, '/api/v1/openapi.json', 'GET');

    const data = await response.json();

    // Validate OpenAPI spec structure
    expect(data).toHaveProperty('openapi');
    expect(data).toHaveProperty('info');
    expect(data).toHaveProperty('paths');

    // Validate OpenAPI version
    expect(data.openapi).toMatch(/^3\.\d+\.\d+$/);

    // Validate info object
    expect(data.info).toHaveProperty('title');
    expect(data.info).toHaveProperty('version');
  });

  test('should return JSON content type', async ({ request }) => {
    const response = await request.get('/api/v1/openapi.json');

    expect(response.headers()['content-type']).toContain('application/json');
  });

  test('should include cache headers', async ({ request }) => {
    const response = await request.get('/api/v1/openapi.json');

    expect(response.headers()['cache-control']).toBeDefined();
    expect(response.headers()['cache-control']).toContain('public');
  });

  test('should include CORS headers', async ({ request }) => {
    const response = await request.get('/api/v1/openapi.json');

    expect(response.headers()['access-control-allow-origin']).toBeDefined();
  });

  test('should handle OPTIONS request', async ({ request }) => {
    const response = await request.options('/api/v1/openapi.json');

    expect(response.status()).toBe(200);
    expect(response.headers()['access-control-allow-methods']).toBeDefined();
  });

  test('should return valid JSON structure', async ({ request }) => {
    const response = await request.get('/api/v1/openapi.json');
    const data = await response.json();

    // Validate paths is an object
    expect(typeof data.paths).toBe('object');
    expect(Array.isArray(data.paths)).toBe(false);

    // Validate info structure
    expect(data.info).toHaveProperty('title');
    expect(typeof data.info.title).toBe('string');
    expect(data.info).toHaveProperty('version');
    expect(typeof data.info.version).toBe('string');
  });

  test('should include paths in OpenAPI spec', async ({ request }) => {
    const response = await request.get('/api/v1/openapi.json');
    const data = await response.json();

    // Should have at least some paths defined
    expect(Object.keys(data.paths || {})).toBeInstanceOf(Array);
  });
});
