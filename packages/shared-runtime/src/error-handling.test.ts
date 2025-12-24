import { describe, expect, it } from '@jest/globals';
import { normalizeError } from './error-handling';

describe('Error Handling', () => {
  describe('normalizeError', () => {
    it('should return Error instance as-is', () => {
      const error = new Error('Test error');
      const normalized = normalizeError(error);
      expect(normalized).toBe(error);
      expect(normalized.message).toBe('Test error');
    });

    it('should convert string to Error', () => {
      const normalized = normalizeError('String error');
      expect(normalized).toBeInstanceOf(Error);
      expect(normalized.message).toBe('String error');
    });

    it('should use fallback message for non-Error, non-string values', () => {
      const normalized = normalizeError(null, 'Fallback message');
      expect(normalized).toBeInstanceOf(Error);
      expect(normalized.message).toBe('Fallback message');
    });

    it('should extract message from PostgrestError-like objects', () => {
      const postgrestError = {
        code: 'PGRST116',
        message: 'Database connection failed',
        details: 'Connection timeout',
        hint: 'Check network',
      };
      const normalized = normalizeError(postgrestError);
      expect(normalized).toBeInstanceOf(Error);
      expect(normalized.message).toBe('Database connection failed');
    });

    it('should stringify objects when message field not available', () => {
      const obj = { code: 500, data: { key: 'value' } };
      const normalized = normalizeError(obj);
      expect(normalized).toBeInstanceOf(Error);
      expect(normalized.message).toContain('code');
      expect(normalized.message).toContain('data');
    });
  });
});
