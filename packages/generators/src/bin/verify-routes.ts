#!/usr/bin/env node
import { verifyRoutes } from '../commands/verify-routes.js';

verifyRoutes().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
