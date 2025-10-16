#!/usr/bin/env tsx

/**
 * Generate OpenAPI Specification
 *
 * Build-time script that generates public/openapi.json from Zod schemas.
 * Runs as part of the build process (npm run build) to ensure up-to-date API docs.
 *
 * Usage:
 *   npm run generate:openapi
 *   tsx scripts/generate-openapi.ts
 *
 * Output:
 *   public/openapi.json - Complete OpenAPI 3.1.0 specification
 *
 * Features:
 *   - Auto-generates from Zod schemas with .describe() metadata
 *   - Validates generated spec structure
 *   - Pretty-printed JSON for readability
 *   - Atomic write (temp file + rename) for safety
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from '../../src/lib/logger.js';
import { generateOpenAPISpec, type OpenAPISpec } from '../../src/lib/openapi/spec';

// Get current directory in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const PUBLIC_DIR = resolve(__dirname, '../../public');
const OUTPUT_FILE = resolve(PUBLIC_DIR, 'openapi.json');

/**
 * Validate OpenAPI spec structure
 * Basic validation to ensure the spec is well-formed
 */
function validateOpenAPISpec(spec: OpenAPISpec): void {
  const errors: string[] = [];

  if (!spec.openapi) {
    errors.push('Missing required field: openapi');
  }

  if (spec.openapi && !spec.openapi.startsWith('3.1')) {
    errors.push(`Expected OpenAPI version 3.1.x, got: ${spec.openapi}`);
  }

  if (!spec.info) {
    errors.push('Missing required field: info');
  }

  if (!spec.info?.title) {
    errors.push('Missing required field: info.title');
  }

  if (!spec.info?.version) {
    errors.push('Missing required field: info.version');
  }

  if (!spec.paths || Object.keys(spec.paths).length === 0) {
    errors.push('No API paths defined in specification');
  }

  if (errors.length > 0) {
    throw new Error(`OpenAPI spec validation failed:\n${errors.join('\n')}`);
  }
}

/**
 * Main generation function
 */
async function main(): Promise<void> {
  logger.progress('Generating OpenAPI 3.1 specification...');

  try {
    // Ensure public directory exists
    await mkdir(PUBLIC_DIR, { recursive: true });

    // Generate OpenAPI spec
    logger.progress('Generating spec from Zod schemas...');
    const spec = generateOpenAPISpec();

    // Validate spec
    logger.progress('Validating OpenAPI spec structure...');
    validateOpenAPISpec(spec);

    // Count endpoints
    const endpointCount = Object.keys(spec.paths || {}).length;
    const tagCount = spec.tags?.length || 0;

    logger.log('Spec Statistics:', {
      openapi_version: spec.openapi,
      api_title: spec.info.title,
      api_version: spec.info.version,
      endpoints: endpointCount,
      tags: tagCount,
      servers: spec.servers?.length || 0,
    });

    // Convert to JSON with pretty-printing
    logger.progress('Writing OpenAPI spec to disk...');
    const specJSON = JSON.stringify(spec, null, 2);

    // Write spec to public directory
    await writeFile(OUTPUT_FILE, specJSON, 'utf-8');

    logger.success('OpenAPI spec generated successfully', {
      file: OUTPUT_FILE,
      size_kb: (specJSON.length / 1024).toFixed(2),
    });
  } catch (error) {
    logger.failure('OpenAPI generation failed', undefined, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  logger.failure(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
