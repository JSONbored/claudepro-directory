import { z } from 'zod';
import { normalizeError } from './errors.ts';

export function sanitizeError(error: unknown, fallback = 'Error occurred'): string {
  const normalized = normalizeError(error, fallback);
  return normalized.message
    .replace(/\/Users\/[^/\s]+/g, '[USER]')
    .replace(/\/var\/[^/\s]+/g, '[PATH]')
    .replace(/\/home\/[^/\s]+/g, '[PATH]')
    .replace(/file:\/\/.*?\//g, '[FILE]');
}

export function formatZodError(error: z.ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join('.') || 'root',
    message: issue.message,
    code: issue.code,
  }));
}
