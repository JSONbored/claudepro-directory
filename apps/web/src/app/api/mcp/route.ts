import { readFile } from "node:fs/promises";
import path from "node:path";

import { createHeyClaudeMcpServer } from "@heyclaude/mcp/server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { getCloudflareContext } from "@opennextjs/cloudflare";

import { getApiRouteDefinition } from "@/lib/api/contracts";
import {
  apiError,
  enforceApiRateLimit,
  getApiRequestId,
} from "@/lib/api/router";
import {
  BodyTooLargeError,
  hasJsonContentType,
  isAllowedOrigin,
  readRequestTextWithinLimit,
} from "@/lib/api-security";
import { logApiError, logApiWarn } from "@/lib/api-logs";
import { applySecurityHeaders } from "@/lib/security-headers";

const route = getApiRouteDefinition("mcp.streamable");
const DATA_ORIGIN = "https://heyclau.de";

const mcpCorsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
  "access-control-allow-headers":
    "content-type, accept, mcp-session-id, mcp-protocol-version, mcp-method, mcp-name, last-event-id",
  "access-control-expose-headers": "mcp-session-id, mcp-protocol-version",
};

function localDataFilePaths(fileName: string) {
  return [
    path.join(process.cwd(), "public", "data", fileName),
    path.join(process.cwd(), "apps", "web", "public", "data", fileName),
  ].filter((filePath, index, paths) => paths.indexOf(filePath) === index);
}

async function readLocalDataFile(fileName: string) {
  let lastError: unknown = null;
  for (const filePath of localDataFilePaths(fileName)) {
    try {
      return await readFile(filePath, "utf8");
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error(`Local data artifact not found: ${fileName}`);
}

async function loadMcpTextArtifact(fileName: string) {
  try {
    return await readLocalDataFile(fileName);
  } catch {
    const { env } = getCloudflareContext();
    const envRecord = env as unknown as {
      ASSETS: {
        fetch: (
          input: RequestInfo | URL,
          init?: RequestInit,
        ) => Promise<Response>;
      };
    };
    const response = await envRecord.ASSETS.fetch(
      new Request(`${DATA_ORIGIN}/data/${fileName}`),
    );
    if (!response.ok) {
      throw new Error(`Failed to load ${fileName} asset (${response.status})`);
    }
    return response.text();
  }
}

async function loadMcpJsonArtifact<T>(fileName: string) {
  return JSON.parse(await loadMcpTextArtifact(fileName)) as T;
}

function applyMcpHeaders(response: Response) {
  const headers = applySecurityHeaders(new Headers(response.headers));
  for (const [key, value] of Object.entries(mcpCorsHeaders)) {
    headers.set(key, value);
  }
  headers.set("cache-control", "no-store");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function mcpError(
  request: Request,
  code: string,
  status: number,
  requestId: string,
  message?: string,
) {
  logApiWarn(request, `${route.id}.${code}`);
  return applyMcpHeaders(apiError(code, status, { requestId, message }));
}

async function validateMcpRequest(request: Request) {
  const requestId = getApiRequestId(request);

  if (route.originCheck && !isAllowedOrigin(request)) {
    return mcpError(request, "forbidden_origin", 403, requestId);
  }

  if (request.method === "POST" && !hasJsonContentType(request)) {
    return mcpError(request, "invalid_content_type", 415, requestId);
  }

  let checkedRequest = request;
  if (request.method === "POST" && route.bodyLimitBytes) {
    try {
      const body = await readRequestTextWithinLimit(
        request,
        route.bodyLimitBytes,
      );
      checkedRequest = new Request(request.url, {
        method: request.method,
        headers: request.headers,
        body,
      });
    } catch (error) {
      if (error instanceof BodyTooLargeError) {
        return mcpError(request, "payload_too_large", 413, requestId);
      }
      throw error;
    }
  }

  if (await enforceApiRateLimit(route, request)) {
    return mcpError(request, "rate_limited", 429, requestId);
  }

  return { request: checkedRequest };
}

async function handleMcpRequest(request: Request) {
  const validationResult = await validateMcpRequest(request);
  if (validationResult instanceof Response) return validationResult;
  const checkedRequest = validationResult.request;

  try {
    const host = new URL(checkedRequest.url).host;
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
      enableDnsRebindingProtection: true,
      allowedHosts: [host],
    });
    const server = createHeyClaudeMcpServer({
      readJsonArtifact: loadMcpJsonArtifact,
      readTextArtifact: loadMcpTextArtifact,
    });

    await server.connect(transport);
    return applyMcpHeaders(await transport.handleRequest(checkedRequest));
  } catch (error) {
    logApiError(request, `${route.id}.unhandled_error`, {
      error: error instanceof Error ? error.message : "unknown",
    });
    return applyMcpHeaders(
      apiError("internal_error", 500, {
        requestId: getApiRequestId(request),
      }),
    );
  }
}

export function OPTIONS(request: Request) {
  if (route.originCheck && !isAllowedOrigin(request)) {
    return mcpError(request, "forbidden_origin", 403, getApiRequestId(request));
  }
  return applyMcpHeaders(new Response(null, { status: 204 }));
}

export async function GET(request: Request) {
  return handleMcpRequest(request);
}

export async function POST(request: Request) {
  return handleMcpRequest(request);
}

export async function DELETE(request: Request) {
  return handleMcpRequest(request);
}
