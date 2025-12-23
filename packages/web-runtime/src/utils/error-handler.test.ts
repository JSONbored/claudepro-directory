import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { createErrorResponse, handleApiError } from './error-handler';
import { z } from 'zod';
import { NextResponse } from 'next/server';

// Mock server-only
jest.mock('server-only', () => ({}));

// Mock logger
jest.mock('../logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

// Mock log-context
jest.mock('./log-context', () => ({
  createWebAppContext: jest.fn((route, operation, context) => ({
    route,
    operation,
    ...context,
  })),
}));

// Mock api-error-codes
jest.mock('./api-error-codes', () => ({
  ApiErrorCode: {
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    UNAUTHORIZED: 'UNAUTHORIZED',
    AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
    INVALID_PARAMETER: 'INVALID_PARAMETER',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  },
  determineErrorCode: jest.fn(() => 'INTERNAL_ERROR'),
}));

// Mock error-utils
jest.mock('../error-utils', () => ({
  formatZodError: jest.fn((error) => ({ field: 'error' })),
  sanitizeError: jest.fn((error) => 'Sanitized error'),
}));

// Mock env - must export env object that platform/env.ts uses
jest.mock('@heyclaude/shared-runtime/schemas/env', () => ({
  env: {
    NODE_ENV: 'test',
    NEXT_PHASE: undefined,
  },
  isDevelopment: false,
  isProduction: false,
}));

describe('error-handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createErrorResponse', () => {
    it('should create error response for generic error', async () => {
      const error = new Error('Test error');
      const response = await createErrorResponse(error, {
        route: '/api/test',
        operation: 'testOperation',
        method: 'GET',
      });

      expect(response).toBeInstanceOf(NextResponse);
      const json = await response.json();
      expect(json.success).toBe(false);
      expect(json.error).toHaveProperty('code');
      expect(json.error).toHaveProperty('message');
      expect(response.status).toBe(500);
    });

    it('should handle Zod validation errors', async () => {
      const schema = z.object({ name: z.string() });
      const error = schema.safeParse({ name: 123 }).error;
      if (!error) throw new Error('Expected ZodError');

      const response = await createErrorResponse(error, {
        route: '/api/test',
        operation: 'testOperation',
      });

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error.code).toBe('VALIDATION_ERROR');
      expect(json.error).toHaveProperty('details');
    });

    it('should include context in response', async () => {
      const error = new Error('Test error');
      const response = await createErrorResponse(error, {
        route: '/api/test',
        operation: 'testOperation',
        method: 'POST',
        userId: 'user-1',
        logContext: { custom: 'value' },
      });

      expect(response).toBeInstanceOf(NextResponse);
    });

    it('should set cache headers', async () => {
      const error = new Error('Test error');
      const response = await createErrorResponse(error);

      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
    });
  });

  describe('handleApiError', () => {
    it('should call createErrorResponse', async () => {
      const error = new Error('Test error');
      const response = await handleApiError(error, {
        route: '/api/test',
        operation: 'testOperation',
      });

      expect(response).toBeInstanceOf(NextResponse);
    });
  });
});

