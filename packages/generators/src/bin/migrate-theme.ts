#!/usr/bin/env tsx

import { runMigrateTheme } from '../commands/migrate-theme.js';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || args.includes('-d');

runMigrateTheme(dryRun).catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
