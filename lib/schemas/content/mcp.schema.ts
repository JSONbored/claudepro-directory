/**
 * MCP Server Content Schema
 * Based on actual MCP JSON files structure and MCP template
 */

import { z } from 'zod';

// MCP transport configurations - flexible for different transport types
const mcpTransportConfigSchema = z.object({
  command: z.string().max(500).optional(), // For stdio transport
  args: z.array(z.string().max(200)).optional(), // For stdio transport
  env: z.record(z.string(), z.string().max(1000)).optional(),
  transport: z.string().max(50).optional(), // For SSE/HTTP transport
  url: z.string().url().max(2048).optional(), // For SSE/HTTP transport
});

const mcpHttpConfigSchema = z.object({
  type: z.literal('http'),
  url: z.string().url(),
  headers: z.record(z.string(), z.string()).optional(),
});

const mcpSseConfigSchema = z.object({
  type: z.literal('sse'),
  url: z.string().url(),
  headers: z.record(z.string(), z.string()).optional(),
});

const mcpStdioConfigSchema = z.object({
  command: z.string(),
  args: z.array(z.string()),
  env: z.record(z.string(), z.string()).optional(),
});

// MCP-specific configuration structure
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

// Installation configuration
const mcpInstallationSchema = z.object({
  claudeDesktop: z
    .object({
      steps: z.array(z.string().max(500)),
      configPath: z.record(z.string(), z.string().max(500)).optional(),
    })
    .optional(),
  claudeCode: z.string().max(1000).optional(), // Actually a string command, not an object
  requirements: z.array(z.string().max(500)).optional(),
});

// Transport layer configuration
const mcpTransportSchema = z.object({
  stdio: mcpStdioConfigSchema.optional(),
  http: mcpHttpConfigSchema.optional(),
  sse: mcpSseConfigSchema.optional(),
});

// MCP capabilities
const mcpCapabilitiesSchema = z.object({
  resources: z.boolean().optional(),
  tools: z.boolean().optional(),
  prompts: z.boolean().optional(),
  logging: z.boolean().optional(),
});

// Server info
const mcpServerInfoSchema = z.object({
  name: z.string(),
  version: z.string(),
  protocol_version: z.string().optional(),
});

/**
 * MCP server content schema - matches actual production MCP JSON structure
 */
export const mcpContentSchema = z.object({
  // Required base properties (always present in MCP servers)
  slug: z.string().min(1),
  description: z.string().min(1),
  category: z.literal('mcp'),
  author: z.string().min(1),
  dateAdded: z.string(), // ISO date string

  // Required MCP-specific properties
  tags: z.array(z.string()).min(1),
  content: z.string().min(1), // Long MCP server description

  // Configuration (either simple or complex MCP config)
  configuration: mcpConfigurationSchema,

  // Optional properties (can be undefined)
  features: z.array(z.string().max(500)).max(50).optional(),
  useCases: z.array(z.string().max(500)).max(50).optional(),
  package: z.string().max(200).nullable().optional(),
  source: z.enum(['community', 'official', 'verified', 'claudepro']).optional(),

  // Installation instructions
  installation: mcpInstallationSchema.optional(),

  // Security guidelines
  security: z.array(z.string().max(500)).max(20).optional(),

  // Troubleshooting information - array of strings, not objects
  troubleshooting: z.array(z.string().max(500)).max(20).optional(),

  // Usage examples
  examples: z.array(z.string().max(1000)).max(10).optional(),

  // Authentication and permissions
  requiresAuth: z.boolean().optional(),
  authType: z.enum(['api_key', 'oauth', 'connection_string', 'basic_auth']).optional(),
  permissions: z.array(z.string().max(100)).max(20).optional(),
  configLocation: z.string().max(500).optional(),

  // Documentation
  documentationUrl: z.string().url().optional(),

  // MCP protocol specific
  mcpVersion: z.string().optional(),
  serverType: z.enum(['stdio', 'http', 'sse']).optional(),

  // Data and capability descriptions
  dataTypes: z.array(z.string().max(500)).max(20).optional(),
  toolsProvided: z.array(z.string().max(500)).max(20).optional(),
  resourcesProvided: z.array(z.string().max(500)).max(20).optional(),

  // Advanced MCP configurations
  transport: mcpTransportSchema.optional(),
  capabilities: mcpCapabilitiesSchema.optional(),
  serverInfo: mcpServerInfoSchema.optional(),
});

export type McpContent = z.infer<typeof mcpContentSchema>;
