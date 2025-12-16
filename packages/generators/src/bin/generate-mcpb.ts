#!/usr/bin/env tsx

import { normalizeError } from '@heyclaude/shared-runtime';

import { runGenerateMcpbPackages } from '../commands/generate-mcpb-packages.ts';
import { logger } from '../toolkit/logger.ts';

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
