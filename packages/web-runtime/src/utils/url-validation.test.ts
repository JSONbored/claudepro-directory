import { describe, expect, it } from 'vitest';
import {
  getSafeRepositoryUrl,
  isTrustedDocumentationUrl,
  isSafeCategoryAndSlug,
  isValidInternalPath,
} from './url-validation';

describe('url-validation', () => {
  describe('getSafeRepositoryUrl', () => {
    it('should return sanitized URL for valid GitHub HTTPS URLs', () => {
      expect(getSafeRepositoryUrl('https://github.com/user/repo')).toBe('https://github.com/user/repo');
      expect(getSafeRepositoryUrl('https://www.github.com/user/repo')).toBe('https://www.github.com/user/repo');
    });

    it('should return sanitized URL for valid GitLab HTTPS URLs', () => {
      expect(getSafeRepositoryUrl('https://gitlab.com/user/repo')).toBe('https://gitlab.com/user/repo');
      expect(getSafeRepositoryUrl('https://www.gitlab.com/user/repo')).toBe('https://www.gitlab.com/user/repo');
    });

    it('should remove query strings and fragments', () => {
      expect(getSafeRepositoryUrl('https://github.com/user/repo?ref=main#readme')).toBe('https://github.com/user/repo');
      expect(getSafeRepositoryUrl('https://github.com/user/repo?branch=dev&file=test.js')).toBe('https://github.com/user/repo');
    });

    it('should remove credentials', () => {
      expect(getSafeRepositoryUrl('https://user:pass@github.com/user/repo')).toBe('https://github.com/user/repo');
    });

    it('should return null for HTTP URLs', () => {
      expect(getSafeRepositoryUrl('http://github.com/user/repo')).toBeNull();
    });

    it('should return null for invalid URLs', () => {
      expect(getSafeRepositoryUrl('not-a-url')).toBeNull();
      expect(getSafeRepositoryUrl('')).toBeNull();
    });

    it('should return null for null/undefined', () => {
      expect(getSafeRepositoryUrl(null)).toBeNull();
      expect(getSafeRepositoryUrl(undefined)).toBeNull();
    });

    it('should return null for non-repository hosts', () => {
      expect(getSafeRepositoryUrl('https://example.com/repo')).toBeNull();
      expect(getSafeRepositoryUrl('https://bitbucket.org/user/repo')).toBeNull();
    });
  });

  describe('isTrustedDocumentationUrl', () => {
    it('should return sanitized URL for valid HTTPS URLs', () => {
      expect(isTrustedDocumentationUrl('https://docs.example.com/path')).toBe('https://docs.example.com/path');
    });

    it('should remove credentials', () => {
      expect(isTrustedDocumentationUrl('https://user:pass@docs.example.com/path')).toBe('https://docs.example.com/path');
    });

    it('should normalize hostname (lowercase, remove trailing dot)', () => {
      // The function removes trailing dots and lowercases
      expect(isTrustedDocumentationUrl('https://DOCS.EXAMPLE.COM./path')).toBe('https://docs.example.com/path');
    });

    it('should remove default HTTPS port', () => {
      expect(isTrustedDocumentationUrl('https://docs.example.com:443/path')).toBe('https://docs.example.com/path');
    });

    it('should return null for HTTP URLs', () => {
      expect(isTrustedDocumentationUrl('http://docs.example.com/path')).toBeNull();
    });

    it('should return null for invalid URLs', () => {
      expect(isTrustedDocumentationUrl('not-a-url')).toBeNull();
    });
  });

  describe('isSafeCategoryAndSlug', () => {
    it('should return true for safe category and slug', () => {
      expect(isSafeCategoryAndSlug('agents', 'my-agent')).toBe(true);
      expect(isSafeCategoryAndSlug('mcp', 'my_mcp')).toBe(true);
      expect(isSafeCategoryAndSlug('rules', 'my-rule-123')).toBe(true);
    });

    it('should return false for unsafe characters', () => {
      expect(isSafeCategoryAndSlug('agents', 'my agent')).toBe(false); // space
      expect(isSafeCategoryAndSlug('agents', '../path')).toBe(false); // path traversal
      expect(isSafeCategoryAndSlug('agents', 'my@agent')).toBe(false); // special char
    });

    it('should return false for non-string values', () => {
      expect(isSafeCategoryAndSlug(null, 'slug')).toBe(false);
      expect(isSafeCategoryAndSlug('category', null)).toBe(false);
      expect(isSafeCategoryAndSlug(123 as any, 'slug')).toBe(false);
    });

    it('should return false for empty strings', () => {
      expect(isSafeCategoryAndSlug('', 'slug')).toBe(false);
      expect(isSafeCategoryAndSlug('category', '')).toBe(false);
    });
  });

  describe('isValidInternalPath', () => {
    it('should return true for valid internal paths', () => {
      expect(isValidInternalPath('/agents')).toBe(true);
      expect(isValidInternalPath('/agents/my-agent')).toBe(true);
      expect(isValidInternalPath('/mcp?query=value')).toBe(true);
      expect(isValidInternalPath('/rules#section')).toBe(true);
    });

    it('should return false for paths not starting with /', () => {
      expect(isValidInternalPath('agents')).toBe(false);
      expect(isValidInternalPath('//example.com')).toBe(false);
    });

    it('should return false for protocol-relative URLs', () => {
      expect(isValidInternalPath('//example.com')).toBe(false);
    });

    it('should return false for dangerous protocols', () => {
      expect(isValidInternalPath('javascript:alert(1)')).toBe(false);
      expect(isValidInternalPath('data:text/html,<script>')).toBe(false);
      expect(isValidInternalPath('vbscript:msgbox(1)')).toBe(false);
      expect(isValidInternalPath('file:///etc/passwd')).toBe(false);
    });

    it('should return false for empty or non-string values', () => {
      expect(isValidInternalPath('')).toBe(false);
      expect(isValidInternalPath(null as any)).toBe(false);
      expect(isValidInternalPath(undefined as any)).toBe(false);
    });
  });
});

