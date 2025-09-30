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
const mcpTransportConfigSchema = z.object({
  command: mediumString.optional(), // For stdio transport
  args: z.array(z.string().max(200)).optional(), // For stdio transport
  env: z.record(z.string(), codeString).optional(),
  transport: shortString.optional(), // For SSE/HTTP transport
  url: z.string().url().max(2048).optional(), // For SSE/HTTP transport
});

/**
 * HTTP Transport Configuration
 *
 * Configuration for HTTP-based MCP servers with optional headers.
 */
const mcpHttpConfigSchema = z.object({
  type: z.literal('http'),
  url: urlString,
  headers: z.record(z.string(), z.string()).optional(),
});

/**
 * SSE Transport Configuration
 *
 * Configuration for Server-Sent Events (SSE) based MCP servers.
 */
const mcpSseConfigSchema = z.object({
  type: z.literal('sse'),
  url: urlString,
  headers: z.record(z.string(), z.string()).optional(),
});

/**
 * STDIO Transport Configuration
 *
 * Configuration for stdio-based MCP servers (most common transport type).
 */
const mcpStdioConfigSchema = z.object({
  command: z.string(),
  args: z.array(z.string()),
  env: z.record(z.string(), z.string()).optional(),
});

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
const mcpConfigurationSchema = z.object({
  claudeDesktop: z
    .object({
      mcpServers: z.record(z.string(), mcpTransportConfigSchema),
    })
    .optional(),
  claudeCode: z
    .object({
      mcpServers: z.record(z.string(), mcpTransportConfigSchema),
    })
    .optional(),
  http: mcpHttpConfigSchema.optional(),
  sse: mcpSseConfigSchema.optional(),
});

/**
 * MCP Transport Layer Schema
 *
 * Defines available transport mechanisms for MCP server communication.
 */
const mcpTransportSchema = z.object({
  stdio: mcpStdioConfigSchema.optional(),
  http: mcpHttpConfigSchema.optional(),
  sse: mcpSseConfigSchema.optional(),
});

/**
 * MCP Capabilities Schema
 *
 * Defines what capabilities an MCP server supports.
 */
const mcpCapabilitiesSchema = z.object({
  resources: z.boolean().optional(),
  tools: z.boolean().optional(),
  prompts: z.boolean().optional(),
  logging: z.boolean().optional(),
});

/**
 * MCP Server Info Schema
 *
 * Server identification and version information.
 */
const mcpServerInfoSchema = z.object({
  name: nonEmptyString,
  version: nonEmptyString,
  protocol_version: z.string().optional(),
});

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
export const mcpContentSchema = z.object({
  // Inherit all base content metadata fields using shape destructuring (Zod v4 best practice)
  ...baseContentMetadataSchema.shape,

  // MCP-specific required fields
  category: z.literal('mcp'),
  configuration: mcpConfigurationSchema,

  // MCP-specific optional fields
  package: z.string().max(200).nullable().optional(),
  installation: baseInstallationSchema.optional(),
  security: limitedMediumStringArray.optional(),
  troubleshooting: z.array(baseTroubleshootingSchema).max(20).optional(), // Changed from string array to object array for consistency
  examples: examplesArray.optional(),

  // Authentication and permissions
  requiresAuth: z.boolean().optional(),
  authType: z.enum(['api_key', 'oauth', 'connection_string', 'basic_auth']).optional(),
  permissions: z.array(shortString).max(20).optional(),
  configLocation: mediumString.optional(),

  // MCP protocol specific
  mcpVersion: z.string().optional(),
  serverType: z.enum(['stdio', 'http', 'sse']).optional(),

  // Data and capability descriptions
  dataTypes: limitedMediumStringArray.optional(),
  toolsProvided: limitedMediumStringArray.optional(),
  resourcesProvided: limitedMediumStringArray.optional(),

  // Advanced MCP configurations
  transport: mcpTransportSchema.optional(),
  capabilities: mcpCapabilitiesSchema.optional(),
  serverInfo: mcpServerInfoSchema.optional(),
});

export type McpContent = z.infer<typeof mcpContentSchema>;
