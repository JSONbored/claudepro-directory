#!/usr/bin/env tsx
import { mcpLogin } from '../commands/mcp-login.js';
import { logger } from '../toolkit/logger.js';

mcpLogin().catch((error: unknown) => {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  logger.error('MCP login error', errorObj);
  process.exit(1);
});
