type LogMeta = Record<string, unknown> | undefined;

function toErrorPayload(error: unknown): Record<string, unknown> | undefined {
  if (!error) {
    return undefined;
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (typeof error === 'string') {
    return { message: error };
  }

  return { error };
}

function serializeMeta(meta?: Record<string, unknown>): string {
  if (!meta || Object.keys(meta).length === 0) {
    return '';
  }

  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return ' {"meta":"[unserializable]"}';
  }
}

function format(level: string, message: string, meta?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] ${message}${serializeMeta(meta)}`;
}

function mergeMeta(
  meta?: LogMeta,
  extra?: Record<string, unknown>
): Record<string, unknown> | undefined {
  if (!(meta || extra)) {
    return undefined;
  }
  return { ...(meta ?? {}), ...(extra ?? {}) };
}

export const logger = {
  info(message: string, meta?: LogMeta) {
    console.log(format('INFO', message, meta));
  },

  warn(message: string, meta?: LogMeta) {
    console.warn(format('WARN', message, meta));
  },

  error(message: string, error?: unknown, meta?: LogMeta) {
    const extra = toErrorPayload(error);
    console.error(format('ERROR', message, mergeMeta(meta, extra)));
  },

  debug(message: string, meta?: LogMeta) {
    if (process.env['DEBUG'] !== 'true') return;
    console.debug(format('DEBUG', message, meta));
  },
};
