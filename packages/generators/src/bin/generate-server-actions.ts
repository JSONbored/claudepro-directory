#!/usr/bin/env node
import { runGenerateServerActions } from '../commands/generate-server-actions.js';
import { logger } from '../toolkit/logger.js';

const args = process.argv.slice(2);
const targetAction = args[0];

runGenerateServerActions(targetAction).catch((err) => {
  const errorObj = err instanceof Error ? err : new Error(String(err));
  logger.error('Generate server actions error', errorObj, { targetAction });
  process.exit(1);
});
