#!/usr/bin/env tsx
/**
 * CLI entry point for apply-variable-consolidation command
 */

import { applyVariableConsolidation } from '../commands/apply-variable-consolidation.ts';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || args.includes('-d');

applyVariableConsolidation(dryRun).catch((error) => {
  console.error('Consolidation failed:', error);
  process.exit(1);
});
