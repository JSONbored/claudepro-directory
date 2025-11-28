import { describe, expect, it, vi, beforeEach } from 'vitest';
import { SeoService } from './seo.ts';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@heyclaude/database-types';

vi.mock('../utils/rpc-error-logging.ts', () => ({
  logRpcError: vi.fn(),
}));

describe('SeoService', () => {
  let service: SeoService;
  let mockSupabase: SupabaseClient<Database>;

  beforeEach(() => {
    mockSupabase = {
      rpc: vi.fn(),
    } as unknown as SupabaseClient<Database>;
    service = new SeoService(mockSupabase);
  });

  describe('getSeoMetadata', () => {
    it('returns SEO metadata on success', async () => {
      const mockData = {
        title: 'TypeScript Best Practices | HeyClaude',
        description: 'Learn TypeScript best practices for building scalable applications',
        keywords: ['typescript', 'best practices', 'programming'],
        og_image: 'https://cdn.heyclaude.com/og/typescript.png',
        canonical_url: 'https://heyclaude.com/typescript-best-practices',
      };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      } as any);

      const result = await service.getSeoMetadata({ slug: 'typescript-best-practices' });

      expect(result).toEqual(mockData);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_seo_metadata', {
        slug: 'typescript-best-practices',
      });
    });

    it('handles missing metadata gracefully', async () => {
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: null,
      } as any);

      const result = await service.getSeoMetadata({ slug: 'nonexistent-page' });

      expect(result).toBeNull();
    });

    it('throws error on database failure', async () => {
      const mockError = { message: 'Failed to fetch metadata', code: 'DB_ERROR' };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: mockError,
      } as any);

      await expect(service.getSeoMetadata({ slug: 'test-page' })).rejects.toEqual(mockError);
    });

    it('handles metadata with missing optional fields', async () => {
      const mockData = {
        title: 'Basic Page',
        description: 'A basic page description',
        // No keywords, og_image, or canonical_url
      };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      } as any);

      const result = await service.getSeoMetadata({ slug: 'basic-page' });

      expect(result).toEqual(mockData);
      expect(result?.title).toBe('Basic Page');
      expect(result?.keywords).toBeUndefined();
    });
  });
});