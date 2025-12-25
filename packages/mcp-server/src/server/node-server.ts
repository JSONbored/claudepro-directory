/**
 * Node.js HTTP Server for Self-Hosted MCP Server
 *
 * Provides a Node.js HTTP server implementation that can run the MCP server
 * locally. Uses the API proxy adapter to connect to existing API routes,
 * eliminating the need for local database configuration.
 *
 * Usage:
 * ```typescript
 * import { createNodeServer } from '@heyclaude/mcp-server/server';
 *
 * const server = createNodeServer({
 *   port: 3000,
 *   apiBaseUrl: 'https://claudepro.directory',
 * });
 *
 * server.listen(() => {
 *   console.log('MCP server running on http://localhost:3000');
 * });
 * ```
 */

import { createServer, type Server } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { executeToolViaApi, type ApiProxyConfig } from '../adapters/api-proxy.js';
import { handleHealth } from '../routes/health.js';
import type { RuntimeLogger, RuntimeEnv } from '../types/runtime.js';

/**
 * Node.js server configuration
 */
export interface NodeServerConfig {
  /**
   * Server port (default: 3000)
   */
  port?: number;

  /**
   * API proxy configuration
   */
  apiProxy?: ApiProxyConfig;

  /**
   * Logger instance (optional)
   */
  logger?: RuntimeLogger;

  /**
   * Runtime environment (optional, for compatibility)
   */
  env?: RuntimeEnv;
}

/**
 * Node.js server instance
 */
export interface NodeServer {
  /**
   * Start the server
   *
   * @param callback - Callback when server starts listening
   */
  listen(callback?: () => void): void;

  /**
   * Stop the server
   *
   * @param callback - Callback when server stops
   */
  close(callback?: () => void): void;

  /**
   * Get the underlying HTTP server
   */
  getServer(): Server;
}

/**
 * Create a Node.js HTTP server for the MCP server
 *
 * @param config - Server configuration
 * @returns Node.js server instance
 */
export function createNodeServer(config: NodeServerConfig = {}): NodeServer {
  const { port = 3000, apiProxy = {}, logger } = config;

  // Create HTTP server
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    try {
      // Handle CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, Mcp-Session-Id, MCP-Protocol-Version'
      );

      // Handle OPTIONS (CORS preflight)
      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      const url = new URL(req.url || '/', `http://${req.headers.host}`);

      // Health check endpoint
      if (url.pathname === '/' && req.method === 'GET') {
        const healthResponse = await handleHealth({ prisma: undefined });
        const healthData = await healthResponse.json();
        res.writeHead(healthResponse.status, {
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify(healthData));
        return;
      }

      // MCP protocol endpoint
      if (url.pathname === '/mcp' && req.method === 'POST') {
        // Read request body
        const body = await new Promise<string>((resolve, reject) => {
          let data = '';
          req.on('data', (chunk) => {
            data += chunk.toString();
          });
          req.on('end', () => {
            resolve(data);
          });
          req.on('error', reject);
        });

        // Parse JSON-RPC request
        const jsonRpcRequest = JSON.parse(body);

        // Extract tool name and input
        const { method: toolName, params } = jsonRpcRequest;

        // Execute tool via API proxy
        try {
          const result = await executeToolViaApi(toolName, params, apiProxy);

          // Return JSON-RPC response
          const jsonRpcResponse = {
            jsonrpc: '2.0',
            id: jsonRpcRequest.id,
            result,
          };

          res.writeHead(200, {
            'Content-Type': 'application/json',
          });
          res.end(JSON.stringify(jsonRpcResponse));
        } catch (error) {
          // Return JSON-RPC error
          const jsonRpcError = {
            jsonrpc: '2.0',
            id: jsonRpcRequest.id,
            error: {
              code: -32000,
              message: error instanceof Error ? error.message : 'Unknown error',
            },
          };

          res.writeHead(200, {
            'Content-Type': 'application/json',
          });
          res.end(JSON.stringify(jsonRpcError));
        }
        return;
      }

      // 404 for unknown routes
      res.writeHead(404, {
        'Content-Type': 'application/json',
      });
      res.end(JSON.stringify({ error: 'Not Found' }));
    } catch (error) {
      logger?.error('Node server error', error instanceof Error ? error : new Error(String(error)));

      res.writeHead(500, {
        'Content-Type': 'application/json',
      });
      res.end(
        JSON.stringify({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      );
    }
  });

  return {
    listen(callback?: () => void) {
      server.listen(port, () => {
        logger?.info('MCP server listening', { port });
        callback?.();
      });
    },
    close(callback?: () => void) {
      server.close(() => {
        logger?.info('MCP server stopped');
        callback?.();
      });
    },
    getServer() {
      return server;
    },
  };
}
