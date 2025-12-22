/**
 * Tests for OpenAPI Route
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleOpenAPI } from '../../../../packages/mcp-server/src/routes/openapi.js';
import * as fs from 'node:fs/promises';
import * as fsSync from 'node:fs';
import * as path from 'node:path';

// Mock filesystem operations
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
}));

describe('OpenAPI Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 404 when spec file does not exist', async () => {
    vi.mocked(fsSync.existsSync).mockReturnValue(false);

    const response = await handleOpenAPI();
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('OpenAPI spec not found');
    expect(data.message).toContain('generate');
  });

  it('should return spec file when it exists', async () => {
    const mockSpec = {
      openapi: '3.1.0',
      info: {
        title: 'MCP Server API',
        version: '1.0.0',
      },
    };

    vi.mocked(fsSync.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockSpec));

    const response = await handleOpenAPI();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.openapi).toBe('3.1.0');
    expect(data.info.title).toBe('MCP Server API');
  });

  it('should handle filesystem errors gracefully', async () => {
    vi.mocked(fsSync.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFile).mockRejectedValue(new Error('Permission denied'));

    const response = await handleOpenAPI();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to read OpenAPI spec');
    expect(data.message).toBe('Permission denied');
  });

  it('should set correct headers', async () => {
    const mockSpec = { openapi: '3.1.0', info: { title: 'Test' } };
    vi.mocked(fsSync.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockSpec));

    const response = await handleOpenAPI();

    expect(response.headers.get('Content-Type')).toBe('application/json');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Cache-Control')).toContain('max-age=3600');
  });
});

