import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { repoRoot } from "./helpers/registry-fixtures";

const apiRoutes = [
  "/api/registry/manifest",
  "/api/registry/categories",
  "/api/registry/search",
  "/api/registry/feed",
  "/api/registry/diff",
  "/api/registry/entries/{category}/{slug}",
  "/api/registry/entries/{category}/{slug}/llms",
  "/api/votes/query",
  "/api/votes/toggle",
  "/api/newsletter/subscribe",
  "/api/newsletter/webhook",
  "/api/og",
  "/api/submissions",
  "/api/download",
  "/api/listing-leads",
  "/api/admin/listing-leads",
  "/api/intent-events",
  "/api/community-signals",
  "/api/github-stats",
  "/data/feeds/index.json",
  "/data/feeds/categories/{category}.json",
  "/data/feeds/platforms/{platform}.json",
];

describe("OpenAPI route coverage", () => {
  const schema = fs.readFileSync(
    path.join(repoRoot, "cloudflare/api-schema-heyclaude-openapi.yaml"),
    "utf8",
  );

  it("documents every public and limited dynamic API route", () => {
    for (const route of apiRoutes) {
      expect(schema, route).toContain(`${route}:`);
    }
  });

  it("keeps registry publishing out of the public API", () => {
    expect(schema).not.toContain("/api/registry/publish:");
    expect(schema).not.toContain("/api/submissions/import:");
    expect(schema).toContain("Token-protected lead review/export endpoint");
  });

  it("documents D1-backed failure modes for dynamic-state endpoints", () => {
    expect(schema).toContain("Site DB not configured");
    expect(schema).toContain("D1 insert failed");
    expect(schema).toContain("status transition");
  });

  it("documents platform-aware search and social preview generation", () => {
    expect(schema).toContain("name: platform");
    expect(schema).toContain("/api/og:");
    expect(schema).toContain("image/png");
    expect(schema).toContain("category and platform shards");
  });
});
