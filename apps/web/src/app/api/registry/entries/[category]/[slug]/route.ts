import { NextResponse } from "next/server";

import { isAllowedOrigin, isRateLimited } from "@/lib/api-security";
import { logApiWarn } from "@/lib/api-logs";
import { getEntry, isSafeContentPathPart } from "@/lib/content";

type EntryApiRouteProps = {
  params: Promise<{ category: string; slug: string }>;
};

export async function GET(request: Request, { params }: EntryApiRouteProps) {
  if (!isAllowedOrigin(request)) {
    logApiWarn(request, "registry.entry.forbidden_origin");
    return NextResponse.json({ error: "forbidden_origin" }, { status: 403 });
  }

  if (
    isRateLimited({
      request,
      scope: "registry-entry",
      limit: 180,
      windowMs: 60_000,
    })
  ) {
    logApiWarn(request, "registry.entry.rate_limited");
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const { category, slug } = await params;
  if (!isSafeContentPathPart(category) || !isSafeContentPathPart(slug)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const entry = await getEntry(category, slug);
  if (!entry) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      schemaVersion: 1,
      key: `${category}:${slug}`,
      entry,
    },
    {
      headers: {
        "cache-control": "public, max-age=300, stale-while-revalidate=3600",
      },
    },
  );
}
