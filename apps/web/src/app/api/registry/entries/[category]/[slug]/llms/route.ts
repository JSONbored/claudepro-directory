import { NextResponse } from "next/server";

import { isAllowedOrigin, isRateLimited } from "@/lib/api-security";
import { logApiWarn } from "@/lib/api-logs";
import { getEntryLlmsText, isSafeContentPathPart } from "@/lib/content";

type EntryLlmsApiRouteProps = {
  params: Promise<{ category: string; slug: string }>;
};

export async function GET(
  request: Request,
  { params }: EntryLlmsApiRouteProps,
) {
  if (!isAllowedOrigin(request)) {
    logApiWarn(request, "registry.entry_llms.forbidden_origin");
    return NextResponse.json({ error: "forbidden_origin" }, { status: 403 });
  }

  if (
    isRateLimited({
      request,
      scope: "registry-entry-llms",
      limit: 180,
      windowMs: 60_000,
    })
  ) {
    logApiWarn(request, "registry.entry_llms.rate_limited");
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const { category, slug } = await params;
  if (!isSafeContentPathPart(category) || !isSafeContentPathPart(slug)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const text = await getEntryLlmsText(category, slug);
  if (!text) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return new Response(text, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=300, stale-while-revalidate=3600",
    },
  });
}
