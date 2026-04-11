type RateBucket = {
  count: number;
  resetAt: number;
};

const rateBuckets = new Map<string, RateBucket>();

const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/heyclau\.de$/i,
  /^https:\/\/dev\.heyclau\.de$/i,
  /^https:\/\/[a-z0-9-]+\.zeronode\.workers\.dev$/i,
  /^http:\/\/localhost:(3000|8787)$/i,
  /^http:\/\/127\.0\.0\.1:(3000|8787)$/i
];

export function getClientIp(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export function isAllowedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  return ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin));
}

export function hasBodyWithinLimit(request: Request, maxBytes: number) {
  const header = request.headers.get("content-length");
  if (!header) return true;
  const parsed = Number(header);
  if (!Number.isFinite(parsed) || parsed < 0) return false;
  return parsed <= maxBytes;
}

export function hasJsonContentType(request: Request) {
  const header = request.headers.get("content-type");
  if (!header) return false;
  return header.toLowerCase().startsWith("application/json");
}

export function isRateLimited(params: {
  request: Request;
  scope: string;
  limit: number;
  windowMs: number;
}) {
  const { request, scope, limit, windowMs } = params;
  const now = Date.now();
  const bucketKey = `${scope}:${getClientIp(request)}`;
  const current = rateBuckets.get(bucketKey);

  if (!current || current.resetAt <= now) {
    rateBuckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (current.count >= limit) return true;

  current.count += 1;
  rateBuckets.set(bucketKey, current);
  return false;
}
