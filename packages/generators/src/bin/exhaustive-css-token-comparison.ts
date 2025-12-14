#!/usr/bin/env tsx

import { runExhaustiveComparison } from '../commands/exhaustive-css-token-comparison.js';

runExhaustiveComparison().catch((error) => {
  console.error('Comparison failed:', error);
  process.exit(1);
});
