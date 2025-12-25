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

import { env } from '@heyclaude/shared-runtime/schemas/env';

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

      // Validate generator configuration
      const output = generator.output?.value;
      if (!output || typeof output !== 'string') {
        throw new Error(
          'Generator configuration error: "output" is required and must be a string. ' +
            'Example: output = "../packages/database-types/src/postgres-types"'
        );
      }

      const schema = generator.config?.['schema'];
      if (schema !== undefined && typeof schema !== 'string') {
        throw new Error(
          'Generator configuration error: "schema" must be a string. ' +
            'Example: schema = "public"'
        );
      }

      // Prisma passes boolean values as strings from schema.prisma
      // Parse "true"/"false" strings to booleans
      const generateTypesRaw = generator.config?.['generateTypes'];
      let generateTypes: boolean | undefined;
      if (generateTypesRaw !== undefined) {
        if (typeof generateTypesRaw === 'boolean') {
          generateTypes = generateTypesRaw;
        } else if (typeof generateTypesRaw === 'string') {
          generateTypes = generateTypesRaw.toLowerCase() === 'true';
        } else {
          throw new Error(
            'Generator configuration error: "generateTypes" must be a boolean or string ("true"/"false"). ' +
              'Example: generateTypes = true'
          );
        }
      }

      const generateZodRaw = generator.config?.['generateZod'];
      let generateZod: boolean | undefined;
      if (generateZodRaw !== undefined) {
        if (typeof generateZodRaw === 'boolean') {
          generateZod = generateZodRaw;
        } else if (typeof generateZodRaw === 'string') {
          generateZod = generateZodRaw.toLowerCase() === 'true';
        } else {
          throw new Error(
            'Generator configuration error: "generateZod" must be a boolean or string ("true"/"false"). ' +
              'Example: generateZod = true'
          );
        }
      }

      // Validate include/exclude patterns
      const includeFunctions = generator.config?.['includeFunctions'];
      if (includeFunctions !== undefined) {
        if (!Array.isArray(includeFunctions)) {
          throw new Error(
            'Generator configuration error: "includeFunctions" must be an array of strings. ' +
              'Example: includeFunctions = ["get_*", "filter_*"]'
          );
        }
        if (includeFunctions.some((pattern) => typeof pattern !== 'string')) {
          throw new Error(
            'Generator configuration error: "includeFunctions" array must contain only strings.'
          );
        }
      }

      const excludeFunctions = generator.config?.['excludeFunctions'];
      if (excludeFunctions !== undefined) {
        if (!Array.isArray(excludeFunctions)) {
          throw new Error(
            'Generator configuration error: "excludeFunctions" must be an array of strings. ' +
              'Example: excludeFunctions = ["internal_*"]'
          );
        }
        if (excludeFunctions.some((pattern) => typeof pattern !== 'string')) {
          throw new Error(
            'Generator configuration error: "excludeFunctions" array must contain only strings.'
          );
        }
      }

      const excludeCompositeTypes = generator.config?.['excludeCompositeTypes'];
      if (excludeCompositeTypes !== undefined) {
        if (!Array.isArray(excludeCompositeTypes)) {
          throw new Error(
            'Generator configuration error: "excludeCompositeTypes" must be an array of strings. ' +
              'Example: excludeCompositeTypes = ["announcements", "content"]'
          );
        }
        if (excludeCompositeTypes.some((pattern) => typeof pattern !== 'string')) {
          throw new Error(
            'Generator configuration error: "excludeCompositeTypes" array must contain only strings.'
          );
        }
      }

      // Check for conflicting include/exclude patterns
      if (includeFunctions && excludeFunctions) {
        const conflicts = includeFunctions.filter((inc) =>
          excludeFunctions.some((exc) => {
            // Simple conflict detection: if include pattern matches exclude pattern
            const incRegex = new RegExp('^' + inc.replace(/\*/g, '.*') + '$');
            const excRegex = new RegExp('^' + exc.replace(/\*/g, '.*') + '$');
            return incRegex.test(exc) || excRegex.test(inc);
          })
        );
        if (conflicts.length > 0) {
          throw new Error(
            `Generator configuration error: Conflicting include/exclude patterns detected: ${conflicts.join(', ')}. ` +
              'A function cannot be both included and excluded.'
          );
        }
      }

      // Parse generator configuration (after validation)
      const config: GeneratorConfig = {
        output: output || './dist/prisma/postgres-types',
        schema: (schema as string) || 'public',
        generateTypes: generateTypes !== false,
        generateZod: generateZod !== false,
        ...(includeFunctions ? { includeFunctions: includeFunctions as string[] } : {}),
        ...(excludeFunctions ? { excludeFunctions: excludeFunctions as string[] } : {}),
        ...(excludeCompositeTypes
          ? { excludeCompositeTypes: excludeCompositeTypes as string[] }
          : {}),
      };

      // Get database connection string
      // Prisma 7.1.0+ uses prisma.config.ts which may not pass resolved URL to generators
      // Read DIRECT_URL directly from environment (Prisma 7.1.0+ uses it for migrations/introspection)
      // Fallback to POSTGRES_PRISMA_URL for compatibility
      // Uses isomorphic env schema for type-safe, validated access
      // Type assertion needed because these are server-only env vars but generator runs at build time
      let connectionString =
        (env as { DIRECT_URL?: string; POSTGRES_PRISMA_URL?: string }).DIRECT_URL ||
        (env as { DIRECT_URL?: string; POSTGRES_PRISMA_URL?: string }).POSTGRES_PRISMA_URL ||
        '';

      // Try to get from Prisma's datasource if available (for compatibility with older Prisma versions)
      if (!connectionString) {
        const datasources =
          options.datasources ||
          (options.dmmf as { datasources?: unknown[] } | undefined)?.datasources ||
          [];
        const datasource = datasources[0] as
          | { url?: string | { value?: string; fromEnvVar?: string } }
          | undefined;

        if (datasource && datasource.url) {
          // Extract connection string from environment variable or direct value
          const urlValue =
            typeof datasource.url === 'string'
              ? datasource.url
              : (datasource.url as { value?: string; fromEnvVar?: string })?.value ||
                ((datasource.url as { fromEnvVar?: string })?.fromEnvVar
                  ? (env[datasource.url.fromEnvVar as keyof typeof env] as string | undefined) || ''
                  : '');

          if (urlValue.startsWith('env("') || urlValue.startsWith("env('")) {
            // Extract env var name: env("VAR_NAME") or env('VAR_NAME')
            const envVar = urlValue.replace(/^env\(["']/, '').replace(/["']\)$/, '');
            // Dynamic access to env schema (for Prisma datasource env() syntax)
            connectionString = (env[envVar as keyof typeof env] as string | undefined) || '';
          } else if (urlValue) {
            connectionString = urlValue;
          }
        }
      }

      if (!connectionString) {
        // During prisma validate, we don't need actual database connection
        // Skip introspection if connection string is not available (validation mode)
        // This allows schema validation to pass without database connection
        // For actual generation, connection string is required
        // PRISMA_VALIDATE is not in schema, use process.env directly for this build-time flag
        const isValidationMode =
          (typeof process !== 'undefined' && process.env?.['PRISMA_VALIDATE'] === 'true') ||
          process.argv.includes('validate') ||
          !process.argv.includes('generate');

        if (isValidationMode) {
          // During validation, skip introspection and return empty metadata
          // This allows schema validation to pass without database connection
          return {
            functions: [],
            compositeTypes: [],
            enums: [],
          };
        }

        throw new Error(
          'Database connection string not found. Please set DIRECT_URL (for Prisma 7.1.0+ migrations/introspection) or POSTGRES_PRISMA_URL environment variable.\n' +
            'For local development: infisical run --env=dev -- prisma generate\n' +
            'For CI/CD: Ensure DIRECT_URL is set in your environment variables.\n' +
            'For Supabase: Get connection string from Project Settings > Database > Connection string (Session mode, port 5432)'
        );
      }

      // Validate connection string format (basic check)
      if (!connectionString.match(/^(postgresql|postgres|pgsql):\/\//i)) {
        throw new Error(
          `Invalid connection string format. Expected postgresql://, postgres://, or pgsql:// prefix.\n` +
            `Received: ${connectionString.substring(0, 50)}...\n` +
            `Please check your DIRECT_URL or POSTGRES_PRISMA_URL environment variable.`
        );
      }

      // Introspect database
      // Note: Progress reporting is handled by Prisma's generator output
      // We use console.log here as generators run during build time and need direct output
      // This is acceptable per logging standards (generators are build-time tools)
      // eslint-disable-next-line architectural-rules/no-console-calls -- Generators need direct console output for progress
      console.log('🔍 Introspecting PostgreSQL database...');
      const metadata = await introspectDatabase(connectionString, config.schema);
      // eslint-disable-next-line architectural-rules/no-console-calls -- Generators need direct console output for progress
      console.log(
        `✅ Found ${Object.keys(metadata.functions).length} functions, ${Object.keys(metadata.compositeTypes).length} composite types, ${Object.keys(metadata.enums).length} enums`
      );

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
      // Patterns support exact matches and wildcards (*)
      let filteredCompositeTypes = metadata.compositeTypes;
      if (config.excludeCompositeTypes) {
        filteredCompositeTypes = Object.fromEntries(
          Object.entries(metadata.compositeTypes).filter(([name]) => {
            const matches = config.excludeCompositeTypes!.some((pattern) => {
              // If pattern contains *, treat as wildcard pattern
              if (pattern.includes('*')) {
                const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
                return regex.test(name);
              }
              // Otherwise, use exact match (not substring match)
              // This prevents "content" from matching "search_content_optimized_result"
              return name === pattern;
            });
            return !matches; // Exclude if matches pattern
          })
        );
      }

      // Generate types and schemas
      // eslint-disable-next-line architectural-rules/no-console-calls -- Generators need direct console output for progress
      console.log('📝 Generating function types and schemas...');
      const functionOutput =
        config.generateTypes || config.generateZod
          ? await generateFunctionTypes(
              functions,
              filteredCompositeTypes, // Use filtered composite types
              metadata.enums,
              metadata.functionReturnStructures,
              config
            )
          : { files: {}, exports: [] };
      // eslint-disable-next-line architectural-rules/no-console-calls -- Generators need direct console output for progress
      console.log(`✅ Generated ${Object.keys(functionOutput.files).length} function type files`);

      // ROOT CAUSE FIX: Only generate composite types that are actually used by functions
      // This prevents generating types for unused composite types (e.g., from deleted functions)
      // Helper function to extract composite type from a type string (similar to function-generator.ts)
      function stripSchemaPrefix(typeName: string): string {
        if (!typeName) return typeName;
        // Remove quotes first
        let cleaned = typeName.replace(/["']/g, '');
        // Handle schema-qualified names: public.type_name or "public"."type_name"
        // Match: schema.type or "schema"."type"
        const schemaMatch = cleaned.match(/^([a-z_][a-z0-9_]*\.)?([a-z_][a-z0-9_]*)$/i);
        if (schemaMatch && schemaMatch[2]) {
          return schemaMatch[2]; // Return just the type name without schema
        }
        return cleaned;
      }

      function extractBaseCompositeTypeFromString(
        typeString: string,
        compositeTypes: Record<string, CompositeTypeAttribute[]>
      ): string | null {
        if (!typeString) return null;

        // Normalize the type string first (remove quotes, whitespace)
        const normalized = typeString.trim().replace(/["']/g, '');

        // Handle SETOF (returns set of rows)
        if (normalized.toUpperCase().includes('SETOF')) {
          const baseTypeMatch = normalized.match(/SETOF\s+([\w.]+)/i);
          if (baseTypeMatch?.[1]) {
            const baseType = stripSchemaPrefix(baseTypeMatch[1]);
            if (compositeTypes[baseType]) {
              return baseType;
            }
            // Recursively check if it's an array or nested composite
            return extractBaseCompositeTypeFromString(baseType, compositeTypes);
          }
          return null;
        }

        // Handle array types (prefixed with _ in PostgreSQL)
        if (normalized.startsWith('_')) {
          const baseType = stripSchemaPrefix(normalized.slice(1));
          if (compositeTypes[baseType]) {
            return baseType;
          }
          // Recursively check nested arrays or composites
          return extractBaseCompositeTypeFromString(baseType, compositeTypes);
        }

        // Handle explicit array notation ([])
        if (normalized.includes('[]')) {
          const baseType = stripSchemaPrefix(normalized.replace(/\[\]/g, ''));
          if (compositeTypes[baseType]) {
            return baseType;
          }
          // Recursively check nested arrays
          return extractBaseCompositeTypeFromString(baseType, compositeTypes);
        }

        // Strip schema prefix and check direct composite type
        const normalizedType = stripSchemaPrefix(normalized);

        // Direct composite type match
        if (compositeTypes[normalizedType]) {
          return normalizedType;
        }

        // Try case-insensitive match as fallback (PostgreSQL is case-insensitive for unquoted identifiers)
        const lowerNormalized = normalizedType.toLowerCase();
        for (const [compositeName] of Object.entries(compositeTypes)) {
          if (compositeName.toLowerCase() === lowerNormalized) {
            return compositeName; // Return the actual key (preserves case)
          }
        }

        return null;
      }

      const usedCompositeTypes = new Set<string>();

      // Collect all composite types used by functions
      for (const [functionName, functionMeta] of Object.entries(functions)) {
        // Check function arguments
        for (const arg of functionMeta.args || []) {
          const baseType = extractBaseCompositeTypeFromString(
            arg.udtName || '',
            filteredCompositeTypes
          );
          if (baseType) {
            usedCompositeTypes.add(baseType);
          }
        }

        // Check return type
        if (functionMeta.returnType) {
          const baseType = extractBaseCompositeTypeFromString(
            functionMeta.returnType,
            filteredCompositeTypes
          );
          if (baseType) {
            usedCompositeTypes.add(baseType);
          } else {
            // Fallback: Try direct match after schema stripping
            const normalizedReturnType = stripSchemaPrefix(functionMeta.returnType);
            if (filteredCompositeTypes[normalizedReturnType]) {
              // Direct match found - add it (this handles edge cases where extraction didn't work)
              usedCompositeTypes.add(normalizedReturnType);
            } else {
              // Additional fallback: Try case-insensitive match
              const lowerNormalized = normalizedReturnType.toLowerCase();
              for (const [compositeName] of Object.entries(filteredCompositeTypes)) {
                if (compositeName.toLowerCase() === lowerNormalized) {
                  usedCompositeTypes.add(compositeName);
                  break;
                }
              }
            }
          }
        }

        // Check function return structures (for SETOF record functions)
        if (metadata.functionReturnStructures[functionName]) {
          for (const attr of metadata.functionReturnStructures[functionName]) {
            const baseType = extractBaseCompositeTypeFromString(
              attr.udtName || '',
              filteredCompositeTypes
            );
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
          const baseType = extractBaseCompositeTypeFromString(
            attr.udtName || '',
            filteredCompositeTypes
          );
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
        Object.entries(filteredCompositeTypes).filter(([name]) => allUsedCompositeTypes.has(name))
      );

      // eslint-disable-next-line architectural-rules/no-console-calls -- Generators need direct console output for progress
      console.log('📝 Generating composite type definitions...');
      const compositeOutput =
        config.generateTypes || config.generateZod
          ? await generateCompositeTypes(usedCompositeTypesRecord, metadata.enums, config)
          : { files: {}, exports: [] };
      // eslint-disable-next-line architectural-rules/no-console-calls -- Generators need direct console output for progress
      console.log(`✅ Generated ${Object.keys(compositeOutput.files).length} composite type files`);

      // Generate enum schemas (matching prisma-zod-generator format but with correct database values)
      // Output to prisma-zod-generator's location to replace/fix its incorrect enum schemas
      // eslint-disable-next-line architectural-rules/no-console-calls -- Generators need direct console output for progress
      console.log('📝 Generating enum schemas...');
      const enumOutput = config.generateZod
        ? generateEnumSchemas(metadata.enums, config)
        : { files: {}, exports: [] };
      // eslint-disable-next-line architectural-rules/no-console-calls -- Generators need direct console output for progress
      console.log(`✅ Generated ${Object.keys(enumOutput.files).length} enum schema files`);

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
          Object.keys(functionOutput.files).map((name) => `${name}.ts`)
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
          Object.keys(compositeOutput.files).map((name) => `${name}.ts`)
        );

        // Also track excluded composite types that should be deleted
        const excludedCompositeNames = new Set(config.excludeCompositeTypes || []);

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
            const distCompositesDir = join(
              process.cwd(),
              'packages/database-types/dist/postgres-types/composites'
            );
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
      // eslint-disable-next-line architectural-rules/no-console-calls -- Generators need direct console output for progress
      console.log('💾 Writing generated files...');
      const writePromises: Array<Promise<void>> = [];

      for (const [functionName, content] of Object.entries(functionOutput.files)) {
        const filePath = join(functionsDir, `${functionName}.ts`);
        writePromises.push(writeFile(filePath, content, 'utf-8'));
      }

      // Write composite files
      for (const [compositeName, content] of Object.entries(compositeOutput.files)) {
        const filePath = join(compositesDir, `${compositeName}.ts`);
        writePromises.push(writeFile(filePath, content, 'utf-8'));
      }

      // Write enum schema files to prisma-zod-generator's enum schemas location
      if (config.generateZod && enumOutput.files) {
        const prismaZodOutput = join(process.cwd(), 'packages/database-types/src/prisma/zod');
        const enumSchemasDir = join(prismaZodOutput, 'schemas', 'enums');
        await mkdir(enumSchemasDir, { recursive: true });

        for (const [fileName, content] of Object.entries(enumOutput.files)) {
          const filePath = join(enumSchemasDir, fileName);
          writePromises.push(writeFile(filePath, content, 'utf-8'));
        }
      }

      // Write all files in parallel
      await Promise.all(writePromises);
      // eslint-disable-next-line architectural-rules/no-console-calls -- Generators need direct console output for progress
      console.log(`✅ Wrote ${writePromises.length} files`);

      // Write index files
      const functionsIndex = generateIndexFile(functionOutput.exports, 'functions');
      await writeFile(join(functionsDir, 'index.ts'), functionsIndex, 'utf-8');

      const compositesIndex = generateIndexFile(compositeOutput.exports, 'composites');
      await writeFile(join(compositesDir, 'index.ts'), compositesIndex, 'utf-8');

      // ARCHITECTURAL FIX: Also update dist index to remove excluded composite exports
      // TypeScript resolves types from dist, so we must keep dist in sync with src
      try {
        const distCompositesIndexPath = join(
          process.cwd(),
          'packages/database-types/dist/postgres-types/composites/index.d.ts'
        );
        const { existsSync } = await import('node:fs');
        if (existsSync(distCompositesIndexPath)) {
          const distIndexContent = await readFile(distCompositesIndexPath, 'utf-8');
          // Remove exports for excluded composite types
          const excludedPatterns = config.excludeCompositeTypes || [];
          let updatedContent = distIndexContent;
          for (const pattern of excludedPatterns) {
            const regex = new RegExp(
              `export \\* from ['"]\\./${pattern.replace(/\*/g, '.*')}['"];?\\n?`,
              'g'
            );
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
 * 
 * Prisma generates to default location: node_modules/.prisma/client
 * prisma-json-types-generator modifies the Prisma client files directly in that location.
 * This index file re-exports from @prisma/client for convenience.
 * 
 * NOTE: This file is recreated automatically after \`prisma generate\` runs.
 * 
 * The PrismaJson namespace (from prisma-json-types-generator) is available globally
 * via declaration merging. See packages/database-types/src/prisma-json-types.ts
 */

// Re-export PrismaClient and Prisma namespace from default Prisma location
// Prisma namespace contains both types and enum value objects
// Note: Prisma is both a type and a value namespace - export once, TypeScript handles both
export { PrismaClient, Prisma } from '@prisma/client';

// Re-export all enum types from @prisma/client
// Enum value objects are available via Prisma namespace (e.g., Prisma.content_category)
export type * from '@prisma/client';
`;
      await writeFile(prismaIndexPath, prismaIndexContent, 'utf-8');

      // Explicit return to satisfy TypeScript's "not all code paths return a value" check
      return;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      // Clean up TypeScript build caches after failure to prevent stale types
      // This ensures failed generations don't leave corrupted type information
      try {
        const { unlink } = await import('node:fs/promises');
        const { existsSync } = await import('node:fs');

        const buildInfoPaths = [
          join(process.cwd(), 'packages/database-types/.tsbuildinfo'),
          join(process.cwd(), 'packages/web-runtime/.tsbuildinfo'),
          join(process.cwd(), 'apps/web/.tsbuildinfo'),
        ];

        for (const buildInfoPath of buildInfoPaths) {
          if (existsSync(buildInfoPath)) {
            try {
              await unlink(buildInfoPath);
            } catch {
              // Ignore errors - file might be locked
            }
          }
        }
      } catch {
        // Non-critical - continue with error reporting even if cache cleanup fails
      }

      // Use console.error for Prisma generator output (standard for generators)
      // This is acceptable as generators run during build time and need direct output
      // eslint-disable-next-line architectural-rules/no-console-calls -- Generators need direct console output for errors
      console.error('❌ Prisma PostgreSQL Types Generator failed:');
      // eslint-disable-next-line architectural-rules/no-console-calls -- Generators need direct console output for errors
      console.error(`   Error: ${errorMessage}`);
      if (errorStack) {
        // eslint-disable-next-line architectural-rules/no-console-calls -- Generators need direct console output for errors
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
function generateMainIndexFile(functionExports: string[], compositeExports: string[]): string {
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
