#!/usr/bin/env node

import { runGenerateMcpbPackages } from '../commands/generate-mcpb-packages.js';
import { logger } from '../toolkit/logger.js';
import { normalizeError } from '@heyclaude/shared-runtime';

runGenerateMcpbPackages().catch((error: unknown) => {
  logger.error(
    '💥 MCPB package generation failed',
    normalizeError(error, 'MCPB package generation failed'),
    {
      script: 'generate-mcpb',
    }
  );
  process.exit(1);
});
