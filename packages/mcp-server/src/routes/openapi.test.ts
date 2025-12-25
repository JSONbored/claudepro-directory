/**
 * Tests for OpenAPI Route
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { handleOpenAPI } from '@heyclaude/mcp-server/routes/openapi';
import * as fs from 'node:fs/promises';
import * as fsSync from 'node:fs';
import * as path from 'node:path';

// Mock filesystem operations
jest.mock('node:fs/promises', () => ({
  readFile: jest.fn(),
}));

jest.mock('node:fs', () => ({
  existsSync: jest.fn(),
}));

describe('OpenAPI Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 404 when spec file does not exist', async () => {
    (fsSync.existsSync as ReturnType<typeof jest.fn>).mockReturnValue(false);

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

    (fsSync.existsSync as ReturnType<typeof jest.fn>).mockReturnValue(true);
    (fs.readFile as ReturnType<typeof jest.fn>).mockResolvedValue(JSON.stringify(mockSpec));

    const response = await handleOpenAPI();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.openapi).toBe('3.1.0');
    expect(data.info.title).toBe('MCP Server API');
  });

  it('should handle filesystem errors gracefully', async () => {
    (fsSync.existsSync as ReturnType<typeof jest.fn>).mockReturnValue(true);
    (fs.readFile as ReturnType<typeof jest.fn>).mockRejectedValue(new Error('Permission denied'));

    const response = await handleOpenAPI();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to read OpenAPI spec');
    expect(data.message).toBe('Permission denied');
  });

  it('should set correct headers', async () => {
    const mockSpec = { openapi: '3.1.0', info: { title: 'Test' } };
    (fsSync.existsSync as ReturnType<typeof jest.fn>).mockReturnValue(true);
    (fs.readFile as ReturnType<typeof jest.fn>).mockResolvedValue(JSON.stringify(mockSpec));

    const response = await handleOpenAPI();

    expect(response.headers.get('Content-Type')).toBe('application/json');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Cache-Control')).toContain('max-age=3600');
  });
});
