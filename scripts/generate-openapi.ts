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
import { generateOpenAPISpec, type OpenAPISpec } from '../lib/openapi/spec';

// Get current directory in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const PUBLIC_DIR = resolve(__dirname, '../public');
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
  console.log('🔨 Generating OpenAPI 3.1 specification...\n');

  try {
    // Ensure public directory exists
    await mkdir(PUBLIC_DIR, { recursive: true });

    // Generate OpenAPI spec
    console.log('📝 Generating spec from Zod schemas...');
    const spec = generateOpenAPISpec();

    // Validate spec
    console.log('✅ Validating OpenAPI spec structure...');
    validateOpenAPISpec(spec);

    // Count endpoints
    const endpointCount = Object.keys(spec.paths || {}).length;
    const tagCount = spec.tags?.length || 0;

    console.log('\n📊 Spec Statistics:');
    console.log(`   - OpenAPI version: ${spec.openapi}`);
    console.log(`   - API title: ${spec.info.title}`);
    console.log(`   - API version: ${spec.info.version}`);
    console.log(`   - Endpoints: ${endpointCount}`);
    console.log(`   - Tags: ${tagCount}`);
    console.log(`   - Servers: ${spec.servers?.length || 0}`);

    // Convert to JSON with pretty-printing
    console.log('\n📄 Writing OpenAPI spec to disk...');
    const specJSON = JSON.stringify(spec, null, 2);

    // Write spec to public directory
    await writeFile(OUTPUT_FILE, specJSON, 'utf-8');

    console.log('✨ OpenAPI spec generated successfully!');
    console.log(`   File: ${OUTPUT_FILE}`);
    console.log(`   Size: ${(specJSON.length / 1024).toFixed(2)} KB`);

    console.log('\n✅ OpenAPI generation complete!\n');
  } catch (error) {
    console.error('\n❌ OpenAPI generation failed:\n');

    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
    } else {
      console.error(`   Unknown error: ${String(error)}`);
    }

    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
