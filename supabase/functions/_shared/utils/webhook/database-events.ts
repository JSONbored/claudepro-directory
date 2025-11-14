export interface DatabaseWebhookPayload<T = Record<string, unknown>> {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: T;
  old_record: T | null;
  schema: string;
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
