import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { runGenerateReadme } from './generate-readme.ts';
import type { Database } from '@heyclaude/database-types';

// Mock dependencies
vi.mock('../toolkit/env.ts', () => ({
  ensureEnvVars: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../toolkit/logger.ts', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('node:fs', () => ({
  writeFileSync: vi.fn(),
}));

vi.mock('../utils/paths.ts', () => ({
  resolveRepoPath: vi.fn(() => '/test/repo'),
}));

vi.mock('../utils/readme-builder.ts', () => ({
  buildReadmeMarkdown: vi.fn((data) => `# README\n\nTotal: ${data.total_count}`),
}));

type ReadmeData = Database['public']['Functions']['generate_readme_data']['Returns'];

describe('runGenerateReadme', () => {
  const mockFetch = vi.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch as any;
    process.env['NEXT_PUBLIC_SITE_URL'] = 'http://localhost:3000';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env['NEXT_PUBLIC_SITE_URL'];
  });

  it('should generate README successfully', async () => {
    const mockData: ReadmeData = {
      categories: [{ title: 'Test', description: 'Test', icon_name: 'Code', url_slug: 'test', items: [] }],
      total_count: 1,
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockData,
      text: async () => JSON.stringify(mockData),
    });

    await runGenerateReadme();

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/content/sitewide?format=readme',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('should throw on API error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => 'Server error',
    });

    await expect(runGenerateReadme()).rejects.toThrow('API request failed');
  });

  it('should validate content size', async () => {
    const largeContent = 'x'.repeat(2 * 1024 * 1024); // 2MB
    const mockData: ReadmeData = { categories: [], total_count: 0 };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const { buildReadmeMarkdown } = await import('../utils/readme-builder.ts');
    vi.mocked(buildReadmeMarkdown).mockReturnValue(largeContent);

    await expect(runGenerateReadme()).rejects.toThrow('README content too large');
  });

  it('should reject empty content', async () => {
    const mockData: ReadmeData = { categories: [], total_count: 0 };
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const { buildReadmeMarkdown } = await import('../utils/readme-builder.ts');
    vi.mocked(buildReadmeMarkdown).mockReturnValue('   ');

    await expect(runGenerateReadme()).rejects.toThrow('README content is empty');
  });

  it('should reject paths outside repository', async () => {
    const mockData: ReadmeData = { categories: [], total_count: 0 };
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    // Reset buildReadmeMarkdown mock to return valid content
    const { buildReadmeMarkdown } = await import('../utils/readme-builder.ts');
    vi.mocked(buildReadmeMarkdown).mockReturnValue('# Valid README');

    await expect(runGenerateReadme({ outputPath: '/../etc/passwd' })).rejects.toThrow('outside repository root');
  });
});