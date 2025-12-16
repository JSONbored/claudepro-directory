#!/usr/bin/env tsx
/**
 * UI_CLASSES Migration CLI Entry Point
 */

import { migrateUIClasses } from '../commands/migrate-ui-classes.ts';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || args.includes('-d');

migrateUIClasses(dryRun).catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
