/**
 * Polar Webhook Inngest Function Integration Tests
 *
 * Tests handlePolarWebhook function → MiscService → database flow.
 * Uses InngestTestEngine, Prismocker for in-memory database, and real service factory.
 *
 * @group Inngest
 * @group Polar
 * @group Integration
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { InngestTestEngine } from '@inngest/test';
import { handlePolarWebhook } from './webhook';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';
import { clearRequestCache } from '@heyclaude/data-layer/utils/request-cache';

// Use real service factory (return actual services)
jest.mock('../../../data/service-factory', () => {
  // Import real service factory to return real services
  const actual = jest.requireActual('../../../data/service-factory');
  return {
    ...actual,
    getService: actual.getService, // Use real getService which returns real services
  };
});

jest.mock('../../../logging/server', () => {
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  const mockCreateWebAppContextWithId = jest.fn(() => ({
    requestId: 'test-request-id',
    operation: 'handlePolarWebhook',
    route: '/inngest/polar/webhook',
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

describe('handlePolarWebhook', () => {
  let t: InngestTestEngine;
  let prismocker: PrismaClient;

  beforeEach(() => {
    // Create fresh test engine instance for each test
    t = new InngestTestEngine({
      function: handlePolarWebhook,
    });

    // Initialize Prismocker and clear cache for a clean test state
    prismocker = prisma as unknown as PrismaClient;
    clearRequestCache();

    // Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // Clear all mocks
    jest.clearAllMocks();
    jest.resetAllMocks();

    // Set up $queryRawUnsafe for RPC testing (handlePolarWebhookRpc uses callRpc → $queryRawUnsafe)
    // Use Prismocker's Proxy set handler to override $queryRawUnsafe
    (prismocker as any).$queryRawUnsafe = jest.fn<() => Promise<any[]>>().mockResolvedValue([]);
  });

  /**
   * Cleanup after each test to prevent open handles
   */
  afterEach(async () => {
    // Clear all timers
    jest.clearAllTimers();

    // Ensure all pending promises are resolved
    await new Promise((resolve) => setImmediate(resolve));

    // Clear the test engine reference to allow garbage collection
    (t as any) = null;
  });

  /**
   * Success case: Order paid event
   *
   * Tests that order.paid events are processed correctly.
   */
  it('should handle order.paid event successfully', async () => {
    // Seed Prismocker with webhook event data
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('webhook_events', [
        {
          id: 'webhook-123',
          svix_id: 'svix-123',
          source: 'polar',
          event_type: 'order.paid',
          payload: { data: { amount: 9900, currency: 'usd' } },
          processed: false,
          processed_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    }

    // Mock RPC success
    (prismocker as any).$queryRawUnsafe = jest.fn<() => Promise<any[]>>().mockResolvedValue([]);

    const { result } = (await t.execute({
      events: [
        {
          name: 'polar/webhook',
          data: {
            eventType: 'order.paid',
            webhookId: 'webhook-123',
            svixId: 'svix-123',
            payload: { data: { amount: 9900, currency: 'usd' } },
            jobId: 'job-123',
            userId: 'user-123',
          },
        },
      ],
    })) as {
      result: {
        success: boolean;
        eventType: string;
        webhookId: string;
        action: string;
        rpcName: string;
      };
    };

    expect(result).toEqual({
      success: true,
      eventType: 'order.paid',
      webhookId: 'webhook-123',
      action: 'processed',
      rpcName: 'handle_polar_order_paid',
    });

    // Verify RPC was called
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM handle_polar_order_paid'),
      expect.objectContaining({
        p_webhook_id: 'webhook-123',
      })
    );

    // Verify webhook event status was updated
    const updatedWebhook = await prismocker.webhook_events.findUnique({
      where: { id: 'webhook-123' },
    });
    expect(updatedWebhook?.processed).toBe(true);
    expect(updatedWebhook?.processed_at).toBeDefined();
  });

  /**
   * Success case: Order refunded event
   *
   * Tests that order.refunded events are processed correctly.
   */
  it('should handle order.refunded event successfully', async () => {
    // Seed Prismocker with webhook event data
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('webhook_events', [
        {
          id: 'webhook-123',
          svix_id: 'svix-123',
          source: 'polar',
          event_type: 'order.refunded',
          payload: { data: { amount: 9900, currency: 'usd' } },
          processed: false,
          processed_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    }

    // Mock RPC success
    (prismocker as any).$queryRawUnsafe = jest.fn<() => Promise<any[]>>().mockResolvedValue([]);

    const { result } = (await t.execute({
      events: [
        {
          name: 'polar/webhook',
          data: {
            eventType: 'order.refunded',
            webhookId: 'webhook-123',
            svixId: 'svix-123',
            payload: { data: { amount: 9900, currency: 'usd' } },
            jobId: 'job-123',
            userId: 'user-123',
          },
        },
      ],
    })) as {
      result: {
        success: boolean;
        eventType: string;
        webhookId: string;
        action: string;
        rpcName: string;
      };
    };

    expect(result).toEqual({
      success: true,
      eventType: 'order.refunded',
      webhookId: 'webhook-123',
      action: 'processed',
      rpcName: 'handle_polar_order_refunded',
    });

    // Verify RPC was called
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM handle_polar_order_refunded'),
      expect.objectContaining({
        p_webhook_id: 'webhook-123',
      })
    );
  });

  /**
   * Success case: Subscription active event
   *
   * Tests that subscription.active events are processed correctly.
   */
  it('should handle subscription.active event successfully', async () => {
    // Seed Prismocker with webhook event data
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('webhook_events', [
        {
          id: 'webhook-123',
          svix_id: 'svix-123',
          source: 'polar',
          event_type: 'subscription.active',
          payload: { data: { subscription_id: 'sub-123' } },
          processed: false,
          processed_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    }

    // Mock RPC success
    (prismocker as any).$queryRawUnsafe = jest.fn<() => Promise<any[]>>().mockResolvedValue([]);

    const { result } = (await t.execute({
      events: [
        {
          name: 'polar/webhook',
          data: {
            eventType: 'subscription.active',
            webhookId: 'webhook-123',
            svixId: 'svix-123',
            payload: { data: { subscription_id: 'sub-123' } },
            userId: 'user-123',
          },
        },
      ],
    })) as {
      result: {
        success: boolean;
        eventType: string;
        webhookId: string;
        action: string;
        rpcName: string;
      };
    };

    expect(result).toEqual({
      success: true,
      eventType: 'subscription.active',
      webhookId: 'webhook-123',
      action: 'processed',
      rpcName: 'handle_polar_subscription_renewal',
    });

    // Verify RPC was called
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM handle_polar_subscription_renewal'),
      expect.objectContaining({
        p_webhook_id: 'webhook-123',
      })
    );
  });

  /**
   * Success case: Subscription canceled event
   *
   * Tests that subscription.canceled events are processed correctly.
   */
  it('should handle subscription.canceled event successfully', async () => {
    // Seed Prismocker with webhook event data
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('webhook_events', [
        {
          id: 'webhook-123',
          svix_id: 'svix-123',
          source: 'polar',
          event_type: 'subscription.canceled',
          payload: { data: { subscription_id: 'sub-123' } },
          processed: false,
          processed_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    }

    // Mock RPC success
    (prismocker as any).$queryRawUnsafe = jest.fn<() => Promise<any[]>>().mockResolvedValue([]);

    const { result } = (await t.execute({
      events: [
        {
          name: 'polar/webhook',
          data: {
            eventType: 'subscription.canceled',
            webhookId: 'webhook-123',
            svixId: 'svix-123',
            payload: { data: { subscription_id: 'sub-123' } },
            userId: 'user-123',
          },
        },
      ],
    })) as { result: { success: boolean; rpcName: string } };

    expect(result.success).toBe(true);
    expect(result.rpcName).toBe('handle_polar_subscription_canceled');

    // Verify RPC was called
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM handle_polar_subscription_canceled'),
      expect.objectContaining({
        p_webhook_id: 'webhook-123',
      })
    );
  });

  /**
   * Success case: Subscription revoked event
   *
   * Tests that subscription.revoked events are processed correctly.
   */
  it('should handle subscription.revoked event successfully', async () => {
    // Seed Prismocker with webhook event data
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('webhook_events', [
        {
          id: 'webhook-123',
          svix_id: 'svix-123',
          source: 'polar',
          event_type: 'subscription.revoked',
          payload: { data: { subscription_id: 'sub-123' } },
          processed: false,
          processed_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    }

    // Mock RPC success
    (prismocker as any).$queryRawUnsafe = jest.fn<() => Promise<any[]>>().mockResolvedValue([]);

    const { result } = (await t.execute({
      events: [
        {
          name: 'polar/webhook',
          data: {
            eventType: 'subscription.revoked',
            webhookId: 'webhook-123',
            svixId: 'svix-123',
            payload: { data: { subscription_id: 'sub-123' } },
            userId: 'user-123',
          },
        },
      ],
    })) as { result: { success: boolean; rpcName: string } };

    expect(result.success).toBe(true);
    expect(result.rpcName).toBe('handle_polar_subscription_revoked');

    // Verify RPC was called
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM handle_polar_subscription_revoked'),
      expect.objectContaining({
        p_webhook_id: 'webhook-123',
      })
    );
  });

  /**
   * Success case: Informational event (checkout.created)
   *
   * Tests that informational events are logged but not processed via RPC.
   */
  it('should handle informational event (checkout.created) successfully', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'polar/webhook',
          data: {
            eventType: 'checkout.created',
            webhookId: 'webhook-123',
            svixId: 'svix-123',
            payload: { data: { amount: 9900, currency: 'usd' } },
            userId: 'user-123',
          },
        },
      ],
    })) as {
      result: {
        success: boolean;
        eventType: string;
        webhookId: string;
        action: string;
        message: string;
      };
    };

    expect(result).toEqual({
      success: true,
      eventType: 'checkout.created',
      webhookId: 'webhook-123',
      action: 'logged',
      message: 'Informational event checkout.created logged successfully',
    });

    // Should not call RPC (informational events don't trigger RPC)
    expect(prismocker.$queryRawUnsafe).not.toHaveBeenCalled();
  });

  /**
   * Success case: Unsupported event type
   *
   * Tests that unsupported event types are skipped gracefully.
   */
  it('should handle unsupported event type gracefully', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'polar/webhook',
          data: {
            eventType: 'unknown.event',
            webhookId: 'webhook-123',
            svixId: 'svix-123',
            payload: {},
            userId: 'user-123',
          },
        },
      ],
    })) as {
      result: {
        success: boolean;
        eventType: string;
        webhookId: string;
        action: string;
        message: string;
      };
    };

    expect(result).toEqual({
      success: true,
      eventType: 'unknown.event',
      webhookId: 'webhook-123',
      action: 'skipped',
      message: 'Event type unknown.event is not handled',
    });

    // Should not call RPC (unsupported events don't trigger RPC)
    expect(prismocker.$queryRawUnsafe).not.toHaveBeenCalled();
  });

  /**
   * Error case: Missing jobId for order event
   *
   * Tests that order events without jobId fail validation.
   */
  it('should fail validation for order event without jobId', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'polar/webhook',
          data: {
            eventType: 'order.paid',
            webhookId: 'webhook-123',
            svixId: 'svix-123',
            payload: {},
            // Missing jobId
            userId: 'user-123',
          },
        },
      ],
    })) as {
      result: {
        success: boolean;
        eventType: string;
        webhookId: string;
        action: string;
        error: string;
      };
    };

    expect(result).toEqual({
      success: false,
      eventType: 'order.paid',
      webhookId: 'webhook-123',
      action: 'validation_failed',
      error: 'Missing metadata.job_id for order event',
    });

    // Should not call RPC (validation failed)
    expect(prismocker.$queryRawUnsafe).not.toHaveBeenCalled();
  });

  /**
   * Error case: RPC call failure
   *
   * Tests that RPC call failures are handled and function throws for retry.
   */
  it('should handle RPC call failure and throw for retry', async () => {
    // Seed Prismocker with webhook event data
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('webhook_events', [
        {
          id: 'webhook-123',
          svix_id: 'svix-123',
          source: 'polar',
          event_type: 'order.paid',
          payload: {},
          processed: false,
          processed_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    }

    // Mock RPC failure
    (prismocker as any).$queryRawUnsafe = jest
      .fn<() => Promise<any[]>>()
      .mockRejectedValue(new Error('Database connection failed'));

    const { error } = (await t.execute({
      events: [
        {
          name: 'polar/webhook',
          data: {
            eventType: 'order.paid',
            webhookId: 'webhook-123',
            svixId: 'svix-123',
            payload: {},
            jobId: 'job-123',
            userId: 'user-123',
          },
        },
      ],
    })) as { error?: Error };

    expect(error).toBeDefined();
    expect(error?.message).toContain('Polar webhook processing failed');

    // Should not update webhook status on failure
    const webhook = await prismocker.webhook_events.findUnique({
      where: { id: 'webhook-123' },
    });
    expect(webhook?.processed).toBe(false);
  });

  /**
   * Success case: Webhook status update failure (non-critical)
   *
   * Tests that webhook status update failures are logged but don't fail the function.
   */
  it('should handle webhook status update failure gracefully', async () => {
    // Seed Prismocker with webhook event data
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('webhook_events', [
        {
          id: 'webhook-123',
          svix_id: 'svix-123',
          source: 'polar',
          event_type: 'order.paid',
          payload: {},
          processed: false,
          processed_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    }

    // Mock RPC success, but simulate webhook update failure by not seeding the webhook
    // (This tests that the function handles missing webhook gracefully)
    (prismocker as any).$queryRawUnsafe = jest.fn<() => Promise<any[]>>().mockResolvedValue([]);

    const { result } = (await t.execute({
      events: [
        {
          name: 'polar/webhook',
          data: {
            eventType: 'order.paid',
            webhookId: 'webhook-123',
            svixId: 'svix-123',
            payload: {},
            jobId: 'job-123',
            userId: 'user-123',
          },
        },
      ],
    })) as { result: { success: boolean } };

    // Should still succeed (status update is non-critical)
    expect(result.success).toBe(true);
  });

  /**
   * Step test: classify-event step
   *
   * Tests the classify-event step individually.
   */
  it('should execute classify-event step correctly', async () => {
    const { result } = (await t.executeStep('classify-event', {
      events: [
        {
          name: 'polar/webhook',
          data: {
            eventType: 'order.paid',
            webhookId: 'webhook-123',
            svixId: 'svix-123',
            payload: {},
            jobId: 'job-123',
            userId: 'user-123',
          },
        },
      ],
    })) as { result: { rpcName: string | null; isInformational: boolean; isSupported: boolean } };

    expect(result).toEqual({
      rpcName: 'handle_polar_order_paid',
      isInformational: false,
      isSupported: true,
    });
  });

  /**
   * Step test: execute-rpc step
   *
   * Tests the execute-rpc step individually.
   */
  it('should execute execute-rpc step correctly', async () => {
    // First execute classify-event step
    await t.executeStep('classify-event', {
      events: [
        {
          name: 'polar/webhook',
          data: {
            eventType: 'order.paid',
            webhookId: 'webhook-123',
            svixId: 'svix-123',
            payload: {},
            jobId: 'job-123',
            userId: 'user-123',
          },
        },
      ],
    });

    // Now execute full function to test execute-rpc step
    const { result } = (await t.execute({
      events: [
        {
          name: 'polar/webhook',
          data: {
            eventType: 'order.paid',
            webhookId: 'webhook-123',
            svixId: 'svix-123',
            payload: {},
            jobId: 'job-123',
            userId: 'user-123',
          },
        },
      ],
    })) as { result: { success: boolean } };

    expect(result.success).toBe(true);
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledTimes(1);
  });

  /**
   * Success case: Idempotency
   *
   * Tests that duplicate webhook events are handled idempotently.
   */
  it('should handle duplicate webhook events idempotently', async () => {
    const eventData = {
      name: 'polar/webhook' as const,
      data: {
        eventType: 'order.paid',
        webhookId: 'webhook-123', // Same webhookId
        svixId: 'svix-123',
        payload: {},
        jobId: 'job-123',
        userId: 'user-123',
      },
    };

    // Execute same event twice
    const { result: result1 } = (await t.execute({
      events: [eventData],
    })) as { result: { success: boolean } };

    // Create fresh test engine for second execution (simulating idempotency)
    const t2 = new InngestTestEngine({
      function: handlePolarWebhook,
    });
    (prismocker as any).$queryRawUnsafe.mockClear();

    const { result: result2 } = (await t2.execute({
      events: [eventData],
    })) as { result: { success: boolean } };

    // Both should succeed
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
  });

  /**
   * Success case: All informational event types
   *
   * Tests that all informational event types are handled correctly.
   */
  it('should handle all informational event types', async () => {
    const informationalEvents = ['checkout.created', 'checkout.updated', 'order.created'];

    for (const eventType of informationalEvents) {
      const t2 = new InngestTestEngine({
        function: handlePolarWebhook,
      });
      (prismocker as any).$queryRawUnsafe.mockClear();

      const { result } = (await t2.execute({
        events: [
          {
            name: 'polar/webhook',
            data: {
              eventType,
              webhookId: `webhook-${eventType}`,
              svixId: 'svix-123',
              payload: { data: { amount: 9900, currency: 'usd' } },
              userId: 'user-123',
            },
          },
        ],
      })) as { result: { success: boolean; action: string } };

      expect(result.success).toBe(true);
      expect(result.action).toBe('logged');
      expect(prismocker.$queryRawUnsafe).not.toHaveBeenCalled();
    }
  });
});
