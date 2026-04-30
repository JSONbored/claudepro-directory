import { readFile } from "node:fs/promises";
import path from "node:path";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { downloadQuerySchema } from "@/lib/api/contracts";
import {
  apiError,
  createApiHandler,
  type InferApiQuery,
} from "@/lib/api/router";
import { logApiError, logApiInfo, logApiWarn, sample } from "@/lib/api-logs";

function isAllowedAssetPath(asset: string) {
  const normalized = String(asset || "").trim();
  return (
    /^\/downloads\/skills\/[a-z0-9-]+\.zip$/.test(normalized) ||
    /^\/downloads\/mcp\/[a-z0-9-]+\.mcpb$/.test(normalized)
  );
}

function getContentType(asset: string) {
  if (asset.endsWith(".zip")) return "application/zip";
  if (asset.endsWith(".mcpb")) return "application/octet-stream";
  return "application/octet-stream";
}

async function readAssetBuffer(asset: string, requestUrl: string) {
  try {
    const relativeAssetPath = asset.replace(/^\/+/, "");
    const filePath = path.join(process.cwd(), "public", relativeAssetPath);
    return await readFile(filePath);
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
      new Request(new URL(asset, requestUrl)),
    );
    if (!response.ok) {
      throw new Error(`asset_not_found:${response.status}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }
}

export const GET = createApiHandler(
  "download",
  async ({ request, query, requestId }) => {
    const { asset } = query as InferApiQuery<typeof downloadQuerySchema>;

    if (asset.length > 256) {
      logApiWarn(request, "download.invalid_asset_length");
      return apiError("invalid_asset", 400, { requestId });
    }

    if (!isAllowedAssetPath(asset)) {
      logApiWarn(request, "download.invalid_asset_pattern");
      return apiError("invalid_asset", 400, { requestId });
    }

    const filename = path.basename(asset);

    try {
      const body = await readAssetBuffer(asset, request.url);
      if (sample(0.02)) {
        logApiInfo(request, "download.sample", { asset });
      }
      return new Response(body, {
        status: 200,
        headers: {
          "content-type": getContentType(asset),
          "content-disposition": `attachment; filename="${filename}"`,
          "cache-control": "public, max-age=31536000, immutable",
          "x-content-type-options": "nosniff",
        },
      });
    } catch {
      logApiError(request, "download.not_found", { asset });
      return apiError("not_found", 404, { requestId });
    }
  },
);
