import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { parseChangelogChanges } from './changelog.shared';

// Mock server-only
jest.mock('server-only', () => ({}));

// Mock logger
jest.mock('../errors.ts', () => ({
  normalizeError: jest.fn((error: unknown, message?: string) => {
    if (error instanceof Error) {
      return error;
    }
    return new Error(message || (typeof error === 'string' ? error : 'Unknown error'));
  }),
}));

// Mock logger
jest.mock('../logger.ts', () => ({
  logger: {
    child: jest.fn(() => ({
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    })),
  },
}));

describe('changelog.shared', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseChangelogChanges', () => {
    it('should parse valid changes object with Added array', () => {
      const changes = {
        Added: [{ content: 'New feature' }, { content: 'Another feature' }],
      };
      const result = parseChangelogChanges(changes);
      expect(result).toEqual({
        Added: [{ content: 'New feature' }, { content: 'Another feature' }],
      });
    });

    it('should parse changes with string arrays', () => {
      const changes = {
        Added: ['Feature 1', 'Feature 2'],
        Fixed: ['Bug 1'],
      };
      const result = parseChangelogChanges(changes);
      expect(result).toEqual({
        Added: [{ content: 'Feature 1' }, { content: 'Feature 2' }],
        Fixed: [{ content: 'Bug 1' }],
      });
    });

    it('should handle all changelog categories', () => {
      const changes = {
        Added: ['New'],
        Changed: ['Updated'],
        Deprecated: ['Old'],
        Fixed: ['Bug'],
        Removed: ['Removed'],
        Security: ['Security fix'],
      };
      const result = parseChangelogChanges(changes);
      expect(result).toHaveProperty('Added');
      expect(result).toHaveProperty('Changed');
      expect(result).toHaveProperty('Deprecated');
      expect(result).toHaveProperty('Fixed');
      expect(result).toHaveProperty('Removed');
      expect(result).toHaveProperty('Security');
    });

    it('should handle optional categories', () => {
      const changes = {
        Added: ['Feature'],
      };
      const result = parseChangelogChanges(changes);
      expect(result).toEqual({
        Added: [{ content: 'Feature' }],
      });
    });

    it('should return empty object on invalid input', () => {
      const result = parseChangelogChanges(null);
      expect(result).toEqual({});
    });

    it('should return empty object on invalid category', () => {
      const changes = {
        InvalidCategory: ['Something'],
      };
      const result = parseChangelogChanges(changes);
      // .strict() should reject extra keys, so this should return empty object
      expect(result).toEqual({});
    });

    it('should handle mixed string and object arrays', () => {
      const changes = {
        Added: ['String item', { content: 'Object item' }],
      };
      const result = parseChangelogChanges(changes);
      expect(result.Added).toHaveLength(2);
      expect(result.Added?.[0]).toEqual({ content: 'String item' });
      expect(result.Added?.[1]).toEqual({ content: 'Object item' });
    });

    it('should handle empty arrays', () => {
      const changes = {
        Added: [],
        Fixed: [],
      };
      const result = parseChangelogChanges(changes);
      expect(result).toEqual({
        Added: [],
        Fixed: [],
      });
    });

    it('should handle invalid items in arrays (numbers)', () => {
      const changes = {
        Added: [123, 'valid string'],
      };
      // Zod should reject this - numbers are not valid
      const result = parseChangelogChanges(changes);
      // Should return empty object on error
      expect(result).toEqual({});
    });

    it('should handle invalid items in arrays (objects without content)', () => {
      const changes = {
        Added: [{ notContent: 'invalid' }, { content: 'valid' }],
      };
      // Objects must have 'content' property
      const result = parseChangelogChanges(changes);
      // Should return empty object on error
      expect(result).toEqual({});
    });

    it('should handle extra invalid category keys', () => {
      const changes = {
        Added: ['Valid'],
        InvalidCategory: ['Should be ignored'],
      };
      // .strict() should reject extra keys
      const result = parseChangelogChanges(changes);
      // Should return empty object on error (strict() rejects extra keys)
      expect(result).toEqual({});
    });

    it('should handle null values in arrays', () => {
      const changes = {
        Added: [null, 'valid'],
      };
      // Null is not a valid string or object
      const result = parseChangelogChanges(changes);
      expect(result).toEqual({});
    });

    it('should handle undefined values in arrays', () => {
      const changes = {
        Added: [undefined, 'valid'],
      };
      // Undefined is not a valid string or object
      const result = parseChangelogChanges(changes);
      expect(result).toEqual({});
    });

    it('should handle empty strings in arrays', () => {
      const changes = {
        Added: ['', 'valid'],
      };
      // Empty strings should be valid (they're still strings)
      const result = parseChangelogChanges(changes);
      expect(result.Added).toHaveLength(2);
      expect(result.Added?.[0]).toEqual({ content: '' });
      expect(result.Added?.[1]).toEqual({ content: 'valid' });
    });

    it('should handle objects with empty content', () => {
      const changes = {
        Added: [{ content: '' }, { content: 'valid' }],
      };
      const result = parseChangelogChanges(changes);
      expect(result.Added).toHaveLength(2);
      expect(result.Added?.[0]).toEqual({ content: '' });
      expect(result.Added?.[1]).toEqual({ content: 'valid' });
    });
  });
});
