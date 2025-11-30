#!/usr/bin/env tsx

import { normalizeError } from '@heyclaude/shared-runtime';

import { runBackupDatabase } from '../commands/backup-database.js';
import { logger } from '../toolkit/logger.js';

const force = process.argv.includes('--force');

runBackupDatabase({ force })
  .then(() => {
    logger.info('✅ Database backup complete', {
      script: 'backup-database',
    });
    process.exit(0);
  })
  .catch((error) => {
    logger.error(
      '💥 Database backup failed',
      normalizeError(error, 'Database backup failed'),
      {
        script: 'backup-database',
      }
    );
    process.exit(1);
  });
