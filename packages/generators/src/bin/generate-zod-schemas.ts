#!/usr/bin/env tsx
import { runGenerateZodSchemas } from '../commands/generate-zod-schemas.js';
import { logger } from '../toolkit/logger.js';

const args = process.argv.slice(2);
// Simple arg parsing
// Usage: heyclaude-generate-zod table1 table2 ...
const targetTables = args.length > 0 ? args : undefined;

runGenerateZodSchemas(targetTables).catch((error) => {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  logger.error('Generate Zod schemas error', errorObj, { targetTables });
  process.exit(1);
});
