#!/usr/bin/env tsx

/**
 * OpenAPI Spec Generator
 *
 * Generates OpenAPI 3.1 specification from Next.js API routes using AST parsing + runtime evaluation.
 * Supports all route factory types:
 * - createApiRoute()
 * - createCachedApiRoute()
 * - createFormatHandlerRoute()
 *
 * Extracts:
 * - Route paths (including versioned routes via getVersionedRoute)
 * - HTTP methods
 * - OpenAPI metadata (summary, description, tags, operationId, responses)
 * - Zod schemas (querySchema, bodySchema) - extracted via AST + runtime evaluation
 * - Authentication requirements
 *
 * Output: openapi.json in the project root.
 */

import { writeFile, readFile, unlink, stat } from 'node:fs/promises';
import { existsSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { glob } from 'glob';
import { Project, Node, ObjectLiteralExpression, PropertyAssignment, ExportDeclaration } from 'ts-morph';
import { createDocument } from 'zod-openapi';
import { z } from 'zod';
import jiti from 'jiti';
import yaml from 'js-yaml';

// Import zod-openapi for type augmentation
import 'zod-openapi';

const __filename = fileURLToPath(import.meta.url);
// Calculate PROJECT_ROOT: from packages/generators/src/commands/ -> project root
// Or from packages/generators/src/bin/ -> project root
let PROJECT_ROOT = join(__filename, '../../../../');
// Verify by checking if apps/web exists
if (!existsSync(join(PROJECT_ROOT, 'apps/web'))) {
  // Try alternative path (if called from bin script)
  PROJECT_ROOT = join(__filename, '../../../../../');
}
// Final verification - use process.cwd() as fallback if still wrong
if (!existsSync(join(PROJECT_ROOT, 'apps/web'))) {
  PROJECT_ROOT = process.cwd();
}

// Note: We'll handle server-only imports dynamically when evaluating schemas

interface RouteMetadata {
  route: string;
  method: string;
  openapi?: {
    summary?: string;
    description?: string;
    tags?: string[];
    operationId?: string;
    responses?: Record<number, { 
      description: string; 
      schema?: z.ZodSchema; 
      schemaSource?: string; 
      schemaName?: string;
      headers?: Record<string, { schema: { type: string }; description: string }>;
      example?: unknown;
    }>;
    deprecated?: boolean;
    security?: Array<Record<string, string[]>>;
    externalDocs?: { description: string; url: string };
    requestBody?: { description?: string; required?: boolean };
  };
  querySchema?: z.ZodSchema;
  bodySchema?: z.ZodSchema;
  requireAuth?: boolean;
  optionalAuth?: boolean;
  filePath: string;
  factoryName: string;
  querySchemaSource?: string; // Source code for schema (for evaluation)
  bodySchemaSource?: string; // Source code for schema (for evaluation)
  querySchemaName?: string; // Name of exported schema (if exported)
  bodySchemaName?: string; // Name of exported schema (if exported)
  responseSchemaSources?: Record<number, string>; // Source code for response schemas (for evaluation)
  responseSchemaNames?: Record<number, string>; // Names of exported response schemas (if exported)
}

/**
 * Extract route path from config object
 * Handles both string literals and getVersionedRoute() calls
 */
function extractRoutePath(configObj: ObjectLiteralExpression): string | null {
  const routeProp = configObj.getProperty('route');
  if (!routeProp || !Node.isPropertyAssignment(routeProp)) return null;

  const initializer = routeProp.getInitializer();
  if (!initializer) return null;

  // Handle string literal: route: '/api/status'
  if (Node.isStringLiteral(initializer)) {
    return initializer.getLiteralValue();
  }

  // Handle template literal: route: `/api/v1/${path}`
  if (Node.isTemplateExpression(initializer)) {
    // For template literals, try to evaluate if possible
    // For now, extract the static parts
    const parts: string[] = [];
    const head = initializer.getHead();
    if (head) parts.push(head.getText());
    for (const span of initializer.getTemplateSpans()) {
      const literal = span.getLiteral();
      if (literal) parts.push(literal.getText());
    }
    return parts.join('');
  }

  // Handle function call: route: getVersionedRoute('status')
  if (Node.isCallExpression(initializer)) {
    const expression = initializer.getExpression();
    if (Node.isPropertyAccessExpression(expression) || Node.isIdentifier(expression)) {
      const funcName = expression.getText();
      if (funcName === 'getVersionedRoute' || funcName.includes('getVersionedRoute')) {
        const args = initializer.getArguments();
        if (args.length > 0 && Node.isStringLiteral(args[0])) {
          const path = args[0].getLiteralValue();
          // getVersionedRoute returns /api/v1/{path}
          return `/api/v1/${path.startsWith('/') ? path.slice(1) : path}`;
        }
      }
    }
  }

  return null;
}

/**
 * Extract OpenAPI metadata from config object
 */
function extractOpenAPIMetadata(configObj: ObjectLiteralExpression): RouteMetadata['openapi'] | undefined {
  const openapiProp = configObj.getProperty('openapi');
  if (!openapiProp || !Node.isPropertyAssignment(openapiProp)) return undefined;

  const initializer = openapiProp.getInitializer();
  if (!initializer || !Node.isObjectLiteralExpression(initializer)) return undefined;

  const metadata: RouteMetadata['openapi'] = {};

  // Extract summary
  const summaryProp = initializer.getProperty('summary');
  if (summaryProp && Node.isPropertyAssignment(summaryProp)) {
    const summaryInit = summaryProp.getInitializer();
    if (summaryInit && Node.isStringLiteral(summaryInit)) {
      metadata.summary = summaryInit.getLiteralValue();
    }
  }

  // Extract description
  const descriptionProp = initializer.getProperty('description');
  if (descriptionProp && Node.isPropertyAssignment(descriptionProp)) {
    const descInit = descriptionProp.getInitializer();
    if (descInit && Node.isStringLiteral(descInit)) {
      metadata.description = descInit.getLiteralValue();
    }
  }

  // Extract tags
  const tagsProp = initializer.getProperty('tags');
  if (tagsProp && Node.isPropertyAssignment(tagsProp)) {
    const tagsInit = tagsProp.getInitializer();
    if (tagsInit && Node.isArrayLiteralExpression(tagsInit)) {
      const tags: string[] = [];
      for (const element of tagsInit.getElements()) {
        if (Node.isStringLiteral(element)) {
          tags.push(element.getLiteralValue());
        }
      }
      if (tags.length > 0) metadata.tags = tags;
    }
  }

  // Extract operationId
  const operationIdProp = initializer.getProperty('operationId');
  if (operationIdProp && Node.isPropertyAssignment(operationIdProp)) {
    const opIdInit = operationIdProp.getInitializer();
    if (opIdInit && Node.isStringLiteral(opIdInit)) {
      metadata.operationId = opIdInit.getLiteralValue();
    }
  }

  // Extract deprecated
  const deprecatedProp = initializer.getProperty('deprecated');
  if (deprecatedProp && Node.isPropertyAssignment(deprecatedProp)) {
    const depInit = deprecatedProp.getInitializer();
    if (depInit && (Node.isTrueLiteral(depInit) || Node.isFalseLiteral(depInit))) {
      metadata.deprecated = Node.isTrueLiteral(depInit);
    }
  }

  // Extract responses (including response schemas, headers, examples)
  const responsesProp = initializer.getProperty('responses');
  if (responsesProp && Node.isPropertyAssignment(responsesProp)) {
    const responsesInit = responsesProp.getInitializer();
    if (responsesInit && Node.isObjectLiteralExpression(responsesInit)) {
      const responses: Record<number, { 
        description: string; 
        schema?: z.ZodSchema; 
        schemaSource?: string; 
        schemaName?: string;
        headers?: Record<string, { schema: { type: string }; description: string }>;
        example?: unknown;
      }> = {};
      for (const prop of responsesInit.getProperties()) {
        if (Node.isPropertyAssignment(prop)) {
          const key = prop.getName();
          const statusCode = parseInt(key, 10);
          if (!isNaN(statusCode)) {
            const valueInit = prop.getInitializer();
            if (valueInit && Node.isObjectLiteralExpression(valueInit)) {
              const descProp = valueInit.getProperty('description');
              let description = '';
              if (descProp && Node.isPropertyAssignment(descProp)) {
                const descInit = descProp.getInitializer();
                if (descInit && Node.isStringLiteral(descInit)) {
                  description = descInit.getLiteralValue();
                }
              }
              
              // Extract schema property (similar to querySchema/bodySchema extraction)
              const schemaProp = valueInit.getProperty('schema');
              let schemaSource: string | null = null;
              let schemaName: string | null = null;
              
              if (schemaProp && Node.isPropertyAssignment(schemaProp)) {
                schemaSource = extractSchemaSource(schemaProp);
                
                // If schema source is an identifier, it might be an exported schema
                if (schemaSource) {
                  const trimmed = schemaSource.trim();
                  // Check if it's a simple identifier (exported schema) or a property access
                  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(trimmed)) {
                    schemaName = trimmed;
                  }
                }
              }
              
              // Extract headers
              const headersProp = valueInit.getProperty('headers');
              let headers: Record<string, { schema: { type: string }; description: string }> | undefined;
              if (headersProp && Node.isPropertyAssignment(headersProp)) {
                const headersInit = headersProp.getInitializer();
                if (headersInit && Node.isObjectLiteralExpression(headersInit)) {
                  headers = {};
                  for (const headerProp of headersInit.getProperties()) {
                    if (Node.isPropertyAssignment(headerProp)) {
                      const headerName = headerProp.getName();
                      const headerValueInit = headerProp.getInitializer();
                      if (headerValueInit && Node.isObjectLiteralExpression(headerValueInit)) {
                        const headerSchemaProp = headerValueInit.getProperty('schema');
                        const headerDescProp = headerValueInit.getProperty('description');
                        let headerSchema: { type: string } | undefined;
                        let headerDescription = '';
                        
                        if (headerSchemaProp && Node.isPropertyAssignment(headerSchemaProp)) {
                          const headerSchemaInit = headerSchemaProp.getInitializer();
                          if (headerSchemaInit && Node.isObjectLiteralExpression(headerSchemaInit)) {
                            const typeProp = headerSchemaInit.getProperty('type');
                            if (typeProp && Node.isPropertyAssignment(typeProp)) {
                              const typeInit = typeProp.getInitializer();
                              if (typeInit && Node.isStringLiteral(typeInit)) {
                                headerSchema = { type: typeInit.getLiteralValue() };
                              }
                            }
                          }
                        }
                        
                        if (headerDescProp && Node.isPropertyAssignment(headerDescProp)) {
                          const headerDescInit = headerDescProp.getInitializer();
                          if (headerDescInit && Node.isStringLiteral(headerDescInit)) {
                            headerDescription = headerDescInit.getLiteralValue();
                          }
                        }
                        
                        if (headerSchema && headerDescription) {
                          headers[headerName] = { schema: headerSchema, description: headerDescription };
                        }
                      }
                    }
                  }
                }
              }
              
              // Extract example
              const exampleProp = valueInit.getProperty('example');
              let example: unknown | undefined;
              if (exampleProp && Node.isPropertyAssignment(exampleProp)) {
                const exampleInit = exampleProp.getInitializer();
                if (exampleInit) {
                  // Try to extract example value (object literal, string, number, etc.)
                  if (Node.isObjectLiteralExpression(exampleInit)) {
                    // For object literals, we'll need to evaluate at runtime
                    // Store the source text for now
                    example = exampleInit.getText();
                  } else if (Node.isStringLiteral(exampleInit)) {
                    example = exampleInit.getLiteralValue();
                  } else if (Node.isNumericLiteral(exampleInit)) {
                    example = parseFloat(exampleInit.getText());
                  } else if (Node.isTrueLiteral(exampleInit)) {
                    example = true;
                  } else if (Node.isFalseLiteral(exampleInit)) {
                    example = false;
                  }
                }
              }
              
              responses[statusCode] = {
                description,
                ...(schemaSource ? { schemaSource, ...(schemaName ? { schemaName } : {}) } : {}),
                ...(headers ? { headers } : {}),
                ...(example !== undefined ? { example } : {}),
              };
            }
          }
        }
      }
      if (Object.keys(responses).length > 0) metadata.responses = responses;
    }
  }

  // Extract security
  const securityProp = initializer.getProperty('security');
  if (securityProp && Node.isPropertyAssignment(securityProp)) {
    const securityInit = securityProp.getInitializer();
    if (securityInit && Node.isArrayLiteralExpression(securityInit)) {
      const security: Array<Record<string, string[]>> = [];
      for (const element of securityInit.getElements()) {
        if (Node.isObjectLiteralExpression(element)) {
          const securityObj: Record<string, string[]> = {};
          for (const prop of element.getProperties()) {
            if (Node.isPropertyAssignment(prop)) {
              const key = prop.getName();
              const valueInit = prop.getInitializer();
              if (valueInit && Node.isArrayLiteralExpression(valueInit)) {
                const scopes: string[] = [];
                for (const scopeElement of valueInit.getElements()) {
                  if (Node.isStringLiteral(scopeElement)) {
                    scopes.push(scopeElement.getLiteralValue());
                  }
                }
                securityObj[key] = scopes;
              } else if (valueInit && Node.isArrayLiteralExpression(valueInit) === false) {
                // Empty array case: bearerAuth: []
                securityObj[key] = [];
              }
            }
          }
          if (Object.keys(securityObj).length > 0) {
            security.push(securityObj);
          }
        }
      }
      if (security.length > 0) metadata.security = security;
    }
  }

  // Extract externalDocs
  const externalDocsProp = initializer.getProperty('externalDocs');
  if (externalDocsProp && Node.isPropertyAssignment(externalDocsProp)) {
    const externalDocsInit = externalDocsProp.getInitializer();
    if (externalDocsInit && Node.isObjectLiteralExpression(externalDocsInit)) {
      const descProp = externalDocsInit.getProperty('description');
      const urlProp = externalDocsInit.getProperty('url');
      let description = '';
      let url = '';
      
      if (descProp && Node.isPropertyAssignment(descProp)) {
        const descInit = descProp.getInitializer();
        if (descInit && Node.isStringLiteral(descInit)) {
          description = descInit.getLiteralValue();
        }
      }
      
      if (urlProp && Node.isPropertyAssignment(urlProp)) {
        const urlInit = urlProp.getInitializer();
        if (urlInit && Node.isStringLiteral(urlInit)) {
          url = urlInit.getLiteralValue();
        }
      }
      
      if (description && url) {
        metadata.externalDocs = { description, url };
      }
    }
  }

  // Extract requestBody
  const requestBodyProp = initializer.getProperty('requestBody');
  if (requestBodyProp && Node.isPropertyAssignment(requestBodyProp)) {
    const requestBodyInit = requestBodyProp.getInitializer();
    if (requestBodyInit && Node.isObjectLiteralExpression(requestBodyInit)) {
      const descProp = requestBodyInit.getProperty('description');
      const requiredProp = requestBodyInit.getProperty('required');
      let description: string | undefined;
      let required: boolean | undefined;
      
      if (descProp && Node.isPropertyAssignment(descProp)) {
        const descInit = descProp.getInitializer();
        if (descInit && Node.isStringLiteral(descInit)) {
          description = descInit.getLiteralValue();
        }
      }
      
      if (requiredProp && Node.isPropertyAssignment(requiredProp)) {
        const requiredInit = requiredProp.getInitializer();
        if (requiredInit && (Node.isTrueLiteral(requiredInit) || Node.isFalseLiteral(requiredInit))) {
          required = Node.isTrueLiteral(requiredInit);
        }
      }
      
      if (description !== undefined || required !== undefined) {
        metadata.requestBody = {};
        if (description !== undefined) metadata.requestBody.description = description;
        if (required !== undefined) metadata.requestBody.required = required;
      }
    }
  }

  // Only return if at least one property is defined
  if (Object.keys(metadata).length > 0) {
    return metadata;
  }

  return undefined;
}

