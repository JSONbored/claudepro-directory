#!/usr/bin/env tsx
import { runGenerateEdgeRoutes } from '../commands/generate-edge-routes.js';
import { logger } from '../toolkit/logger.js';

runGenerateEdgeRoutes().catch((error) => {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  logger.error('Generate edge routes error', errorObj);
  process.exit(1);
});
