/**
 * Tests for submitContent Tool Handler
 *
 * Tests the tool that guides users through content submission using MCP elicitation.
 * Includes submission guide generation, template retrieval, and validation rules.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { handleSubmitContent } from './submit-content.js';
import {
  createMockLogger,
  createMockEnv,
  createMockUser,
  createMockToken,
  createMockKvCache,
} from '../../__tests__/test-utils.ts';
import type { ToolContext } from '../../types/runtime.js';
import { submission_type, content_category } from '@prisma/client';

describe('submitContent Tool Handler', () => {
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockEnv: ReturnType<typeof createMockEnv>;
  let context: ToolContext;
  let elicitMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();

    mockLogger = createMockLogger();
    mockEnv = createMockEnv({
      APP_URL: 'https://test.claudepro.directory',
    });
    elicitMock = jest.fn();
    context = {
      prisma: {} as any, // Not used in this tool
      user: createMockUser(),
      token: createMockToken().access_token,
      env: mockEnv as any,
      logger: mockLogger,
      kvCache: createMockKvCache(),
      elicit: elicitMock,
    };
  });

  describe('Unit Tests', () => {
    it('should return submission URL when minimum data provided', async () => {
      const result = await handleSubmitContent(
        {
          submission_type: 'agents' as submission_type,
          category: 'agents' as content_category,
          name: 'Test Agent',
          description: 'A test agent',
          author: 'Test Author',
        },
        context
      );

      expect(result._meta.hasMinimumData).toBe(true);
      expect(result._meta.submissionUrl).toContain('/submit');
      expect(result._meta.submissionUrl).toContain('type=agents');
      expect(result._meta.submissionUrl).toContain('name=Test+Agent');
      expect(result._meta.submissionType).toBe('agents');
      expect(result._meta.name).toBe('Test Agent');
      expect(result._meta.author).toBe('Test Author');
      expect(result.content[0].text).toContain('Content Submission Ready');
      expect(result.content[0].text).toContain('Step 1: Visit Submission Page');
    });

    it('should use elicitation when data is missing', async () => {
      elicitMock
        .mockResolvedValueOnce('agents')
        .mockResolvedValueOnce('My Agent')
        .mockResolvedValueOnce('Agent description')
        .mockResolvedValueOnce('Author Name');

      const result = await handleSubmitContent({}, context);

      expect(elicitMock).toHaveBeenCalledTimes(4);
      expect(elicitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'string',
          description: 'What type of content are you submitting?',
        })
      );
      expect(result._meta.hasMinimumData).toBe(true);
      expect(result._meta.submissionType).toBe('agents');
      expect(result._meta.name).toBe('My Agent');
    });

    it('should return guide when minimum data not provided', async () => {
      const result = await handleSubmitContent({}, context);

      expect(result._meta.hasMinimumData).toBe(false);
      expect(result.content[0].text).toContain('Content Submission Guide');
      expect(result.content[0].text).toContain('Missing Required Information');
      expect(result._meta.nextSteps).toContain('Provide submission type');
    });

    it('should validate submission type', async () => {
      await expect(
        handleSubmitContent(
          {
            submission_type: 'invalid' as any,
          },
          context
        )
      ).rejects.toThrow('Invalid submission_type');
    });

    it('should validate category', async () => {
      await expect(
        handleSubmitContent(
          {
            category: 'invalid' as any,
          },
          context
        )
      ).rejects.toThrow('Invalid category');
    });

    it('should validate author profile URL', async () => {
      await expect(
        handleSubmitContent(
          {
            submission_type: 'agents' as submission_type,
            name: 'Test',
            description: 'Test',
            author: 'Test',
            author_profile_url: 'not-a-url',
          },
          context
        )
      ).rejects.toThrow('Invalid author_profile_url');
    });

    it('should validate GitHub URL', async () => {
      await expect(
        handleSubmitContent(
          {
            submission_type: 'agents' as submission_type,
            name: 'Test',
            description: 'Test',
            author: 'Test',
            github_url: 'not-a-url',
          },
          context
        )
      ).rejects.toThrow('Invalid github_url');
    });

    it('should validate name length', async () => {
      const longName = 'A'.repeat(201);
      await expect(
        handleSubmitContent(
          {
            submission_type: 'agents' as submission_type,
            name: longName,
            description: 'Test',
            author: 'Test',
          },
          context
        )
      ).rejects.toThrow('Name must be 200 characters or less');
    });

    it('should sanitize string inputs', async () => {
      const result = await handleSubmitContent(
        {
          submission_type: 'agents' as submission_type,
          name: '  Test Agent  ',
          description: '  Test Description  ',
          author: '  Test Author  ',
        },
        context
      );

      expect(result._meta.name).toBe('Test Agent');
    });

    it('should include tags in submission data', async () => {
      const result = await handleSubmitContent(
        {
          submission_type: 'agents' as submission_type,
          category: 'agents' as content_category,
          name: 'Test Agent',
          description: 'A test agent',
          author: 'Test Author',
          tags: ['ai', 'automation'],
        },
        context
      );

      expect(result.content[0].text).toContain('Tags: ai, automation');
    });

    it('should include content_data in submission data', async () => {
      const result = await handleSubmitContent(
        {
          submission_type: 'agents' as submission_type,
          category: 'agents' as content_category,
          name: 'Test Agent',
          description: 'A test agent',
          author: 'Test Author',
          content_data: { prompt: 'Test prompt', model: 'claude-3' },
        },
        context
      );

      expect(result.content[0].text).toContain('Content Data:');
      expect(result.content[0].text).toContain('"prompt": "Test prompt"');
    });

    it('should generate correct web form URL', async () => {
      const result = await handleSubmitContent(
        {
          submission_type: 'agents' as submission_type,
          category: 'agents' as content_category,
          name: 'Test Agent',
          description: 'A test agent',
          author: 'Test Author',
        },
        context
      );

      expect(result._meta.webFormUrl).toBe('https://test.claudepro.directory/submit');
    });

    it('should log successful completion', async () => {
      await handleSubmitContent(
        {
          submission_type: 'agents' as submission_type,
          category: 'agents' as content_category,
          name: 'Test Agent',
          description: 'A test agent',
          author: 'Test Author',
        },
        context
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        'submitContent completed successfully',
        expect.objectContaining({
          tool: 'submitContent',
          hasMinimumData: true,
          submissionType: 'agents',
          duration_ms: expect.any(Number),
        })
      );
    });

    it('should log error on failure', async () => {
      await expect(
        handleSubmitContent(
          {
            submission_type: 'invalid' as any,
          },
          context
        )
      ).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'submitContent tool error',
        expect.any(Error),
        expect.objectContaining({
          tool: 'submitContent',
        })
      );
    });
  });

  describe('Integration Tests', () => {
    it('should handle full submission flow with elicitation', async () => {
      elicitMock
        .mockResolvedValueOnce('mcp')
        .mockResolvedValueOnce('My MCP Server')
        .mockResolvedValueOnce('MCP server description')
        .mockResolvedValueOnce('Author Name');

      const result = await handleSubmitContent(
        {
          category: 'mcp' as content_category,
          tags: ['tools', 'automation'],
          github_url: 'https://github.com/example/repo',
        },
        context
      );

      expect(result._meta.hasMinimumData).toBe(true);
      expect(result._meta.submissionType).toBe('mcp');
      expect(result._meta.name).toBe('My MCP Server');
      expect(result._meta.category).toBe('mcp');
      expect(result.content[0].text).toContain('Content Submission Ready');
      expect(result.content[0].text).toContain('Tags: tools, automation');
      expect(result.content[0].text).toContain('GitHub URL: https://github.com/example/repo');
    });

    it('should handle partial data with missing fields', async () => {
      const result = await handleSubmitContent(
        {
          submission_type: 'agents' as submission_type,
          name: 'Test Agent',
          // Missing description and author
        },
        context
      );

      expect(result._meta.hasMinimumData).toBe(false);
      expect(result.content[0].text).toContain('Missing Required Information');
      expect(result._meta.nextSteps).toContain('Provide description');
      expect(result._meta.nextSteps).toContain('Provide author information');
    });
  });
});
