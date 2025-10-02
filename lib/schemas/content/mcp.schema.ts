/**
 * MCP Server Content Schema
 * Based on actual MCP JSON files structure and MCP template
 *
 * Phase 2: Refactored using base-content.schema.ts with shape destructuring
 */

import { z } from 'zod';
import {
  baseContentMetadataSchema,
  baseInstallationSchema,
  baseTroubleshootingSchema,
} from '@/lib/schemas/content/base-content.schema';
import { examplesArray, limitedMediumStringArray } from '@/lib/schemas/primitives/base-arrays';
import {
  codeString,
  mediumString,
  nonEmptyString,
  shortString,
  urlString,
} from '@/lib/schemas/primitives/base-strings';

/**
 * MCP Transport Configuration Schema
 *
 * Flexible transport configuration supporting multiple transport types:
 * - stdio: Command-based transport with arguments and environment
 * - http/sse: URL-based transport
 */
const mcpTransportConfigSchema = z
  .object({
    command: mediumString.optional().describe('Command to execute for stdio transport'), // For stdio transport
    args: z
      .array(z.string().max(200))
      .optional()
      .describe('Command-line arguments for stdio transport'), // For stdio transport
    env: z
      .record(z.string(), codeString)
      .optional()
      .describe('Environment variables for the MCP server process'),
    transport: shortString.optional().describe('Transport type identifier (sse, http, stdio)'), // For SSE/HTTP transport
    url: z.string().url().max(2048).optional().describe('Server URL for HTTP or SSE transport'), // For SSE/HTTP transport
  })
  .describe(
    'MCP transport configuration supporting multiple transport types (stdio, HTTP, SSE) with command, arguments, environment, and URL settings.'
  );

/**
 * HTTP Transport Configuration
 *
 * Configuration for HTTP-based MCP servers with optional headers.
 */
const mcpHttpConfigSchema = z
  .object({
    type: z.literal('http').describe('Transport type literal: "http"'),
    url: urlString.describe('HTTP server URL endpoint'),
    headers: z
      .record(z.string(), z.string())
      .optional()
      .describe('Optional HTTP headers for authentication or configuration'),
  })
  .describe('HTTP transport configuration for MCP servers with URL and optional headers.');

/**
 * SSE Transport Configuration
 *
 * Configuration for Server-Sent Events (SSE) based MCP servers.
 */
const mcpSseConfigSchema = z
  .object({
    type: z.literal('sse').describe('Transport type literal: "sse"'),
    url: urlString.describe('SSE server URL endpoint'),
    headers: z
      .record(z.string(), z.string())
      .optional()
      .describe('Optional HTTP headers for SSE connection'),
  })
  .describe('Server-Sent Events (SSE) transport configuration for MCP servers.');

/**
 * STDIO Transport Configuration
 *
 * Configuration for stdio-based MCP servers (most common transport type).
 */
const mcpStdioConfigSchema = z
  .object({
    command: z.string().describe('Command to execute for stdio-based MCP server'),
    args: z.array(z.string()).describe('Command-line arguments array'),
    env: z
      .record(z.string(), z.string())
      .optional()
      .describe('Optional environment variables for the server process'),
  })
  .describe('STDIO transport configuration for command-based MCP servers (most common type).');

/**
 * MCP Configuration Schema
 *
 * MCP-specific configuration structure for Claude Desktop and Claude Code.
 * Note: This differs from baseConfigurationSchema as MCP has unique configuration needs.
 *
 * Structure:
 * - claudeDesktop: Desktop app configuration with mcpServers record
 * - claudeCode: CLI configuration with mcpServers record
 * - http/sse: Optional transport-specific configurations
 */
const mcpConfigurationSchema = z
  .object({
    claudeDesktop: z
      .object({
        mcpServers: z
          .record(z.string(), mcpTransportConfigSchema)
          .describe('Record of MCP server configurations by server name'),
      })
      .optional()
      .describe('Claude Desktop application MCP server configuration'),
    claudeCode: z
      .object({
        mcpServers: z
          .record(z.string(), mcpTransportConfigSchema)
          .describe('Record of MCP server configurations by server name'),
      })
      .optional()
      .describe('Claude Code CLI MCP server configuration'),
    http: mcpHttpConfigSchema.optional().describe('Optional HTTP transport configuration'),
    sse: mcpSseConfigSchema.optional().describe('Optional SSE transport configuration'),
  })
  .describe(
    'MCP-specific configuration structure for Claude Desktop and Claude Code with platform-specific mcpServers configurations and transport settings.'
  );

/**
 * MCP Transport Layer Schema
 *
 * Defines available transport mechanisms for MCP server communication.
 */
const mcpTransportSchema = z
  .object({
    stdio: mcpStdioConfigSchema.optional().describe('Optional STDIO transport configuration'),
    http: mcpHttpConfigSchema.optional().describe('Optional HTTP transport configuration'),
    sse: mcpSseConfigSchema.optional().describe('Optional SSE transport configuration'),
  })
  .describe(
    'Transport layer configuration defining available transport mechanisms (stdio, HTTP, SSE) for MCP server communication.'
  );

