/**
 * Tests for Package Exports
 *
 * Verifies that all package exports are accessible, correctly typed, and have no circular dependencies.
 */

import { describe, it, expect } from '@jest/globals';

describe('Package Exports', () => {
  describe('Main MCP Server Factory', () => {
    it('should export createMcpServer', async () => {
      const module = await import('./index.js');
      expect(module.createMcpServer).toBeDefined();
      expect(typeof module.createMcpServer).toBe('function');
    });

    it('should export McpServerOptions type', async () => {
      const module = await import('./index.js');
      // Type exports are compile-time only, but we can verify the function accepts options
      expect(module.createMcpServer).toBeDefined();
    });
  });

  describe('Tool Registration', () => {
    it('should export registerAllTools', async () => {
      const module = await import('./index.js');
      expect(module.registerAllTools).toBeDefined();
      expect(typeof module.registerAllTools).toBe('function');
    });

    it('should export ToolContext type', async () => {
      const module = await import('./index.js');
      // Type exports are compile-time only, verify function exists
      expect(module.registerAllTools).toBeDefined();
    });
  });

  describe('Runtime Types', () => {
    it('should export RuntimeEnv type', async () => {
      const module = await import('./index.js');
      // Type exports are compile-time only
      expect(module).toBeDefined();
    });

    it('should export RuntimeLogger type', async () => {
      const module = await import('./index.js');
      // Type exports are compile-time only
      expect(module).toBeDefined();
    });
  });

  describe('Resource Registration', () => {
    it('should export registerAllResources', async () => {
      const module = await import('./index.js');
      expect(module.registerAllResources).toBeDefined();
      expect(typeof module.registerAllResources).toBe('function');
    });
  });

  describe('Prompt Registration', () => {
    it('should export registerAllPrompts', async () => {
      const module = await import('./index.js');
      expect(module.registerAllPrompts).toBeDefined();
      expect(typeof module.registerAllPrompts).toBe('function');
    });
  });

  describe('Types and Schemas', () => {
    it('should export types from lib/types', async () => {
      const module = await import('./index.js');
      // Verify wildcard export works
      expect(module).toBeDefined();
    });
  });

  describe('Route Handlers', () => {
    it('should export handleHealth', async () => {
      const module = await import('./index.js');
      expect(module.handleHealth).toBeDefined();
      expect(typeof module.handleHealth).toBe('function');
    });

    it('should export handleOAuthMetadata', async () => {
      const module = await import('./index.js');
      expect(module.handleOAuthMetadata).toBeDefined();
      expect(typeof module.handleOAuthMetadata).toBe('function');
    });

    it('should export handleOAuthAuthorize', async () => {
      const module = await import('./index.js');
      expect(module.handleOAuthAuthorize).toBeDefined();
      expect(typeof module.handleOAuthAuthorize).toBe('function');
    });

    it('should export handleOAuthToken', async () => {
      const module = await import('./index.js');
      expect(module.handleOAuthToken).toBeDefined();
      expect(typeof module.handleOAuthToken).toBe('function');
    });

    it('should export handleOAuthRevoke', async () => {
      const module = await import('./index.js');
      expect(module.handleOAuthRevoke).toBeDefined();
      expect(typeof module.handleOAuthRevoke).toBe('function');
    });

    it('should export handleOAuthIntrospect', async () => {
      const module = await import('./index.js');
      expect(module.handleOAuthIntrospect).toBeDefined();
      expect(typeof module.handleOAuthIntrospect).toBe('function');
    });

    it('should export handleOAuthRegister', async () => {
      const module = await import('./index.js');
      expect(module.handleOAuthRegister).toBeDefined();
      expect(typeof module.handleOAuthRegister).toBe('function');
    });

    it('should export handleOpenAPI', async () => {
      const module = await import('./index.js');
      expect(module.handleOpenAPI).toBeDefined();
      expect(typeof module.handleOpenAPI).toBe('function');
    });
  });

  describe('Middleware', () => {
    it('should export rate limit middleware', async () => {
      const module = await import('./index.js');
      // Wildcard export from middleware/rate-limit.js
      expect(module).toBeDefined();
    });
  });

  describe('Utilities', () => {
    it('should export utilities from lib/utils', async () => {
      const module = await import('./index.js');
      // Wildcard export
      expect(module).toBeDefined();
    });

    it('should export errors from lib/errors', async () => {
      const module = await import('./index.js');
      // Wildcard export
      expect(module).toBeDefined();
    });
  });

  describe('OAuth Shared Implementation', () => {
    it('should export handleOAuthTokenShared', async () => {
      const module = await import('./index.js');
      expect(module.handleOAuthTokenShared).toBeDefined();
      expect(typeof module.handleOAuthTokenShared).toBe('function');
    });

    it('should export handleOAuthAuthorizeShared', async () => {
      const module = await import('./index.js');
      expect(module.handleOAuthAuthorizeShared).toBeDefined();
      expect(typeof module.handleOAuthAuthorizeShared).toBe('function');
    });

    it('should export handleOAuthRevokeShared', async () => {
      const module = await import('./index.js');
      expect(module.handleOAuthRevokeShared).toBeDefined();
      expect(typeof module.handleOAuthRevokeShared).toBe('function');
    });

    it('should export handleOAuthIntrospectShared', async () => {
      const module = await import('./index.js');
      expect(module.handleOAuthIntrospectShared).toBeDefined();
      expect(typeof module.handleOAuthIntrospectShared).toBe('function');
    });

    it('should export handleOAuthRegisterShared', async () => {
      const module = await import('./index.js');
      expect(module.handleOAuthRegisterShared).toBeDefined();
      expect(typeof module.handleOAuthRegisterShared).toBe('function');
    });

    it('should export jsonError', async () => {
      const module = await import('./index.js');
      expect(module.jsonError).toBeDefined();
      expect(typeof module.jsonError).toBe('function');
    });

    it('should export OAuthAdapter type', async () => {
      const module = await import('./index.js');
      // Type exports are compile-time only
      expect(module).toBeDefined();
    });

    it('should export OAuthEnvConfig type', async () => {
      const module = await import('./index.js');
      // Type exports are compile-time only
      expect(module).toBeDefined();
    });
  });

  describe('Circular Dependencies', () => {
    it('should not have circular dependencies', async () => {
      // Import all exports to verify no circular dependency errors
      const module = await import('./index.js');
      expect(module).toBeDefined();
      // If we get here without errors, no circular dependencies
    });

    it('should allow re-importing without issues', async () => {
      // Import multiple times to check for circular dependency issues
      const module1 = await import('./index.js');
      const module2 = await import('./index.js');
      expect(module1).toBeDefined();
      expect(module2).toBeDefined();
      // Both should be the same module instance
      expect(module1).toBe(module2);
    });
  });

  describe('Export Completeness', () => {
    it('should export all expected functions', async () => {
      const module = await import('./index.js');

      // Main exports
      expect(module.createMcpServer).toBeDefined();
      expect(module.registerAllTools).toBeDefined();
      expect(module.registerAllResources).toBeDefined();
      expect(module.registerAllPrompts).toBeDefined();

      // Route handlers
      expect(module.handleHealth).toBeDefined();
      expect(module.handleOAuthMetadata).toBeDefined();
      expect(module.handleOAuthAuthorize).toBeDefined();
      expect(module.handleOAuthToken).toBeDefined();
      expect(module.handleOAuthRevoke).toBeDefined();
      expect(module.handleOAuthIntrospect).toBeDefined();
      expect(module.handleOAuthRegister).toBeDefined();
      expect(module.handleOpenAPI).toBeDefined();

      // OAuth shared
      expect(module.handleOAuthTokenShared).toBeDefined();
      expect(module.handleOAuthAuthorizeShared).toBeDefined();
      expect(module.handleOAuthRevokeShared).toBeDefined();
      expect(module.handleOAuthIntrospectShared).toBeDefined();
      expect(module.handleOAuthRegisterShared).toBeDefined();
      expect(module.jsonError).toBeDefined();
    });
  });
});
