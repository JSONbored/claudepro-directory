import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

const getViewCountsMock = vi.fn();
const getCopyCountsMock = vi.fn();

vi.mock('@/src/lib/cache.server', () => ({
  statsRedis: {
    getViewCounts: getViewCountsMock,
    getCopyCounts: getCopyCountsMock,
  },
}));

vi.mock('@/src/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('POST /api/stats/batch', () => {
  beforeEach(() => {
    getViewCountsMock.mockReset();
    getCopyCountsMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns view and copy counts for valid payload', async () => {
    getViewCountsMock.mockResolvedValue({ 'agents:alpha': 42 });
    getCopyCountsMock.mockResolvedValue({ 'agents:alpha': 7 });

    const request = new Request('http://localhost/api/stats/batch', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            category: 'agents',
            slug: 'alpha',
          },
        ],
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data['agents:alpha']).toEqual({ viewCount: 42, copyCount: 7 });
    expect(response.headers.get('Cache-Control')).toContain('s-maxage');
  });

  it('rejects invalid payloads', async () => {
    const request = new Request('http://localhost/api/stats/batch', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ items: [] }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toBeDefined();
  });
});
