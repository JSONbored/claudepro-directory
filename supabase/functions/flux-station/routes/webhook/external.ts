/**
 * External Webhook Route
 * POST /webhook - Default route for external webhooks (catches all unmatched POST requests)
 */

import { errorToString } from '../../../_shared/utils/error-handling.ts';
import {
  badRequestResponse,
  errorResponse,
  successResponse,
  unauthorizedResponse,
  webhookCorsHeaders,
} from '../../../_shared/utils/http.ts';
import { MAX_BODY_SIZE, validateBodySize } from '../../../_shared/utils/input-validation.ts';
import { createNotificationRouterContext } from '../../../_shared/utils/logging.ts';
import { ingestWebhookEvent, WebhookIngestError } from '../../../_shared/utils/webhook/ingest.ts';

export async function handleExternalWebhook(req: Request): Promise<Response> {
  try {
    // Validate body size before reading
    const contentLength = req.headers.get('content-length');
    const bodySizeValidation = validateBodySize(contentLength, MAX_BODY_SIZE.webhook);
    if (!bodySizeValidation.valid) {
      return badRequestResponse(
        bodySizeValidation.error ?? 'Request body too large',
        webhookCorsHeaders
      );
    }

    const body = await req.text();
    // Double-check size after reading (in case Content-Length was missing/wrong)
    if (body.length > MAX_BODY_SIZE.webhook) {
      return badRequestResponse(
        `Request body too large (max ${MAX_BODY_SIZE.webhook} bytes)`,
        webhookCorsHeaders
      );
    }
    const result = await ingestWebhookEvent(body, req.headers);
    const cors = result.cors ?? webhookCorsHeaders;

    const logContext = createNotificationRouterContext('external-webhook', {
      source: result.source,
    });

    if (result.duplicate) {
      console.log('[flux-station] Webhook already processed', {
        ...logContext,
        duplicate: result.duplicate,
        received_at: new Date().toISOString(),
      });
    } else {
      console.log('[flux-station] Webhook routed', {
        ...logContext,
        duplicate: result.duplicate,
        received_at: new Date().toISOString(),
      });
    }

    // CORS headers are Record<string, string> but successResponse expects specific type
    // Use type assertion to satisfy type checker - runtime behavior is correct
    type CorsHeadersType = {
      'Access-Control-Allow-Origin': string;
      'Access-Control-Allow-Methods': string;
      'Access-Control-Allow-Headers': string;
    };
    return successResponse(
      { message: 'OK', source: result.source, duplicate: result.duplicate },
      200,
      cors as CorsHeadersType
    );
  } catch (error) {
    const logContext = createNotificationRouterContext('external-webhook', {
      source: 'unknown',
    });

    if (error instanceof WebhookIngestError) {
      if (error.status === 'unauthorized') {
        console.warn('[flux-station] Unauthorized webhook', {
          ...logContext,
          message: error.message,
        });
        return unauthorizedResponse(error.message, webhookCorsHeaders);
      }
      console.warn('[flux-station] Bad webhook payload', {
        ...logContext,
        message: error.message,
      });
      return badRequestResponse(error.message, webhookCorsHeaders);
    }

    console.error('[flux-station] Unexpected webhook error', {
      ...logContext,
      error: errorToString(error),
    });
    return errorResponse(error, 'flux-station:webhook', webhookCorsHeaders);
  }
}
