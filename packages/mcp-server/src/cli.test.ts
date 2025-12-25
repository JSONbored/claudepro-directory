/**
 * Tests for CLI Entry Point
 *
 * Tests the command-line interface for running the MCP server locally.
 * Includes argument parsing, server startup, help command, and error handling.
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { cli } from './cli.js';
import { createNodeServer } from './server/node-server.js';

// Mock the node-server module
jest.mock('./server/node-server.js', () => ({
  createNodeServer: jest.fn(),
}));

// Mock process.argv and process.exit
const originalArgv = process.argv;
const originalExit = process.exit;
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

describe('CLI Entry Point', () => {
  let mockServer: {
    listen: jest.Mock;
    close: jest.Mock;
    getServer: jest.Mock;
  };
  let exitCode: number | null = null;
  let consoleLogs: string[] = [];
  let consoleErrors: string[] = [];

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    jest.resetAllMocks();

    // Create mock server
    mockServer = {
      listen: jest.fn((callback?: () => void) => {
        callback?.();
      }),
      close: jest.fn((callback?: () => void) => {
        callback?.();
      }),
      getServer: jest.fn(),
    };

    (createNodeServer as jest.Mock).mockReturnValue(mockServer);

    // Mock process.exit
    exitCode = null;
    process.exit = jest.fn((code?: number) => {
      exitCode = code ?? 0;
      throw new Error(`process.exit(${code ?? 0})`);
    }) as typeof process.exit;

    // Capture console output
    consoleLogs = [];
    consoleErrors = [];
    console.log = jest.fn((...args: unknown[]) => {
      consoleLogs.push(args.map(String).join(' '));
      originalConsoleLog(...args);
    });
    console.error = jest.fn((...args: unknown[]) => {
      consoleErrors.push(args.map(String).join(' '));
      originalConsoleError(...args);
    });
    console.warn = jest.fn((...args: unknown[]) => {
      originalConsoleWarn(...args);
    });
  });

  afterEach(() => {
    // Restore original values
    process.argv = originalArgv;
    process.exit = originalExit;
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });

  describe('Unit Tests', () => {
    describe('start command', () => {
      it('should start server with default port and API URL', async () => {
        process.argv = ['node', 'cli.js', 'start'];

        await cli();

        expect(createNodeServer).toHaveBeenCalledWith(
          expect.objectContaining({
            port: 3000,
            apiProxy: {
              apiBaseUrl: 'https://claudepro.directory',
            },
          })
        );
        expect(mockServer.listen).toHaveBeenCalled();
        expect(
          consoleLogs.some((log) => log.includes('MCP server running on http://localhost:3000'))
        ).toBe(true);
      });

      it('should start server with custom port', async () => {
        process.argv = ['node', 'cli.js', 'start', '--port', '8080'];

        await cli();

        expect(createNodeServer).toHaveBeenCalledWith(
          expect.objectContaining({
            port: 8080,
          })
        );
        expect(mockServer.listen).toHaveBeenCalled();
        expect(
          consoleLogs.some((log) => log.includes('MCP server running on http://localhost:8080'))
        ).toBe(true);
      });

      it('should start server with custom API base URL', async () => {
        process.argv = ['node', 'cli.js', 'start', '--api-base-url', 'https://custom.api.com'];

        await cli();

        expect(createNodeServer).toHaveBeenCalledWith(
          expect.objectContaining({
            apiProxy: {
              apiBaseUrl: 'https://custom.api.com',
            },
          })
        );
        expect(mockServer.listen).toHaveBeenCalled();
        expect(consoleLogs.some((log) => log.includes('Proxying to: https://custom.api.com'))).toBe(
          true
        );
      });

      it('should start server with API key', async () => {
        process.argv = ['node', 'cli.js', 'start', '--api-key', 'test-api-key'];

        await cli();

        expect(createNodeServer).toHaveBeenCalledWith(
          expect.objectContaining({
            apiProxy: {
              apiBaseUrl: 'https://claudepro.directory',
              apiKey: 'test-api-key',
            },
          })
        );
        expect(mockServer.listen).toHaveBeenCalled();
      });

      it('should start server with all options', async () => {
        process.argv = [
          'node',
          'cli.js',
          'start',
          '--port',
          '8080',
          '--api-base-url',
          'https://custom.api.com',
          '--api-key',
          'test-key',
        ];

        await cli();

        expect(createNodeServer).toHaveBeenCalledWith(
          expect.objectContaining({
            port: 8080,
            apiProxy: {
              apiBaseUrl: 'https://custom.api.com',
              apiKey: 'test-key',
            },
          })
        );
        expect(mockServer.listen).toHaveBeenCalled();
      });

      it('should set up graceful shutdown handlers', async () => {
        process.argv = ['node', 'cli.js', 'start'];

        const sigintListeners = process.listeners('SIGINT');
        const sigtermListeners = process.listeners('SIGTERM');

        await cli();

        // Verify new listeners were added
        expect(process.listeners('SIGINT').length).toBeGreaterThan(sigintListeners.length);
        expect(process.listeners('SIGTERM').length).toBeGreaterThan(sigtermListeners.length);
      });

      it('should handle SIGINT gracefully', async () => {
        process.argv = ['node', 'cli.js', 'start'];

        await cli();

        // Simulate SIGINT
        const sigintListeners = process.listeners('SIGINT');
        const lastListener = sigintListeners[sigintListeners.length - 1] as () => void;

        // Mock process.exit to prevent actual exit
        const originalExit = process.exit;
        process.exit = jest.fn() as typeof process.exit;

        lastListener();

        expect(mockServer.close).toHaveBeenCalled();
        expect(consoleLogs.some((log) => log.includes('Shutting down MCP server'))).toBe(true);

        // Restore
        process.exit = originalExit;
      });

      it('should handle SIGTERM gracefully', async () => {
        process.argv = ['node', 'cli.js', 'start'];

        await cli();

        // Simulate SIGTERM
        const sigtermListeners = process.listeners('SIGTERM');
        const lastListener = sigtermListeners[sigtermListeners.length - 1] as () => void;

        // Mock process.exit to prevent actual exit
        const originalExit = process.exit;
        process.exit = jest.fn() as typeof process.exit;

        lastListener();

        expect(mockServer.close).toHaveBeenCalled();
        expect(consoleLogs.some((log) => log.includes('Shutting down MCP server'))).toBe(true);

        // Restore
        process.exit = originalExit;
      });

      it('should create logger with all methods', async () => {
        process.argv = ['node', 'cli.js', 'start'];

        await cli();

        const config = (createNodeServer as jest.Mock).mock.calls[0][0];
        expect(config.logger).toBeDefined();
        expect(typeof config.logger.info).toBe('function');
        expect(typeof config.logger.error).toBe('function');
        expect(typeof config.logger.warn).toBe('function');
        expect(typeof config.logger.debug).toBe('function');
        expect(typeof config.logger.child).toBe('function');
      });

      it('should create child logger correctly', async () => {
        process.argv = ['node', 'cli.js', 'start'];

        await cli();

        const config = (createNodeServer as jest.Mock).mock.calls[0][0];
        const childLogger = config.logger.child({ requestId: 'test-123' });

        expect(childLogger).toBeDefined();
        expect(typeof childLogger.info).toBe('function');
        expect(typeof childLogger.error).toBe('function');
        expect(typeof childLogger.warn).toBe('function');
        expect(typeof childLogger.debug).toBe('function');
        expect(typeof childLogger.child).toBe('function');
      });

      it('should throw error for nested child logger', async () => {
        process.argv = ['node', 'cli.js', 'start'];

        await cli();

        const config = (createNodeServer as jest.Mock).mock.calls[0][0];
        const childLogger = config.logger.child({ requestId: 'test-123' });
        const nestedChild = childLogger.child({ section: 'test' });

        expect(() => nestedChild.child({})).toThrow('Nested child loggers not supported in CLI');
      });
    });

    describe('help command', () => {
      it('should show help for "help" command', async () => {
        process.argv = ['node', 'cli.js', 'help'];

        await cli();

        expect(consoleLogs.some((log) => log.includes('HeyClaude MCP Server CLI'))).toBe(true);
        expect(consoleLogs.some((log) => log.includes('Usage:'))).toBe(true);
        expect(consoleLogs.some((log) => log.includes('Commands:'))).toBe(true);
        expect(consoleLogs.some((log) => log.includes('Options:'))).toBe(true);
        expect(consoleLogs.some((log) => log.includes('Examples:'))).toBe(true);
      });

      it('should show help for "--help" flag', async () => {
        process.argv = ['node', 'cli.js', '--help'];

        await cli();

        expect(consoleLogs.some((log) => log.includes('HeyClaude MCP Server CLI'))).toBe(true);
      });

      it('should show help for "-h" flag', async () => {
        process.argv = ['node', 'cli.js', '-h'];

        await cli();

        expect(consoleLogs.some((log) => log.includes('HeyClaude MCP Server CLI'))).toBe(true);
      });
    });

    describe('error handling', () => {
      it('should exit with error for unknown command', async () => {
        process.argv = ['node', 'cli.js', 'unknown-command'];

        try {
          await cli();
        } catch (error) {
          // process.exit throws an error in our mock
          expect(error).toBeDefined();
        }

        expect(consoleErrors.some((err) => err.includes('Unknown command: unknown-command'))).toBe(
          true
        );
        expect(
          consoleErrors.some((err) => err.includes('Run "npx @heyclaude/mcp-server help"'))
        ).toBe(true);
        expect(exitCode).toBe(1);
      });

      it('should handle missing port argument gracefully', async () => {
        process.argv = ['node', 'cli.js', 'start', '--port'];

        // Should use default port when --port is missing value
        await cli();

        expect(createNodeServer).toHaveBeenCalledWith(
          expect.objectContaining({
            port: 3000, // Default port
          })
        );
      });

      it('should handle invalid port number', async () => {
        process.argv = ['node', 'cli.js', 'start', '--port', 'invalid'];

        await cli();

        // parseInt('invalid') returns NaN, which should be handled
        const config = (createNodeServer as jest.Mock).mock.calls[0][0];
        expect(Number.isNaN(config.port)).toBe(true);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should start and stop server successfully', async () => {
      process.argv = ['node', 'cli.js', 'start', '--port', '3001'];

      await cli();

      expect(createNodeServer).toHaveBeenCalled();
      expect(mockServer.listen).toHaveBeenCalled();

      // Simulate shutdown
      const sigtermListeners = process.listeners('SIGTERM');
      const lastListener = sigtermListeners[sigtermListeners.length - 1] as () => void;
      const originalExit = process.exit;
      process.exit = jest.fn() as typeof process.exit;

      lastListener();

      expect(mockServer.close).toHaveBeenCalled();

      // Restore
      process.exit = originalExit;
    });

    it('should output correct mcp.json configuration', async () => {
      process.argv = ['node', 'cli.js', 'start', '--port', '3001'];

      await cli();

      const output = consoleLogs.join('\n');
      expect(output).toContain('Configure in mcp.json:');
      expect(output).toContain('"command": "npx"');
      expect(output).toContain(
        '"args": ["-y", "@heyclaude/mcp-server@latest", "start", "--port", "3001"]'
      );
    });
  });
});
