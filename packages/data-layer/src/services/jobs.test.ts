import { describe, expect, it, vi, beforeEach } from 'vitest';
import { JobsService } from './jobs.ts';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@heyclaude/database-types';

vi.mock('../utils/rpc-error-logging.ts', () => ({
  logRpcError: vi.fn(),
}));

describe('JobsService', () => {
  let service: JobsService;
  let mockSupabase: SupabaseClient<Database>;

  beforeEach(() => {
    mockSupabase = {
      rpc: vi.fn(),
    } as unknown as SupabaseClient<Database>;
    service = new JobsService(mockSupabase);
  });

  describe('getJobs', () => {
    it('returns list of jobs on success', async () => {
      const mockData = [
        {
          id: 'job-1',
          slug: 'senior-developer',
          title: 'Senior Developer',
          company_name: 'Test Company',
          location: 'Remote',
          salary_range: '$100k-$150k',
          posted_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'job-2',
          slug: 'junior-designer',
          title: 'Junior Designer',
          company_name: 'Design Co',
          location: 'San Francisco',
          salary_range: '$60k-$80k',
          posted_at: '2024-01-02T00:00:00Z',
        },
      ];

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      } as any);

      const result = await service.getJobs();

      expect(result).toEqual(mockData);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_jobs_list');
    });

    it('returns empty array when no jobs exist', async () => {
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: [],
        error: null,
      } as any);

      const result = await service.getJobs();

      expect(result).toEqual([]);
    });

    it('throws error on database failure', async () => {
      const mockError = { message: 'Database connection failed', code: 'CONNECTION_ERROR' };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: mockError,
      } as any);

      await expect(service.getJobs()).rejects.toEqual(mockError);
    });
  });

  describe('getJobBySlug', () => {
    it('returns job detail on success', async () => {
      const mockData = {
        id: 'job-1',
        slug: 'senior-developer',
        title: 'Senior Developer',
        description: 'We are looking for a senior developer...',
        company_id: 'company-1',
        company_name: 'Test Company',
        company_logo: 'https://test.com/logo.png',
        location: 'Remote',
        salary_range: '$100k-$150k',
        employment_type: 'full-time',
        skills: ['TypeScript', 'React', 'Node.js'],
        posted_at: '2024-01-01T00:00:00Z',
        expires_at: '2024-02-01T00:00:00Z',
        is_active: true,
      };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      } as any);

      const result = await service.getJobBySlug({ job_slug: 'senior-developer' });

      expect(result).toEqual(mockData);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_job_detail', {
        job_slug: 'senior-developer',
      });
    });

    it('handles job not found', async () => {
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: null,
      } as any);

      const result = await service.getJobBySlug({ job_slug: 'nonexistent-job' });

      expect(result).toBeNull();
    });

    it('throws error on database failure', async () => {
      const mockError = { message: 'Job not found', code: 'PGRST116' };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: mockError,
      } as any);

      await expect(service.getJobBySlug({ job_slug: 'deleted-job' })).rejects.toEqual(mockError);
    });

    it('handles expired jobs', async () => {
      const mockData = {
        id: 'job-expired',
        slug: 'expired-job',
        title: 'Expired Job',
        is_active: false,
        expires_at: '2023-01-01T00:00:00Z',
      };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      } as any);

      const result = await service.getJobBySlug({ job_slug: 'expired-job' });

      expect(result).toEqual(mockData);
      expect(result?.is_active).toBe(false);
    });
  });
});