import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CompaniesService } from './companies.ts';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@heyclaude/database-types';

// Mock the RPC error logging utility
vi.mock('../utils/rpc-error-logging.ts', () => ({
  logRpcError: vi.fn(),
}));

describe('CompaniesService', () => {
  let service: CompaniesService;
  let mockSupabase: SupabaseClient<Database>;

  beforeEach(() => {
    mockSupabase = {
      rpc: vi.fn(),
    } as unknown as SupabaseClient<Database>;
    service = new CompaniesService(mockSupabase);
  });

  describe('getCompanyAdminProfile', () => {
    it('returns company admin profile data on success', async () => {
      const mockData = {
        id: 'company-1',
        slug: 'test-company',
        name: 'Test Company',
        description: 'A test company',
        website: 'https://test.com',
        is_verified: true,
        created_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      } as any);

      const result = await service.getCompanyAdminProfile({ company_id: 'company-1' });

      expect(result).toEqual(mockData);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_company_admin_profile', {
        company_id: 'company-1',
      });
    });

    it('throws error when RPC call fails', async () => {
      const mockError = { message: 'Database error', code: 'PGRST116' };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: mockError,
      } as any);

      await expect(service.getCompanyAdminProfile({ company_id: 'company-1' })).rejects.toEqual(
        mockError
      );
    });

    it('handles null data gracefully', async () => {
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: null,
      } as any);

      const result = await service.getCompanyAdminProfile({ company_id: 'nonexistent' });

      expect(result).toBeNull();
    });
  });

  describe('getCompanyProfile', () => {
    it('returns company profile data on success', async () => {
      const mockData = {
        id: 'company-1',
        slug: 'test-company',
        name: 'Test Company',
        description: 'A test company',
        website: 'https://test.com',
        logo_url: 'https://test.com/logo.png',
        job_count: 5,
      };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      } as any);

      const result = await service.getCompanyProfile({ company_slug: 'test-company' });

      expect(result).toEqual(mockData);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_company_profile', {
        company_slug: 'test-company',
      });
    });

    it('throws error when company not found', async () => {
      const mockError = { message: 'Company not found', code: 'PGRST116' };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: mockError,
      } as any);

      await expect(service.getCompanyProfile({ company_slug: 'nonexistent' })).rejects.toEqual(
        mockError
      );
    });
  });

  describe('getCompaniesList', () => {
    it('returns list of companies on success', async () => {
      const mockData = [
        { id: 'company-1', slug: 'company-1', name: 'Company 1', job_count: 3 },
        { id: 'company-2', slug: 'company-2', name: 'Company 2', job_count: 1 },
      ];

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      } as any);

      const result = await service.getCompaniesList({ limit_count: 10, offset_count: 0 });

      expect(result).toEqual(mockData);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_companies_list', {
        limit_count: 10,
        offset_count: 0,
      });
    });

    it('returns empty array when no companies exist', async () => {
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: [],
        error: null,
      } as any);

      const result = await service.getCompaniesList({ limit_count: 10, offset_count: 0 });

      expect(result).toEqual([]);
    });

    it('throws error on database failure', async () => {
      const mockError = { message: 'Connection timeout', code: 'ETIMEDOUT' };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: mockError,
      } as any);

      await expect(
        service.getCompaniesList({ limit_count: 10, offset_count: 0 })
      ).rejects.toEqual(mockError);
    });

    it('handles pagination correctly', async () => {
      const mockData = [{ id: 'company-11', slug: 'company-11', name: 'Company 11' }];

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      } as any);

      const result = await service.getCompaniesList({ limit_count: 10, offset_count: 10 });

      expect(result).toEqual(mockData);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_companies_list', {
        limit_count: 10,
        offset_count: 10,
      });
    });
  });
});