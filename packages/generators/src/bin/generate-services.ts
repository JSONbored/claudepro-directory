#!/usr/bin/env node
import { runGenerateServices } from '../commands/generate-services.js';
import { logger } from '../toolkit/logger.ts';

const args = process.argv.slice(2);
const target = args[0];

runGenerateServices(target).catch((err) => {
  const errorObj = err instanceof Error ? err : new Error(String(err));
  logger.error('Generate services error', errorObj, { target });
  process.exit(1);
});
