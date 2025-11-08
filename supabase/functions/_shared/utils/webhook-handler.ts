/**
 * Shared webhook handler utilities - CORS, validation, response patterns
 */

export interface DatabaseWebhookPayload<T = Record<string, unknown>> {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: T;
  old_record: T | null;
  schema: string;
}

export function handleCorsPreflight(): Response {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export function validateWebhookUrl(
  envVar: string | undefined,
  envVarName: string
): string | Response {
  if (!envVar) {
    console.error(`${envVarName} environment variable not set`);
    return new Response('Discord webhook not configured', { status: 500 });
  }
  return envVar;
}

export function webhookErrorResponse(error: unknown, context: string): Response {
  console.error(`${context} error:`, error);
  return new Response(
    JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

export function webhookSuccessResponse(data: Record<string, unknown>): Response {
  return new Response(JSON.stringify({ success: true, ...data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function webhookSkipResponse(reason: string): Response {
  return new Response(JSON.stringify({ skipped: true, reason }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function filterEventType<T>(
  payload: DatabaseWebhookPayload<T>,
  allowedTypes: Array<'INSERT' | 'UPDATE' | 'DELETE'>
): boolean {
  return allowedTypes.includes(payload.type);
}

export function didStatusChangeTo<T extends { status?: string }>(
  payload: DatabaseWebhookPayload<T>,
  targetStatus: string
): boolean {
  return (
    payload.type === 'UPDATE' &&
    payload.old_record?.status !== targetStatus &&
    payload.record?.status === targetStatus
  );
}
