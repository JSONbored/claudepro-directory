#!/usr/bin/env tsx
import { migrateInlineStyles } from '../commands/migrate-inline-styles.js';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || args.includes('-d');

// Parse --phase=N argument
let phase: number | undefined;
const phaseArg = args.find(arg => arg.startsWith('--phase='));
if (phaseArg) {
  const phaseValue = phaseArg.split('=')[1];
  const phaseNum = parseInt(phaseValue, 10);
  if (isNaN(phaseNum) || phaseNum < 1 || phaseNum > 5) {
    console.error(`Invalid phase: ${phaseValue}. Must be 1-5.`);
    process.exit(1);
  }
  phase = phaseNum;
}

migrateInlineStyles(dryRun, phase).catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
