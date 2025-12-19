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

import { writeFile, readFile, access, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { stat } from 'node:fs/promises';

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

/**
 * Fix Prisma namespace type references in Zod schema files
 * 
 * Prisma uses inconsistent casing for namespace types:
 * - AggregateArgs: PascalCase (e.g., AnnouncementsAggregateArgs)
 * - CountArgs: camelCase (e.g., announcementsCountArgs)
 * - GroupByArgs: camelCase (e.g., announcementsGroupByArgs)
 * 
 * prisma-zod-generator generates camelCase for all types, so we need to fix
 * only AggregateArgs to PascalCase, while keeping CountArgs and GroupByArgs as camelCase.
 */
async function fixPrismaNamespaceTypeCasing() {
  const zodSchemasDir = join(
    process.cwd(),
    'packages/database-types/src/prisma/zod/schemas'
  );

  try {
    // Recursively find all .ts files in the schemas directory
    async function findTsFiles(dir: string): Promise<string[]> {
      const files: string[] = [];
      try {
        const entries = await readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = join(dir, entry.name);
          if (entry.isDirectory()) {
            files.push(...await findTsFiles(fullPath));
          } else if (entry.isFile() && entry.name.endsWith('.ts')) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Directory might not exist, that's okay
      }
      return files;
    }

    const schemaFiles = await findTsFiles(zodSchemasDir);
    let fixedCount = 0;
    let removedUnusedImports = 0;

    for (const filePath of schemaFiles) {
      try {
        let content = await readFile(filePath, 'utf-8');
        let modified = false;

        // Fix ONLY AggregateArgs to PascalCase (Prisma uses PascalCase for AggregateArgs)
        // Keep CountArgs and GroupByArgs as camelCase (Prisma uses camelCase for these)
        // Pattern: Prisma.modelNameAggregateArgs -> Prisma.ModelNameAggregateArgs
        const aggregateArgsPattern = /Prisma\.([a-z][a-zA-Z0-9_]*)AggregateArgs/g;
        
        const fixedContent = content.replace(aggregateArgsPattern, (match, modelName) => {
          // Convert camelCase model name to PascalCase
          // Handle snake_case models (e.g., webhook_events -> Webhook_events)
          // Handle camelCase models (e.g., announcements -> Announcements)
          const pascalCaseName = modelName
            .split('_')
            .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
            .join('_');
          
          const fixed = `Prisma.${pascalCaseName}AggregateArgs`;
          if (fixed !== match) {
            modified = true;
            return fixed;
          }
          return match;
        });

        if (modified) {
          content = fixedContent;
          fixedCount++;
        }

        // Remove unused Prisma imports
        // Check if Prisma is imported but not used in the file
        const hasPrismaImport = /import\s+(type\s+)?\{?\s*Prisma\s*\}?\s+from/.test(content);
        if (hasPrismaImport) {
          // Check if Prisma is actually used (not just in comments)
          const prismaUsagePattern = /\bPrisma\./;
          const hasPrismaUsage = prismaUsagePattern.test(content);
          
          if (!hasPrismaUsage) {
            // Remove the unused import
            content = content.replace(
              /import\s+(type\s+)?\{?\s*Prisma\s*\}?\s+from\s+['"][^'"]+['"];?\s*\n?/g,
              ''
            );
            // Also remove type-only imports
            content = content.replace(
              /import\s+type\s+\{\s*Prisma\s*\}\s+from\s+['"][^'"]+['"];?\s*\n?/g,
              ''
            );
            modified = true;
            removedUnusedImports++;
          }
        }

        if (modified) {
          await writeFile(filePath, content, 'utf-8');
        }
      } catch (error) {
        console.warn(`⚠️  Could not process ${filePath}:`, error);
      }
    }

    if (fixedCount > 0 || removedUnusedImports > 0) {
      console.log(`✅ Fixed Prisma AggregateArgs casing in ${fixedCount} files`);
      console.log(`✅ Removed ${removedUnusedImports} unused Prisma imports`);
    } else {
      console.log('✅ No Prisma namespace type casing issues found');
    }
  } catch (error) {
    console.warn('⚠️  Could not fix Prisma namespace type casing:', error);
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
    
    await fixPrismaNamespaceTypeCasing();
    
    await verifyGeneratorOutputs();
  } catch (error) {
    console.error('❌ Failed to run post-prisma-generate script:', error);
    process.exit(1);
  }
}

main();
