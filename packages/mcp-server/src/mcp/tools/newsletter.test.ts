/**
 * Tests for subscribeNewsletter Tool Handler
 *
 * Tests the tool that subscribes users to the newsletter via Inngest.
 * Includes email validation, Inngest event sending, and error handling.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { handleSubscribeNewsletter } from './newsletter.js';
import {
  createMockLogger,
  createMockEnv,
  createMockUser,
  createMockToken,
  createMockKvCache,
} from '../../__tests__/test-utils.ts';
import type { ToolContext } from '../../types/runtime.js';

// Mock fetch globally for Inngest event sending
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('subscribeNewsletter Tool Handler', () => {
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockEnv: ReturnType<typeof createMockEnv>;
  let context: ToolContext;
  let fetchMock: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();

    mockLogger = createMockLogger();
    mockEnv = createMockEnv({
      INNGEST_EVENT_KEY: 'test-event-key',
      INNGEST_SIGNING_KEY: 'test-signing-key',
      INNGEST_URL: 'https://api.inngest.com',
    });
    context = {
      prisma: {} as any, // Not used in this tool
      user: createMockUser(),
      token: createMockToken().access_token,
      env: mockEnv as any,
      logger: mockLogger,
      kvCache: createMockKvCache(),
    };

    fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'OK',
    } as Response);
  });

  describe('Unit Tests', () => {
    it('should subscribe valid email successfully', async () => {
      const result = await handleSubscribeNewsletter(
        {
          email: 'test@example.com',
          source: 'mcp',
        },
        context
      );

      expect(result._meta.email).toBe('test@example.com');
      expect(result._meta.source).toBe('mcp');
      expect(result._meta.status).toBe('pending');
      expect(result.content[0].text).toContain('Newsletter subscription request received');
      expect(result.content[0].text).toContain('test@example.com');

      // Verify Inngest event was sent
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.inngest.com/v1/events',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-event-key',
          }),
        })
      );

      const callBody = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string);
      expect(callBody.name).toBe('email/subscribe');
      expect(callBody.data.email).toBe('test@example.com');
      expect(callBody.data.source).toBe('mcp');
    });

    it('should normalize email address', async () => {
      const result = await handleSubscribeNewsletter(
        {
          email: '  TEST@EXAMPLE.COM  ',
          source: 'mcp',
        },
        context
      );

      expect(result._meta.email).toBe('test@example.com');
    });

    it('should use default source when not provided', async () => {
      const result = await handleSubscribeNewsletter(
        {
          email: 'test@example.com',
        },
        context
      );

      expect(result._meta.source).toBe('mcp');
    });

    it('should include referrer when provided', async () => {
      await handleSubscribeNewsletter(
        {
          email: 'test@example.com',
          source: 'mcp',
          referrer: 'https://example.com/page',
        },
        context
      );

      const callBody = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string);
      expect(callBody.data.referrer).toBe('https://example.com/page');
    });

    it('should include metadata when provided', async () => {
      await handleSubscribeNewsletter(
        {
          email: 'test@example.com',
          source: 'mcp',
          metadata: { campaign: 'test-campaign', source_page: 'homepage' },
        },
        context
      );

      const callBody = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string);
      expect(callBody.data.metadata).toEqual({
        campaign: 'test-campaign',
        source_page: 'homepage',
      });
    });

    it('should reject invalid email format', async () => {
      await expect(
        handleSubscribeNewsletter(
          {
            email: 'invalid-email',
            source: 'mcp',
          },
          context
        )
      ).rejects.toThrow('Invalid email address format');
    });

    it('should reject empty email', async () => {
      await expect(
        handleSubscribeNewsletter(
          {
            email: '',
            source: 'mcp',
          },
          context
        )
      ).rejects.toThrow();
    });

    it('should handle Inngest API errors', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Inngest service unavailable',
      } as Response);

      await expect(
        handleSubscribeNewsletter(
          {
            email: 'test@example.com',
            source: 'mcp',
          },
          context
        )
      ).rejects.toThrow('Inngest event send failed');
    });

    it('should use localhost Inngest URL when signing key not provided', async () => {
      const localEnv = createMockEnv({
        INNGEST_EVENT_KEY: undefined,
        INNGEST_SIGNING_KEY: undefined,
        INNGEST_URL: undefined,
      });
      const localContext = {
        ...context,
        env: localEnv as any,
      };

      await handleSubscribeNewsletter(
        {
          email: 'test@example.com',
          source: 'mcp',
        },
        localContext
      );

      expect(fetchMock).toHaveBeenCalledWith('http://localhost:8288/v1/events', expect.any(Object));
    });

    it('should require event key for production Inngest', async () => {
      const prodEnv = createMockEnv({
        INNGEST_EVENT_KEY: undefined,
        INNGEST_SIGNING_KEY: 'test-signing-key',
        INNGEST_URL: 'https://api.inngest.com',
      });
      const prodContext = {
        ...context,
        env: prodEnv as any,
      };

      await expect(
        handleSubscribeNewsletter(
          {
            email: 'test@example.com',
            source: 'mcp',
          },
          prodContext
        )
      ).rejects.toThrow('INNGEST_EVENT_KEY secret is required for production');
    });

    it('should log successful subscription', async () => {
      await handleSubscribeNewsletter(
        {
          email: 'test@example.com',
          source: 'mcp',
        },
        context
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        'subscribeNewsletter completed successfully',
        expect.objectContaining({
          tool: 'subscribeNewsletter',
          source: 'mcp',
          duration_ms: expect.any(Number),
        })
      );
    });

    it('should log error on failure', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'));

      await expect(
        handleSubscribeNewsletter(
          {
            email: 'test@example.com',
            source: 'mcp',
          },
          context
        )
      ).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'subscribeNewsletter tool error',
        expect.any(Error),
        expect.objectContaining({
          tool: 'subscribeNewsletter',
        })
      );
    });
  });

  describe('Integration Tests', () => {
    it('should handle full subscription flow', async () => {
      const result = await handleSubscribeNewsletter(
        {
          email: 'user@example.com',
          source: 'web',
          referrer: 'https://claudepro.directory',
          metadata: { page: 'homepage', campaign: 'launch' },
        },
        context
      );

      expect(result._meta.email).toBe('user@example.com');
      expect(result._meta.source).toBe('web');
      expect(result._meta.status).toBe('pending');
      expect(result._meta.message).toContain('Inngest');

      // Verify Inngest event contains all data
      const callBody = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string);
      expect(callBody.data.email).toBe('user@example.com');
      expect(callBody.data.source).toBe('web');
      expect(callBody.data.referrer).toBe('https://claudepro.directory');
      expect(callBody.data.metadata).toEqual({ page: 'homepage', campaign: 'launch' });
    });

    it('should handle various email formats', async () => {
      const emails = [
        'user@example.com',
        'user.name@example.co.uk',
        'user+tag@example.com',
        'user123@example-domain.com',
      ];

      for (const email of emails) {
        fetchMock.mockClear();
        const result = await handleSubscribeNewsletter(
          {
            email,
            source: 'mcp',
          },
          context
        );

        expect(result._meta.email).toBe(email.toLowerCase().trim());
      }
    });
  });
});
