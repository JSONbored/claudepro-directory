#!/usr/bin/env node
import { runGenerateZodSchemas } from '../commands/generate-zod-schemas.js';

const args = process.argv.slice(2);
// Simple arg parsing
// Usage: heyclaude-generate-zod table1 table2 ...
const targetTables = args.length > 0 ? args : undefined;

runGenerateZodSchemas(targetTables).catch((err) => {
  console.error(err);
  process.exit(1);
});
