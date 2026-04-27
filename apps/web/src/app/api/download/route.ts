import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { isRateLimited } from "@/lib/api-security";
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

export async function GET(request: Request) {
  if (
    isRateLimited({
      request,
      scope: "asset-download",
      limit: 180,
      windowMs: 60_000,
    })
  ) {
    logApiWarn(request, "download.rate_limited");
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const url = new URL(request.url);
  const asset = url.searchParams.get("asset") ?? "";

  if (asset.length > 256) {
    logApiWarn(request, "download.invalid_asset_length");
    return NextResponse.json({ error: "invalid_asset" }, { status: 400 });
  }

  if (!isAllowedAssetPath(asset)) {
    logApiWarn(request, "download.invalid_asset_pattern");
    return NextResponse.json({ error: "invalid_asset" }, { status: 400 });
  }

  const filename = path.basename(asset);

  try {
    const body = await readAssetBuffer(asset, request.url);
    if (sample(0.02)) {
      logApiInfo(request, "download.sample", { asset });
    }
    return new NextResponse(body, {
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
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}
