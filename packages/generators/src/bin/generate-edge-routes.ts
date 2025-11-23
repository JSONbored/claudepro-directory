#!/usr/bin/env node
import { runGenerateEdgeRoutes } from '../commands/generate-edge-routes.js';

runGenerateEdgeRoutes().catch((err) => {
  console.error(err);
  process.exit(1);
});
