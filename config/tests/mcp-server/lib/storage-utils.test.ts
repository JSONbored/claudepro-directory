/**
 * Tests for Storage Utilities
 */

import { describe, it, expect } from 'vitest';
import {
  getStorageDownloadUrl,
  getStorageFileName,
  getStorageBucket,
  parseRootUri,
} from '../../../../packages/mcp-server/src/lib/storage-utils.js';
import { createMockEnv } from '../fixtures/test-utils.js';

describe('Storage Utilities', () => {
  describe('getStorageDownloadUrl', () => {
    it('should generate download URL with default APP_URL', () => {
      const env = createMockEnv();
      const url = getStorageDownloadUrl('agents', 'test-slug', env);

      expect(url).toBe('https://claudepro.directory/api/v1/content/agents/test-slug?format=storage');
    });

    it('should generate download URL with custom APP_URL', () => {
      const env = createMockEnv({ APP_URL: 'https://example.com' });
      const url = getStorageDownloadUrl('mcp', 'test-slug', env);

      expect(url).toBe('https://example.com/api/v1/content/mcp/test-slug?format=storage');
    });
  });

  describe('getStorageFileName', () => {
    it('should return .mcpb extension for mcpb type', () => {
      expect(getStorageFileName('mcp', 'test-slug', 'mcpb')).toBe('test-slug.mcpb');
    });

    it('should return .zip extension for zip type', () => {
      expect(getStorageFileName('agents', 'test-slug', 'zip')).toBe('test-slug.zip');
    });

    it('should return .zip for skills category', () => {
      expect(getStorageFileName('skills', 'test-slug')).toBe('test-slug.zip');
    });

    it('should return default zip extension', () => {
      expect(getStorageFileName('agents', 'test-slug')).toBe('test-slug.zip');
    });

    it('should handle custom file type', () => {
      expect(getStorageFileName('agents', 'test-slug', 'json')).toBe('test-slug.json');
    });
  });

  describe('getStorageBucket', () => {
    it('should return skills bucket for skills category', () => {
      expect(getStorageBucket('skills')).toBe('skills');
    });

    it('should return mcpb-packages bucket for mcp category', () => {
      expect(getStorageBucket('mcp')).toBe('mcpb-packages');
    });

    it('should return null for other categories', () => {
      expect(getStorageBucket('agents')).toBeNull();
      expect(getStorageBucket('rules')).toBeNull();
    });
  });

  describe('parseRootUri', () => {
    it('should parse file:// URI correctly', () => {
      const path = parseRootUri('file:///Users/test/.claude/packages', 'test.mcpb');
      expect(path).toBe('/Users/test/.claude/packages/test.mcpb');
    });

    it('should handle URI with trailing slash', () => {
      const path = parseRootUri('file:///Users/test/.claude/packages/', 'test.mcpb');
      expect(path).toBe('/Users/test/.claude/packages/test.mcpb');
    });

    it('should return null for non-file URIs', () => {
      expect(parseRootUri('https://example.com/path', 'test.mcpb')).toBeNull();
      expect(parseRootUri('http://example.com/path', 'test.mcpb')).toBeNull();
    });
  });
});

