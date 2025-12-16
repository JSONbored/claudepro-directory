#!/usr/bin/env tsx
import { normalizeError } from '@heyclaude/shared-runtime';
import { runSyncDb } from '../commands/sync-db.ts';
import { logger } from '../toolkit/logger.ts';

runSyncDb().catch((error) => {
  logger.error('Sync DB error', normalizeError(error, 'Sync DB error'));
  process.exit(1);
});
