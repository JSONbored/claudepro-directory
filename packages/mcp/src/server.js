import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { callRegistryTool, TOOL_DEFINITIONS } from "./registry.js";

export function createHeyClaudeMcpServer(options = {}) {
  const server = new Server(
    {
      name: "heyclaude-registry",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOL_DEFINITIONS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const result = await callRegistryTool(
      request.params.name,
      request.params.arguments || {},
      options,
    );
    return {
      isError: result.ok === false,
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  });

  return server;
}

export async function runStdioServer(options = {}) {
  const server = createHeyClaudeMcpServer(options);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
