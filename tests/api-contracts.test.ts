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
  "/api/listing-leads",
  "/api/admin/listing-leads",
  "/api/intent-events",
  "/api/community-signals",
];

describe("OpenAPI route coverage", () => {
  const schema = fs.readFileSync(
    path.join(repoRoot, "cloudflare/api-schema-heyclaude-openapi.yaml"),
    "utf8",
  );

  it("documents every public registry and lead route", () => {
    for (const route of apiRoutes) {
      expect(schema, route).toContain(`${route}:`);
    }
  });

  it("documents D1-backed failure modes for dynamic-state endpoints", () => {
    expect(schema).toContain("Site DB not configured");
    expect(schema).toContain("D1 insert failed");
    expect(schema).toContain("status transition");
  });
});
