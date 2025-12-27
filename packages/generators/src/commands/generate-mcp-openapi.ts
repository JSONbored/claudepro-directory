#!/usr/bin/env tsx

/**
 * MCP OpenAPI Spec Generator
 *
 * Generates OpenAPI 3.1 specification for the MCP server by extracting:
 * - Tool metadata (name, title, description, inputSchema)
 * - Resource metadata (URI templates, names, descriptions, mimeTypes)
 * - Prompt metadata (name, title, description, argsSchema)
 * - OAuth endpoints (already implemented)
 * - Health check endpoint
 *
 * Documents the `/mcp` endpoint as a JSON-RPC 2.0 POST endpoint with:
 * - Request schema (JSON-RPC 2.0 request structure)
 * - Response schema (JSON-RPC 2.0 response structure)
 * - Tool/resource/prompt schemas in components.schemas section
 *
 * Output: openapi-mcp.json in the project root.
 */

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { Project, Node, SourceFile } from 'ts-morph';
import { ScriptTarget, ModuleKind, ModuleResolutionKind } from 'typescript';
import { createDocument } from 'zod-openapi';
import { z } from 'zod';

// Import zod-openapi for type augmentation
import 'zod-openapi';

// Import shared Zod schema evaluation utilities
import {
  setProjectRoot,
  evaluateSchemaFromFile,
  generateExampleFromZodSchema,
} from '../toolkit/zod-schema-evaluation.js';

const __filename = fileURLToPath(import.meta.url);
// Calculate PROJECT_ROOT: from packages/generators/src/commands/ -> project root
// Or from packages/generators/src/bin/ -> project root
let PROJECT_ROOT = join(__filename, '../../../../');
// Verify by checking if packages/mcp-server exists (standalone package)
if (!existsSync(join(PROJECT_ROOT, 'packages/mcp-server'))) {
  // Try alternative path (if called from bin script)
  const altPath = join(__filename, '../../../../../');
  if (existsSync(join(altPath, 'packages/mcp-server'))) {
    PROJECT_ROOT = altPath;
  } else {
    // Final fallback - use process.cwd() and verify
    const cwdPath = process.cwd();
    if (existsSync(join(cwdPath, 'packages/mcp-server'))) {
      PROJECT_ROOT = cwdPath;
    } else {
      throw new Error(
        `Could not find project root. Tried:\n` +
          `  - ${PROJECT_ROOT}\n` +
          `  - ${altPath}\n` +
          `  - ${cwdPath}\n` +
          `Looking for: packages/mcp-server`
      );
    }
  }
}

const MCP_SERVER_PATH = join(PROJECT_ROOT, 'packages/mcp-server/src/mcp');

interface ToolMetadata {
  name: string;
  title: string;
  description: string;
  inputSchema?: z.ZodSchema;
  inputSchemaSource?: string;
  inputSchemaName?: string;
  inputSchemaExample?: unknown;
  outputSchemaName?: string;
  filePath: string;
}

interface ResourceMetadata {
  name: string;
  uriTemplate: string;
  title: string;
  description: string;
  mimeType: string;
  filePath: string;
}

interface PromptMetadata {
  name: string;
  title: string;
  description: string;
  argsSchema?: z.ZodSchema;
  argsSchemaSource?: string;
  argsSchemaName?: string;
  argsSchemaExample?: unknown;
  filePath: string;
}

/**
 * Extract tool metadata from register.ts
 */
