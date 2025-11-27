#!/usr/bin/env node
import { runGenerateEdgeRoutes } from '../commands/generate-edge-routes.js';
import { logger } from '../toolkit/logger.ts';

runGenerateEdgeRoutes().catch((err) => {
  const errorObj = err instanceof Error ? err : new Error(String(err));
  logger.error('Generate edge routes error', errorObj);
  process.exit(1);
});
