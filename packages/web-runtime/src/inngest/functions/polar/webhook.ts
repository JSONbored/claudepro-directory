/**
 * Polar Webhook Inngest Function
 *
 * Unified handler for all Polar payment webhook events.
 * Provides durable, idempotent processing with automatic retries.
 *
 * Supported events:
 * - order.paid → Activates job listing after payment
 * - order.refunded → Handles refund processing
 * - subscription.active → Handles subscription renewals
 * - subscription.canceled → Handles subscription cancellation
 * - subscription.revoked → Handles subscription revocation
 *
 * Idempotency:
 * - Uses webhookId (database UUID) as idempotency key
 * - Each event is processed exactly once
 * - Retries are safe due to database RPC idempotency
 *
 * @see https://docs.polar.sh/integrate/webhooks/events
 */

import { Prisma } from '@prisma/client';
type Json = Prisma.JsonValue;
import { normalizeError } from '@heyclaude/shared-runtime';

import { logger } from '../../../logging/server';
import { getService } from '../../../data/service-factory';
import { CONCURRENCY_LIMITS, RETRY_CONFIGS, ACCOUNT_CONCURRENCY_KEYS } from '../../config';
import { createInngestFunction } from '../../utils/function-factory';

/**
 * Polar event types that trigger database RPC functions
 */
const POLAR_EVENT_RPC_MAP: Record<string, string> = {
  'order.paid': 'handle_polar_order_paid',
  'order.refunded': 'handle_polar_order_refunded',
  'subscription.active': 'handle_polar_subscription_renewal',
  'subscription.canceled': 'handle_polar_subscription_canceled',
  'subscription.revoked': 'handle_polar_subscription_revoked',
} as const;

/**
 * Informational events that are logged but don't trigger RPC
 */
const POLAR_INFORMATIONAL_EVENTS = [
  'checkout.created',
  'checkout.updated',
  'order.created',
] as const;

type InformationalEvent = (typeof POLAR_INFORMATIONAL_EVENTS)[number];

/**
 * Unified Polar Webhook Handler
 *
 * Processes all Polar webhook events with:
 * - Idempotency via webhookId
 * - Concurrency limits to respect Polar API limits
 * - Automatic retries on failure
 * - Comprehensive logging
 */
