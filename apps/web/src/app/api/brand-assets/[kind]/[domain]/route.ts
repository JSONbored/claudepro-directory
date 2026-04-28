import { normalizeBrandDomain } from "@heyclaude/registry";

import { brandAssetParamsSchema } from "@/lib/api/contracts";
import {
  apiError,
  createApiHandler,
  type InferApiParams,
} from "@/lib/api/router";
import { applySecurityHeaders } from "@/lib/security-headers";

const CACHE_CONTROL = "public, max-age=86400, stale-while-revalidate=604800";

function brandfetchClientId() {
  return (
    process.env.BRANDFETCH_CLIENT_ID ||
    process.env.NEXT_PUBLIC_BRANDFETCH_CLIENT_ID ||
    ""
  ).trim();
}

type BrandSearchResult = {
  icon?: string | null;
  domain?: string | null;
  name?: string | null;
};

async function resolveBrandIconUrl(domain: string, clientId: string) {
  const searchUrl = new URL(
    `https://api.brandfetch.io/v2/search/${encodeURIComponent(domain)}`,
  );
  searchUrl.searchParams.set("c", clientId);

  const searchResponse = await fetch(searchUrl, {
    headers: { accept: "application/json" },
  });
  if (!searchResponse.ok) return "";

  const results = (await searchResponse.json()) as BrandSearchResult[];
  if (!Array.isArray(results)) return "";

  const exact =
    results.find((result) => normalizeBrandDomain(result.domain) === domain) ||
    results[0];
  return typeof exact?.icon === "string" ? exact.icon : "";
}

export const GET = createApiHandler(
  "brandAsset.read",
  async ({ params, requestId }) => {
    const { domain } = params as InferApiParams<typeof brandAssetParamsSchema>;
    const normalizedDomain = normalizeBrandDomain(domain);
    const clientId = brandfetchClientId();

    if (!normalizedDomain) {
      return apiError("invalid_brand_domain", 400, { requestId });
    }
    if (!clientId) {
      return apiError("brand_asset_not_configured", 503, { requestId });
    }

    const upstreamUrl = await resolveBrandIconUrl(normalizedDomain, clientId);
    if (!upstreamUrl) {
      return apiError("brand_asset_not_found", 404, { requestId });
    }

    const upstream = await fetch(upstreamUrl, {
      headers: {
        accept: "image/avif,image/webp,image/png,image/svg+xml,image/*;q=0.8",
      },
    });

    if (!upstream.ok) {
      return apiError("brand_asset_not_found", 404, { requestId });
    }

    const contentType = upstream.headers.get("content-type") || "image/png";
    if (!contentType.toLowerCase().startsWith("image/")) {
      return apiError("brand_asset_invalid", 502, { requestId });
    }

    const headers = applySecurityHeaders(new Headers());
    headers.set("cache-control", CACHE_CONTROL);
    headers.set("content-type", contentType);
    headers.set("x-brand-asset-source", "brandfetch");

    return new Response(await upstream.arrayBuffer(), {
      status: 200,
      headers,
    });
  },
);
