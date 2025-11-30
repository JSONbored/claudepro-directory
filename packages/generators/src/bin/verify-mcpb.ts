#!/usr/bin/env tsx

import { normalizeError } from '@heyclaude/shared-runtime';

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
      normalizeError(error, 'MCPB verification failed'),
      {
        script: 'verify-mcpb',
      }
    );
    process.exit(1);
  });
