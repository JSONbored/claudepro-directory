#!/usr/bin/env node
import { runGenerateServices } from '../commands/generate-services.js';
import { logger } from '../toolkit/logger.js';

const args = process.argv.slice(2);
const target = args[0];

runGenerateServices(target).catch((error) => {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  logger.error('Generate services error', errorObj, { target });
  process.exit(1);
});
