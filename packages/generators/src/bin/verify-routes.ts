#!/usr/bin/env node
import { normalizeError } from '@heyclaude/shared-runtime';

import { verifyRoutes } from '../commands/verify-routes.js';
import { logger } from '../toolkit/logger.js';

try {
  verifyRoutes();
} catch (error) {
  logger.error('Verify routes error', normalizeError(error, 'Verify routes failed'), { command: 'verify-routes' });
  process.exit(1);
}
