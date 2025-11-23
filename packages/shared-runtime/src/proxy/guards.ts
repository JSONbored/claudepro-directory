'use server';

const UUID_REGEX = /\/api\/[^/]*\/[a-f0-9-]{36}/gi;
const NUMERIC_ID_REGEX = /\/api\/[^/]*\/\d+/gi;
const QUERY_STRING_REGEX = /\?.*$/;

export const DEFAULT_SUSPICIOUS_HEADERS = [
  'x-middleware-subrequest',
  'x-middleware-rewrite',
  'x-middleware-next',
  'x-middleware-invoke',
  'x-invoke-path',
  'x-vercel-invoke-path',
] as const;

export interface SuspiciousHeader {
  header: string;
  value: string;
}

export function detectSuspiciousHeaders(
  request: Request,
  headers: readonly string[] = DEFAULT_SUSPICIOUS_HEADERS
): SuspiciousHeader[] {
  const matches: SuspiciousHeader[] = [];
  for (const header of headers) {
    const value = request.headers.get(header);
    if (value !== null) {
      matches.push({ header, value });
    }
  }
  return matches;
}

export function sanitizePathForLogging(path: string): string {
  return path
    .replace(UUID_REGEX, '/api/*/[UUID]')
    .replace(NUMERIC_ID_REGEX, '/api/*/[ID]')
    .replace(QUERY_STRING_REGEX, '')
    .slice(0, 200);
}

export function getClientInfo(request: Request): { ip: string; userAgent: string } {
  const ip =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return {
    ip,
    userAgent: userAgent.slice(0, 100),
  };
}
