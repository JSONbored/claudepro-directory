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

import { writeFile, readFile, access, readdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { logger } from '../toolkit/logger.ts';
import { normalizeError } from '../../../shared-runtime/src/error-handling.ts';
import { fixPrismaClientCommonJSWrapper } from '../utils/prisma-post-generation.ts';

const PRISMA_INDEX_PATH = join(process.cwd(), 'packages/database-types/src/prisma/index.ts');

const PJTG_PATH = join(process.cwd(), 'packages/database-types/src/prisma/pjtg.ts');

const OPENAPI_PATH = join(process.cwd(), 'packages/database-types/src/openapi/openapi.yaml');

const DOCS_PATH = join(process.cwd(), 'packages/database-types/docs/index.html');

const INDEX_CONTENT = `/**
 * Prisma Types Barrel Export
 * 
 * Central export point for all Prisma-generated types:
 * - Enums (enum types and value objects)
 * - Models (table types)
 * - Client (PrismaClient and Prisma namespace)
 * - Internal types (Prisma namespace types)
 * 
 * Prisma generates to default location: node_modules/.prisma/client
 * This index file re-exports from @prisma/client for convenience.
 * 
 * NOTE: This file is recreated automatically after \`prisma generate\` runs.
 */

// Re-export PrismaClient and Prisma namespace from default Prisma location
// Prisma namespace contains both types and enum value objects
// Note: Prisma is both a type and a value namespace - export once, TypeScript handles both
export { PrismaClient, Prisma } from '@prisma/client';

// Re-export all enum types from @prisma/client
// Enum value objects are available via Prisma namespace (e.g., Prisma.content_category)
export type * from '@prisma/client';

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
  const zodSchemasDir = join(process.cwd(), 'packages/database-types/src/prisma/zod/schemas');

  try {
    // Recursively find all .ts files in the schemas directory
    async function findTsFiles(dir: string): Promise<string[]> {
      const files: string[] = [];
      try {
        const entries = await readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = join(dir, entry.name);
          if (entry.isDirectory()) {
            files.push(...(await findTsFiles(fullPath)));
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
async function validateGeneratedFiles(): Promise<{
  valid: number;
  invalid: number;
  errors: Array<{ file: string; error: string }>;
}> {
  const validationErrors: Array<{ file: string; error: string }> = [];
  let validCount = 0;
  let invalidCount = 0;

  // Key files to validate
  // Note: Prisma client files are now in node_modules/.prisma/client (default location)
  // Only validate the index file - skip generated Prisma internal files (they're validated by Prisma itself)
  const keyFiles = [
    PRISMA_INDEX_PATH,
    // Skip prismaNamespace.ts - it's a Prisma-generated file and bracket counting is too strict
    // Prisma validates its own generated files, so we don't need to validate them here
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
        const exportPattern =
          /^export\s+(?:default\s+)?(?:const|function|class|type|interface|enum|namespace)/m;
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

/**
 * Create missing schemas for Prisma views
 *
 * prisma-zod-generator doesn't generate certain schemas for views because
 * views don't support @id, @@unique, or create operations. However, the
 * generator still creates files that reference these schemas. We create
 * minimal stub schemas for views that are referenced but missing.
 */
async function createMissingViewSchemas() {
  const zodSchemasDir = join(process.cwd(), 'packages/database-types/src/prisma/zod/schemas');
  const objectsDir = join(zodSchemasDir, 'objects');

  try {
    // Find all schema files that import view schemas
    async function findTsFiles(dir: string): Promise<string[]> {
      const files: string[] = [];
      try {
        const entries = await readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = join(dir, entry.name);
          if (entry.isDirectory()) {
            files.push(...(await findTsFiles(fullPath)));
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
    const missingSchemas = new Map<string, string>(); // schemaName -> schemaType

    // Find all missing schema imports for views (v_*)
    // NOTE: We skip WhereUniqueInput, CreateManyInput, and UpdateManyMutationInput for views
    // because Prisma doesn't generate these types for views (views are read-only and have no unique constraints)
    // Patterns: None - we don't create these schemas for views anymore
    for (const filePath of schemaFiles) {
      try {
        const content = await readFile(filePath, 'utf-8');
        // Skip views - we don't create WhereUniqueInput, CreateManyInput, or UpdateManyMutationInput for views
        // These types don't exist in Prisma for views
        if (filePath.includes('v_')) {
          continue;
        }
        // Match imports for non-view schemas only
        const importPatterns = [
          /from\s+['"]\.\/objects\/([a-zA-Z0-9_]+WhereUniqueInput)\.schema['"]/g,
          /from\s+['"]\.\/objects\/([a-zA-Z0-9_]+CreateManyInput)\.schema['"]/g,
          /from\s+['"]\.\/objects\/([a-zA-Z0-9_]+UpdateManyMutationInput)\.schema['"]/g,
        ];
        
            for (const pattern of importPatterns) {
              let match;
              while ((match = pattern.exec(content)) !== null) {
                const schemaName = match[1];
                if (!schemaName) continue; // Skip if match[1] is undefined
                const schemaType = schemaName.includes('WhereUniqueInput') 
                  ? 'WhereUniqueInput' 
                  : schemaName.includes('CreateManyInput')
                  ? 'CreateManyInput'
                  : schemaName.includes('UpdateManyMutationInput')
                  ? 'UpdateManyMutationInput'
                  : 'unknown';
            const schemaFilePath = join(objectsDir, `${schemaName}.schema.ts`);
            try {
              await access(schemaFilePath);
              // File exists, skip
            } catch {
              // File doesn't exist, add to missing set
              missingSchemas.set(schemaName, schemaType);
            }
          }
        }
      } catch (error) {
        // Skip files that can't be read
        logger.warn('Could not read file to check for missing schemas', {
          script: 'post-prisma-generate',
          operation: 'create-missing-view-schemas',
          file: filePath,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (missingSchemas.size === 0) {
      logger.info('No missing view schemas found', {
        script: 'post-prisma-generate',
        operation: 'create-missing-view-schemas',
      });
      return;
    }

    // Create missing schemas
    let createdCount = 0;
    for (const [schemaName, schemaType] of missingSchemas.entries()) {
      try {
        // Extract model/view name from schema name
        let modelName: string | undefined;
        if (schemaType === 'WhereUniqueInput') {
          const match = schemaName.match(/^(.+?)WhereUniqueInput$/);
          if (!match || !match[1]) continue;
          modelName = match[1];
        } else if (schemaType === 'CreateManyInput') {
          const match = schemaName.match(/^(.+?)CreateManyInput$/);
          if (!match || !match[1]) continue;
          modelName = match[1];
        } else if (schemaType === 'UpdateManyMutationInput') {
          const match = schemaName.match(/^(.+?)UpdateManyMutationInput$/);
          if (!match || !match[1]) continue;
          modelName = match[1];
        } else {
          continue;
        }

        if (!modelName) {
          logger.warn('Could not extract model name from schema name', {
            script: 'post-prisma-generate',
            operation: 'create-missing-view-schemas',
            schemaName,
            schemaType,
          });
          continue;
        }

        const schemaFilePath = join(objectsDir, `${schemaName}.schema.ts`);

        let schemaContent: string;
        if (schemaType === 'WhereUniqueInput') {
          // Create minimal WhereUniqueInput schema using `id` field
          schemaContent = `import * as z from 'zod';
import type { Prisma } from '@prisma/client';

/**
 * WhereUniqueInput schema for ${modelName}
 * 
 * NOTE: This schema was auto-generated for a Prisma view.
 * Views don't support @id or @@unique annotations, so we use the \`id\` field
 * as the unique identifier (which should be unique based on the underlying data).
 */
const ${modelName}WhereUniqueInputSchema = z.object({
  id: z.string().uuid().optional(),
}).strict();

export const ${schemaName}ObjectSchema: z.ZodType<Prisma.${modelName}WhereUniqueInput> = ${modelName}WhereUniqueInputSchema as unknown as z.ZodType<Prisma.${modelName}WhereUniqueInput>;
export const ${schemaName}ObjectZodSchema = ${modelName}WhereUniqueInputSchema;
`;
        } else if (schemaType === 'CreateManyInput') {
          // Create minimal CreateManyInput schema (views are read-only, but schema is referenced)
          // Use an empty object since views don't support create operations
          schemaContent = `import * as z from 'zod';
import type { Prisma } from '@prisma/client';

/**
 * CreateManyInput schema for ${modelName}
 * 
 * NOTE: This schema was auto-generated for a Prisma view.
 * Views are read-only and don't support create operations, but the generator
 * creates files that reference this schema. This is a minimal stub schema.
 */
const ${modelName}CreateManyInputSchema = z.object({}).strict();

export const ${schemaName}ObjectSchema: z.ZodType<Prisma.${modelName}CreateManyInput> = ${modelName}CreateManyInputSchema as unknown as z.ZodType<Prisma.${modelName}CreateManyInput>;
export const ${schemaName}ObjectZodSchema = ${modelName}CreateManyInputSchema;
`;
        } else if (schemaType === 'UpdateManyMutationInput') {
          // Create minimal UpdateManyMutationInput schema (views are read-only, but schema is referenced)
          // Use an empty object since views don't support update operations
          schemaContent = `import * as z from 'zod';
import type { Prisma } from '@prisma/client';

/**
 * UpdateManyMutationInput schema for ${modelName}
 * 
 * NOTE: This schema was auto-generated for a Prisma view.
 * Views are read-only and don't support update operations, but the generator
 * creates files that reference this schema. This is a minimal stub schema.
 */
const ${modelName}UpdateManyMutationInputSchema = z.object({}).strict();

export const ${schemaName}ObjectSchema: z.ZodType<Prisma.${modelName}UpdateManyMutationInput> = ${modelName}UpdateManyMutationInputSchema as unknown as z.ZodType<Prisma.${modelName}UpdateManyMutationInput>;
export const ${schemaName}ObjectZodSchema = ${modelName}UpdateManyMutationInputSchema;
`;
        } else {
          continue;
        }

        await writeFile(schemaFilePath, schemaContent, 'utf-8');
        createdCount++;

        logger.info('Created missing view schema', {
          script: 'post-prisma-generate',
          operation: 'create-missing-view-schemas',
          schemaName,
          schemaType,
          modelName,
          file: schemaFilePath,
        });
      } catch (error) {
        logger.error('Failed to create missing view schema', error, {
          script: 'post-prisma-generate',
          operation: 'create-missing-view-schemas',
          schemaName,
          schemaType,
        });
      }
    }

    if (createdCount > 0) {
      logger.info('Created missing view schemas', {
        script: 'post-prisma-generate',
        operation: 'create-missing-view-schemas',
        created: createdCount,
        total: missingSchemas.size,
      });
    }
  } catch (error) {
    logger.error('Could not create missing view schemas', error, {
      script: 'post-prisma-generate',
      operation: 'create-missing-view-schemas',
    });
  }
}

/**
 * Remove invalid schema files for Prisma views
 *
 * Views are read-only and don't support certain operations:
 * - createManyAndReturn: Views don't support create operations
 * - findUniqueOrThrow: Views don't have unique constraints (@@unique or @id)
 * - updateManyAndReturn: Views don't support update operations
 * - WhereUniqueInput: Views don't have unique constraints (used for cursor)
 * - CreateManyInput: Views don't support create operations
 * - UpdateManyMutationInput: Views don't support update operations
 *
 * These schemas reference Prisma types that don't exist for views,
 * causing TypeScript errors (TS2724).
 */
async function removeInvalidViewSchemas() {
  try {
    const schemasDir = join(process.cwd(), 'packages/database-types/src/prisma/zod/schemas');
    const objectsDir = join(schemasDir, 'objects');
    const viewNames = ['v_content_list_slim', 'v_trending_searches'];
    
    // Invalid schema patterns for views (in schemas/ directory)
    const invalidSchemaPatterns = [
      'createManyAndReturn',
      'findUniqueOrThrow',
      'updateManyAndReturn',
    ];

    // Invalid object schema patterns for views (in schemas/objects/ directory)
    const invalidObjectPatterns = [
      'WhereUniqueInput',
      'CreateManyInput',
      'UpdateManyMutationInput',
    ];

    let removedCount = 0;
    const removedFiles: string[] = [];

    // Remove invalid schemas from schemas/ directory
    for (const viewName of viewNames) {
      for (const pattern of invalidSchemaPatterns) {
        // Pattern: createManyAndReturnv_content_list_slim.schema.ts
        const fileName = `${pattern}${viewName}.schema.ts`;
        const filePath = join(schemasDir, fileName);

        try {
          await access(filePath);
          // File exists, remove it
          await unlink(filePath);
          removedCount++;
          removedFiles.push(fileName);

          logger.info('Removed invalid view schema', {
            script: 'post-prisma-generate',
            operation: 'remove-invalid-view-schemas',
            viewName,
            pattern,
            file: fileName,
          });
        } catch (error) {
          // File doesn't exist, that's fine
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            logger.warn('Could not remove invalid view schema', {
              script: 'post-prisma-generate',
              operation: 'remove-invalid-view-schemas',
              file: fileName,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      }
    }

    // Remove invalid object schemas from schemas/objects/ directory
    for (const viewName of viewNames) {
      for (const pattern of invalidObjectPatterns) {
        // Pattern: v_content_list_slimWhereUniqueInput.schema.ts
        const fileName = `${viewName}${pattern}.schema.ts`;
        const filePath = join(objectsDir, fileName);

        try {
          await access(filePath);
          // File exists, remove it
          await unlink(filePath);
          removedCount++;
          removedFiles.push(fileName);

          logger.info('Removed invalid view object schema', {
            script: 'post-prisma-generate',
            operation: 'remove-invalid-view-schemas',
            viewName,
            pattern,
            file: fileName,
          });
        } catch (error) {
          // File doesn't exist, that's fine
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            logger.warn('Could not remove invalid view object schema', {
              script: 'post-prisma-generate',
              operation: 'remove-invalid-view-schemas',
              file: fileName,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      }
    }

    if (removedCount > 0) {
      logger.info('Removed invalid view schemas', {
        script: 'post-prisma-generate',
        operation: 'remove-invalid-view-schemas',
        removed: removedCount,
        files: removedFiles,
      });
    } else {
      logger.info('No invalid view schemas found to remove', {
        script: 'post-prisma-generate',
        operation: 'remove-invalid-view-schemas',
      });
    }
  } catch (error) {
    logger.error('Could not remove invalid view schemas', error, {
      script: 'post-prisma-generate',
      operation: 'remove-invalid-view-schemas',
    });
  }
}

/**
 * Fix view schemas that import WhereUniqueInput for cursor parameter
 *
 * Views don't support unique constraints, so cursor (which uses WhereUniqueInput)
 * is not supported. We remove the cursor import and parameter from view schemas.
 */
async function fixViewSchemaCursorImports() {
  try {
    const schemasDir = join(process.cwd(), 'packages/database-types/src/prisma/zod/schemas');
    const viewNames = ['v_content_list_slim', 'v_trending_searches'];
    
    // Schema files that use cursor parameter
    const schemaFiles = [
      'aggregate',
      'count',
      'findMany',
      'findFirst',
      'findFirstOrThrow',
    ];

    let fixedCount = 0;
    const fixedFiles: string[] = [];

    for (const viewName of viewNames) {
      for (const schemaFile of schemaFiles) {
        const fileName = `${schemaFile}${viewName}.schema.ts`;
        const filePath = join(schemasDir, fileName);

        try {
          const content = await readFile(filePath, 'utf-8');
          
          // Check if file imports WhereUniqueInput
          const whereUniqueInputPattern = new RegExp(
            `import.*${viewName}WhereUniqueInput.*from.*['"]\\./objects/${viewName}WhereUniqueInput\\.schema['"]`,
            'g'
          );
          
          if (!whereUniqueInputPattern.test(content)) {
            // File doesn't import WhereUniqueInput, skip
            continue;
          }

          // Remove the WhereUniqueInput import line
          let fixed = content.replace(
            new RegExp(
              `import\\s+\\{[^}]*${viewName}WhereUniqueInput[^}]*\\}\\s+from\\s+['"]\\./objects/${viewName}WhereUniqueInput\\.schema['"];?\\s*`,
              'g'
            ),
            ''
          );

          // Remove cursor parameter from schema definitions
          // Pattern: cursor: v_content_list_slimWhereUniqueInputObjectSchema.optional(),
          fixed = fixed.replace(
            new RegExp(
              `,\\s*cursor:\\s*${viewName}WhereUniqueInputObjectSchema\\.optional\\(\\)`,
              'g'
            ),
            ''
          );
          fixed = fixed.replace(
            new RegExp(
              `cursor:\\s*${viewName}WhereUniqueInputObjectSchema\\.optional\\(\\),?\\s*`,
              'g'
            ),
            ''
          );

          if (content !== fixed) {
            await writeFile(filePath, fixed, 'utf-8');
            fixedCount++;
            fixedFiles.push(fileName);

            logger.info('Fixed view schema cursor import', {
              script: 'post-prisma-generate',
              operation: 'fix-view-schema-cursor-imports',
              viewName,
              schemaFile,
              file: fileName,
            });
          }
        } catch (error) {
          // File doesn't exist or can't be read, that's fine
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            logger.warn('Could not fix view schema cursor import', {
              script: 'post-prisma-generate',
              operation: 'fix-view-schema-cursor-imports',
              file: fileName,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      }
    }

    if (fixedCount > 0) {
      logger.info('Fixed view schema cursor imports', {
        script: 'post-prisma-generate',
        operation: 'fix-view-schema-cursor-imports',
        fixed: fixedCount,
        files: fixedFiles,
      });
    } else {
      logger.info('No view schema cursor imports to fix', {
        script: 'post-prisma-generate',
        operation: 'fix-view-schema-cursor-imports',
      });
    }
  } catch (error) {
    logger.error('Could not fix view schema cursor imports', error, {
      script: 'post-prisma-generate',
      operation: 'fix-view-schema-cursor-imports',
    });
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
      fixPrismaClientCommonJSWrapper(process.cwd()),
      createMissingViewSchemas(),
      removeInvalidViewSchemas(),
    ]);

    // Fix view schemas that reference removed WhereUniqueInput (must run after removeInvalidViewSchemas)
    await fixViewSchemaCursorImports();

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
