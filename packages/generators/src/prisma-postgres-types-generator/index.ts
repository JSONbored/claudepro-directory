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
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { generateCompositeTypes } from './composite-generator.ts';
import { generateEnumSchemas } from './enum-generator.ts';
import { generateFunctionTypes } from './function-generator.ts';
import { introspectDatabase } from './introspect.ts';
import type { GeneratorConfig } from './types.ts';

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

    // Generate types and schemas
    const functionOutput = config.generateTypes || config.generateZod
      ? await generateFunctionTypes(
          functions, 
          metadata.compositeTypes, 
          metadata.enums, 
          metadata.functionReturnStructures,
          config
        )
      : { files: {}, exports: [] };

    const compositeOutput = config.generateTypes || config.generateZod
      ? await generateCompositeTypes(metadata.compositeTypes, metadata.enums, config)
      : { files: {}, exports: [] };

    // Generate enum schemas (matching prisma-zod-generator format but with correct database values)
    // Output to prisma-zod-generator's location to replace/fix its incorrect enum schemas
    const enumOutput = config.generateZod
      ? generateEnumSchemas(metadata.enums, config)
      : { files: {}, exports: [] };

    // Ensure output directories exist
    const outputDir = config.output;
    const functionsDir = join(outputDir, 'functions');
    const compositesDir = join(outputDir, 'composites');
    await mkdir(functionsDir, { recursive: true });
    await mkdir(compositesDir, { recursive: true });
    
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
