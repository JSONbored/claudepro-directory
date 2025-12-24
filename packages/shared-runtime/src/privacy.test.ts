import { describe, expect, it } from '@jest/globals';
import { hashEmail, hashUserId } from './privacy.ts';

describe('hashUserId', () => {
  describe('valid user IDs', () => {
    it('should hash user ID deterministically', () => {
      const userId = 'user-123';
      const hash1 = hashUserId(userId);
      const hash2 = hashUserId(userId);
      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('string');
      expect(hash1.length).toBeGreaterThan(0);
    });

    it('should produce different hashes for different IDs', () => {
      const hash1 = hashUserId('user-123');
      const hash2 = hashUserId('user-456');
      expect(hash1).not.toBe(hash2);
    });

    it('should handle UUIDs', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const hash = hashUserId(uuid);
      expect(hash).toBeTruthy();
      expect(typeof hash).toBe('string');
    });

    it('should handle long user IDs', () => {
      const longId = 'a'.repeat(100);
      const hash = hashUserId(longId);
      expect(hash).toBeTruthy();
      expect(typeof hash).toBe('string');
    });

    it('should handle short user IDs', () => {
      const hash = hashUserId('a');
      expect(hash).toBeTruthy();
      expect(typeof hash).toBe('string');
    });

    it('should handle special characters', () => {
      const hash = hashUserId('user@example.com');
      expect(hash).toBeTruthy();
      expect(typeof hash).toBe('string');
    });

    it('should produce hex-encoded hash', () => {
      const hash = hashUserId('test-user');
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe('invalid inputs', () => {
    it('should return "invalid" for null', () => {
      const result = hashUserId(null as any);
      expect(result).toBe('invalid');
    });

    it('should return "invalid" for undefined', () => {
      const result = hashUserId(undefined as any);
      expect(result).toBe('invalid');
    });

    it('should return "invalid" for empty string', () => {
      const result = hashUserId('');
      expect(result).toBe('invalid');
    });

    it('should return "invalid" for non-string input', () => {
      expect(hashUserId(123 as any)).toBe('invalid');
      expect(hashUserId({} as any)).toBe('invalid');
      expect(hashUserId([] as any)).toBe('invalid');
    });
  });

  describe('deterministic hashing', () => {
    it('should produce same hash for same input across multiple calls', () => {
      const userId = 'consistent-user-id';
      const hashes = Array.from({ length: 10 }, () => hashUserId(userId));
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(1);
    });

    it('should produce different hashes for similar but different IDs', () => {
      const hash1 = hashUserId('user-1');
      const hash2 = hashUserId('user-2');
      expect(hash1).not.toBe(hash2);
    });
  });
});

describe('hashEmail', () => {
  describe('valid emails', () => {
    it('should hash local part and preserve domain when preserveDomain is true', () => {
      const email = 'user@example.com';
      const result = hashEmail(email, true);
      expect(result).toContain('@');
      expect(result).toContain('example.com');
      expect(result).not.toContain('user');
    });

    it('should hash local part and redact domain when preserveDomain is false', () => {
      const email = 'user@example.com';
      const result = hashEmail(email, false);
      expect(result).toContain('@');
      expect(result).toContain('[REDACTED]');
      expect(result).not.toContain('example.com');
      expect(result).not.toContain('user');
    });

    it('should default to redacting domain', () => {
      const email = 'user@example.com';
      const result = hashEmail(email);
      expect(result).toContain('[REDACTED]');
      expect(result).not.toContain('example.com');
    });

    it('should produce deterministic hashes', () => {
      const email = 'user@example.com';
      const hash1 = hashEmail(email, false);
      const hash2 = hashEmail(email, false);
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different emails', () => {
      const hash1 = hashEmail('user1@example.com', false);
      const hash2 = hashEmail('user2@example.com', false);
      expect(hash1).not.toBe(hash2);
    });

    it('should handle emails with plus signs', () => {
      const email = 'user+tag@example.com';
      const result = hashEmail(email, false);
      expect(result).toContain('@');
      expect(result).toContain('[REDACTED]');
    });

    it('should handle emails with dots', () => {
      const email = 'first.last@example.com';
      const result = hashEmail(email, false);
      expect(result).toContain('@');
      expect(result).toContain('[REDACTED]');
    });

    it('should handle multiple domain segments', () => {
      const email = 'user@subdomain.example.com';
      const result = hashEmail(email, true);
      expect(result).toContain('subdomain.example.com');
    });
  });

  describe('invalid inputs', () => {
    it('should return "[REDACTED]" for null', () => {
      const result = hashEmail(null as any);
      expect(result).toBe('[REDACTED]');
    });

    it('should return "[REDACTED]" for undefined', () => {
      const result = hashEmail(undefined as any);
      expect(result).toBe('[REDACTED]');
    });

    it('should return "[REDACTED]" for empty string', () => {
      const result = hashEmail('');
      expect(result).toBe('[REDACTED]');
    });

    it('should return "[REDACTED]" for non-string input', () => {
      expect(hashEmail(123 as any)).toBe('[REDACTED]');
      expect(hashEmail({} as any)).toBe('[REDACTED]');
    });

    it('should hash entire string if no @ symbol', () => {
      const invalidEmail = 'not-an-email';
      const result = hashEmail(invalidEmail, false);
      // Should return a hash (not "[REDACTED]") since hashUserId is called
      expect(result).toBeTruthy();
      expect(result).not.toBe('[REDACTED]');
      expect(result).not.toContain('@');
    });
  });

  describe('privacy compliance', () => {
    it('should never expose original local part', () => {
      const email = 'sensitive@example.com';
      const result = hashEmail(email, false);
      expect(result).not.toContain('sensitive');
    });

    it('should never expose original local part even with domain preserved', () => {
      const email = 'sensitive@example.com';
      const result = hashEmail(email, true);
      expect(result).not.toContain('sensitive');
    });

    it('should redact domain by default for maximum privacy', () => {
      const email = 'user@example.com';
      const result = hashEmail(email);
      expect(result).toContain('[REDACTED]');
    });
  });
});
