#!/usr/bin/env node
/**
 * CLI Entry Point for Self-Hosted MCP Server
 *
 * Provides a command-line interface for running the MCP server locally.
 *
 * Usage:
 * ```bash
 * npx @heyclaude/mcp-server start --port 3000
 * ```
 */

import { createNodeServer, type NodeServerConfig } from './server/node-server.js';
import type { ApiProxyConfig } from './adapters/api-proxy.js';

/**
 * CLI command options
 */
interface CliOptions {
  /**
   * Server port
   */
  port?: number;

  /**
   * API base URL
   */
  apiBaseUrl?: string;

  /**
   * API key (optional)
   */
  apiKey?: string;
}

/**
 * Parse command line arguments
 *
 * @param args - Command line arguments
 * @returns Parsed options
 */
function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    if (arg === '--port' && nextArg) {
      options.port = parseInt(nextArg, 10);
      i++;
    } else if (arg === '--api-base-url' && nextArg) {
      options.apiBaseUrl = nextArg;
      i++;
    } else if (arg === '--api-key' && nextArg) {
      options.apiKey = nextArg;
      i++;
    }
  }

  return options;
}

/**
 * Main CLI function
 */
export async function cli(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'start') {
    const options = parseArgs(args.slice(1));

    const apiProxyConfig: ApiProxyConfig = {
      apiBaseUrl: options.apiBaseUrl || 'https://claudepro.directory',
    };
    if (options.apiKey) {
      apiProxyConfig.apiKey = options.apiKey;
    }

    const config: NodeServerConfig = {
      port: options.port || 3000,
      apiProxy: apiProxyConfig,
      logger: {
        info: (message: string, meta?: Record<string, unknown>) => {
          console.log(`[INFO] ${message}`, meta ? JSON.stringify(meta) : '');
        },
        error: (message: string, error?: Error | unknown, meta?: Record<string, unknown>) => {
          console.error(`[ERROR] ${message}`, error, meta ? JSON.stringify(meta) : '');
        },
        warn: (message: string, meta?: Record<string, unknown>) => {
          console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta) : '');
        },
        debug: (message: string, meta?: Record<string, unknown>) => {
          console.debug(`[DEBUG] ${message}`, meta ? JSON.stringify(meta) : '');
        },
        child: (meta: Record<string, unknown>) => {
          return {
            info: (msg: string, m?: Record<string, unknown>) => {
              console.log(`[INFO] ${msg}`, { ...meta, ...m });
            },
            error: (msg: string, err?: Error | unknown, m?: Record<string, unknown>) => {
              console.error(`[ERROR] ${msg}`, err, { ...meta, ...m });
            },
            warn: (msg: string, m?: Record<string, unknown>) => {
              console.warn(`[WARN] ${msg}`, { ...meta, ...m });
            },
            debug: (msg: string, m?: Record<string, unknown>) => {
              console.debug(`[DEBUG] ${msg}`, { ...meta, ...m });
            },
            child: (m: Record<string, unknown>) => {
              return {
                info: (msg: string, meta?: Record<string, unknown>) => {
                  console.log(`[INFO] ${msg}`, { ...meta, ...m, ...meta });
                },
                error: (msg: string, err?: Error | unknown, meta?: Record<string, unknown>) => {
                  console.error(`[ERROR] ${msg}`, err, { ...meta, ...m, ...meta });
                },
                warn: (msg: string, meta?: Record<string, unknown>) => {
                  console.warn(`[WARN] ${msg}`, { ...meta, ...m, ...meta });
                },
                debug: (msg: string, meta?: Record<string, unknown>) => {
                  console.debug(`[DEBUG] ${msg}`, { ...meta, ...m, ...meta });
                },
                child: () => {
                  throw new Error('Nested child loggers not supported in CLI');
                },
              };
            },
          };
        },
      },
    };

    const server = createNodeServer(config);

    server.listen(() => {
      console.log(`✅ MCP server running on http://localhost:${config.port}`);
      console.log(`📡 Proxying to: ${config.apiProxy?.apiBaseUrl || 'https://claudepro.directory'}`);
      console.log(`\nConfigure in mcp.json:`);
      console.log(`{
  "mcpServers": {
    "heyclaude": {
      "command": "npx",
      "args": ["-y", "@heyclaude/mcp-server@latest", "start", "--port", "${config.port}"]
    }
  }
}`);
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down MCP server...');
      server.close(() => {
        process.exit(0);
      });
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Shutting down MCP server...');
      server.close(() => {
        process.exit(0);
      });
    });
  } else if (command === 'help' || command === '--help' || command === '-h') {
    console.log(`
HeyClaude MCP Server CLI

Usage:
  npx @heyclaude/mcp-server <command> [options]

Commands:
  start    Start the MCP server
  help      Show this help message

Options:
  --port <number>        Server port (default: 3000)
  --api-base-url <url>   API base URL (default: https://claudepro.directory)
  --api-key <key>        Optional API key for authentication

Examples:
  npx @heyclaude/mcp-server start
  npx @heyclaude/mcp-server start --port 3000
  npx @heyclaude/mcp-server start --api-base-url https://claudepro.directory
`);
  } else {
    console.error(`Unknown command: ${command}`);
    console.error('Run "npx @heyclaude/mcp-server help" for usage information');
    process.exit(1);
  }
}

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cli().catch((error) => {
    console.error('CLI error:', error);
    process.exit(1);
  });
}

