/**
 * Tests for Node.js HTTP Server
 *
 * Tests the Node.js HTTP server implementation for self-hosted MCP server.
 * Includes server creation, health endpoint, MCP protocol endpoint, CORS handling, and error handling.
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { createNodeServer, type NodeServerConfig } from './node-server.js';
import { handleHealth } from '../routes/health.js';
import { executeToolViaApi } from '../adapters/api-proxy.js';
import { createMockLogger } from '../__tests__/test-utils.ts';
import type { Server } from 'node:http';
import { request } from 'node:http';

// Mock the routes and adapters
jest.mock('../routes/health.js', () => ({
  handleHealth: jest.fn(),
}));

jest.mock('../adapters/api-proxy.js', () => ({
  executeToolViaApi: jest.fn(),
}));

describe('Node.js HTTP Server', () => {
  let mockLogger: ReturnType<typeof createMockLogger>;
  let server: ReturnType<typeof createNodeServer>;
  let httpServer: Server;
  let testPort: number;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();

    mockLogger = createMockLogger();
    testPort = 0; // Use 0 to get a random available port

    // Reset mocks
    (handleHealth as jest.Mock).mockResolvedValue(
      new Response(JSON.stringify({ status: 'ok' }), { status: 200 })
    );
    (executeToolViaApi as jest.Mock).mockResolvedValue({ result: 'test' });
  });

  afterEach(() => {
    if (server) {
      return new Promise<void>((resolve) => {
        server.close(() => {
          resolve();
        });
      });
    }
  });

  describe('Unit Tests', () => {
    describe('Server Creation', () => {
      it('should create server with default port', () => {
        server = createNodeServer();

        expect(server).toBeDefined();
        expect(typeof server.listen).toBe('function');
        expect(typeof server.close).toBe('function');
        expect(typeof server.getServer).toBe('function');
      });

      it('should create server with custom port', () => {
        server = createNodeServer({ port: 8080 });

        expect(server).toBeDefined();
        httpServer = server.getServer();
        expect(httpServer).toBeDefined();
      });

      it('should create server with logger', () => {
        server = createNodeServer({ logger: mockLogger });

        expect(server).toBeDefined();
        expect(mockLogger.info).not.toHaveBeenCalled(); // Not called until listen
      });

      it('should create server with API proxy config', () => {
        const config: NodeServerConfig = {
          apiProxy: {
            apiBaseUrl: 'https://custom.api.com',
            apiKey: 'test-key',
          },
        };

        server = createNodeServer(config);

        expect(server).toBeDefined();
      });
    });

    describe('Server Methods', () => {
      it('should provide listen method', () => {
        server = createNodeServer();

        expect(typeof server.listen).toBe('function');
      });

      it('should provide close method', () => {
        server = createNodeServer();

        expect(typeof server.close).toBe('function');
      });

      it('should provide getServer method', () => {
        server = createNodeServer();

        httpServer = server.getServer();
        expect(httpServer).toBeDefined();
        expect(httpServer).toBeInstanceOf(Server);
      });
    });

    describe('CORS Handling', () => {
      it('should set CORS headers for all requests', async () => {
        server = createNodeServer({ port: 0 });
        httpServer = server.getServer();

        await new Promise<void>((resolve) => {
          server.listen(() => {
            const port = (httpServer.address() as { port: number })?.port;
            const req = request(
              {
                hostname: 'localhost',
                port,
                path: '/',
                method: 'GET',
              },
              (res) => {
                expect(res.headers['access-control-allow-origin']).toBe('*');
                expect(res.headers['access-control-allow-methods']).toBe('GET, POST, OPTIONS');
                expect(res.headers['access-control-allow-headers']).toContain('Content-Type');
                resolve();
              }
            );
            req.end();
          });
        });
      });

      it('should handle OPTIONS preflight request', async () => {
        server = createNodeServer({ port: 0 });
        httpServer = server.getServer();

        await new Promise<void>((resolve) => {
          server.listen(() => {
            const port = (httpServer.address() as { port: number })?.port;
            const req = request(
              {
                hostname: 'localhost',
                port,
                path: '/',
                method: 'OPTIONS',
              },
              (res) => {
                expect(res.statusCode).toBe(204);
                expect(res.headers['access-control-allow-origin']).toBe('*');
                resolve();
              }
            );
            req.end();
          });
        });
      });
    });

    describe('Health Endpoint', () => {
      it('should handle GET / health check', async () => {
        server = createNodeServer({ port: 0 });
        httpServer = server.getServer();

        (handleHealth as jest.Mock).mockResolvedValue(
          new Response(JSON.stringify({ status: 'ok', service: 'heyclaude-mcp' }), { status: 200 })
        );

        await new Promise<void>((resolve) => {
          server.listen(() => {
            const port = (httpServer.address() as { port: number })?.port;
            const req = request(
              {
                hostname: 'localhost',
                port,
                path: '/',
                method: 'GET',
              },
              (res) => {
                expect(res.statusCode).toBe(200);
                expect(handleHealth).toHaveBeenCalled();
                let data = '';
                res.on('data', (chunk) => {
                  data += chunk.toString();
                });
                res.on('end', () => {
                  const json = JSON.parse(data);
                  expect(json.status).toBe('ok');
                  resolve();
                });
              }
            );
            req.end();
          });
        });
      });
    });

    describe('MCP Protocol Endpoint', () => {
      it('should handle POST /mcp with JSON-RPC request', async () => {
        server = createNodeServer({ port: 0 });
        httpServer = server.getServer();

        (executeToolViaApi as jest.Mock).mockResolvedValue({ result: 'test-result' });

        await new Promise<void>((resolve) => {
          server.listen(() => {
            const port = (httpServer.address() as { port: number })?.port;
            const jsonRpcRequest = {
              jsonrpc: '2.0',
              id: 1,
              method: 'testTool',
              params: { key: 'value' },
            };

            const req = request(
              {
                hostname: 'localhost',
                port,
                path: '/mcp',
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
              },
              (res) => {
                expect(res.statusCode).toBe(200);
                expect(executeToolViaApi).toHaveBeenCalledWith('testTool', { key: 'value' }, {});
                let data = '';
                res.on('data', (chunk) => {
                  data += chunk.toString();
                });
                res.on('end', () => {
                  const json = JSON.parse(data);
                  expect(json.jsonrpc).toBe('2.0');
                  expect(json.id).toBe(1);
                  expect(json.result).toEqual({ result: 'test-result' });
                  resolve();
                });
              }
            );
            req.write(JSON.stringify(jsonRpcRequest));
            req.end();
          });
        });
      });

      it('should handle JSON-RPC error response', async () => {
        server = createNodeServer({ port: 0 });
        httpServer = server.getServer();

        (executeToolViaApi as jest.Mock).mockRejectedValue(new Error('Tool execution failed'));

        await new Promise<void>((resolve) => {
          server.listen(() => {
            const port = (httpServer.address() as { port: number })?.port;
            const jsonRpcRequest = {
              jsonrpc: '2.0',
              id: 1,
              method: 'testTool',
              params: {},
            };

            const req = request(
              {
                hostname: 'localhost',
                port,
                path: '/mcp',
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
              },
              (res) => {
                expect(res.statusCode).toBe(200); // JSON-RPC always returns 200
                let data = '';
                res.on('data', (chunk) => {
                  data += chunk.toString();
                });
                res.on('end', () => {
                  const json = JSON.parse(data);
                  expect(json.jsonrpc).toBe('2.0');
                  expect(json.id).toBe(1);
                  expect(json.error).toBeDefined();
                  expect(json.error.code).toBe(-32000);
                  expect(json.error.message).toBe('Tool execution failed');
                  resolve();
                });
              }
            );
            req.write(JSON.stringify(jsonRpcRequest));
            req.end();
          });
        });
      });
    });

    describe('Error Handling', () => {
      it('should return 404 for unknown routes', async () => {
        server = createNodeServer({ port: 0 });
        httpServer = server.getServer();

        await new Promise<void>((resolve) => {
          server.listen(() => {
            const port = (httpServer.address() as { port: number })?.port;
            const req = request(
              {
                hostname: 'localhost',
                port,
                path: '/unknown',
                method: 'GET',
              },
              (res) => {
                expect(res.statusCode).toBe(404);
                let data = '';
                res.on('data', (chunk) => {
                  data += chunk.toString();
                });
                res.on('end', () => {
                  const json = JSON.parse(data);
                  expect(json.error).toBe('Not Found');
                  resolve();
                });
              }
            );
            req.end();
          });
        });
      });

      it('should handle server errors and return 500', async () => {
        server = createNodeServer({ port: 0, logger: mockLogger });
        httpServer = server.getServer();

        // Force an error by making handleHealth throw
        (handleHealth as jest.Mock).mockRejectedValue(new Error('Database error'));

        await new Promise<void>((resolve) => {
          server.listen(() => {
            const port = (httpServer.address() as { port: number })?.port;
            const req = request(
              {
                hostname: 'localhost',
                port,
                path: '/',
                method: 'GET',
              },
              (res) => {
                expect(res.statusCode).toBe(500);
                expect(mockLogger.error).toHaveBeenCalled();
                let data = '';
                res.on('data', (chunk) => {
                  data += chunk.toString();
                });
                res.on('end', () => {
                  const json = JSON.parse(data);
                  expect(json.error).toBe('Internal server error');
                  resolve();
                });
              }
            );
            req.end();
          });
        });
      });
    });

    describe('Server Lifecycle', () => {
      it('should call logger on listen', async () => {
        server = createNodeServer({ port: 0, logger: mockLogger });

        await new Promise<void>((resolve) => {
          server.listen(() => {
            expect(mockLogger.info).toHaveBeenCalledWith(
              'MCP server listening',
              expect.objectContaining({ port: expect.any(Number) })
            );
            resolve();
          });
        });
      });

      it('should call logger on close', async () => {
        server = createNodeServer({ port: 0, logger: mockLogger });

        await new Promise<void>((resolve) => {
          server.listen(() => {
            server.close(() => {
              expect(mockLogger.info).toHaveBeenCalledWith('MCP server stopped');
              resolve();
            });
          });
        });
      });

      it('should call callback on listen', async () => {
        server = createNodeServer({ port: 0 });
        const listenCallback = jest.fn();

        await new Promise<void>((resolve) => {
          server.listen(() => {
            expect(listenCallback).toHaveBeenCalled();
            resolve();
          });
        });
      });

      it('should call callback on close', async () => {
        server = createNodeServer({ port: 0 });
        const closeCallback = jest.fn();

        await new Promise<void>((resolve) => {
          server.listen(() => {
            server.close(() => {
              expect(closeCallback).toHaveBeenCalled();
              resolve();
            });
          });
        });
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle full request flow', async () => {
      server = createNodeServer({ port: 0, logger: mockLogger });
      httpServer = server.getServer();

      (handleHealth as jest.Mock).mockResolvedValue(
        new Response(JSON.stringify({ status: 'ok' }), { status: 200 })
      );

      await new Promise<void>((resolve) => {
        server.listen(() => {
          const port = (httpServer.address() as { port: number })?.port;

          // Test health endpoint
          const req = request(
            {
              hostname: 'localhost',
              port,
              path: '/',
              method: 'GET',
            },
            (res) => {
              expect(res.statusCode).toBe(200);
              expect(handleHealth).toHaveBeenCalled();
              resolve();
            }
          );
          req.end();
        });
      });
    });

    it('should handle multiple concurrent requests', async () => {
      server = createNodeServer({ port: 0 });
      httpServer = server.getServer();

      (handleHealth as jest.Mock).mockResolvedValue(
        new Response(JSON.stringify({ status: 'ok' }), { status: 200 })
      );

      await new Promise<void>((resolve) => {
        server.listen(() => {
          const port = (httpServer.address() as { port: number })?.port;
          let completed = 0;
          const totalRequests = 5;

          for (let i = 0; i < totalRequests; i++) {
            const req = request(
              {
                hostname: 'localhost',
                port,
                path: '/',
                method: 'GET',
              },
              (res) => {
                expect(res.statusCode).toBe(200);
                completed++;
                if (completed === totalRequests) {
                  resolve();
                }
              }
            );
            req.end();
          }
        });
      });
    });
  });
});
