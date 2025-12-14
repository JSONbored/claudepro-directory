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
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { generateCompositeTypes } from './composite-generator.ts';
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
        schema: (generator.config?.schema as string) || 'public',
        generateTypes: generator.config?.generateTypes !== false,
        generateZod: generator.config?.generateZod !== false,
        includeFunctions: generator.config?.includeFunctions as string[] | undefined,
        excludeFunctions: generator.config?.excludeFunctions as string[] | undefined,
      };

      // Get database connection string from datasource
      // Prisma generator helper provides datasources in options.datasources or options.dmmf.datasources
      const datasources = options.datasources || options.dmmf?.datasources || [];
      const datasource = datasources[0];
      if (!datasource) {
        throw new Error('No datasource found in Prisma schema');
      }

      // Extract connection string from environment variable or direct value
      // datasource.url can be a string or an object with .value property
      const urlValue = typeof datasource.url === 'string' 
        ? datasource.url 
        : datasource.url?.value || datasource.url?.fromEnvVar 
          ? process.env[datasource.url.fromEnvVar] || ''
          : '';

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

    // Ensure output directories exist
    const outputDir = config.output;
    const functionsDir = join(outputDir, 'functions');
    const compositesDir = join(outputDir, 'composites');
    await mkdir(functionsDir, { recursive: true });
    await mkdir(compositesDir, { recursive: true });

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
    ' * - PostgreSQL composite types',
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
