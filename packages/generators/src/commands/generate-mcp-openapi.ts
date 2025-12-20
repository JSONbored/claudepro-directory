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

const __filename = fileURLToPath(import.meta.url);
// Calculate PROJECT_ROOT: from packages/generators/src/commands/ -> project root
// Or from packages/generators/src/bin/ -> project root
let PROJECT_ROOT = join(__filename, '../../../../');
// Verify by checking if apps/workers/heyclaude-mcp exists
if (!existsSync(join(PROJECT_ROOT, 'apps/workers/heyclaude-mcp'))) {
  // Try alternative path (if called from bin script)
  const altPath = join(__filename, '../../../../../');
  if (existsSync(join(altPath, 'apps/workers/heyclaude-mcp'))) {
    PROJECT_ROOT = altPath;
  } else {
    // Final fallback - use process.cwd() and verify
    const cwdPath = process.cwd();
    if (existsSync(join(cwdPath, 'apps/workers/heyclaude-mcp'))) {
      PROJECT_ROOT = cwdPath;
    } else {
      throw new Error(
        `Could not find project root. Tried:\n` +
        `  - ${PROJECT_ROOT}\n` +
        `  - ${altPath}\n` +
        `  - ${cwdPath}\n` +
        `Looking for: apps/workers/heyclaude-mcp`
      );
    }
  }
}

const MCP_SERVER_PATH = join(PROJECT_ROOT, 'apps/workers/heyclaude-mcp/src/mcp');

