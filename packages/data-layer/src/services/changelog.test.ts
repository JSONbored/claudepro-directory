import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ChangelogService } from './changelog.ts';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@heyclaude/database-types';

vi.mock('../utils/rpc-error-logging.ts', () => ({
  logRpcError: vi.fn(),
}));

describe('ChangelogService', () => {
  let service: ChangelogService;
  let mockSupabase: SupabaseClient<Database>;

  beforeEach(() => {
    mockSupabase = {
      rpc: vi.fn(),
    } as unknown as SupabaseClient<Database>;
    service = new ChangelogService(mockSupabase);
  });

  describe('getChangelogEntries', () => {
    it('returns changelog entries on success', async () => {
      const mockData = [
        {
          id: 'entry-1',
          slug: 'new-feature-2024-01',
          title: 'New Search Feature',
          content: 'We added a powerful new search feature...',
          published_at: '2024-01-15T00:00:00Z',
          category: 'feature',
        },
        {
          id: 'entry-2',
          slug: 'bug-fixes-2024-01',
          title: 'Bug Fixes',
          content: 'Fixed several critical bugs...',
          published_at: '2024-01-10T00:00:00Z',
          category: 'fix',
        },
      ];

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      } as any);

      const result = await service.getChangelogEntries({ limit_count: 10 });

      expect(result).toEqual(mockData);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_changelog_entries', {
        limit_count: 10,
      });
    });

    it('returns empty array when no entries exist', async () => {
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: [],
        error: null,
      } as any);

      const result = await service.getChangelogEntries({ limit_count: 10 });

      expect(result).toEqual([]);
    });

    it('throws error on database failure', async () => {
      const mockError = { message: 'Failed to fetch changelog', code: 'DB_ERROR' };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: mockError,
      } as any);

      await expect(service.getChangelogEntries({ limit_count: 10 })).rejects.toEqual(mockError);
    });
  });

  describe('getChangelogBySlug', () => {
    it('returns single changelog entry on success', async () => {
      const mockData = {
        id: 'entry-1',
        slug: 'new-feature-2024-01',
        title: 'New Search Feature',
        content: 'Detailed content about the new feature...',
        published_at: '2024-01-15T00:00:00Z',
        category: 'feature',
        author: 'Engineering Team',
      };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      } as any);

      const result = await service.getChangelogBySlug({ entry_slug: 'new-feature-2024-01' });

      expect(result).toEqual(mockData);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_changelog_by_slug', {
        entry_slug: 'new-feature-2024-01',
      });
    });

    it('handles entry not found', async () => {
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: null,
      } as any);

      const result = await service.getChangelogBySlug({ entry_slug: 'nonexistent-entry' });

      expect(result).toBeNull();
    });

    it('throws error on database failure', async () => {
      const mockError = { message: 'Entry not found', code: 'PGRST116' };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: mockError,
      } as any);

      await expect(service.getChangelogBySlug({ entry_slug: 'deleted-entry' })).rejects.toEqual(
        mockError
      );
    });
  });
});