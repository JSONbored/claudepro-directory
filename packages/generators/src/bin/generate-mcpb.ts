#!/usr/bin/env node

import { runGenerateMcpbPackages } from '../commands/generate-mcpb.js';
import { logger } from '../toolkit/logger.js';

runGenerateMcpbPackages().catch((error) => {
  logger.error(
    '💥 MCPB package generation failed',
    error instanceof Error ? error : new Error(String(error)),
    {
      script: 'generate-mcpb',
    }
  );
  process.exit(1);
});
