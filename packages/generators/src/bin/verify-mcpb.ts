#!/usr/bin/env node

import { runVerifyMcpbPackages } from '../commands/verify-mcpb.js';
import { logger } from '../toolkit/logger.js';

runVerifyMcpbPackages()
  .then((result) => {
    if (result) {
      logger.info('✅ MCPB verification passed', {
        script: 'verify-mcpb',
      });
      process.exit(0);
    } else {
      logger.error('💥 MCPB verification failed', undefined, {
        script: 'verify-mcpb',
      });
      process.exit(1);
    }
  })
  .catch((error) => {
    logger.error(
      '💥 MCPB verification failed',
      error instanceof Error ? error : new Error(String(error)),
      {
        script: 'verify-mcpb',
      }
    );
    process.exit(1);
  });