function extractToolMetadata(sourceFile: SourceFile): ToolMetadata[] {
  const tools: ToolMetadata[] = [];

  // Debug: Count all call expressions
  const allCalls = sourceFile.getDescendantsOfKind(207);
  let propertyAccessCount = 0;
  let registerToolCount = 0;

  console.log(`   🔍 Scanning ${allCalls.length} call expressions in ${sourceFile.getBaseName()}`);

  // Find all registerTool calls (mcpServer.registerTool or any variable.registerTool)
  sourceFile.getDescendantsOfKind(207).forEach((call) => {
    // 207 = SyntaxKind.CallExpression
    if (!Node.isCallExpression(call)) return;

    const expression = call.getExpression();
    if (!Node.isPropertyAccessExpression(expression)) return;

    propertyAccessCount++;

    // Check if method name is 'registerTool'
    const methodName = expression.getName();
    if (methodName !== 'registerTool') return;

    registerToolCount++;

    const args = call.getArguments();
    if (args.length < 3) return;

    // First arg: tool name (string literal)
    const nameArg = args[0];
    if (!Node.isStringLiteral(nameArg)) return;
    const name = nameArg.getLiteralValue();

    // Second arg: metadata object
    const metadataArg = args[1];
    if (!Node.isObjectLiteralExpression(metadataArg)) return;

    const titleProp = metadataArg.getProperty('title');
    const descriptionProp = metadataArg.getProperty('description');
    const inputSchemaProp = metadataArg.getProperty('inputSchema');

    let title = '';
    if (titleProp && Node.isPropertyAssignment(titleProp)) {
      const init = titleProp.getInitializer();
      if (init && Node.isStringLiteral(init)) {
        title = init.getLiteralValue();
      }
    }

    let description = '';
    if (descriptionProp && Node.isPropertyAssignment(descriptionProp)) {
      const init = descriptionProp.getInitializer();
      if (init) {
        if (Node.isStringLiteral(init)) {
          description = init.getLiteralValue();
        } else if (Node.isNoSubstitutionTemplateLiteral(init)) {
          // Handle template literals without substitutions
          description = init.getLiteralValue();
        } else if (Node.isTemplateExpression(init)) {
          // Handle template expressions (multi-line strings with ${})
          // Extract text parts and join them
          const parts: string[] = [];
          for (const part of init.getTemplateSpans()) {
            const literal = part.getLiteral();
            if (
              Node.isTemplateHead(literal) ||
              Node.isTemplateMiddle(literal) ||
              Node.isTemplateTail(literal)
            ) {
              parts.push(
                literal.getText().replace(/`/g, '').replace(/\$\{/g, '').replace(/\}/g, '').trim()
              );
            }
          }
          description = parts.join(' ').trim();
        }
      }
    }

    // Extract inputSchema source and name
    let inputSchemaSource: string | undefined;
    let inputSchemaName: string | undefined;
    let outputSchemaName: string | undefined;
    if (inputSchemaProp && Node.isPropertyAssignment(inputSchemaProp)) {
      const schemaInit = inputSchemaProp.getInitializer();
      if (schemaInit) {
        inputSchemaSource = schemaInit.getText();
        if (Node.isIdentifier(schemaInit)) {
          inputSchemaName = schemaInit.getText();
        }
      }
    }

    // Extract outputSchema name
    const outputSchemaProp = metadataArg.getProperty('outputSchema');
    if (outputSchemaProp && Node.isPropertyAssignment(outputSchemaProp)) {
      const schemaInit = outputSchemaProp.getInitializer();
      if (schemaInit && Node.isIdentifier(schemaInit)) {
        outputSchemaName = schemaInit.getText();
      }
    }

    tools.push({
      name,
      title,
      description,
      ...(inputSchemaSource && { inputSchemaSource }),
      ...(inputSchemaName && { inputSchemaName }),
      ...(outputSchemaName && { outputSchemaName }),
      filePath: sourceFile.getFilePath(),
    });
  });

  // Debug output
  console.log(
    `   📊 Found ${propertyAccessCount} property access calls, ${registerToolCount} registerTool calls, extracted ${tools.length} tools`
  );
  if (tools.length === 0 && registerToolCount > 0) {
    console.warn(
      `⚠️  Found ${registerToolCount} registerTool calls but extracted 0 tools. Check argument parsing.`
    );
  }

  return tools;
}

/**
 * Extract resource metadata from register.ts
 */
function extractResourceMetadata(sourceFile: SourceFile): ResourceMetadata[] {
  const resources: ResourceMetadata[] = [];

  // Find all registerResource calls
  const allCalls = sourceFile.getDescendantsOfKind(207);

  let propertyAccessCount = 0;
  let registerResourceCount = 0;
  let methodNameMismatchCount = 0;
  let argsLengthMismatchCount = 0;
  let nameArgInvalidCount = 0;
  let templateArgInvalidCount = 0;
  let metadataArgInvalidCount = 0;

  allCalls.forEach((call) => {
    if (!Node.isCallExpression(call)) return;

    const expression = call.getExpression();
    if (!Node.isPropertyAccessExpression(expression)) return;

    propertyAccessCount++;

    // Check if method name is 'registerResource'
    const methodName = expression.getName();
    if (methodName !== 'registerResource') {
      methodNameMismatchCount++;
      return;
    }

    registerResourceCount++;

    const args = call.getArguments();

    if (args.length < 4) {
      argsLengthMismatchCount++;
      return;
    }

    // First arg: resource name (string literal)
    const nameArg = args[0];
    if (!Node.isStringLiteral(nameArg)) {
      nameArgInvalidCount++;
      return;
    }
    const name = nameArg.getLiteralValue();

    // Second arg: ResourceTemplate (new ResourceTemplate(...))
    const templateArg = args[1];
    let uriTemplate = '';
    if (Node.isNewExpression(templateArg)) {
      const templateArgs = templateArg.getArguments();
      if (templateArgs.length > 0) {
        const firstArg = templateArgs[0];
        if (Node.isStringLiteral(firstArg)) {
          uriTemplate = firstArg.getLiteralValue();
        } else if (Node.isNoSubstitutionTemplateLiteral(firstArg)) {
          uriTemplate = firstArg.getLiteralValue();
        } else {
          templateArgInvalidCount++;
        }
      }
    } else {
      templateArgInvalidCount++;
    }

    // Third arg: metadata object
    const metadataArg = args[2];
    if (!Node.isObjectLiteralExpression(metadataArg)) {
      metadataArgInvalidCount++;
      return;
    }

    const titleProp = metadataArg.getProperty('title');
    const descriptionProp = metadataArg.getProperty('description');
    const mimeTypeProp = metadataArg.getProperty('mimeType');

    let title = '';
    if (titleProp && Node.isPropertyAssignment(titleProp)) {
      const init = titleProp.getInitializer();
      if (init && Node.isStringLiteral(init)) {
        title = init.getLiteralValue();
      }
    }

    let description = '';
    if (descriptionProp && Node.isPropertyAssignment(descriptionProp)) {
      const init = descriptionProp.getInitializer();
      if (init) {
        if (Node.isStringLiteral(init)) {
          description = init.getLiteralValue();
        } else if (Node.isNoSubstitutionTemplateLiteral(init)) {
          // Handle template literals without substitutions
          description = init.getLiteralValue();
        } else if (Node.isTemplateExpression(init)) {
          // Handle template expressions (multi-line strings with ${})
          // Extract text parts and join them
          const parts: string[] = [];
          for (const part of init.getTemplateSpans()) {
            const literal = part.getLiteral();
            if (
              Node.isTemplateHead(literal) ||
              Node.isTemplateMiddle(literal) ||
              Node.isTemplateTail(literal)
            ) {
              parts.push(
                literal.getText().replace(/`/g, '').replace(/\$\{/g, '').replace(/\}/g, '').trim()
              );
            }
          }
          description = parts.join(' ').trim();
        }
      }
    }

    let mimeType = 'text/plain';
    if (mimeTypeProp && Node.isPropertyAssignment(mimeTypeProp)) {
      const init = mimeTypeProp.getInitializer();
      if (init && Node.isStringLiteral(init)) {
        mimeType = init.getLiteralValue();
      }
    }

    resources.push({
      name,
      uriTemplate,
      title,
      description,
      mimeType,
      filePath: sourceFile.getFilePath(),
    });
  });

  return resources;
}

/**
 * Extract prompt metadata from register.ts
 */
