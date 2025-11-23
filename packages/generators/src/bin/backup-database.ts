#!/usr/bin/env node

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
      error instanceof Error ? error : new Error(String(error)),
      {
        script: 'backup-database',
      }
    );
    process.exit(1);
  });
