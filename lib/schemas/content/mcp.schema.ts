/**
 * MCP Server Content Schema
 * Based on actual MCP JSON files structure and MCP template
 */

import { z } from 'zod';
import {
  examplesArray,
  largeContentArray,
  limitedMediumStringArray,
  mediumStringArray,
  requiredTagArray,
} from '@/lib/schemas/primitives/base-arrays';
import {
  codeString,
  isoDateString,
  mediumString,
  nonEmptyString,
  optionalUrlString,
  shortString,
  urlString,
} from '@/lib/schemas/primitives/base-strings';

// MCP transport configurations - flexible for different transport types
const mcpTransportConfigSchema = z.object({
  command: mediumString.optional(), // For stdio transport
  args: z.array(z.string().max(200)).optional(), // For stdio transport
  env: z.record(z.string(), codeString).optional(),
  transport: shortString.optional(), // For SSE/HTTP transport
  url: z.string().url().max(2048).optional(), // For SSE/HTTP transport
});

const mcpHttpConfigSchema = z.object({
  type: z.literal('http'),
  url: urlString,
  headers: z.record(z.string(), z.string()).optional(),
});

const mcpSseConfigSchema = z.object({
  type: z.literal('sse'),
  url: urlString,
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
      steps: mediumStringArray,
      configPath: z.record(z.string(), mediumString).optional(),
    })
    .optional(),
  claudeCode: codeString.optional(), // Actually a string command, not an object
  requirements: mediumStringArray.optional(),
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
  name: nonEmptyString,
  version: nonEmptyString,
  protocol_version: z.string().optional(),
});

/**
 * MCP server content schema - matches actual production MCP JSON structure
 */
export const mcpContentSchema = z.object({
  // Required base properties (always present in MCP servers)
  slug: nonEmptyString,
  description: nonEmptyString,
  category: z.literal('mcp'),
  author: nonEmptyString,
  dateAdded: isoDateString,

  // Required MCP-specific properties
  tags: requiredTagArray,
  content: nonEmptyString, // Long MCP server description

  // Configuration (either simple or complex MCP config)
  configuration: mcpConfigurationSchema,

  // Optional properties (can be undefined)
  features: largeContentArray.optional(),
  useCases: largeContentArray.optional(),
  package: z.string().max(200).nullable().optional(),
  source: z.enum(['community', 'official', 'verified', 'claudepro']).optional(),

  // Installation instructions
  installation: mcpInstallationSchema.optional(),

  // Security guidelines
  security: limitedMediumStringArray.optional(),

  // Troubleshooting information - array of strings, not objects
  troubleshooting: limitedMediumStringArray.optional(),

  // Usage examples
  examples: examplesArray.optional(),

  // Authentication and permissions
  requiresAuth: z.boolean().optional(),
  authType: z.enum(['api_key', 'oauth', 'connection_string', 'basic_auth']).optional(),
  permissions: z.array(shortString).max(20).optional(),
  configLocation: mediumString.optional(),

  // Documentation
  documentationUrl: optionalUrlString,

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
