/**
 * Polar Webhook Inngest Function Tests
 *
 * Tests the handlePolarWebhook function using @inngest/test.
 * This tests the function logic, not the route handler.
 *
 * @module web-runtime/inngest/functions/polar/webhook.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InngestTestEngine } from '@inngest/test';
import { handlePolarWebhook } from './webhook';
import * as serviceFactory from '../../../data/service-factory';
import { logger } from '../../../logging/server';
import { normalizeError } from '@heyclaude/shared-runtime';

// Hoist mocks BEFORE importing the function to ensure mocks are applied
const mockGetService = vi.hoisted(() => vi.fn());
const mockLogger = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));
const mockCreateWebAppContextWithId = vi.hoisted(() => vi.fn(() => ({
  requestId: 'test-request-id',
  operation: 'handlePolarWebhook',
  route: '/inngest/polar/webhook',
})));
const mockNormalizeError = vi.hoisted(() => vi.fn((error: unknown) => {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}));

// Mock service factory
vi.mock('../../../data/service-factory', () => ({
  getService: mockGetService,
}));

// Mock logging
vi.mock('../../../logging/server', () => ({
  logger: mockLogger,
  createWebAppContextWithId: mockCreateWebAppContextWithId,
}));

// Mock shared runtime
vi.mock('@heyclaude/shared-runtime', () => ({
  normalizeError: mockNormalizeError,
}));

// Import function AFTER mocks are set up
describe('handlePolarWebhook', () => {
  /**
   * Test engine instance - created fresh for each test to avoid state caching
   */
  let t: InngestTestEngine;

  /**
   * Mock MiscService instance
   */
  let mockMiscService: {
    handlePolarWebhookRpc: ReturnType<typeof vi.fn>;
    updateWebhookEventStatus: ReturnType<typeof vi.fn>;
  };

  /**
   * Setup before each test
   * - Creates fresh test engine instance
   * - Resets all mocks to clean state
   * - Sets up default mock return values
   */
  beforeEach(() => {
    // Create fresh test engine instance for each test
    // This prevents step result memoization between tests
    t = new InngestTestEngine({
      function: handlePolarWebhook,
    });

    // Reset all mocks to ensure clean state
    vi.clearAllMocks();
    mockGetService.mockReset();

    // Set up mock MiscService
    mockMiscService = {
      handlePolarWebhookRpc: vi.fn().mockResolvedValue(undefined),
      updateWebhookEventStatus: vi.fn().mockResolvedValue(undefined),
    };

    mockGetService.mockResolvedValue(mockMiscService as never);

    mockNormalizeError.mockImplementation((error) => {
      if (error instanceof Error) {
        return error;
      }
      return new Error(String(error));
    });
  });

  /**
   * Success case: Order paid event
   *
   * Tests that order.paid events are processed correctly.
   */
  it('should handle order.paid event successfully', async () => {
    const { result } = await t.execute({
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
    });

    expect(result).toEqual({
      success: true,
      eventType: 'order.paid',
      webhookId: 'webhook-123',
      action: 'processed',
      rpcName: 'handle_polar_order_paid',
    });

    expect(mockMiscService.handlePolarWebhookRpc).toHaveBeenCalledWith('handle_polar_order_paid', {
      webhook_id: 'webhook-123',
      webhook_data: { data: { amount: 9900, currency: 'usd' } },
    });
    expect(mockMiscService.updateWebhookEventStatus).toHaveBeenCalledWith('webhook-123');
  });

  /**
   * Success case: Order refunded event
   *
   * Tests that order.refunded events are processed correctly.
   */
  it('should handle order.refunded event successfully', async () => {
    const { result } = await t.execute({
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
    });

    expect(result).toEqual({
      success: true,
      eventType: 'order.refunded',
      webhookId: 'webhook-123',
      action: 'processed',
      rpcName: 'handle_polar_order_refunded',
    });

    expect(mockMiscService.handlePolarWebhookRpc).toHaveBeenCalledWith('handle_polar_order_refunded', {
      webhook_id: 'webhook-123',
      webhook_data: { data: { amount: 9900, currency: 'usd' } },
    });
  });

  /**
   * Success case: Subscription active event
   *
   * Tests that subscription.active events are processed correctly.
   */
  it('should handle subscription.active event successfully', async () => {
    const { result } = await t.execute({
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
    });

    expect(result).toEqual({
      success: true,
      eventType: 'subscription.active',
      webhookId: 'webhook-123',
      action: 'processed',
      rpcName: 'handle_polar_subscription_renewal',
    });

    expect(mockMiscService.handlePolarWebhookRpc).toHaveBeenCalledWith('handle_polar_subscription_renewal', {
      webhook_id: 'webhook-123',
      webhook_data: { data: { subscription_id: 'sub-123' } },
    });
  });

  /**
   * Success case: Subscription canceled event
   *
   * Tests that subscription.canceled events are processed correctly.
   */
  it('should handle subscription.canceled event successfully', async () => {
    const { result } = await t.execute({
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
    });

    expect(result.success).toBe(true);
    expect(result.rpcName).toBe('handle_polar_subscription_canceled');
  });

  /**
   * Success case: Subscription revoked event
   *
   * Tests that subscription.revoked events are processed correctly.
   */
  it('should handle subscription.revoked event successfully', async () => {
    const { result } = await t.execute({
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
    });

    expect(result.success).toBe(true);
    expect(result.rpcName).toBe('handle_polar_subscription_revoked');
  });

  /**
   * Success case: Informational event (checkout.created)
   *
   * Tests that informational events are logged but not processed via RPC.
   */
  it('should handle informational event (checkout.created) successfully', async () => {
    const { result } = await t.execute({
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
    });

    expect(result).toEqual({
      success: true,
      eventType: 'checkout.created',
      webhookId: 'webhook-123',
      action: 'logged',
      message: 'Informational event checkout.created logged successfully',
    });

    // Should not call RPC
    expect(mockMiscService.handlePolarWebhookRpc).not.toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'checkout.created',
        webhookId: 'webhook-123',
        status: 'logged',
      }),
      'Polar informational event received'
    );
  });

  /**
   * Success case: Unsupported event type
   *
   * Tests that unsupported event types are skipped gracefully.
   */
  it('should handle unsupported event type gracefully', async () => {
    const { result } = await t.execute({
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
    });

    expect(result).toEqual({
      success: true,
      eventType: 'unknown.event',
      webhookId: 'webhook-123',
      action: 'skipped',
      message: 'Event type unknown.event is not handled',
    });

    // Should not call RPC
    expect(mockMiscService.handlePolarWebhookRpc).not.toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'unknown.event',
        supportedEvents: expect.stringContaining('order.paid'),
      }),
      'Polar event type has no handler'
    );
  });

  /**
   * Error case: Missing jobId for order event
   *
   * Tests that order events without jobId fail validation.
   */
  it('should fail validation for order event without jobId', async () => {
    const { result } = await t.execute({
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
    });

    expect(result).toEqual({
      success: false,
      eventType: 'order.paid',
      webhookId: 'webhook-123',
      action: 'validation_failed',
      error: 'Missing metadata.job_id for order event',
    });

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'order.paid',
        webhookId: 'webhook-123',
      }),
      'Polar order webhook missing job_id in metadata'
    );

    // Should not call RPC
    expect(mockMiscService.handlePolarWebhookRpc).not.toHaveBeenCalled();
  });

  /**
   * Error case: RPC call failure
   *
   * Tests that RPC call failures are handled and function throws for retry.
   */
  it('should handle RPC call failure and throw for retry', async () => {
    mockMiscService.handlePolarWebhookRpc.mockRejectedValue(new Error('Database connection failed'));

    const { error } = await t.execute({
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

    expect(error).toBeDefined();
    expect(error?.message).toContain('Polar webhook processing failed');

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        rpcName: 'handle_polar_order_paid',
        webhookId: 'webhook-123',
      }),
      'Polar RPC call failed'
    );

    // Should not update webhook status on failure
    expect(mockMiscService.updateWebhookEventStatus).not.toHaveBeenCalled();
  });

  /**
   * Success case: Webhook status update failure (non-critical)
   *
   * Tests that webhook status update failures are logged but don't fail the function.
   */
  it('should handle webhook status update failure gracefully', async () => {
    mockMiscService.updateWebhookEventStatus.mockRejectedValue(new Error('Database update failed'));

    const { result } = await t.execute({
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

    // Should still succeed (status update is non-critical)
    expect(result.success).toBe(true);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        webhookId: 'webhook-123',
        errorMessage: 'Database update failed',
      }),
      'Failed to update webhook status'
    );
  });

  /**
   * Step test: classify-event step
   *
   * Tests the classify-event step individually.
   */
  it('should execute classify-event step correctly', async () => {
    const { result } = await t.executeStep('classify-event', {
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
    const { result } = await t.execute({
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

    expect(result.success).toBe(true);
    expect(mockMiscService.handlePolarWebhookRpc).toHaveBeenCalledTimes(1);
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
    const { result: result1 } = await t.execute({
      events: [eventData],
    });

    // Create fresh test engine for second execution (simulating idempotency)
    const t2 = new InngestTestEngine({
      function: handlePolarWebhook,
    });
    mockMiscService.handlePolarWebhookRpc.mockClear();

    const { result: result2 } = await t2.execute({
      events: [eventData],
    });

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
      mockMiscService.handlePolarWebhookRpc.mockClear();

      const { result } = await t2.execute({
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
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('logged');
      expect(mockMiscService.handlePolarWebhookRpc).not.toHaveBeenCalled();
    }
  });
});

