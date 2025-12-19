#!/usr/bin/env tsx
/**
 * Post-Prisma Generation Script
 * 
 * This script runs after `prisma generate` to:
 * 1. Create/update the prisma/index.ts barrel export file
 * 2. Fix any import extensions that Prisma generators might have broken
 * 3. Verify all generators produced expected output
 * 4. Fix Node.js v25 TypeScript processing issue in Prisma client
 * 
 * This ensures that @heyclaude/database-types/prisma exports work correctly
 * even though Prisma-generated files are excluded from TypeScript compilation.
 */

import { writeFile, readFile, access, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { logger } from '../toolkit/logger.ts';
import { normalizeError } from '../../../shared-runtime/src/error-handling.ts';

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
      logger.info('Fixed pjtg.ts import extension', {
        script: 'post-prisma-generate',
        file: 'pjtg.ts',
        fix: 'import-extension',
      });
    }
  } catch (error) {
    // pjtg.ts might not exist in some configurations, that's okay
    logger.warn('Could not fix pjtg.ts (file may not exist)', {
      script: 'post-prisma-generate',
      file: 'pjtg.ts',
      error: error instanceof Error ? error.message : String(error),
    });
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

    // OPTIMIZATION: Process files in parallel batches for better performance
    const CONCURRENCY_LIMIT = 10;
    const batches: Array<Array<string>> = [];
    for (let i = 0; i < schemaFiles.length; i += CONCURRENCY_LIMIT) {
      batches.push(schemaFiles.slice(i, i + CONCURRENCY_LIMIT));
    }

    // Process each batch in parallel
    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map(async (filePath) => {
          try {
            let content = await readFile(filePath, 'utf-8');
            let modified = false;
            let fixedCasing = false;
            let removedImport = false;

            // Fix ONLY AggregateArgs to PascalCase (Prisma uses PascalCase for AggregateArgs)
            // Keep CountArgs and GroupByArgs as camelCase (Prisma uses camelCase for these)
            // Pattern: Prisma.modelNameAggregateArgs -> Prisma.ModelNameAggregateArgs
            // Must handle both single-line and multi-line content
            const aggregateArgsPattern = /Prisma\.([a-z][a-zA-Z0-9_]*)AggregateArgs/g;
            
            // Check if file contains camelCase AggregateArgs that need fixing
            const needsFixing = aggregateArgsPattern.test(content);
            
            if (needsFixing) {
              // Reset regex (test() advances the lastIndex)
              aggregateArgsPattern.lastIndex = 0;
              
              const fixedContent = content.replace(aggregateArgsPattern, (match, modelName) => {
                // Convert camelCase/snake_case model name to PascalCase
                // Handle snake_case models (e.g., webhook_events -> Webhook_events)
                // Handle camelCase models (e.g., announcements -> Announcements)
                const pascalCaseName = modelName
                  .split('_')
                  .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
                  .join('_');
                
                const fixed = `Prisma.${pascalCaseName}AggregateArgs`;
                if (fixed !== match) {
                  modified = true;
                  fixedCasing = true;
                  return fixed;
                }
                return match;
              });

              if (modified) {
                content = fixedContent;
              }
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
                removedImport = true;
              }
            }

            if (modified) {
              await writeFile(filePath, content, 'utf-8');
            }

            return { filePath, fixedCasing, removedImport };
          } catch (error) {
            logger.warn('Could not process file', {
              script: 'post-prisma-generate',
              operation: 'fix-prisma-casing',
              file: filePath,
              error: error instanceof Error ? error.message : String(error),
            });
            return { filePath, fixedCasing: false, removedImport: false, error };
          }
        })
      );

      // Aggregate batch results
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          if (result.value.fixedCasing) {
            fixedCount++;
          }
          if (result.value.removedImport) {
            removedUnusedImports++;
          }
        }
      }
    }

    if (fixedCount > 0 || removedUnusedImports > 0) {
      logger.info('Fixed Prisma namespace type casing', {
        script: 'post-prisma-generate',
        operation: 'fix-prisma-casing',
        filesFixed: fixedCount,
        unusedImportsRemoved: removedUnusedImports,
      });
    } else {
      logger.info('No Prisma namespace type casing issues found', {
        script: 'post-prisma-generate',
        operation: 'fix-prisma-casing',
      });
    }
  } catch (error) {
    logger.error('Could not fix Prisma namespace type casing', error, {
      script: 'post-prisma-generate',
      operation: 'fix-prisma-casing',
    });
  }
}

/**
 * Validate generated TypeScript files are syntactically correct
 */
