#!/usr/bin/env node

import { normalizeError } from '@heyclaude/shared-runtime';

import { runGenerateMcpbPackages } from '../commands/generate-mcpb-packages.js';
import { logger } from '../toolkit/logger.js';

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
