#!/usr/bin/env tsx

import { runConsolidateVariables } from '../commands/consolidate-variables.js';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || args.includes('-d');

runConsolidateVariables(dryRun).catch((error) => {
  console.error('Consolidation failed:', error);
  process.exit(1);
});
