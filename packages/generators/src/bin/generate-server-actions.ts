#!/usr/bin/env tsx
import { runGenerateServerActions } from '../commands/generate-server-actions.ts';
import { logger } from '../toolkit/logger.ts';

const args = process.argv.slice(2);
const targetAction = args[0];

runGenerateServerActions(targetAction).catch((error) => {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  logger.error('Generate server actions error', errorObj, { targetAction });
  process.exit(1);
});
