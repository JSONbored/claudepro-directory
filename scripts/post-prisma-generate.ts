#!/usr/bin/env tsx
/**
 * Post-Prisma Generation Script
 * 
 * This script runs after `prisma generate` to:
 * 1. Create/update the prisma/index.ts barrel export file
 * 2. Fix any import extensions that Prisma generators might have broken
 * 3. Verify all generators produced expected output
 * 
 * This ensures that @heyclaude/database-types/prisma exports work correctly
 * even though Prisma-generated files are excluded from TypeScript compilation.
 */

import { writeFile, readFile, access } from 'node:fs/promises';
import { join } from 'node:path';

const PRISMA_INDEX_PATH = join(
  process.cwd(),
  'packages/database-types/src/prisma/index.ts'
);

const PJTG_PATH = join(
  process.cwd(),
  'packages/database-types/src/prisma/pjtg.ts'
);

const OPENAPI_PATH = join(
  process.cwd(),
  'packages/database-types/src/openapi/openapi.yaml'
);

const DOCS_PATH = join(
  process.cwd(),
  'packages/database-types/docs/index.html'
);

const INDEX_CONTENT = `/**
 * Prisma Types Barrel Export
 * 
 * Central export point for all Prisma-generated types:
 * - Enums (enum types and value objects)
 * - Models (table types)
 * - Client (PrismaClient and Prisma namespace)
 * - Internal types (Prisma namespace types)
 * 
 * This file is manually maintained and re-exports from Prisma-generated files.
 * Prisma generates: client.ts, browser.ts, enums.ts, models.ts, etc.
 * This index file provides a single import point: @heyclaude/database-types/prisma
 * 
 * NOTE: This file is recreated automatically after \`prisma generate\` runs.
 */

// Re-export all enums (types and value objects)
export * from './enums.ts';

// Re-export all model types
export * from './models.ts';

// Re-export Prisma namespace and client types
export type { Prisma } from './client.ts';
export { PrismaClient } from './client.ts';

// Re-export internal Prisma namespace types (JsonValue, etc.)
export type * from './internal/prismaNamespace.ts';

// Re-export pjtg (prisma-json-types-generator namespace anchor)
export * from './pjtg.ts';
`;

async function fixPjtgImport() {
  try {
    const content = await readFile(PJTG_PATH, 'utf-8');
    // Fix the import to use .ts extension
    const fixed = content.replace(
      "import * as Prisma from './internal/prismaNamespace';",
      "import * as Prisma from './internal/prismaNamespace.ts';"
    );
    
    if (content !== fixed) {
      await writeFile(PJTG_PATH, fixed, 'utf-8');
      console.log('✅ Fixed pjtg.ts import extension');
    }
  } catch (error) {
    // pjtg.ts might not exist in some configurations, that's okay
    console.warn('⚠️  Could not fix pjtg.ts (file may not exist):', error);
  }
}

async function verifyGeneratorOutputs() {
  const checks = [
    { path: PRISMA_INDEX_PATH, name: 'Prisma index' },
    { path: OPENAPI_PATH, name: 'OpenAPI spec' },
    { path: DOCS_PATH, name: 'Docs generator' },
  ];

  const results = await Promise.allSettled(
    checks.map(async ({ path, name }) => {
      try {
        await access(path);
        return { name, status: 'exists' };
      } catch {
        return { name, status: 'missing' };
      }
    })
  );

  const missing = results
    .filter((r) => r.status === 'fulfilled' && r.value.status === 'missing')
    .map((r) => (r.status === 'fulfilled' ? r.value.name : 'unknown'));

  if (missing.length > 0) {
    console.warn(`⚠️  Missing generator outputs: ${missing.join(', ')}`);
  } else {
    console.log('✅ All generator outputs verified');
  }
}

async function main() {
  try {
    await writeFile(PRISMA_INDEX_PATH, INDEX_CONTENT, 'utf-8');
    console.log('✅ Created/updated packages/database-types/src/prisma/index.ts');
    
    await fixPjtgImport();
    
    await verifyGeneratorOutputs();
  } catch (error) {
    console.error('❌ Failed to run post-prisma-generate script:', error);
    process.exit(1);
  }
}

main();
