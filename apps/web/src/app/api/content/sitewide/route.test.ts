import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GET, OPTIONS } from './route.ts';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@heyclaude/data-layer', () => ({
  ContentService: vi.fn().mockImplementation(() => ({
    getSitewideReadme: vi.fn(),
    getSitewideLlmsTxt: vi.fn(),
  })),
}));

vi.mock('@heyclaude/web-runtime/server', () => ({
  createSupabaseAnonClient: vi.fn(() => ({})),
  badRequestResponse: vi.fn((message, cors) => 
    new Response(JSON.stringify({ error: message }), { 
      status: 400,
      headers: cors 
    })
  ),
  getOnlyCorsHeaders: {
    'Access-Control-Allow-Origin': '*',
  },
  buildCacheHeaders: vi.fn(() => ({
    'Cache-Control': 'public, max-age=3600',
  })),
}));

vi.mock('@heyclaude/shared-runtime', () => ({
  buildSecurityHeaders: vi.fn(() => ({
    'X-Content-Type-Options': 'nosniff',
  })),
}));

vi.mock('@heyclaude/web-runtime/logging/server', () => ({
  generateRequestId: vi.fn(() => 'test-request-id'),
  logger: {
    child: vi.fn(() => ({
      info: vi.fn(),
      error: vi.fn(),
    })),
  },
  normalizeError: vi.fn((e) => e),
  createErrorResponse: vi.fn((error) => 
    new Response(JSON.stringify({ error: String(error) }), { status: 500 })
  ),
}));

describe('Sitewide Content API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/content/sitewide', () => {
    it('should return README data when format=readme', async () => {
      const { ContentService } = await import('@heyclaude/data-layer');
      const mockService = {
        getSitewideReadme: vi.fn().mockResolvedValue({
          categories: [],
          total_count: 0,
        }),
      };
      vi.mocked(ContentService).mockImplementation(() => mockService as any);

      const request = new NextRequest('http://localhost:3000/api/content/sitewide?format=readme');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('application/json');
      expect(data).toHaveProperty('categories');
      expect(data).toHaveProperty('total_count');
    });

    it('should return llms.txt when format=llms', async () => {
      const { ContentService } = await import('@heyclaude/data-layer');
      const mockService = {
        getSitewideLlmsTxt: vi.fn().mockResolvedValue('# LLMs.txt content\\nTest data'),
      };
      vi.mocked(ContentService).mockImplementation(() => mockService as any);

      const request = new NextRequest('http://localhost:3000/api/content/sitewide?format=llms');
      const response = await GET(request);
      const text = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('text/plain');
      expect(text).toContain('# LLMs.txt content');
    });

    it('should default to llms format when no format specified', async () => {
      const { ContentService } = await import('@heyclaude/data-layer');
      const mockService = {
        getSitewideLlmsTxt: vi.fn().mockResolvedValue('Default content'),
      };
      vi.mocked(ContentService).mockImplementation(() => mockService as any);

      const request = new NextRequest('http://localhost:3000/api/content/sitewide');
      const response = await GET(request);
      const text = await response.text();

      expect(response.status).toBe(200);
      expect(text).toBe('Default content');
    });

    it('should return 400 for invalid format', async () => {
      const request = new NextRequest('http://localhost:3000/api/content/sitewide?format=invalid');
      const response = await GET(request);

      expect(response.status).toBe(400);
    });

    it('should handle null data from getSitewideLlmsTxt', async () => {
      const { ContentService } = await import('@heyclaude/data-layer');
      const mockService = {
        getSitewideLlmsTxt: vi.fn().mockResolvedValue(null),
      };
      vi.mocked(ContentService).mockImplementation(() => mockService as any);

      const request = new NextRequest('http://localhost:3000/api/content/sitewide?format=llms');
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    it('should replace escaped newlines in llms.txt', async () => {
      const { ContentService } = await import('@heyclaude/data-layer');
      const mockService = {
        getSitewideLlmsTxt: vi.fn().mockResolvedValue('Line 1\\nLine 2\\nLine 3'),
      };
      vi.mocked(ContentService).mockImplementation(() => mockService as any);

      const request = new NextRequest('http://localhost:3000/api/content/sitewide?format=llms');
      const response = await GET(request);
      const text = await response.text();

      expect(text).toBe('Line 1\nLine 2\nLine 3');
      expect(text).not.toContain('\\n');
    });

    it('should include security headers', async () => {
      const { ContentService } = await import('@heyclaude/data-layer');
      const mockService = {
        getSitewideLlmsTxt: vi.fn().mockResolvedValue('content'),
      };
      vi.mocked(ContentService).mockImplementation(() => mockService as any);

      const request = new NextRequest('http://localhost:3000/api/content/sitewide?format=llms');
      const response = await GET(request);

      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });

    it('should include cache headers', async () => {
      const { ContentService } = await import('@heyclaude/data-layer');
      const mockService = {
        getSitewideLlmsTxt: vi.fn().mockResolvedValue('content'),
      };
      vi.mocked(ContentService).mockImplementation(() => mockService as any);

      const request = new NextRequest('http://localhost:3000/api/content/sitewide?format=llms');
      const response = await GET(request);

      expect(response.headers.get('Cache-Control')).toBeTruthy();
    });

    it('should include X-Generated-By header for llms format', async () => {
      const { ContentService } = await import('@heyclaude/data-layer');
      const mockService = {
        getSitewideLlmsTxt: vi.fn().mockResolvedValue('content'),
      };
      vi.mocked(ContentService).mockImplementation(() => mockService as any);

      const request = new NextRequest('http://localhost:3000/api/content/sitewide?format=llms');
      const response = await GET(request);

      expect(response.headers.get('X-Generated-By')).toBe('supabase.rpc.generate_sitewide_llms_txt');
    });

    it('should include X-Generated-By header for readme format', async () => {
      const { ContentService } = await import('@heyclaude/data-layer');
      const mockService = {
        getSitewideReadme: vi.fn().mockResolvedValue({ categories: [], total_count: 0 }),
      };
      vi.mocked(ContentService).mockImplementation(() => mockService as any);

      const request = new NextRequest('http://localhost:3000/api/content/sitewide?format=readme');
      const response = await GET(request);

      expect(response.headers.get('X-Generated-By')).toBe('supabase.rpc.generate_readme_data');
    });

    it('should handle errors gracefully', async () => {
      const { ContentService } = await import('@heyclaude/data-layer');
      const mockService = {
        getSitewideLlmsTxt: vi.fn().mockRejectedValue(new Error('Database error')),
      };
      vi.mocked(ContentService).mockImplementation(() => mockService as any);

      const request = new NextRequest('http://localhost:3000/api/content/sitewide?format=llms');
      const response = await GET(request);

      expect(response.status).toBe(500);
    });

    it('should accept llms-txt as alias for llms format', async () => {
      const { ContentService } = await import('@heyclaude/data-layer');
      const mockService = {
        getSitewideLlmsTxt: vi.fn().mockResolvedValue('content'),
      };
      vi.mocked(ContentService).mockImplementation(() => mockService as any);

      const request = new NextRequest('http://localhost:3000/api/content/sitewide?format=llms-txt');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockService.getSitewideLlmsTxt).toHaveBeenCalled();
    });
  });

  describe('OPTIONS /api/content/sitewide', () => {
    it('should return 204 with CORS headers', () => {
      const response = OPTIONS();

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });
});