/**
 * Tests for downloadMcpServerPackage Tool Handler
 *
 * Tests the tool that downloads MCP server .mcpb files from Supabase Storage.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { handleDownloadMcpServerPackage } from './download-mcp-server-package.js';
import {
  createMockLogger,
  createMockEnv,
  createMockUser,
  createMockToken,
  createMockKvCache,
} from '../../__tests__/test-utils.ts';
import type { ToolContext } from '../../types/runtime.js';

describe('downloadMcpServerPackage Tool Handler', () => {
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockEnv: ReturnType<typeof createMockEnv>;
  let context: ToolContext;
  let mockElicit: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();

    mockLogger = createMockLogger();
    mockEnv = createMockEnv({
      APP_URL: 'https://claudepro.directory',
    });
    mockElicit = jest.fn();
    context = {
      prisma: {} as any,
      user: createMockUser() as any,
      token: createMockToken().access_token,
      env: mockEnv as any,
      logger: mockLogger,
      kvCache: createMockKvCache(),
      elicit: mockElicit,
    };
  });

  describe('Unit Tests', () => {
    it('should generate download URL for MCP server package', async () => {
      const result = await handleDownloadMcpServerPackage({ slug: 'test-server' }, context);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('test-server');
      expect(result.content[0].text).toContain('Download URL');
      expect(result._meta.success).toBe(true);
      expect(result._meta.slug).toBe('test-server');
      expect(result._meta.fileName).toBe('test-server.mcpb');
      expect(result._meta.downloadUrl).toContain('/api/v1/content/mcp/test-server?format=storage');
      expect(result._meta.mimeType).toBe('application/zip');
    });

    it('should validate slug format', async () => {
      await expect(
        handleDownloadMcpServerPackage({ slug: 'invalid slug!' }, context)
      ).rejects.toThrow('Invalid slug format');
    });

    it('should handle rootUri with elicitation confirmation', async () => {
      mockElicit.mockResolvedValueOnce(true);

      const result = await handleDownloadMcpServerPackage(
        { slug: 'test-server', rootUri: 'file:///Users/test/.claude/mcp' },
        context
      );

      expect(mockElicit).toHaveBeenCalledWith({
        type: 'boolean',
        description: expect.stringContaining('test-server'),
      });
      expect(result._meta.success).toBe(true);
      expect(result._meta.filePath).toBe('/Users/test/.claude/mcp/test-server.mcpb');
      expect(result._meta.rootUri).toBe('file:///Users/test/.claude/mcp');
    });

    it('should cancel download if user declines elicitation', async () => {
      mockElicit.mockResolvedValueOnce(false);

      await expect(
        handleDownloadMcpServerPackage(
          { slug: 'test-server', rootUri: 'file:///Users/test/.claude/mcp' },
          context
        )
      ).rejects.toThrow('Download cancelled by user');
    });

    it('should elicit rootUri if not provided', async () => {
      mockElicit.mockResolvedValueOnce('file:///Users/test/.claude/mcp');

      const result = await handleDownloadMcpServerPackage({ slug: 'test-server' }, context);

      expect(mockElicit).toHaveBeenCalledWith({
        type: 'string',
        description: expect.stringContaining('target directory'),
      });
      expect(result._meta.success).toBe(true);
      expect(result._meta.filePath).toBe('/Users/test/.claude/mcp/test-server.mcpb');
    });

    it('should handle invalid rootUri format gracefully', async () => {
      const result = await handleDownloadMcpServerPackage(
        { slug: 'test-server', rootUri: 'invalid-uri' },
        context
      );

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Invalid rootUri format'),
        expect.objectContaining({
          rootUri: 'invalid-uri',
          slug: 'test-server',
        })
      );
      expect(result._meta.success).toBe(true);
      expect(result._meta.downloadUrl).toBeDefined();
      expect(result._meta.filePath).toBeUndefined();
    });

    it('should sanitize slug input', async () => {
      const result = await handleDownloadMcpServerPackage({ slug: '  test-server  ' }, context);

      expect(result._meta.slug).toBe('test-server');
    });

    it('should log successful download', async () => {
      await handleDownloadMcpServerPackage({ slug: 'test-server' }, context);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'downloadMcpServerPackage completed successfully',
        expect.objectContaining({
          tool: 'downloadMcpServerPackage',
          slug: 'test-server',
        })
      );
    });

    it('should handle errors and log them', async () => {
      // Mock getStorageDownloadUrl to throw
      jest
        .spyOn(require('../../lib/storage-utils.js'), 'getStorageDownloadUrl')
        .mockImplementation(() => {
          throw new Error('Storage error');
        });

      await expect(
        handleDownloadMcpServerPackage({ slug: 'test-server' }, context)
      ).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'downloadMcpServerPackage tool error',
        expect.any(Error),
        expect.objectContaining({
          tool: 'downloadMcpServerPackage',
          slug: 'test-server',
        })
      );
    });
  });

  describe('Integration Tests', () => {
    it('should generate complete download response with all metadata', async () => {
      const result = await handleDownloadMcpServerPackage({ slug: 'my-mcp-server' }, context);

      expect(result).toMatchObject({
        content: [
          {
            type: 'text',
            text: expect.stringContaining('my-mcp-server'),
          },
        ],
        _meta: {
          success: true,
          slug: 'my-mcp-server',
          fileName: 'my-mcp-server.mcpb',
          downloadUrl: expect.stringContaining('/api/v1/content/mcp/my-mcp-server?format=storage'),
          mimeType: 'application/zip',
        },
      });
    });

    it('should handle filesystem download with valid rootUri', async () => {
      mockElicit.mockResolvedValueOnce(true);

      const result = await handleDownloadMcpServerPackage(
        { slug: 'test-server', rootUri: 'file:///Users/test/.claude/mcp' },
        context
      );

      expect(result.content[0].text).toContain('Downloaded to');
      expect(result.content[0].text).toContain('/Users/test/.claude/mcp/test-server.mcpb');
      expect(result._meta.filePath).toBe('/Users/test/.claude/mcp/test-server.mcpb');
    });

    it('should provide download instructions when rootUri not provided', async () => {
      const result = await handleDownloadMcpServerPackage({ slug: 'test-server' }, context);

      expect(result.content[0].text).toContain('Download URL');
      expect(result.content[0].text).toContain('Visit the download URL');
      expect(result.content[0].text).toContain('Save the .mcpb file');
    });
  });
});
