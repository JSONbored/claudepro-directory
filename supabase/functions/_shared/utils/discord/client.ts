import type { Database as DatabaseGenerated, Json } from '../../database.types.ts';
import { insertTable, updateTable, WEBHOOK_DIRECTION_VALUES } from '../../database-overrides.ts';
import type { BaseLogContext } from '../logging.ts';
import { createUtilityContext } from '../logging.ts';

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

export interface DiscordWebhookLogOptions {
  relatedId?: string;
  metadata?: Record<string, unknown>;
  logType?: string;
  logContext?: BaseLogContext;
}

export interface DiscordMessageCreateOptions extends DiscordWebhookLogOptions {
  waitForResponse?: boolean;
}

export interface DiscordMessageCreateResult {
  status: number;
  messageId: string;
  retryCount: number;
  rawResponse?: Record<string, unknown>;
}

export async function logOutboundWebhookEvent(
  type: string,
  data: unknown,
  relatedId?: string
): Promise<string | null> {
  const insertData: DatabaseGenerated['public']['Tables']['webhook_events']['Insert'] = {
    source: 'discord',
    direction: WEBHOOK_DIRECTION_VALUES[1], // 'outbound'
    type,
    data: data as Json,
    created_at: new Date().toISOString(),
    processed: false,
    related_id: relatedId ?? null,
  };
  const result = insertTable('webhook_events', insertData);
  const { data: logData, error: logError } = await result.select('id').single<{ id: string }>();

  if (logError) {
    const context = createUtilityContext('discord-client', 'log-outbound-webhook-event', { type });
    console.error('[discord-client] Failed to log webhook event', {
      ...context,
      error: logError instanceof Error ? logError.message : String(logError),
    });
    return null;
  }

  return logData?.id ?? null;
}

export async function updateWebhookEventStatus(
  webhookEventId: string,
  success: boolean,
  httpStatus?: number,
  error?: string,
  responsePayload?: unknown,
  retryCount?: number
): Promise<void> {
  // success parameter determines if webhook was successful (used for logging/analytics)
  const updateData: DatabaseGenerated['public']['Tables']['webhook_events']['Update'] = {
    processed: true,
    processed_at: new Date().toISOString(),
    http_status_code: httpStatus ?? null,
    error: success ? null : (error ?? 'Unknown error'),
    response_payload: responsePayload ? (responsePayload as Json) : null,
    retry_count: retryCount ?? null,
  };
  await updateTable('webhook_events', updateData, webhookEventId);
}

