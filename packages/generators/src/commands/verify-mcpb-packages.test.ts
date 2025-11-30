import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runVerifyMcpbPackages } from './verify-mcpb-packages';

// Mock dependencies
const mockSupabaseFrom = vi.fn();
const mockSupabaseStorage = vi.fn();
const mockCreateServiceRoleClient = vi.fn(() => ({
  from: mockSupabaseFrom,
  storage: {
    from: mockSupabaseStorage,
  },
}));

vi.mock('../toolkit/supabase', () => ({
  createServiceRoleClient: mockCreateServiceRoleClient,
  DEFAULT_SUPABASE_URL: 'https://test.supabase.co',
}));

const mockEnsureEnvVars = vi.fn();
vi.mock('../toolkit/env', () => ({
  ensureEnvVars: mockEnsureEnvVars,
}));

const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};
vi.mock('../toolkit/logger', () => ({
  logger: mockLogger,
}));

describe('runVerifyMcpbPackages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  });

  it('should verify that all MCP content has packages', async () => {
    const mockMcpContent = [
      {
        id: '1',
        slug: 'test-mcp-1',
        title: 'Test MCP 1',
        mcpb_storage_url: 'https://storage.com/test-mcp-1.mcpb',
        mcpb_build_hash: 'hash1',
        mcpb_last_built_at: '2024-01-01',
      },
      {
        id: '2',
        slug: 'test-mcp-2',
        title: 'Test MCP 2',
        mcpb_storage_url: 'https://storage.com/test-mcp-2.mcpb',
        mcpb_build_hash: 'hash2',
        mcpb_last_built_at: '2024-01-01',
      },
    ];

    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockMcpContent,
            error: null,
          }),
        }),
      }),
    });

    // Mock storage checks - both files exist
    mockSupabaseStorage.mockReturnValue({
      list: vi.fn()
        .mockResolvedValueOnce({
          data: [{ name: 'test-mcp-1.mcpb' }],
          error: null,
        })
        .mockResolvedValueOnce({
          data: [{ name: 'test-mcp-2.mcpb' }],
          error: null,
        }),
    });

    const result = await runVerifyMcpbPackages();

    expect(result).toEqual({
      total_mcp_content: 2,
      with_packages: 2,
      missing_packages: 0,
      missing_packages_list: [],
      storage_mismatches: 0,
      storage_mismatches_list: [],
    });

    expect(mockEnsureEnvVars).toHaveBeenCalledWith(['SUPABASE_SERVICE_ROLE_KEY']);
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('All MCP content has valid packages'),
      expect.any(Object)
    );
  });

  it('should identify missing packages', async () => {
    const mockMcpContent = [
      {
        id: '1',
        slug: 'with-package',
        title: 'Has Package',
        mcpb_storage_url: 'https://storage.com/with-package.mcpb',
        mcpb_build_hash: 'hash1',
        mcpb_last_built_at: '2024-01-01',
      },
      {
        id: '2',
        slug: 'without-package',
        title: 'No Package',
        mcpb_storage_url: null,
        mcpb_build_hash: null,
        mcpb_last_built_at: null,
      },
      {
        id: '3',
        slug: 'empty-package',
        title: 'Empty Package',
        mcpb_storage_url: '   ',
        mcpb_build_hash: null,
        mcpb_last_built_at: null,
      },
    ];

    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockMcpContent,
            error: null,
          }),
        }),
      }),
    });

    mockSupabaseStorage.mockReturnValue({
      list: vi.fn().mockResolvedValue({
        data: [{ name: 'with-package.mcpb' }],
        error: null,
      }),
    });

    const result = await runVerifyMcpbPackages();

    expect(result.missing_packages).toBe(2);
    expect(result.missing_packages_list).toHaveLength(2);
    expect(result.missing_packages_list).toEqual(
      expect.arrayContaining([
        { id: '2', slug: 'without-package', title: 'No Package' },
        { id: '3', slug: 'empty-package', title: 'Empty Package' },
      ])
    );
  });

  it('should identify storage mismatches', async () => {
    const mockMcpContent = [
      {
        id: '1',
        slug: 'has-url-no-file',
        title: 'URL but no file',
        mcpb_storage_url: 'https://storage.com/has-url-no-file.mcpb',
        mcpb_build_hash: 'hash1',
        mcpb_last_built_at: '2024-01-01',
      },
      {
        id: '2',
        slug: 'valid-entry',
        title: 'Valid Entry',
        mcpb_storage_url: 'https://storage.com/valid-entry.mcpb',
        mcpb_build_hash: 'hash2',
        mcpb_last_built_at: '2024-01-01',
      },
    ];

    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockMcpContent,
            error: null,
          }),
        }),
      }),
    });

    // First storage check fails, second succeeds
    mockSupabaseStorage.mockReturnValue({
      list: vi.fn()
        .mockResolvedValueOnce({
          data: [],
          error: null,
        })
        .mockResolvedValueOnce({
          data: [{ name: 'valid-entry.mcpb' }],
          error: null,
        }),
    });

    const result = await runVerifyMcpbPackages();

    expect(result.storage_mismatches).toBe(1);
    expect(result.storage_mismatches_list).toEqual([
      {
        id: '1',
        slug: 'has-url-no-file',
        has_db_url: true,
        has_storage_file: false,
      },
    ]);
  });

  it('should handle empty MCP content', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    });

    const result = await runVerifyMcpbPackages();

    expect(result).toEqual({
      total_mcp_content: 0,
      with_packages: 0,
      missing_packages: 0,
      missing_packages_list: [],
      storage_mismatches: 0,
      storage_mismatches_list: [],
    });

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('No MCP content found'),
      expect.any(Object)
    );
  });

  it('should throw error on database fetch failure', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      }),
    });

    await expect(runVerifyMcpbPackages()).rejects.toThrow('Failed to fetch MCP content');
  });

  it('should handle storage list errors gracefully', async () => {
    const mockMcpContent = [
      {
        id: '1',
        slug: 'test-mcp',
        title: 'Test MCP',
        mcpb_storage_url: 'https://storage.com/test-mcp.mcpb',
        mcpb_build_hash: 'hash1',
        mcpb_last_built_at: '2024-01-01',
      },
    ];

    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockMcpContent,
            error: null,
          }),
        }),
      }),
    });

    mockSupabaseStorage.mockReturnValue({
      list: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Storage error' },
      }),
    });

    const result = await runVerifyMcpbPackages();

    // Should treat as missing file
    expect(result.storage_mismatches).toBe(1);
  });

  it('should warn when NEXT_PUBLIC_SUPABASE_URL is not set', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    });

    await runVerifyMcpbPackages();

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('NEXT_PUBLIC_SUPABASE_URL not set'),
      expect.any(Object)
    );
  });

  it('should handle entries with null title', async () => {
    const mockMcpContent = [
      {
        id: '1',
        slug: 'no-title',
        title: null,
        mcpb_storage_url: null,
        mcpb_build_hash: null,
        mcpb_last_built_at: null,
      },
    ];

    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockMcpContent,
            error: null,
          }),
        }),
      }),
    });

    const result = await runVerifyMcpbPackages();

    expect(result.missing_packages_list[0]).toEqual({
      id: '1',
      slug: 'no-title',
      title: null,
    });
  });
});