async function validateGeneratedFiles(): Promise<{ valid: number; invalid: number; errors: Array<{ file: string; error: string }> }> {
  const validationErrors: Array<{ file: string; error: string }> = [];
  let validCount = 0;
  let invalidCount = 0;

  // Key files to validate
  const keyFiles = [
    PRISMA_INDEX_PATH,
    join(process.cwd(), 'packages/database-types/src/prisma/client.ts'),
    join(process.cwd(), 'packages/database-types/src/prisma/enums.ts'),
    join(process.cwd(), 'packages/database-types/src/prisma/models.ts'),
  ];

  // Validate key files exist and are readable
  const validationResults = await Promise.allSettled(
    keyFiles.map(async (filePath) => {
      try {
        const content = await readFile(filePath, 'utf-8');
        
        // Basic validation: check for common syntax issues
        // 1. Check for balanced braces/brackets
        const openBraces = (content.match(/{/g) || []).length;
        const closeBraces = (content.match(/}/g) || []).length;
        const openBrackets = (content.match(/\[/g) || []).length;
        const closeBrackets = (content.match(/\]/g) || []).length;
        const openParens = (content.match(/\(/g) || []).length;
        const closeParens = (content.match(/\)/g) || []).length;

        if (openBraces !== closeBraces) {
          throw new Error(`Unbalanced braces: ${openBraces} open, ${closeBraces} close`);
        }
        if (openBrackets !== closeBrackets) {
          throw new Error(`Unbalanced brackets: ${openBrackets} open, ${closeBrackets} close`);
        }
        if (openParens !== closeParens) {
          throw new Error(`Unbalanced parentheses: ${openParens} open, ${closeParens} close`);
        }

        // 2. Check for common import/export syntax issues
        const exportPattern = /^export\s+(?:default\s+)?(?:const|function|class|type|interface|enum|namespace)/m;
        if (!exportPattern.test(content) && content.length > 0) {
          // File should have at least one export (unless it's a special file)
          // This is a soft check - some files might not need exports
        }

        return { file: filePath, valid: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { file: filePath, valid: false, error: errorMessage };
      }
    })
  );

  for (const result of validationResults) {
    if (result.status === 'fulfilled') {
      if (result.value.valid) {
        validCount++;
      } else {
        invalidCount++;
        validationErrors.push({
          file: result.value.file,
          error: result.value.error || 'Unknown validation error',
        });
      }
    } else {
      invalidCount++;
      validationErrors.push({
        file: 'unknown',
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      });
    }
  }

  return { valid: validCount, invalid: invalidCount, errors: validationErrors };
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
    logger.warn('Missing generator outputs', {
      script: 'post-prisma-generate',
      operation: 'verify-outputs',
      missing: missing,
    });
  } else {
    logger.info('All generator outputs verified', {
      script: 'post-prisma-generate',
      operation: 'verify-outputs',
    });
  }

  // Validate generated files
  const validation = await validateGeneratedFiles();
  if (validation.invalid > 0) {
    logger.error('Generated files validation failed', undefined, {
      script: 'post-prisma-generate',
      operation: 'validate-files',
      valid: validation.valid,
      invalid: validation.invalid,
      errors: validation.errors,
    });
    throw new Error(`Validation failed for ${validation.invalid} file(s). Check logs for details.`);
  } else {
    logger.info('Generated files validation passed', {
      script: 'post-prisma-generate',
      operation: 'validate-files',
      filesValidated: validation.valid,
    });
  }
}

async function main() {
  const startTime = Date.now();
  
  try {
    logger.info('Starting post-prisma-generate script', {
      script: 'post-prisma-generate',
      operation: 'main',
    });

    // Create/update index file
    await writeFile(PRISMA_INDEX_PATH, INDEX_CONTENT, 'utf-8');
    logger.info('Created/updated Prisma index barrel export', {
      script: 'post-prisma-generate',
      operation: 'create-index',
      file: 'packages/database-types/src/prisma/index.ts',
    });
    
    // Run post-processing operations in parallel where possible
    await Promise.all([
      fixPjtgImport(),
      fixPrismaNamespaceTypeCasing(),
    ]);
    
    // Verify outputs (includes validation)
    await verifyGeneratorOutputs();

    const duration = Date.now() - startTime;
    logger.info('Post-prisma-generate script completed successfully', {
      script: 'post-prisma-generate',
      operation: 'main',
      duration_ms: duration,
    });
  } catch (error) {
    const normalized = normalizeError(error, 'Post-prisma-generate script failed');
    logger.error('Failed to run post-prisma-generate script', normalized, {
      script: 'post-prisma-generate',
      operation: 'main',
      duration_ms: Date.now() - startTime,
    });
    process.exit(1);
  }
}

main();
