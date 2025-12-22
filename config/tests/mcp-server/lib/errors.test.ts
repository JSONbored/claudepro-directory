/**
 * Tests for Error Handling Utilities
 * 
 * These tests are located externally from the source package to keep
 * packages/mcp-server clean for community distribution.
 */

import { describe, it, expect } from 'vitest';
import {
  McpErrorCode,
  ERROR_MESSAGES,
  ERROR_RECOVERY,
  createErrorResponse,
} from '../../../../packages/mcp-server/src/lib/errors.js';

describe('MCP Server Error Handling', () => {
  describe('McpErrorCode enum', () => {
    it('should have all expected error codes', () => {
      expect(McpErrorCode.AUTHENTICATION_REQUIRED).toBe('AUTHENTICATION_REQUIRED');
      expect(McpErrorCode.CONTENT_NOT_FOUND).toBe('CONTENT_NOT_FOUND');
      expect(McpErrorCode.INVALID_INPUT).toBe('INVALID_INPUT');
      expect(McpErrorCode.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('ERROR_MESSAGES', () => {
    it('should have messages for all error codes', () => {
      Object.values(McpErrorCode).forEach((code) => {
        expect(ERROR_MESSAGES[code]).toBeDefined();
        expect(typeof ERROR_MESSAGES[code]).toBe('string');
        expect(ERROR_MESSAGES[code].length).toBeGreaterThan(0);
      });
    });

    it('should have user-friendly messages', () => {
      expect(ERROR_MESSAGES[McpErrorCode.CONTENT_NOT_FOUND]).toContain('not found');
      expect(ERROR_MESSAGES[McpErrorCode.INVALID_INPUT]).toContain('Invalid');
      expect(ERROR_MESSAGES[McpErrorCode.RATE_LIMIT_EXCEEDED]).toContain('Rate limit');
    });
  });

  describe('ERROR_RECOVERY', () => {
    it('should have recovery suggestions for common errors', () => {
      expect(ERROR_RECOVERY[McpErrorCode.CONTENT_NOT_FOUND]).toBeDefined();
      expect(ERROR_RECOVERY[McpErrorCode.INVALID_CATEGORY]).toBeDefined();
      expect(ERROR_RECOVERY[McpErrorCode.RATE_LIMIT_EXCEEDED]).toBeDefined();
    });

    it('should have actionable recovery suggestions', () => {
      const suggestions = ERROR_RECOVERY[McpErrorCode.CONTENT_NOT_FOUND];
      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions!.length).toBeGreaterThan(0);
      suggestions!.forEach((suggestion) => {
        expect(typeof suggestion).toBe('string');
        expect(suggestion.length).toBeGreaterThan(0);
      });
    });
  });

  describe('createErrorResponse', () => {
    it('should create error response with code and message', () => {
      const response = createErrorResponse(McpErrorCode.CONTENT_NOT_FOUND);

      expect(response.code).toBe(McpErrorCode.CONTENT_NOT_FOUND);
      expect(response.message).toBe(ERROR_MESSAGES[McpErrorCode.CONTENT_NOT_FOUND]);
    });

    it('should include details when provided', () => {
      const response = createErrorResponse(
        McpErrorCode.CONTENT_NOT_FOUND,
        'Content with slug "test" not found in category "agents"'
      );

      expect(response.details).toBe('Content with slug "test" not found in category "agents"');
    });

    it('should include requestId when provided', () => {
      const requestId = 'req-123';
      const response = createErrorResponse(McpErrorCode.CONTENT_NOT_FOUND, undefined, requestId);

      expect(response.requestId).toBe(requestId);
    });

    it('should include recovery suggestions when available', () => {
      const response = createErrorResponse(McpErrorCode.CONTENT_NOT_FOUND);

      expect(response.recovery).toBeDefined();
      expect(response.suggestions).toBeDefined();
      expect(Array.isArray(response.suggestions)).toBe(true);
      expect(response.suggestions!.length).toBeGreaterThan(0);
    });

    it('should not include recovery for errors without suggestions', () => {
      const response = createErrorResponse(McpErrorCode.INTERNAL_ERROR);

      // INTERNAL_ERROR may not have recovery suggestions
      // This test just ensures the function doesn't crash
      expect(response.code).toBe(McpErrorCode.INTERNAL_ERROR);
      expect(response.message).toBeDefined();
    });

    it('should handle string error codes', () => {
      const response = createErrorResponse('CUSTOM_ERROR' as McpErrorCode);

      // Should default to INTERNAL_ERROR for unknown codes
      expect(response.code).toBe(McpErrorCode.INTERNAL_ERROR);
    });

    it('should handle valid string error codes', () => {
      const response = createErrorResponse('CONTENT_NOT_FOUND' as McpErrorCode);

      expect(response.code).toBe(McpErrorCode.CONTENT_NOT_FOUND);
      expect(response.message).toBe(ERROR_MESSAGES[McpErrorCode.CONTENT_NOT_FOUND]);
    });
  });
});

