#!/usr/bin/env node
import { verifyRoutes } from '../commands/verify-routes.js';
import { logger } from '../toolkit/logger.js';

verifyRoutes().catch((err: unknown) => {
  const errorObj = err instanceof Error ? err : new Error(String(err));
  logger.error('Verify routes error', errorObj);
  process.exit(1);
});
