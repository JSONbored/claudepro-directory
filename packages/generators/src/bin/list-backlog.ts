#!/usr/bin/env tsx
import { runListBacklog } from '../commands/list-backlog.js';
import { logger } from '../toolkit/logger.js';

runListBacklog()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Failed to list webhook backlog', error, { script: 'webhooks:list' });
    process.exit(1);
  });
