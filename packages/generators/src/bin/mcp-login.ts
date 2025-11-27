#!/usr/bin/env node
import { mcpLogin } from '../commands/mcp-login.js';
import { logger } from '../toolkit/logger.ts';

mcpLogin().catch((err: unknown) => {
  const errorObj = err instanceof Error ? err : new Error(String(err));
  logger.error('MCP login error', errorObj);
  process.exit(1);
});
