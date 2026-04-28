import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

import { listApiRouteDefinitions } from "../apps/web/src/lib/api/contracts";
import { repoRoot } from "./helpers/registry-fixtures";

function findRouteFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return findRouteFiles(entryPath);
    return /route\.tsx?$/.test(entry.name) ? [entryPath] : [];
  });
}

const apiRoutes = [
  "/api/registry/manifest",
  "/api/registry/categories",
  "/api/registry/search",
  "/api/registry/feed",
  "/api/registry/diff",
  "/api/registry/entries/{category}/{slug}",
  "/api/registry/entries/{category}/{slug}/llms",
  "/api/brand-assets/{kind}/{domain}",
  "/api/votes/query",
  "/api/votes/toggle",
  "/api/newsletter/subscribe",
  "/api/newsletter/webhook",
  "/api/og",
  "/api/submissions",
  "/api/download",
  "/api/jobs",
  "/api/listing-leads",
  "/api/admin/listing-leads",
  "/api/admin/jobs",
  "/api/admin/jobs/health",
  "/api/intent-events",
  "/api/community-signals",
  "/api/github-stats",
  "/feed.xml",
  "/atom.xml",
  "/data/feeds/index.json",
  "/data/feeds/categories/{category}.json",
  "/data/feeds/platforms/{platform}.json",
];

describe("OpenAPI route coverage", () => {
  const schema = fs.readFileSync(
    path.join(repoRoot, "cloudflare/api-schema-heyclaude-openapi.yaml"),
    "utf8",
  );
  const parsedSchema = parse(schema) as {
    paths: Record<
      string,
      {
        get?: {
          description?: string;
          parameters?: Array<{ name?: string; in?: string }>;
          responses?: Record<string, { content?: Record<string, unknown> }>;
        };
        post?: unknown;
        patch?: unknown;
      }
    >;
  };

  it("documents every public and limited dynamic API route", () => {
    for (const route of apiRoutes) {
      expect(schema, route).toContain(`${route}:`);
    }

    expect(
      [...new Set(listApiRouteDefinitions().map((route) => route.path))].sort(),
    ).toEqual(apiRoutes.toSorted());
  });

  it("keeps route handlers as central-router adapters", () => {
    const routeFiles = findRouteFiles(
      path.join(repoRoot, "apps/web/src/app/api"),
    );

    expect(routeFiles.length).toBeGreaterThan(0);
    for (const filePath of routeFiles) {
      const source = fs.readFileSync(filePath, "utf8");
      expect(source, filePath).toContain("createApiHandler");
      expect(source, filePath).not.toContain("NextResponse");
      expect(source, filePath).not.toContain("isAllowedOrigin");
      expect(source, filePath).not.toContain("hasBodyWithinLimit");
      expect(source, filePath).not.toContain("isRateLimited");
    }
  });

  it("keeps registry publishing out of the public API", () => {
    expect(schema).not.toContain("/api/registry/publish:");
    expect(schema).not.toContain("/api/submissions/import:");
    expect(schema).toContain("Token-protected lead review/export endpoint");
    expect(schema).toContain("Token-protected reviewed jobs list");
  });

  it("documents D1-backed failure modes for dynamic-state endpoints", () => {
    expect(schema).toContain("Site DB not configured");
    expect(schema).toContain("D1 insert failed");
    expect(schema).toContain("status transition");
  });

  it("documents platform-aware search and social preview generation", () => {
    expect(parsedSchema.paths["/api/registry/search"]?.get?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "platform", in: "query" }),
      ]),
    );
    expect(
      parsedSchema.paths["/api/registry/feed"]?.get?.description,
    ).toContain("category and platform shards");
    expect(
      parsedSchema.paths["/api/og"]?.get?.responses?.["200"]?.content,
    ).toHaveProperty("image/png");
    expect(
      parsedSchema.paths["/feed.xml"]?.get?.responses?.["200"]?.content,
    ).toHaveProperty("application/rss+xml");
    expect(
      parsedSchema.paths["/atom.xml"]?.get?.responses?.["200"]?.content,
    ).toHaveProperty("application/atom+xml");
  });

  it("documents error envelopes, cacheable feeds, and registry trust signals", () => {
    expect(schema).toContain("ErrorEnvelope:");
    expect(schema).toContain("RegistryTrustSignals:");
    expect(schema).toContain("trustSignals");
    expect(schema).toContain("packageChecksum");
    expect(schema).toContain("lastVerifiedAt");
    expect(schema).toContain("adapterGenerated");
    expect(schema).toContain("RSS, changelog, category feeds, platform feeds");
  });
});
