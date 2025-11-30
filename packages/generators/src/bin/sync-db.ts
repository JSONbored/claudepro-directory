#!/usr/bin/env tsx
import { normalizeError } from '@heyclaude/shared-runtime';
import { runSyncDb } from '../commands/sync-db.js';
import { logger } from '../toolkit/logger.js';

runSyncDb().catch((error) => {
  logger.error('Sync DB error', normalizeError(error, 'Sync DB error'));
  process.exit(1);
});
