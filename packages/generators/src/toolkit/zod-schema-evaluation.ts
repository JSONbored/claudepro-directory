/**
 * Shared Zod Schema Evaluation Utilities
 *
 * Provides reusable utilities for evaluating Zod schemas at runtime using jiti.
 * Used by both main OpenAPI generator and MCP OpenAPI generator.
 *
 * Features:
 * - Runtime schema evaluation using jiti
 * - Workspace package resolution (@heyclaude/*)
 * - Schema extraction with dependency resolution
 * - Example generation from Zod schemas
 */

import { join, dirname } from 'node:path';
import { existsSync, writeFileSync, unlinkSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { Project, Node } from 'ts-morph';
import jiti from 'jiti';
import { z } from 'zod';

/**
 * Project root path (calculated from caller's location)
 */
let PROJECT_ROOT_CACHE: string | null = null;

/**
 * Get or calculate project root
 */
export function getProjectRoot(): string {
  if (PROJECT_ROOT_CACHE) {
    return PROJECT_ROOT_CACHE;
  }

  // Try to find project root by looking for apps/web or apps/workers
  const possibleRoots = [
    process.cwd(),
    join(process.cwd(), '..'),
    join(process.cwd(), '../..'),
  ];

  for (const root of possibleRoots) {
    if (existsSync(join(root, 'apps/web')) || existsSync(join(root, 'apps/workers'))) {
      PROJECT_ROOT_CACHE = root;
      return root;
    }
  }

  // Fallback to process.cwd()
  PROJECT_ROOT_CACHE = process.cwd();
  return process.cwd();
}

/**
 * Set project root (for testing or explicit configuration)
 */
export function setProjectRoot(root: string): void {
  PROJECT_ROOT_CACHE = root;
}

/**
 * Workspace package map for @heyclaude/* imports
 */
const WORKSPACE_PACKAGE_MAP: Record<string, string> = {
  '@heyclaude/web-runtime': 'packages/web-runtime/src/index.ts',
  '@heyclaude/web-runtime/server': 'packages/web-runtime/src/server.ts',
  '@heyclaude/web-runtime/api/schemas': 'packages/web-runtime/src/api/schemas.ts',
  '@heyclaude/web-runtime/api/response-schemas': 'packages/web-runtime/src/api/response-schemas.ts',
  '@heyclaude/shared-runtime': 'packages/shared-runtime/src/index.ts',
  '@heyclaude/data-layer': 'packages/data-layer/src/index.ts',
  '@heyclaude/data-layer/prisma': 'packages/data-layer/src/prisma/index.ts',
  '@heyclaude/database-types': 'packages/database-types/src/index.ts',
  '@heyclaude/database-types/prisma': 'packages/database-types/src/prisma/index.ts',
  '@heyclaude/mcp-server': 'packages/mcp-server/src/index.ts',
};

/**
 * Resolve workspace package import to source file path
 */
export function resolveWorkspacePackage(moduleSpecifier: string, projectRoot?: string): string | null {
  const root = projectRoot || getProjectRoot();

  if (!moduleSpecifier.startsWith('@heyclaude/')) {
    return null;
  }

  // Check exact match first
  if (WORKSPACE_PACKAGE_MAP[moduleSpecifier]) {
    const path = join(root, WORKSPACE_PACKAGE_MAP[moduleSpecifier]);
    if (existsSync(path)) {
      return path;
    }
  }

  // Try to resolve subpath imports (e.g., @heyclaude/web-runtime/something)
  for (const [pkg] of Object.entries(WORKSPACE_PACKAGE_MAP)) {
    if (moduleSpecifier.startsWith(pkg + '/') && moduleSpecifier !== pkg) {
      const subpath = moduleSpecifier.slice(pkg.length + 1);
      const packageName = pkg.replace('@heyclaude/', '');
      const packageRoot = join(root, 'packages', packageName, 'src');

      // Try direct file path
      const directPath = join(packageRoot, `${subpath}.ts`);
      if (existsSync(directPath)) {
        return directPath;
      }

      // Try index.ts in subdirectory
      const indexPath = join(packageRoot, subpath, 'index.ts');
      if (existsSync(indexPath)) {
        return indexPath;
      }
    }
  }

  return null;
}

/**
 * Resolve module specifier to absolute file path
 */
export async function resolveModuleSpecifier(
  specifier: string,
  fromFile: string,
  projectRoot?: string
): Promise<string | null> {
  const root = projectRoot || getProjectRoot();

  if (!fromFile || !specifier) {
    return null;
  }

  try {
    // Handle workspace packages
    if (specifier.startsWith('@heyclaude/')) {
      const resolved = resolveWorkspacePackage(specifier, root);
      if (resolved && existsSync(resolved)) {
        try {
          const stats = await stat(resolved);
          return stats.isFile() ? resolved : null;
        } catch {
          return null;
        }
      }
      return null;
    }

    // Handle relative imports
    if (specifier.startsWith('./') || specifier.startsWith('../')) {
      const fromDir = dirname(fromFile);
      const resolved = join(fromDir, specifier);

      // Try with .ts extension
      const withTs = resolved + '.ts';
      if (existsSync(withTs)) {
        try {
          const stats = await stat(withTs);
          if (stats.isFile()) return withTs;
        } catch {
          // Not a file
        }
      }

      // Try without extension (if it already has one)
      if (existsSync(resolved)) {
        try {
          const stats = await stat(resolved);
          if (stats.isFile()) return resolved;
        } catch {
          // Not a file
        }
      }

      // Try .tsx
      const withTsx = resolved + '.tsx';
      if (existsSync(withTsx)) {
        try {
          const stats = await stat(withTsx);
          if (stats.isFile()) return withTsx;
        } catch {
          // Not a file
        }
      }
    }
  } catch (error) {
    // Silently fail - return null
  }

  return null;
}

/**
 * Preprocess imports to resolve workspace packages
 */
export function preprocessImports(importCode: string, projectRoot?: string): string {
  const root = projectRoot || getProjectRoot();

  return importCode.replace(
    /from\s+['"](@heyclaude\/[^'"]+)['"]/g,
    (match, moduleSpecifier) => {
      const resolved = resolveWorkspacePackage(moduleSpecifier, root);
      if (resolved) {
        return `from '${resolved}'`;
      }
      return match; // Keep original if can't resolve
    }
  );
}

/**
 * Create jiti instance for schema evaluation
 */
export function createJitiInstance(projectRoot?: string): ReturnType<typeof jiti> {
  const root = projectRoot || getProjectRoot();
  return jiti(root, {
    interopDefault: true,
  });
}

/**
 * Check if a value is a Zod schema
 */
export function isZodSchema(value: unknown): value is z.ZodSchema {
  return (
    value !== null &&
    typeof value === 'object' &&
    ('_def' in value || value instanceof z.ZodType)
  );
}

/**
 * Extract schema from module by name
 */
export function extractSchemaFromModule(
  module: any,
  schemaName: string
): z.ZodSchema | null {
  if (!module || !module[schemaName]) {
    return null;
  }

  const schema = module[schemaName];
  if (isZodSchema(schema)) {
    return schema;
  }

  return null;
}

/**
 * Extract exported schema from source file using AST
 */
export async function extractExportedSchema(
  filePath: string,
  schemaName: string
): Promise<{ schemaCode: string; imports: string[] } | null> {
  const project = new Project({
    skipAddingFilesFromTsConfig: true,
    skipFileDependencyResolution: true,
    skipLoadingLibFiles: true,
  });

  const sourceFile = project.addSourceFileAtPathIfExists(filePath);
  if (!sourceFile) {
    return null;
  }

  // Find exported schema declaration
  let schemaDeclaration: Node | null = null;
  sourceFile.forEachDescendant((node) => {
    if (Node.isVariableStatement(node) && node.hasModifier('export')) {
      const declarationList = node.getDeclarationList();
      const declarations = declarationList.getDeclarations();
      for (const declaration of declarations) {
        if (declaration.getName() === schemaName) {
          schemaDeclaration = declaration;
          return;
        }
      }
    }
  });

  if (!schemaDeclaration) {
    return null;
  }

  if (!Node.isVariableDeclaration(schemaDeclaration)) {
    return null;
  }

  // TypeScript now knows schemaDeclaration is VariableDeclaration
  const varDecl = schemaDeclaration as import('ts-morph').VariableDeclaration;
  const initializer = varDecl.getInitializer();
  if (!initializer) {
    return null;
  }

  // Extract schema code
  const schemaCode = initializer.getText();

  // Extract imports
  const imports: string[] = [];
  for (const imp of sourceFile.getImportDeclarations()) {
    const spec = imp.getModuleSpecifierValue();
    const namedImports = imp.getNamedImports();
    if (namedImports.length > 0) {
      const named = namedImports.map((n) => n.getName()).join(', ');
      imports.push(`import { ${named} } from '${spec}';`);
    }
    const defaultImport = imp.getDefaultImport();
    if (defaultImport) {
      imports.push(`import ${defaultImport.getText()} from '${spec}';`);
    }
  }

  return { schemaCode, imports };
}

/**
 * Extract schema imports needed for evaluation
 * This extracts schema names referenced in schemaCode that need to be imported
 */
function extractSchemaImports(_imports: string, schemaCode: string): string {
  // Extract schema names that are referenced but might not be imported
  // For now, we'll include all exports from the types file
  // This is a simple heuristic - in a real implementation, we'd parse the AST
  const schemaNames: string[] = [];
  
  // Common schema patterns: CategorySchema, etc.
  if (schemaCode.includes('CategorySchema')) {
    schemaNames.push('CategorySchema');
  }
  
  // If we have schema names, try to import them from the same file
  // For now, return empty string - the full file will be evaluated
  return '';
}

/**
 * Evaluate Zod schema from source code
 */
export async function evaluateZodSchema(
  schemaCode: string,
  imports: string[],
  projectRoot?: string
): Promise<z.ZodSchema | null> {
  const root = projectRoot || getProjectRoot();
  const jitiInstance = createJitiInstance(root);

  // Filter out 'server-only' import
  const filteredImports = imports.filter(
    (imp) => !imp.includes("'server-only'") && !imp.includes('"server-only"')
  );

  // Check if zod is already imported (for reference, not used currently)
  // const hasZodImport = filteredImports.some(
  //   (imp) =>
  //     imp.includes("from 'zod'") ||
  //     imp.includes('from "zod"') ||
  //     imp.includes("from 'zod") ||
  //     imp.includes('from "zod')
  // );

  // Preprocess imports to resolve workspace packages
  const preprocessedImports = preprocessImports(filteredImports.join('\n'), root);

  // Check if zod is already imported
  const hasZodImport = preprocessedImports.includes("from 'zod'") || 
                       preprocessedImports.includes('from "zod"') ||
                       preprocessedImports.includes("from 'zod") ||
                       preprocessedImports.includes('from "zod');
  
  const hasZodOpenApiImport = preprocessedImports.includes("'zod-openapi'") ||
                               preprocessedImports.includes('"zod-openapi"');

  // Create temporary module
  // Only import zod and zod-openapi if not already imported
  const zodImports = [
    !hasZodImport && "import { z } from 'zod';",
    !hasZodOpenApiImport && "import 'zod-openapi';",
  ].filter(Boolean).join('\n') + (hasZodImport || hasZodOpenApiImport ? '\n' : '');

  // Extract all schema names from the file to include them in the temp module
  // This is a simple approach - extract all exported const declarations that look like schemas
  const schemaImports = extractSchemaImports(preprocessedImports, schemaCode);

  const tempModuleCode = `// Mock server-only for schema evaluation
if (typeof require !== 'undefined') {
  require.cache['server-only'] = { exports: {} };
}
${zodImports}${preprocessedImports}
${schemaImports}
export const schema = ${schemaCode};
`;

  // Write to temp file
  const tempPath = join(root, `.temp-schema-${Date.now()}-${Math.random().toString(36).slice(2)}.ts`);
  writeFileSync(tempPath, tempModuleCode, 'utf-8');

  try {
    const tempModule = (await jitiInstance.import(tempPath)) as any;
    const schema = tempModule.schema;
    if (isZodSchema(schema)) {
      return schema;
    }
    return null;
  } finally {
    try {
      unlinkSync(tempPath);
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Generate example value from Zod schema
 */
export function generateExampleFromZodSchema(schema: z.ZodSchema): unknown {
  try {
    // Try to get example from schema metadata
    if (schema._def && (schema._def as any).description) {
      const def = schema._def as any;
      if (def.examples && def.examples.length > 0) {
        return def.examples[0];
      }
    }

    // Generate based on schema type
    if (schema instanceof z.ZodString) {
      const def = schema._def;
      if (def.checks && Array.isArray(def.checks)) {
        // Check for email, url, uuid, etc.
        for (const check of def.checks) {
          if ('kind' in check) {
            if (check.kind === 'email') return 'user@example.com';
            if (check.kind === 'url') return 'https://example.com';
            if (check.kind === 'uuid') return '00000000-0000-0000-0000-000000000000';
          }
        }
      }
      return 'example';
    }

    if (schema instanceof z.ZodNumber) {
      return 0;
    }

    if (schema instanceof z.ZodBoolean) {
      return false;
    }

    if (schema instanceof z.ZodArray) {
      return [];
    }

    if (schema instanceof z.ZodObject) {
      const shape = schema.shape;
      const example: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(shape)) {
        example[key] = generateExampleFromZodSchema(value as z.ZodSchema);
      }
      return example;
    }

    if (schema instanceof z.ZodOptional) {
      const innerType = (schema as z.ZodOptional<z.ZodTypeAny>)._def.innerType;
      return generateExampleFromZodSchema(innerType as z.ZodSchema);
    }

    if (schema instanceof z.ZodNullable) {
      const innerType = (schema as z.ZodNullable<z.ZodTypeAny>)._def.innerType;
      return generateExampleFromZodSchema(innerType as z.ZodSchema);
    }

    if (schema instanceof z.ZodEnum) {
      const def = schema._def;
      // ZodEnum values are stored as an array in _def.values
      const enumValues = (def as any).values as readonly [string, ...string[]];
      return enumValues?.[0] || '';
    }

    if (schema instanceof z.ZodDefault) {
      const innerType = schema._def.innerType;
      return generateExampleFromZodSchema(innerType as z.ZodSchema);
    }

    // Fallback
    return null;
  } catch (error) {
    // If generation fails, return null
    return null;
  }
}

/**
 * Evaluate schema from file and schema name
 */
export async function evaluateSchemaFromFile(
  filePath: string,
  schemaName: string,
  projectRoot?: string
): Promise<z.ZodSchema | null> {
  const root = projectRoot || getProjectRoot();
  const jitiInstance = createJitiInstance(root);

  // Instead of extracting individual schemas, evaluate the entire file
  // This ensures all dependencies (like CategorySchema) are available
  try {
    const module = (await jitiInstance.import(filePath)) as any;
    return extractSchemaFromModule(module, schemaName);
  } catch (error) {
    // If direct import fails, fall back to individual schema extraction
    const extracted = await extractExportedSchema(filePath, schemaName);
    if (!extracted) {
      return null;
    }

    return await evaluateZodSchema(extracted.schemaCode, extracted.imports, projectRoot);
  }
}

/**
 * Evaluate schema from module import
 */
export async function evaluateSchemaFromModule(
  moduleSpecifier: string,
  schemaName: string,
  fromFile: string,
  projectRoot?: string
): Promise<z.ZodSchema | null> {
  const root = projectRoot || getProjectRoot();
  const jitiInstance = createJitiInstance(root);

  // Resolve module specifier
  let modulePath: string | null = null;

  if (moduleSpecifier.startsWith('@heyclaude/')) {
    modulePath = resolveWorkspacePackage(moduleSpecifier, root);
  } else if (moduleSpecifier.startsWith('./') || moduleSpecifier.startsWith('../')) {
    modulePath = await resolveModuleSpecifier(moduleSpecifier, fromFile, root);
  }

  if (!modulePath) {
    return null;
  }

  try {
    const module = (await jitiInstance.import(modulePath)) as any;
    return extractSchemaFromModule(module, schemaName);
  } catch (error) {
    // Module import failed
    return null;
  }
}