/**
 * Extract auth requirements from config object
 */
function extractAuthRequirements(configObj: ObjectLiteralExpression): { requireAuth?: boolean; optionalAuth?: boolean } {
  const result: { requireAuth?: boolean; optionalAuth?: boolean } = {};

  const requireAuthProp = configObj.getProperty('requireAuth');
  if (requireAuthProp && Node.isPropertyAssignment(requireAuthProp)) {
    const init = requireAuthProp.getInitializer();
    if (init && Node.isTrueLiteral(init)) {
      result.requireAuth = true;
    }
  }

  const optionalAuthProp = configObj.getProperty('optionalAuth');
  if (optionalAuthProp && Node.isPropertyAssignment(optionalAuthProp)) {
    const init = optionalAuthProp.getInitializer();
    if (init && Node.isTrueLiteral(init)) {
      result.optionalAuth = true;
    }
  }

  return result;
}

/**
 * Extract schema source code from AST for runtime evaluation
 */
function extractSchemaSource(prop: PropertyAssignment): string | null {
  const initializer = prop.getInitializer();
  if (!initializer) return null;

  // Get the source text of the schema expression
  return initializer.getText();
}

/**
 * Extract route metadata from API route files using AST parsing
 */
async function extractRouteMetadata(filePath: string): Promise<RouteMetadata[]> {
  // Create a minimal Project that only parses the specific file
  // We don't need full dependency resolution - just AST parsing for this single file
  // Using minimal configuration to avoid loading tsconfig.json and dependencies
  const project = new Project({
    skipAddingFilesFromTsConfig: true, // Don't load files from tsconfig.json
    skipFileDependencyResolution: true, // Don't resolve and load dependencies
    skipLoadingLibFiles: true, // Don't load lib files
    // No compilerOptions needed - we're only doing AST parsing, not type checking
  });
  
  // Add only the specific file we need - ts-morph won't try to load dependencies
  const sourceFile = project.addSourceFileAtPath(filePath);
  const routes: RouteMetadata[] = [];

  // Manually find exported const declarations using AST traversal (no type checking required)
  // This avoids the need for a full compiler program
  const exportedVars = new Map<string, Node[]>();
  
  sourceFile.forEachDescendant((node) => {
    // Look for: export const GET = ... or export const POST = ...
    if (Node.isVariableStatement(node)) {
      const declarationList = node.getDeclarationList();
      const declarations = declarationList.getDeclarations();
      
      for (const declaration of declarations) {
        const name = declaration.getName();
        if (['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(name)) {
          // Check if this variable statement is exported
          if (node.hasModifier('export')) {
            if (!exportedVars.has(name)) {
              exportedVars.set(name, []);
            }
            exportedVars.get(name)!.push(declaration);
          }
        }
      }
    }
  });

  for (const [exportName, declarations] of exportedVars) {
    for (const declaration of declarations) {
      if (!Node.isVariableDeclaration(declaration)) continue;

      const initializer = declaration.getInitializer();
      if (!initializer) continue;

      // Check if it's a factory call: createApiRoute, createCachedApiRoute, or createFormatHandlerRoute
      let configObj: ObjectLiteralExpression | null = null;
      let factoryName = '';

      if (Node.isCallExpression(initializer)) {
        const expression = initializer.getExpression();
        if (Node.isIdentifier(expression) || Node.isPropertyAccessExpression(expression)) {
          factoryName = expression.getText();
        }

        // All factories take a config object as first argument
        const args = initializer.getArguments();
        if (args.length > 0 && Node.isObjectLiteralExpression(args[0])) {
          configObj = args[0];
        }
      }

      if (!configObj) continue;

      // Extract route path
      const route = extractRoutePath(configObj);
      if (!route) continue;

      // Extract OpenAPI metadata
      const openapi = extractOpenAPIMetadata(configObj);

      // Extract auth requirements
      const { requireAuth, optionalAuth } = extractAuthRequirements(configObj);

      // Extract schema sources for runtime evaluation
      const querySchemaProp = configObj.getProperty('querySchema');
      const bodySchemaProp = configObj.getProperty('bodySchema');
      const querySchemaSource = querySchemaProp && Node.isPropertyAssignment(querySchemaProp)
        ? extractSchemaSource(querySchemaProp)
        : null;
      const bodySchemaSource = bodySchemaProp && Node.isPropertyAssignment(bodySchemaProp)
        ? extractSchemaSource(bodySchemaProp)
        : null;

      // Try to find exported schemas that match
      // Look for exported schemas in the file
      let querySchemaName: string | null = null;
      let bodySchemaName: string | null = null;
      
      // If schema source is an identifier, it might be an exported schema
      if (querySchemaSource) {
        let trimmed = querySchemaSource.trim();
        // Remove " as any" or other type assertions
        trimmed = trimmed.replace(/\s+as\s+\w+$/, '');
        // Check if it's a simple identifier (not a z.object() call or method chain)
        if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(trimmed)) {
          // Check if this identifier is exported by manually searching the AST
          let isExported = false;
          sourceFile.forEachDescendant((node) => {
            if (Node.isVariableStatement(node) && node.hasModifier('export')) {
              const declarationList = node.getDeclarationList();
              const declarations = declarationList.getDeclarations();
              for (const decl of declarations) {
                if (decl.getName() === trimmed) {
                  isExported = true;
                }
              }
            }
          });
          if (isExported) {
            querySchemaName = trimmed;
          }
        }
      }
      
      if (bodySchemaSource) {
        let trimmed = bodySchemaSource.trim();
        // Remove " as any" or other type assertions
        trimmed = trimmed.replace(/\s+as\s+\w+$/, '');
        if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(trimmed)) {
          // Check if this identifier is exported by manually searching the AST
          let isExported = false;
          sourceFile.forEachDescendant((node) => {
            if (Node.isVariableStatement(node) && node.hasModifier('export')) {
              const declarationList = node.getDeclarationList();
              const declarations = declarationList.getDeclarations();
              for (const decl of declarations) {
                if (decl.getName() === trimmed) {
                  isExported = true;
                }
              }
            }
          });
          if (isExported) {
            bodySchemaName = trimmed;
          }
        }
      }

      const routeMetadata: RouteMetadata = {
        route,
        method: exportName,
        filePath,
        factoryName,
        ...(openapi ? { openapi } : {}),
        ...(requireAuth ? { requireAuth: true } : {}),
        ...(optionalAuth ? { optionalAuth: true } : {}),
        ...(querySchemaSource ? { querySchemaSource } : {}),
        ...(bodySchemaSource ? { bodySchemaSource } : {}),
        // Store schema names for exported schemas
        ...(querySchemaName ? { querySchemaName } : {}),
        ...(bodySchemaName ? { bodySchemaName } : {}),
        // Store response schema sources and names
        ...(openapi?.responses ? (() => {
          const responseSchemaSources: Record<number, string> = {};
          const responseSchemaNames: Record<number, string> = {};
          for (const [code, response] of Object.entries(openapi.responses)) {
            const statusCode = parseInt(code, 10);
            if (!isNaN(statusCode) && response.schemaSource) {
              responseSchemaSources[statusCode] = response.schemaSource;
              if (response.schemaName) {
                responseSchemaNames[statusCode] = response.schemaName;
              }
            }
          }
          return {
            ...(Object.keys(responseSchemaSources).length > 0 ? { responseSchemaSources } : {}),
            ...(Object.keys(responseSchemaNames).length > 0 ? { responseSchemaNames } : {}),
          };
        })() : {}),
      };

      routes.push(routeMetadata);
    }
  }

  return routes;
}

/**
 * Evaluate Zod schemas from route files at runtime
 * Extracts actual Zod schema objects from exported schemas or evaluates inline schemas
 * Uses jiti to handle server-only imports
 */
