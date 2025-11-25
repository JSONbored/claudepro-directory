#!/usr/bin/env node
import { mcpLogin } from '../commands/mcp-login.js';

mcpLogin().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
