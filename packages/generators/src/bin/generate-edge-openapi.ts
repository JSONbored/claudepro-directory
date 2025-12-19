#!/usr/bin/env node

/**
 * CLI shim for generate-edge-openapi command
 */

import { generateEdgeOpenApi } from '../commands/generate-edge-openapi.ts';

generateEdgeOpenApi().catch((error) => {
  console.error(error);
  process.exit(1);
});
