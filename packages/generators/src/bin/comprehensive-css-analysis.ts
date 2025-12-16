#!/usr/bin/env tsx

import { runComprehensiveAnalysis } from '../commands/comprehensive-css-analysis.ts';

runComprehensiveAnalysis().catch((error) => {
  console.error('Analysis failed:', error);
  process.exit(1);
});
