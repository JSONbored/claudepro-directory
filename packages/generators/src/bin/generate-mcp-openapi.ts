#!/usr/bin/env tsx

/**
 * MCP OpenAPI Generator CLI
 *
 * Generates OpenAPI 3.1 specification for the MCP server.
 */

import { generateMcpOpenAPI } from '../commands/generate-mcp-openapi.ts';

generateMcpOpenAPI()
  .then(() => {
    console.log('✅ MCP OpenAPI spec generation complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 MCP OpenAPI generation failed:', error);
    process.exit(1);
  });
