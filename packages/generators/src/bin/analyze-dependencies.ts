#!/usr/bin/env tsx

import { runAnalyzeDependencies } from '../commands/analyze-dependencies.js';

runAnalyzeDependencies().catch((error) => {
  console.error('Analysis failed:', error);
  process.exit(1);
});
