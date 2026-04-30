import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import type { RegistryArtifactLoaders } from "./registry.js";

export function createHeyClaudeMcpServer(
  options?: RegistryArtifactLoaders,
): Server;

export function runStdioServer(
  options?: RegistryArtifactLoaders,
): Promise<void>;