/**
 * MCP Capabilities Schema
 *
 * Defines what capabilities an MCP server supports.
 */
const mcpCapabilitiesSchema = z
  .object({
    resources: z
      .boolean()
      .optional()
      .describe('Whether server provides resource access capabilities'),
    tools: z.boolean().optional().describe('Whether server provides tool execution capabilities'),
    prompts: z
      .boolean()
      .optional()
      .describe('Whether server provides prompt template capabilities'),
    logging: z.boolean().optional().describe('Whether server supports logging capabilities'),
  })
  .describe(
    'MCP server capabilities definition indicating supported features (resources, tools, prompts, logging).'
  );

/**
 * MCP Server Info Schema
 *
 * Server identification and version information.
 */
const mcpServerInfoSchema = z
  .object({
    name: nonEmptyString.describe('MCP server name identifier'),
    version: nonEmptyString.describe('Server version string'),
    protocol_version: z
      .string()
      .optional()
      .describe('Optional MCP protocol version the server implements'),
  })
  .describe('MCP server identification and version information.');

/**
 * MCP Server Content Schema
 *
 * Matches actual production MCP JSON structure with shape destructuring pattern.
 *
 * Inherits common fields from baseContentMetadataSchema via shape destructuring:
 * - slug, description, author, dateAdded, tags, content
 * - title, source, documentationUrl, features, useCases
 *
 * Uses baseInstallationSchema BUT with MCP-specific pattern:
 * - claudeCode is a STRING (simple command) not an object for MCP servers
 * - This differs from commands/hooks where claudeCode is an object with steps
 *
 * MCP-specific additions:
 * - category: 'mcp' literal
 * - configuration: MCP-specific config (claudeDesktop/claudeCode with mcpServers)
 * - package: NPM package identifier
 * - installation: Installation instructions (uses baseInstallationSchema)
 * - security: Security guidelines and best practices
 * - troubleshooting: Common issues and solutions
 * - examples: Usage examples
 * - requiresAuth/authType/permissions: Authentication requirements
 * - mcpVersion/serverType: MCP protocol specifics
 * - dataTypes/toolsProvided/resourcesProvided: Capability descriptions
 * - transport/capabilities/serverInfo: Advanced MCP configurations
 */
export const mcpContentSchema = z
  .object({
    // Inherit all base content metadata fields using shape destructuring (Zod v4 best practice)
    ...baseContentMetadataSchema.shape,

    // MCP-specific required fields
    category: z.literal('mcp').describe('Content category literal identifier: "mcp"'),
    configuration: mcpConfigurationSchema.describe(
      'MCP server configuration for Claude Desktop and Claude Code'
    ),

    // MCP-specific optional fields
    package: z
      .string()
      .max(200)
      .nullable()
      .optional()
      .describe('Optional NPM package identifier for the MCP server'),
    installation: baseInstallationSchema
      .optional()
      .describe('Optional platform-specific installation instructions'),
    security: limitedMediumStringArray
      .optional()
      .describe('Optional security guidelines and best practices for server configuration'),
    troubleshooting: z
      .array(baseTroubleshootingSchema)
      .max(20)
      .optional()
      .describe('Optional array of common issues and solutions (max 20)'), // Changed from string array to object array for consistency
    examples: examplesArray.optional().describe('Optional usage examples for the MCP server'),

    // Authentication and permissions
    requiresAuth: z.boolean().optional().describe('Whether the MCP server requires authentication'),
    authType: z
      .enum(['api_key', 'oauth', 'connection_string', 'basic_auth'])
      .optional()
      .describe(
        'Type of authentication required (API key, OAuth, connection string, or basic auth)'
      ),
    permissions: z
      .array(shortString)
      .max(20)
      .optional()
      .describe('Optional list of required permissions or scopes'),
    configLocation: mediumString
      .optional()
      .describe('Optional configuration file location or path guidance'),

    // MCP protocol specific
    mcpVersion: z.string().optional().describe('MCP protocol version implemented by the server'),
    serverType: z
      .enum(['stdio', 'http', 'sse'])
      .optional()
      .describe('Primary transport type for the MCP server (stdio, HTTP, or SSE)'),

    // Data and capability descriptions
    dataTypes: limitedMediumStringArray
      .optional()
      .describe('Optional list of data types the server can access or provide'),
    toolsProvided: limitedMediumStringArray
      .optional()
      .describe('Optional list of tools or capabilities the server provides'),
    resourcesProvided: limitedMediumStringArray
      .optional()
      .describe('Optional list of resources the server can access'),

    // Advanced MCP configurations
    transport: mcpTransportSchema
      .optional()
      .describe('Optional advanced transport layer configuration'),
    capabilities: mcpCapabilitiesSchema
      .optional()
      .describe('Optional server capabilities definition'),
    serverInfo: mcpServerInfoSchema
      .optional()
      .describe('Optional server identification and version info'),
  })
  .describe(
    'MCP server content schema for Model Context Protocol servers. Inherits base content metadata and adds MCP-specific configuration, transport settings, authentication, capabilities, and server information.'
  );

export type McpContent = z.infer<typeof mcpContentSchema>;
