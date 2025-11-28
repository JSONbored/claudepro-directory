import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ContentService } from './content.ts';
import type { Database } from '@heyclaude/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock rpc-error-logging
vi.mock('../utils/rpc-error-logging.ts', () => ({
  logRpcError: vi.fn(),
}));

describe('ContentService', () => {
  let mockSupabase: SupabaseClient<Database>;
  let contentService: ContentService;

  beforeEach(() => {
    // Create mock Supabase client
    mockSupabase = {
      rpc: vi.fn(),
    } as unknown as SupabaseClient<Database>;

    contentService = new ContentService(mockSupabase);
  });

  describe('getSitewideReadme', () => {
    it('should return README data on success', async () => {
      const mockData = {
        readme_content: '# Test README',
        last_updated: '2024-01-01',
      };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await contentService.getSitewideReadme();

      expect(mockSupabase.rpc).toHaveBeenCalledWith('generate_readme_data');
      expect(result).toEqual(mockData);
    });

    it('should throw error when RPC fails', async () => {
      const mockError = {
        message: 'Database error',
        code: 'PGRST116',
      };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(contentService.getSitewideReadme()).rejects.toThrow();
      expect(mockSupabase.rpc).toHaveBeenCalledWith('generate_readme_data');
    });

    it('should handle null data gracefully', async () => {
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await contentService.getSitewideReadme();
      expect(result).toBeNull();
    });
  });

  describe('getSitewideLlmsTxt', () => {
    it('should return llms.txt data on success', async () => {
      const mockData = {
        content: '# LLMs.txt content',
        categories: ['agents', 'skills'],
      };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await contentService.getSitewideLlmsTxt();

      expect(mockSupabase.rpc).toHaveBeenCalledWith('generate_sitewide_llms_txt');
      expect(result).toEqual(mockData);
    });

    it('should throw error on RPC failure', async () => {
      const mockError = {
        message: 'RPC timeout',
        code: 'TIMEOUT',
      };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(contentService.getSitewideLlmsTxt()).rejects.toThrow();
    });
  });

  describe('getChangelogLlmsTxt', () => {
    it('should return changelog llms.txt data', async () => {
      const mockData = {
        content: '# Changelog',
        entries: [],
      };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await contentService.getChangelogLlmsTxt();

      expect(mockSupabase.rpc).toHaveBeenCalledWith('generate_changelog_llms_txt');
      expect(result).toEqual(mockData);
    });

    it('should handle empty changelog data', async () => {
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: { content: '', entries: [] },
        error: null,
      });

      const result = await contentService.getChangelogLlmsTxt();
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('entries');
    });
  });

  describe('error handling', () => {
    it('should log errors with proper context', async () => {
      const { logRpcError } = await import('../utils/rpc-error-logging.ts');
      const mockError = { message: 'Test error', code: 'ERR' };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(contentService.getSitewideReadme()).rejects.toThrow();
      expect(logRpcError).toHaveBeenCalledWith(mockError, {
        rpcName: 'generate_readme_data',
        operation: 'ContentService.getSitewideReadme',
      });
    });

    it('should propagate database connection errors', async () => {
      vi.mocked(mockSupabase.rpc).mockRejectedValue(new Error('Connection refused'));

      await expect(contentService.getSitewideReadme()).rejects.toThrow('Connection refused');
    });
  });
});