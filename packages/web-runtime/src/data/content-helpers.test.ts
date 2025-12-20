import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  generateContentTags,
  generateResourceTags,
  normalizeRpcResult,
  applyCompaniesCacheTags,
  applyChangelogCacheTags,
  applyCommunityCacheTags,
  applyMarketingCacheTags,
  applyLayoutCacheTags,
  applyAnnouncementsCacheTags,
  applyTemplatesCacheTags,
  applyContactCacheTags,
} from './content-helpers';

// Mock server-only (required for server-only modules in tests)
vi.mock('server-only', () => ({}));

// Mock next/cache
vi.mock('next/cache', () => ({
  cacheTag: vi.fn(),
}));

describe('content-helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateContentTags', () => {
    it('should generate base content tag', () => {
      const tags = generateContentTags();
      expect(tags).toEqual(['content', 'content-all']);
    });

    it('should generate category tag', () => {
      const tags = generateContentTags('agents');
      expect(tags).toEqual(['content', 'content-agents']);
    });

    it('should generate category and slug tags', () => {
      const tags = generateContentTags('agents', 'my-agent');
      expect(tags).toEqual(['content', 'content-agents', 'content-agents-my-agent']);
    });

    it('should include additional tags', () => {
      const tags = generateContentTags('agents', 'my-agent', ['featured', 'popular']);
      expect(tags).toEqual([
        'content',
        'featured',
        'popular',
        'content-agents',
        'content-agents-my-agent',
      ]);
    });

    it('should handle null category', () => {
      const tags = generateContentTags(null);
      expect(tags).toEqual(['content', 'content-all']);
    });

    it('should handle null slug', () => {
      const tags = generateContentTags('agents', null);
      expect(tags).toEqual(['content', 'content-agents']);
    });
  });

  describe('generateResourceTags', () => {
    it('should generate base resource tag', () => {
      const tags = generateResourceTags('jobs');
      expect(tags).toEqual(['jobs']);
    });

    it('should generate resource tag with ID', () => {
      const tags = generateResourceTags('jobs', 'job-123');
      expect(tags).toEqual(['jobs', 'jobs-job-123']);
    });

    it('should include additional tags', () => {
      const tags = generateResourceTags('jobs', 'job-123', ['featured']);
      expect(tags).toEqual(['jobs', 'featured', 'jobs-job-123']);
    });

    it('should handle null resourceId', () => {
      const tags = generateResourceTags('companies', null);
      expect(tags).toEqual(['companies']);
    });
  });

  describe('normalizeRpcResult', () => {
    it('should return null for null input', () => {
      expect(normalizeRpcResult(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(normalizeRpcResult(undefined)).toBeNull();
    });

    it('should return single value as-is', () => {
      const result = { id: '1', name: 'Test' };
      expect(normalizeRpcResult(result)).toEqual(result);
    });

    it('should return first item from array', () => {
      const result = [{ id: '1' }, { id: '2' }];
      expect(normalizeRpcResult(result)).toEqual({ id: '1' });
    });

    it('should return null for empty array', () => {
      expect(normalizeRpcResult([])).toBeNull();
    });

    it('should return null for array with null first element', () => {
      const result = [null, { id: '2' }];
      expect(normalizeRpcResult(result)).toBeNull();
    });
  });

  describe('applyCompaniesCacheTags', () => {
    it('should apply companies cache tags without slug', async () => {
      const { cacheTag } = await import('next/cache');
      applyCompaniesCacheTags();
      expect(cacheTag).toHaveBeenCalledWith('companies');
    });

    it('should apply companies cache tags with slug', async () => {
      const { cacheTag } = await import('next/cache');
      applyCompaniesCacheTags('acme-corp');
      expect(cacheTag).toHaveBeenCalledWith('companies');
      expect(cacheTag).toHaveBeenCalledWith('company-acme-corp');
    });

    it('should include additional tags', async () => {
      const { cacheTag } = await import('next/cache');
      applyCompaniesCacheTags('acme-corp', ['featured']);
      expect(cacheTag).toHaveBeenCalledWith('companies');
      expect(cacheTag).toHaveBeenCalledWith('featured');
      expect(cacheTag).toHaveBeenCalledWith('company-acme-corp');
    });
  });

  describe('applyChangelogCacheTags', () => {
    it('should apply changelog cache tags without slug', async () => {
      const { cacheTag } = await import('next/cache');
      applyChangelogCacheTags();
      expect(cacheTag).toHaveBeenCalledWith('changelog');
    });

    it('should apply changelog cache tags with slug', async () => {
      const { cacheTag } = await import('next/cache');
      applyChangelogCacheTags('v1-0-0');
      expect(cacheTag).toHaveBeenCalledWith('changelog');
      expect(cacheTag).toHaveBeenCalledWith('changelog-v1-0-0');
    });
  });

  describe('applyCommunityCacheTags', () => {
    it('should apply community cache tags', async () => {
      const { cacheTag } = await import('next/cache');
      applyCommunityCacheTags();
      expect(cacheTag).toHaveBeenCalledWith('community');
    });

    it('should include additional tags', async () => {
      const { cacheTag } = await import('next/cache');
      applyCommunityCacheTags(['stats']);
      expect(cacheTag).toHaveBeenCalledWith('community');
      expect(cacheTag).toHaveBeenCalledWith('stats');
    });
  });

  describe('applyMarketingCacheTags', () => {
    it('should apply marketing cache tags', async () => {
      const { cacheTag } = await import('next/cache');
      applyMarketingCacheTags();
      expect(cacheTag).toHaveBeenCalledWith('marketing');
    });
  });

  describe('applyLayoutCacheTags', () => {
    it('should apply layout cache tags', async () => {
      const { cacheTag } = await import('next/cache');
      applyLayoutCacheTags();
      expect(cacheTag).toHaveBeenCalledWith('layout');
    });
  });

  describe('applyAnnouncementsCacheTags', () => {
    it('should apply announcements cache tags', async () => {
      const { cacheTag } = await import('next/cache');
      applyAnnouncementsCacheTags();
      expect(cacheTag).toHaveBeenCalledWith('announcements');
    });
  });

  describe('applyTemplatesCacheTags', () => {
    it('should apply templates cache tags without category', async () => {
      const { cacheTag } = await import('next/cache');
      applyTemplatesCacheTags();
      expect(cacheTag).toHaveBeenCalledWith('templates');
    });

    it('should apply templates cache tags with category', async () => {
      const { cacheTag } = await import('next/cache');
      applyTemplatesCacheTags('agents');
      expect(cacheTag).toHaveBeenCalledWith('templates');
      expect(cacheTag).toHaveBeenCalledWith('templates-agents');
    });
  });

  describe('applyContactCacheTags', () => {
    it('should apply contact cache tags', async () => {
      const { cacheTag } = await import('next/cache');
      applyContactCacheTags();
      expect(cacheTag).toHaveBeenCalledWith('contact');
    });
  });
});
