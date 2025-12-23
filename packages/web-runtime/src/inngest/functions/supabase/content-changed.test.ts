/**
 * Supabase Content Changed Inngest Function Tests
 *
 * Tests the handleSupabaseContentChanged function using @inngest/test.
 * This tests the function logic, not the route handler.
 *
 * @module web-runtime/inngest/functions/supabase/content-changed.test
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { InngestTestEngine } from '@inngest/test';
import { handleSupabaseContentChanged } from './content-changed';

// Mock service factory, logging, shared-runtime, environment, and monitoring
jest.mock('../../../logging/server', () => {
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  const mockCreateWebAppContextWithId = jest.fn(() => ({
    requestId: 'test-request-id',
    operation: 'handleSupabaseContentChanged',
    route: '/inngest/supabase/content-changed',
  }));
  return {
    logger: mockLogger,
    createWebAppContextWithId: mockCreateWebAppContextWithId,
    __mockLogger: mockLogger,
    __mockCreateWebAppContextWithId: mockCreateWebAppContextWithId,
  };
});

jest.mock('@heyclaude/shared-runtime', () => {
  const mockNormalizeError = jest.fn((error: unknown) => {
    if (error instanceof Error) {
      return error;
    }
    return new Error(String(error));
  });
  return {
    normalizeError: mockNormalizeError,
    __mockNormalizeError: mockNormalizeError,
  };
});

jest.mock('@heyclaude/shared-runtime/schemas/env', () => ({
  env: {
    GITHUB_TOKEN: 'test-github-token',
    GITHUB_REPOSITORY: 'JSONbored/claudepro-directory',
  },
}));

jest.mock('../../utils/monitoring', () => ({
  isBetterStackMonitoringEnabled: jest.fn().mockReturnValue(false),
  isInngestMonitoringEnabled: jest.fn().mockReturnValue(false),
  isCriticalFailureMonitoringEnabled: jest.fn().mockReturnValue(false),
  isCronSuccessMonitoringEnabled: jest.fn().mockReturnValue(false),
  isApiEndpointMonitoringEnabled: jest.fn().mockReturnValue(false),
  sendBetterStackHeartbeat: jest.fn(),
  sendCriticalFailureHeartbeat: jest.fn(),
  sendCronSuccessHeartbeat: jest.fn(),
  sendApiEndpointHeartbeat: jest.fn(),
}));

// Import function AFTER mocks are set up
describe('handleSupabaseContentChanged', () => {
  /**
   * Test engine instance - created fresh for each test to avoid state caching
   */
  let t: InngestTestEngine;

  /**
   * Mock functions - accessed via jest.requireMock
   */
  let mockLogger: {
    info: ReturnType<typeof jest.fn>;
    warn: ReturnType<typeof jest.fn>;
    error: ReturnType<typeof jest.fn>;
  };
  let mockCreateWebAppContextWithId: ReturnType<typeof jest.fn>;
  let mockNormalizeError: ReturnType<typeof jest.fn>;
  let mockFetch: ReturnType<typeof jest.fn>;

  /**
   * Setup before each test
   * - Creates fresh test engine instance
   * - Resets all mocks to clean state
   * - Sets up default mock return values
   */
  beforeEach(() => {
    // Get mocked functions via jest.requireMock
    const loggingMock = jest.requireMock('../../../logging/server') as {
      __mockLogger: {
        info: ReturnType<typeof jest.fn>;
        warn: ReturnType<typeof jest.fn>;
        error: ReturnType<typeof jest.fn>;
      };
      __mockCreateWebAppContextWithId: ReturnType<typeof jest.fn>;
    };
    const sharedRuntimeMock = jest.requireMock('@heyclaude/shared-runtime') as {
      __mockNormalizeError: ReturnType<typeof jest.fn>;
    };

    mockLogger = loggingMock.__mockLogger;
    mockCreateWebAppContextWithId = loggingMock.__mockCreateWebAppContextWithId;
    mockNormalizeError = sharedRuntimeMock.__mockNormalizeError;

    // Mock global fetch for GitHub API
    mockFetch = jest.fn();
    global.fetch = mockFetch as typeof fetch;

    // Create fresh test engine instance for each test
    // This prevents step result memoization between tests
    t = new InngestTestEngine({
      function: handleSupabaseContentChanged,
    });

    // Reset all mocks to ensure clean state
    jest.clearAllMocks();
    jest.resetAllMocks();
    mockFetch.mockReset();

    // Restore mock implementations after reset
    mockCreateWebAppContextWithId.mockReturnValue({
      requestId: 'test-request-id',
      operation: 'handleSupabaseContentChanged',
      route: '/inngest/supabase/content-changed',
    });

    mockNormalizeError.mockImplementation((error: unknown) => {
      if (error instanceof Error) {
        return error;
      }
      return new Error(String(error));
    });

    // Set up default successful GitHub API response
    mockFetch.mockResolvedValue({
      ok: true,
      status: 204,
    } as Response);
  });

  /**
   * Success case: Skills INSERT event (package needed)
   *
   * Tests that skills INSERT events trigger package generation workflow.
   */
  it('should trigger skill-package-needed workflow for skills INSERT', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'supabase/content-changed',
          data: {
            webhookId: 'webhook-123',
            eventType: 'INSERT',
            category: 'skills',
            contentId: 'content-123',
            slug: 'test-skill',
            record: {
              id: 'content-123',
              category: 'skills',
              slug: 'test-skill',
              storage_url: null, // No package yet
            },
          },
        },
      ],
    })) as { result: { success: boolean; eventType: string; category: string; contentId: string; slug: string; webhookId: string; action: string } };

    expect(result).toEqual({
      success: true,
      eventType: 'INSERT',
      category: 'skills',
      contentId: 'content-123',
      slug: 'test-skill',
      webhookId: 'webhook-123',
      action: 'workflow_triggered',
    });

    // Should trigger both package and README workflows
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/repos/JSONbored/claudepro-directory/dispatches'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-github-token',
        }),
        body: expect.stringContaining('skill-package-needed'),
      })
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/repos/JSONbored/claudepro-directory/dispatches'),
      expect.objectContaining({
        body: expect.stringContaining('readme-update-needed'),
      })
    );
  });

  /**
   * Success case: MCP INSERT event (package needed)
   *
   * Tests that MCP INSERT events trigger package generation workflow.
   */
  it('should trigger mcpb-package-needed workflow for mcp INSERT', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'supabase/content-changed',
          data: {
            webhookId: 'webhook-123',
            eventType: 'INSERT',
            category: 'mcp',
            contentId: 'content-123',
            slug: 'test-mcp',
            record: {
              id: 'content-123',
              category: 'mcp',
              slug: 'test-mcp',
              mcpb_storage_url: null, // No package yet
            },
          },
        },
      ],
    })) as { result: { success: boolean } };

    expect(result.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        body: expect.stringContaining('mcpb-package-needed'),
      })
    );
  });

  /**
   * Success case: Skills UPDATE event (package already exists)
   *
   * Tests that skills UPDATE events skip package generation if package exists.
   */
  it('should skip package workflow if package already exists', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'supabase/content-changed',
          data: {
            webhookId: 'webhook-123',
            eventType: 'UPDATE',
            category: 'skills',
            contentId: 'content-123',
            slug: 'test-skill',
            record: {
              id: 'content-123',
              category: 'skills',
              slug: 'test-skill',
              storage_url: 'https://storage.example.com/package.zip', // Package exists
            },
            oldRecord: {
              id: 'content-123',
              title: 'Old Title',
            },
          },
        },
      ],
    })) as { result: { success: boolean } };

    expect(result.success).toBe(true);
    // Should only trigger README update (package already exists)
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        body: expect.stringContaining('readme-update-needed'),
      })
    );
  });

  /**
   * Success case: Non-package category (agents)
   *
   * Tests that non-package categories skip package generation but trigger README update.
   */
  it('should skip package workflow for non-package categories', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'supabase/content-changed',
          data: {
            webhookId: 'webhook-123',
            eventType: 'INSERT',
            category: 'agents',
            contentId: 'content-123',
            slug: 'test-agent',
            record: {
              id: 'content-123',
              category: 'agents',
              slug: 'test-agent',
            },
          },
        },
      ],
    })) as { result: { success: boolean } };

    expect(result.success).toBe(true);
    // Should only trigger README update (not package generation)
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        body: expect.stringContaining('readme-update-needed'),
      })
    );
  });

  /**
   * Success case: DELETE event (should skip)
   *
   * Tests that DELETE events are skipped.
   */
  it('should skip DELETE events', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'supabase/content-changed',
          data: {
            webhookId: 'webhook-123',
            eventType: 'DELETE',
            category: 'skills',
            contentId: 'content-123',
            slug: 'test-skill',
            record: {},
          },
        },
      ],
    })) as { result: { success: boolean; eventType: string; category: string; contentId: string; action: string; reason: string } };

    expect(result).toEqual({
      success: true,
      eventType: 'DELETE',
      category: 'skills',
      contentId: 'content-123',
      action: 'skipped',
      reason: 'DELETE events do not require package generation',
    });

    // Should not trigger any workflows
    expect(mockFetch).not.toHaveBeenCalled();
  });

  /**
   * Success case: Metadata unchanged (UPDATE)
   *
   * Tests that UPDATE events with unchanged metadata skip README update.
   */
  it('should skip README update if metadata unchanged', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'supabase/content-changed',
          data: {
            webhookId: 'webhook-123',
            eventType: 'UPDATE',
            category: 'skills',
            contentId: 'content-123',
            slug: 'test-skill',
            record: {
              id: 'content-123',
              title: 'Same Title',
              description: 'Same Description',
              slug: 'test-skill',
              category: 'skills',
              storage_url: 'https://storage.example.com/package.zip',
            },
            oldRecord: {
              id: 'content-123',
              title: 'Same Title',
              description: 'Same Description',
              slug: 'test-skill',
              category: 'skills',
            },
          },
        },
      ],
    })) as { result: { success: boolean } };

    expect(result.success).toBe(true);
    // Should not trigger any workflows (package exists, metadata unchanged)
    expect(mockFetch).not.toHaveBeenCalled();
  });

  /**
   * Error case: GitHub workflow trigger failure
   *
   * Tests that GitHub workflow trigger failures are handled gracefully.
   */
  it('should handle GitHub workflow trigger failure gracefully', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    } as Response);

    const { result } = (await t.execute({
      events: [
        {
          name: 'supabase/content-changed',
          data: {
            webhookId: 'webhook-123',
            eventType: 'INSERT',
            category: 'skills',
            contentId: 'content-123',
            slug: 'test-skill',
            record: {
              id: 'content-123',
              category: 'skills',
              slug: 'test-skill',
              storage_url: null,
            },
          },
        },
      ],
    })) as { result: { success: boolean } };

    // Should still succeed (errors are logged but don't fail function)
    expect(result.success).toBe(true);
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'skills',
        contentId: 'content-123',
        error: expect.stringContaining('GitHub API error'),
      }),
      'Failed to trigger package generation workflow'
    );
  });

  /**
   * Step test: validate-event step
   *
   * Tests the validate-event step individually.
   */
  it('should execute validate-event step correctly', async () => {
    const { result } = (await t.executeStep('validate-event', {
      events: [
        {
          name: 'supabase/content-changed',
          data: {
            webhookId: 'webhook-123',
            eventType: 'INSERT',
            category: 'skills',
            contentId: 'content-123',
            slug: 'test-skill',
            record: {},
          },
        },
      ],
    })) as { result: { valid: boolean } };

    expect(result).toEqual({
      valid: true,
    });
  });

  /**
   * Step test: trigger-package-workflow step
   *
   * Tests the trigger-package-workflow step individually.
   */
  it('should execute trigger-package-workflow step correctly', async () => {
    // First execute validate-event step
    await t.executeStep('validate-event', {
      events: [
        {
          name: 'supabase/content-changed',
          data: {
            webhookId: 'webhook-123',
            eventType: 'INSERT',
            category: 'skills',
            contentId: 'content-123',
            slug: 'test-skill',
            record: {
              id: 'content-123',
              category: 'skills',
              storage_url: null,
            },
          },
        },
      ],
    });

    // Now execute full function to test trigger-package-workflow step
    const { result } = (await t.execute({
      events: [
        {
          name: 'supabase/content-changed',
          data: {
            webhookId: 'webhook-123',
            eventType: 'INSERT',
            category: 'skills',
            contentId: 'content-123',
            slug: 'test-skill',
            record: {
              id: 'content-123',
              category: 'skills',
              storage_url: null,
            },
          },
        },
      ],
    })) as { result: { success: boolean } };

    expect(result.success).toBe(true);
    expect(mockFetch).toHaveBeenCalled();
  });

  /**
   * Success case: Idempotency
   *
   * Tests that duplicate webhook events are handled idempotently.
   */
  it('should handle duplicate webhook events idempotently', async () => {
    const eventData = {
      name: 'supabase/content-changed' as const,
      data: {
        webhookId: 'webhook-123', // Same webhookId
        eventType: 'INSERT' as const,
        category: 'skills',
        contentId: 'content-123',
        slug: 'test-skill',
        record: {
          id: 'content-123',
          category: 'skills',
          storage_url: null,
        },
      },
    };

    // Execute same event twice
    const { result: result1 } = (await t.execute({
      events: [eventData],
    })) as { result: { success: boolean } };

    // Create fresh test engine for second execution (simulating idempotency)
    const t2 = new InngestTestEngine({
      function: handleSupabaseContentChanged,
    });
    mockFetch.mockClear();

    const { result: result2 } = (await t2.execute({
      events: [eventData],
    })) as { result: { success: boolean } };

    // Both should succeed
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
  });

  /**
   * Success case: README update for all content types
   *
   * Tests that README update is triggered for all content types.
   */
  it('should trigger README update for all content types', async () => {
    const categories = ['agents', 'mcp', 'skills', 'rules'];

    for (const category of categories) {
      const t2 = new InngestTestEngine({
        function: handleSupabaseContentChanged,
      });
      mockFetch.mockClear();

      const { result } = (await t2.execute({
        events: [
          {
            name: 'supabase/content-changed',
            data: {
              webhookId: `webhook-${category}`,
              eventType: 'INSERT',
              category,
              contentId: 'content-123',
              slug: 'test-content',
              record: {
                id: 'content-123',
                category,
                slug: 'test-content',
              },
            },
          },
        ],
      })) as { result: { success: boolean } };

      expect(result.success).toBe(true);
      // Should trigger README update for all categories
      expect(mockFetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          body: expect.stringContaining('readme-update-needed'),
        })
      );
    }
  });
});

