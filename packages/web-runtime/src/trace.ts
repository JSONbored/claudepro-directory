export function generateTraceId(): string {
  return `trace_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export async function traceMeta<T extends Record<string, unknown>>(
  meta?: T
): Promise<T & { traceId: string }> {
  const traceId = generateTraceId();
  return {
    traceId,
    ...(meta ?? ({} as T)),
  };
}
