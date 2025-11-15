import type { Database } from '../../database.types.ts';
import { supabaseServiceRole } from '../../clients/supabase.ts';

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

export interface DiscordWebhookLogOptions {
  relatedId?: string;
  metadata?: Record<string, unknown>;
  logType?: string;
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
  const { data: logData, error: logError } = await supabaseServiceRole
    .from('webhook_events')
    .insert({
      source: 'discord',
      direction: 'outbound',
      type,
      data: data as Database['public']['Tables']['webhook_events']['Insert']['data'],
      created_at: new Date().toISOString(),
      processed: false,
      related_id: relatedId || null,
    })
    .select('id')
    .single();

  if (logError) {
    console.error('Failed to log webhook event:', logError);
    return null;
  }

  return logData.id;
}

export async function updateWebhookEventStatus(
  webhookEventId: string,
  success: boolean,
  httpStatus?: number,
  error?: string,
  responsePayload?: unknown,
  retryCount?: number
): Promise<void> {
  await supabaseServiceRole
    .from('webhook_events')
    .update({
      processed: true,
      processed_at: new Date().toISOString(),
      http_status_code: httpStatus,
      error: error || null,
      response_payload:
        responsePayload as Database['public']['Tables']['webhook_events']['Update']['response_payload'],
      retry_count: retryCount,
      success,
    })
    .eq('id', webhookEventId);
}

export async function sendDiscordWebhook(
  webhookUrl: string,
  payload: unknown,
  webhookType: string,
  options: DiscordWebhookLogOptions = {}
): Promise<{ status: number; retryCount: number }> {
  const { relatedId, metadata, logType } = options;
  let lastError: Error | null = null;
  let webhookEventId: string | null = null;
  const logPayload = metadata ?? payload;
  const eventType = logType ?? webhookType;

  const { data: logData, error: logError } = await supabaseServiceRole
    .from('webhook_events')
    .insert({
      source: 'discord',
      direction: 'outbound',
      type: eventType,
      data: logPayload as Database['public']['Tables']['webhook_events']['Insert']['data'],
      created_at: new Date().toISOString(),
      processed: false,
      related_id: relatedId || null,
    })
    .select('id')
    .single();

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
          await supabaseServiceRole
            .from('webhook_events')
            .update({
              processed: true,
              processed_at: new Date().toISOString(),
              http_status_code: response.status,
              response_payload: { success: true },
              retry_count: attempt,
            })
            .eq('id', webhookEventId);
        }

        console.log(`Discord webhook sent successfully (attempt ${attempt + 1})`);
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
      console.log(`Retry attempt ${attempt + 1}/${MAX_RETRIES} after ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  if (webhookEventId) {
    await supabaseServiceRole
      .from('webhook_events')
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
        error: lastError?.message || 'Max retries exceeded',
        retry_count: MAX_RETRIES,
      })
      .eq('id', webhookEventId);
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
    console.error('Failed to send Discord message:', {
      status: response.status,
      error: responseText,
      webhookType,
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
    (parsedResponse?.id as string | undefined) ??
    (parsedResponse?.message_id as string | undefined);

  if (!messageId) {
    console.warn('Discord response missing message ID');
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
    rawResponse: parsedResponse,
  };
}

export async function updateDiscordMessage(
  webhookUrl: string,
  messageId: string,
  payload: unknown,
  webhookType: string,
  relatedId?: string,
  metadata?: Record<string, unknown>
): Promise<{ status: number; deleted: boolean; retryCount: number }> {
  let lastError: Error | null = null;

  const logData = metadata
    ? { ...metadata, discord_message_id: messageId }
    : { ...payload, discord_message_id: messageId };

  const webhookEventId = await logOutboundWebhookEvent(`${webhookType}_update`, logData, relatedId);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${webhookUrl}/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.status === 404) {
        console.log('Discord message deleted (404) - caller should recreate');
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
        console.log(`Discord message updated successfully (attempt ${attempt + 1})`);
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
      console.log(`Retry attempt ${attempt + 1}/${MAX_RETRIES} after ${delay}ms`);
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
