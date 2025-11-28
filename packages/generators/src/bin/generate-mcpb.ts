#!/usr/bin/env node

import { runGenerateMcpbPackages } from '../commands/generate-mcpb-packages.js';
import { logger } from '../toolkit/logger.js';

runGenerateMcpbPackages().catch((error: unknown) => {
  logger.error(
    '💥 MCPB package generation failed',
    error instanceof Error ? error : new Error(String(error)),
    {
      script: 'generate-mcpb',
    }
  );
  process.exit(1);
});
