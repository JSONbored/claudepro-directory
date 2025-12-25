/**
 * Tests for downloadStorageFile Tool Handler
 *
 * Tests the generic tool for downloading any storage file from Supabase Storage.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { handleDownloadStorageFile } from './download-storage-file.js';
import {
  createMockLogger,
  createMockEnv,
  createMockUser,
  createMockToken,
  createMockKvCache,
} from '../../__tests__/test-utils.ts';
import type { ToolContext } from '../../types/runtime.js';

describe('downloadStorageFile Tool Handler', () => {
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
    it('should generate download URL for skills category', async () => {
      const result = await handleDownloadStorageFile(
        { category: 'skills', slug: 'test-skill' },
        context
      );

      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('skills/test-skill');
      expect(result._meta.success).toBe(true);
      expect(result._meta.category).toBe('skills');
      expect(result._meta.slug).toBe('test-skill');
      expect(result._meta.fileName).toBe('test-skill.zip');
      expect(result._meta.fileType).toBe('zip');
      expect(result._meta.mimeType).toBe('application/zip');
      expect(result._meta.bucket).toBe('skills');
    });

    it('should generate download URL for mcp category', async () => {
      const result = await handleDownloadStorageFile(
        { category: 'mcp', slug: 'test-server' },
        context
      );

      expect(result._meta.category).toBe('mcp');
      expect(result._meta.fileName).toBe('test-server.mcpb');
      expect(result._meta.fileType).toBe('mcpb');
      expect(result._meta.mimeType).toBe('application/zip');
      expect(result._meta.bucket).toBe('mcpb-packages');
    });

    it('should validate slug format', async () => {
      await expect(
        handleDownloadStorageFile({ category: 'skills', slug: 'invalid slug!' }, context)
      ).rejects.toThrow('Invalid slug format');
    });

    it('should reject invalid category', async () => {
      await expect(
        handleDownloadStorageFile({ category: 'invalid', slug: 'test' }, context)
      ).rejects.toThrow('does not have storage files');
    });

    it('should handle explicit fileType parameter', async () => {
      const result = await handleDownloadStorageFile(
        { category: 'skills', slug: 'test-skill', fileType: 'zip' },
        context
      );

      expect(result._meta.fileType).toBe('zip');
      expect(result._meta.fileName).toBe('test-skill.zip');
    });

    it('should detect fileType from category when not provided', async () => {
      const result = await handleDownloadStorageFile(
        { category: 'mcp', slug: 'test-server' },
        context
      );

      expect(result._meta.fileType).toBe('mcpb');
    });

    it('should handle rootUri with elicitation confirmation', async () => {
      mockElicit.mockResolvedValueOnce(true);

      const result = await handleDownloadStorageFile(
        { category: 'skills', slug: 'test-skill', rootUri: 'file:///Users/test/.claude/packages' },
        context
      );

      expect(mockElicit).toHaveBeenCalledWith({
        type: 'boolean',
        description: expect.stringContaining('skills/test-skill'),
      });
      expect(result._meta.success).toBe(true);
      expect(result._meta.filePath).toBe('/Users/test/.claude/packages/test-skill.zip');
    });

    it('should cancel download if user declines elicitation', async () => {
      mockElicit.mockResolvedValueOnce(false);

      await expect(
        handleDownloadStorageFile(
          {
            category: 'skills',
            slug: 'test-skill',
            rootUri: 'file:///Users/test/.claude/packages',
          },
          context
        )
      ).rejects.toThrow('Download cancelled by user');
    });

    it('should elicit rootUri if not provided', async () => {
      mockElicit.mockResolvedValueOnce('file:///Users/test/.claude/packages');

      const result = await handleDownloadStorageFile(
        { category: 'skills', slug: 'test-skill' },
        context
      );

      expect(mockElicit).toHaveBeenCalledWith({
        type: 'string',
        description: expect.stringContaining('target directory'),
      });
      expect(result._meta.success).toBe(true);
      expect(result._meta.filePath).toBe('/Users/test/.claude/packages/test-skill.zip');
    });

    it('should handle invalid rootUri format gracefully', async () => {
      const result = await handleDownloadStorageFile(
        { category: 'skills', slug: 'test-skill', rootUri: 'invalid-uri' },
        context
      );

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Invalid rootUri format'),
        expect.objectContaining({
          rootUri: 'invalid-uri',
          category: 'skills',
          slug: 'test-skill',
        })
      );
      expect(result._meta.success).toBe(true);
      expect(result._meta.downloadUrl).toBeDefined();
      expect(result._meta.filePath).toBeUndefined();
    });

    it('should determine correct MIME type based on fileType', async () => {
      const zipResult = await handleDownloadStorageFile(
        { category: 'skills', slug: 'test', fileType: 'zip' },
        context
      );
      expect(zipResult._meta.mimeType).toBe('application/zip');

      const jsonResult = await handleDownloadStorageFile(
        { category: 'skills', slug: 'test', fileType: 'json' },
        context
      );
      expect(jsonResult._meta.mimeType).toBe('application/json');

      const otherResult = await handleDownloadStorageFile(
        { category: 'skills', slug: 'test', fileType: 'other' },
        context
      );
      expect(otherResult._meta.mimeType).toBe('application/octet-stream');
    });

    it('should log successful download', async () => {
      await handleDownloadStorageFile({ category: 'skills', slug: 'test-skill' }, context);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'downloadStorageFile completed successfully',
        expect.objectContaining({
          tool: 'downloadStorageFile',
          category: 'skills',
          slug: 'test-skill',
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
        handleDownloadStorageFile({ category: 'skills', slug: 'test-skill' }, context)
      ).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'downloadStorageFile tool error',
        expect.any(Error),
        expect.objectContaining({
          tool: 'downloadStorageFile',
          category: 'skills',
          slug: 'test-skill',
        })
      );
    });
  });

  describe('Integration Tests', () => {
    it('should generate complete download response for skills', async () => {
      const result = await handleDownloadStorageFile(
        { category: 'skills', slug: 'my-skill' },
        context
      );

      expect(result).toMatchObject({
        content: [
          {
            type: 'text',
            text: expect.stringContaining('skills/my-skill'),
          },
        ],
        _meta: {
          success: true,
          category: 'skills',
          slug: 'my-skill',
          fileName: 'my-skill.zip',
          fileType: 'zip',
          mimeType: 'application/zip',
          bucket: 'skills',
        },
      });
    });

    it('should generate complete download response for mcp', async () => {
      const result = await handleDownloadStorageFile(
        { category: 'mcp', slug: 'my-server' },
        context
      );

      expect(result).toMatchObject({
        _meta: {
          success: true,
          category: 'mcp',
          slug: 'my-server',
          fileName: 'my-server.mcpb',
          fileType: 'mcpb',
          mimeType: 'application/zip',
          bucket: 'mcpb-packages',
        },
      });
    });

    it('should handle filesystem download with valid rootUri', async () => {
      mockElicit.mockResolvedValueOnce(true);

      const result = await handleDownloadStorageFile(
        { category: 'skills', slug: 'test-skill', rootUri: 'file:///Users/test/.claude/packages' },
        context
      );

      expect(result.content[0].text).toContain('Downloaded to');
      expect(result.content[0].text).toContain('/Users/test/.claude/packages/test-skill.zip');
      expect(result._meta.filePath).toBe('/Users/test/.claude/packages/test-skill.zip');
    });

    it('should provide download instructions when rootUri not provided', async () => {
      const result = await handleDownloadStorageFile(
        { category: 'skills', slug: 'test-skill' },
        context
      );

      expect(result.content[0].text).toContain('Download URL');
      expect(result.content[0].text).toContain('Visit the download URL');
      expect(result.content[0].text).toContain('Save the file');
    });
  });
});
