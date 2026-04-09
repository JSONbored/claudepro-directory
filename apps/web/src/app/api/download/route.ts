import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

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
      ASSETS: { fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> };
    };
    const response = await envRecord.ASSETS.fetch(new Request(new URL(asset, requestUrl)));
    if (!response.ok) {
      throw new Error(`asset_not_found:${response.status}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const asset = url.searchParams.get("asset") ?? "";

  if (!isAllowedAssetPath(asset)) {
    return NextResponse.json({ error: "invalid_asset" }, { status: 400 });
  }

  const filename = path.basename(asset);

  try {
    const body = await readAssetBuffer(asset, request.url);
    return new NextResponse(body, {
      status: 200,
      headers: {
        "content-type": getContentType(asset),
        "content-disposition": `attachment; filename="${filename}"`,
        "cache-control": "public, max-age=31536000, immutable",
        "x-content-type-options": "nosniff"
      }
    });
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}