interface ToolMetadata {
  name: string;
  title: string;
  description: string;
  inputSchema?: z.ZodSchema;
  inputSchemaSource?: string;
  inputSchemaName?: string;
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
  argsSchema?: Record<string, z.ZodTypeAny>;
  argsSchemaSource?: string;
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
            if (Node.isTemplateHead(literal) || Node.isTemplateMiddle(literal) || Node.isTemplateTail(literal)) {
              parts.push(literal.getText().replace(/`/g, '').replace(/\$\{/g, '').replace(/\}/g, '').trim());
            }
          }
          description = parts.join(' ').trim();
        }
      }
    }

    // Extract inputSchema source
    let inputSchemaSource: string | undefined;
    let inputSchemaName: string | undefined;
    if (inputSchemaProp && Node.isPropertyAssignment(inputSchemaProp)) {
      const schemaInit = inputSchemaProp.getInitializer();
      if (schemaInit) {
        inputSchemaSource = schemaInit.getText();
        if (Node.isIdentifier(schemaInit)) {
          inputSchemaName = schemaInit.getText();
        }
      }
    }

    tools.push({
      name,
      title,
      description,
      ...(inputSchemaSource && { inputSchemaSource }),
      ...(inputSchemaName && { inputSchemaName }),
      filePath: sourceFile.getFilePath(),
    });
  });
  
  // Debug output
  console.log(`   📊 Found ${propertyAccessCount} property access calls, ${registerToolCount} registerTool calls, extracted ${tools.length} tools`);
  if (tools.length === 0 && registerToolCount > 0) {
    console.warn(`⚠️  Found ${registerToolCount} registerTool calls but extracted 0 tools. Check argument parsing.`);
  }

  return tools;
}

/**
 * Extract resource metadata from register.ts
 */
function extractResourceMetadata(sourceFile: SourceFile): ResourceMetadata[] {
  const resources: ResourceMetadata[] = [];

  // Find all registerResource calls
  sourceFile.getDescendantsOfKind(207).forEach((call) => {
    if (!Node.isCallExpression(call)) return;

    const expression = call.getExpression();
    if (!Node.isPropertyAccessExpression(expression)) return;
    
    // Check if method name is 'registerResource'
    if (expression.getName() !== 'registerResource') return;

    const args = call.getArguments();
    if (args.length < 4) return;

    // First arg: resource name (string literal)
    const nameArg = args[0];
    if (!Node.isStringLiteral(nameArg)) return;
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
        }
      }
    }

    // Third arg: metadata object
    const metadataArg = args[2];
    if (!Node.isObjectLiteralExpression(metadataArg)) return;

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
            if (Node.isTemplateHead(literal) || Node.isTemplateMiddle(literal) || Node.isTemplateTail(literal)) {
              parts.push(literal.getText().replace(/`/g, '').replace(/\$\{/g, '').replace(/\}/g, '').trim());
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
            if (Node.isTemplateHead(literal) || Node.isTemplateMiddle(literal) || Node.isTemplateTail(literal)) {
              parts.push(literal.getText().replace(/`/g, '').replace(/\$\{/g, '').replace(/\}/g, '').trim());
            }
          }
          description = parts.join(' ').trim();
        }
      }
    }

    // Extract argsSchema source
    let argsSchemaSource: string | undefined;
    if (argsSchemaProp && Node.isPropertyAssignment(argsSchemaProp)) {
      const schemaInit = argsSchemaProp.getInitializer();
      if (schemaInit) {
        argsSchemaSource = schemaInit.getText();
      }
    }

    prompts.push({
      name,
      title,
      description,
      ...(argsSchemaSource && { argsSchemaSource }),
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
  
  // Match: mcpServer.registerTool('name', { title: '...', description: '...', inputSchema: ... }, ...)
  const toolRegex = /mcpServer\.registerTool\s*\(\s*['"]([^'"]+)['"]\s*,\s*\{[^}]*title:\s*['"]([^'"]+)['"][^}]*description:\s*['"]?([^'"]+)['"]?/gs;
  
  let match;
  while ((match = toolRegex.exec(sourceText)) !== null) {
    const [, name, title, description] = match;
    if (name && title) {
      tools.push({
        name: name.trim(),
        title: title.trim(),
        description: (description || '').trim(),
        filePath: 'apps/workers/heyclaude-mcp/src/mcp/tools/register.ts',
      });
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
  const resourceRegex = /mcpServer\.registerResource\s*\(\s*['"]([^'"]+)['"]\s*,\s*new\s+ResourceTemplate\s*\(\s*['"]([^'"]+)['"][^)]*\)\s*,\s*\{[^}]*title:\s*['"]([^'"]+)['"][^}]*description:\s*['"]?([^'"]+)['"]?[^}]*mimeType:\s*['"]([^'"]+)['"]/gs;
  
  let match;
  while ((match = resourceRegex.exec(sourceText)) !== null) {
    const [, name, uriTemplate, title, description, mimeType] = match;
    if (name && uriTemplate && title) {
      resources.push({
        name: name.trim(),
        uriTemplate: uriTemplate.trim(),
        title: title.trim(),
        description: (description || '').trim(),
        mimeType: (mimeType || 'text/plain').trim(),
        filePath: 'apps/workers/heyclaude-mcp/src/mcp/resources/register.ts',
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
  
  // Match: mcpServer.registerPrompt('name', { title: '...', description: '...', argsSchema: ... }, ...)
  const promptRegex = /mcpServer\.registerPrompt\s*\(\s*['"]([^'"]+)['"]\s*,\s*\{[^}]*title:\s*['"]([^'"]+)['"][^}]*description:\s*['"]?([^'"]+)['"]?/gs;
  
  let match;
  while ((match = promptRegex.exec(sourceText)) !== null) {
    const [, name, title, description] = match;
    if (name && title) {
      prompts.push({
        name: name.trim(),
        title: title.trim(),
        description: (description || '').trim(),
        filePath: 'apps/workers/heyclaude-mcp/src/mcp/prompts/register.ts',
      });
    }
  }
  
  return prompts;
}

/**
 * Generate OpenAPI spec for MCP server
 */
async function generateMcpOpenAPI(): Promise<void> {
  // Create project with proper TypeScript configuration
  // Try to use the MCP worker's tsconfig.json if it exists
  const mcpTsConfigPath = join(PROJECT_ROOT, 'apps/workers/heyclaude-mcp/tsconfig.json');
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
    console.warn('   This is expected for now - AST parsing needs enhancement for full schema extraction.');
    console.warn('   The OpenAPI spec will be generated with placeholder schemas.');
  }

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
          description: 'OAuth 2.1 authorization endpoint (proxies to Supabase Auth)',
          responses: {
            '302': {
              description: 'Redirect to Supabase Auth',
            },
          },
        },
      },
      '/oauth/token': {
        post: {
          summary: 'OAuth Token Endpoint',
          description: 'OAuth 2.1 token exchange endpoint (proxies to Supabase Auth)',
          responses: {
            '200': {
              description: 'Token response',
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
  // For now, we'll add placeholders - full schema extraction requires runtime evaluation
  if (document.components?.schemas) {
    for (const tool of tools) {
      document.components.schemas[`${tool.name}Input`] = {
        type: 'object',
        description: `Input schema for ${tool.name} tool`,
        // Schema will be populated from Zod via zod-openapi
      };
    }

    // Add resource schemas
    for (const resource of resources) {
      document.components.schemas[`${resource.name}Resource`] = {
        type: 'object',
        description: resource.description,
        properties: {
          uri: { type: 'string', format: 'uri' },
          mimeType: { type: 'string' },
          text: { type: 'string' },
        },
      };
    }

    // Add prompt schemas
    for (const prompt of prompts) {
      document.components.schemas[`${prompt.name}Args`] = {
        type: 'object',
        description: `Arguments for ${prompt.name} prompt`,
        // Schema will be populated from Zod via zod-openapi
      };
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
