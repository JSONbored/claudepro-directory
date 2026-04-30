import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import { ZodError, type z } from "zod";

import {
  getApiRouteDefinition,
  type ApiRouteDefinition,
  type ApiRouteId,
} from "@/lib/api/contracts";
import {
  BodyTooLargeError,
  getClientIp,
  hasJsonContentType,
  isAllowedOrigin,
  isRateLimited,
  readRequestTextWithinLimit,
} from "@/lib/api-security";
import { logApiError, logApiWarn } from "@/lib/api-logs";
import { applySecurityHeaders } from "@/lib/security-headers";

type NextRouteContext = {
  params?: Promise<Record<string, string>> | Record<string, string>;
};

type ParsedApiContext<TDefinition extends ApiRouteDefinition> = {
  request: Request;
  requestId: string;
  route: TDefinition;
  params: unknown;
  query: unknown;
  body: unknown;
  rawBody?: string;
};

type RateLimitBinding = {
  limit: (params: { key: string }) => Promise<{ success: boolean }>;
};

function getRequestId(request: Request) {
  return (
    request.headers.get("cf-ray") ||
    request.headers.get("x-request-id") ||
    crypto.randomUUID()
  );
}

function getQueryObject(request: Request) {
  const url = new URL(request.url);
  return Object.fromEntries(url.searchParams.entries());
}

function normalizeZodIssues(error: ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  }));
}

function errorMessage(code: string) {
  return code.replaceAll("_", " ").replace(/^\w/, (char) => char.toUpperCase());
}

export function apiError(
  code: string,
  status: number,
  options: {
    details?: unknown;
    message?: string;
    requestId?: string;
    headers?: HeadersInit;
  } = {},
) {
  const headers = applySecurityHeaders(new Headers(options.headers));
  headers.set("content-type", "application/json; charset=utf-8");
  if (!headers.has("cache-control")) headers.set("cache-control", "no-store");

  return NextResponse.json(
    {
      ok: false,
      error: {
        code,
        message: options.message ?? errorMessage(code),
        ...(options.details === undefined ? {} : { details: options.details }),
      },
      ...(options.requestId ? { requestId: options.requestId } : {}),
    },
    { status, headers },
  );
}

export function apiJson(payload: unknown, init: ResponseInit = {}) {
  const headers = applySecurityHeaders(new Headers(init.headers));
  if (!headers.has("cache-control")) headers.set("cache-control", "no-store");
  return NextResponse.json(payload, { ...init, headers });
}

export function withApiHeaders(response: Response) {
  applySecurityHeaders(response.headers);
  return response;
}

async function getCloudflareRateLimitBinding(
  definition: ApiRouteDefinition,
): Promise<RateLimitBinding | null> {
  const bindingName = definition.rateLimit?.binding;
  if (!bindingName) return null;

  try {
    const { env } = getCloudflareContext();
    const binding = (env as unknown as Record<string, unknown>)[bindingName];
    if (binding && typeof (binding as RateLimitBinding).limit === "function") {
      return binding as RateLimitBinding;
    }
  } catch {
    return null;
  }

  return null;
}

async function isCloudflareRateLimited(
  definition: ApiRouteDefinition,
  request: Request,
) {
  const binding = await getCloudflareRateLimitBinding(definition);
  if (!binding || !definition.rateLimit) return false;

  const key = `${definition.rateLimit.scope}:${getClientIp(request)}`;
  try {
    const result = await binding.limit({ key });
    return result.success === false;
  } catch {
    return false;
  }
}

async function enforceRateLimit(
  definition: ApiRouteDefinition,
  request: Request,
) {
  const limit = definition.rateLimit;
  if (!limit) return false;

  if (await isCloudflareRateLimited(definition, request)) return true;

  return isRateLimited({
    request,
    scope: limit.scope,
    limit: limit.limit,
    windowMs: limit.windowMs,
  });
}

export function getApiRequestId(request: Request) {
  return getRequestId(request);
}

export async function enforceApiRateLimit(
  definition: ApiRouteDefinition,
  request: Request,
) {
  return enforceRateLimit(definition, request);
}

async function parseRequest(
  definition: ApiRouteDefinition,
  request: Request,
  routeContext?: NextRouteContext,
) {
  const params = routeContext?.params ? await routeContext.params : {};
  const parsedParams = definition.paramsSchema
    ? definition.paramsSchema.parse(params)
    : params;
  const parsedQuery = definition.querySchema
    ? definition.querySchema.parse(getQueryObject(request))
    : {};

  let parsedBody: unknown = undefined;
  let rawBody: string | undefined = undefined;
  if (definition.bodySchema || definition.requiresJsonBody) {
    rawBody = definition.bodyLimitBytes
      ? await readRequestTextWithinLimit(request, definition.bodyLimitBytes)
      : await request.text();
    if (definition.bodySchema) {
      parsedBody = definition.bodySchema.parse(JSON.parse(rawBody));
    }
  }

  return {
    params: parsedParams,
    query: parsedQuery,
    body: parsedBody,
    rawBody,
  };
}

export function createApiHandler<TDefinition extends ApiRouteDefinition>(
  routeId: ApiRouteId,
  handler: (context: ParsedApiContext<TDefinition>) => Promise<Response>,
) {
  const route = getApiRouteDefinition(routeId) as TDefinition;

  return async (request: Request, context?: NextRouteContext) => {
    const requestId = getRequestId(request);

    if (route.originCheck && !isAllowedOrigin(request)) {
      logApiWarn(request, `${route.id}.forbidden_origin`);
      return apiError("forbidden_origin", 403, { requestId });
    }

    if (
      (route.bodySchema || route.requiresJsonBody) &&
      !hasJsonContentType(request)
    ) {
      logApiWarn(request, `${route.id}.invalid_content_type`);
      return apiError("invalid_content_type", 415, { requestId });
    }

    if (await enforceRateLimit(route, request)) {
      logApiWarn(request, `${route.id}.rate_limited`);
      return apiError("rate_limited", 429, { requestId });
    }

    let parsed: Awaited<ReturnType<typeof parseRequest>>;
    try {
      parsed = await parseRequest(route, request, context);
    } catch (error) {
      if (error instanceof BodyTooLargeError) {
        logApiWarn(request, `${route.id}.payload_too_large`);
        return apiError("payload_too_large", 413, { requestId });
      }
      if (error instanceof SyntaxError) {
        logApiWarn(request, `${route.id}.invalid_json`);
        return apiError("invalid_json", 400, { requestId });
      }
      if (error instanceof ZodError) {
        logApiWarn(request, `${route.id}.invalid_payload`, {
          issues: normalizeZodIssues(error),
        });
        return apiError("invalid_payload", 400, {
          requestId,
          details: normalizeZodIssues(error),
        });
      }
      throw error;
    }

    try {
      const response = await handler({
        request,
        requestId,
        route,
        ...parsed,
      });
      return withApiHeaders(response);
    } catch (error) {
      logApiError(request, `${route.id}.unhandled_error`, {
        error: error instanceof Error ? error.message : "unknown",
      });
      return apiError("internal_error", 500, { requestId });
    }
  };
}

export type InferApiBody<T extends z.ZodTypeAny> = z.infer<T>;
export type InferApiQuery<T extends z.ZodTypeAny> = z.infer<T>;
export type InferApiParams<T extends z.ZodTypeAny> = z.infer<T>;