function extractPromptMetadata(sourceFile: SourceFile): PromptMetadata[] {
  const prompts: PromptMetadata[] = [];

  // Find all registerPrompt calls
  sourceFile.getDescendantsOfKind(207).forEach((call) => {
    if (!Node.isCallExpression(call)) return;

    const expression = call.getExpression();
    if (!Node.isPropertyAccessExpression(expression)) return;

    // Check if method name is 'registerPrompt'
    if (expression.getName() !== 'registerPrompt') return;

    const args = call.getArguments();
    if (args.length < 3) return;

    // First arg: prompt name (string literal)
    const nameArg = args[0];
    if (!Node.isStringLiteral(nameArg)) return;
    const name = nameArg.getLiteralValue();

    // Second arg: metadata object
    const metadataArg = args[1];
    if (!Node.isObjectLiteralExpression(metadataArg)) return;

    const titleProp = metadataArg.getProperty('title');
    const descriptionProp = metadataArg.getProperty('description');
    const argsSchemaProp = metadataArg.getProperty('argsSchema');

    let title = '';
    if (titleProp && Node.isPropertyAssignment(titleProp)) {
      const init = titleProp.getInitializer();
      if (init && Node.isStringLiteral(init)) {
        title = init.getLiteralValue();
      }
    }

    let description = '';
    if (descriptionProp && Node.isPropertyAssignment(descriptionProp)) {
      const init = descriptionProp.getInitializer();
      if (init) {
        if (Node.isStringLiteral(init)) {
          description = init.getLiteralValue();
        } else if (Node.isNoSubstitutionTemplateLiteral(init)) {
          // Handle template literals without substitutions
          description = init.getLiteralValue();
        } else if (Node.isTemplateExpression(init)) {
          // Handle template expressions (multi-line strings with ${})
          // Extract text parts and join them
          const parts: string[] = [];
          for (const part of init.getTemplateSpans()) {
            const literal = part.getLiteral();
            if (
              Node.isTemplateHead(literal) ||
              Node.isTemplateMiddle(literal) ||
              Node.isTemplateTail(literal)
            ) {
              parts.push(
                literal.getText().replace(/`/g, '').replace(/\$\{/g, '').replace(/\}/g, '').trim()
              );
            }
          }
          description = parts.join(' ').trim();
        }
      }
    }

    // Extract argsSchema source and name
    let argsSchemaSource: string | undefined;
    let argsSchemaName: string | undefined;
    if (argsSchemaProp && Node.isPropertyAssignment(argsSchemaProp)) {
      const schemaInit = argsSchemaProp.getInitializer();
      if (schemaInit) {
        argsSchemaSource = schemaInit.getText();
        if (Node.isIdentifier(schemaInit)) {
          argsSchemaName = schemaInit.getText();
        }
      }
    }

    prompts.push({
      name,
      title,
      description,
      ...(argsSchemaSource && { argsSchemaSource }),
      ...(argsSchemaName && { argsSchemaName }),
      filePath: sourceFile.getFilePath(),
    });
  });

  return prompts;
}

// Note: Full schema evaluation from Zod requires runtime evaluation.
// For now, we document schemas by name. Future enhancement: evaluate Zod schemas at runtime.

/**
 * Fallback regex extraction for tools (when AST parsing fails)
 */
function extractToolsViaRegex(sourceText: string): ToolMetadata[] {
  const tools: ToolMetadata[] = [];

  // Match: mcpServer.registerTool('name', { title: '...', description: '...', inputSchema: SchemaName }, ...)
  // More comprehensive regex to capture inputSchema name
  const toolRegex =
    /mcpServer\.registerTool\s*\(\s*['"]([^'"]+)['"]\s*,\s*\{[^}]*title:\s*['"]([^'"]+)['"][^}]*description:\s*['"]?([^'"]+)['"]?[^}]*inputSchema:\s*([A-Za-z][A-Za-z0-9_]*)/gs;

  let match;
  while ((match = toolRegex.exec(sourceText)) !== null) {
    const [, name, title, description, inputSchemaName] = match;
    if (name && title) {
      const tool: ToolMetadata = {
        name: name.trim(),
        title: title.trim(),
        description: (description || '').trim(),
        filePath: 'packages/mcp-server/src/mcp/tools/register.ts',
      };
      if (inputSchemaName?.trim()) {
        tool.inputSchemaName = inputSchemaName.trim();
      }
      tools.push(tool);
    }
  }

  return tools;
}

/**
 * Fallback regex extraction for resources (when AST parsing fails)
 */
function extractResourcesViaRegex(sourceText: string): ResourceMetadata[] {
  const resources: ResourceMetadata[] = [];

  // Match: mcpServer.registerResource('name', new ResourceTemplate('uri', ...), { title: '...', description: '...', mimeType: '...' }, ...)
  // Handle multi-line descriptions - description can be on the same line or next line after description:
  // Pattern breakdown:
  // 1. mcpServer.registerResource('name', ...)
  // 2. new ResourceTemplate('uri', ...)
  // 3. { title: '...', description: '...' (can span lines), mimeType: '...' }
  // Use [\s\S] to match any character including newlines, with non-greedy matching
  // Match: mcpServer.registerResource('name', new ResourceTemplate('uri', ...), { title: '...', description: '...', mimeType: '...' }, ...)
  // Handle multi-line descriptions - description can be on the same line or next line after description:
  // Pattern: description: followed by any content (including newlines), then string literal, then mimeType
  const resourceRegex =
    /mcpServer\.registerResource\s*\(\s*['"]([^'"]+)['"]\s*,\s*new\s+ResourceTemplate\s*\(\s*['"]([^'"]+)['"][\s\S]*?title:\s*['"]([^'"]+)['"][\s\S]*?description:[\s\S]*?['"]([^'"]+)['"][\s\S]*?mimeType:\s*['"]([^'"]+)['"]/g;

  let match;
  while ((match = resourceRegex.exec(sourceText)) !== null) {
    const [, name, uriTemplate, title, description, mimeType] = match;

    if (name && uriTemplate && title) {
      resources.push({
        name: name.trim(),
        uriTemplate: uriTemplate.trim(),
        title: title.trim(),
        description: (description || '').trim().replace(/\s+/g, ' '), // Normalize whitespace
        mimeType: (mimeType || 'text/plain').trim(),
        filePath: 'packages/mcp-server/src/mcp/resources/register.ts',
      });
    }
  }

  return resources;
}

/**
 * Fallback regex extraction for prompts (when AST parsing fails)
 */
function extractPromptsViaRegex(sourceText: string): PromptMetadata[] {
  const prompts: PromptMetadata[] = [];

  // Match: mcpServer.registerPrompt('name', { title: '...', description: '...', argsSchema: SchemaName }, ...)
  // More comprehensive regex to capture argsSchema name
  const promptRegex =
    /mcpServer\.registerPrompt\s*\(\s*['"]([^'"]+)['"]\s*,\s*\{[^}]*title:\s*['"]([^'"]+)['"][^}]*description:\s*['"]?([^'"]+)['"]?[^}]*argsSchema:\s*([A-Za-z][A-Za-z0-9_]*)/gs;

  let match;
  while ((match = promptRegex.exec(sourceText)) !== null) {
    const [, name, title, description, argsSchemaName] = match;
    if (name && title) {
      const prompt: PromptMetadata = {
        name: name.trim(),
        title: title.trim(),
        description: (description || '').trim(),
        filePath: 'packages/mcp-server/src/mcp/prompts/register.ts',
      };
      if (argsSchemaName?.trim()) {
        prompt.argsSchemaName = argsSchemaName.trim();
      }
      prompts.push(prompt);
    }
  }

  return prompts;
}

/**
 * Evaluate Zod schemas for tools and prompts
 */
async function evaluateSchemas(
  tools: ToolMetadata[],
  prompts: PromptMetadata[],
  projectRoot: string
): Promise<void> {
  const typesFilePath = join(projectRoot, 'packages/mcp-server/src/lib/types.ts');

  if (!existsSync(typesFilePath)) {
    console.warn(`⚠️  Types file not found: ${typesFilePath}`);
    return;
  }

  console.log(`📦 Evaluating Zod schemas from: ${typesFilePath}`);

  // Evaluate tool input schemas
  for (const tool of tools) {
    if (tool.inputSchemaName) {
      try {
        // Use absolute path to types file
        const typesFilePath = join(projectRoot, 'packages/mcp-server/src/lib/types.ts');
        const schema = await evaluateSchemaFromFile(
          typesFilePath,
          tool.inputSchemaName,
          projectRoot
        );
        if (schema) {
          tool.inputSchema = schema;
          tool.inputSchemaExample = generateExampleFromZodSchema(schema);
          console.log(`   ✅ Evaluated input schema for ${tool.name}: ${tool.inputSchemaName}`);
        } else {
          console.warn(`   ⚠️  Could not evaluate schema: ${tool.inputSchemaName}`);
        }
      } catch (error) {
        console.warn(`   ⚠️  Error evaluating schema ${tool.inputSchemaName}: ${error}`);
      }
    }
  }

  // Evaluate prompt args schemas
  // Prompt schemas are defined inline in prompts/register.ts as plain objects with Zod properties
  // We need to evaluate them from that file and convert to z.object()
  const promptsRegisterPath = join(projectRoot, 'packages/mcp-server/src/mcp/prompts/register.ts');

  for (const prompt of prompts) {
    if (prompt.argsSchemaName) {
      try {
        // First try to find schema in prompts register file (where they're actually defined)
        let schema = await evaluateSchemaFromFile(
          promptsRegisterPath,
          prompt.argsSchemaName,
          projectRoot
        );

        // If not found as Zod schema, try extracting from source file using AST (schemas are const, not exported)
        if (!schema && existsSync(promptsRegisterPath)) {
          try {
            // Use AST to extract the const declaration (even if not exported)
            // Create a new Project instance for AST parsing
            const astProject = new Project({
              skipAddingFilesFromTsConfig: true,
              skipFileDependencyResolution: true,
              skipLoadingLibFiles: true,
            });
            const promptsFile = astProject.addSourceFileAtPathIfExists(promptsRegisterPath);
            if (promptsFile) {
              let schemaDeclaration: Node | null = null;

              // Find const declaration (exported or not)
              promptsFile.forEachDescendant((node) => {
                if (Node.isVariableStatement(node)) {
                  const declarationList = node.getDeclarationList();
                  const declarations = declarationList.getDeclarations();
                  for (const declaration of declarations) {
                    if (declaration.getName() === prompt.argsSchemaName) {
                      schemaDeclaration = declaration;
                      return;
                    }
                  }
                }
              });

              if (schemaDeclaration && Node.isVariableDeclaration(schemaDeclaration)) {
                const variableDecl = schemaDeclaration as import('ts-morph').VariableDeclaration;
                const initializer = variableDecl.getInitializer();
                if (initializer) {
                  const schemaCode = initializer.getText();

                  // Extract imports needed for evaluation
                  const imports: string[] = [];
                  for (const imp of promptsFile.getImportDeclarations()) {
                    const spec = imp.getModuleSpecifierValue();
                    const namedImports = imp.getNamedImports();
                    if (namedImports.length > 0) {
                      const named = namedImports.map((n) => n.getName()).join(', ');
                      imports.push(`import { ${named} } from '${spec}';`);
                    }
                  }

                  // Evaluate the schema code - it's a plain object, so wrap in z.object()
                  // Import evaluateZodSchema from toolkit
                  const { evaluateZodSchema } = await import('../toolkit/zod-schema-evaluation.js');

                  // The schema code is a plain object like { category: z.string().optional() }
                  // We need to wrap it in z.object() for evaluation
                  const wrappedSchemaCode = `z.object(${schemaCode})`;

                  const evaluatedSchema = await evaluateZodSchema(
                    wrappedSchemaCode,
                    imports,
                    projectRoot
                  );

                  if (evaluatedSchema) {
                    schema = evaluatedSchema;
                  }
                }
              }
            }
          } catch (extractError) {
            // Silently continue - will try types.ts fallback
          }
        }

        // If still not found, try types.ts (for backwards compatibility)
        if (!schema) {
          const typesFilePath = join(projectRoot, 'packages/mcp-server/src/lib/types.ts');
          schema = await evaluateSchemaFromFile(typesFilePath, prompt.argsSchemaName, projectRoot);
        }

        if (schema) {
          prompt.argsSchema = schema;
          prompt.argsSchemaExample = generateExampleFromZodSchema(schema);
          console.log(`   ✅ Evaluated args schema for ${prompt.name}: ${prompt.argsSchemaName}`);
        } else {
          console.warn(`   ⚠️  Could not evaluate schema: ${prompt.argsSchemaName}`);
        }
      } catch (error) {
        console.warn(`   ⚠️  Error evaluating schema ${prompt.argsSchemaName}: ${error}`);
      }
    }
  }
}

/**
 * Generate OpenAPI spec for MCP server
 */
async function generateMcpOpenAPI(): Promise<void> {
  // Set project root for schema evaluation utilities
  setProjectRoot(PROJECT_ROOT);

  // Create project with proper TypeScript configuration
  // Try to use the MCP server package's tsconfig.json if it exists
  const mcpTsConfigPath = join(PROJECT_ROOT, 'packages/mcp-server/tsconfig.json');
  const project = existsSync(mcpTsConfigPath)
    ? new Project({
        tsConfigFilePath: mcpTsConfigPath,
      })
    : new Project({
        compilerOptions: {
          target: ScriptTarget.ES2022,
          module: ModuleKind.ESNext,
          moduleResolution: ModuleResolutionKind.Bundler,
          allowJs: true,
          strict: true,
        },
      });

  // Verify paths exist
  const toolsPath = join(MCP_SERVER_PATH, 'tools/register.ts');
  const resourcesPath = join(MCP_SERVER_PATH, 'resources/register.ts');
  const promptsPath = join(MCP_SERVER_PATH, 'prompts/register.ts');

  if (!existsSync(toolsPath)) {
    throw new Error(`Tools file not found: ${toolsPath}`);
  }
  if (!existsSync(resourcesPath)) {
    throw new Error(`Resources file not found: ${resourcesPath}`);
  }
  if (!existsSync(promptsPath)) {
    throw new Error(`Prompts file not found: ${promptsPath}`);
  }

  // Read MCP server files
  const toolsFile = project.addSourceFileAtPath(toolsPath);
  const resourcesFile = project.addSourceFileAtPath(resourcesPath);
  const promptsFile = project.addSourceFileAtPath(promptsPath);

  // Verify files loaded and have content
  const toolsText = toolsFile.getText();
  const resourcesText = resourcesFile.getText();
  const promptsText = promptsFile.getText();

  console.log(`📁 Files loaded:`);
  console.log(`   - Tools: ${toolsText.length} chars`);
  console.log(`   - Resources: ${resourcesText.length} chars`);
  console.log(`   - Prompts: ${promptsText.length} chars`);

  // Extract metadata
  const tools = extractToolMetadata(toolsFile);
  const resources = extractResourceMetadata(resourcesFile);
  const prompts = extractPromptMetadata(promptsFile);

  // Fallback: If AST parsing fails, use regex extraction
  if (tools.length === 0) {
    console.log(`⚠️  AST parsing found 0 tools, trying regex fallback...`);
    const regexTools = extractToolsViaRegex(toolsText);
    if (regexTools.length > 0) {
      console.log(`✅ Regex fallback found ${regexTools.length} tools`);
      tools.push(...regexTools);
    }
  }

  if (resources.length === 0) {
    console.log(`⚠️  AST parsing found 0 resources, trying regex fallback...`);
    const regexResources = extractResourcesViaRegex(resourcesText);
    if (regexResources.length > 0) {
      console.log(`✅ Regex fallback found ${regexResources.length} resources`);
      resources.push(...regexResources);
    }
  }

  if (prompts.length === 0) {
    console.log(`⚠️  AST parsing found 0 prompts, trying regex fallback...`);
    const regexPrompts = extractPromptsViaRegex(promptsText);
    if (regexPrompts.length > 0) {
      console.log(`✅ Regex fallback found ${regexPrompts.length} prompts`);
      prompts.push(...regexPrompts);
    }
  }

  // Debug: Log what we found
  console.log(`📊 Extracted metadata:`);
  console.log(`   - Tools: ${tools.length}`);
  console.log(`   - Resources: ${resources.length}`);
  console.log(`   - Prompts: ${prompts.length}`);

  if (tools.length === 0 && resources.length === 0 && prompts.length === 0) {
    console.warn('⚠️  Warning: No tools, resources, or prompts found.');
    console.warn(
      '   This is expected for now - AST parsing needs enhancement for full schema extraction.'
    );
    console.warn('   The OpenAPI spec will be generated with placeholder schemas.');
  }

  // Evaluate Zod schemas at runtime
  await evaluateSchemas(tools, prompts, PROJECT_ROOT);

  // Create OpenAPI document
  const document = createDocument({
    openapi: '3.1.0',
    info: {
      title: 'HeyClaude MCP Server API',
      version: '1.1.0',
      description:
        'Model Context Protocol (MCP) server for Claude Pro Directory. Provides tools, resources, and prompts for accessing directory content. Protocol version: 2025-11-25.',
    },
    servers: [
      {
        url: 'https://mcp.claudepro.directory',
        description: 'Production MCP server',
      },
      {
        url: 'https://mcp-dev.claudepro.directory',
        description: 'Development MCP server',
      },
    ],
    paths: {
      '/mcp': {
        post: {
          summary: 'MCP Protocol Endpoint',
          description:
            'JSON-RPC 2.0 endpoint for MCP protocol. All tool calls, resource requests, and prompt requests are sent to this single endpoint.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['jsonrpc', 'method', 'id'],
                  properties: {
                    jsonrpc: { type: 'string', enum: ['2.0'] },
                    method: { type: 'string' },
                    params: { type: 'object' },
                    id: { oneOf: [{ type: 'string' }, { type: 'integer' }] },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'JSON-RPC 2.0 response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['jsonrpc', 'id'],
                    properties: {
                      jsonrpc: { type: 'string', enum: ['2.0'] },
                      result: { type: 'object' },
                      error: {
                        type: 'object',
                        properties: {
                          code: { type: 'integer' },
                          message: { type: 'string' },
                          data: { type: 'object' },
                        },
                      },
                      id: { oneOf: [{ type: 'string' }, { type: 'integer' }] },
                    },
                  },
                },
              },
            },
            '401': {
              description: 'Authentication required',
            },
            '429': {
              description: 'Rate limit exceeded',
            },
            '500': {
              description: 'Internal server error',
            },
          },
          security: [
            {
              bearerAuth: [],
            },
          ],
        },
      },
      '/': {
        get: {
          summary: 'Health Check',
          description: 'Returns server health status and version information',
          responses: {
            '200': {
              description: 'Server is healthy',
            },
          },
        },
      },
      '/.well-known/oauth-authorization-server': {
        get: {
          summary: 'OAuth Authorization Server Metadata',
          description: 'RFC 8414 OAuth 2.0 Authorization Server Metadata',
          responses: {
            '200': {
              description: 'OAuth server metadata',
            },
          },
        },
      },
      '/.well-known/oauth-protected-resource': {
        get: {
          summary: 'OAuth Protected Resource Metadata',
          description: 'RFC 9728 OAuth 2.0 Protected Resource Metadata',
          responses: {
            '200': {
              description: 'Protected resource metadata',
            },
          },
        },
      },
      '/oauth/authorize': {
        get: {
          summary: 'OAuth Authorization Endpoint',
          description:
            'OAuth 2.1 authorization endpoint (proxies to Supabase Auth). Adds RFC 8707 resource parameter for MCP compliance. Validates PKCE, response_type, and redirect_uri before forwarding to Supabase Auth.',
          tags: ['oauth'],
          operationId: 'oauthAuthorize',
          parameters: [
            {
              name: 'client_id',
              in: 'query',
              required: true,
              schema: {
                type: 'string',
              },
              description: 'OAuth client identifier',
            },
            {
              name: 'response_type',
              in: 'query',
              required: true,
              schema: {
                type: 'string',
                enum: ['code'],
              },
              description: 'Response type (must be "code" for OAuth 2.1)',
            },
            {
              name: 'redirect_uri',
              in: 'query',
              required: true,
              schema: {
                type: 'string',
                format: 'uri',
              },
              description: 'Redirect URI where authorization code will be sent',
            },
            {
              name: 'scope',
              in: 'query',
              required: false,
              schema: {
                type: 'string',
              },
              description: 'Space-separated list of requested scopes',
            },
            {
              name: 'state',
              in: 'query',
              required: false,
              schema: {
                type: 'string',
              },
              description: 'Opaque value used to maintain state between request and callback',
            },
            {
              name: 'code_challenge',
              in: 'query',
              required: true,
              schema: {
                type: 'string',
              },
              description: 'PKCE code challenge (required for OAuth 2.1)',
            },
            {
              name: 'code_challenge_method',
              in: 'query',
              required: true,
              schema: {
                type: 'string',
                enum: ['S256'],
              },
              description: 'PKCE code challenge method (must be S256)',
            },
          ],
          responses: {
            '302': {
              description: 'Redirect to Supabase Auth OAuth 2.1 Server with resource parameter',
            },
            '400': {
              description:
                'Invalid request (missing parameters, invalid response_type, missing PKCE, etc.)',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: {
                        type: 'string',
                        enum: ['invalid_request', 'unsupported_response_type', 'invalid_scope'],
                      },
                      error_description: {
                        type: 'string',
                        description: 'Human-readable error description',
                      },
                    },
                  },
                },
              },
            },
            '500': {
              description: 'Internal server error',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: {
                        type: 'string',
                        enum: ['server_error'],
                      },
                      error_description: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/oauth/token': {
        post: {
          summary: 'OAuth Token Endpoint',
          description: 'OAuth 2.1 token exchange endpoint (proxies to Supabase Auth)',
          tags: ['oauth'],
          operationId: 'oauthToken',
          requestBody: {
            required: true,
            content: {
              'application/x-www-form-urlencoded': {
                schema: {
                  type: 'object',
                  required: ['grant_type', 'code', 'redirect_uri', 'client_id', 'code_verifier'],
                  properties: {
                    grant_type: {
                      type: 'string',
                      enum: ['authorization_code'],
                      description: 'OAuth grant type (must be authorization_code)',
                    },
                    code: {
                      type: 'string',
                      description: 'Authorization code received from authorization endpoint',
                    },
                    redirect_uri: {
                      type: 'string',
                      format: 'uri',
                      description: 'Redirect URI used in authorization request',
                    },
                    client_id: {
                      type: 'string',
                      description: 'OAuth client identifier',
                    },
                    code_verifier: {
                      type: 'string',
                      description: 'PKCE code verifier (required for OAuth 2.1)',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Token response with access token, refresh token, and metadata',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      access_token: {
                        type: 'string',
                        description: 'JWT access token',
                      },
                      refresh_token: {
                        type: 'string',
                        description: 'Refresh token for obtaining new access tokens',
                      },
                      token_type: {
                        type: 'string',
                        enum: ['Bearer'],
                        description: 'Token type (always Bearer)',
                      },
                      expires_in: {
                        type: 'integer',
                        description: 'Access token expiration time in seconds',
                      },
                      scope: {
                        type: 'string',
                        description: 'Granted scopes (space-separated)',
                      },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Invalid request (missing parameters, invalid grant type, etc.)',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: {
                        type: 'string',
                        description: 'OAuth error code',
                      },
                      error_description: {
                        type: 'string',
                        description: 'Human-readable error description',
                      },
                    },
                  },
                },
              },
            },
            '500': {
              description: 'Internal server error',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: {
                        type: 'string',
                        enum: ['server_error'],
                      },
                      error_description: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/oauth/revoke': {
        post: {
          summary: 'OAuth Token Revocation Endpoint',
          description:
            'OAuth 2.1 token revocation endpoint (RFC 7009). Proxies to Supabase Auth OAuth 2.1 Server. Always returns 200 per RFC 7009 to prevent token enumeration attacks.',
          tags: ['oauth'],
          operationId: 'oauthRevoke',
          requestBody: {
            required: true,
            content: {
              'application/x-www-form-urlencoded': {
                schema: {
                  type: 'object',
                  required: ['token'],
                  properties: {
                    token: {
                      type: 'string',
                      description: 'Access token or refresh token to revoke',
                    },
                    token_type_hint: {
                      type: 'string',
                      enum: ['access_token', 'refresh_token'],
                      description: 'Optional hint about the token type',
                    },
                    client_id: {
                      type: 'string',
                      description: 'Optional client identifier (for public clients)',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description:
                'Token revocation successful (always returns 200 per RFC 7009, even if token does not exist)',
            },
          },
        },
      },
      '/oauth/introspect': {
        post: {
          summary: 'OAuth Token Introspection Endpoint',
          description:
            'OAuth 2.1 token introspection endpoint (RFC 7662). Proxies to Supabase Auth OAuth 2.1 Server. Allows resource servers to validate tokens and retrieve token metadata.',
          tags: ['oauth'],
          operationId: 'oauthIntrospect',
          requestBody: {
            required: true,
            content: {
              'application/x-www-form-urlencoded': {
                schema: {
                  type: 'object',
                  required: ['token'],
                  properties: {
                    token: {
                      type: 'string',
                      description: 'Access token or refresh token to introspect',
                    },
                    token_type_hint: {
                      type: 'string',
                      enum: ['access_token', 'refresh_token'],
                      description: 'Optional hint about the token type',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Token introspection response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      active: {
                        type: 'boolean',
                        description: 'Whether the token is active (valid and not expired)',
                      },
                      scope: {
                        type: 'string',
                        description: 'Token scopes (space-separated)',
                      },
                      client_id: {
                        type: 'string',
                        description: 'Client identifier that issued the token',
                      },
                      username: {
                        type: 'string',
                        description: 'Username associated with the token',
                      },
                      exp: {
                        type: 'integer',
                        description: 'Token expiration timestamp (Unix time)',
                      },
                      iat: {
                        type: 'integer',
                        description: 'Token issuance timestamp (Unix time)',
                      },
                      sub: {
                        type: 'string',
                        description: 'Subject (user ID) associated with the token',
                      },
                      aud: {
                        type: 'string',
                        description: 'Audience (resource) the token is intended for',
                      },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Invalid request (missing token parameter)',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: {
                        type: 'string',
                        enum: ['invalid_request'],
                      },
                      error_description: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            },
            '500': {
              description: 'Internal server error',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: {
                        type: 'string',
                        enum: ['server_error'],
                      },
                      error_description: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/oauth/register': {
        post: {
          summary: 'OAuth Dynamic Client Registration Endpoint',
          description:
            'OAuth 2.1 dynamic client registration endpoint (RFC 7591). Proxies to Supabase Auth OAuth 2.1 Server. Allows clients to register themselves automatically without manual setup.',
          tags: ['oauth'],
          operationId: 'oauthRegister',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['redirect_uris'],
                  properties: {
                    redirect_uris: {
                      type: 'array',
                      items: {
                        type: 'string',
                        format: 'uri',
                      },
                      description: 'Array of redirect URIs for the client',
                      minItems: 1,
                    },
                    client_name: {
                      type: 'string',
                      description: 'Human-readable name for the client',
                    },
                    client_uri: {
                      type: 'string',
                      format: 'uri',
                      description: 'URL of the client home page',
                    },
                    logo_uri: {
                      type: 'string',
                      format: 'uri',
                      description: 'URL of the client logo',
                    },
                    scope: {
                      type: 'string',
                      description: 'Space-separated list of scopes the client will request',
                    },
                    contacts: {
                      type: 'array',
                      items: {
                        type: 'string',
                        format: 'email',
                      },
                      description: 'Array of contact email addresses',
                    },
                    tos_uri: {
                      type: 'string',
                      format: 'uri',
                      description: 'URL of the client terms of service',
                    },
                    policy_uri: {
                      type: 'string',
                      format: 'uri',
                      description: 'URL of the client privacy policy',
                    },
                    grant_types: {
                      type: 'array',
                      items: {
                        type: 'string',
                        enum: ['authorization_code', 'refresh_token'],
                      },
                      description: 'Grant types the client will use',
                    },
                    response_types: {
                      type: 'array',
                      items: {
                        type: 'string',
                        enum: ['code'],
                      },
                      description: 'Response types the client will use',
                    },
                    token_endpoint_auth_method: {
                      type: 'string',
                      enum: ['none', 'client_secret_post'],
                      description: 'Client authentication method',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Client registration successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['client_id'],
                    properties: {
                      client_id: {
                        type: 'string',
                        description: 'Unique client identifier',
                      },
                      client_secret: {
                        type: 'string',
                        description: 'Client secret (if client_secret_post auth method used)',
                      },
                      client_id_issued_at: {
                        type: 'integer',
                        description: 'Client ID issuance timestamp (Unix time)',
                      },
                      client_secret_expires_at: {
                        type: 'integer',
                        description: 'Client secret expiration timestamp (0 if no expiration)',
                      },
                      redirect_uris: {
                        type: 'array',
                        items: {
                          type: 'string',
                          format: 'uri',
                        },
                        description: 'Registered redirect URIs',
                      },
                      grant_types: {
                        type: 'array',
                        items: {
                          type: 'string',
                        },
                        description: 'Grant types supported by the client',
                      },
                      response_types: {
                        type: 'array',
                        items: {
                          type: 'string',
                        },
                        description: 'Response types supported by the client',
                      },
                      client_name: {
                        type: 'string',
                        description: 'Human-readable client name',
                      },
                      client_uri: {
                        type: 'string',
                        format: 'uri',
                        description: 'Client home page URL',
                      },
                      logo_uri: {
                        type: 'string',
                        format: 'uri',
                        description: 'Client logo URL',
                      },
                      scope: {
                        type: 'string',
                        description: 'Default scopes for the client',
                      },
                      contacts: {
                        type: 'array',
                        items: {
                          type: 'string',
                          format: 'email',
                        },
                        description: 'Contact email addresses',
                      },
                      tos_uri: {
                        type: 'string',
                        format: 'uri',
                        description: 'Terms of service URL',
                      },
                      policy_uri: {
                        type: 'string',
                        format: 'uri',
                        description: 'Privacy policy URL',
                      },
                      token_endpoint_auth_method: {
                        type: 'string',
                        description: 'Client authentication method',
                      },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Invalid client metadata',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: {
                        type: 'string',
                        enum: ['invalid_client_metadata', 'invalid_request'],
                      },
                      error_description: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            },
            '500': {
              description: 'Internal server error',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: {
                        type: 'string',
                        enum: ['server_error'],
                      },
                      error_description: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        // JSON-RPC 2.0 schemas
        JsonRpcRequest: {
          type: 'object',
          required: ['jsonrpc', 'method', 'id'],
          properties: {
            jsonrpc: { type: 'string', enum: ['2.0'] },
            method: { type: 'string' },
            params: { type: 'object' },
            id: { oneOf: [{ type: 'string' }, { type: 'integer' }] },
          },
        },
        JsonRpcResponse: {
          type: 'object',
          required: ['jsonrpc', 'id'],
          properties: {
            jsonrpc: { type: 'string', enum: ['2.0'] },
            result: { type: 'object' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'integer' },
                message: { type: 'string' },
                data: { type: 'object' },
              },
            },
            id: { oneOf: [{ type: 'string' }, { type: 'integer' }] },
          },
        },
        // Tool schemas will be added here (from Zod via zod-openapi)
        // Resource schemas will be added here
        // Prompt schemas will be added here
      },
    },
    tags: [
      { name: 'mcp', description: 'MCP Protocol endpoints' },
      { name: 'oauth', description: 'OAuth 2.1 authentication endpoints' },
      { name: 'health', description: 'Health check endpoints' },
    ],
  });

  // Add tool schemas to components.schemas
  if (document.components?.schemas) {
    for (const tool of tools) {
      const schemaName = `${tool.name}Input`;

      if (tool.inputSchema) {
        // Convert Zod schema to OpenAPI schema using zod-openapi
        try {
          // Use zod-openapi's .openapi() method if available
          const zodSchema = tool.inputSchema as z.ZodSchema & { openapi?: (options?: any) => any };

          let openApiSchema: Record<string, unknown>;

          if (typeof zodSchema.openapi === 'function') {
            // Use .openapi() method from zod-openapi
            openApiSchema = zodSchema.openapi({
              type: 'object',
              description: tool.description || `Input schema for ${tool.name} tool`,
            });
          } else {
            // Fallback: Use createDocument() with a mock path to convert schema
            // This ensures zod-openapi properly converts the schema
            const mockDocument = createDocument({
              openapi: '3.1.0',
              info: { title: 'Temp', version: '1.0.0' },
              paths: {
                '/temp': {
                  post: {
                    requestBody: {
                      content: {
                        'application/json': {
                          schema: zodSchema,
                        },
                      },
                    },
                    responses: { '200': { description: 'OK' } },
                  },
                },
              },
            });

            // Extract schema from the converted document
            const requestBodySchema = (mockDocument.paths?.['/temp']?.post?.requestBody as any)
              ?.content?.['application/json']?.schema;
            openApiSchema = requestBodySchema || { type: 'object' };
          }

          // Ensure openApiSchema is an object before spreading
          const baseSchema: Record<string, unknown> =
            typeof openApiSchema === 'object' &&
            openApiSchema !== null &&
            !Array.isArray(openApiSchema)
              ? { ...(openApiSchema as Record<string, unknown>) }
              : { type: 'object' };

          const finalSchema: Record<string, unknown> = {
            ...baseSchema,
            description: tool.description || `Input schema for ${tool.name} tool`,
          };
          if (tool.inputSchemaExample) {
            finalSchema['example'] = tool.inputSchemaExample;
          }
          document.components.schemas[schemaName] = finalSchema as any;
        } catch (error) {
          console.warn(`   ⚠️  Error converting schema for ${tool.name}: ${error}`);
          // Fallback to basic schema
          const fallbackSchema: Record<string, unknown> = {
            type: 'object',
            description: tool.description || `Input schema for ${tool.name} tool`,
          };
          if (tool.inputSchemaExample) {
            fallbackSchema['example'] = tool.inputSchemaExample;
          }
          document.components.schemas[schemaName] = fallbackSchema as any;
        }
      } else {
        // Fallback: placeholder schema
        document.components.schemas[schemaName] = {
          type: 'object',
          description: tool.description || `Input schema for ${tool.name} tool`,
        };
      }
    }

    // Add resource schemas with examples
    for (const resource of resources) {
      const exampleUri = resource.uriTemplate
        .replace('{category}', 'agents')
        .replace('{slug}', 'example-slug')
        .replace('{format}', 'markdown');

      document.components.schemas[`${resource.name}Resource`] = {
        type: 'object',
        description: resource.description,
        properties: {
          uri: { type: 'string', format: 'uri', example: exampleUri },
          mimeType: { type: 'string', example: resource.mimeType },
          text: { type: 'string', example: 'Resource content...' },
        },
        example: {
          uri: exampleUri,
          mimeType: resource.mimeType,
          text: 'Resource content...',
        },
      };
    }

    // Add prompt schemas
    for (const prompt of prompts) {
      const schemaName = `${prompt.name}Args`;

      if (prompt.argsSchema) {
        // Convert Zod schema to OpenAPI schema using zod-openapi
        try {
          // Use zod-openapi's .openapi() method if available
          const zodSchema = prompt.argsSchema as z.ZodSchema & { openapi?: (options?: any) => any };

          let openApiSchema: Record<string, unknown>;

          if (typeof zodSchema.openapi === 'function') {
            // Use .openapi() method from zod-openapi
            openApiSchema = zodSchema.openapi({
              type: 'object',
              description: prompt.description || `Arguments for ${prompt.name} prompt`,
            });
          } else {
            // Fallback: Use createDocument() with a mock path to convert schema
            // This ensures zod-openapi properly converts the schema
            const mockDocument = createDocument({
              openapi: '3.1.0',
              info: { title: 'Temp', version: '1.0.0' },
              paths: {
                '/temp': {
                  post: {
                    requestBody: {
                      content: {
                        'application/json': {
                          schema: zodSchema,
                        },
                      },
                    },
                    responses: { '200': { description: 'OK' } },
                  },
                },
              },
            });

            // Extract schema from the converted document
            const requestBodySchema = (mockDocument.paths?.['/temp']?.post?.requestBody as any)
              ?.content?.['application/json']?.schema;
            openApiSchema = requestBodySchema || { type: 'object' };
          }

          // Ensure openApiSchema is an object
          const baseSchema: Record<string, unknown> =
            typeof openApiSchema === 'object' &&
            openApiSchema !== null &&
            !Array.isArray(openApiSchema)
              ? { ...(openApiSchema as Record<string, unknown>) }
              : { type: 'object' };

          const finalSchema: Record<string, unknown> = {
            ...baseSchema,
            description: prompt.description || `Arguments for ${prompt.name} prompt`,
          };
          if (prompt.argsSchemaExample) {
            finalSchema['example'] = prompt.argsSchemaExample;
          }
          document.components.schemas[schemaName] = finalSchema as any;
        } catch (error) {
          console.warn(`   ⚠️  Error converting schema for ${prompt.name}: ${error}`);
          // Fallback to basic schema
          const fallbackSchema: Record<string, unknown> = {
            type: 'object',
            description: prompt.description || `Arguments for ${prompt.name} prompt`,
          };
          if (prompt.argsSchemaExample) {
            fallbackSchema['example'] = prompt.argsSchemaExample;
          }
          document.components.schemas[schemaName] = fallbackSchema as any;
        }
      } else {
        // Fallback: placeholder schema
        document.components.schemas[schemaName] = {
          type: 'object',
          description: prompt.description || `Arguments for ${prompt.name} prompt`,
        };
      }
    }
  }

  // Write OpenAPI spec
  const outputPath = join(PROJECT_ROOT, 'openapi-mcp.json');
  await writeFile(outputPath, JSON.stringify(document, null, 2));

  console.log(`✅ Generated OpenAPI spec: ${outputPath}`);
  console.log(`   - ${tools.length} tools`);
  console.log(`   - ${resources.length} resources`);
  console.log(`   - ${prompts.length} prompts`);
}

// Export for use in bin script
export { generateMcpOpenAPI };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateMcpOpenAPI().catch((error) => {
    console.error('Error generating MCP OpenAPI spec:', error);
    process.exit(1);
  });
}