export const handlePolarWebhook = createInngestFunction(
  {
    id: 'polar-webhook-handler',
    name: 'Polar Webhook Handler',
    route: '/inngest/polar/webhook',
    retries: RETRY_CONFIGS.WEBHOOK,
    // Idempotency: Use webhookId to prevent duplicate processing
    // This ensures the same webhook is processed exactly once
    idempotency: 'event.data.webhookId',
    // Concurrency: Limit parallel Polar processing
    concurrency: {
      limit: CONCURRENCY_LIMITS.POLAR_API,
      key: ACCOUNT_CONCURRENCY_KEYS.POLAR,
    },
    // Throttle: Limit to 50 events per minute to prevent abuse
    // Payment webhooks are less frequent but can spike during high activity
    throttle: {
      limit: 50,
      period: '1m',
      key: 'event.data.userId', // Throttle per user to handle user-specific bursts
    },
    // BetterStack monitoring: Send heartbeat on failure (feature-flagged)
    onFailureHeartbeat: 'BETTERSTACK_HEARTBEAT_CRITICAL_FAILURE',
  },
  { event: 'polar/webhook' },
  async ({ event, step, logContext }) => {

    const { eventType, webhookId, svixId, payload, jobId, userId } = event.data;

    logger.info(
      { ...logContext, eventType, webhookId, svixId, jobId: jobId ?? null, userId: userId ?? null },
      'Processing Polar webhook via Inngest'
    );

    // Step 1: Classify the event type
    const classification = await step.run('classify-event', async () => {
      const rpcName = POLAR_EVENT_RPC_MAP[eventType];
      const isInformational = POLAR_INFORMATIONAL_EVENTS.includes(eventType as InformationalEvent);

      return {
        rpcName: rpcName ?? null,
        isInformational,
        isSupported: !!rpcName || isInformational,
      };
    });

    // Step 2: Handle informational events (log only)
    if (classification.isInformational) {
      await step.run('log-informational-event', async () => {
        const data = payload['data'] as Record<string, unknown> | undefined;
        const amount = typeof data?.['amount'] === 'number' ? data['amount'] : null;
        const currency = String(data?.['currency'] ?? '');

        logger.info(
          { ...logContext, eventType, webhookId, amount, currency, status: 'logged' },
          'Polar informational event received'
        );

        return { logged: true };
      });

      return {
        success: true,
        eventType,
        webhookId,
        action: 'logged',
        message: `Informational event ${eventType} logged successfully`,
      };
    }

    // Step 3: Handle unsupported events
    if (!classification.isSupported || !classification.rpcName) {
      logger.info(
        {
          ...logContext,
          eventType,
          webhookId,
          supportedEvents: Object.keys(POLAR_EVENT_RPC_MAP).join(', '),
        },
        'Polar event type has no handler'
      );

      return {
        success: true,
        eventType,
        webhookId,
        action: 'skipped',
        message: `Event type ${eventType} is not handled`,
      };
    }

    // Step 4: Validate required data for order events
    if (eventType.startsWith('order.') && !jobId) {
      const validationResult = await step.run('validate-order-metadata', async () => {
        logger.warn(
          { ...logContext, eventType, webhookId },
          'Polar order webhook missing job_id in metadata'
        );

        return {
          valid: false,
          error: 'Missing metadata.job_id for order event',
        };
      });

      if (!validationResult.valid) {
        return {
          success: false,
          eventType,
          webhookId,
          action: 'validation_failed',
          error: validationResult.error,
        };
      }
    }

    // Step 5: Execute the database RPC function
    const rpcResult = await step.run(
      'execute-rpc',
      async (): Promise<{
        success: boolean;
        rpcName: string;
        error?: string;
      }> => {
        logger.info(
          { ...logContext, rpcName: classification.rpcName, webhookId, jobId: jobId ?? null },
          'Calling Polar RPC handler'
        );

        try {
          // Use MiscService to call the Polar webhook RPC function
          // The RPC functions handle their own idempotency via the webhook_id
          const service = await getService('misc');
          await service.handlePolarWebhookRpc(classification.rpcName!, {
            webhook_id: webhookId,
            webhook_data: payload as Json,
          });

          return {
            success: true,
            rpcName: classification.rpcName!,
          };
        } catch (error) {
          const normalized = normalizeError(error, 'Polar RPC call failed');
          logger.error(
            {
              err: normalized,
              ...logContext,
              rpcName: classification.rpcName,
              webhookId,
              jobId: jobId ?? null,
            },
            'Polar RPC call failed'
          );

          return {
            success: false,
            rpcName: classification.rpcName!,
            error: normalized.message,
          };
        }
      }
    );

    // Step 6: Update webhook event status in database
    if (rpcResult.success) {
      await step.run('update-webhook-status', async () => {
        try {
          const service = await getService('misc');
          await service.updateWebhookEventStatus(webhookId);

          logger.info({ ...logContext, webhookId, status: 'processed' }, 'Webhook status updated');
        } catch (error) {
          // Non-critical: Log but don't fail the function
          const normalized = normalizeError(error, 'Failed to update webhook status');
          logger.warn(
            { ...logContext, webhookId, errorMessage: normalized.message },
            'Failed to update webhook status'
          );
        }
      });
    }

    // Additional custom logging (duration logging is handled by factory)
    logger.info(
      {
        ...logContext,
        eventType,
        webhookId,
        rpcName: classification.rpcName,
        success: rpcResult.success,
      },
      'Polar webhook processing completed'
    );

    if (!rpcResult.success) {
      // Throw to trigger retry
      throw new Error(`Polar webhook processing failed: ${rpcResult.error}`);
    }

    return {
      success: true,
      eventType,
      webhookId,
      action: 'processed',
      rpcName: rpcResult.rpcName,
    };
  }
);
