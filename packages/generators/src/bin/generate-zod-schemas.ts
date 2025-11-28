#!/usr/bin/env node
import { runGenerateZodSchemas } from '../commands/generate-zod-schemas.js';
import { logger } from '../toolkit/logger.js';

const args = process.argv.slice(2);
// Simple arg parsing
// Usage: heyclaude-generate-zod table1 table2 ...
const targetTables = args.length > 0 ? args : undefined;

runGenerateZodSchemas(targetTables).catch((err) => {
  const errorObj = err instanceof Error ? err : new Error(String(err));
  logger.error('Generate Zod schemas error', errorObj, { targetTables });
  process.exit(1);
});