export async function sendDiscordWebhook(
  webhookUrl: string,
  payload: unknown,
  webhookType: string,
  options: DiscordWebhookLogOptions = {}
): Promise<{ status: number; retryCount: number }> {
  const { relatedId, metadata, logType, logContext } = options;
  let lastError: Error | null = null;
  let webhookEventId: string | null = null;
  const logPayload = metadata ?? payload;
  const eventType = logType ?? webhookType;

  const insertData2: DatabaseGenerated['public']['Tables']['webhook_events']['Insert'] = {
    source: 'discord',
    direction: WEBHOOK_DIRECTION_VALUES[1], // 'outbound'
    type: eventType,
    data: logPayload as Json,
    created_at: new Date().toISOString(),
    processed: false,
    related_id: relatedId ?? null,
  };
  const result2 = insertTable('webhook_events', insertData2);
  const { data: logData, error: logError } = await result2.select('id').single<{ id: string }>();

  if (!logError && logData) {
    webhookEventId = logData.id;
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        if (webhookEventId) {
          const successUpdateData: DatabaseGenerated['public']['Tables']['webhook_events']['Update'] =
            {
              processed: true,
              processed_at: new Date().toISOString(),
              http_status_code: response.status,
              response_payload: { success: true } as Json,
              retry_count: attempt,
            };
          await updateTable('webhook_events', successUpdateData, webhookEventId);
        }

        console.log('[discord-client] Webhook sent successfully', {
          ...(logContext || {}),
          function: 'discord-client',
          action: 'send-discord-webhook',
          webhook_type: webhookType,
          attempt: attempt + 1,
          status: response.status,
        });
        return { status: response.status, retryCount: attempt };
      }

      const errorText = await response.text();
      lastError = new Error(`Discord API returned ${response.status}: ${errorText}`);

      if (response.status >= 400 && response.status < 500) {
        throw lastError;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (lastError.message.includes('4')) {
        throw lastError;
      }
    }

    if (attempt < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY_MS * 2 ** attempt;
      console.log('[discord-client] Retry attempt', {
        ...(logContext || {}),
        function: 'discord-client',
        action: 'send-discord-webhook',
        webhook_type: webhookType,
        attempt: attempt + 1,
        max_retries: MAX_RETRIES,
        delay_ms: delay,
      });
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  if (webhookEventId) {
    const errorUpdateData: DatabaseGenerated['public']['Tables']['webhook_events']['Update'] = {
      processed: true,
      processed_at: new Date().toISOString(),
      error: lastError?.message || 'Max retries exceeded',
      retry_count: MAX_RETRIES,
    };
    await updateTable('webhook_events', errorUpdateData, webhookEventId);
  }

  throw lastError || new Error('Max retries exceeded');
}

export async function createDiscordMessageWithLogging(
  webhookUrl: string,
  payload: Record<string, unknown>,
  webhookType: string,
  options: DiscordMessageCreateOptions = {}
): Promise<DiscordMessageCreateResult> {
  const { relatedId, metadata, logType, waitForResponse = true } = options;
  const logPayload = metadata ? { ...metadata } : payload;
  const eventType = logType ?? `${webhookType}_create`;

  const webhookEventId = await logOutboundWebhookEvent(eventType, logPayload, relatedId);
  const targetUrl = waitForResponse ? `${webhookUrl}?wait=true` : webhookUrl;

  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  const parsedResponse =
    responseText && response.headers.get('Content-Type')?.includes('application/json')
      ? (JSON.parse(responseText) as Record<string, unknown>)
      : undefined;

  if (!response.ok) {
    console.error('[discord-client] Failed to send Discord message', {
      ...(options.logContext || {}),
      function: 'discord-client',
      action: 'create-discord-message',
      webhook_type: webhookType,
      status: response.status,
      error: responseText,
    });

    if (webhookEventId) {
      await updateWebhookEventStatus(
        webhookEventId,
        false,
        response.status,
        `Discord API error: ${response.statusText} - ${responseText}`,
        parsedResponse
      );
    }

    throw new Error(`Discord API error: ${response.statusText}`);
  }

  const messageId =
    (parsedResponse?.['id'] as string | undefined) ??
    (parsedResponse?.['message_id'] as string | undefined);

  if (!messageId) {
    console.warn('[discord-client] Discord response missing message ID', {
      ...(options.logContext || {}),
      function: 'discord-client',
      action: 'create-discord-message',
      webhook_type: webhookType,
    });
  }

  if (webhookEventId) {
    await updateWebhookEventStatus(webhookEventId, true, response.status, undefined, {
      message_id: messageId,
      response: parsedResponse,
    });
  }

  return {
    status: response.status,
    messageId: messageId ?? '',
    retryCount: 0,
    ...(parsedResponse !== undefined ? { rawResponse: parsedResponse } : {}),
  };
}

export async function updateDiscordMessage(
  webhookUrl: string,
  messageId: string,
  payload: unknown,
  webhookType: string,
  relatedId?: string,
  metadata?: Record<string, unknown>,
  logContext?: BaseLogContext
): Promise<{ status: number; deleted: boolean; retryCount: number }> {
  let lastError: Error | null = null;

  const logData: Record<string, unknown> = metadata
    ? { ...metadata, discord_message_id: messageId }
    : payload && typeof payload === 'object' && !Array.isArray(payload)
      ? {
          ...(payload as Record<string, unknown>),
          discord_message_id: messageId,
        }
      : { discord_message_id: messageId };

  const webhookEventId = await logOutboundWebhookEvent(`${webhookType}_update`, logData, relatedId);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${webhookUrl}/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.status === 404) {
        console.log('[discord-client] Discord message deleted (404)', {
          ...(logContext || {}),
          function: 'discord-client',
          action: 'update-discord-message',
          webhook_type: webhookType,
          message_id: messageId,
        });
        if (webhookEventId) {
          await updateWebhookEventStatus(
            webhookEventId,
            false,
            404,
            'Discord message not found (deleted)',
            null,
            attempt
          );
        }
        return { status: 404, deleted: true, retryCount: attempt };
      }

      if (response.ok) {
        if (webhookEventId) {
          await updateWebhookEventStatus(
            webhookEventId,
            true,
            response.status,
            undefined,
            { success: true },
            attempt
          );
        }
        console.log('[discord-client] Discord message updated successfully', {
          ...(logContext || {}),
          function: 'discord-client',
          action: 'update-discord-message',
          webhook_type: webhookType,
          message_id: messageId,
          attempt: attempt + 1,
          status: response.status,
        });
        return { status: response.status, deleted: false, retryCount: attempt };
      }

      const errorText = await response.text();
      lastError = new Error(`Discord API returned ${response.status}: ${errorText}`);

      if (response.status >= 400 && response.status < 500) {
        throw lastError;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (lastError.message.includes('4')) {
        throw lastError;
      }
    }

    if (attempt < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY_MS * 2 ** attempt;
      console.log('[discord-client] Retry attempt', {
        ...(logContext || {}),
        function: 'discord-client',
        action: 'update-discord-message',
        webhook_type: webhookType,
        message_id: messageId,
        attempt: attempt + 1,
        max_retries: MAX_RETRIES,
        delay_ms: delay,
      });
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  if (webhookEventId) {
    await updateWebhookEventStatus(
      webhookEventId,
      false,
      undefined,
      lastError?.message || 'Max retries exceeded',
      null,
      MAX_RETRIES
    );
  }

  throw lastError || new Error('Max retries exceeded');
}
