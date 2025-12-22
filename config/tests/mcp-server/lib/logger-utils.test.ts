/**
 * Tests for Logger Utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSimpleLogger } from '../../../../packages/mcp-server/src/lib/logger-utils.js';

describe('Logger Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  describe('createSimpleLogger', () => {
    it('should create logger without name', () => {
      const logger = createSimpleLogger();
      expect(logger).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.debug).toBeDefined();
      expect(logger.child).toBeDefined();
    });

    it('should create logger with name', () => {
      const logger = createSimpleLogger('TestLogger');
      expect(logger).toBeDefined();
    });

    it('should log info messages', () => {
      const logger = createSimpleLogger('Test');
      logger.info('Test message', { key: 'value' });

      expect(console.log).toHaveBeenCalledWith('[Test] Test message', JSON.stringify({ key: 'value' }));
    });

    it('should log error messages', () => {
      const logger = createSimpleLogger('Test');
      const error = new Error('Test error');
      logger.error('Error occurred', error, { context: 'test' });

      expect(console.error).toHaveBeenCalledWith('[Test] Error occurred', error, JSON.stringify({ context: 'test' }));
    });

    it('should log warn messages', () => {
      const logger = createSimpleLogger('Test');
      logger.warn('Warning message', { key: 'value' });

      expect(console.warn).toHaveBeenCalledWith('[Test] Warning message', JSON.stringify({ key: 'value' }));
    });

    it('should log debug messages', () => {
      const logger = createSimpleLogger('Test');
      logger.debug('Debug message', { key: 'value' });

      expect(console.debug).toHaveBeenCalledWith('[Test] Debug message', JSON.stringify({ key: 'value' }));
    });

    it('should create child logger', () => {
      const logger = createSimpleLogger('Test');
      const childLogger = logger.child({ requestId: '123' });

      expect(childLogger).toBeDefined();
      expect(childLogger.info).toBeDefined();
      // Note: Simple logger doesn't preserve context, it just returns a new logger
      childLogger.info('Child message');
      expect(console.log).toHaveBeenCalled();
    });
  });
});