async function evaluateSchemas(filePath: string, routes: RouteMetadata[]): Promise<RouteMetadata[]> {
  if (routes.length === 0) return routes;

  // Create a minimal Project for import analysis only
  // We don't need full dependency resolution - just to read import statements
  // Using minimal configuration to avoid loading tsconfig.json and dependencies
  const project = new Project({
    skipAddingFilesFromTsConfig: true, // Don't load files from tsconfig.json
    skipFileDependencyResolution: true, // Don't resolve and load dependencies
    skipLoadingLibFiles: true, // Don't load lib files
    // No compilerOptions needed - we're only doing AST parsing, not type checking
  });
  const sourceFile = project.addSourceFileAtPathIfExists(filePath);
  
  const relativePath = relative(PROJECT_ROOT, filePath);
  
  /**
   * Resolve internal workspace package imports to source files
   * This handles @heyclaude/* imports that jiti can't resolve automatically
   * Uses package.json exports to determine correct source file paths
   */
  function resolveWorkspacePackage(moduleSpecifier: string): string | null {
    if (!moduleSpecifier.startsWith('@heyclaude/')) {
      return null;
    }
    
    // Map package names to source paths based on package.json exports
    // This must match the actual package.json exports structure
    const packageMap: Record<string, string> = {
      '@heyclaude/web-runtime': join(PROJECT_ROOT, 'packages/web-runtime/src/index.ts'),
      '@heyclaude/web-runtime/server': join(PROJECT_ROOT, 'packages/web-runtime/src/server.ts'),
      '@heyclaude/web-runtime/api/schemas': join(PROJECT_ROOT, 'packages/web-runtime/src/api/schemas.ts'),
      '@heyclaude/web-runtime/api/response-schemas': join(PROJECT_ROOT, 'packages/web-runtime/src/api/response-schemas.ts'),
      '@heyclaude/shared-runtime': join(PROJECT_ROOT, 'packages/shared-runtime/src/index.ts'),
      '@heyclaude/data-layer': join(PROJECT_ROOT, 'packages/data-layer/src/index.ts'),
      '@heyclaude/data-layer/prisma': join(PROJECT_ROOT, 'packages/data-layer/src/prisma/index.ts'),
      '@heyclaude/database-types': join(PROJECT_ROOT, 'packages/database-types/src/index.ts'),
      '@heyclaude/database-types/prisma': join(PROJECT_ROOT, 'packages/database-types/src/prisma/index.ts'),
    };
    
    // Check exact match first
    if (packageMap[moduleSpecifier]) {
      const path = packageMap[moduleSpecifier];
      if (existsSync(path)) {
        return path;
      }
    }
    
    // Try to resolve subpath imports (e.g., @heyclaude/web-runtime/something)
    for (const [pkg, basePath] of Object.entries(packageMap)) {
      if (moduleSpecifier.startsWith(pkg + '/') && moduleSpecifier !== pkg) {
        const subpath = moduleSpecifier.slice(pkg.length + 1);
        const packageName = pkg.replace('@heyclaude/', '');
        const packageRoot = join(PROJECT_ROOT, 'packages', packageName, 'src');
        
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
   * Resolve a module specifier to an absolute file path
   * Handles both workspace packages (@heyclaude/*) and relative imports
   * Returns null if not a file (e.g., is a directory)
   */
  async function resolveModuleSpecifier(specifier: string, fromFile: string): Promise<string | null> {
    if (!fromFile || !specifier) {
      return null;
    }
    
    try {
      // Handle workspace packages
      if (specifier.startsWith('@heyclaude/')) {
        const resolved = resolveWorkspacePackage(specifier);
        if (resolved && existsSync(resolved)) {
          // Verify it's a file, not a directory
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
      return null;
    }
    
    return null;
  }

  /**
   * Extract a specific schema definition and all its dependencies using AST
   * Returns a standalone TypeScript module that can be evaluated by jiti
   * This avoids module resolution issues by recursively inlining all dependencies
   * 
   * Strategy:
   * 1. Extract the schema definition code
   * 2. Find all identifiers used in the schema
   * 3. For identifiers that are exported schemas in the same file, recursively extract them
   * 4. For identifiers from imports, recursively extract from those files
   * 5. Build a standalone module with all dependencies inlined (imports at top, schemas below)
   */
  async function extractSchemaDefinitionWithDependencies(
    filePath: string,
    schemaName: string,
    extractedSchemas: Map<string, string> = new Map(), // Map of schema name -> file path (to prevent circular dependencies)
    depth: number = 0
  ): Promise<string | null> {
    // Prevent infinite recursion
    if (depth > 20) {
      throw new Error(`Maximum dependency depth exceeded for ${schemaName}`);
    }
    
    // Prevent circular dependencies - use filePath + schemaName as key
    const schemaKey = `${filePath}::${schemaName}`;
    if (extractedSchemas.has(schemaKey)) {
      return null; // Already extracted
    }
    extractedSchemas.set(schemaKey, filePath);
    
    // Create a minimal Project for AST parsing
    const project = new Project({
      skipAddingFilesFromTsConfig: true,
      skipFileDependencyResolution: true,
      skipLoadingLibFiles: true,
    });
    
    const sourceFile = project.addSourceFileAtPathIfExists(filePath);
    if (!sourceFile) {
      return null;
    }
    
    // Find the exported schema declaration
    // First check for direct exports: export const schemaName = ...
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
    
    // If not found as direct export, check for re-exports: export { schemaName } from '...'
    if (!schemaDeclaration) {
      for (const imp of sourceFile.getExportDeclarations()) {
        const namedExports = imp.getNamedExports();
        for (const namedExport of namedExports) {
          if (namedExport.getName() === schemaName) {
            // This is a re-export - follow it to the source
            const moduleSpecifier = imp.getModuleSpecifierValue();
            if (moduleSpecifier) {
              const resolved = await resolveModuleSpecifier(moduleSpecifier, filePath);
              if (resolved && existsSync(resolved)) {
                // Recursively extract from the source file
                return await extractSchemaDefinitionWithDependencies(
                  resolved,
                  schemaName,
                  extractedSchemas,
                  depth + 1
                );
              }
            }
          }
        }
      }
    }
    
    if (!schemaDeclaration || !Node.isVariableDeclaration(schemaDeclaration)) {
      return null;
    }
    
    const initializer = schemaDeclaration.getInitializer();
    if (!initializer) {
      return null;
    }
    
    // Extract the schema definition code
    const schemaCode = initializer.getText();
    
    // Find all identifiers used in the schema code that might be dependencies
    const usedIdentifiers = new Set<string>();
    initializer.forEachDescendant((node) => {
      if (Node.isIdentifier(node)) {
        const name = node.getText();
        // Skip common keywords and built-ins
        if (!['z', 'object', 'string', 'number', 'boolean', 'array', 'optional', 'extend', 'default', 'describe', 'meta', 'coerce', 'int', 'min', 'max', 'pipe', 'transform', 'nullable', 'Object', 'values', 'as', 'readonly', 'custom', 'message', 'Invalid', 'typeof', 'keyof'].includes(name)) {
          usedIdentifiers.add(name);
        }
      }
    });
    
    // Note: Enum extraction is now handled inline when extracting schema dependencies
    // This ensures enums are extracted in the correct order (before schemas that use them)
    
    // Collect all imports and their resolved paths
    const importMap = new Map<string, { specifier: string; resolved: string; names: string[]; filePath: string }>();
    
    // Get all imports from the source file
    for (const imp of sourceFile.getImportDeclarations()) {
      const moduleSpecifier = imp.getModuleSpecifierValue();
      const namedImports = imp.getNamedImports();
      const defaultImport = imp.getDefaultImport();
      
      // Check which imports are actually used
      const usedNames: string[] = [];
      for (const namedImport of namedImports) {
        const name = namedImport.getName();
        if (usedIdentifiers.has(name)) {
          usedNames.push(name);
        }
      }
      
      if (usedNames.length > 0 || (defaultImport && usedIdentifiers.has(defaultImport.getText()))) {
        // Resolve the module specifier to an absolute path
        let resolvedSpecifier = moduleSpecifier;
        let resolvedPath = moduleSpecifier;
        if (moduleSpecifier.startsWith('@heyclaude/') || moduleSpecifier.startsWith('./') || moduleSpecifier.startsWith('../')) {
          const resolved = await resolveModuleSpecifier(moduleSpecifier, filePath);
          if (resolved) {
            resolvedSpecifier = resolved;
            resolvedPath = resolved;
          }
        }
        
        importMap.set(moduleSpecifier, {
          specifier: resolvedSpecifier,
          resolved: resolvedSpecifier,
          names: usedNames,
          filePath: resolvedPath,
        });
      }
    }
    
    // Recursively extract dependencies
    // We'll collect schema definitions and imports separately
    const dependencySchemaDefs: string[] = []; // Just the const schemaName = code; parts
    const dependencyImports: string[] = [];
    
    // IMPORTANT: Extract imported schemas FIRST (before same-file schemas that depend on them)
    // This ensures dependencies are available when schemas that use them are evaluated
    
    // 2. Extract schemas from imported files FIRST (for workspace/relative imports)
    for (const [originalSpecifier, { resolved, names, filePath: importFilePath }] of importMap) {
      // Only process workspace and relative imports (skip node_modules)
      if (originalSpecifier.startsWith('@heyclaude/') || originalSpecifier.startsWith('./') || originalSpecifier.startsWith('../')) {
        if (existsSync(importFilePath)) {
          // For each imported name, check if it's an exported schema in that file
          for (const name of names) {
            try {
              // Use AST to extract just the schema definition from the imported file
              const depProject = new Project({
                skipAddingFilesFromTsConfig: true,
                skipFileDependencyResolution: true,
                skipLoadingLibFiles: true,
              });
              
              const depSourceFile = depProject.addSourceFileAtPathIfExists(importFilePath);
              if (depSourceFile) {
                // Find the schema declaration
                let depDeclaration: Node | null = null;
                depSourceFile.forEachDescendant((node) => {
                  if (Node.isVariableStatement(node) && node.hasModifier('export')) {
                    const declarationList = node.getDeclarationList();
                    const declarations = declarationList.getDeclarations();
                    for (const declaration of declarations) {
                      if (declaration.getName() === name) {
                        depDeclaration = declaration;
                        return;
                      }
                    }
                  }
                });
                
                // Check for re-exports
                if (!depDeclaration) {
                  for (const exp of depSourceFile.getExportDeclarations()) {
                    const moduleSpecifier = exp.getModuleSpecifierValue();
                    if (moduleSpecifier) {
                      const namedExports = exp.getNamedExports();
                      for (const namedExport of namedExports) {
                        if (namedExport.getName() === name) {
                          // Re-export - recursively extract from source
                          const reExportResolved = await resolveModuleSpecifier(moduleSpecifier, importFilePath);
                          if (reExportResolved && existsSync(reExportResolved)) {
                            // Use AST to extract directly from the re-exported file
                            const reExportProject = new Project({
                              skipAddingFilesFromTsConfig: true,
                              skipFileDependencyResolution: true,
                              skipLoadingLibFiles: true,
                            });
                            
                            const reExportSourceFile = reExportProject.addSourceFileAtPathIfExists(reExportResolved);
                            if (reExportSourceFile) {
                              // Find the schema declaration in the re-exported file
                              let reExportDeclaration: Node | null = null;
                              reExportSourceFile.forEachDescendant((node) => {
                                if (Node.isVariableStatement(node) && node.hasModifier('export')) {
                                  const declarationList = node.getDeclarationList();
                                  const declarations = declarationList.getDeclarations();
                                  for (const declaration of declarations) {
                                    if (declaration.getName() === name) {
                                      reExportDeclaration = declaration;
                                      return;
                                    }
                                  }
                                }
                              });
                              
                              if (reExportDeclaration && Node.isVariableDeclaration(reExportDeclaration)) {
                                const reExportInitializer = reExportDeclaration.getInitializer();
                                if (reExportInitializer) {
                                  // Extract imports from the re-exported file FIRST (before schema)
                                  // Check if schema uses imported enums that need to be inlined
                                  const reExportUsedIds = new Set<string>();
                                  reExportInitializer.forEachDescendant((node) => {
                                    if (Node.isIdentifier(node)) {
                                      const idName = node.getText();
                                      if (!['z', 'string', 'pipe', 'custom', 'Object', 'values', 'as', 'readonly', 'includes', 'message', 'Invalid', 'typeof', 'keyof'].includes(idName)) {
                                        reExportUsedIds.add(idName);
                                      }
                                    }
                                  });
                                  
                                  // Extract enum dependencies FIRST (before the schema that uses them)
                                  for (const imp of reExportSourceFile.getImportDeclarations()) {
                                    const impSpecifier = imp.getModuleSpecifierValue();
                                    const impNamedImports = imp.getNamedImports();
                                    
                                    for (const namedImport of impNamedImports) {
                                      const impName = namedImport.getName();
                                      if (reExportUsedIds.has(impName)) {
                                        // If this is an enum from workspace, try to inline it
                                        if (impSpecifier.startsWith('@heyclaude/')) {
                                          const enumResolved = await resolveModuleSpecifier(impSpecifier, reExportResolved);
                                          if (enumResolved && existsSync(enumResolved)) {
                                            try {
                                              const enumContent = await readFile(enumResolved, 'utf-8');
                                              // Look for: export const enumName = { ... } as const
                                              // Handle multi-line enum objects
                                              const enumMatch = enumContent.match(new RegExp(`export const ${impName}\\s*=\\s*({[\\s\\S]*?})\\s*as\\s+const`, 's'));
                                              if (enumMatch) {
                                                // Inline the enum FIRST (before schema that uses it)
                                                dependencySchemaDefs.push(`const ${impName} = ${enumMatch[1]} as const;`);
                                              } else {
                                                // Try without 'as const'
                                                const enumMatch2 = enumContent.match(new RegExp(`export const ${impName}\\s*=\\s*({[\\s\\S]*?});`, 's'));
                                                if (enumMatch2) {
                                                  dependencySchemaDefs.push(`const ${impName} = ${enumMatch2[1]};`);
                                                }
                                              }
                                            } catch {
                                              // Could not extract enum - will try to import it
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                  
                                  // NOW extract the schema (after its dependencies)
                                  const reExportCode = reExportInitializer.getText();
                                  dependencySchemaDefs.push(`const ${name} = ${reExportCode};`);
                                }
                              }
                            }
                          }
                          break;
                        }
                      }
                    }
                  }
                }
                
                if (depDeclaration && Node.isVariableDeclaration(depDeclaration)) {
                  const depInitializer = depDeclaration.getInitializer();
                  if (depInitializer) {
                    // Extract dependencies FIRST (before the schema that uses them)
                    const depUsedIds = new Set<string>();
                    depInitializer.forEachDescendant((node) => {
                      if (Node.isIdentifier(node)) {
                        const idName = node.getText();
                        if (!['z', 'string', 'pipe', 'custom', 'Object', 'values', 'as', 'readonly', 'includes', 'message', 'Invalid', 'typeof', 'keyof'].includes(idName)) {
                          depUsedIds.add(idName);
                        }
                      }
                    });
                    
                    // Check if schema uses imported enums - extract them FIRST
                    for (const imp of depSourceFile.getImportDeclarations()) {
                      const impSpecifier = imp.getModuleSpecifierValue();
                      const impNamedImports = imp.getNamedImports();
                      
                      for (const namedImport of impNamedImports) {
                        const impName = namedImport.getName();
                        if (depUsedIds.has(impName) && impSpecifier.startsWith('@heyclaude/')) {
                          // Try to extract enum FIRST
                          const enumResolved = await resolveModuleSpecifier(impSpecifier, importFilePath);
                          if (enumResolved && existsSync(enumResolved)) {
                            try {
                              const enumContent = await readFile(enumResolved, 'utf-8');
                              const enumMatch = enumContent.match(new RegExp(`export const ${impName}\\s*=\\s*({[\\s\\S]*?})\\s*as\\s+const`, 's'));
                              if (enumMatch) {
                                dependencySchemaDefs.push(`const ${impName} = ${enumMatch[1]} as const;`);
                              } else {
                                const enumMatch2 = enumContent.match(new RegExp(`export const ${impName}\\s*=\\s*({[\\s\\S]*?});`, 's'));
                                if (enumMatch2) {
                                  dependencySchemaDefs.push(`const ${impName} = ${enumMatch2[1]};`);
                                }
                              }
                            } catch {
                              // Could not extract enum
                            }
                          }
                        }
                      }
                    }
                    
                    // NOW extract the schema (after its dependencies)
                    const depCode = depInitializer.getText();
                    dependencySchemaDefs.push(`const ${name} = ${depCode};`);
                  }
                } else if (!depDeclaration) {
                  // Not found - try to import it directly
                  dependencyImports.push(`import { ${name} } from '${resolved}';`);
                }
              } else {
                // File doesn't exist - try to import
                dependencyImports.push(`import { ${name} } from '${resolved}';`);
              }
            } catch (error) {
              // If extraction fails, try to import it directly
              console.warn(`  ⚠ Could not extract dependency ${name} from ${relative(PROJECT_ROOT, importFilePath)}:`, error instanceof Error ? error.message : String(error));
              dependencyImports.push(`import { ${name} } from '${resolved}';`);
            }
          }
        }
      } else {
        // External package - keep the import as-is
        if (names.length > 0) {
          dependencyImports.push(`import { ${names.join(', ')} } from '${resolved}';`);
        }
      }
    }
    
    // 1. Extract schemas from the same file (AFTER imported schemas)
    // IMPORTANT: Extract dependencies BEFORE the main schema
    for (const identifier of usedIdentifiers) {
      // Check if this identifier is an exported schema in the same file
      let isExportedSchema = false;
      sourceFile.forEachDescendant((node) => {
        if (Node.isVariableStatement(node) && node.hasModifier('export')) {
          const declarationList = node.getDeclarationList();
          const declarations = declarationList.getDeclarations();
          for (const declaration of declarations) {
            if (declaration.getName() === identifier) {
              isExportedSchema = true;
              return;
            }
          }
        }
      });
      
      if (isExportedSchema && identifier !== schemaName) {
        // Extract directly from AST (not recursively, to avoid full modules)
        let depDeclaration: Node | null = null;
        sourceFile.forEachDescendant((node) => {
          if (Node.isVariableStatement(node) && node.hasModifier('export')) {
            const declarationList = node.getDeclarationList();
            const declarations = declarationList.getDeclarations();
            for (const declaration of declarations) {
              if (declaration.getName() === identifier) {
                depDeclaration = declaration;
                return;
              }
            }
          }
        });
        
        if (depDeclaration && Node.isVariableDeclaration(depDeclaration)) {
          const depInitializer = depDeclaration.getInitializer();
          if (depInitializer) {
            // Extract dependencies of this schema FIRST (like enums and other schemas it uses)
            const depUsedIds = new Set<string>();
            depInitializer.forEachDescendant((node) => {
              if (Node.isIdentifier(node)) {
                const idName = node.getText();
                if (!['z', 'string', 'pipe', 'custom', 'Object', 'values', 'as', 'readonly', 'includes', 'message', 'Invalid', 'typeof', 'keyof'].includes(idName)) {
                  depUsedIds.add(idName);
                }
              }
            });
            
            // Check if this schema uses imported schemas or enums - extract them FIRST
            for (const imp of sourceFile.getImportDeclarations()) {
              const impSpecifier = imp.getModuleSpecifierValue();
              const impNamedImports = imp.getNamedImports();
              
              for (const namedImport of impNamedImports) {
                const impName = namedImport.getName();
                if (depUsedIds.has(impName)) {
                  // Check if it's an enum from workspace
                  if (impSpecifier.startsWith('@heyclaude/')) {
                    const enumResolved = await resolveModuleSpecifier(impSpecifier, filePath);
                    if (enumResolved && existsSync(enumResolved)) {
                      try {
                        const enumContent = await readFile(enumResolved, 'utf-8');
                        // Try to match enum pattern first
                        const enumMatch = enumContent.match(new RegExp(`export const ${impName}\\s*=\\s*({[\\s\\S]*?})\\s*as\\s+const`, 's'));
                        if (enumMatch) {
                          dependencySchemaDefs.push(`const ${impName} = ${enumMatch[1]} as const;`);
                          continue; // Skip to next import
                        } else {
                          const enumMatch2 = enumContent.match(new RegExp(`export const ${impName}\\s*=\\s*({[\\s\\S]*?});`, 's'));
                          if (enumMatch2) {
                            dependencySchemaDefs.push(`const ${impName} = ${enumMatch2[1]};`);
                            continue; // Skip to next import
                          }
                        }
                        
                        // Not an enum - might be a schema, try to extract it
                        // Use AST to extract the schema definition
                        const depProject = new Project({
                          skipAddingFilesFromTsConfig: true,
                          skipFileDependencyResolution: true,
                          skipLoadingLibFiles: true,
                        });
                        
                        const depSourceFile = depProject.addSourceFileAtPathIfExists(enumResolved);
                        if (depSourceFile) {
                          // Find the schema declaration
                          let depDeclaration: Node | null = null;
                          depSourceFile.forEachDescendant((node) => {
                            if (Node.isVariableStatement(node) && node.hasModifier('export')) {
                              const declarationList = node.getDeclarationList();
                              const declarations = declarationList.getDeclarations();
                              for (const declaration of declarations) {
                                if (declaration.getName() === impName) {
                                  depDeclaration = declaration;
                                  return;
                                }
                              }
                            }
                          });
                          
                          // Check for re-exports
                          if (!depDeclaration) {
                            for (const exp of depSourceFile.getExportDeclarations()) {
                              const moduleSpecifier = exp.getModuleSpecifierValue();
                              if (moduleSpecifier) {
                                const namedExports = exp.getNamedExports();
                                for (const namedExport of namedExports) {
                                  if (namedExport.getName() === impName) {
                                    // Re-export - recursively extract from source
                                    const reExportResolved = await resolveModuleSpecifier(moduleSpecifier, enumResolved);
                                    if (reExportResolved && existsSync(reExportResolved)) {
                                      // Recursively extract the schema (this will handle dependencies)
                                      const nestedSchemaDef = await extractSchemaDefinitionWithDependencies(
                                        reExportResolved,
                                        impName,
                                        extractedSchemas,
                                        depth + 1
                                      );
                                      if (nestedSchemaDef) {
                                        // Extract just the schema definition from the nested module
                                        // The nested module already has all dependencies inlined
                                        const schemaMatch = nestedSchemaDef.match(new RegExp(`export const ${impName}\\s*=\\s*([\\s\\S]*?);\\s*$`, 'm'));
                                        if (schemaMatch) {
                                          // Extract all dependencies from the nested module (enums, etc.)
                                          // and the schema itself
                                          const lines = nestedSchemaDef.split('\n');
                                          let inDependencies = false;
                                          const depLines: string[] = [];
                                          for (const line of lines) {
                                            if (line.includes(`const ${impName} =`) || line.includes(`export const ${impName} =`)) {
                                              // Extract just the const declaration (without export)
                                              const constMatch = line.match(/export\s+const\s+(\w+)\s*=\s*([\s\S]*?);/);
                                              if (constMatch) {
                                                depLines.push(`const ${constMatch[1]} = ${constMatch[2]};`);
                                              } else {
                                                depLines.push(line.replace(/export\s+/, ''));
                                              }
                                              break;
                                            } else if (line.trim().startsWith('const ') && !line.includes('export')) {
                                              // This is a dependency (enum or other schema)
                                              depLines.push(line);
                                            }
                                          }
                                          dependencySchemaDefs.push(...depLines);
                                        }
                                      }
                                    }
                                    break;
                                  }
                                }
                              }
                            }
                          } else if (depDeclaration && Node.isVariableDeclaration(depDeclaration)) {
                            const depInitializer = depDeclaration.getInitializer();
                            if (depInitializer) {
                              const depCode = depInitializer.getText();
                              dependencySchemaDefs.push(`const ${impName} = ${depCode};`);
                            }
                          }
                        }
                      } catch {
                        // Could not extract - will try to import it (may fail)
                      }
                    }
                  } else if (impSpecifier.startsWith('./') || impSpecifier.startsWith('../')) {
                    // Relative import - might be a schema
                    const schemaResolved = await resolveModuleSpecifier(impSpecifier, filePath);
                    if (schemaResolved && existsSync(schemaResolved)) {
                      // Recursively extract the schema
                      const nestedSchemaDef = await extractSchemaDefinitionWithDependencies(
                        schemaResolved,
                        impName,
                        extractedSchemas,
                        depth + 1
                      );
                      if (nestedSchemaDef) {
                        // Extract the schema definition from the nested module
                        const schemaMatch = nestedSchemaDef.match(new RegExp(`export const ${impName}\\s*=\\s*([\\s\\S]*?);\\s*$`, 'm'));
                        if (schemaMatch) {
                          dependencySchemaDefs.push(`const ${impName} = ${schemaMatch[1]};`);
                        }
                      }
                    }
                  }
                }
              }
            }
            
            // NOW extract the schema (after its dependencies)
            const depCode = depInitializer.getText();
            dependencySchemaDefs.push(`const ${identifier} = ${depCode};`);
          }
        }
      }
    }
    
    // 2. Extract schemas from imported files (for workspace/relative imports)
    for (const [originalSpecifier, { resolved, names, filePath: importFilePath }] of importMap) {
      // Only process workspace and relative imports (skip node_modules)
      if (originalSpecifier.startsWith('@heyclaude/') || originalSpecifier.startsWith('./') || originalSpecifier.startsWith('../')) {
        if (existsSync(importFilePath)) {
          // For each imported name, check if it's an exported schema in that file
          for (const name of names) {
            try {
              // Use AST to extract just the schema definition from the imported file
              const depProject = new Project({
                skipAddingFilesFromTsConfig: true,
                skipFileDependencyResolution: true,
                skipLoadingLibFiles: true,
              });
              
              const depSourceFile = depProject.addSourceFileAtPathIfExists(importFilePath);
              if (depSourceFile) {
                // Find the schema declaration
                let depDeclaration: Node | null = null;
                depSourceFile.forEachDescendant((node) => {
                  if (Node.isVariableStatement(node) && node.hasModifier('export')) {
                    const declarationList = node.getDeclarationList();
                    const declarations = declarationList.getDeclarations();
                    for (const declaration of declarations) {
                      if (declaration.getName() === name) {
                        depDeclaration = declaration;
                        return;
                      }
                    }
                  }
                });
                
                // Check for re-exports
                if (!depDeclaration) {
                  for (const exp of depSourceFile.getExportDeclarations()) {
                    const moduleSpecifier = exp.getModuleSpecifierValue();
                    if (moduleSpecifier) {
                      const namedExports = exp.getNamedExports();
                      for (const namedExport of namedExports) {
                        if (namedExport.getName() === name) {
                          // Re-export - recursively extract from source
                          const reExportResolved = await resolveModuleSpecifier(moduleSpecifier, importFilePath);
                          if (reExportResolved && existsSync(reExportResolved)) {
                            // Use AST to extract directly from the re-exported file
                            const reExportProject = new Project({
                              skipAddingFilesFromTsConfig: true,
                              skipFileDependencyResolution: true,
                              skipLoadingLibFiles: true,
                            });
                            
                            const reExportSourceFile = reExportProject.addSourceFileAtPathIfExists(reExportResolved);
                            if (reExportSourceFile) {
                              // Find the schema declaration in the re-exported file
                              let reExportDeclaration: Node | null = null;
                              reExportSourceFile.forEachDescendant((node) => {
                                if (Node.isVariableStatement(node) && node.hasModifier('export')) {
                                  const declarationList = node.getDeclarationList();
                                  const declarations = declarationList.getDeclarations();
                                  for (const declaration of declarations) {
                                    if (declaration.getName() === name) {
                                      reExportDeclaration = declaration;
                                      return;
                                    }
                                  }
                                }
                              });
                              
                              if (reExportDeclaration && Node.isVariableDeclaration(reExportDeclaration)) {
                                const reExportInitializer = reExportDeclaration.getInitializer();
                                if (reExportInitializer) {
                                  // Extract imports from the re-exported file FIRST (before schema)
                                  // Check if schema uses imported enums that need to be inlined
                                  const reExportUsedIds = new Set<string>();
                                  reExportInitializer.forEachDescendant((node) => {
                                    if (Node.isIdentifier(node)) {
                                      const idName = node.getText();
                                      if (!['z', 'string', 'pipe', 'custom', 'Object', 'values', 'as', 'readonly', 'includes', 'message', 'Invalid', 'typeof', 'keyof'].includes(idName)) {
                                        reExportUsedIds.add(idName);
                                      }
                                    }
                                  });
                                  
                                  // Extract enum dependencies FIRST (before the schema that uses them)
                                  for (const imp of reExportSourceFile.getImportDeclarations()) {
                                    const impSpecifier = imp.getModuleSpecifierValue();
                                    const impNamedImports = imp.getNamedImports();
                                    
                                    for (const namedImport of impNamedImports) {
                                      const impName = namedImport.getName();
                                      if (reExportUsedIds.has(impName)) {
                                        // If this is an enum from workspace, try to inline it
                                        if (impSpecifier.startsWith('@heyclaude/')) {
                                          const enumResolved = await resolveModuleSpecifier(impSpecifier, reExportResolved);
                                          if (enumResolved && existsSync(enumResolved)) {
                                            try {
                                              const enumContent = await readFile(enumResolved, 'utf-8');
                                              // Look for: export const enumName = { ... } as const
                                              // Handle multi-line enum objects
                                              const enumMatch = enumContent.match(new RegExp(`export const ${impName}\\s*=\\s*({[\\s\\S]*?})\\s*as\\s+const`, 's'));
                                              if (enumMatch) {
                                                // Inline the enum FIRST (before schema that uses it)
                                                dependencySchemaDefs.push(`const ${impName} = ${enumMatch[1]} as const;`);
                                              } else {
                                                // Try without 'as const'
                                                const enumMatch2 = enumContent.match(new RegExp(`export const ${impName}\\s*=\\s*({[\\s\\S]*?});`, 's'));
                                                if (enumMatch2) {
                                                  dependencySchemaDefs.push(`const ${impName} = ${enumMatch2[1]};`);
                                                }
                                              }
                                            } catch {
                                              // Could not extract enum - will try to import it
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                  
                                  // NOW extract the schema (after its dependencies)
                                  const reExportCode = reExportInitializer.getText();
                                  dependencySchemaDefs.push(`const ${name} = ${reExportCode};`);
                                }
                              }
                            }
                          }
                          break;
                        }
                      }
                    }
                  }
                }
                
                if (depDeclaration && Node.isVariableDeclaration(depDeclaration)) {
                  const depInitializer = depDeclaration.getInitializer();
                  if (depInitializer) {
                    // Extract dependencies FIRST (before the schema that uses them)
                    const depUsedIds = new Set<string>();
                    depInitializer.forEachDescendant((node) => {
                      if (Node.isIdentifier(node)) {
                        const idName = node.getText();
                        if (!['z', 'string', 'pipe', 'custom', 'Object', 'values', 'as', 'readonly', 'includes', 'message', 'Invalid', 'typeof', 'keyof'].includes(idName)) {
                          depUsedIds.add(idName);
                        }
                      }
                    });
                    
                    // Check if schema uses imported enums - extract them FIRST
                    for (const imp of depSourceFile.getImportDeclarations()) {
                      const impSpecifier = imp.getModuleSpecifierValue();
                      const impNamedImports = imp.getNamedImports();
                      
                      for (const namedImport of impNamedImports) {
                        const impName = namedImport.getName();
                        if (depUsedIds.has(impName) && impSpecifier.startsWith('@heyclaude/')) {
                          // Try to extract enum FIRST
                          const enumResolved = await resolveModuleSpecifier(impSpecifier, importFilePath);
                          if (enumResolved && existsSync(enumResolved)) {
                            try {
                              const enumContent = await readFile(enumResolved, 'utf-8');
                              const enumMatch = enumContent.match(new RegExp(`export const ${impName}\\s*=\\s*({[\\s\\S]*?})\\s*as\\s+const`, 's'));
                              if (enumMatch) {
                                dependencySchemaDefs.push(`const ${impName} = ${enumMatch[1]} as const;`);
                              } else {
                                const enumMatch2 = enumContent.match(new RegExp(`export const ${impName}\\s*=\\s*({[\\s\\S]*?});`, 's'));
                                if (enumMatch2) {
                                  dependencySchemaDefs.push(`const ${impName} = ${enumMatch2[1]};`);
                                }
                              }
                            } catch {
                              // Could not extract enum
                            }
                          }
                        }
                      }
                    }
                    
                    // NOW extract the schema (after its dependencies)
                    const depCode = depInitializer.getText();
                    dependencySchemaDefs.push(`const ${name} = ${depCode};`);
                  }
                } else if (!depDeclaration) {
                  // Not found - try to import it directly
                  dependencyImports.push(`import { ${name} } from '${resolved}';`);
                }
              } else {
                // File doesn't exist - try to import
                dependencyImports.push(`import { ${name} } from '${resolved}';`);
              }
            } catch (error) {
              // If extraction fails, try to import it directly
              console.warn(`  ⚠ Could not extract dependency ${name} from ${relative(PROJECT_ROOT, importFilePath)}:`, error instanceof Error ? error.message : String(error));
              dependencyImports.push(`import { ${name} } from '${resolved}';`);
            }
          }
        }
      } else {
        // External package - keep the import as-is
        if (names.length > 0) {
          dependencyImports.push(`import { ${names.join(', ')} } from '${resolved}';`);
        }
      }
    }
    
    // Build import statements for external packages only
    // Internal dependencies are inlined above
    // Deduplicate imports
    const importSet = new Set<string>(dependencyImports);
    
    // Always include zod and zod-openapi (only once)
    importSet.add("import 'zod-openapi';");
    importSet.add("import { z } from 'zod';");
    
    const importStatements = Array.from(importSet);
    
    // Build standalone module with all dependencies inlined
    // IMPORTANT: dependencySchemaDefs already contains enums in the correct order
    // (enums are added FIRST, then schemas that use them)
    const standaloneModule = `// Standalone schema evaluation module
// Extracted from ${relative(PROJECT_ROOT, filePath)}
// Schema: ${schemaName}

// Mock server-only for schema evaluation
if (typeof require !== 'undefined') {
  require.cache['server-only'] = { exports: {} };
}

${importStatements.join('\n')}

${dependencySchemaDefs.join('\n\n')}

export const ${schemaName} = ${schemaCode};
`;
    
    return standaloneModule;
  }

  /**
   * Recursively preprocess a file and all its workspace dependencies
   * This creates a complete preprocessed file with all imports resolved to absolute paths
   * Handles both workspace packages and relative imports
   * 
   * CRITICAL: This function must ensure ALL imports in ALL dependencies are resolved,
   * not just the top-level file. When jiti imports the preprocessed file, it will
   * encounter imports in dependencies that also need to be resolved.
   * 
   * Strategy: Process all dependencies recursively, then replace ALL imports with
   * absolute paths in a single pass to ensure nothing is missed.
   */
  async function preprocessFileWithDependencies(
    filePath: string,
    processedFiles: Set<string> = new Set(),
    depth: number = 0
  ): Promise<string> {
    // Prevent infinite recursion
    if (depth > 20) {
      throw new Error(`Maximum dependency depth exceeded for ${filePath}`);
    }
    
    // Prevent circular dependencies
    const normalizedPath = filePath.replace(/\\/g, '/');
    if (processedFiles.has(normalizedPath)) {
      // File already processed - return empty to avoid duplication
      return '';
    }
    processedFiles.add(normalizedPath);
    
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    let content = await readFile(filePath, 'utf-8');
    
    // Find all imports (both workspace and relative) that need resolution
    const importRegex = /from\s+['"]([^'"]+)['"]/g;
    const importsToProcess: Array<{ specifier: string; resolved: string | null; match: string }> = [];
    let match;
    
    // Collect all imports that need resolution
    while ((match = importRegex.exec(content)) !== null) {
      const specifier = match[1];
      // Only process workspace packages and relative imports (skip node_modules, etc.)
      if (specifier.startsWith('@heyclaude/') || specifier.startsWith('./') || specifier.startsWith('../')) {
        const resolved = await resolveModuleSpecifier(specifier, filePath);
        if (resolved) {
          importsToProcess.push({ specifier, resolved, match: match[0] });
        }
      }
    }
    
    // Recursively preprocess all dependencies first (depth-first)
    // This ensures all dependencies are processed before we replace imports
    for (const { resolved } of importsToProcess) {
      if (resolved) {
        await preprocessFileWithDependencies(resolved, processedFiles, depth + 1);
      }
    }
    
    // Now replace ALL imports with resolved absolute paths in a single pass
    // Use a map to track replacements to avoid double-replacement
    const replacementMap = new Map<string, string>();
    for (const { match: importMatch, resolved } of importsToProcess) {
      if (resolved) {
        replacementMap.set(importMatch, `from '${resolved}'`);
      }
    }
    
    // Apply all replacements
    for (const [oldImport, newImport] of replacementMap) {
      content = content.replace(oldImport, newImport);
    }
    
    // Final pass: catch any remaining imports that might have been missed
    // This handles edge cases where imports are in different formats
    const finalPassRegex = /from\s+['"](@heyclaude\/[^'"]+|\.\.?\/[^'"]+)['"]/g;
    let finalMatch;
    const finalReplacements: Array<{ old: string; new: string }> = [];
    
    while ((finalMatch = finalPassRegex.exec(content)) !== null) {
      const specifier = finalMatch[1];
      const resolved = await resolveModuleSpecifier(specifier, filePath);
      if (resolved) {
        finalReplacements.push({ old: finalMatch[0], new: `from '${resolved}'` });
      }
    }
    
    // Apply final replacements
    for (const { old, new: newImport } of finalReplacements) {
      content = content.replace(old, newImport);
    }
    
    return content;
  }

  /**
   * Preprocess import statements to resolve workspace packages to file paths
   * This is a simpler version for inline code snippets
   */
  function preprocessImports(code: string): string {
    // Replace @heyclaude/* imports with resolved file paths
    return code.replace(
      /from\s+['"](@heyclaude\/[^'"]+)['"]/g,
      (match, moduleSpecifier) => {
        const resolved = resolveWorkspacePackage(moduleSpecifier);
        if (resolved && existsSync(resolved)) {
          // Use absolute path for jiti
          return `from '${resolved}'`;
        }
        return match; // Keep original if can't resolve
      }
    );
  }

  /**
   * Custom module resolver for jiti that understands workspace packages
   * This allows jiti to resolve @heyclaude/* imports correctly
   */
  function createJitiResolver() {
    return (id: string, parentPath?: string) => {
      // Try to resolve workspace packages first
      if (id.startsWith('@heyclaude/')) {
        const resolved = resolveWorkspacePackage(id);
        if (resolved && existsSync(resolved)) {
          return resolved;
        }
      }
      
      // Try to resolve relative imports
      if (parentPath && (id.startsWith('./') || id.startsWith('../'))) {
        const resolved = join(dirname(parentPath), id);
        // Try with .ts extension
        if (existsSync(resolved + '.ts')) {
          return resolved + '.ts';
        }
        // Try without extension
        if (existsSync(resolved)) {
          return resolved;
        }
        // Try .tsx
        if (existsSync(resolved + '.tsx')) {
          return resolved + '.tsx';
        }
      }
      
      // Return original for Node.js to handle (node_modules, etc.)
      return id;
    };
  }

  // Initialize jiti for handling server-only imports
  // jiti can handle TypeScript and server-only imports automatically
  // Use custom resolver to handle workspace packages
  const jitiInstance = jiti(PROJECT_ROOT, {
    interopDefault: true,
    // Note: jiti doesn't directly support custom resolvers in the way we need
    // We'll handle resolution via preprocessing instead
  });
  
  try {
    // Try to import the route file using jiti (handles server-only)
    let routeModule: any = null;
    
    try {
      // Use jiti to import route file - it can handle server-only dependencies
      routeModule = (await jitiInstance.import(filePath)) as any;
      // console.log(`✓ Successfully imported route file: ${relativePath}`);
    } catch (error) {
      // File has dependencies we can't import - that's okay
      // We'll try to import schemas from shared modules instead
      // Note: This is expected for files with 'server-only' imports
      // console.warn(`Could not import route file ${relativePath}:`, error instanceof Error ? error.message : String(error));
    }
    
    // Process routes to extract schemas
    // Even if routeModule is null (can't import route file), we can still try to get schemas from shared modules
    for (const route of routes) {
      // If we successfully imported the route module, try to get schemas from it
      if (routeModule) {
        // Debug: log what's available in the module
        // console.log(`  Available exports in ${relativePath}:`, Object.keys(routeModule));
        
        // If we have an exported schema name, try to get it from the module
        if (route.querySchemaName && routeModule[route.querySchemaName]) {
          const schema = routeModule[route.querySchemaName];
          if (schema && typeof schema === 'object' && '_def' in schema) {
            route.querySchema = schema as z.ZodSchema;
            // console.log(`  ✓ Extracted query schema: ${route.querySchemaName}`);
          }
        }
        
        if (route.bodySchemaName && routeModule[route.bodySchemaName]) {
          const schema = routeModule[route.bodySchemaName];
          if (schema && typeof schema === 'object' && '_def' in schema) {
            route.bodySchema = schema as z.ZodSchema;
            // console.log(`  ✓ Extracted body schema: ${route.bodySchemaName}`);
          }
        }
        
        // If schema source is an identifier and we found it in exports, use it
        if (route.querySchemaSource && !route.querySchema) {
          const schemaName = route.querySchemaSource.trim();
          // Remove " as any" suffix if present
          const cleanSchemaName = schemaName.replace(/\s+as\s+any$/, '');
          if (routeModule[cleanSchemaName]) {
            const schema = routeModule[cleanSchemaName];
            if (schema && typeof schema === 'object' && '_def' in schema) {
              route.querySchema = schema as z.ZodSchema;
              // console.log(`  ✓ Extracted query schema from module: ${cleanSchemaName}`);
            }
          }
        }
        
        if (route.bodySchemaSource && !route.bodySchema) {
          const schemaName = route.bodySchemaSource.trim();
          // Remove " as any" suffix if present
          const cleanSchemaName = schemaName.replace(/\s+as\s+any$/, '');
          if (routeModule[cleanSchemaName]) {
            const schema = routeModule[cleanSchemaName];
            if (schema && typeof schema === 'object' && '_def' in schema) {
              route.bodySchema = schema as z.ZodSchema;
              // console.log(`  ✓ Extracted body schema from module: ${cleanSchemaName}`);
            }
          }
        }
        
        // Evaluate response schemas (similar to query/body schemas)
        if (route.openapi?.responses && route.responseSchemaSources) {
          for (const [code, schemaSource] of Object.entries(route.responseSchemaSources)) {
            const statusCode = parseInt(code, 10);
            if (!isNaN(statusCode) && route.openapi.responses[statusCode] && !route.openapi.responses[statusCode].schema) {
              const schemaName = schemaSource.trim();
              const cleanSchemaName = schemaName.replace(/\s+as\s+\w+$/, '');
              
              // Try to get from route module exports
              if (routeModule[cleanSchemaName]) {
                const schema = routeModule[cleanSchemaName];
                if (schema && typeof schema === 'object' && '_def' in schema) {
                  route.openapi.responses[statusCode].schema = schema as z.ZodSchema;
                }
              }
            }
          }
        }
      } else if (sourceFile) {
        // Route file couldn't be imported, but we can try to extract exported schemas using AST
        // Look for exported variable declarations that match our schema names
        let querySchemaNameToExtract = route.querySchemaName;
        if (!querySchemaNameToExtract && route.querySchemaSource) {
          let trimmed = route.querySchemaSource.trim();
          // Remove " as any" or other type assertions
          trimmed = trimmed.replace(/\s+as\s+\w+$/, '');
          if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(trimmed)) {
            querySchemaNameToExtract = trimmed;
          }
        }
        
        if (querySchemaNameToExtract) {
          const schemaName = querySchemaNameToExtract;
          if (schemaName) {
            // Manually find exported variable declaration using AST traversal
            let foundDeclaration: Node | null = null;
            sourceFile.forEachDescendant((node) => {
              if (Node.isVariableStatement(node) && node.hasModifier('export')) {
                const declarationList = node.getDeclarationList();
                const declarations = declarationList.getDeclarations();
                for (const decl of declarations) {
                  if (decl.getName() === schemaName) {
                    foundDeclaration = decl;
                  }
                }
              }
            });
            
            if (foundDeclaration && Node.isVariableDeclaration(foundDeclaration)) {
              const init = foundDeclaration.getInitializer();
              if (init) {
                // Try to create a temporary file with just the schema and import it using jiti
                try {
                  const schemaSource = init.getText();
                  // Get all imports from the source file
                  const imports: string[] = [];
                  for (const imp of sourceFile.getImportDeclarations()) {
                    const spec = imp.getModuleSpecifierValue();
                    const namedImports = imp.getNamedImports();
                    if (namedImports.length > 0) {
                      const named = namedImports.map(n => n.getName()).join(', ');
                      imports.push(`import { ${named} } from '${spec}';`);
                    }
                    const defaultImport = imp.getDefaultImport();
                    if (defaultImport) {
                      imports.push(`import ${defaultImport.getText()} from '${spec}';`);
                    }
                  }
                  // Filter out 'server-only' import - we'll mock it
                  const filteredImports = imports.filter(imp => !imp.includes("'server-only'") && !imp.includes('"server-only"'));
                  // Check if zod is already imported
                  let hasZodImport = false;
                  for (const imp of filteredImports) {
                    if (imp.includes('from \'zod\'') || imp.includes('from "zod"') || imp.includes('from \'zod') || imp.includes('from "zod')) {
                      hasZodImport = true;
                      break;
                    }
                  }
                  // Only add zod import if not already present
                  const zodImports = hasZodImport ? '' : "import { z } from 'zod';\nimport 'zod-openapi';\n";
                  // Create a minimal module that exports just the schema
                  // Mock 'server-only' as a no-op
                  // Preprocess imports to resolve workspace packages
                  const rawImports = filteredImports.join('\n');
                  const preprocessedImports = preprocessImports(rawImports);
                  const tempModuleCode = `// Mock server-only for schema evaluation\nif (typeof require !== 'undefined') {\n  require.cache['server-only'] = { exports: {} };\n}\n${zodImports}${preprocessedImports}\nexport const ${schemaName} = ${schemaSource};\n`;
                  // Write to temp file and import it using jiti
                  const tempPath = join(PROJECT_ROOT, `.temp-schema-${schemaName}-${Date.now()}.ts`);
                  writeFileSync(tempPath, tempModuleCode, 'utf-8');
                  try {
                    const tempModule = (await jitiInstance.import(tempPath)) as any;
                    if (tempModule[schemaName] && typeof tempModule[schemaName] === 'object' && '_def' in tempModule[schemaName]) {
                      route.querySchema = tempModule[schemaName] as z.ZodSchema;
                    }
                  } finally {
                    try {
                      unlinkSync(tempPath);
                    } catch {
                      // Ignore cleanup errors
                    }
                  }
                } catch (error) {
                  // Could not extract schema - will try shared modules
                  console.warn(`  ⚠ Could not extract schema ${schemaName} from temp file:`, error instanceof Error ? error.message : String(error));
                }
              }
            }
          }
        }
        
        // Same for body schema
        let bodySchemaNameToExtract = route.bodySchemaName;
        if (!bodySchemaNameToExtract && route.bodySchemaSource) {
          let trimmed = route.bodySchemaSource.trim();
          // Remove " as any" or other type assertions
          trimmed = trimmed.replace(/\s+as\s+\w+$/, '');
          if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(trimmed)) {
            bodySchemaNameToExtract = trimmed;
          }
        }
        
        if (bodySchemaNameToExtract) {
          const schemaName = bodySchemaNameToExtract;
          if (schemaName) {
            // Manually find exported variable declaration using AST traversal
            let foundDeclaration: Node | null = null;
            sourceFile.forEachDescendant((node) => {
              if (Node.isVariableStatement(node) && node.hasModifier('export')) {
                const declarationList = node.getDeclarationList();
                const declarations = declarationList.getDeclarations();
                for (const decl of declarations) {
                  if (decl.getName() === schemaName) {
                    foundDeclaration = decl;
                  }
                }
              }
            });
            
            if (foundDeclaration && Node.isVariableDeclaration(foundDeclaration)) {
              const init = foundDeclaration.getInitializer();
              if (init) {
                try {
                  const schemaSource = init.getText();
                  // Get all imports from the source file
                  const imports: string[] = [];
                  for (const imp of sourceFile.getImportDeclarations()) {
                    const spec = imp.getModuleSpecifierValue();
                    const namedImports = imp.getNamedImports();
                    if (namedImports.length > 0) {
                      const named = namedImports.map(n => n.getName()).join(', ');
                      imports.push(`import { ${named} } from '${spec}';`);
                    }
                    const defaultImport = imp.getDefaultImport();
                    if (defaultImport) {
                      imports.push(`import ${defaultImport.getText()} from '${spec}';`);
                    }
                  }
                  // Filter out 'server-only' import - we'll mock it
                  const filteredImports = imports.filter(imp => !imp.includes("'server-only'") && !imp.includes('"server-only"'));
                  // Check if zod is already imported
                  let hasZodImport = false;
                  for (const imp of filteredImports) {
                    if (imp.includes('from \'zod\'') || imp.includes('from "zod"') || imp.includes('from \'zod') || imp.includes('from "zod')) {
                      hasZodImport = true;
                      break;
                    }
                  }
                  // Only add zod import if not already present
                  const zodImports = hasZodImport ? '' : "import { z } from 'zod';\nimport 'zod-openapi';\n";
                  // Preprocess imports to resolve workspace packages
                  const rawImports = filteredImports.join('\n');
                  const preprocessedImports = preprocessImports(rawImports);
                  const tempModuleCode = `// Mock server-only for schema evaluation\nif (typeof require !== 'undefined') {\n  require.cache['server-only'] = { exports: {} };\n}\n${zodImports}${preprocessedImports}\nexport const ${schemaName} = ${schemaSource};\n`;
                  const tempPath = join(PROJECT_ROOT, `.temp-schema-${schemaName}-${Date.now()}.ts`);
                  writeFileSync(tempPath, tempModuleCode, 'utf-8');
                  try {
                    const tempModule = (await jitiInstance.import(tempPath)) as any;
                    if (tempModule[schemaName] && typeof tempModule[schemaName] === 'object' && '_def' in tempModule[schemaName]) {
                      route.bodySchema = tempModule[schemaName] as z.ZodSchema;
                    }
                  } finally {
                    try {
                      unlinkSync(tempPath);
                    } catch {
                      // Ignore cleanup errors
                    }
                  }
                } catch (error) {
                  // Could not extract schema
                  console.warn(`  ⚠ Could not extract body schema ${schemaName} from temp file:`, error instanceof Error ? error.message : String(error));
                }
              }
            }
          }
        }
        
        // Handle schema extraction from shared modules (e.g., trendingQuerySchema from @heyclaude/web-runtime/server)
        // First, try to extract from shared modules if it's a simple identifier
        if (route.querySchemaSource && !route.querySchema) {
          const schemaSource = route.querySchemaSource.trim();
          // Remove " as any" suffix if present
          const cleanSchemaName = schemaSource.replace(/\s+as\s+any$/, '');
          
          // If it's a simple identifier, try to extract from shared modules
          if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(cleanSchemaName)) {
            // Check if this schema is imported from a shared module
            for (const imp of sourceFile.getImportDeclarations()) {
              const moduleSpecifier = imp.getModuleSpecifierValue();
              const namedImports = imp.getNamedImports();
              
              // Check if the schema is imported from this module
              for (const namedImport of namedImports) {
                if (namedImport.getName() === cleanSchemaName) {
                  // This schema is imported - try to extract it from the source module
                  if (moduleSpecifier.startsWith('@heyclaude/') || moduleSpecifier.startsWith('./') || moduleSpecifier.startsWith('../')) {
                    const schemasPath = await resolveModuleSpecifier(moduleSpecifier, filePath);
                    if (schemasPath && existsSync(schemasPath)) {
                      try {
                        // Use AST extraction to get the schema with all dependencies
                        const schemaDefinition = await extractSchemaDefinitionWithDependencies(
                          schemasPath,
                          cleanSchemaName
                        );
                        
                        if (schemaDefinition) {
                          // Write standalone evaluation module with all dependencies inlined
                          const tempSchemasPath = join(PROJECT_ROOT, `.temp-schema-${cleanSchemaName}-${Date.now()}.ts`);
                          await writeFile(tempSchemasPath, schemaDefinition, 'utf-8');
                          
                          try {
                            const module = (await jitiInstance.import(tempSchemasPath)) as any;
                            if (module && module[cleanSchemaName]) {
                              const schema = module[cleanSchemaName];
                              if (schema && typeof schema === 'object' && ('_def' in schema || schema instanceof z.ZodType)) {
                                route.querySchema = schema as z.ZodSchema;
                                console.log(`  ✓ Extracted query schema ${cleanSchemaName} using AST extraction`);
                                break;
                              }
                            }
                          } catch (error) {
                            // AST extraction failed, fall back to preprocessing approach
                            console.warn(`  ⚠ AST extraction failed for ${cleanSchemaName}, trying preprocessing:`, error instanceof Error ? error.message : String(error));
                            
                            // Fallback: Try the preprocessing approach
                            try {
                              const processedFiles = new Set<string>();
                              const preprocessedContent = await preprocessFileWithDependencies(schemasPath, processedFiles);
                              const tempSchemasPath = join(PROJECT_ROOT, `.temp-schema-preprocessed-${cleanSchemaName}-${Date.now()}.ts`);
                              await writeFile(tempSchemasPath, preprocessedContent, 'utf-8');
                              
                              try {
                                const module = (await jitiInstance.import(tempSchemasPath)) as any;
                                if (module && module[cleanSchemaName]) {
                                  const schema = module[cleanSchemaName];
                                  if (schema && typeof schema === 'object' && ('_def' in schema || schema instanceof z.ZodType)) {
                                    route.querySchema = schema as z.ZodSchema;
                                    console.log(`  ✓ Extracted query schema ${cleanSchemaName} using preprocessing fallback`);
                                  }
                                }
                              } finally {
                                try {
                                  await unlink(tempSchemasPath);
                                } catch {
                                  // Ignore cleanup errors
                                }
                              }
                            } catch (preprocessError) {
                              console.warn(`  ⚠ Preprocessing fallback also failed for ${cleanSchemaName}:`, preprocessError instanceof Error ? preprocessError.message : String(preprocessError));
                            }
                          } finally {
                            try {
                              await unlink(tempSchemasPath);
                            } catch {
                              // Ignore cleanup errors
                            }
                          }
                        }
                      } catch (error) {
                        // Could not extract schema
                        console.warn(`  ⚠ Could not extract query schema ${cleanSchemaName} from ${relative(PROJECT_ROOT, schemasPath)}:`, error instanceof Error ? error.message : String(error));
                      }
                      break;
                    }
                  }
                }
              }
            }
          }
        }
        
        // Handle inline schema expressions (e.g., paginationSchema.extend({ category: categorySchema }))
        // Extract the full expression and evaluate it
        if (route.querySchemaSource && !route.querySchema) {
          const schemaSource = route.querySchemaSource.trim();
          // If it's not a simple identifier, it's an inline expression - try to evaluate it
          if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(schemaSource)) {
            try {
              // Get all imports from the source file
              const imports: string[] = [];
              let hasZodImport = false;
              for (const imp of sourceFile.getImportDeclarations()) {
                const spec = imp.getModuleSpecifierValue();
                const namedImports = imp.getNamedImports();
                if (namedImports.length > 0) {
                  const named = namedImports.map(n => n.getName()).join(', ');
                  imports.push(`import { ${named} } from '${spec}';`);
                  // Check if zod is already imported
                  if (named.includes('z') && (spec === 'zod' || spec.includes('zod'))) {
                    hasZodImport = true;
                  }
                }
                const defaultImport = imp.getDefaultImport();
                if (defaultImport) {
                  imports.push(`import ${defaultImport.getText()} from '${spec}';`);
                }
              }
              // Filter out 'server-only' import - we'll mock it
              const filteredImports = imports.filter(imp => !imp.includes("'server-only'") && !imp.includes('"server-only"'));
              // Only add zod import if not already present
              const zodImports = hasZodImport ? '' : "import { z } from 'zod';\nimport 'zod-openapi';\n";
              // Create a temp module that evaluates the inline expression
              // Preprocess imports to resolve workspace packages
              const rawImports = filteredImports.join('\n');
              const preprocessedImports = preprocessImports(rawImports);
              const tempModuleCode = `// Mock server-only for schema evaluation\nif (typeof require !== 'undefined') {\n  require.cache['server-only'] = { exports: {} };\n}\n${zodImports}${preprocessedImports}\nexport const tempSchema = ${schemaSource};\n`;
              const tempPath = join(PROJECT_ROOT, `.temp-inline-query-${Date.now()}.ts`);
              writeFileSync(tempPath, tempModuleCode, 'utf-8');
              try {
                const tempModule = (await jitiInstance.import(tempPath)) as any;
                if (tempModule.tempSchema && typeof tempModule.tempSchema === 'object' && '_def' in tempModule.tempSchema) {
                  route.querySchema = tempModule.tempSchema as z.ZodSchema;
                }
              } finally {
                try {
                  unlinkSync(tempPath);
                } catch {
                  // Ignore cleanup errors
                }
              }
            } catch (error) {
              // Could not evaluate inline schema - will try shared modules
              console.warn(`  ⚠ Could not evaluate inline query schema:`, error instanceof Error ? error.message : String(error));
            }
          }
        }
        
        if (route.bodySchemaSource && !route.bodySchema) {
          const schemaSource = route.bodySchemaSource.trim();
          // If it's not a simple identifier, it's an inline expression - try to evaluate it
          if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(schemaSource)) {
            try {
              // Get all imports from the source file
              const imports: string[] = [];
              let hasZodImport = false;
              for (const imp of sourceFile.getImportDeclarations()) {
                const spec = imp.getModuleSpecifierValue();
                const namedImports = imp.getNamedImports();
                if (namedImports.length > 0) {
                  const named = namedImports.map(n => n.getName()).join(', ');
                  imports.push(`import { ${named} } from '${spec}';`);
                  // Check if zod is already imported
                  if (named.includes('z') && (spec === 'zod' || spec.includes('zod'))) {
                    hasZodImport = true;
                  }
                }
                const defaultImport = imp.getDefaultImport();
                if (defaultImport) {
                  imports.push(`import ${defaultImport.getText()} from '${spec}';`);
                }
              }
              // Filter out 'server-only' import - we'll mock it
              const filteredImports = imports.filter(imp => !imp.includes("'server-only'") && !imp.includes('"server-only"'));
              // Only add zod import if not already present
              const zodImports = hasZodImport ? '' : "import { z } from 'zod';\nimport 'zod-openapi';\n";
              // Create a temp module that evaluates the inline expression
              // Preprocess imports to resolve workspace packages
              const rawImports = filteredImports.join('\n');
              const preprocessedImports = preprocessImports(rawImports);
              const tempModuleCode = `// Mock server-only for schema evaluation\nif (typeof require !== 'undefined') {\n  require.cache['server-only'] = { exports: {} };\n}\n${zodImports}${preprocessedImports}\nexport const tempSchema = ${schemaSource};\n`;
              const tempPath = join(PROJECT_ROOT, `.temp-inline-body-${Date.now()}.ts`);
              writeFileSync(tempPath, tempModuleCode, 'utf-8');
              try {
                const tempModule = (await jitiInstance.import(tempPath)) as any;
                if (tempModule.tempSchema && typeof tempModule.tempSchema === 'object' && '_def' in tempModule.tempSchema) {
                  route.bodySchema = tempModule.tempSchema as z.ZodSchema;
                }
              } finally {
                try {
                  unlinkSync(tempPath);
                } catch {
                  // Ignore cleanup errors
                }
              }
            } catch (error) {
              // Could not evaluate inline schema - will try shared modules
              console.warn(`  ⚠ Could not evaluate inline body schema:`, error instanceof Error ? error.message : String(error));
            }
          }
        }
      }
      
      // Whether or not routeModule was imported, try to resolve schemas from imports and shared modules
      if (sourceFile) {
        // Check if schema is imported in the route file
        const imports = sourceFile.getImportDeclarations();
        for (const imp of imports) {
          const moduleSpecifier = imp.getModuleSpecifierValue();
          const namedImports = imp.getNamedImports();
          
          for (const namedImport of namedImports) {
            const importName = namedImport.getName();
            
            // Check if this import matches our query schema (clean schema source name first)
            if (route.querySchemaSource && !route.querySchema) {
              const cleanSchemaSource = route.querySchemaSource.trim().replace(/\s+as\s+\w+$/, '');
              // Debug: Log when we're checking for a match
              if (importName === cleanSchemaSource || importName.toLowerCase() === cleanSchemaSource.toLowerCase()) {
                // Try case-insensitive match if exact match fails
                if (importName !== cleanSchemaSource && importName.toLowerCase() === cleanSchemaSource.toLowerCase()) {
                  console.warn(`  ⚠ Case mismatch: importName="${importName}" vs cleanSchemaSource="${cleanSchemaSource}"`);
                }
                try {
                  // If importing from server, prefer direct schemas import to avoid server-only issues
                  if (moduleSpecifier === '@heyclaude/web-runtime/server') {
                    // Try direct schemas file first (avoids server-only dependencies)
                    const schemasPath = join(PROJECT_ROOT, 'packages/web-runtime/src/api/schemas.ts');
                    if (existsSync(schemasPath)) {
                      try {
                        // NEW APPROACH: Use AST to extract the schema definition and its dependencies
                        // This avoids module resolution issues by creating a standalone evaluation context
                        const schemaDefinition = await extractSchemaDefinitionWithDependencies(
                          schemasPath,
                          importName
                        );
                        
                        if (schemaDefinition) {
                          // Write standalone evaluation module with all dependencies inlined
                          const tempSchemasPath = join(PROJECT_ROOT, `.temp-schema-${importName}-${Date.now()}.ts`);
                          await writeFile(tempSchemasPath, schemaDefinition, 'utf-8');
                          
                          try {
                            const module = (await jitiInstance.import(tempSchemasPath)) as any;
                            if (module && module[importName]) {
                              const schema = module[importName];
                              if (schema && typeof schema === 'object' && ('_def' in schema || schema instanceof z.ZodType)) {
                                route.querySchema = schema as z.ZodSchema;
                                console.log(`  ✓ Extracted query schema ${importName} using AST extraction`);
                                break;
                              }
                            }
                          } finally {
                            try {
                              await unlink(tempSchemasPath);
                            } catch {
                              // Ignore cleanup errors
                            }
                          }
                        }
                      } catch (error) {
                        // AST extraction failed, fall back to preprocessing approach
                        console.warn(`  ⚠ AST extraction failed for ${importName}, trying preprocessing:`, error instanceof Error ? error.message : String(error));
                        
                        // Fallback: Try the preprocessing approach
                        try {
                          const processedFiles = new Set<string>();
                          const preprocessedContent = await preprocessFileWithDependencies(schemasPath, processedFiles);
                          
                          // Verify all imports are resolved
                          const unresolvedImports = preprocessedContent.match(/from\s+['"](@heyclaude\/[^'"]+|\.\.?\/[^'"]+)['"]/g);
                          if (unresolvedImports && unresolvedImports.length > 0) {
                            // Still has unresolved imports - this approach won't work
                            console.warn(`  ⚠ Preprocessing still has ${unresolvedImports.length} unresolved imports for ${importName}`);
                          } else {
                            // All imports resolved - write and import
                            const tempSchemasPath = join(PROJECT_ROOT, `.temp-schemas-${Date.now()}.ts`);
                            await writeFile(tempSchemasPath, preprocessedContent, 'utf-8');
                            
                            try {
                              const module = (await jitiInstance.import(tempSchemasPath)) as any;
                              if (module && module[importName]) {
                                const schema = module[importName];
                                if (schema && typeof schema === 'object' && ('_def' in schema || schema instanceof z.ZodType)) {
                                  route.querySchema = schema as z.ZodSchema;
                                  console.log(`  ✓ Extracted query schema ${importName} from preprocessed schemas file`);
                                  break;
                                }
                              }
                            } finally {
                              try {
                                await unlink(tempSchemasPath);
                              } catch {
                                // Ignore cleanup errors
                              }
                            }
                          }
                        } catch (fallbackError) {
                          console.warn(`  ⚠ Preprocessing fallback also failed for ${importName}:`, fallbackError instanceof Error ? fallbackError.message : String(fallbackError));
                        }
                      }
                    }
                  }
                  
                  // Try to resolve workspace package imports to source files
                  let resolvedPath: string | null = null;
                  if (moduleSpecifier.startsWith('@heyclaude/')) {
                    resolvedPath = resolveWorkspacePackage(moduleSpecifier);
                  }
                  
                  const module = resolvedPath && existsSync(resolvedPath)
                    ? (await jitiInstance.import(resolvedPath)) as any
                    : (await jitiInstance.import(moduleSpecifier)) as any;
                  
                  if (module && module[importName]) {
                    const schema = module[importName];
                    if (schema && typeof schema === 'object' && '_def' in schema) {
                      route.querySchema = schema as z.ZodSchema;
                      break;
                    }
                  }
                } catch {
                  // Could not import module - try workspace resolution as fallback
                  if (moduleSpecifier.startsWith('@heyclaude/')) {
                    try {
                      const fallbackPath = resolveWorkspacePackage(moduleSpecifier);
                      if (fallbackPath && existsSync(fallbackPath)) {
                        const module = (await jitiInstance.import(fallbackPath)) as any;
                        if (module && module[importName]) {
                          const schema = module[importName];
                          if (schema && typeof schema === 'object' && '_def' in schema) {
                            route.querySchema = schema as z.ZodSchema;
                            break;
                          }
                        }
                      }
                    } catch {
                      // Could not import module
                    }
                  }
                }
              }
            }
            
            // Check if this import matches our body schema (clean schema source name first)
            if (route.bodySchemaSource && !route.bodySchema) {
              const cleanSchemaSource = route.bodySchemaSource.trim().replace(/\s+as\s+\w+$/, '');
              if (importName === cleanSchemaSource) {
                try {
                  // If importing from server, prefer direct schemas import to avoid server-only issues
                  if (moduleSpecifier === '@heyclaude/web-runtime/server') {
                    // Try direct schemas file first (avoids server-only dependencies)
                    const schemasPath = join(PROJECT_ROOT, 'packages/web-runtime/src/api/schemas.ts');
                    if (existsSync(schemasPath)) {
                      try {
                        const module = (await jitiInstance.import(schemasPath)) as any;
                        if (module && module[importName]) {
                          const schema = module[importName];
                          if (schema && typeof schema === 'object' && '_def' in schema) {
                            route.bodySchema = schema as z.ZodSchema;
                            break;
                          }
                        }
                      } catch {
                        // Direct schemas import failed, try server.ts
                      }
                    }
                  }
                  
                  // Try to resolve workspace package imports to source files
                  let resolvedPath: string | null = null;
                  if (moduleSpecifier.startsWith('@heyclaude/')) {
                    resolvedPath = resolveWorkspacePackage(moduleSpecifier);
                  }
                  
                  const module = resolvedPath && existsSync(resolvedPath)
                    ? (await jitiInstance.import(resolvedPath)) as any
                    : (await jitiInstance.import(moduleSpecifier)) as any;
                  
                  if (module && module[importName]) {
                    const schema = module[importName];
                    if (schema && typeof schema === 'object' && '_def' in schema) {
                      route.bodySchema = schema as z.ZodSchema;
                      break;
                    }
                  }
                } catch {
                  // Could not import module - try workspace resolution as fallback
                  if (moduleSpecifier.startsWith('@heyclaude/')) {
                    try {
                      const fallbackPath = resolveWorkspacePackage(moduleSpecifier);
                      if (fallbackPath && existsSync(fallbackPath)) {
                        const module = (await jitiInstance.import(fallbackPath)) as any;
                        if (module && module[importName]) {
                          const schema = module[importName];
                          if (schema && typeof schema === 'object' && '_def' in schema) {
                            route.bodySchema = schema as z.ZodSchema;
                            break;
                          }
                        }
                      }
                    } catch {
                      // Could not import module
                    }
                  }
                }
              }
            }
          }
        }
      }
      
      // If still not found, try common shared module locations
      // This works for schemas like searchQuerySchema, paginationSchema, etc.
      if (route.querySchemaSource && !route.querySchema) {
        // Clean schema name (remove type assertions like "as any")
        const schemaName = route.querySchemaSource.trim().replace(/\s+as\s+\w+$/, '');
        if (schemaName && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(schemaName)) {
          try {
            const possibleModules = [
              // Try direct schemas file first (most reliable)
              join(PROJECT_ROOT, 'packages/web-runtime/src/api/schemas.ts'),
              // Then try server entry point (re-exports schemas)
              join(PROJECT_ROOT, 'packages/web-runtime/src/server.ts'),
              // Package imports (may fail in workspace)
              '@heyclaude/web-runtime/api/schemas',
              '@heyclaude/web-runtime/server',
            ];
            
            for (const modulePath of possibleModules) {
              try {
                let module: any = null;
                if (modulePath.startsWith('@heyclaude/')) {
                  // Try to resolve workspace package to source file first
                  const resolvedPath = resolveWorkspacePackage(modulePath);
                  if (resolvedPath && existsSync(resolvedPath)) {
                    module = (await jitiInstance.import(resolvedPath)) as any;
                  } else {
                    // Fallback to package import (may fail in workspace)
                    try {
                      module = (await jitiInstance.import(modulePath)) as any;
                    } catch {
                      // Package import failed, try source file resolution
                      const fallbackPath = resolveWorkspacePackage(modulePath);
                      if (fallbackPath && existsSync(fallbackPath)) {
                        module = (await jitiInstance.import(fallbackPath)) as any;
                      }
                    }
                  }
                } else {
                  // Try file path import using jiti (for source files)
                  module = (await jitiInstance.import(modulePath)) as any;
                }
                
                if (module && module[schemaName]) {
                  const schema = module[schemaName];
                  // Check if it's a Zod schema (has _def property or is instance of z.ZodType)
                  if (schema && typeof schema === 'object' && ('_def' in schema || schema instanceof z.ZodType)) {
                    route.querySchema = schema as z.ZodSchema;
                    console.log(`  ✓ Extracted query schema ${schemaName} from ${modulePath}`);
                    break;
                  }
                }
              } catch (error) {
                // Module not found or schema not exported - silently continue to next module
                // Only log if it's the last attempt
                if (modulePath === possibleModules[possibleModules.length - 1]) {
                  // Last attempt failed - schema not found in any module
                }
              }
            }
          } catch {
            // Could not resolve import
          }
        }
      }
      
      if (route.bodySchemaSource && !route.bodySchema) {
        // Clean schema name (remove type assertions like "as any")
        const schemaName = route.bodySchemaSource.trim().replace(/\s+as\s+\w+$/, '');
        if (schemaName && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(schemaName)) {
          try {
            const possibleModules = [
              // Try direct schemas file first (most reliable)
              join(PROJECT_ROOT, 'packages/web-runtime/src/api/schemas.ts'),
              // Then try server entry point (re-exports schemas)
              join(PROJECT_ROOT, 'packages/web-runtime/src/server.ts'),
              // Package imports (may fail in workspace)
              '@heyclaude/web-runtime/api/schemas',
              '@heyclaude/web-runtime/server',
            ];
            
            for (const modulePath of possibleModules) {
              try {
                let module: any = null;
                if (modulePath.startsWith('@heyclaude/')) {
                  // Try to resolve workspace package to source file first
                  const resolvedPath = resolveWorkspacePackage(modulePath);
                  if (resolvedPath && existsSync(resolvedPath)) {
                    module = (await jitiInstance.import(resolvedPath)) as any;
                  } else {
                    // Fallback to package import (may fail in workspace)
                    try {
                      module = (await jitiInstance.import(modulePath)) as any;
                    } catch {
                      // Package import failed, try source file resolution
                      const fallbackPath = resolveWorkspacePackage(modulePath);
                      if (fallbackPath && existsSync(fallbackPath)) {
                        module = (await jitiInstance.import(fallbackPath)) as any;
                      }
                    }
                  }
                } else {
                  // Try file path import using jiti (for source files)
                  module = (await jitiInstance.import(modulePath)) as any;
                }
                
                if (module && module[schemaName]) {
                  const schema = module[schemaName];
                  // Check if it's a Zod schema (has _def property or is instance of z.ZodType)
                  if (schema && typeof schema === 'object' && ('_def' in schema || schema instanceof z.ZodType)) {
                    route.bodySchema = schema as z.ZodSchema;
                    console.log(`  ✓ Extracted body schema ${schemaName} from ${modulePath}`);
                    break;
                  }
                }
              } catch (error) {
                // Module not found or schema not exported - silently continue to next module
              }
            }
          } catch {
            // Could not resolve import
          }
        }
      }
    }
  } catch (error) {
    // Log error but don't fail completely - some schemas may still be extracted
    console.warn(`Error evaluating schemas for ${relativePath}:`, error);
  }
  
  // Evaluate response schemas from shared modules (similar to query/body schemas)
  for (const route of routes) {
    if (route.responseSchemaSources) {
      for (const [code, schemaSource] of Object.entries(route.responseSchemaSources)) {
      const statusCode = parseInt(code, 10);
      if (!isNaN(statusCode) && route.openapi?.responses?.[statusCode] && !route.openapi.responses[statusCode].schema) {
        const schemaName = schemaSource.trim().replace(/\s+as\s+\w+$/, '');
        if (schemaName && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(schemaName)) {
          try {
            // Try response-schemas file first (where response schemas are defined)
            const possibleModules = [
              join(PROJECT_ROOT, 'packages/web-runtime/src/api/response-schemas.ts'),
              join(PROJECT_ROOT, 'packages/web-runtime/src/api/schemas.ts'),
              join(PROJECT_ROOT, 'packages/web-runtime/src/server.ts'),
              '@heyclaude/web-runtime/api/response-schemas',
              '@heyclaude/web-runtime/api/schemas',
              '@heyclaude/web-runtime/server',
            ];
            
            for (const modulePath of possibleModules) {
              try {
                let module: any = null;
                if (modulePath.startsWith('@heyclaude/')) {
                  const resolvedPath = resolveWorkspacePackage(modulePath);
                  if (resolvedPath && existsSync(resolvedPath)) {
                    module = (await jitiInstance.import(resolvedPath)) as any;
                  }
                } else {
                  module = (await jitiInstance.import(modulePath)) as any;
                }
                
                if (module && module[schemaName]) {
                  const schema = module[schemaName];
                  if (schema && typeof schema === 'object' && ('_def' in schema || schema instanceof z.ZodType)) {
                    route.openapi.responses[statusCode].schema = schema as z.ZodSchema;
                    break;
                  }
                }
              } catch {
                // Module not found - continue to next
              }
            }
          } catch {
            // Could not resolve response schema
          }
          }
        }
      }
    }
  }
  
  // Report schema extraction status
  for (const route of routes) {
    if (route.querySchemaSource && !route.querySchema) {
      console.warn(`  ⚠ Could not extract query schema for ${route.route}: ${route.querySchemaSource}`);
    }
    if (route.bodySchemaSource && !route.bodySchema) {
      console.warn(`  ⚠ Could not extract body schema for ${route.route}: ${route.bodySchemaSource}`);
    }
    if (route.responseSchemaSources) {
      for (const [code, schemaSource] of Object.entries(route.responseSchemaSources)) {
        const statusCode = parseInt(code, 10);
        if (!isNaN(statusCode) && route.openapi?.responses?.[statusCode] && !route.openapi.responses[statusCode].schema) {
          console.warn(`  ⚠ Could not extract response schema for ${route.route} ${statusCode}: ${schemaSource}`);
        }
      }
    }
  }
  
  return routes;
}

/**
 * Extract path parameters from route path and convert to OpenAPI format
 * Converts Next.js dynamic segments [param] to OpenAPI {param} format
 * 
 * @example
 * '/api/v1/content/[category]/[slug]' -> '/api/v1/content/{category}/{slug}'
 * Returns: { openApiPath: '/api/v1/content/{category}/{slug}', pathParams: ['category', 'slug'] }
 */
function extractPathParameters(routePath: string): { openApiPath: string; pathParams: string[] } {
  const pathParams: string[] = [];
  // Convert Next.js dynamic segments [param] to OpenAPI {param} format
  const openApiPath = routePath.replace(/\[([^\]]+)\]/g, (match, paramName) => {
    pathParams.push(paramName);
    return `{${paramName}}`;
  });
  return { openApiPath, pathParams };
}

/**
 * Create Zod schema for path parameters
 */
function createPathParamsSchema(pathParams: string[]): z.ZodObject<any> | null {
  if (pathParams.length === 0) return null;
  
  const shape: Record<string, z.ZodString> = {};
  for (const param of pathParams) {
    shape[param] = z.string().describe(`Path parameter: ${param}`);
  }
  
  return z.object(shape);
}

/**
 * Build OpenAPI paths structure for createDocument()
 * Uses zod-openapi's native path structure with Zod schemas directly
 */
function buildOpenAPIPaths(routes: RouteMetadata[]): Record<string, any> {
  const paths: Record<string, any> = {};
  
  // Group routes by path (using OpenAPI path format with {param} instead of [param])
  const routesByPath = new Map<string, RouteMetadata[]>();
  for (const route of routes) {
    const { openApiPath } = extractPathParameters(route.route);
    if (!routesByPath.has(openApiPath)) {
      routesByPath.set(openApiPath, []);
    }
    routesByPath.get(openApiPath)!.push(route);
  }
  
  // Build paths structure
  for (const [openApiPath, pathRoutes] of routesByPath) {
    const pathItem: Record<string, any> = {};
    
    for (const route of pathRoutes) {
      const method = route.method.toLowerCase();
      const operation: any = {};
      
      // Extract path parameters for this route
      const { pathParams } = extractPathParameters(route.route);
      const pathParamsSchema = createPathParamsSchema(pathParams);
      
      // Add OpenAPI metadata
      const openapi = route.openapi;
      if (openapi) {
        if (openapi.summary !== undefined) {
          operation.summary = openapi.summary;
        }
        if (openapi.description !== undefined) {
          operation.description = openapi.description;
        }
        if (openapi.tags !== undefined) {
          operation.tags = openapi.tags;
        }
        if (openapi.operationId !== undefined) {
          operation.operationId = openapi.operationId;
        }
        if (openapi.deprecated !== undefined) {
          operation.deprecated = openapi.deprecated;
        }
        if (openapi.externalDocs !== undefined) {
          operation.externalDocs = openapi.externalDocs;
        }
        if (openapi.security !== undefined) {
          operation.security = openapi.security;
        }
      }
      
      // Add security if auth required (fallback to requireAuth if security not explicitly set)
      if (route.requireAuth && !openapi?.security) {
        operation.security = [{ bearerAuth: [] }];
      }
      
      // Build requestParams object (zod-openapi will convert to parameters array)
      const requestParams: Record<string, z.ZodSchema> = {};
      
      // Add path parameters if any
      if (pathParamsSchema) {
        requestParams.path = pathParamsSchema;
      }
      
      // Add query parameters
      if (route.querySchema) {
        if (route.querySchema instanceof z.ZodObject) {
          requestParams.query = route.querySchema;
        } else {
          // If it's not a ZodObject, log warning
          console.warn(`  ⚠ Query schema for ${route.route} is not a ZodObject, skipping requestParams.query`);
        }
      } else if (route.querySchemaSource) {
        // Schema exists but wasn't extracted - log warning
        console.warn(`  ⚠ Query schema source found but not extracted for ${route.route}: ${route.querySchemaSource}`);
      }
      
      // Only add requestParams if it has at least one parameter type
      if (Object.keys(requestParams).length > 0) {
        operation.requestParams = requestParams;
      }
      
      // Add requestBody with body schema (zod-openapi handles conversion automatically)
      if (route.bodySchema && ['post', 'put', 'patch'].includes(method)) {
        const requestBody: any = {
          content: {
            'application/json': {
              schema: route.bodySchema,
            },
          },
        };
        
        // Add requestBody description and required if provided
        if (openapi?.requestBody) {
          if (openapi.requestBody.description !== undefined) {
            requestBody.description = openapi.requestBody.description;
          }
          if (openapi.requestBody.required !== undefined) {
            requestBody.required = openapi.requestBody.required;
          } else {
            // Default to true for POST/PUT/PATCH
            requestBody.required = true;
          }
        } else {
          // Default to true for POST/PUT/PATCH
          requestBody.required = true;
        }
        
        operation.requestBody = requestBody;
      } else if (route.bodySchemaSource && ['post', 'put', 'patch'].includes(method)) {
        // Schema exists but wasn't extracted - log warning
        console.warn(`  ⚠ Body schema source found but not extracted for ${route.route}: ${route.bodySchemaSource}`);
      }
      
      // Build responses structure
      const responses: Record<string, any> = {};
      
      // Default responses
      responses['200'] = {
        description: 'Success',
      };
      responses['400'] = {
        description: 'Bad Request',
      };
      responses['500'] = {
        description: 'Internal Server Error',
      };
      
      if (route.requireAuth) {
        responses['401'] = {
          description: 'Unauthorized',
        };
      }
      
      // Merge with openapi.responses if provided (including response schemas, headers, examples)
      if (route.openapi?.responses) {
        for (const [code, response] of Object.entries(route.openapi.responses)) {
          const responseObj: any = {
            description: response.description,
          };
          
          // Add response schema if provided (zod-openapi will convert Zod schema to OpenAPI schema)
          if (response.schema) {
            responseObj.content = {
              'application/json': {
                schema: response.schema,
              },
            };
          }
          
          // Add response headers if provided
          if (response.headers) {
            responseObj.headers = response.headers;
          }
          
          // Add response example if provided
          if (response.example !== undefined) {
            // If example is a string (object literal source), try to evaluate it
            if (typeof response.example === 'string' && response.example.trim().startsWith('{')) {
              try {
                // Try to evaluate the object literal as JSON
                const evaluated = eval(`(${response.example})`);
                if (responseObj.content) {
                  responseObj.content['application/json'].example = evaluated;
                } else {
                  responseObj.content = {
                    'application/json': {
                      example: evaluated,
                    },
                  };
                }
              } catch {
                // If evaluation fails, skip example
                console.warn(`  ⚠ Could not evaluate example for ${route.route} ${code} response`);
              }
            } else {
              // Direct value (string, number, boolean)
              if (responseObj.content) {
                responseObj.content['application/json'].example = response.example;
              } else {
                responseObj.content = {
                  'application/json': {
                    example: response.example,
                  },
                };
              }
            }
          }
          
          responses[code] = responseObj;
        }
      }
      
      operation.responses = responses;
      
      pathItem[method] = operation;
    }
    
    paths[openApiPath] = pathItem;
  }
  
  return paths;
}

/**
 * Parse Prisma OpenAPI YAML file and extract schemas
 * Uses js-yaml to parse the YAML and extract components.schemas
 */
function parsePrismaOpenApiYaml(yamlContent: string): Record<string, any> {
  try {
    const parsed = yaml.load(yamlContent) as any;
    
    // Extract components.schemas
    if (parsed?.components?.schemas && typeof parsed.components.schemas === 'object') {
      return parsed.components.schemas;
    }
    
    return {};
  } catch (error) {
    console.warn(`Failed to parse Prisma OpenAPI YAML: ${error instanceof Error ? error.message : String(error)}`);
    return {};
  }
}

/**
 * Generate OpenAPI document from route metadata
 * Uses zod-openapi's createDocument() with proper paths structure
 */
function generateOpenAPIDocument(routes: RouteMetadata[]) {
  // Build paths structure with Zod schemas directly
  const paths = buildOpenAPIPaths(routes);
  
  // Use createDocument() with paths structure - zod-openapi handles all conversion automatically
  const document = createDocument({
    openapi: '3.1.0',
    info: {
      title: 'ClaudePro Directory API',
      version: '1.1.0',
      description: 'API documentation for ClaudePro Directory - A community-driven directory of Claude configurations',
      contact: {
        name: 'Claude Pro Directory',
        url: 'https://claudepro.directory',
        email: 'support@claudepro.directory',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
      termsOfService: 'https://claudepro.directory/terms',
    },
    servers: [
      {
        url: 'https://claudepro.com/api/v1',
        description: 'Production',
      },
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Development',
      },
    ],
    tags: [
      { name: 'content', description: 'Content-related endpoints for browsing and exporting Claude configurations' },
      { name: 'search', description: 'Search and discovery endpoints for finding Claude configurations' },
      { name: 'bookmarks', description: 'User bookmark management endpoints for saving favorite configurations' },
      { name: 'company', description: 'Company profile endpoints for viewing company information' },
      { name: 'profiles', description: 'Profile-related endpoints for user and company profiles' },
      { name: 'feeds', description: 'RSS and Atom feed endpoints for content syndication' },
      { name: 'templates', description: 'Content template endpoints for wizard and form generation' },
      { name: 'trending', description: 'Trending, popular, and recent content endpoints' },
      { name: 'health', description: 'Health check and monitoring endpoints for API status' },
      { name: 'changelog', description: 'Changelog endpoints for viewing and syncing release notes' },
      { name: 'sitemap', description: 'Sitemap generation endpoints for SEO' },
      { name: 'stats', description: 'Statistics and analytics endpoints' },
      { name: 'flux', description: 'Flux integration endpoints for external services' },
      { name: 'inngest', description: 'Inngest webhook endpoints for background job processing' },
      { name: 'og', description: 'Open Graph image generation endpoints for social media previews' },
      { name: 'openapi', description: 'OpenAPI specification endpoint for API documentation' },
    ],
    paths,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  });

  return document;
}

/**
 * Main function
 */
export async function generateOpenAPI(): Promise<void> {
  const apiRoutesDir = join(PROJECT_ROOT, 'apps/web/src/app/api');
  const routeFiles = await glob('**/route.ts', { cwd: apiRoutesDir, absolute: true });

  console.log(`Found ${routeFiles.length} API route files`);

  const allRoutes: RouteMetadata[] = [];

  for (const filePath of routeFiles) {
    try {
      const routes = await extractRouteMetadata(filePath);
      const routesWithSchemas = await evaluateSchemas(filePath, routes);
      allRoutes.push(...routesWithSchemas);
      console.log(`  ✓ ${relative(PROJECT_ROOT, filePath)} (${routes.length} route(s))`);
    } catch (error) {
      console.error(`  ✗ Error processing ${filePath}:`, error);
    }
  }

  console.log(`\nTotal routes found: ${allRoutes.length}`);

  // Count schema extraction success/failure
  let querySchemasExtracted = 0;
  let querySchemasFailed = 0;
  let bodySchemasExtracted = 0;
  let bodySchemasFailed = 0;
  
  for (const route of allRoutes) {
    if (route.querySchemaSource) {
      if (route.querySchema) {
        querySchemasExtracted++;
      } else {
        querySchemasFailed++;
      }
    }
    if (route.bodySchemaSource) {
      if (route.bodySchema) {
        bodySchemasExtracted++;
      } else {
        bodySchemasFailed++;
      }
    }
  }

  // Generate OpenAPI document
  const document = generateOpenAPIDocument(allRoutes);

  // Merge Prisma OpenAPI schemas (from prisma-openapi generator)
  const prismaOpenApiPath = join(PROJECT_ROOT, 'packages/database-types/src/openapi/openapi.yaml');
  if (existsSync(prismaOpenApiPath)) {
    try {
      const prismaOpenApiContent = await readFile(prismaOpenApiPath, 'utf-8');
      const prismaSchemas = parsePrismaOpenApiYaml(prismaOpenApiContent);
      
      // Merge Prisma schemas into API document
      if (prismaSchemas && Object.keys(prismaSchemas).length > 0) {
        if (!document.components) {
          document.components = {};
        }
        if (!document.components.schemas) {
          document.components.schemas = {};
        }
        
        // Merge Prisma schemas, avoiding conflicts (API schemas take precedence)
        // This allows API routes to override Prisma model schemas if needed
        const mergedSchemas = {
          ...prismaSchemas,
          ...document.components.schemas,
        };
        
        document.components.schemas = mergedSchemas;
        console.log(`\n✓ Merged ${Object.keys(prismaSchemas).length} Prisma model schemas into OpenAPI spec`);
        console.log(`   Prisma schemas are now available as $ref in API responses`);
      }
    } catch (error) {
      console.warn(`\n⚠️  Could not merge Prisma OpenAPI schemas: ${error instanceof Error ? error.message : String(error)}`);
      console.warn(`   Continuing without Prisma schemas...`);
    }
  } else {
    console.log(`\nℹ️  Prisma OpenAPI file not found at ${prismaOpenApiPath}`);
    console.log(`   Run \`pnpm prisma:generate:exec\` to generate Prisma schemas first.`);
  }

  // Write JSON
  const jsonPath = join(PROJECT_ROOT, 'openapi.json');
  await writeFile(jsonPath, JSON.stringify(document, null, 2));
  console.log(`\n✓ Generated: ${jsonPath}`);

  // Report schema extraction status
  console.log(`\n📊 Schema Extraction Summary:`);
  console.log(`  Query Schemas: ${querySchemasExtracted} extracted, ${querySchemasFailed} failed`);
  console.log(`  Body Schemas: ${bodySchemasExtracted} extracted, ${bodySchemasFailed} failed`);
  
  if (querySchemasFailed > 0 || bodySchemasFailed > 0) {
    console.log(`\n⚠️  Warning: Some schemas could not be extracted.`);
    console.log(`   This may be due to:`);
    console.log(`   - Inline schema expressions that couldn't be evaluated`);
    console.log(`   - Missing exports or imports`);
    console.log(`   - Server-only dependencies preventing evaluation`);
    console.log(`\n   For best results, export Zod schemas from route files:`);
    console.log(`   export const querySchema = z.object({ ... });`);
    console.log(`   export const bodySchema = z.object({ ... });`);
  } else {
    console.log(`\n✅ All schemas extracted successfully!`);
  }

  console.log(`\n✓ OpenAPI spec generated successfully!`);
  console.log(`  View at: https://editor.swagger.io/ (paste openapi.json)`);
  console.log(`\nNote: Using zod-openapi's createDocument() with native paths structure.`);
  console.log(`  All Zod schemas are automatically converted to OpenAPI schemas.`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateOpenAPI().catch(console.error);
}
