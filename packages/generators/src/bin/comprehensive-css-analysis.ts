#!/usr/bin/env tsx

import { runComprehensiveAnalysis } from '../commands/comprehensive-css-analysis.js';

runComprehensiveAnalysis().catch((error) => {
  console.error('Analysis failed:', error);
  process.exit(1);
});
