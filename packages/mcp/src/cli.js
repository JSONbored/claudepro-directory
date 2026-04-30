#!/usr/bin/env node
import { runStdioServer } from "./server.js";

runStdioServer().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
