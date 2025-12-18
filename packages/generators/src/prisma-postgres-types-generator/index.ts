#!/usr/bin/env node

/**
 * Prisma Custom Generator: PostgreSQL Functions & Composite Types
 * 
 * Generates TypeScript types and Zod schemas for PostgreSQL functions (RPCs)
 * and composite types directly from database introspection.
 * 
 * This generator runs automatically when `prisma generate` is executed.
 */

// CommonJS/ESM compatibility for @prisma/generator-helper
import pkg from '@prisma/generator-helper';
const { generatorHandler } = pkg;
import { mkdir, writeFile, readFile, readdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';

import { generateCompositeTypes } from './composite-generator.ts';
import { generateEnumSchemas } from './enum-generator.ts';
import { generateFunctionTypes } from './function-generator.ts';
import { introspectDatabase } from './introspect.ts';
import type { GeneratorConfig } from './types.ts';
import type { CompositeTypeAttribute } from '../toolkit/introspection.ts';

generatorHandler({
  onManifest() {
    return {
      defaultOutput: './dist/prisma/postgres-types',
      prettyName: 'PostgreSQL Functions & Composite Types',
      requiresEngines: [],
      version: '1.0.1', // Incremented for improvements
    };
  },

  async onGenerate(options) {
    try {
      const { generator } = options;

      // Parse generator configuration
      const config: GeneratorConfig = {
        output: generator.output?.value || './dist/prisma/postgres-types',
        schema: (generator.config?.['schema'] as string) || 'public',
        generateTypes: (generator.config?.['generateTypes'] as boolean | undefined) !== false,
        generateZod: (generator.config?.['generateZod'] as boolean | undefined) !== false,
        ...(generator.config?.['includeFunctions'] ? { includeFunctions: generator.config['includeFunctions'] as string[] } : {}),
        ...(generator.config?.['excludeFunctions'] ? { excludeFunctions: generator.config['excludeFunctions'] as string[] } : {}),
        ...(generator.config?.['excludeCompositeTypes'] ? { excludeCompositeTypes: generator.config['excludeCompositeTypes'] as string[] } : {}),
      };

      // Get database connection string from datasource
      // Prisma generator helper provides datasources in options.datasources or options.dmmf.datasources
      const datasources = options.datasources || (options.dmmf as { datasources?: unknown[] } | undefined)?.datasources || [];
      const datasource = datasources[0] as { url?: string | { value?: string; fromEnvVar?: string } } | undefined;
      if (!datasource) {
        throw new Error('No datasource found in Prisma schema');
      }

      // Extract connection string from environment variable or direct value
      // datasource.url can be a string or an object with .value property
      const urlValue = typeof datasource.url === 'string' 
        ? datasource.url 
        : (datasource.url as { value?: string; fromEnvVar?: string })?.value || 
          ((datasource.url as { fromEnvVar?: string })?.fromEnvVar 
            ? process.env[(datasource.url as { fromEnvVar: string }).fromEnvVar] || ''
            : '');

      let connectionString: string;
      if (urlValue.startsWith('env("') || urlValue.startsWith('env(\'')) {
        // Extract env var name: env("VAR_NAME") or env('VAR_NAME')
        const envVar = urlValue.replace(/^env\(["']/, '').replace(/["']\)$/, '');
        connectionString = process.env[envVar] || '';
        if (!connectionString) {
          throw new Error(
            `Database connection string not found. Please set ${envVar} environment variable.`
          );
        }
      } else if (urlValue) {
        connectionString = urlValue;
      } else {
        // Try to get from DATABASE_URL as fallback
        connectionString = process.env['DATABASE_URL'] || '';
        if (!connectionString) {
          throw new Error(
            'Database connection string not found. Please set DATABASE_URL environment variable or configure datasource.url in schema.prisma.'
          );
        }
      }

      if (!connectionString) {
        throw new Error('Database connection string is empty');
      }

    // Introspect database
    const metadata = await introspectDatabase(connectionString, config.schema);

    // Filter functions if include/exclude patterns are specified
    let functions = metadata.functions;
    if (config.includeFunctions || config.excludeFunctions) {
      functions = Object.fromEntries(
        Object.entries(functions).filter(([name]) => {
          if (config.includeFunctions) {
            const matches = config.includeFunctions.some((pattern) =>
              new RegExp(pattern.replace(/\*/g, '.*')).test(name)
            );
            if (!matches) return false;
          }
          if (config.excludeFunctions) {
            const matches = config.excludeFunctions.some((pattern) =>
              new RegExp(pattern.replace(/\*/g, '.*')).test(name)
            );
            if (matches) return false;
          }
          return true;
        })
      );
    }

    // Filter composite types if exclude patterns are specified
    // This ensures excluded composite types are not available for function generation
    let filteredCompositeTypes = metadata.compositeTypes;
    if (config.excludeCompositeTypes) {
      filteredCompositeTypes = Object.fromEntries(
        Object.entries(metadata.compositeTypes).filter(([name]) => {
          const matches = config.excludeCompositeTypes!.some((pattern) =>
            new RegExp(pattern.replace(/\*/g, '.*')).test(name)
          );
          return !matches; // Exclude if matches pattern
        })
      );
    }

    // Generate types and schemas
    const functionOutput = config.generateTypes || config.generateZod
      ? await generateFunctionTypes(
          functions, 
          filteredCompositeTypes, // Use filtered composite types
          metadata.enums, 
          metadata.functionReturnStructures,
          config
        )
      : { files: {}, exports: [] };

    // ROOT CAUSE FIX: Only generate composite types that are actually used by functions
    // This prevents generating types for unused composite types (e.g., from deleted functions)
    // Helper function to extract composite type from a type string (similar to function-generator.ts)
    function stripSchemaPrefix(typeName: string): string {
      if (!typeName) return typeName;
      let cleaned = typeName.replace(/["']/g, '');
      const schemaMatch = cleaned.match(/^[a-z_][a-z0-9_]*\.([a-z_][a-z0-9_]*)$/i);
      return schemaMatch && schemaMatch[1] ? schemaMatch[1] : cleaned;
    }
    
    function extractBaseCompositeTypeFromString(
      typeString: string,
      compositeTypes: Record<string, CompositeTypeAttribute[]>
    ): string | null {
      if (!typeString) return null;

      // Handle SETOF (returns set of rows)
      if (typeString.toUpperCase().includes('SETOF')) {
        const baseTypeMatch = typeString.match(/SETOF\s+([\w.]+)/i);
        if (baseTypeMatch?.[1]) {
          const baseType = stripSchemaPrefix(baseTypeMatch[1]);
          if (compositeTypes[baseType]) {
            return baseType;
          }
          if (baseType.startsWith('_')) {
            return extractBaseCompositeTypeFromString(baseType, compositeTypes);
          }
        }
        return null;
      }

      // Handle array types (prefixed with _)
      if (typeString.startsWith('_')) {
        const baseType = stripSchemaPrefix(typeString.slice(1));
        if (compositeTypes[baseType]) {
          return baseType;
        }
        if (baseType.startsWith('_')) {
          return extractBaseCompositeTypeFromString(baseType, compositeTypes);
        }
        if (baseType.includes('[]')) {
          return extractBaseCompositeTypeFromString(baseType.replace('[]', ''), compositeTypes);
        }
      }

      // Handle explicit array notation
      if (typeString.includes('[]')) {
        const baseType = stripSchemaPrefix(typeString.replace(/\[\]/g, ''));
        if (compositeTypes[baseType]) {
          return baseType;
        }
        return extractBaseCompositeTypeFromString(baseType, compositeTypes);
      }

      // Strip schema prefix before checking
      const normalizedType = stripSchemaPrefix(typeString);

      // Direct composite type
      if (compositeTypes[normalizedType]) {
        return normalizedType;
      }

      return null;
    }
    
    const usedCompositeTypes = new Set<string>();
    
    // Collect all composite types used by functions
    for (const [functionName, functionMeta] of Object.entries(functions)) {
      // Check function arguments
      for (const arg of functionMeta.args || []) {
        const baseType = extractBaseCompositeTypeFromString(arg.udtName || '', filteredCompositeTypes);
        if (baseType) {
          usedCompositeTypes.add(baseType);
        }
      }
      
      // Check return type
      if (functionMeta.returnType) {
        const baseType = extractBaseCompositeTypeFromString(functionMeta.returnType, filteredCompositeTypes);
        if (baseType) {
          usedCompositeTypes.add(baseType);
        }
      }
      
      // Check function return structures (for SETOF record functions)
      if (metadata.functionReturnStructures[functionName]) {
        for (const attr of metadata.functionReturnStructures[functionName]) {
          const baseType = extractBaseCompositeTypeFromString(attr.udtName || '', filteredCompositeTypes);
          if (baseType) {
            usedCompositeTypes.add(baseType);
          }
        }
      }
    }
    
    // Also include composite types that are nested within other used composite types
    // (recursively collect all dependencies)
    const allUsedCompositeTypes = new Set(usedCompositeTypes);
    function collectNestedComposites(compositeName: string) {
      const attrs = filteredCompositeTypes[compositeName];
      if (!attrs) return;
      
      for (const attr of attrs) {
        const baseType = extractBaseCompositeTypeFromString(attr.udtName || '', filteredCompositeTypes);
        if (baseType && !allUsedCompositeTypes.has(baseType)) {
          allUsedCompositeTypes.add(baseType);
          collectNestedComposites(baseType); // Recursively collect nested composites
        }
      }
    }
    
    // Recursively collect all nested composite types
    for (const compositeName of usedCompositeTypes) {
      collectNestedComposites(compositeName);
    }
    
    // Filter composite types to only those that are used
    const usedCompositeTypesRecord = Object.fromEntries(
      Object.entries(filteredCompositeTypes).filter(([name]) => 
        allUsedCompositeTypes.has(name)
      )
    );

    const compositeOutput = config.generateTypes || config.generateZod
      ? await generateCompositeTypes(usedCompositeTypesRecord, metadata.enums, config)
      : { files: {}, exports: [] };

    // Generate enum schemas (matching prisma-zod-generator format but with correct database values)
    // Output to prisma-zod-generator's location to replace/fix its incorrect enum schemas
    const enumOutput = config.generateZod
      ? generateEnumSchemas(metadata.enums, config)
      : { files: {}, exports: [] };

    // ARCHITECTURAL FIX: Clear TypeScript build caches before generating
    // This prevents TypeScript from resolving stale type information from previous generations
    // This is critical when composite types are excluded or RPCs are removed
    try {
      const { unlink } = await import('node:fs/promises');
      const { existsSync } = await import('node:fs');
      
      // Clear TypeScript build info files that might contain cached type information
      const buildInfoPaths = [
        join(process.cwd(), 'packages/database-types/.tsbuildinfo'),
        join(process.cwd(), 'packages/web-runtime/.tsbuildinfo'),
        join(process.cwd(), 'apps/web/.tsbuildinfo'),
      ];
      
      for (const buildInfoPath of buildInfoPaths) {
        if (existsSync(buildInfoPath)) {
          try {
            await unlink(buildInfoPath);
          } catch (error) {
            // Ignore errors - file might be locked or already deleted
          }
        }
      }
    } catch (error) {
      // Non-critical - continue even if cache clearing fails
      // This is a best-effort cleanup to prevent stale type resolution
    }

    // Ensure output directories exist
    const outputDir = config.output;
    const functionsDir = join(outputDir, 'functions');
    const compositesDir = join(outputDir, 'composites');
    await mkdir(functionsDir, { recursive: true });
    await mkdir(compositesDir, { recursive: true });
    
    // Clean up old function files that no longer exist in the database
    // This ensures removed RPCs don't leave stale type files
    try {
      const existingFunctionFiles = await readdir(functionsDir);
      const generatedFunctionNames = new Set(
        Object.keys(functionOutput.files).map(name => `${name}.ts`)
      );
      
      // Also include .d.ts and .d.ts.map files for cleanup
      for (const file of existingFunctionFiles) {
        if (file === 'index.ts' || file === 'index.d.ts' || file === 'index.d.ts.map') {
          continue; // Don't delete index files
        }
        
        const baseName = file.replace(/\.(ts|d\.ts|d\.ts\.map)$/, '');
        const shouldExist = generatedFunctionNames.has(`${baseName}.ts`);
        
        if (!shouldExist) {
          // Delete old function file and its .d.ts/.d.ts.map files
          const filesToDelete = [
            join(functionsDir, `${baseName}.ts`),
            join(functionsDir, `${baseName}.d.ts`),
            join(functionsDir, `${baseName}.d.ts.map`),
          ];
          
          for (const filePath of filesToDelete) {
            try {
              await unlink(filePath);
            } catch (error) {
              // File might not exist, ignore error
            }
          }
        }
      }
    } catch (error) {
      // If directory doesn't exist yet, that's fine - it will be created
      if ((error as { code?: string }).code !== 'ENOENT') {
        throw error;
      }
    }
    
    // Clean up old composite type files that no longer exist in the database
    // ARCHITECTURAL FIX: Also delete excluded composite types from both src and dist
    try {
      const existingCompositeFiles = await readdir(compositesDir);
      const generatedCompositeNames = new Set(
        Object.keys(compositeOutput.files).map(name => `${name}.ts`)
      );
      
      // Also track excluded composite types that should be deleted
      const excludedCompositeNames = new Set(
        config.excludeCompositeTypes || []
      );
      
      for (const file of existingCompositeFiles) {
        if (file === 'index.ts' || file === 'index.d.ts' || file === 'index.d.ts.map') {
          continue; // Don't delete index files
        }
        
        const baseName = file.replace(/\.(ts|d\.ts|d\.ts\.map)$/, '');
        const shouldExist = generatedCompositeNames.has(`${baseName}.ts`);
        const isExcluded = excludedCompositeNames.has(baseName);
        
        if (!shouldExist || isExcluded) {
          // Delete old composite file and its .d.ts/.d.ts.map files from src
          const filesToDelete = [
            join(compositesDir, `${baseName}.ts`),
            join(compositesDir, `${baseName}.d.ts`),
            join(compositesDir, `${baseName}.d.ts.map`),
          ];
          
          for (const filePath of filesToDelete) {
            try {
              await unlink(filePath);
            } catch (error) {
              // File might not exist, ignore error
            }
          }
          
          // ARCHITECTURAL FIX: Also delete from dist directory
          // This is critical - TypeScript resolves types from dist, not src
          const distCompositesDir = join(process.cwd(), 'packages/database-types/dist/postgres-types/composites');
          const distFilesToDelete = [
            join(distCompositesDir, `${baseName}.d.ts`),
            join(distCompositesDir, `${baseName}.d.ts.map`),
            join(distCompositesDir, `${baseName}.js`),
            join(distCompositesDir, `${baseName}.js.map`),
          ];
          
          for (const filePath of distFilesToDelete) {
            try {
              await unlink(filePath);
            } catch (error) {
              // File might not exist, ignore error
            }
          }
        }
      }
    } catch (error) {
      // If directory doesn't exist yet, that's fine - it will be created
      if ((error as { code?: string }).code !== 'ENOENT') {
        throw error;
      }
    }
    
    // Write enum schema files to prisma-zod-generator's enum schemas location
    // This replaces the official package's incorrect enum schemas with correct ones
    if (config.generateZod && enumOutput.files) {
      // Determine the prisma-zod-generator output path from Prisma schema
      // The official generator outputs to: packages/database-types/src/prisma/zod
      // We need to output enum schemas to: packages/database-types/src/prisma/zod/schemas/enums/
      const prismaZodOutput = join(process.cwd(), 'packages/database-types/src/prisma/zod');
      const enumSchemasDir = join(prismaZodOutput, 'schemas', 'enums');
      await mkdir(enumSchemasDir, { recursive: true });
      
      for (const [fileName, content] of Object.entries(enumOutput.files)) {
        const filePath = join(enumSchemasDir, fileName);
        await writeFile(filePath, content, 'utf-8');
      }
    }

    // Write function files
    for (const [functionName, content] of Object.entries(functionOutput.files)) {
      const filePath = join(functionsDir, `${functionName}.ts`);
      await writeFile(filePath, content, 'utf-8');
    }

    // Write composite files
    for (const [compositeName, content] of Object.entries(compositeOutput.files)) {
      const filePath = join(compositesDir, `${compositeName}.ts`);
      await writeFile(filePath, content, 'utf-8');
    }

    // Write index files
    const functionsIndex = generateIndexFile(functionOutput.exports, 'functions');
    await writeFile(join(functionsDir, 'index.ts'), functionsIndex, 'utf-8');

    const compositesIndex = generateIndexFile(compositeOutput.exports, 'composites');
    await writeFile(join(compositesDir, 'index.ts'), compositesIndex, 'utf-8');

    // ARCHITECTURAL FIX: Also update dist index to remove excluded composite exports
    // TypeScript resolves types from dist, so we must keep dist in sync with src
    try {
      const distCompositesIndexPath = join(process.cwd(), 'packages/database-types/dist/postgres-types/composites/index.d.ts');
      const { existsSync } = await import('node:fs');
      if (existsSync(distCompositesIndexPath)) {
        const distIndexContent = await readFile(distCompositesIndexPath, 'utf-8');
        // Remove exports for excluded composite types
        const excludedPatterns = config.excludeCompositeTypes || [];
        let updatedContent = distIndexContent;
        for (const pattern of excludedPatterns) {
          const regex = new RegExp(`export \\* from ['"]\\./${pattern.replace(/\*/g, '.*')}['"];?\\n?`, 'g');
          updatedContent = updatedContent.replace(regex, '');
        }
        await writeFile(distCompositesIndexPath, updatedContent, 'utf-8');
      }
    } catch (error) {
      // Non-critical - dist index might not exist yet or might be locked
      // The build process will regenerate it
    }

    // Write main index file
    const mainIndex = generateMainIndexFile(functionOutput.exports, compositeOutput.exports);
    await writeFile(join(outputDir, 'index.ts'), mainIndex, 'utf-8');

    // ============================================
    // Post-Generation Fixes
    // ============================================
    // These files are deleted/overwritten by Prisma generators and need to be recreated/fixed
    // This ensures @heyclaude/database-types/prisma exports work correctly
    
    // 1. Create/update packages/database-types/src/prisma/index.ts barrel export
    const prismaIndexPath = join(process.cwd(), 'packages/database-types/src/prisma/index.ts');
    const prismaIndexContent = `/**
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
    await writeFile(prismaIndexPath, prismaIndexContent, 'utf-8');

    // 2. Fix pjtg.ts import extension (prisma-json-types-generator generates without .ts extension)
    // This must run AFTER json-types generator, so we're placed after it in schema.prisma
    const pjtgPath = join(process.cwd(), 'packages/database-types/src/prisma/pjtg.ts');
    try {
      const pjtgContent = await readFile(pjtgPath, 'utf-8');
      // Fix the import to use .ts extension for NodeNext module resolution
      const fixedPjtgContent = pjtgContent.replace(
        "import * as Prisma from './internal/prismaNamespace';",
        "import * as Prisma from './internal/prismaNamespace.ts';"
      );
      
      if (pjtgContent !== fixedPjtgContent) {
        await writeFile(pjtgPath, fixedPjtgContent, 'utf-8');
      }
    } catch (error) {
      // pjtg.ts might not exist in some configurations, that's okay
      // This is a non-critical fix
    }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      // Use console.error for Prisma generator output (standard for generators)
      // This is acceptable as generators run during build time and need direct output
      console.error('❌ Prisma PostgreSQL Types Generator failed:');
      console.error(`   Error: ${errorMessage}`);
      if (errorStack) {
        console.error(`   Stack: ${errorStack.split('\n').slice(0, 5).join('\n')}`);
      }
      
      throw error;
    }
  },
});

/**
 * Generate index file with barrel exports
 */
function generateIndexFile(exports: string[], type: 'functions' | 'composites'): string {
  const lines = [
    '/**',
    ` * ${type === 'functions' ? 'PostgreSQL Function' : 'PostgreSQL Composite Type'} Types`,
    ' * ',
    ' * 🔒 AUTO-GENERATED - DO NOT EDIT',
    ` * Generated by prisma-postgres-types-generator`,
    ' */',
    '',
  ];

  for (const exportName of exports) {
    lines.push(`export * from './${exportName}';`);
  }

  return lines.join('\n');
}

/**
 * Generate main index file
 */
function generateMainIndexFile(
  functionExports: string[],
  compositeExports: string[]
): string {
  const lines = [
    '/**',
    ' * PostgreSQL Functions & Composite Types',
    ' * ',
    ' * 🔒 AUTO-GENERATED - DO NOT EDIT',
    ' * Generated by prisma-postgres-types-generator',
    ' * ',
    ' * This module exports TypeScript types and Zod schemas for:',
    ' * - PostgreSQL functions (RPCs)',
    ` *   (${functionExports.length} function${functionExports.length !== 1 ? 's' : ''})`,
    ' * - PostgreSQL composite types',
    ` *   (${compositeExports.length} composite type${compositeExports.length !== 1 ? 's' : ''})`,
    ' */',
    '',
    '/**',
    ' * PostgreSQL Function Types',
    ' */',
      "export * from './functions';",
    '',
    '/**',
    ' * PostgreSQL Composite Types',
    ' */',
      "export * from './composites';",
    '',
  ];

  return lines.join('\n');
}
