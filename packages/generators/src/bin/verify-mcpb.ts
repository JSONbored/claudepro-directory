#!/usr/bin/env node

import { runVerifyMcpbPackages } from '../commands/verify-mcpb-packages.js';
import { logger } from '../toolkit/logger.js';

runVerifyMcpbPackages()
  .then((result: unknown) => {
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
  .catch((error: unknown) => {
    logger.error(
      '💥 MCPB verification failed',
      error instanceof Error ? error : new Error(String(error)),
      {
        script: 'verify-mcpb',
      }
    );
    process.exit(1);
  });
