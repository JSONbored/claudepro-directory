/**
 * Tests for Environment Utilities
 */

import { describe, it, expect } from '@jest/globals';
import {
  getEnvVar,
  getEnvOrDefault,
  getNumberEnv,
  requireEnvVar,
} from '@heyclaude/mcp-server/lib/env-utils';
import { createMockEnv } from '../fixtures/test-utils.js';

describe('Environment Utilities', () => {
  describe('getEnvVar', () => {
    it('should return string value when present', () => {
      const env = createMockEnv({ TEST_KEY: 'test-value' });
      expect(getEnvVar(env, 'TEST_KEY')).toBe('test-value');
    });

    it('should return undefined when key is missing', () => {
      const env = createMockEnv();
      expect(getEnvVar(env, 'MISSING_KEY')).toBeUndefined();
    });

    it('should return undefined when value is not a string', () => {
      const env = createMockEnv({ TEST_KEY: 123 as unknown as string });
      expect(getEnvVar(env, 'TEST_KEY')).toBeUndefined();
    });
  });

  describe('getEnvOrDefault', () => {
    it('should return env value when present', () => {
      const env = createMockEnv({ TEST_KEY: 'test-value' });
      expect(getEnvOrDefault(env, 'TEST_KEY', 'default')).toBe('test-value');
    });

    it('should return fallback when key is missing', () => {
      const env = createMockEnv();
      expect(getEnvOrDefault(env, 'MISSING_KEY', 'default-value')).toBe('default-value');
    });
  });

  describe('getNumberEnv', () => {
    it('should return parsed number when valid', () => {
      const env = createMockEnv({ PORT: '3000' });
      expect(getNumberEnv(env, 'PORT')).toBe(3000);
    });

    it('should return fallback when key is missing', () => {
      const env = createMockEnv();
      expect(getNumberEnv(env, 'PORT', 8080)).toBe(8080);
    });

    it('should return fallback when value is not a valid number', () => {
      const env = createMockEnv({ PORT: 'invalid' });
      expect(getNumberEnv(env, 'PORT', 8080)).toBe(8080);
    });

    it('should return undefined when no fallback provided', () => {
      const env = createMockEnv();
      expect(getNumberEnv(env, 'PORT')).toBeUndefined();
    });
  });

  describe('requireEnvVar', () => {
    it('should return value when present', () => {
      const env = createMockEnv({ REQUIRED_KEY: 'required-value' });
      expect(requireEnvVar(env, 'REQUIRED_KEY')).toBe('required-value');
    });

    it('should throw error when key is missing', () => {
      const env = createMockEnv();
      expect(() => requireEnvVar(env, 'REQUIRED_KEY')).toThrow('Environment variable REQUIRED_KEY is required');
    });

    it('should throw custom error message when provided', () => {
      const env = createMockEnv();
      expect(() => requireEnvVar(env, 'REQUIRED_KEY', 'Custom error message')).toThrow('Custom error message');
    });
  });
});

