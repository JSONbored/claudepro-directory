/**
 * OpenAPI Contract Testing Helper
 *
 * Validates API responses against the OpenAPI specification.
 * Used in Playwright tests to ensure API responses match the documented schema.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { APIResponse } from '@playwright/test';

const PROJECT_ROOT = process.cwd();
const OPENAPI_JSON_PATH = join(PROJECT_ROOT, 'openapi.json');

let openApiSpec: any = null;

/**
 * Load OpenAPI specification from file
 */
function loadOpenApiSpec(): any {
  if (openApiSpec) {
    return openApiSpec;
  }

  try {
    const specContent = readFileSync(OPENAPI_JSON_PATH, 'utf-8');
    openApiSpec = JSON.parse(specContent);
    return openApiSpec;
  } catch (error) {
    throw new Error(
      `Failed to load OpenAPI spec from ${OPENAPI_JSON_PATH}. Run: pnpm generate:openapi`
    );
  }
}

/**
 * Get OpenAPI path definition for a route
 */
function getPathDefinition(path: string, method: string): any {
  const spec = loadOpenApiSpec();
  const pathDef = spec.paths?.[path];
  if (!pathDef) {
    return null;
  }

  const methodLower = method.toLowerCase();
  return pathDef[methodLower] || null;
}

/**
 * Get expected response schema for a status code
 */
function getResponseSchema(path: string, method: string, statusCode: number): any {
  const pathDef = getPathDefinition(path, method);
  if (!pathDef) {
    return null;
  }

  const responseDef = pathDef.responses?.[statusCode.toString()];
  if (!responseDef) {
    return null;
  }

  // Extract schema from response content
  const content = responseDef.content?.['application/json'];
  return content?.schema || null;
}

/**
 * Validate API response against OpenAPI specification
 *
 * @param response - Playwright APIResponse
 * @param path - API path (e.g., '/api/v1/search')
 * @param method - HTTP method (e.g., 'GET')
 * @param options - Validation options
 */
export async function validateOpenApiResponse(
  response: APIResponse,
  path: string,
  method: string = 'GET',
  options: {
    strict?: boolean; // If true, fails on missing schema. If false, only validates if schema exists.
  } = {}
): Promise<void> {
  const { strict = false } = options;
  const statusCode = response.status();
  loadOpenApiSpec(); // Load spec to ensure it's available

  // Get path definition
  const pathDef = getPathDefinition(path, method);
  if (!pathDef) {
    if (strict) {
      throw new Error(`Path ${path} with method ${method} not found in OpenAPI spec`);
    }
    return; // Skip validation if path not in spec
  }

  // Check if status code is documented
  const responseDef = pathDef.responses?.[statusCode.toString()];
  if (!responseDef) {
    if (strict) {
      throw new Error(
        `Status code ${statusCode} not documented for ${method} ${path} in OpenAPI spec`
      );
    }
    return; // Skip validation if status code not documented
  }

  // Get response schema
  const schema = getResponseSchema(path, method, statusCode);
  if (!schema) {
    // No schema defined - that's okay, just log a warning
    console.warn(`No response schema defined for ${method} ${path} ${statusCode} in OpenAPI spec`);
    return;
  }

  // Parse response body
  const contentType = response.headers()['content-type'] || '';
  if (!contentType.includes('application/json')) {
    // Not JSON - skip schema validation
    return;
  }

  const body = await response.json();

  // Basic validation: check required top-level properties
  // Note: Full JSON Schema validation would require a library like ajv
  // For now, we do basic structural validation
  if (schema.type === 'object' && schema.properties) {
    const required = schema.required || [];
    for (const prop of required) {
      if (!(prop in body)) {
        throw new Error(
          `Response missing required property '${prop}' for ${method} ${path} ${statusCode}`
        );
      }
    }
  }

  // Additional validation can be added here (e.g., using ajv for full JSON Schema validation)
}

/**
 * Assert that an API response matches the OpenAPI specification
 *
 * Convenience wrapper for validateOpenApiResponse that throws on failure
 */
export async function expectOpenApiResponse(
  response: APIResponse,
  path: string,
  method: string = 'GET'
): Promise<void> {
  await validateOpenApiResponse(response, path, method, { strict: true });
}
